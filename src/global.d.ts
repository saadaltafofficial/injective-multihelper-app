// src/global.d.ts

interface Keplr {
    enable: (chainId: string) => Promise<void>;
    getKey: (chainId: string) => Promise<{
      name: string;
      algo: string;
      pubKey: Uint8Array;
      address: Uint8Array;
      bech32Address: string;
      isNanoLedger: boolean;
    }>;
    signArbitrary: (
      chainId: string,
      signer: string,
      data: string
    ) => Promise<{
      pubKey: Uint8Array;
      signature: Uint8Array;
    }>;
    // Add other methods and properties as needed
  }

interface Window {
    ethereum?: import('ethers').providers.ExternalProvider; // Add the type for Ethereum (MetaMask)
    keplr?: type;    // Add the type for Keplr
  }
  