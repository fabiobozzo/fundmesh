import React from 'react';
import LayoutHeader from './Header';
import { Container } from 'semantic-ui-react';
import 'semantic-ui-css/semantic.min.css'

const Layout = (props) => {
  return (
    <Container>
      <LayoutHeader />
      {props.children}
    </Container>
  );
};

export default Layout;