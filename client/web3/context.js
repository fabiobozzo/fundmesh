import { createContext, useContext } from "react";

// Create a new context for the Web3 instance
const Web3Context = createContext({
  web3: null,
  connectToWallet: async () => {}
});

// Create a new context for the connection status
const ConnectionStatusContext = createContext(false);

// Export custom hooks that shortcut the process of fetching the contexts
export const useWeb3 = () => useContext(Web3Context);
export const useConnectionStatus = () => useContext(ConnectionStatusContext);

export { Web3Context, ConnectionStatusContext };