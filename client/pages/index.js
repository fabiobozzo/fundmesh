import React from "react";
import { Container, Button, Header } from 'semantic-ui-react';
import { useWeb3, useConnectionStatus } from '@/web3/context';
import Layout from '@/components/Layout';

const Landing = () => {
  const { connectToWallet } = useWeb3();

  const handleConnect = async () => {
    try {
      await connectToWallet();
    } catch (err) {
      console.error('Connection error:', err);
    }
  };

  return (
    <Layout>
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: "'Inter', sans-serif",
        margin: 0,
        padding: 0,
        minHeight: '100vh',
      }}>
        <Container text textAlign='center' style={{ padding: '2rem' }}>
          <Header
            as='h1'
            content='FundMesh'
            style={{
              color: 'white',
              fontSize: 'clamp(2.5em, 8vw, 4em)',
              fontWeight: '600',
              marginBottom: 0,
              fontFamily: "'Inter', sans-serif",
            }}
          />
          
          <Header
            as='h2'
            content='Decentralized crowdfunding with built-in trust'
            style={{
              fontSize: 'clamp(1.2em, 3vw, 1.7em)',
              fontWeight: 'normal',
              marginTop: '0.5em',
              marginBottom: '1.5em',
              color: 'white',
              opacity: 0.9,
              fontFamily: "'Inter', sans-serif",
            }}
          />

          <Button 
            size='huge'
            onClick={handleConnect}
            style={{
              background: 'white',
              color: '#1e3c72',
              boxShadow: '0 4px 14px 0 rgba(0,0,0,0.2)',
              padding: '20px 32px',
              fontSize: '1.2em',
              fontFamily: "'Inter', sans-serif",
              borderRadius: '8px',
              transition: 'transform 0.2s ease, box-shadow 0.2s ease',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5em',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.3)';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 14px 0 rgba(0,0,0,0.2)';
            }}
          >
            <svg 
              width="24" 
              height="24" 
              viewBox="0 0 24 24" 
              style={{ fill: '#1e3c72' }}
            >
              <path d="M11.944 17.97L4.58 13.62 11.943 24l7.37-10.38-7.372 4.35h.003zM12.056 0L4.69 12.223l7.365 4.354 7.365-4.35L12.056 0z"/>
            </svg>
            Connect with MetaMask
          </Button>

          <p style={{ 
            marginTop: '2em',
            fontSize: 'clamp(1em, 2vw, 1.2em)',
            opacity: 0.9,
            lineHeight: '1.6',
            color: 'white',
            fontFamily: "'Inter', sans-serif",
            maxWidth: '600px',
            margin: '2em auto 0',
          }}>
            Launch your projects or support others with full transparency and milestone-based funding
          </p>
        </Container>
      </div>
    </Layout>
  );
};

export default Landing; 