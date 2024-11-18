import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import { useWeb3 } from '@/web3/context';
import { Project, ProjectNFT } from '@/web3/contracts';
import { Message, MessageHeader, TableCell, Segment, Dimmer, Image, Loader, Table, TableBody, TableRow, Grid, Icon, Divider, Button, Container, Form, Input, Dropdown, GridColumn, GridRow, FormField } from 'semantic-ui-react';
import VerticalSpacer from '@/components/VerticalSpacer';

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
  const [contribution, setContribution] = useState(-1);
  const [approval, setApproval] = useState(-1);
  const [rewardTokenURI, setRewardTokenURI] = useState(false);
  const [nftTx, setNftTx] = useState('');
  const [metadata, setMetadata] = useState({ name: '', description: '' });
  const [error, setError] = useState('');
  const [tLoading, setTLoading] = useState(false);
  const [tContributeError, setTContributeError] = useState('');
  const [tContributed, setTContributed] = useState(false);
  const [tApproveError, setTApproveError] = useState('');
  const [tApproved, setTApproved] = useState(false);
  const [tRewardError, setTRewardError] = useState('');
  const [tRewarded, setTRewarded] = useState(false);

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
          const accounts = await web3.eth.getAccounts();

          const project = Project(web3, address);
          const summary = await project.methods.getSummary().call();
          setSummary(summary);

          const contribution = await project.methods.getContribution(accounts[0]).call();
          setContribution(contribution);

          const approval = await project.methods.getApproval(accounts[0]).call();
          setApproval(approval);

          const reward = await project.methods.getReward(accounts[0]).call();
          if (1 in reward) {
            setRewardTokenURI(reward[1]);
          }
          if (0 in reward) {
            const nftAddress = await project.methods.nft().call();
            const nft = ProjectNFT(web3, nftAddress);
            const nftEvents = await nft.getPastEvents('Transfer', {
              filter: { tokenId: reward[0] },
              fromBlock: 0, 
              toBlock: 'latest'
            });
            if (nftEvents.length > 0) {
              setNftTx(nftEvents[0].transactionHash);
            }
          }

          const cid = summary[2];
          const response = await fetch(`${process.env.NEXT_PUBLIC_IPFS_GW}/${cid}/properties.json`);
          if (!response.ok) {
            console.error('failed to fetch metadata from IPFS:', response.statusText);
            setMetadata({ name: 'N/A', description: 'N/A', imageCid: '' });
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

  const handleContribute = async (e) => {
    e.preventDefault();

    try {
      setTContributed(false);
      setTLoading(true);
      resetErrors();
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
      setTContributeError(err.message);
    } finally {
      setTLoading(false);
    }
  };

  const handleApproval = async (e) => {
    e.preventDefault();

    try {
      setTApproved(false);
      setTLoading(true);
      resetErrors();
      const accounts = await web3.eth.getAccounts();
      const project = Project(web3, address);
      await project.methods.approve().send({ from: accounts[0], });
      setTApproved(true);
    } catch (err) {
      setTApproveError(err.message);
    } finally {
      setTLoading(false);
    }
  };

  const handleReward = async (e) => {
    e.preventDefault();

    try {
      setTRewarded(false);
      setTLoading(true);
      resetErrors();
      const accounts = await web3.eth.getAccounts();
      const project = Project(web3, address);
      const tokenURI = `ipfs://${summary[2]}/metadata.json`;
      await project.methods.reward(tokenURI).send({ from: accounts[0], });
      setTRewarded(true);
    } catch (err) {
      setTRewardError(err.message);
    } finally {
      setTLoading(false);
    }
  };

  const onChangeContribution = (e, { name, value }) => {
    setValues({ ...values, [name]: value });
  };

  const resetErrors = () => {
    setError('');
    setTContributeError('');
    setTApproveError('');
    setTRewardError('');
  };

  const renderApprovalButton = () => {
    // Ensure web3 is initialized and summary[0] is defined
    if (!web3 || summary[0] === undefined) {
      return '';
    }

    // Check if target reached: balance >= targetContribution
    if (summary[0] < summary[4]) {
      return `Once the target contribution of ${web3.utils.fromWei(summary[4], 'ether')} ETH will be reached, it will be possible to approve the funds withdrawal, and contributors could get a NFT reward.`;
    }

    // Check if the whole project has not been approved yet
    if (summary[7]) {
      return 'The project is approved! ✅';
    }

    if (contribution <= 0) {
      return 'Only project contributors able to approve it and become eligible for a NFT reward.';
    }

    if (approval > 0) {
      return 'You already approved this project.';
    }

    return (
      <Button primary icon labelPosition='left' loading={tLoading} disabled={tLoading}>
        <Icon name='check' />Approve
      </Button>
    );
  };

  const renderRewardButton = () => {
    // Ensure web3 is initialized, summary[0] is defined, target is reached, project approved, and user is a contributor
    if (web3 && summary[0] !== undefined && summary[0] >= summary[4] && summary[7] && contribution > 0) {
      // Check if the reward has not been claimed
      if (rewardTokenURI) {
        return (
          <div>
            <p>Congrats for getting the NFT reward for this project:</p>
            <p>- Transaction hash: {nftTx}</p>
            <p>- Token URI: {rewardTokenURI}</p>
          </div>
        );
      }

      return (
        <Button primary icon labelPosition='left' loading={tLoading} disabled={tLoading}>
          <Icon name='gift' />Mint NFT
        </Button>
      );
    }

    return '';
  }

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
          <Image src={`${process.env.NEXT_PUBLIC_IPFS_GW}/${metadata.imageCid}`} size='medium' hidden={error !== '' || loading} />
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
                    ? <>
                      {web3.utils.fromWei(summary[0], 'ether').replace(/\.$/, "")} / {web3.utils.fromWei(summary[4], 'ether')} ETH
                      {(Number(summary[0]) >= Number(summary[4])) && <Icon name='check' />}
                    </>
                    : '...'
                  }
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
        <Grid>
          <GridRow centered columns={2}>
            <GridColumn textAlign='center'>

              <Form onSubmit={handleContribute} error={tContributeError !== ''}>
                <FormField>
                  <Input
                    name='amount'
                    label={<Dropdown name='unit' defaultValue={values.unit} onChange={onChangeContribution} options={[{ key: 'wei', value: 'wei', text: 'WEI' }, { key: 'eth', value: 'eth', text: 'ETH' }]} />}
                    onChange={onChangeContribution}
                    labelPosition='right'
                    placeholder='0'
                    disabled={tLoading}
                    value={values.amount}
                  />
                </FormField>
                <Button primary icon labelPosition='left' loading={tLoading} disabled={tLoading}>
                  <Icon name='money' />
                  Contribute
                </Button>
                <Message error content={tContributeError} />
                <Message info hidden={!tContributed}>
                  <MessageHeader>Thank you!</MessageHeader>
                  <p>Your contribution to this project is remarkable.</p>
                  <p>Once the funding goal is reached, you could decide whether to approve the funds withdrawal by the owner.</p>
                </Message>
              </Form>

            </GridColumn>
            <GridColumn textAlign='center'>

              <Form onSubmit={handleApproval} error={tApproveError !== ''}>
                {renderApprovalButton()}
                <Message error content={tApproveError} />
                <Message info hidden={!tApproved}>
                  <MessageHeader>Thank you!</MessageHeader>
                  <p>Your approval to this project means a lot to the owner! ❤️</p>
                  <p>Once the majority of contributors will approve the project, you will be able to mint a commemorative NFT.</p>
                </Message>
              </Form>
              <VerticalSpacer height="20px" />

              <Form onSubmit={handleReward} error={tRewardError !== ''}>
                {renderRewardButton()}
                <Message error content={tRewardError} />
                <Message info hidden={!tRewarded}>
                  <MessageHeader>Thank you!</MessageHeader>
                  <p>Here's a commemorative NFT to reward you for your commitment to this project!</p>
                </Message>
              </Form>

            </GridColumn>
          </GridRow>
        </Grid>
      </Container>
    </Layout>
  );
};

export default CreateProject;