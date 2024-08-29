import React, { useState } from 'react';

const GasFeeCalculator: React.FC = () => {
  const [numAddresses, setNumAddresses] = useState<number>(1);
  const [gasAmount, setGasAmount] = useState<number>(50000);
  const [calculatedFee, setCalculatedFee] = useState<number | null>(null);

  // Constants
  const MIN_GAS_PRICE = 160_000_000; // in inj
  const DECIMALS = 1e18; // 1e18 for INJ decimals

  const calculateGasFee = () => {
    const totalGasAmount = gasAmount * numAddresses;
    const feeInInj = (MIN_GAS_PRICE * totalGasAmount) / DECIMALS;
    setCalculatedFee(feeInInj);
  };

  return (
    <div className="flex flex-col justify-center items-center p-10 h-[90vh]">      
      <div className="w-full max-w-md shadow-lg p-8 rounded-lg bg-[#f0f0ef]">
        <div className="mb-4">
          <label htmlFor="numAddresses" className="block mb-2 font-medium text-gray-700">
            Number of Addresses:
          </label>
          <input
            id="numAddresses"
            type="number"
            value={numAddresses}
            onChange={(e) => setNumAddresses(Number(e.target.value))}
            className="w-full p-2 border rounded-lg outline-none"
          />
        </div>
        <div className="mb-4">
          <label htmlFor="gasAmount" className="block mb-2 font-medium text-gray-700">
            Gas Amount(wei):
          </label>
          <input
            id="gasAmount"
            type="number"
            value={gasAmount}
            onChange={(e) => setGasAmount(Number(e.target.value))}
            className="w-full p-2 border rounded-lg outline-none"
          />
        </div>
        <button
          onClick={calculateGasFee}
          className="bg-gradient-to-r from-blue-500 to-teal-400 text-white py-2 px-4 mt-3 rounded-full hover:from-blue-600 hover:to-teal-500"
        >
          Calculate Fee
        </button>
        {calculatedFee !== null && (
          <div className="mt-4 p-4 bg-white rounded-lg">
            <h2 className="font-medium text-gray-700">Calculated Gas Fee:</h2>
            <p className="text-lg font-semibold text-gray-700 ">{calculatedFee.toFixed(18)} INJ</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default GasFeeCalculator;
