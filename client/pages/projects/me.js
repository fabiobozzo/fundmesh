import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useWeb3 } from '@/web3/context';
import Layout from '@/components/Layout';
import { Grid, Button, CardGroup, Segment, Dimmer, Loader, Image, Message, MessageHeader, Card, Label } from 'semantic-ui-react';
import { truncateEthAddress } from "@/utils/web3";

const MyProjects = () => {
  const router = useRouter();
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
              cid
              createdAt
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
        const projectsWithMetadata = await Promise.all(
          data.projects.map(async (project) => {
            const response = await fetch(`${process.env.NEXT_PUBLIC_IPFS_GW}/${project.cid}/properties.json`);
            if (!response.ok) return project;
            
            const metadata = await response.json();
            return {
              ...project,
              name: metadata.name,
              description: metadata.description,
              imageCid: metadata.imageCid
            };
          })
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

  return (
    <Layout>
      <Grid>
        <Grid.Row>
          <Grid.Column>
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
                <p>You haven't created any projects yet. 
                  <Link href="/projects/create"> Create your first project!</Link>
                </p>
              </Message>
            ) : (
              <CardGroup stackable itemsPerRow={3}>
                {projects.map((project) => (
                  <Card key={project.id}>
                    <Image src={`${process.env.NEXT_PUBLIC_IPFS_GW}/${project.imageCid}`} wrapped ui={false} />
                    <Card.Content>
                      <Card.Header>{project.name || `Project #${project.id}`}</Card.Header>
                      <Card.Meta>{truncateEthAddress(project.projectAddress)}</Card.Meta>
                      <Card.Description>{project.description}</Card.Description>
                    </Card.Content>
                    <Card.Content extra>
                      <Link href={`/projects/${project.projectAddress}`}>View Project →</Link>
                    </Card.Content>
                  </Card>
                ))}
              </CardGroup>
            )}
          </Grid.Column>
        </Grid.Row>
      </Grid>
    </Layout>
  );
};

export default MyProjects;