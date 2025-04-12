import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Grid, Button, CardGroup, Segment, Dimmer, Loader, Image, Message, MessageHeader, Card, Progress, Icon, Label } from 'semantic-ui-react';
import Layout from '@/components/Layout';
import { truncateEthAddress, formatDeadline } from "@/utils/web3";
import { formatETH } from '@/utils/currency';
import { useWeb3 } from '@/web3/context';

const MyProjects = () => {
  const { web3 } = useWeb3();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchProjects = async () => {
      if (!web3) return;

      try {
        const accounts = await web3.eth.getAccounts();
        const owner = accounts[0].toLowerCase();

        const query = `
          query($owner: Bytes!) {
            projects(where: { owner: $owner }, orderBy: createdAt, orderDirection: desc) {
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
              cancelled
            }
          }
        `;

        const response = await fetch(process.env.NEXT_PUBLIC_SUBGRAPH_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query,
            variables: { owner }
          })
        });

        const { data } = await response.json();
        
        // Fetch IPFS metadata for each project
        const fetchIpfsMetadataIfNeeded = async (project) => {
          if (project.cid && (!project.imageCid || project.name === 'Untitled Project')) {
            try {
              const response = await fetch(`${process.env.NEXT_PUBLIC_IPFS_GW}/${project.cid}/properties.json`);
              if (response.ok) {
                const metadata = await response.json();
                return {
                  ...project,
                  name: project.name === 'Untitled Project' ? metadata.name : project.name,
                  description: project.description || metadata.description,
                  imageCid: project.imageCid || metadata.imageCid
                };
              }
            } catch (err) {
              console.error('Failed to fetch IPFS metadata:', err);
            }
          }
          return project;
        };

        const projectsWithMetadata = await Promise.all(
          data.projects.map(fetchIpfsMetadataIfNeeded)
        );

        setProjects(projectsWithMetadata);
      } catch (err) {
        console.error('Error fetching projects:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, [web3]);

  const renderProjectCard = (project) => {
    const progress = Math.round(Number(project.progressRatio) * 100);
    
    return (
      <Card key={project.id} fluid style={{ boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
        <div style={{ position: 'relative', height: '240px' }}>
          <Image 
            src={project.imageCid ? `${process.env.NEXT_PUBLIC_IPFS_GW}/${project.imageCid}` : '/placeholder.png'} 
            style={{ 
              height: '100%',
              width: '100%',
              objectFit: 'cover',
              backgroundColor: '#f9f9f9'
            }}
          />
          {project.completed && (
            <Label 
              color='green' 
              size='small'
              style={{ 
                position: 'absolute',
                top: '10px',
                right: '10px',
                zIndex: 1
              }}
            >
              ✓ Completed
            </Label>
          )}
          {project.cancelled && (
            <Label 
              color='red' 
              size='small'
              style={{ 
                position: 'absolute',
                top: '10px',
                right: '10px',
                zIndex: 1
              }}
            >
              ✕ Cancelled
            </Label>
          )}
        </div>
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
            fontSize: '0.95em',
            marginBottom: '1em'
          }}>
            <div>Raised: {formatETH(project.currentBalance, 9)} ETH</div>
            <div>Goal: {formatETH(project.targetContribution, 9)} ETH</div>
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
          <Grid.Column width={16}>
            <h3>My Projects</h3>
            <Message hidden={error === ''} negative>
              <MessageHeader>An error has occurred while retrieving your projects.</MessageHeader>
              <p>{error}</p>
            </Message>
            <Segment hidden={!loading}>
              <Dimmer active inverted>
                <Loader />
              </Dimmer>
              <Image src='https://react.semantic-ui.com/images/wireframe/short-paragraph.png' />
            </Segment>
            {!loading && projects.length === 0 ? (
              <Message info>
                <MessageHeader>No projects found</MessageHeader>
                <p>You haven&apos;t created any projects yet. 
                  <Link href="/projects/create"> Create your first project!</Link>
                </p>
              </Message>
            ) : (
              <CardGroup stackable itemsPerRow={4}>
                {projects.map(renderProjectCard)}
              </CardGroup>
            )}
          </Grid.Column>
        </Grid.Row>
      </Grid>
    </Layout>
  );
};

export default MyProjects;