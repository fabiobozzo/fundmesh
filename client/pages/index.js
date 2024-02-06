import React from "react";
import { useRouter } from 'next/router';
import { Grid, Button, Card, List, Divider } from 'semantic-ui-react';
import Layout from '../components/Layout';
import Link from "next/link";

const Index = () => {
  const router = useRouter();

  return (
    <Layout>
      <Grid>
        <Grid.Row>
          <Grid.Column width={11}>
            <h2>Trending Projects</h2>
            <Card.Group stackable>
              <Card>
                <Card.Content>
                  <Card.Header>Project 1</Card.Header>
                  <Card.Description>Project 1 description</Card.Description>
                </Card.Content>
              </Card>
              <Card>
                <Card.Content>
                  <Card.Header>Project 2</Card.Header>
                  <Card.Description>Project 2 description</Card.Description>
                </Card.Content>
              </Card>
              <Card>
                <Card.Content>
                  <Card.Header>Project 3</Card.Header>
                  <Card.Description>Project 3 description</Card.Description>
                </Card.Content>
              </Card>
              <Card>
                <Card.Content>
                  <Card.Header>Project 4</Card.Header>
                  <Card.Description>Project 4 description</Card.Description>
                </Card.Content>
              </Card>
              <Card>
                <Card.Content>
                  <Card.Header>Project 1</Card.Header>
                  <Card.Description>Project 1 description</Card.Description>
                </Card.Content>
              </Card>
              <Card>
                <Card.Content>
                  <Card.Header>Project 2</Card.Header>
                  <Card.Description>Project 2 description</Card.Description>
                </Card.Content>
              </Card>
              <Card>
                <Card.Content>
                  <Card.Header>Project 3</Card.Header>
                  <Card.Description>Project 3 description</Card.Description>
                </Card.Content>
              </Card>
              <Card>
                <Card.Content>
                  <Card.Header>Project 4</Card.Header>
                  <Card.Description>Project 4 description</Card.Description>
                </Card.Content>
              </Card>
            </Card.Group>
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