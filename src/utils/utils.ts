// import { Buffer } from 'buffer';
// import Papa from 'papaparse';
// import {
//   MsgMultiSend,
//   TxRaw,
//   BaseAccount,
//   TxRestClient,
//   ChainRestAuthApi,
//   ChainGrpcBankApi,
//   createTransaction,
//   CosmosTxV1Beta1Tx,
//   ChainRestTendermintApi,
//   getTxRawFromTxRawOrDirectSignResponse,
// } from "@injectivelabs/sdk-ts";
// import { DEFAULT_BLOCK_TIMEOUT_HEIGHT, BigNumberInBase, BigNumberInWei } from "@injectivelabs/utils";
// import { TransactionException } from "@injectivelabs/exceptions";
// import { SignDoc } from "@keplr-wallet/types";

// const isTestnet = false; // Toggle between Testnet and Mainnet
// const chainId = isTestnet ? 'injective-888' : 'injective-1';
// const sentryEndpoint = isTestnet 
//   ? 'https://testnet.sentry.lcd.injective.network:443'
//   : 'https://sentry.lcd.injective.network:443';

// const grpcWebEndpoint = isTestnet 
//   ? 'https://testnet.sentry.chain.grpc-web.injective.network:443'
//   : 'https://sentry.chain.grpc-web.injective.network:443';

// export const getKeplr = async (chainId: string) => {
//   await window.keplr.enable(chainId);
//   const offlineSigner = window.keplr.getOfflineSigner(chainId);
//   const accounts = await offlineSigner.getAccounts();
//   const key = await window.keplr.getKey(chainId);
//   return { offlineSigner, accounts, key };
// };

// export const broadcastTx = async (chainId: string, txRaw: TxRaw) => {
//   const result = await window.keplr.sendTx(
//     chainId,
//     CosmosTxV1Beta1Tx.TxRaw.encode(txRaw).finish(),
//     "sync"
//   );

//   if (!result || result.length === 0) {
//     throw new TransactionException(
//       new Error("Transaction failed to be broadcasted"),
//       { contextModule: "Keplr" }
//     );
//   }

//   return Buffer.from(result).toString("hex");
// };

// export const fetchBalances = async (injectiveAddress: string) => {
//   try {
//     const chainGrpcBankApi = new ChainGrpcBankApi(grpcWebEndpoint);
//     const response = await chainGrpcBankApi.fetchBalances(injectiveAddress);
//     const balanceMap: Map<string, string> = new Map();

//     response.balances.forEach(({ denom, amount }) => {
//       const decimals = denom.startsWith('peggy') || denom === 'inj' ? 18 : 6;
//       const humanReadableBalance = (parseFloat(amount) / Math.pow(10, decimals)).toFixed(6);
//       balanceMap.set(denom, humanReadableBalance);
//     });

//     console.log('Fetched balances:', balanceMap);
//     return balanceMap;
//   } catch (error) {
//     console.error('Error fetching balances:', error);
//     return null;
//   }
// };

// export type CsvRow = [string, string];

// export const handleCsvUpload = (event: React.ChangeEvent<HTMLInputElement>, setCsvData: React.Dispatch<React.SetStateAction<CsvRow[]>>) => {
//   const file = event.target.files?.[0];
//   if (file) {
//     Papa.parse<CsvRow>(file, {
//       header: false,
//       skipEmptyLines: true,
//       complete: function (results) {
//         setCsvData(results.data);
//         console.log("CSV Data:", results.data);
//       }
//     });
//   }
// };

// export const validateCsv = (csvData: CsvRow[], selectedDenom: string, balances: Map<string, string> | null, setStatus: React.Dispatch<React.SetStateAction<string>>) => {
//   if (!csvData || csvData.length === 0) {
//     setStatus("CSV file is empty or not properly formatted.");
//     return false;
//   }

//   for (const [address, amount] of csvData) {
//     if (!address || !amount || isNaN(parseFloat(amount))) {
//       setStatus("CSV contains invalid address or amount.");
//       return false;
//     }
//   }

//   const totalAmount = csvData.reduce((acc, [, amount]) => acc + parseFloat(amount), 0);
//   const userBalance = balances?.get(selectedDenom) || "0";

//   if (parseFloat(userBalance) < totalAmount) {
//     setStatus("Total amount in CSV exceeds your balance.");
//     return false;
//   }

//   return true;
// };

// export const truncateAddress = (address: string) => {
//   if (address.length <= 6) return address;
//   return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
// };
