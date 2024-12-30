import { useState, useEffect } from 'react';
import { ChainGrpcBankApi } from '@injectivelabs/sdk-ts';
import { getNetworkEndpoints, Network } from '@injectivelabs/networks';
import { CSVLink } from 'react-csv';
import { ChainRestTendermintApi } from "@injectivelabs/sdk-ts";
import { AiFillQuestionCircle } from 'react-icons/ai';

// Set up endpoints for Mainnet
const endpoints = getNetworkEndpoints(Network.Mainnet);
const sentryEndpoint = 'https://sentry.lcd.injective.network:443'; // Update this for testnet or mainnet

const DEFAULT_DECIMALS = 18; // Default decimal places
const ITEMS_PER_PAGE = 10; // Number of items to display per page

const TokenHolder = () => {
  const [denom, setDenom] = useState<string>('');
  const [holders, setHolders] = useState<{ address: string; amount: string }[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [blockHeight, setBlockHeight] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [isComplete, setIsComplete] = useState<boolean>(false);
  const [decimalPlaces, setDecimalPlaces] = useState<number>(DEFAULT_DECIMALS); // State for decimal places
  const [denomNotFound, setDenomNotFound] = useState<boolean>(false); // State to track denom validity
  const [showCsvButton, setShowCsvButton] = useState<boolean>(false); // State to manage CSV button visibility

  const fetchLatestBlockHeight = async (): Promise<number | null> => {
    try {
      const chainRestTendermintApi = new ChainRestTendermintApi(sentryEndpoint);
      const latestBlock = await chainRestTendermintApi.fetchLatestBlock();
      const latestHeight = parseInt(latestBlock.header.height, 10); // Convert string to number
      console.log('Latest Block Height:', latestHeight);
      return latestHeight;
    } catch (error) {
      console.error('Error fetching latest block height:', error);
      return null;
    }
  };

  useEffect(() => {
    const initializeBlockHeight = async () => {
      try {
        const height = await fetchLatestBlockHeight();
        if (height !== null) {
          setBlockHeight(height);
        }
      } catch (error) {
        console.error('Error initializing block height:', error);
        setError('Error initializing block height.');
      }
    };

    initializeBlockHeight();
  }, []);

  const fetchTokenHolders = async (denom: string) => {
    setLoading(true);
    setError(null);
    setDenomNotFound(false); // Reset denom not found state
    setShowCsvButton(false); // Hide CSV button while loading

    try {
      const chainGrpcBankApi = new ChainGrpcBankApi(endpoints.grpc);

      if (blockHeight !== null) {
        chainGrpcBankApi.setMetadata({
          'x-cosmos-block-height': blockHeight.toString(),
        });
      }

      const response = await chainGrpcBankApi.fetchDenomOwners(denom, {
        limit: 5000,
      });

      console.log('API Response:', response);

      const denomOwners = response?.denomOwners || [];

      if (denomOwners.length === 0) {
        setDenomNotFound(true); // Set denom not found state
      }

      const formattedHolders = denomOwners.map((owner) => ({
        address: owner.address,
        amount: owner.balance ? formatAmount(owner.balance.amount) : '0',
      }));

      console.log('Formatted Holders:', formattedHolders); // Log formatted holders

      setHolders(formattedHolders);
      setIsComplete(true);
      setShowCsvButton(true); // Show CSV button after data is loaded
    } catch (error) {
      console.error('Error fetching token holders:', error);
      setError('Error fetching token holders.');
    } finally {
      setLoading(false);
    }
  };

  const handleFetchClick = () => {
    if (denom.trim()) {
      fetchTokenHolders(denom);
    } else {
      setError('Please enter a denom.');
    }
  };

  const formatAmount = (amount: string): string => {
    const amountNum = parseFloat(amount) / Math.pow(10, decimalPlaces);
    if (isNaN(amountNum)) return '0';
    return amountNum.toLocaleString('en-US', {
      minimumFractionDigits: decimalPlaces,
      maximumFractionDigits: decimalPlaces,
    });
  };

  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentHolders = holders.slice(startIndex, endIndex);
  const totalPages = Math.ceil(holders.length / ITEMS_PER_PAGE);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const csvData = holders.map(holder => ({
    Address: holder.address,
    Amount: holder.amount,
  }));

  console.log('Current Holders:', currentHolders); // Log current holders

  return (
    <main>
      <section className="border h-[30vh] p-3 rounded-lg flex flex-col justify-between gap-4 font-normal text-sm text-gray-700">
        <div>
          <div>
            <label>
              Enter Denom
              <input
                id="denomInput"
                type="text"
                value={denom}
                onChange={(e) => setDenom(e.target.value)}
                placeholder='peggy0xb2617246d0c6c0087f18703d576831899ca94f01'
                className="w-full p-2 border rounded-lg outline-custom-blue outline-1 cursor-pointer"
              />
            </label>
          </div>
          <div className='mt-4'>
            <label>
              Decimal
              <input
                id="decimalPlacesInput"
                type="number"
                min="0"
                value={decimalPlaces}
                onChange={(e) => setDecimalPlaces(Number(e.target.value))}
                className="w-full p-2 border rounded-lg outline-custom-blue outline-1 cursor-pointer"
              />
            </label>
          </div>
        </div>
        <div className='flex justify-between items-end'>
          <div className="relative group z-50">
            <AiFillQuestionCircle className="h-6 w-6 mr-4 text-gray-700 cursor-pointer" />
            <div className="absolute left-44 -translate-x-1/2 mt-2 w-96 bg-gray-700 text-white text-sm rounded-lg py-2 px-4 hidden group-hover:block transition-opacity duration-300">
              <p>
                Enter the denom of the token. Denoms are used to represent assets on Injective and come in different types: Native, Peggy, IBC, Insurance Fund, and Factory. For token denom details, visit
                <a href="https://explorer.injective.network/assets/" target="_blank" className="text-blue-500 "> Injective Explorer</a>.
              </p>
            </div>
          </div>
          <div>
            {showCsvButton && isComplete && (
              <CSVLink
                data={csvData}
                filename={"token-holders.csv"}
                className="border text-[#b9bbc5] hover:text-[#6d728c] px-6 py-2 rounded-full hover:border-[#6d728c] hover:scale-[103%] hover:duration-300"
                target="_blank"
              >
                Download CSV
              </CSVLink>
            )}
            <button
              onClick={handleFetchClick}
              className="bg-custom-blue text-white px-6 py-2 rounded-full hover:scale-[103%] hover:duration-300 ml-2"
            >
              Get Holders
            </button>
          </div>
        </div>
      </section>
      {loading ? (
        <div className="text-center mt-4">Loading...</div>
      ) : error ? (
        <div className="text-red-500 text-center mt-4">{error}</div>
      ) : denomNotFound && isComplete ? (
        <div className="text-center mt-4">No holders found for the denom {denom}</div>
      ) : currentHolders.length > 0 ? (
        <>
          <div className='w-full h-full border rounded-lg p-4 overflow-hidden mt-4'>
            <div className="bg-white rounded-lg overflow-x-auto">
              <div className="text-black font-medium px-4 py-2 sticky top-0 z-10">
                <div className="flex justify-between">
                  <span>Address</span>
                  <span>Amount</span>
                </div>
              </div>

              <ul className="list-none">
                {currentHolders.map((holder, index) => (
                  <li
                    key={index}
                    className={`py-2 px-4 flex justify-between items-center ${index % 2 === 0 ? 'bg-white' : 'bg-[#f6f7ff]'}`}
                  >
                    <span className="truncate">{holder.address}</span>
                    <span>{holder.amount}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="pagination text-end mt-1">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-4 py-2 text-gray-400 rounded-l-full disabled:opacity-50 hover:text-gray-500"
              >
                Previous
              </button>
              <span className="px-4 py-2 text-[#8E8F87] text-sm">{currentPage} / {totalPages}</span>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-4 py-2 text-gray-400 rounded-r-full disabled:opacity-50 hover:text-gray-500"
              >
                Next
              </button>
            </div>
          </div>
        </>
      ) : (
        <div className="text-center mt-4">Enter a denom and click "Get Holders" to see results.</div>
      )}
    </main>
  );
};

export default TokenHolder;
