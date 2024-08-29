import React, { createContext, useState, useContext, ReactNode } from 'react';

// Define the shape of your context
type NetworkContextType = {
  isTestnet: boolean;
  setNetwork: (isTestnet: boolean) => void;
};

// Create the context with an undefined default value
const NetworkContext = createContext<NetworkContextType | undefined>(undefined);

// Create a provider component
export const NetworkProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isTestnet, setIsTestnet] = useState<boolean>(true);

  const setNetwork = (isTestnet: boolean) => {
    setIsTestnet(isTestnet);
  };

  return (
    <NetworkContext.Provider value={{ isTestnet, setNetwork }}>
      {children}
    </NetworkContext.Provider>
  );
};

// Custom hook to use the network context
export const useNetwork = (): NetworkContextType => {
  const context = useContext(NetworkContext);
  if (context === undefined) {
    throw new Error('useNetwork must be used within a NetworkProvider');
  }
  return context;
};
