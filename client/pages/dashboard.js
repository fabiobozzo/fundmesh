import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Grid, Button, CardGroup, List, Divider, Segment, Dimmer, Loader, Image, Message, MessageHeader, Card, Label, Progress, Icon } from 'semantic-ui-react';
import Layout from '../components/Layout';
import { truncateEthAddress, formatEther, formatDeadline, getEtherscanUrl } from "@/utils/web3";
import { formatAmount, formatETH } from '@/utils/currency';
import { formatDistance } from 'date-fns';

const Index = () => {
  const [latestProjects, setLatestProjects] = useState([]);
  const [trendingProjects, setTrendingProjects] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchIpfsMetadataIfNeeded = async (project) => {
    // Try to fetch if we have a CID and either no image or it's untitled
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

  const fetchProjects = async () => {
    try {
      // Fetch more than 6 to have replacements
      const query = `
        query {
          trending: projects(
            first: 12,  
            orderBy: trendingScore,
            orderDirection: desc
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
            cancelled
          }
          latest: projects(
            first: 6,
            orderBy: createdAt,
            orderDirection: desc,
            where: { completed: false, cancelled: false }
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
            cancelled
          }
        }
      `;

      const response = await fetch(process.env.NEXT_PUBLIC_SUBGRAPH_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
      });

      const result = await response.json();
      if (result.errors) {
        throw new Error(result.errors[0].message);
      }

      if (!result.data) {
        throw new Error('Invalid response format from subgraph');
      }

      // Process latest projects first
      const latest = await Promise.all(
        result.data.latest.map(fetchIpfsMetadataIfNeeded)
      );
      setLatestProjects(latest);

      // Filter out duplicates from trending and take first 6
      const latestIds = new Set(latest.map(p => p.id));
      const uniqueTrending = result.data.trending
        .filter(p => !latestIds.has(p.id))
        .slice(0, 6);

      const trending = await Promise.all(
        uniqueTrending.map(fetchIpfsMetadataIfNeeded)
      );
      setTrendingProjects(trending);

    } catch (err) {
      console.error('Error fetching projects:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchActivities = async () => {
    const query = `
      query {
        activities(
          first: 12,
          orderBy: timestamp,
          orderDirection: desc
        ) {
          id
          type
          from
          amount
          balance
          timestamp
          project {
            id
            projectAddress
            name
            cid
          }
        }
      }
    `;

    try {
      const response = await fetch(process.env.NEXT_PUBLIC_SUBGRAPH_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
      });

      const result = await response.json();
      if (result.data) {
        // Process activities and fetch IPFS data for untitled projects
        const processedActivities = await Promise.all(
          result.data.activities.map(async (activity) => {
            if (activity.project && activity.project.name === 'Untitled Project' && activity.project.cid) {
              try {
                const response = await fetch(`${process.env.NEXT_PUBLIC_IPFS_GW}/${activity.project.cid}/properties.json`);
                if (response.ok) {
                  const metadata = await response.json();
                  return {
                    ...activity,
                    project: {
                      ...activity.project,
                      name: metadata.name
                    }
                  };
                }
              } catch (err) {
                console.error('Failed to fetch IPFS metadata for activity:', err);
              }
            }
            return activity;
          })
        );
        setActivities(processedActivities);
      }
    } catch (err) {
      console.error('Error fetching activities:', err);
    }
  };

  useEffect(() => {
    fetchProjects();
    fetchActivities();
  }, []);

  const getActivityIcon = (type) => {
    switch (type) {
      case 'PROJECT_CREATED': return 'plus circle';
      case 'CONTRIBUTION': return 'dollar';
      case 'PROJECT_APPROVAL_SUBMITTED': return 'check circle outline';
      case 'PROJECT_APPROVED': return 'check circle';
      case 'PROJECT_COMPLETED': return 'flag checkered';
      case 'MILESTONE_APPROVAL_SUBMITTED': return 'check circle outline';
      case 'MILESTONE_APPROVED': return 'check circle';
      case 'MILESTONE_COMPLETED': return 'flag';
      case 'REWARD_CLAIMED': return 'gift';
      default: return 'bell';
    }
  };

  const formatActivityText = (activity) => {
    const actor = activity.from ? (
      <a href={getEtherscanUrl(activity.from)} target="_blank" rel="noopener noreferrer" style={{ color: '#1e88e5' }}>
        {truncateEthAddress(activity.from)}
      </a>
    ) : 'Someone';
    
    const projectLink = activity.project ? (
      <Link href={`/projects/${activity.project.projectAddress}`} style={{ color: '#1e88e5' }}>
        {activity.project.name || 'Untitled Project'}
      </Link>
    ) : 'Unknown Project';
    
    const amount = activity.amount ? formatETH(activity.amount) : null;
    
    switch (activity.type) {
      case 'PROJECT_CREATED':
        return <>{actor} created {projectLink}</>;
      case 'CONTRIBUTION':
        return <>{actor} contributed {amount} ETH to {projectLink}</>;
      case 'PROJECT_CANCELLED':
        return <>{actor} cancelled {projectLink}</>;
      case 'PROJECT_COMPLETED':
        return <>{actor} completed {projectLink}</>;
      case 'PROJECT_APPROVAL_SUBMITTED':
        return <>{actor} submitted approval for {projectLink}</>;
      case 'PROJECT_APPROVED':
        return <>{actor} approved {projectLink}</>;
      case 'MILESTONE_APPROVAL_SUBMITTED':
        return <>{actor} submitted milestone approval for {projectLink}</>;
      case 'MILESTONE_APPROVED':
        return <>Milestone approved for {projectLink}</>;
      case 'MILESTONE_COMPLETED':
        return <>Milestone completed for {projectLink} with {amount} ETH</>;
      case 'REWARD_CLAIMED':
        return <>{actor} claimed NFT reward for {projectLink}</>;
      case 'PROJECT_EXPIRED':
        return <>{projectLink} expired</>;
      default:
        return <>{actor} interacted with {projectLink}</>;
    }
  };

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
            alt={`Project: ${project.name}`}
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
          <Card.Header>
            {project.name}
          </Card.Header>
          <Card.Meta>by {truncateEthAddress(project.owner)}</Card.Meta>
          
          <Progress 
            percent={progress} 
            style={{ 
              margin: '1em 0',
              background: '#eee',
              height: '8px'
            }}
            color={project.completed ? 'grey' : 'blue'}
            size='tiny'
          />
          
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column',
            gap: '0.5em',
            fontSize: '0.95em',
            marginBottom: '1em'
          }}>
            {project.completed ? (
              <div>Total Raised: {formatETH(project.currentBalance, 9)} ETH</div>
            ) : (
              <>
                <div>Raised: {formatETH(project.currentBalance, 9)} ETH</div>
                <div>Goal: {formatETH(project.targetContribution, 9)} ETH</div>
              </>
            )}
          </div>

          <div style={{ 
            display: 'flex',
            alignItems: 'center',
            gap: '0.5em',
            color: '#666'
          }}>
            <Icon name='user' />
            <span>{project.contributorsCount} contributors</span>
          </div>
          {!project.completed && (
            <div style={{ color: '#666', marginTop: '0.5em' }}>
              {formatDeadline(project.deadline)}
            </div>
          )}
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
            {latestProjects.length > 0 && (
              <>
                <h3>Latest Projects</h3>
                <CardGroup stackable itemsPerRow={3}>
                  {latestProjects.map(renderProjectCard)}
                </CardGroup>
              </>
            )}

            {trendingProjects.length > 0 && (
              <>
                <h3 style={{ marginTop: latestProjects.length ? '2em' : 0 }}>
                  Trending Projects
                </h3>
                <CardGroup stackable itemsPerRow={3}>
                  {trendingProjects.map(renderProjectCard)}
                </CardGroup>
              </>
            )}

            {!latestProjects.length && !trendingProjects.length && !loading && (
              <Message info>
                <Message.Header>No Projects Yet</Message.Header>
                <p>Be the first to create a project!</p>
              </Message>
            )}

            <Message hidden={error === ''} negative>
              <MessageHeader>An error has occurred while retrieving the projects.</MessageHeader>
              <p>{error}</p>
            </Message>

            <Segment hidden={!loading}>
              <Dimmer active inverted>
                <Loader />
              </Dimmer>
              <Image src='https://react.semantic-ui.com/images/wireframe/short-paragraph.png' alt="Empty projects" />
            </Segment>
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
            <List divided relaxed>
              {activities.map(activity => (
                <List.Item key={activity.id}>
                  <List.Content>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Icon name={getActivityIcon(activity.type)} />
                      <div>
                        <div style={{ fontSize: '0.9em' }}>
                          {formatActivityText(activity)}
                        </div>
                        <div style={{ fontSize: '0.8em', color: '#666' }}>
                          {formatDistance(Number(activity.timestamp) * 1000, new Date(), { addSuffix: true })}
                        </div>
                      </div>
                    </div>
                  </List.Content>
                </List.Item>
              ))}
            </List>
            {activities.length === 0 && !loading && (
              <Message info size="small">
                <p>No activities yet</p>
              </Message>
            )}
          </Grid.Column>
        </Grid.Row>
      </Grid>
    </Layout>
  );
};

export default Index;