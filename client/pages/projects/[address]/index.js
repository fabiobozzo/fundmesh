import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import { useWeb3 } from '@/web3/context';
import { Project } from '@/web3/contracts';
import { Message, MessageHeader, TableCell, Segment, Dimmer, Image, Loader, Table, TableBody, TableRow, Grid, Icon, Divider, Button, Container, Form, Input, Dropdown, GridColumn, GridRow } from 'semantic-ui-react';

const CreateProject = () => {
  const router = useRouter();
  const { web3 } = useWeb3();
  const { address } = router.query;

  const [values, setValues] = useState({
    amount: '',
    unit: 'wei'
  });
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({});
  const [metadata, setMetadata] = useState({ name: '', description: '' });
  const [error, setError] = useState('');
  const [tLoading, setTLoading] = useState(false);
  const [tError, setTError] = useState('');
  const [tContributed, setTContributed] = useState(false);

  const dtFormatter = new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short'
  });

  useEffect(() => {
    if (web3 && address) {
      const fetchSummary = async () => {
        try {
          const project = Project(web3, address);
          const summary = await project.methods.getSummary().call();
          setSummary(summary);

          const cid = summary[2];
          const response = await fetch(`https://ipfs.io/ipfs/${cid}/data.json`);
          if (!response.ok) {
            console.error('failed to fetch metadata from IPFS:', response.statusText);
            setMetadata({ name: 'N/A', description: 'N/A' });
          } else {
            setMetadata(await response.json());
          }
        } catch (err) {
          setError(err.message);
        } finally {
          setLoading(false);
        }
      };
      fetchSummary();
    }
  }, [web3, address]);

  const handleChange = (e, { name, value }) => {
    setValues({ ...values, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setTContributed(false);
      setTLoading(true);
      const amount = values.unit.toLowerCase() == 'wei' ? values.amount : web3.utils.toWei(values.amount, 'ether');
      const accounts = await web3.eth.getAccounts();
      const project = Project(web3, address);
      await project.methods
        .contribute()
        .send({
          from: accounts[0],
          value: amount
        });
      setTContributed(true);
    } catch (err) {
      setTError(err.message);
    } finally {
      setTLoading(false);
    }
  };

  return (
    <Layout>
      <h3>{metadata.name !== '' ? metadata.name : 'Project Details'}</h3>
      <Message hidden={error === ''} negative>
        <MessageHeader>An error has occurred while retrieving the project details.</MessageHeader>
        <p>{error}</p>
      </Message>
      <Segment hidden={!loading}>
        <Dimmer active inverted>
          <Loader />
        </Dimmer>
        <Image src='https://react.semantic-ui.com/images/wireframe/short-paragraph.png' />
      </Segment>

      <Grid>
        <Grid.Column width={6} hidden={summary[2] === ''}>
          <Image src={`https://ipfs.io/ipfs/${summary[2]}/image.png`} size='medium' hidden={error !== '' || loading} />
        </Grid.Column>
        <Grid.Column width={10}>
          <Table basic='very' celled collapsing hidden={error !== '' || loading}>
            <TableBody>
              <TableRow>
                <TableCell>Description</TableCell>
                <TableCell>{metadata.description}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Address</TableCell>
                <TableCell>{address}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Recipient</TableCell>
                <TableCell>{summary[1]}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Progress</TableCell>
                <TableCell>
                  {web3 && summary[0] !== undefined
                    ? `${web3.utils.fromWei(summary[0], 'ether').replace(/\.$/, "")} / ${web3.utils.fromWei(summary[4], 'ether')} ETH`
                    : '...'}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Minimum Contribution</TableCell>
                <TableCell>{summary[3] ? `${summary[3]} WEI` : '...'}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Deadline</TableCell>
                <TableCell>{summary[5] && summary[5] !== 0n ? dtFormatter.format(new Date(Number(summary[5]) * 1000)) : 'None'}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Contributors</TableCell>
                <TableCell>{summary[6] !== undefined ? Number(summary[6]) : '...'}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Approved</TableCell>
                <TableCell>
                  {summary[7]
                    ? <p><Icon loading name='checkmark' /> ({dtFormatter.format(new Date(Number(summary[8]) * 1000))})</p>
                    : 'No'}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Completed</TableCell>
                <TableCell>
                  {summary[10]
                    ? <p><Icon loading name='checkmark' /> ({dtFormatter.format(new Date(Number(summary[11]) * 1000))})</p>
                    : 'No'}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </Grid.Column>
      </Grid>
      <Divider horizontal><Icon name='down arrow' /></Divider>
      <Container textAlign='center'>
        <Form onSubmit={handleSubmit} error={tError !== ''}>
          <Grid>
            <GridRow centered columns={3}>
              <GridColumn textAlign='center'>
                <Input
                  name='amount'
                  label={<Dropdown name='unit' defaultValue={values.unit} onChange={handleChange} options={[{ key: 'wei', value: 'wei', text: 'WEI' }, { key: 'eth', value: 'eth', text: 'ETH' }]} />}
                  onChange={handleChange}
                  labelPosition='right'
                  placeholder='0'
                  disabled={tLoading}
                  value={values.amount}
                />
              </GridColumn>
              <GridColumn textAlign='left'>
                <Button primary icon labelPosition='left' loading={tLoading} disabled={tLoading}>
                  <Icon name='money' />
                  Contribute
                </Button>
              </GridColumn>
            </GridRow>
          </Grid>
          <Message error content={tError} />
          <Message info hidden={!tContributed}>
            <MessageHeader>Thank you!</MessageHeader>
            <p>Your contribution to this project is remarkable.</p>
            <p>You will be able to mint a commemorative NFT once the funding goal is reached.</p>
          </Message>
        </Form>
      </Container>
    </Layout>
  );
};

export default CreateProject;