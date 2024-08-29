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
    <div className="token-holder-page mt-20 mx-4">
      <div className="bg-[#f0f0ef] p-4 rounded-lg items-center gap-4">
        <div className="flex-grow">
          <label htmlFor="denomInput" className="block mb-2 font-medium text-gray-700">
            Enter Denom
          </label>
          <input
            id="denomInput"
            type="text"
            value={denom}
            onChange={(e) => setDenom(e.target.value)}
            className="w-full p-2 border rounded-lg outline-none font-medium text-gray-700"
          />
        </div>
        <div className='mt-4'>
          <label htmlFor="decimalPlacesInput" className="block mb-2 font-medium text-gray-700 ">
            Decimal
          </label>
          <input
            id="decimalPlacesInput"
            type="number"
            min="0"
            value={decimalPlaces}
            onChange={(e) => setDecimalPlaces(Number(e.target.value))}
            className="w-full p-2 border rounded-lg font-medium text-gray-700 outline-none"
          />
        </div>
        <div className='mt-4 flex justify-between items-center'>
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
                className="border-2 border-gray-400 text-gray-400 py-1.5 px-4 rounded-full hover:border-gray-500 hover:text-gray-500"
                target="_blank"
              >
                Download CSV
              </CSVLink>
            )}
            <button
              onClick={handleFetchClick}
              className="ml-4 bg-gradient-to-r from-blue-500 to-teal-400 text-white py-2 px-4 rounded-full hover:from-blue-600 hover:to-teal-500"
            >
              Get Holders
            </button>
          </div>
        </div>
      </div>
      {loading ? (
        <div className="text-center mt-4">Loading...</div>
      ) : error ? (
        <div className="text-red-500 text-center mt-4">{error}</div>
      ) : denomNotFound && isComplete ? (
        <div className="text-center mt-4">No holders found for the denom {denom}</div>
      ) : currentHolders.length > 0 ? (
        <>
          <div className='w-full h-[55vh] bg-[#f0f0ef] rounded-lg p-4 overflow-hidden mt-7'>
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
                    className={`py-2 px-4 flex justify-between items-center ${index % 2 === 0 ? 'bg-gray-100' : 'bg-white'}`}
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
    </div>
  );
};

export default TokenHolder;
