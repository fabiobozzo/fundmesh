import { createContext, useContext } from "react";

// Create contexts
export const Web3Context = createContext();
export const ConnectionStatusContext = createContext();
export const AccountSwitchingContext = createContext(false);

// Hook to use Web3 context
export function useWeb3() {
  const context = useContext(Web3Context);
  if (!context) {
    throw new Error('useWeb3 must be used within a Web3Provider');
  }
  return context;
}

// Hook to use connection status
export function useConnectionStatus() {
  const context = useContext(ConnectionStatusContext);
  if (context === undefined) {
    throw new Error('useConnectionStatus must be used within a ConnectionStatusProvider');
  }
  return context;
}

// Hook to use account switching status
export function useAccountSwitching() {
  const context = useContext(AccountSwitchingContext);
  if (context === undefined) {
    throw new Error('useAccountSwitching must be used within an AccountSwitchingProvider');
  }
  return context;
}