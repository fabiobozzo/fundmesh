import React, { useState, useEffect } from 'react';
import { Web3Context, ConnectionStatusContext } from '@/web3/context';
import { getWeb3 } from '@/web3/lib';

function MyApp({ Component, pageProps }) {
  const [web3, setWeb3] = useState(null);
  const [connected, setConnected] = useState(false);

  // Check initial connection status
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
        }
      }
    };

    checkConnection();

    // Listen for account changes
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', (accounts) => {
        console.log('Accounts changed:', accounts);
        if (accounts.length > 0) {
          setConnected(true);
        } else {
          setWeb3(null);
          setConnected(false);
        }
      });
    }
  }, []);

  const connectToWallet = async () => {
    try {
      const web3Instance = await getWeb3();
      setWeb3(web3Instance);
      setConnected(true);
      window.localStorage.setItem('web3Connected', 'true');
      console.log('Wallet connected successfully');
      return true;
    } catch (err) {
      console.error('Connection error:', err);
      return false;
    }
  };

  return (
    <Web3Context.Provider value={{ web3, connectToWallet }}>
      <ConnectionStatusContext.Provider value={connected}>
        <Component {...pageProps} />
      </ConnectionStatusContext.Provider>
    </Web3Context.Provider>
  );
}

export default MyApp;