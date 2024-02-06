import React, { useState, useEffect } from "react";
import Link from 'next/link';
import { Icon, Menu, Modal, ModalContent, Header, Container } from 'semantic-ui-react';
import { useWeb3, useConnectionStatus } from "@/web3/context";
import { web3Errors } from "@/web3/lib";
import { truncateEthAddress } from "@/utils/web3";

const LayoutHeader = () => {
  const { web3, connectToWallet } = useWeb3();
  const connected = useConnectionStatus();
  const [accounts, setAccounts] = useState(null);
  const [noWalletErr, setNoWalletErr] = useState(false);

  const onConnectClick = async () => {
    try {
      await connectToWallet();
    } catch (err) {
      console.log(err);
      if (err.message != web3Errors['invalidWallet']) {
        setNoWalletErr(true);
      }
    }
  };

  useEffect(() => {
    const getAccounts = async () => {
      if (window.localStorage.getItem('web3Connected') === 'true' && !web3) {
        console.log('reconnecting web3...');
        await onConnectClick();
      }

      if (web3) {
        const accounts = await web3.eth.getAccounts();
        console.log(accounts);
        setAccounts(accounts);
      }
    };

    getAccounts();
  }, [web3]);

  return (
    <div style={{ marginBottom: '20px' }}>
      <Menu style={{ marginTop: '10px' }}>
        <Menu.Item>
          <Link href='/'>FundMesh</Link>
        </Menu.Item>
        <Menu.Menu position="right">
          <Menu.Item>
            <Link href='/about'>How it Works</Link>
          </Menu.Item>
          <Menu.Item>
            <Link href='/projects/me'>My Projects</Link>
          </Menu.Item>
          <Menu.Item icon>
            <Icon name="user" />
            <span style={{ marginLeft: '10px' }}>
              {connected && accounts ? truncateEthAddress(accounts[0]) : ''}
              {connected && !accounts ? 'Connecting...' : ''}
              {!connected ? <Link href='#' onClick={onConnectClick}>Connect Wallet</Link> : ''}
            </span>
          </Menu.Item>
        </Menu.Menu>
      </Menu>
      <Modal basic open={noWalletErr}>
        <Header icon>
          <Icon name='close' />
          Wallet not found
        </Header>
        <ModalContent>
          <Container textAlign='center'>
            <p>Please install <Link href='https://metamask.io/'>MetaMask</Link> and refresh the page.</p>
          </Container>
        </ModalContent>
      </Modal>
    </div>
  );
};

export default LayoutHeader;
