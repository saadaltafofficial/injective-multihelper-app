import React, { useState, useEffect, useCallback } from 'react';
import Papa from 'papaparse';
import { Buffer } from 'buffer';
import { MsgMultiSend, TxRestApi, BaseAccount, createTransaction, getTxRawFromTxRawOrDirectSignResponse, ChainRestAuthApi, ChainRestTendermintApi } from '@injectivelabs/sdk-ts';
import { getKeplr, broadcastTx, fetchBalances } from '../utils/keplrUtils';
import { useNetwork } from '../contexts/NetworkContext';
import { DEFAULT_BLOCK_TIMEOUT_HEIGHT, BigNumberInBase } from "@injectivelabs/utils";
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
  const [file, setFile] = useState<boolean>(false)
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
      fetchBalances(injectiveAddress, grpcWebEndpoint).then(balances => {
        setBalances(balances);
        console.log('Fetched balances for address:', injectiveAddress);
        console.log('Network:', isTestnet ? 'Testnet' : 'Mainnet');
        console.log('Endpoint:', grpcWebEndpoint);
        
        // Log each balance with token symbol and human-readable amounts
        if (balances) {
          console.log('=== BALANCE DETAILS ===');
          balances.forEach((amount, denom) => {
            const symbol = getSymbolFromDenom(denom, isTestnet);
            // Amount is already in human-readable format from fetchBalances
            
            console.log(`${symbol} (${denom}):`);
            console.log(`  Balance: ${amount}`);
          });
          console.log('=====================');
        }
      });

      // Load transaction hashes with network type from local storage
      const storedHashes = localStorage.getItem(`txHashes-${injectiveAddress}`);
      if (storedHashes) {
        setTransactionHashes(JSON.parse(storedHashes));
      }
    }
  }, [injectiveAddress, grpcWebEndpoint, isTestnet]);


  useEffect(() => {
    initializeKeplr();
  }, [initializeKeplr]);

  const handleCsvUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setFile(true)
      Papa.parse<CsvRow>(file, {
        header: false,
        skipEmptyLines: true,
        transform: (value) => value.trim(), // Trim whitespace from values
        complete: function (results) {
          // Process the CSV data to handle thousand separators in amounts
          const processedData = results.data.map(([address, amount]) => {
            // Clean the amount by removing thousand separators (commas)
            const cleanedAmount = amount ? amount.toString().replace(/,/g, '') : amount;
            return [address, cleanedAmount] as CsvRow;
          });
          
          setCsvData(processedData);
          console.log('Processed CSV Data:', processedData);
          
          // Log the total amount for debugging
          const totalAmount = processedData.reduce((sum, [_, amount]) => {
            return sum + (amount ? parseFloat(amount) : 0);
          }, 0);
          console.log('Total amount in CSV:', totalAmount);
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
      const cleanedAmount = amount ? amount.toString().replace(/,/g, '') : '';
      if (!address || !cleanedAmount || isNaN(parseFloat(cleanedAmount))) {
        setStatus('CSV contains invalid address or amount.');
        return false;
      }
    }

    // Calculate total amount from CSV data in human-readable format
    let totalAmount = 0;
    for (const [, amount] of csvData) {
      const cleanedAmount = amount.toString().replace(/,/g, '');
      totalAmount += parseFloat(cleanedAmount);
    }
    
    // Get user balance - already in human-readable format from fetchBalances
    const userBalance = balances?.get(selectedDenom) || '0';
    const userBalanceInTokens = parseFloat(userBalance);
    
    console.log('Balance check:', {
      totalAmountInCSV: totalAmount,
      userBalance,
      userBalanceInTokens,
      selectedDenom
    });

    if (userBalanceInTokens < totalAmount) {
      setStatus(`Total amount in CSV (${totalAmount.toFixed(6)}) exceeds your balance (${userBalanceInTokens.toFixed(6)}).`);
      return false;
    }

    return true;
  };


  const handleSend = async () => {
    if (!selectedDenom || csvData.length === 0) {
      setStatus('Token selection and CSV file are required.');
      return;
    }

    if (!validateCsv()) {
      return;
    }

    // Final validation and cleaning of amounts before sending
    const processedCsvData = csvData.map(([address, amount]) => {
      const cleanedAmount = amount.toString().replace(/,/g, '');
      return [address, cleanedAmount] as CsvRow;
    });

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

      // Prepare inputs and outputs for MsgMultiSend
      // Calculate total amount and convert to wei for blockchain transactions
      // Determine token decimals based on denomination
      const tokenDecimals = selectedDenom.startsWith('peggy') || selectedDenom === 'inj' ? 18 : 6;
      console.log(`Using ${tokenDecimals} decimals for ${selectedDenom}`);
      
      let totalHumanReadable = 0;
      let totalAmountInWei = new BigNumberInBase(0);
      
      for (const [_, amount] of processedCsvData) {
        const parsedAmount = parseFloat(amount);
        if (isNaN(parsedAmount)) {
          setStatus('Invalid amount detected in CSV data');
          return;
        }
        
        totalHumanReadable += parsedAmount;
        
        // Convert human readable amount to wei (smallest unit)
        const amountInWei = new BigNumberInBase(parsedAmount).times(
          new BigNumberInBase(10).pow(tokenDecimals)
        );
        totalAmountInWei = totalAmountInWei.plus(amountInWei);
      }

      console.log('Transaction preparation:', {
        humanReadableTotal: totalHumanReadable,
        weiTotal: totalAmountInWei.toFixed(),
        selectedDenom,
        recipientCount: processedCsvData.length
      });

      const inputs = [{
        address: injectiveAddress,
        coins: [{
          denom: selectedDenom,
          amount: totalAmountInWei.toFixed(), // Use the wei amount (smallest unit)
        }],
      }];

      const outputs = processedCsvData.map(([address, amount]) => {
        const parsedAmount = parseFloat(amount);
        // Convert to wei (smallest unit) for blockchain transaction
        const amountInWei = new BigNumberInBase(parsedAmount).times(
          new BigNumberInBase(10).pow(tokenDecimals)
        );
        
        console.log(`Converting ${parsedAmount} to ${amountInWei.toFixed()} wei for ${address}`);
        
        return {
          address,
          coins: [{
            denom: selectedDenom,
            amount: amountInWei.toFixed(), // Use the wei amount (smallest unit)
          }],
        };
      });

      const msg = MsgMultiSend.fromJSON({
        inputs,
        outputs,
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
      handleCancel()
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

  function handleCancel(){
    setShowGasFeeSection(false)
    setFile(false)
  }


  return (
    <>
      <main className='h-[30vh]'>
        {!showGasFeeSection ? (
          <section className='border p-3 rounded-lg text-gray-700 text-sm h-full flex flex-col justify-between'>
            <div>
              <label>
                Select Token:
                <select
                  required
                  onChange={handleSelectChange}
                  value={selectedDenom}
                  className="w-full p-2 border outline-none rounded-lg mt-1 mb-3 cursor-pointer outline-custom-blue outline-1"
                >
                  {balances &&
                    Array.from(balances.keys()).map((denom) => (
                      <option key={denom} value={denom}>
                        {getSymbolFromDenom(denom, isTestnet) || denom}
                      </option>
                    ))}
                </select>
              </label>
              <label>
                Upload csv:
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleCsvUpload}
                  required
                  className="p-2 border rounded-lg block mt-1 w-52 cursor-pointer outline-custom-blue"
                />
              </label>
            </div>
            <div className="flex justify-between items-end">
              <div className='flex items-end'>
                <div className="relative group">
                  <AiFillQuestionCircle className="h-6 w-6 mr-4 cursor-pointer" />
                  <div className="absolute left-44 -translate-x-1/2 mt-2 w-96 bg-gray-700 text-white p-2 rounded-lg hidden group-hover:block">
                    <p className="mb-2">CSV Format Guidelines:</p>
                    <ul className="list-disc pl-4 mb-2">
                      <li>Each line should have an Injective address and amount separated by a comma</li>
                      <li>Numbers can include thousand separators (commas) which will be automatically removed</li>
                      <li>Decimal values are supported (use period as decimal separator)</li>
                    </ul>
                    <p className="mb-1">Examples:</p>
                    <pre className="text-xs">
                      inj1y33jq32shhfgy89mawsg3c7savs257elnf254l,1.23
                      inj1y33jq32shhfgy89mawsg3c7savs257elnf254l,2,400
                      inj1y33jq32shhfgy89mawsg3c7savs257elnf254l,8
                    </pre>
                  </div>
                </div>
                {status && (
                  <div className={`p-2 border rounded-lg transition-opacity duration-500 ease-in-out ${showStatus ? 'opacity-100' : 'opacity-0'} bg-blue-100 text-blue-500 border-blue-300`}>
                    {status}
                  </div>
                )}
              </div>

                      
              {file ? 
              <button
                onClick={() => setShowGasFeeSection(true)}            
                className={`bg-custom-blue text-white px-6 py-2 rounded-full hover:scale-[103%] hover:duration-300 ${file ? "cursor-pointer": "cursor-not-allowed"}`}            
              >
                Send Tokens
              </button> : 
              <button
              disabled
              className={`bg-custom-blue text-white px-6 py-2 rounded-full hover:scale-[103%] hover:duration-300 ${file ? "cursor-pointer": "cursor-not-allowed"}`}            
            >
              Send Tokens
            </button>}              
            </div>
          </section>

        ) : (

          <section className="border p-3 rounded-lg text-gray-700 text-sm h-full flex flex-col justify-between">
            <div className='flex flex-col items-center'>
              <div className='flex w-full flex-col items-center my-8'>
                <input
                  id="gasFee"
                  type="range"
                  min={1000000}
                  max={100000000}
                  step={100000}
                  value={gasFee}
                  onChange={(e) => setGasFee(Number(e.target.value))}
                  className="w-[60%] appearance-none bg-gray-300 h-3 rounded-full bg-gradient-to-b from-[#192DAD] to-custom-blue cursor-pointer"
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
              <span className='font-medium text-lg text-gray-500'>{gasFee * 160000000 / 1e18} INJ</span>
            </div>
            <div className='flex justify-between items-end'>
              <div className='flex items-end'>
                <div className="relative group">
                  <AiFillQuestionCircle className="h-6 w-6 mr-4 text-gray-700 cursor-pointer" />
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
                  onClick={handleCancel}
                  className="border text-[#b9bbc5] hover:text-[#6d728c] px-6 py-2 rounded-full hover:border-[#6d728c] hover:scale-[103%] hover:duration-300"
                >
                  Cancel
                </button>                
                <button                
                  onClick={handleSend}
                  className="bg-custom-blue text-white px-6 py-2 rounded-full hover:scale-[103%] hover:duration-300 ml-2"
                >
                  Confirm Transaction
                </button> 
              </div>
            </div>
          </section>
        )}
      </main>

      {/* Transaction Hashes Display */}
      <section className='mt-4 p-4 border rounded-lg text-gray-700 h-full'>
        <h3 className="font-semibold text-lg mb-4">Transaction History</h3>
        {sortedTransactions.length > 0 && (
          <div className='overflow-hidden px-4'>
            <div className="list-none">
              {sortedTransactions
                .slice(0, 7) // Limit to the most recent 7 transactions
                .map((tx) => {
                  const explorerUrl = tx.network === 'Testnet'
                    ? testnetExplorerUrl
                    : mainnetExplorerUrl;

                  // Format timestamp
                  const timestamp = tx.timestamp ? new Date(tx.timestamp).toLocaleString() : 'No timestamp';

                  return (
                    <tr key={tx.hash} className={`py-4 border-y flex items-center justify-start gap-20`} >
                      {timestamp}
                      ({tx.network})
                      <li className='text-left'>
                        <a
                          href={`${explorerUrl}${tx.hash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-500 "
                        >
                          {tx.hash}
                        </a>
                      </li>
                    </tr>
                  );
                })}
            </div>
          </div>
        )}

      </section>
    </>
  );
};

export default Multisender;

