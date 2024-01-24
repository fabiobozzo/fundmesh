import React, { Component } from "react";
import { useRouter } from 'next/router';

import Layout from '../components/Layout';

const Index = () => {
  const router = useRouter();

  return (
    <Layout>
      <div>Ciao</div>
    </Layout>
  )
};

export default Index;