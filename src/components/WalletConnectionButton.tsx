import { useState, useEffect } from 'react';
import { connectWallet, addInjectiveToMetamask } from '../utils/wallet';

const WalletConnectionButton = () => {
  const [address, setAddress] = useState<string>("");

  useEffect(() => {
    if (address) {
      // You can add any additional logic here if needed when the address changes
    }
  }, [address]);

  const connectWalletHandler = async () => {
    try {
      const addresses = await connectWallet();

      // Check if connected via Metamask and prioritize Injective Chain
      const isMetamask = window.ethereum && !window.keplr;
      if (isMetamask) {
        await addInjectiveToMetamask();
      }

      // Set the first address to the state
      if (addresses.length > 0) {
        setAddress(addresses[0].address);
      }

      console.log('Connected addresses:', addresses);
    } catch (error) {
      // Handle the error (e.g., notify the user)
      console.error('Wallet connection failed:', error);
    }
  };

  const disconnectWalletHandler = () => {
    setAddress("");
    // Any additional logic when disconnecting the wallet can be added here
  };

  const truncateAddress = (address: string) => {
    if (address.length <= 6) return address;
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  return (
    <div style={{ position: 'absolute', top: 0, right: 0, padding: '10px' }}>
      {!address ? (
        <button onClick={connectWalletHandler} style={{ margin: 0 }}>
          Connect Wallet
        </button>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <span>{truncateAddress(address)}</span>
          <button onClick={disconnectWalletHandler} style={{ marginTop: '10px' }}>
            Disconnect
          </button>
        </div>
      )}
    </div>
  );
};

export default WalletConnectionButton;
