import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Form, Input, Button, TextArea, Label, Icon, Image as UIImage, Grid, Divider, Container, Message, Popup } from 'semantic-ui-react';
import DatePicker from 'react-datepicker';
import Layout from '@/components/Layout';
import { uploadFile, uploadFiles } from '@/ipfs/client';
import { fileToIterable } from '@/utils/files';
import { isPosInt, isPosNum } from '@/utils/numbers';
import { isAddress } from 'web3-validator';
import { useWeb3 } from '@/web3/context';
import { Factory } from '@/web3/contracts';

import 'react-datepicker/dist/react-datepicker.css';
import styles from './create.module.css';
import { errors } from 'web3';

const CreateProject = () => {
  const router = useRouter();
  const { web3 } = useWeb3();

  const [values, setValues] = useState({
    recipient: '',
    minimumContribution: '',
    targetContribution: '',
    deadline: '',
    nftName: '',
    nftSymbol: '',
    name: '',
    description: '',
    image: null,
    imageUrl: null
  });
  const [vErrors, setVErrors] = useState({});
  const [tError, setTError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    return () => {
      if (values.imageUrl) {
        URL.revokeObjectURL(values.imageUrl);
      }
    };
  }, []);

  const handleChange = (e) => {
    setValues({ ...values, [e.target.name]: e.target.value });
  };

  const handleImageChange = (e) => {
    if (values.imageUrl) {
      URL.revokeObjectURL(values.imageUrl);
    }
    if (e.target.files[0]) {
      setValues({
        ...values,
        image: e.target.files[0],
        imageUrl: URL.createObjectURL(e.target.files[0])
      });
    }
  };

  const handleDateChange = (date) => {
    setValues({ ...values, deadline: date });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);
    setTError('');

    if (!validateForm()) {
      setLoading(false);
      return
    }

    const deadlineTimestamp = Math.floor(values.deadline.getTime() / 1000);
    const nftName = values.nftName.trim() === '' ? values.name.substring(0, 10) : values.nftName;
    const nftSymbol = values.nftSymbol.trim() === '' ? values.name.substring(0, 4) : values.nftSymbol;

    const cid = await uploadAssetsToIpfs();

    try {
      const accounts = await web3.eth.getAccounts();
      const factory = Factory(web3);

      const recipient = values.recipient === '' ? accounts[0] : values.recipient;
      const targetContribution = web3.utils.toWei(values.targetContribution, 'ether');

      await factory.methods
        .createProject(
          recipient,
          cid,
          values.minimumContribution,
          targetContribution,
          deadlineTimestamp,
          nftName,
          nftSymbol
        )
        .send({ from: accounts[0] });

      const events = await factory.getPastEvents('ProjectCreated', {
        fromBlock: 'latest',
        toBlock: 'latest'
      });
      events.forEach(e => {
        if (e.returnValues.creator === accounts[0]) {
          router.push(`/projects/${e.returnValues.projectAddress}`);
        }
      });

      router.push(`/`);

    } catch (err) {
      setTError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    let error = false;
    let newErrors = {};

    if (values.image && (values.image.size > 5000000 || values.image.type !== 'image/png')) {
      newErrors.upload = 'Invalid image file. Please upload a PNG not bigger than 5M';
      error = true;
    }

    if (values.name.trim() === '' || values.name.length < 5) {
      newErrors.name = 'Name is required to be at least 5 characters';
      error = true;
    }

    if (typeof values.deadline.getTime === 'undefined') {
      newErrors.deadline = 'Deadline is required to be a valid calendar date/time';
      error = true;
    } else if (values.deadline.getTime() < Date.now()) {
      newErrors.deadline = 'Deadline must be in the future';
      error = true;
    }

    if (values.recipient.trim() !== '' && !isAddress(values.recipient)) {
      newErrors.recipient = 'Recipient must be a valid Ethereum address';
      error = true;
    }

    if (!isPosInt(values.minimumContribution)) {
      newErrors.minimumContribution = 'Minimum contribution must be greater or equal zero';
      error = true;
    }

    if (!isPosNum(values.targetContribution)) {
      newErrors.targetContribution = 'Target contribution must be greater than zero';
      error = true;
    }

    setVErrors(newErrors);

    return !error
  }

  const uploadAssetsToIpfs = async () => {
    try {
      let imageCid;
      if (values.image) {
        imageCid = await uploadFile(values.image);
      }

      const properties = { 
        name: values.name, 
        description: values.description
      };
      const nftMetadata = {
        name: values.name,
        description: values.description,
        attributes: {
          origin: 'Fundmesh'
        }
      };
      if (imageCid) {
        properties['imageCid'] = imageCid;
        nftMetadata['image'] = `ipfs://${imageCid}`;
      }

      let files = [
        { path: '/properties.json', content: [new TextEncoder().encode(JSON.stringify(properties))] },
        { path: '/metadata.json', content: [new TextEncoder().encode(JSON.stringify(nftMetadata))] }
      ];

      return await uploadFiles(files);
    } catch (err) {
      console.log('IPFS upload error:', err);
      return '';
    } 
  };

  return (
    <Layout>
      <h3>Create new Project</h3>
      <Form onSubmit={handleSubmit} error={tError !== ''}>
        <Grid stackable>
          <Grid.Row columns={2}>
            <Grid.Column>
              <Form.Field>
                <Popup
                  trigger={<Label basic pointing='below'><Icon name="question circle outline" />Image</Label>}
                  content="A PNG image file (max. 5M) that really represent your funding goal."
                  basic
                />
                <Label as="label" basic htmlFor="upload" style={{ cursor: 'pointer' }}>
                  <Icon name="camera" />
                  Upload
                </Label>
                <input id="upload" hidden type="file" onChange={handleImageChange} />
                <p className={styles.validationErrorMessage}>{vErrors.upload}</p>
                <UIImage src={values.imageUrl || '/camera.png'} size="small" centered />
              </Form.Field>
            </Grid.Column>
            <Grid.Column>
              <Form.Field>
                <Popup
                  trigger={<Label basic pointing='below'><Icon name="question circle outline" />Name</Label>}
                  content="A short but effective name of the project to raise funds for."
                  basic
                />
                <Input name="name" value={values.name} onChange={handleChange} />
                <p className={styles.validationErrorMessage}>{vErrors.name}</p>
              </Form.Field>
              <Form.Field>
                <Popup
                  trigger={<Label basic pointing='below'><Icon name="question circle outline" />Description</Label>}
                  content="Pitch your project here. Explain in detail what's its goal, and what the raised funds will be used for."
                  basic
                />
                <TextArea name="description" value={values.description} onChange={handleChange} rows={5} />
              </Form.Field>
            </Grid.Column>
          </Grid.Row>
          <Grid.Row columns={2}>
            <Grid.Column>
              <Form.Field>
                <Popup
                  trigger={<Label basic pointing='below'><Icon name="question circle outline" />Recipient Address</Label>}
                  content="In case the recipient of the raised funds is different than you -i.e. the project creator- specify their address here."
                  basic
                />
                <Input name="recipient" value={values.recipient} onChange={handleChange} />
                <p className={styles.validationErrorMessage}>{vErrors.recipient}</p>
              </Form.Field>
              <Form.Field>
                <Popup
                  trigger={<Label basic pointing='below'><Icon name="question circle outline" />Minimum Contribution</Label>}
                  content="If specified, contributor could not transfer less than this amount (in WEI) to the project."
                  basic
                />
                <Input name="minimumContribution" value={values.minimumContribution} onChange={handleChange} label="Wei" labelPosition='right' />
                <p className={styles.validationErrorMessage}>{vErrors.minimumContribution}</p>
              </Form.Field>
            </Grid.Column>
            <Grid.Column>
              <Form.Field>
                <Popup
                  trigger={<Label basic pointing='below'><Icon name="question circle outline" />Target Contribution</Label>}
                  content="The amount (in ETH) to reach to complete the project and transfer the raised funds to the recipient."
                  basic
                />
                <Input name="targetContribution" value={values.targetContribution} onChange={handleChange} label="Eth" labelPosition='right' />
                <p className={styles.validationErrorMessage}>{vErrors.targetContribution}</p>
              </Form.Field>
              <Form.Field>
                <Popup
                  trigger={<Label basic pointing='below'><Icon name="question circle outline" />Deadline</Label>}
                  content="The date/time until which the project is open to contributions."
                  basic
                />
                <DatePicker
                  label={{ icon: 'calendar' }}
                  labelPosition='right'
                  name='deadline'
                  selected={values.deadline}
                  onChange={handleDateChange}
                  showTimeSelect
                  dateFormat="Pp"
                  wrapperClassName={styles.datePickerWrapper}
                  className={styles.datePickerInputContainer}
                />
                <p className={styles.validationErrorMessage}>{vErrors.deadline}</p>
              </Form.Field>
            </Grid.Column>
          </Grid.Row>
          <Grid.Row columns={2}>
            <Grid.Column>
              <Form.Field>
                <Popup
                  trigger={<Label basic pointing='below'><Icon name="question circle outline" />NFT Name Prefix</Label>}
                  content="The short text that represents the commemorative NFT given to project contributors."
                  basic
                />
                <Input name="nftName" value={values.nftName} onChange={handleChange} />
              </Form.Field>
            </Grid.Column>
            <Grid.Column>
              <Form.Field>
                <Popup
                  trigger={<Label basic pointing='below'><Icon name="question circle outline" />NFT Symbol Prefix</Label>}
                  content="The short string (max 8 chars) representing the commemorative NFT."
                  basic
                />
                <Input name="nftSymbol" value={values.nftSymbol} onChange={handleChange} />
              </Form.Field>
            </Grid.Column>
          </Grid.Row>
        </Grid>
        <Divider horizontal><Icon name='down arrow' /></Divider>
        <Container textAlign='center'>
          <Button primary icon labelPosition='right' type="submit" loading={loading} disabled={loading}>
            <Icon name='checkmark' />
            Confirm
          </Button>
          <Message error content={tError} />
        </Container>
      </Form>
    </Layout>
  );
};

export default CreateProject;