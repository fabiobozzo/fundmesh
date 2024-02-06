import React, { useState } from 'react';
import { Web3Context, ConnectionStatusContext } from '@/web3/context';
import { getWeb3 } from '@/web3/lib';

function MyApp({ Component, pageProps }) {
  const [web3, setWeb3] = useState(null);
  const [connected, setConnected] = useState(false);

  const connectToWallet = async () => {
    const web3Instance = await getWeb3();
    setWeb3(web3Instance);
    setConnected(true);
    window.localStorage.setItem('web3Connected', 'true');
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