import React, { useState, useEffect } from "react";
import { useRouter } from 'next/router';
import Link from "next/link";
import { Grid, Button, CardGroup, List, Divider, Segment, Dimmer, Loader, Image, Message, MessageHeader, Card } from 'semantic-ui-react';
import Layout from '../components/Layout';
import { useWeb3 } from "@/web3/context";
import { Factory, Project } from "@/web3/contracts";
import { truncateEthAddress } from "@/utils/web3";

import styles from './index.module.css';

const Index = () => {
  const router = useRouter();
  const { web3 } = useWeb3();

  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (web3) {
      (async () => {
        try {
          const factory = Factory(web3);
          const addresses = await factory.methods.getDeployedProjects().call();

          let items = [];
          for (const addr of addresses) {
            const project = Project(web3, addr);
            const summary = await project.methods.getSummary().call();
            const cid = summary[2];
            const response = await fetch(`${process.env.NEXT_PUBLIC_IPFS_GW}/${cid}/properties.json`);

            if (!response.ok) {
              continue
            }

            const metadata = await response.json();

            items.push({
              address: addr,
              cid: cid,
              name: metadata.name,
              description: metadata.description,
              imageCid: metadata.imageCid
            });
          }

          setProjects(items);
        } catch (err) {
          console.log(err);
          setError(err.message);
        } finally {
          setLoading(false);
        }
      })();


    }
  }, [web3]);

  return (
    <Layout>
      <Grid>
        <Grid.Row>
          <Grid.Column width={11}>
            <h3>Trending Projects</h3>
            <Message hidden={error === ''} negative>
              <MessageHeader>An error has occurred while retrieving the trending projects.</MessageHeader>
              <p>{error}</p>
            </Message>
            <Segment hidden={!loading}>
              <Dimmer active inverted>
                <Loader />
              </Dimmer>
              <Image src='https://react.semantic-ui.com/images/wireframe/short-paragraph.png' />
            </Segment>
            <CardGroup stackable itemsPerRow={3}>
              {projects.map((project, index) => (
                <Card key={index}>
                  <Image src={`${process.env.NEXT_PUBLIC_IPFS_GW}/${project.imageCid}`} wrapped ui={false} />
                  <Card.Content>
                    <Card.Header>{project.name}</Card.Header>
                    <Card.Meta>{truncateEthAddress(project.address)}</Card.Meta>
                    <Card.Description>{project.description}</Card.Description>
                  </Card.Content>
                  <Card.Content extra>
                    <Link href={`/projects/${project.address}`}>View Project →</Link>
                  </Card.Content>
                </Card>
              ))}
            </CardGroup>
          </Grid.Column>
          <Grid.Column width={1}>
            <Divider vertical />
          </Grid.Column>
          <Grid.Column width={4}>
            <Link href='/projects/create'>
              <Button
                content="Create New Project"
                icon="add"
                labelPosition='left'
                primary
              />
            </Link>
            <h3>Recent Activity</h3>
            <List>
              <List.Item>Project 1</List.Item>
              <List.Item>Milestone reached 2</List.Item>
            </List>
          </Grid.Column>
        </Grid.Row>
      </Grid>
    </Layout>
  )
};

export default Index;