import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Form, Input, Button, TextArea, Label, Icon, Image as UIImage, Grid, Divider, Container, Message, Popup } from 'semantic-ui-react';
import DatePicker from 'react-datepicker';
import Layout from '@/components/Layout';
import { uploadFiles } from '@/ipfs/client';
import { fileToIterable } from '@/utils/files';
import { isPosInt, isPosNum } from '@/utils/numbers';
import { isAddress } from 'web3-validator';
import { useWeb3 } from '@/web3/context';
import { Factory } from '@/web3/contracts';

import 'react-datepicker/dist/react-datepicker.css';
import styles from './create.module.css';

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

    let files = [
      {
        path: '/data.json',
        content: [new TextEncoder().encode(JSON.stringify({ name: values.name, description: values.description }))],
      },
    ];

    if (values.image) {
      files.push({
        path: '/image.png',
        content: fileToIterable(values.image),
      });
    }

    let cid;
    try {
      cid = await uploadFiles(files);
    } catch (err) {
      console.log('ipfs upload error:', err);
    }

    try {
      const accounts = await web3.eth.getAccounts();
      const factory = Factory(web3);
      await factory.methods
        .createProject(
          values.recipient,
          cid,
          values.minimumContribution,
          values.targetContribution,
          deadlineTimestamp,
          nftName,
          nftSymbol
        )
        .send({ from: accounts[0] });
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

    if (values.name.trim() === '' || values.name.length < 5) {
      newErrors.name = 'Name is required to be at least 5 characters';
      error = true;
    }

    if (typeof values.deadline.getTime === 'undefined') {
      newErrors.deadline = 'Deadline is required to be a valid calendar date/time';
      error = true;
    }

    if (values.recipient.trim() === '' || !isAddress(values.recipient)) {
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
                  content="A picture (PNG|SVG|JPG) that really represent your funding goal"
                  basic
                />
                <Label as="label" basic htmlFor="upload" style={{ cursor: 'pointer' }}>
                  <Icon name="camera" />
                  Upload
                </Label>
                <input id="upload" hidden type="file" onChange={handleImageChange} />
                <UIImage src={values.imageUrl || '/camera.png'} size="small" centered />
              </Form.Field>
            </Grid.Column>
            <Grid.Column>
              <Form.Field>
                <Popup
                  trigger={<Label basic pointing='below'><Icon name="question circle outline" />Name</Label>}
                  content="A short and effective name of the project to raise funds for"
                  basic
                />
                <Input name="name" value={values.name} onChange={handleChange} />
                <p className={styles.validationErrorMessage}>{vErrors.name}</p>
              </Form.Field>
              <Form.Field>
                <label>Description</label>
                <TextArea name="description" value={values.description} onChange={handleChange} rows={5} />
              </Form.Field>
            </Grid.Column>
          </Grid.Row>
          <Grid.Row columns={2}>
            <Grid.Column>
              <Form.Field>
                <label>Recipient Address</label>
                <Input name="recipient" value={values.recipient} onChange={handleChange} />
                <p className={styles.validationErrorMessage}>{vErrors.recipient}</p>
              </Form.Field>
              <Form.Field>
                <label>Minimum Contribution</label>
                <Input name="minimumContribution" value={values.minimumContribution} onChange={handleChange} label="Wei" labelPosition='right' />
                <p className={styles.validationErrorMessage}>{vErrors.minimumContribution}</p>
              </Form.Field>
            </Grid.Column>
            <Grid.Column>
              <Form.Field>
                <label>Target Contribution</label>
                <Input name="targetContribution" value={values.targetContribution} onChange={handleChange} label="Eth" labelPosition='right' />
                <p className={styles.validationErrorMessage}>{vErrors.targetContribution}</p>
              </Form.Field>
              <Form.Field>
                <label>Deadline</label>
                {/* <Input name="deadline" value={values.deadline} onChange={handleChange} /> */}
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
                <label>NFT Name Prefix</label>
                <Input name="nftName" value={values.nftName} onChange={handleChange} />
              </Form.Field>
            </Grid.Column>
            <Grid.Column>
              <Form.Field>
                <label>NFT Symbol Prefix</label>
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