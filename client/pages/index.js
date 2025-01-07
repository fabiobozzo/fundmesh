import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Grid, Button, CardGroup, List, Divider, Segment, Dimmer, Loader, Image, Message, MessageHeader, Card, Label, Progress, Icon } from 'semantic-ui-react';
import Layout from '../components/Layout';
import { truncateEthAddress, formatEther, formatDeadline } from "@/utils/web3";

const Index = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchIpfsDataIfNeeded = async (project) => {
    // Only fetch if we have a CID but no image
    if (project.cid && !project.imageCid) {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_IPFS_GW}/${project.cid}/properties.json`);
        if (response.ok) {
          const data = await response.json();
          return {
            ...project,
            name: project.name || data.name,
            description: project.description || data.description,
            imageCid: data.imageCid
          };
        }
      } catch (err) {
        console.error('Failed to fetch IPFS data:', err);
      }
    }
    return project;
  };

  const fetchProjects = async () => {
    try {
      const query = `
        query {
          projects(
            first: 12,
            orderBy: trendingScore,
            orderDirection: desc,
            where: { completed: false }
          ) {
            id
            projectAddress
            owner
            name
            description
            imageCid
            cid
            contributorsCount
            currentBalance
            targetContribution
            progressRatio
            deadline
            completed
          }
        }
      `;

      const response = await fetch(process.env.NEXT_PUBLIC_SUBGRAPH_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
      });

      const result = await response.json();
      console.log('GraphQL Response:', result);

      if (result.errors) {
        throw new Error(result.errors[0].message);
      }

      if (!result.data || !result.data.projects) {
        throw new Error('Invalid response format from subgraph');
      }

      // Process projects and fetch IPFS data only if needed
      const projects = await Promise.all(
        result.data.projects.map(fetchIpfsDataIfNeeded)
      );
      
      setProjects(projects);
    } catch (err) {
      console.error('Error fetching projects:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const renderProjectCard = (project) => {
    const progress = Math.round(Number(project.progressRatio) * 100);
    
    const formatWei = (wei) => {
      if (wei < 1000) return `${wei} WEI`;
      if (wei < 1000000) return `${(wei/1000)}K WEI`;
      if (wei < 1000000000) return `${(wei/1000000)}M WEI`;
      return `${(wei/1000000000)}B WEI`;
    };

    const formatETH = (valueInWei) => {
      const weiValue = BigInt(valueInWei);
      
      if (weiValue === BigInt(0)) return '0 ETH';
      
      // For very small amounts (less than 0.000001 ETH), show in Wei
      if (weiValue < BigInt(1000000000000)) {  // 1e12 Wei = 1 Microether
        return formatWei(Number(weiValue));
      }
      
      // Convert to ETH string with full precision
      const ethValue = formatEther(valueInWei);
      if (Number(ethValue) < 1) return `${ethValue} ETH`;
      return `${Number(ethValue).toFixed(2)} ETH`;
    };

    return (
      <Card key={project.id} fluid style={{ boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
        <Image 
          src={`${process.env.NEXT_PUBLIC_IPFS_GW}/${project.imageCid}`} 
          wrapped 
          ui={false}
          style={{ 
            height: '240px', 
            objectFit: 'cover',
            backgroundColor: '#f9f9f9'
          }}
        />
        <Card.Content style={{ padding: '1.5em' }}>
          <Card.Header>{project.name}</Card.Header>
          <Card.Meta>by {truncateEthAddress(project.owner)}</Card.Meta>
          
          <Progress 
            percent={progress} 
            style={{ 
              margin: '1em 0',
              background: '#eee',
              height: '8px'
            }}
            color='blue'
            size='tiny'
          />
          
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column',
            gap: '0.5em',
            fontSize: '1.1em',
            marginBottom: '1em'
          }}>
            <div>Raised: {formatETH(project.currentBalance)}</div>
            <div>Goal: {formatETH(project.targetContribution)}</div>
          </div>

          <div style={{ 
            display: 'flex',
            alignItems: 'center',
            gap: '0.5em',
            color: '#666',
            marginBottom: '0.5em'
          }}>
            <Icon name='user' />
            <span>{project.contributorsCount} contributors</span>
          </div>
          <div style={{ color: '#666' }}>{formatDeadline(project.deadline)}</div>
        </Card.Content>

        <Link href={`/projects/${project.projectAddress}`} style={{ width: '100%' }}>
          <Button 
            fluid
            basic
            color='blue'
            style={{
              borderRadius: '0 0 4px 4px',
              borderTop: '1px solid #eee',
              height: '50px'
            }}
          >
            View Project <Icon name='arrow right' />
          </Button>
        </Link>
      </Card>
    );
  };

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
              {projects.map(renderProjectCard)}
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
  );
};

export default Index;