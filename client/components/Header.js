import React, { useState, useEffect } from "react";
import Link from 'next/link';
import { Icon, Menu, Modal, ModalContent, Header, Container } from 'semantic-ui-react';
import { useWeb3, useConnectionStatus } from "@/web3/context";
import { web3Errors } from "@/web3/lib";
import { truncateEthAddress } from "@/utils/web3";
import { UserRegistry } from '@/web3/contracts';

const LayoutHeader = () => {
  const { web3, connectToWallet } = useWeb3();
  const connected = useConnectionStatus();
  const [accounts, setAccounts] = useState(null);
  const [noWalletErr, setNoWalletErr] = useState(false);
  const [profile, setProfile] = useState(null);

  const onConnectClick = async (e) => {
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
        setAccounts(accounts);
      }
    };

    getAccounts();

    // Listen for account changes in MetaMask
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', (newAccounts) => {
        if (newAccounts.length === 0) {
          // User disconnected wallet
          window.localStorage.setItem('web3Connected', 'false');
          window.location.reload();
        } else {
          // User switched accounts in MetaMask
          setAccounts(newAccounts);
          window.location.reload();
        }
      });
    }

    // Cleanup listener
    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', () => {
          console.log('accounts changed listener removed');
        });
      }
    };
  }, [web3]);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!web3 || !accounts) return;

      try {
        const userRegistry = UserRegistry(web3);
        const hasProfile = await userRegistry.methods.hasProfile(accounts[0]).call();
        if (hasProfile) {
          const profileData = await userRegistry.methods.getProfile(accounts[0]).call();
          if (profileData.exists) {
            const response = await fetch(`${process.env.NEXT_PUBLIC_IPFS_GW}/${profileData.profileCid}/profile.json`);
            const data = await response.json();
            setProfile(data);
          }
        }
      } catch (err) {
        console.error('Error fetching profile:', err);
      }
    };

    fetchProfile();
  }, [web3, accounts]);

  const renderAccountInfo = () => {
    if (!connected) {
      return <a href="#" onClick={onConnectClick}>Connect Wallet</a>;
    }
    if (!accounts) {
      return 'Connecting...';
    }
    return (
      <>
        <span>{truncateEthAddress(accounts[0])}</span>
        <Link 
          href='/profile' 
          style={{ marginLeft: '10px', fontSize: '0.9em' }}
        >
          {profile ? `(${profile.name})` : '(create profile?)'}
        </Link>
      </>
    );
  };

  return (
    <div style={{ marginBottom: '20px' }}>
      <Menu style={{ marginTop: '10px' }}>
        <Menu.Item>
          <Link href='/dashboard'>FundMesh</Link>
        </Menu.Item>
        <Menu.Menu position="right">
          <Menu.Item>
            <Link href='/about'>How it works</Link>
          </Menu.Item>
          <Menu.Item>
            <Link href='/projects/me'>My Projects</Link>
          </Menu.Item>
          <Menu.Item>
            <Icon name="user" />
            <span style={{ marginLeft: '10px' }}>
              {renderAccountInfo()}
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
