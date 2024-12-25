import React, { useState, useEffect, useCallback } from 'react';
import Papa from 'papaparse';
import { Buffer } from 'buffer';
import { MsgMultiSend, TxRestApi, BaseAccount, createTransaction, getTxRawFromTxRawOrDirectSignResponse, ChainRestAuthApi, ChainRestTendermintApi } from '@injectivelabs/sdk-ts';
import { getKeplr, broadcastTx, fetchBalances } from '../utils/keplrUtils';
import { useNetwork } from '../contexts/NetworkContext';
import { DEFAULT_BLOCK_TIMEOUT_HEIGHT, BigNumberInBase, BigNumberInWei } from "@injectivelabs/utils";
import { SignDoc } from "@keplr-wallet/types";
import { getSymbolFromDenom } from '../utils/tokenUtils'; // Import the shared utility
import { AiFillQuestionCircle } from "react-icons/ai";
// import { time } from 'console';

type CsvRow = [string, string];
type NetworkType = "Testnet" | "Mainnet";

type TransactionHash = {
  hash: string;
  network: NetworkType;
  timestamp?: string;
};

const Multisender: React.FC = () => {
  const { isTestnet } = useNetwork();
  const [selectedDenom, setSelectedDenom] = useState<string>('');
  const [csvData, setCsvData] = useState<CsvRow[]>([]);
  const [status, setStatus] = useState<string>('');
  const [balances, setBalances] = useState<Map<string, string> | null>(null);
  const [injectiveAddress, setInjectiveAddress] = useState<string | null>(null);
  const [transactionHashes, setTransactionHashes] = useState<TransactionHash[]>([]);
  const [showStatus, setShowStatus] = useState<boolean>(false);
  const [showGasFeeSection, setShowGasFeeSection] = useState<boolean>(false);
  const [gasFee, setGasFee] = useState<number>(50000000);

  const chainId = isTestnet ? 'injective-888' : 'injective-1';
  const sentryEndpoint = isTestnet
    ? 'https://testnet.sentry.lcd.injective.network:443'
    : 'https://sentry.lcd.injective.network:443';
  const grpcWebEndpoint = isTestnet
    ? 'https://testnet.sentry.chain.grpc-web.injective.network:443'
    : 'https://sentry.chain.grpc-web.injective.network:443';

  const initializeKeplr = useCallback(async () => {
    try {
      const { key } = await getKeplr(chainId);
      setInjectiveAddress(key.bech32Address);
    } catch (error) {
      console.error('Error initializing Keplr:', error);
    }
  }, [chainId]);

  const testnetExplorerUrl = 'https://testnet.explorer.injective.network/transaction/';
  const mainnetExplorerUrl = 'https://explorer.injective.network/transaction/';


  useEffect(() => {
    if (injectiveAddress) {
      fetchBalances(injectiveAddress, grpcWebEndpoint).then(setBalances);

      // Load transaction hashes with network type from local storage
      const storedHashes = localStorage.getItem(`txHashes-${injectiveAddress}`);
      if (storedHashes) {
        setTransactionHashes(JSON.parse(storedHashes));
      }
    }
  }, [injectiveAddress, grpcWebEndpoint]);


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
          console.log('CSV Data:', results.data);
        }
      });
    }
  };

  useEffect(() => {
    if (status) {
      setShowStatus(true);
      const timer = setTimeout(() => {
        setShowStatus(false);
      }, 5000); // 5 seconds

      return () => clearTimeout(timer); // Clean up timer on component unmount
    }
  }, [status]);

  const validateCsv = () => {
    if (!csvData || csvData.length === 0) {
      setStatus('CSV file is empty or not properly formatted.');
      return false;
    }

    for (const [address, amount] of csvData) {
      if (!address || !amount || isNaN(parseFloat(amount))) {
        setStatus('CSV contains invalid address or amount.');
        return false;
      }
    }

    const totalAmount = csvData.reduce((acc, [, amount]) => acc + parseFloat(amount), 0);
    const userBalance = balances?.get(selectedDenom) || '0';

    if (parseFloat(userBalance) < totalAmount) {
      setStatus('Total amount in CSV exceeds your balance.');
      return false;
    }

    return true;
  };

  const handleSend = async () => {
    if (!selectedDenom || csvData.length === 0) {
      setStatus('Token selection and CSV file are required.');
      return;
    }

    if (!validateCsv()) return;

    try {
      if (!injectiveAddress) {
        setStatus('Wallet not connected.');
        return;
      }

      const { key, offlineSigner } = await getKeplr(chainId);
      const pubKey = Buffer.from(key.pubKey).toString('base64');

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


      // const totalToSend = csvData.reduce((acc, [, amount]) => {
      //   return acc.add(ethers.utils.parseUnits(amount.toString(), 18));
      // }, ethers.BigNumber.from(0));



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
          amount: [{ denom: 'inj', amount: gasFee.toString() }],
          gas: '50000000', // Static gas value here
        },
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

      // Save transaction hash to local storage with timestamp
      const timestamp = new Date().toISOString();
      const newTransaction = { hash: response.txHash, network: isTestnet ? 'Testnet' : 'Mainnet', timestamp };

      const existingHashes = JSON.parse(localStorage.getItem(`txHashes-${injectiveAddress}`) || '[]');
      const updatedHashes = [newTransaction, ...existingHashes];
      localStorage.setItem(`txHashes-${injectiveAddress}`, JSON.stringify(updatedHashes));
      setTransactionHashes(updatedHashes);

      setShowGasFeeSection(false);
    } catch (error) {
      console.error('Transaction error:', error);
      setStatus('Transaction failed.');
    }
  };

  const handleSelectChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedDenom(event.target.value);
  };

  const sortedTransactions = [...transactionHashes].sort((a, b) => {
    return new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime();
  });

  return (
    <>
      <div className="px-4 mt-20 h-full">
        {!showGasFeeSection ? (
          <section className='border p-4 rounded-lg'>
            <div>
              <label>
                Select Token:
                <select
                  onChange={handleSelectChange}
                  value={selectedDenom}
                  className="w-full p-2 border rounded-md text-gray-700 text-sm outline-none"
                >
                  <option value="">Select Token</option>
                  {balances &&
                    Array.from(balances.keys()).map((denom) => (
                      <option key={denom} value={denom}>
                        {getSymbolFromDenom(denom, isTestnet) || denom}
                      </option>
                    ))}
                </select>
              </label>
            </div>
            <div className="my-3">
              <label htmlFor="csv" className="block mb-4 font-medium text-gray-700">
                Upload CSV File:
              </label>
              <input
                id="csv"
                type="file"
                accept=".csv"
                onChange={handleCsvUpload}
                className="w-full p-2 border rounded-lg"
              />
            </div>
            <div className="mt-4 flex justify-between">
              <div className="flex justify-center items-center">
                <div className="relative group">
                  <AiFillQuestionCircle className="h-6 w-6 mr-4 text-gray-600 cursor-pointer" />
                  <div className="absolute left-44 -translate-x-1/2 mt-2 w-96 bg-gray-700 text-white text-sm rounded-lg py-2 px-4 hidden group-hover:block transition-opacity duration-300">
                    {`Make sure addresses are exactly as shown: \ninj1y33jq32shhfgy89mawsg3c7savs257elnf254l,1.23\ninj1y33jq32shhfgy89mawsg3c7savs257elnf254l,2.4\ninj1y33jq32shhfgy89mawsg3c7savs257elnf254l,8`}
                  </div>
                </div>
                {status && (
                  <div className={`p-2 border rounded-lg transition-opacity duration-500 ease-in-out ${showStatus ? 'opacity-100' : 'opacity-0'} bg-blue-100 text-blue-500 border-blue-300`}>
                    {status}
                  </div>
                )}
              </div>
              <button
                onClick={() => setShowGasFeeSection(true)}
                className="bg-gradient-to-b from-[#192DAD] to-custom-blue text-white px-6 py-3 rounded-full hover:to-custom-blue"
              >
                Send Tokens
              </button>
            </div>
          </section>
        ) : (
          <section className="section-top bg-[#f0f0ef] w-full rounded-xl">
            <div className='flex flex-col my-5 items-center'>
              <label htmlFor="gasFee" className="block  font-semibold text-xl text-gray-700">
                Adjust gas fee
              </label>
              <div className='flex w-full flex-col items-center my-8'>
                <input
                  id="gasFee"
                  type="range"
                  min={1000000}
                  max={100000000}
                  step={100000}
                  value={gasFee}
                  onChange={(e) => setGasFee(Number(e.target.value))}
                  className="w-[60%] appearance-none h-3 rounded-lg bg-gradient-to-r from-blue-500 to-teal-400 cursor-pointer"
                  style={{
                    backgroundSize: `${((gasFee - 1000000) / (100000000 - 1000000)) * 100}% 100%`,
                    backgroundRepeat: 'no-repeat',
                  }}
                />
                <div className="flex justify-between mt-4 text-sm text-gray-400 w-[60%]">
                  <span>1M</span>
                  <span>2M</span>
                  <span>4M</span>
                  <span>6M</span>
                  <span>8M</span>
                  <span>10M</span>
                </div>
              </div>
              <span className='font-medium text-lg  text-gray-500'>{gasFee * 160000000 / 1e18} INJ</span>
            </div>
            <div className='flex justify-between items-center '>
              <div className="flex justify-center items-center">
                <div className="relative group">
                  <AiFillQuestionCircle className="h-6 icon w-6 mr-4 text-gray-700 cursor-pointer" />
                  <div className="absolute left-44 -translate-x-1/2 mt-2 w-96 bg-gray-700 text-white text-sm rounded-lg py-2 px-4 hidden group-hover:block transition-opacity duration-300">
                    <p>
                      Adjust the slider to set the desired gas fee for your transaction. The selected fee will be applied based on the value shown on the scale. Ensure it meets the network requirements for a smooth transaction. For more details, visit
                      <a href="https://docs.injective.network/learn/basic-concepts/gas_and_fees/" target="_blank" className="text-blue-500"> injective gas fee guide</a>.
                    </p>

                  </div>
                </div>
                {status && (
                  <div className={`p-2 border rounded-lg transition-opacity duration-500 ease-in-out ${showStatus ? 'opacity-100' : 'opacity-0'} bg-blue-100 text-blue-500 border-blue-300`}>
                    {status}
                  </div>
                )}
              </div>
              <div>
                <button
                  onClick={() => setShowGasFeeSection(false)}
                  className="border-2 border-gray-400 text-gray-400 py-1.5 px-4 rounded-full hover:border-gray-500 hover:text-gray-500"
                >
                  Back
                </button>
                <button
                  onClick={handleSend}
                  className="ml-4 bg-gradient-to-r from-blue-500 to-teal-400 text-white py-2 px-4 rounded-full hover:from-blue-600 hover:to-teal-500"
                >
                  Confirm Transaction
                </button>
              </div>
            </div>
          </section>
        )}

        {/* Transaction Hashes Display */}
        <div className='mt-4 p-4 bg-[#f0f0ef] w-full rounded-xl '>
          <h3 className="font-medium text-lg mb-4 text-gray-700">Transaction History</h3>
          {sortedTransactions.length > 0 && (
            <div className="">
              <ul className="list-none pl-3">
                {sortedTransactions
                  .slice(0, 7) // Limit to the most recent 7 transactions
                  .map((tx, index) => {
                    const explorerUrl = tx.network === 'Testnet'
                      ? testnetExplorerUrl
                      : mainnetExplorerUrl;

                    // Determine the background color based on even or odd index
                    const bgColor = index % 2 === 0 ? 'bg-white' : 'bg-[#f0f0ef]';

                    // Format timestamp
                    const timestamp = tx.timestamp ? new Date(tx.timestamp).toLocaleString() : 'No timestamp';

                    return (
                      <div key={tx.hash} className={`py-4 px-4 ${bgColor} rounded-md flex`} >
                        <div className=" text-gray-600 mr-4">
                          {timestamp}
                        </div>
                        <li >
                          <div className='flex'>
                            <div className="flex items-center">
                              <span className="ml-2 mr-12 text-gray-500">
                                ({tx.network})
                              </span>

                            </div>
                            <div>
                              <a
                                href={`${explorerUrl}${tx.hash}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-500 "
                              >
                                {tx.hash}
                              </a>
                            </div>
                          </div>
                        </li>
                      </div>
                    );
                  })}
              </ul>
            </div>
          )}

        </div>
      </div>
    </>
  );
};

export default Multisender;

