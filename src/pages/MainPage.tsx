import React, { useCallback, useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import Multisender from './Multisender';
import TokenHolder from './TokenHolder';
import CreateTokens from './CreateTokens';
import Calculator from './calculator';
import InjectiveAddress from './injectiveAddress';
import { getKeplr, fetchBalances } from '../utils/keplrUtils';
import { FiLogIn, FiChevronDown } from 'react-icons/fi';
import { useNetwork } from '../contexts/NetworkContext';
import { getSymbolFromDenom } from '../utils/tokenUtils';


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
    <>    
      <header className="flex h-screen">
        <Sidebar setActiveOption={setActiveOption} isWalletConnected={isWalletConnected} activeoption={activeOption}/>
        <section className='w-full p-4'>
          {!isWalletConnected ? (
            <div className='flex w-full h-full justify-center items-center'>
              <button
                onClick={connectWallet}
                className="flex items-center px-6 py-3 bg-custom-blue text-white rounded-full hover:scale-[103%] hover:duration-300"
              >
                <FiLogIn className="mr-2" />
                Connect Wallet
              </button>
            </div>
          ) : (
            <>
            <section className='flex justify-between items-center'>
              <div className='text-3xl font-semibold'>{activeOption}</div>
              <div className="flex gap-2 items-center text-sm text-gray-700">
                {isZeroBalance && (
                  <button
                    onClick={disconnectWallet}
                  >
                    Disconnect Wallet
                  </button>
                )}
                {!isZeroBalance && (
                  <div className="relative">
                    <div className="flex bg-[#F0F0EF] rounded-full py-2 px-4 justify-center items-center">
                      {balances && selectedToken && (
                        <>
                          <span>{selectedToken}</span>
                          <FiChevronDown
                            className="cursor-pointer ml-2"
                            onClick={() => setDropdownOpen(!dropdownOpen)}
                          />
                        </>
                      )}
                    </div>
                    {dropdownOpen && (
                      <div className="absolute mt-1 text-gray-700 w-36 bg-[#f0f0ef] shadow-md border border-gray-300 text-center flex flex-col">
                        <button
                          onClick={disconnectWallet}
                          className="px-4 py-2 hover:bg-[#dddddc] border-b border-gray-300"
                        >
                          Disconnect
                        </button>
                        {balances && Array.from(balances.keys()).map((denom) => (
                          <button
                            key={denom}
                            onClick={() => handleTokenChange(denom)}
                            className="px-4 py-2 hover:bg-[#dddddc] border-b border-gray-300"
                          >
                            {getSymbolFromDenom(denom, isTestnet) || denom}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                <p className="bg-[#F0F0EF] py-2 px-4 rounded-3xl text-gray-700">
                  {injectiveAddress ? injectiveAddress.slice(0, 3) + '...' + injectiveAddress.slice(-3) : ''}
                </p>
                <div className="flex items-center">
                  <button
                    onClick={handleNetworkSwitch}
                    className="bg-[#f0f0ec] py-2 px-4 rounded-full"
                  >
                    <span className="mr-2 inline-block w-2.5 h-2.5 bg-green-500 rounded-full"></span>
                    Switch to {isTestnet ? 'Mainnet' : 'Testnet'}
                  </button>
                </div>
              </div>
            </section>
            <section className='mt-6'>
              {activeOption === 'Multisender' && <Multisender />}
              {activeOption === 'Token Holders' && <TokenHolder />}
              {activeOption === 'Create Tokens' && <CreateTokens />}
              {activeOption === 'Gas Calculator' && <Calculator />}
              {activeOption === 'Injective Address' && <InjectiveAddress />}
            </section>
            </>
          )}
        </section>
      </header>      
    </>
  );
};

export default MainPage;
