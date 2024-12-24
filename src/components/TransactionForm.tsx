import { Buffer } from 'buffer';
import { useState, useEffect, useCallback } from 'react';
import {
  MsgMultiSend,
  TxRaw,
  BaseAccount,
  TxRestApi,
  ChainRestAuthApi,
  ChainGrpcBankApi,
  createTransaction,
  CosmosTxV1Beta1Tx,
  ChainRestTendermintApi,
  getTxRawFromTxRawOrDirectSignResponse,
} from "@injectivelabs/sdk-ts";
import { DEFAULT_BLOCK_TIMEOUT_HEIGHT, BigNumberInBase, BigNumberInWei } from "@injectivelabs/utils";
import { TransactionException } from "@injectivelabs/exceptions";
import { SignDoc } from "@keplr-wallet/types";
import Papa from 'papaparse';


const isTestnet = false; // Toggle between Testnet and Mainnet
const chainId = isTestnet ? 'injective-888' : 'injective-1';
const sentryEndpoint = isTestnet 
  ? 'https://testnet.sentry.lcd.injective.network:443'
  : 'https://sentry.lcd.injective.network:443';

const grpcWebEndpoint = isTestnet 
  ? 'https://testnet.sentry.chain.grpc-web.injective.network:443'
  : 'https://sentry.chain.grpc-web.injective.network:443';
  

const getKeplr = async (chainId: string) => {
  await window.keplr.enable(chainId);
  const offlineSigner = window.keplr.getOfflineSigner(chainId);
  const accounts = await offlineSigner.getAccounts();
  const key = await window.keplr.getKey(chainId);
  return { offlineSigner, accounts, key };
};

const broadcastTx = async (chainId: string, txRaw: TxRaw) => {
  const result = await window.keplr.sendTx(
    chainId,
    CosmosTxV1Beta1Tx.TxRaw.encode(txRaw).finish(),
    "sync"
  );

  if (!result || result.length === 0) {
    throw new TransactionException(
      new Error("Transaction failed to be broadcasted"),
      { contextModule: "Keplr" }
    );
  }

  return Buffer.from(result).toString("hex");
};

const fetchBalances = async (injectiveAddress: string) => {
  try {
    const chainGrpcBankApi = new ChainGrpcBankApi(grpcWebEndpoint);
    const response = await chainGrpcBankApi.fetchBalances(injectiveAddress);
    const balanceMap: Map<string, string> = new Map();

    // Conversion of balance to human-readable format
    response.balances.forEach(({ denom, amount }) => {
      const decimals = denom.startsWith('peggy') || denom === 'inj' ? 18 : 6;
      const humanReadableBalance = (parseFloat(amount) / Math.pow(10, decimals)).toFixed(6);
      balanceMap.set(denom, humanReadableBalance);
    });

    console.log('Fetched balances:', balanceMap);
    return balanceMap;
  } catch (error) {
    console.error('Error fetching balances:', error);
    return null;
  }
};

type CsvRow = [string, string];

const TransactionForm = () => {
  const [selectedDenom, setSelectedDenom] = useState<string>("");
  const [csvData, setCsvData] = useState<CsvRow[]>([]); 
  const [status, setStatus] = useState<string>("");
  const [balances, setBalances] = useState<Map<string, string> | null>(null);
  const [injectiveAddress, setInjectiveAddress] = useState<string | null>(null);

  const initializeKeplr = useCallback(async () => {
    try {
      const { key } = await getKeplr(chainId);
      setInjectiveAddress(key.bech32Address);
    } catch (error) {
      console.error('Error initializing Keplr:', error);
    }
  }, []);

  useEffect(() => {
    if (injectiveAddress) {
      fetchBalances(injectiveAddress).then(setBalances);
    }
  }, [injectiveAddress]);

  useEffect(() => {
    initializeKeplr();
  }, [initializeKeplr]);

  const handleCsvUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      Papa.parse<CsvRow>(file, {
        header: false,
        skipEmptyLines: true,
        complete: function (results) {
          setCsvData(results.data);
          console.log("CSV Data:", results.data);
        }
      });
    }
  };

  const validateCsv = () => {
    if (!csvData || csvData.length === 0) {
      setStatus("CSV file is empty or not properly formatted.");
      return false;
    }

    for (const [address, amount] of csvData) {
      if (!address || !amount || isNaN(parseFloat(amount))) {
        setStatus("CSV contains invalid address or amount.");
        return false;
      }
    }

    const totalAmount = csvData.reduce((acc, [, amount]) => acc + parseFloat(amount), 0);
    const userBalance = balances?.get(selectedDenom) || "0";

    if (parseFloat(userBalance) < totalAmount) {
      setStatus("Total amount in CSV exceeds your balance.");
      return false;
    }

    return true;
  };

  const handleSend = async () => {
    if (!selectedDenom || csvData.length === 0) {
      setStatus("Token selection and CSV file are required.");
      return;
    }

    if (!validateCsv()) return;

    try {
      if (!injectiveAddress) {
        setStatus("Wallet not connected.");
        return;
      }

      const { key, offlineSigner } = await getKeplr(chainId);
      const pubKey = Buffer.from(key.pubKey).toString("base64");

      const chainRestAuthApi = new ChainRestAuthApi(sentryEndpoint);
      const accountDetailsResponse = await chainRestAuthApi.fetchAccount(injectiveAddress);
      const baseAccount = BaseAccount.fromRestApi(accountDetailsResponse);

      const chainRestTendermintApi = new ChainRestTendermintApi(sentryEndpoint);
      const latestBlock = await chainRestTendermintApi.fetchLatestBlock();
      const latestHeight = latestBlock.header.height;
      const timeoutHeight = new BigNumberInBase(latestHeight).plus(DEFAULT_BLOCK_TIMEOUT_HEIGHT);

      const totalToSend = csvData.reduce((acc, [, amount]) => {
        return acc.plus(new BigNumberInBase(amount).toWei(18));
      }, new BigNumberInWei(0));

      const msg = MsgMultiSend.fromJSON({
        inputs: [
          {
            address: injectiveAddress,
            coins: [
              {
                denom: selectedDenom,
                amount: totalToSend.toFixed(),
              },
            ],
          },
        ],
        outputs: csvData.map(([address, amount]) => {
          return {
            address,
            coins: [
              {
                amount: new BigNumberInBase(amount).toWei(18).toFixed(),
                denom: selectedDenom,
              },
            ],
          };
        }),
      });

      const { signDoc } = createTransaction({
        pubKey,
        chainId,
        fee: {
          amount: [{ denom: "inj", amount: "5000000000000000" }], // adjust amount as needed
          gas: "50000000", // increase gas here
        }, //getStdFee({}),
        message: msg,
        sequence: Number(baseAccount.sequence),
        timeoutHeight: timeoutHeight.toNumber(),
        accountNumber: Number(baseAccount.accountNumber),
      });

      const directSignResponse = await offlineSigner.signDirect(
        injectiveAddress,
        signDoc as unknown as SignDoc
      );

      const txRaw = getTxRawFromTxRawOrDirectSignResponse(directSignResponse);
      const txHash = await broadcastTx(chainId, txRaw);
      const response = await new TxRestApi(sentryEndpoint).fetchTxPoll(txHash);

      setStatus(`Transaction successful: ${response.txHash}`);
    } catch (error) {
      console.error('Transaction error:', error);
      setStatus("Transaction failed.");
    }
  };

  const connectWalletHandler = async () => {
    try {
      const { key } = await getKeplr(chainId);
      setInjectiveAddress(key.bech32Address);
    } catch (error) {
      console.error('Wallet connection failed:', error);
      setStatus("Wallet connection failed.");
    }
  };

  const disconnectWalletHandler = () => {
    setInjectiveAddress(null);
    setBalances(null);
    setCsvData([]);
    setStatus("Reconnect Wallet");
  };

  const truncateAddress = (address: string) => {
    if (address.length <= 6) return address;
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  const handleSelectChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedDenom(event.target.value);
  };

  return (
    <div className="h-screen flex justify-center items-center bg-gradient-to-r from-blue-950 to-purple-900">
      <div className="bg-gray-50 p-10 rounded-lg shadow-lg w-full max-w-md text-center">
        {injectiveAddress ? (
          <>
            <button
              onClick={disconnectWalletHandler}
              className="bg-red-500 text-white py-2 px-4 rounded-lg hover:bg-red-600"
            >
              Disconnect Wallet
            </button>
            <h3 className="mt-5 text-lg font-medium">Wallet Address:</h3>
            <p className="mt-2 text-gray-700">{truncateAddress(injectiveAddress)}</p>
          </>
        ) : (
          <button
            onClick={connectWalletHandler}
            className="bg-green-500 text-white py-2 px-4 rounded-lg hover:bg-green-600"
          >
            Connect Wallet
          </button>
        )}

        <div className="mt-5">
          <label htmlFor="token" className="block mb-2 font-medium">
            Select Token:
          </label>
          <select
            id="token"
            onChange={handleSelectChange}
            value={selectedDenom}
            className="w-full p-2 border rounded-lg"
          >
            <option value="">Select Token</option>
            {balances &&
              Array.from(balances.keys()).map((denom) => (
                <option key={denom} value={denom}>
                  {denom}
                </option>
              ))}
          </select>
        </div>

        <div className="mt-5">
          <label htmlFor="csv" className="block mb-2 font-medium">
            Upload CSV:
          </label>
          <input
            id="csv"
            type="file"
            accept=".csv"
            onChange={handleCsvUpload}
            className="w-full p-2 border rounded-lg"
          />
        </div>

        <button
          onClick={handleSend}
          className="bg-blue-500 text-white py-2 px-4 mt-5 rounded-lg hover:bg-blue-600"
        >
          Send
        </button>

        {status && <p className="mt-5 text-red-500">{status}</p>}
      </div>
    </div>
  );
};

export default TransactionForm;
