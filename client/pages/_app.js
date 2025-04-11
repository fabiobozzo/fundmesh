import React, { useState, useEffect, useRef } from 'react';
import { Web3Context, ConnectionStatusContext, AccountSwitchingContext } from '@/web3/context';
import { getWeb3 } from '@/web3/lib';
import { useRouter } from 'next/router';

function MyApp({ Component, pageProps }) {
  const [web3, setWeb3] = useState(null);
  const [connected, setConnected] = useState(false);
  const [isAccountSwitching, setIsAccountSwitching] = useState(false);
  const router = useRouter();
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const lastPathRef = useRef(null);
  const accountChangeInProgressRef = useRef(false);

  // Store path whenever it changes
  useEffect(() => {
    const currentPath = router.asPath;
    if (!isAccountSwitching && currentPath !== '/' && currentPath !== '/dashboard') {
      lastPathRef.current = currentPath;
    }
  }, [router.asPath, isAccountSwitching]);

  useEffect(() => {
    const checkConnection = async () => {
      if (window.ethereum) {
        const accounts = await window.ethereum.request({
          method: 'eth_accounts'
        });
        
        if (accounts.length > 0) {
          const web3Instance = await getWeb3();
          setWeb3(web3Instance);
          setConnected(true);
          
          // Always redirect from landing on initial load
          if (isInitialLoad && router.pathname === '/') {
            router.push('/dashboard');
          }
        } else {
          setConnected(false);
          setWeb3(null);
          // If we're not on landing and not initial load, redirect
          if (!isInitialLoad && router.pathname !== '/') {
            router.push('/');
          }
        }
        setIsInitialLoad(false);
      }
    };

    checkConnection();

    if (window.ethereum) {
      const handleAccountsChanged = async (accounts) => {
        // Prevent multiple handling of the same account change
        if (accountChangeInProgressRef.current) {
          return;
        }
        
        accountChangeInProgressRef.current = true;
        // Set switching flag immediately to prevent redirects
        setIsAccountSwitching(true);

        try {
          if (accounts.length > 0) {
            // Get current path before any state changes
            const currentPath = router.asPath;

            // Always maintain connected state during account switching
            setConnected(true);
            
            // Update web3 instance
            const web3Instance = await getWeb3();
            setWeb3(web3Instance);

            // If we have a stored path, use it (regardless of current path)
            if (lastPathRef.current) {
              await router.replace(lastPathRef.current);
            }
            // Otherwise if we're on landing, go to dashboard
            else if (currentPath === '/') {
              router.push('/dashboard');
            }
          } else {
            // All accounts disconnected
            setWeb3(null);
            setConnected(false);
            lastPathRef.current = null;
            router.push('/');
          }
        } finally {
          // Reset the switching flag after a delay to ensure all redirects completed
          setTimeout(() => {
            setIsAccountSwitching(false);
            accountChangeInProgressRef.current = false;
          }, 2000); // Longer delay to ensure everything has settled
        }
      };
      
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      
      // Also check disconnection via regular interval as a fallback
      const disconnectionCheckInterval = setInterval(async () => {
        if (!isAccountSwitching) {
          const accounts = await window.ethereum.request({
            method: 'eth_accounts'
          });
          if (accounts.length === 0 && connected) {
            setConnected(false);
            setWeb3(null);
            if (router.pathname !== '/') {
              router.push('/');
            }
          }
        }
      }, 5000);
      
      return () => {
        if (window.ethereum && window.ethereum.removeListener) {
          window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        }
        clearInterval(disconnectionCheckInterval);
      };
    }
  }, []);

  const connectToWallet = async () => {
    try {
      const web3Instance = await getWeb3();
      setWeb3(web3Instance);
      setConnected(true);
      if (router.pathname === '/') {
        router.push('/dashboard');
      }
      return true;
    } catch (err) {
      console.error('Connection error:', err);
      return false;
    }
  };

  return (
    <Web3Context.Provider value={{ web3, connectToWallet, isAccountSwitching }}>
      <ConnectionStatusContext.Provider value={connected}>
        <AccountSwitchingContext.Provider value={isAccountSwitching}>
          <Component {...pageProps} />
        </AccountSwitchingContext.Provider>
      </ConnectionStatusContext.Provider>
    </Web3Context.Provider>
  );
}

export default MyApp;