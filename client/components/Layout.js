import React from 'react';
import { useRouter } from 'next/router';
import LayoutHeader from './Header';
import { Container } from 'semantic-ui-react';
import { useConnectionStatus } from '@/web3/context';
import 'semantic-ui-css/semantic.min.css'

const Layout = (props) => {
  const router = useRouter();
  const connected = useConnectionStatus();

  React.useEffect(() => {
    if (!router.isReady) return;

    if (!connected && router.pathname !== '/') {
      // Not connected and not on landing -> go to landing
      router.push('/');
    } else if (connected && router.pathname === '/') {
      // Connected and on landing -> go to dashboard
      router.push('/dashboard');
    }
  }, [connected, router.pathname, router.isReady]);

  // Don't show header on landing page
  if (router.pathname === '/') {
    return props.children;
  }

  return (
    <Container>
      <LayoutHeader />
      {props.children}
    </Container>
  );
};

export default Layout;