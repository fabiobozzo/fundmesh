import React from 'react';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import { useWeb3 } from '@/web3/context';

const MyProjects = () => {
  const router = useRouter();
  const { web3 } = useWeb3();

  return (
    <Layout>
      <h3>My own projects</h3>
    </Layout>
  );
};

export default MyProjects;