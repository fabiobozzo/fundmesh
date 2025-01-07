import React from "react";
import Layout from '../components/Layout';
import { Container, Header, Grid, Icon, Divider } from "semantic-ui-react";

const About = () => {
  return (
    <Layout>
      <Container text>
        <Header as='h1'>How FundMesh Works</Header>
        <p>
          FundMesh is a decentralized crowdfunding platform that connects project creators with contributors, 
          using blockchain technology to ensure transparency and trust.
        </p>

        <Divider section />
        
        <Grid stackable columns={2}>
          <Grid.Row>
            <Grid.Column>
              <Header as='h3'><Icon name='idea' />For Project Creators</Header>
              <p>
                1. Create your project by setting a funding goal and deadline
              </p>
              <p>
                2. Define project milestones to unlock funds gradually
              </p>
              <p>
                3. Receive contributions in ETH
              </p>
              <p>
                4. Get funds released when contributors approve your progress
              </p>
            </Grid.Column>
            
            <Grid.Column>
              <Header as='h3'><Icon name='users' />For Contributors</Header>
              <p>
                1. Browse and discover interesting projects
              </p>
              <p>
                2. Contribute any amount above the project's minimum
              </p>
              <p>
                3. Vote to approve project milestones
              </p>
              <p>
                4. Receive NFT rewards for successful projects
              </p>
            </Grid.Column>
          </Grid.Row>
        </Grid>

        <Divider section />

        <Header as='h3'><Icon name='shield' />Trust & Security</Header>
        <p>
          FundMesh uses smart contracts to ensure:
        </p>
        <ul>
          <li>Funds are only released when the majority of contributors approve</li>
          <li>Project creators must reach milestones to access funds</li>
          <li>All transactions and approvals are transparent on the blockchain</li>
          <li>Contributors receive unique NFTs as proof of participation</li>
        </ul>

        <Divider section />

        <Header as='h3'><Icon name='check circle' />Key Features</Header>
        <ul>
          <li><strong>Milestone-based Funding:</strong> Projects receive funds gradually as they achieve their goals</li>
          <li><strong>Community Governance:</strong> Contributors vote to approve milestones</li>
          <li><strong>NFT Rewards:</strong> Commemorative tokens for project supporters</li>
          <li><strong>Full Transparency:</strong> All project details and transactions are public</li>
          <li><strong>Decentralized:</strong> No intermediaries, direct creator-contributor relationship</li>
        </ul>

        <Divider section />

        <p style={{ fontStyle: 'italic' }}>
          Join FundMesh today to either launch your innovative project or support the next big idea!
        </p>
      </Container>
    </Layout>
  );
};

export default About;