import { getInjectiveAddress } from '@injectivelabs/sdk-ts';







import React, { useState } from 'react';
import { IndexerGrpcAccountPortfolioApi, AccountPortfolioBalances } from '@injectivelabs/sdk-ts';
import { getNetworkEndpoints, Network } from '@injectivelabs/networks';

// Initialize the API
const endpoints = getNetworkEndpoints(Network.Testnet);
const indexerGrpcAccountPortfolioApi = new IndexerGrpcAccountPortfolioApi(endpoints.indexer);


  const PortfolioFetcher: React.FC = () => {
    const [address, setAddress] = useState<string>('');
    const [portfolio, setPortfolio] = useState<AccountPortfolioBalances | null>(null);
    const [error, setError] = useState<string>('');
    const [ethereumAddress, setEthereumAddress] = useState('');
  const [injectiveAddress, setInjectiveAddress] = useState('');

    const handleFetchPortfolio = async () => {
      try {
        if (!address) {
          setError('Please enter an Injective address.');
          return;
        }

        const data = await indexerGrpcAccountPortfolioApi.fetchAccountPortfolioBalances(address);
        setPortfolio(data);
        setError('');
      } catch (err) {
        setError('Failed to fetch portfolio. Please check the address or try again later.');
        console.error(err);
      }
    };

    const handleConvert = () => {
      try {
        const convertedAddress = getInjectiveAddress(ethereumAddress);
        setInjectiveAddress(convertedAddress);
      } catch (error) {
        console.error('Invalid Ethereum address:', error);
        setInjectiveAddress('Invalid Ethereum address');
      }
    };
  

    return (
      <>
      <div className='flex'>
        <div className="flex flex-col justify-center items-center p-10 h-[90vh]">
          <div className="w-full max-w-md shadow-lg p-8 rounded-lg bg-[#f0f0ef]">
            <div className="mb-4">
              <label htmlFor="address" className="block mb-2 font-medium text-gray-700">
                Injective Address:
              </label>
              <input
                id="address"
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Enter Injective address"
                className="w-full p-2 border rounded-lg outline-none"
              />
            </div>
            <button
              onClick={handleFetchPortfolio}
              className="bg-gradient-to-r from-blue-500 to-teal-400 text-white py-2 px-4 mt-3 rounded-full hover:from-blue-600 hover:to-teal-500"
            >
              Fetch Portfolio
            </button>

            {error && <p className="mt-4 text-red-600">{error}</p>}

            {portfolio && (
              <div className="mt-4 p-4 bg-white rounded-lg">
                <h2 className="font-medium text-gray-700">Portfolio:</h2>
                <pre className="text-lg font-semibold text-gray-700 whitespace-pre-wrap">{JSON.stringify(portfolio, null, 2)}</pre>
              </div>
            )}
          </div>
        </div>
        <div className="flex flex-col justify-center items-center p-10 h-[90vh]">
      <div className="w-full max-w-md shadow-lg p-8 rounded-lg bg-[#f0f0ef]">
        <div className="mb-4">
          <label htmlFor="eth-address" className="block text-gray-700 text-sm font-medium mb-2">
            Ethereum Address
          </label>
          <input
            id="eth-address"
            type="text"
            placeholder="Enter your Ethereum address"
            value={ethereumAddress}
            onChange={(e) => setEthereumAddress(e.target.value)}
            className="w-full p-2 border rounded-lg outline-none"
          />
        </div>
        <button
          onClick={handleConvert}
          className="bg-gradient-to-r from-blue-500 to-teal-400 text-white py-2 px-4 mt-3 rounded-full hover:from-blue-600 hover:to-teal-500"
        >
          Get Injective Address
        </button>
        {injectiveAddress && (
          <div className="mt-6 p-4 bg-white rounded-lg">
            <h3 className="text-xl font-semibold text-gray-700">Injective Address</h3>
            <p className="mt-2 text-gray-600 break-words">{injectiveAddress}</p>
          </div>
        )}
      </div>
    </div>
    </div>
      </>
    );
  };

  export default PortfolioFetcher;


