import React, { useCallback, useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import Multisender from './Multisender';
import TokenHolder from './TokenHolder';
import Transactions from './Transactions';
import Calculator from './calculator';
import InjectiveAddress from './injectiveAddress';
import { getKeplr, fetchBalances } from '../utils/keplrUtils';
import { FiLogIn, FiChevronDown } from 'react-icons/fi';
import { useNetwork } from '../contexts/NetworkContext';
import { getSymbolFromDenom } from '../utils/tokenUtils'; // Import the shared utility

const MainPage: React.FC = () => {
  const { isTestnet, setNetwork } = useNetwork();
  const [activeOption, setActiveOption] = useState<string>('Multisender');
  const [isWalletConnected, setIsWalletConnected] = useState<boolean>(false);
  const [injectiveAddress, setInjectiveAddress] = useState<string | null>(null);
  const [balances, setBalances] = useState<Map<string, string> | null>(null);
  const [selectedToken, setSelectedToken] = useState<string | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState<boolean>(false);

  const chainId = isTestnet ? 'injective-888' : 'injective-1';
  const grpcWebEndpoint = isTestnet
    ? 'https://testnet.sentry.chain.grpc-web.injective.network:443'
    : 'https://sentry.chain.grpc-web.injective.network:443';

  const connectWallet = useCallback(async () => {
    try {
      const { key } = await getKeplr(chainId);
      setInjectiveAddress(key.bech32Address);
      setIsWalletConnected(true);

      const fetchedBalances = await fetchBalances(key.bech32Address, grpcWebEndpoint);
      setBalances(fetchedBalances);

      if (fetchedBalances) {
        const firstDenom = Array.from(fetchedBalances.keys())[0];
        const firstSymbol = getSymbolFromDenom(firstDenom, isTestnet);
        setSelectedToken(firstSymbol);
      }
    } catch (error) {
      console.error('Wallet connection failed:', error);
    }
  }, [chainId, grpcWebEndpoint, isTestnet]);

  useEffect(() => {
    if (isWalletConnected) {
      connectWallet(); // Fetch new balances when network changes
    }
  }, [isTestnet, isWalletConnected, connectWallet]);

  const disconnectWallet = () => {
    setInjectiveAddress(null);
    setBalances(null);
    setSelectedToken(null);
    setIsWalletConnected(false);
  };

  const handleTokenChange = (denom: string) => {
    const symbol = getSymbolFromDenom(denom, isTestnet);
    setSelectedToken(symbol);
    setDropdownOpen(false);
  };

  const handleNetworkSwitch = () => {
    setNetwork(!isTestnet);
  };

  const isZeroBalance = balances && Array.from(balances.values()).every((balance) => parseFloat(balance) === 0);

  return (
    <div className="flex h-screen">
      <Sidebar setActiveOption={setActiveOption} isWalletConnected={isWalletConnected} />
      <div className="flex-1 flex flex-col p-4">
        <div className="flex flex-grow shadow-lg rounded-2xl flex-col relative">
          {!isWalletConnected ? (
            <div className="flex justify-center items-center flex-grow">
              <button
                onClick={connectWallet}
                className="flex items-center px-4 py-2 bg-gradient-to-r from-[#4290F5] via-[#0FC4F4] to-[#A5DACF] text-white rounded-lg hover:scale-105 duration-150"
              >
                <FiLogIn className="mr-2" />
                Connect Wallet
              </button>
            </div>
          ) : (
            <>
              <div className="absolute top-2 right-2 mr-8 rounded-lg flex items-center">
                <div className="flex space-x-4 items-center">
                  {isZeroBalance && (
                    <button
                      onClick={disconnectWallet}
                      className="text-sm font-medium text-left px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-3xl bg-[#F0F0EF]"
                    >
                      Disconnect Wallet
                    </button>
                  )}
                  {!isZeroBalance && (
                    <div className="relative">
                      <div className="flex bg-[#F0F0EF] rounded-3xl py-2 px-3">
                        {balances && selectedToken && (
                          <p className="text-sm font-medium text-gray-700 flex justify-center items-center">
                            <span className="">{selectedToken}</span> {balances.get(selectedToken)}
                            <FiChevronDown
                              className="top-1/2 cursor-pointer text-xl ml-2"
                              onClick={() => setDropdownOpen(!dropdownOpen)}
                            />
                          </p>
                        )}
                      </div>
                      {dropdownOpen && (
                        <div className="absolute right-0 mt-2 text-gray-700 w-48 bg-white shadow-lg rounded-lg border border-gray-300 overflow-x-hidden">
                          <button
                            onClick={disconnectWallet}
                            className="w-full text-left px-4 text-gray-700 py-2 hover:bg-gray-100"
                          >
                            Disconnect Wallet
                          </button>
                          {balances && Array.from(balances.keys()).map((denom) => (
                            <button
                              key={denom}
                              onClick={() => handleTokenChange(denom)}
                              className="w-full text-left text-gray-700 px-4 py-2 hover:bg-gray-100"
                            >
                              {getSymbolFromDenom(denom, isTestnet) || denom}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                  <p className="font-medium bg-[#F0F0EF] text-sm py-2 px-4 rounded-3xl text-gray-700">
                    {injectiveAddress ? injectiveAddress.slice(0, 3) + '...' + injectiveAddress.slice(-3) : ''}
                  </p>
                  <div className="rounded-lg flex justify-center">
                    <div className="flex space-x-4 items-center">
                      <button
                        onClick={handleNetworkSwitch}
                        className="flex items-center text-sm font-medium w-full text-left px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-3xl bg-[#F0F0EF]"
                      >
                      <span className="mr-2 inline-block w-2.5 h-2.5 bg-green-500 rounded-full"></span>
                        Switch to {isTestnet ? 'Mainnet' : 'Testnet'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              <div>
                <div className="text-3xl absolute top-2 left-2 ml-8 font-semibold text-gray-700 mb-4">
                  {activeOption}
                </div>
                <div>
                  {activeOption === 'Multisender' && <Multisender />}
                  {activeOption === 'Token Holders' && <TokenHolder />}
                  {activeOption === 'Transactions' && <Transactions />}
                  {activeOption === 'Gas Calculator' && <Calculator />}
                  {activeOption === 'Injective Address' && <InjectiveAddress/>}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default MainPage;
