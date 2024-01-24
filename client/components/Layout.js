import React, { useState } from 'react';
import LayoutHeader from './Header';
import { Container } from 'semantic-ui-react';
import 'semantic-ui-css/semantic.min.css'
import { Web3Context, ConnectionStatusContext } from '@/web3/context';
import { getWeb3 } from '@/web3/lib';


const Layout = (props) => {
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
        <Container>
          <LayoutHeader />
          {props.children}
        </Container>
      </ConnectionStatusContext.Provider>
    </Web3Context.Provider>
  );
};

export default Layout;