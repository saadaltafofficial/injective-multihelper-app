import React, { useState } from 'react';
import { getInjectiveAddress } from '@injectivelabs/sdk-ts';

const AddressConverter: React.FC = () => {
  const [ethereumAddress, setEthereumAddress] = useState('');
  const [injectiveAddress, setInjectiveAddress] = useState('');

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
    <div className="container mx-auto mt-10 p-4 max-w-md bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-center mb-6">Address Converter</h2>
      <div className="mb-4">
        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="eth-address">
          Ethereum Address
        </label>
        <input
          id="eth-address"
          type="text"
          placeholder="Enter your Ethereum address"
          value={ethereumAddress}
          onChange={(e) => setEthereumAddress(e.target.value)}
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
        />
      </div>
      <button
        onClick={handleConvert}
        className="w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
      >
        Get Injective Address
      </button>
      {injectiveAddress && (
        <div className="mt-6">
          <h3 className="text-xl font-semibold text-gray-800">Injective Address</h3>
          <p className="mt-2 text-gray-600 break-words">{injectiveAddress}</p>
        </div>
      )}
    </div>
  );
};

export default AddressConverter;
