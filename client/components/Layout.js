import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import LayoutHeader from './Header';
import { Container, Dimmer, Loader } from 'semantic-ui-react';
import { useConnectionStatus, useWeb3, useAccountSwitching } from '@/web3/context';
import 'semantic-ui-css/semantic.min.css'

const Layout = (props) => {
  const router = useRouter();
  const connected = useConnectionStatus();
  const { isAccountSwitching } = useWeb3();
  const accountSwitching = useAccountSwitching();
  const [isLoading, setIsLoading] = useState(true);
  const [initialCheckComplete, setInitialCheckComplete] = useState(false);
  const [wasConnected, setWasConnected] = useState(false);

  // Track connection state changes
  useEffect(() => {
    if (connected) {
      setWasConnected(true);
    }
  }, [connected]);

  // Check direct Web3 connection to verify account status
  const isReallyConnected = useRef(false);
  useEffect(() => {
    const checkRealConnection = async () => {
      if (window.ethereum) {
        try {
          const accounts = await window.ethereum.request({ method: 'eth_accounts' });
          const previouslyConnected = isReallyConnected.current;
          isReallyConnected.current = accounts && accounts.length > 0;
          
          // Handle disconnection directly here
          if (previouslyConnected && !isReallyConnected.current && router.pathname !== '/') {
            router.push('/');
          }
        } catch (error) {
          console.error('LAYOUT: Error checking real connection:', error);
        }
      }
    };
    
    checkRealConnection();
    
    // Check more frequently to capture disconnection quickly
    const interval = setInterval(checkRealConnection, 1000);
    return () => clearInterval(interval);
  }, [router]);

  // Protection logic
  useEffect(() => {
    if (!router.isReady) return;
    
    const switchingAccounts = isAccountSwitching || accountSwitching;
    
    // Allow a brief initial loading period
    setTimeout(() => {
      setInitialCheckComplete(true);
    }, 1000);
    
    // If we're on the landing page, no need to redirect
    if (router.pathname === '/') {
      setIsLoading(false);
      return;
    }
    
    // Use direct Web3 connection check as the source of truth
    const reallyConnected = isReallyConnected.current;
    
    // Only redirect if really not connected (direct check) and not switching accounts
    if (!reallyConnected && !switchingAccounts && initialCheckComplete) {
      router.push('/');
      return;
    }
    
    setIsLoading(false);
  }, [
    connected, 
    router.pathname, 
    router.isReady, 
    isAccountSwitching, 
    accountSwitching, 
    initialCheckComplete
  ]);

  // Don't show header on landing page
  if (router.pathname === '/') {
    return props.children;
  }

  // Show loading spinner while checking connection status
  if (isLoading) {
    return (
      <Dimmer active>
        <Loader size='large'>Loading</Loader>
      </Dimmer>
    );
  }

  // Only render protected content if connected or switching accounts
  const switchingAccounts = isAccountSwitching || accountSwitching;
  if (!isReallyConnected.current && !switchingAccounts) {
    return (
      <Dimmer active>
        <Loader size='large'>Redirecting...</Loader>
      </Dimmer>
    );
  }

  return (
    <Container>
      <LayoutHeader />
      {props.children}
    </Container>
  );
};

export default Layout;