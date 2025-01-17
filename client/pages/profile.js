import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Form, Button, Message, Grid, Header, Input, TextArea, Label, Icon, Image as UIImage, Popup } from 'semantic-ui-react';
import Layout from '@/components/Layout';
import { useWeb3 } from '@/web3/context';
import { UserRegistry } from '@/web3/contracts';
import { uploadFile, uploadFiles } from '@/ipfs/client';
import styles from './profile.module.css';

const Profile = () => {
  const router = useRouter();
  const { web3 } = useWeb3();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [profile, setProfile] = useState(null);
  const [vErrors, setVErrors] = useState({});
  const [formData, setFormData] = useState({
    name: '',
    bio: '',
    email: '',
    bsky: '',
    github: '',
    image: null,
    imageUrl: null
  });

  useEffect(() => {
    const fetchProfile = async () => {
      if (!web3) return;

      try {
        const accounts = await web3.eth.getAccounts();
        const userRegistry = UserRegistry(web3);

        const hasProfile = await userRegistry.methods.hasProfile(accounts[0]).call();
        if (hasProfile) {
          const profileData = await userRegistry.methods.getProfile(accounts[0]).call();
          if (profileData.exists) {
            const response = await fetch(`${process.env.NEXT_PUBLIC_IPFS_GW}/${profileData.profileCid}/profile.json`);
            const data = await response.json();
            setProfile(data);
            setFormData({
              ...data,
              image: null,
              imageUrl: data.imageCid ? `${process.env.NEXT_PUBLIC_IPFS_GW}/${data.imageCid}` : null
            });
          }
        }
      } catch (err) {
        console.error('Error fetching profile:', err);
        setError('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [web3]);

  useEffect(() => {
    return () => {
      if (formData.imageUrl && !formData.imageUrl.startsWith('http')) {
        URL.revokeObjectURL(formData.imageUrl);
      }
    };
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageChange = (e) => {
    if (formData.imageUrl && !formData.imageUrl.startsWith('http')) {
      URL.revokeObjectURL(formData.imageUrl);
    }
    if (e.target.files[0]) {
      setFormData({
        ...formData,
        image: e.target.files[0],
        imageUrl: URL.createObjectURL(e.target.files[0])
      });
    }
  };

  const validateForm = () => {
    let error = false;
    let newErrors = {};

    if (formData.image && (formData.image.size > 5000000 || formData.image.type !== 'image/png')) {
      newErrors.upload = 'Invalid image file. Please upload a PNG not bigger than 5M';
      error = true;
    }

    if (formData.name.trim() === '' || formData.name.length < 2) {
      newErrors.name = 'Name is required (min 2 characters)';
      error = true;
    }

    if (formData.email.trim() === '' || !formData.email.includes('@')) {
      newErrors.email = 'Valid email is required';
      error = true;
    }

    setVErrors(newErrors);
    return !error;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!web3) return;

    setSaving(true);
    setError('');

    if (!validateForm()) {
      setSaving(false);
      return;
    }

    try {
      const accounts = await web3.eth.getAccounts();
      
      // Upload image if present
      let imageCid;
      if (formData.image) {
        imageCid = await uploadFile(formData.image);
      }

      // Prepare profile data
      const profileData = {
        name: formData.name,
        bio: formData.bio,
        email: formData.email,
        bsky: formData.bsky,
        github: formData.github
      };

      if (imageCid || (profile && profile.imageCid)) {
        profileData.imageCid = imageCid || profile.imageCid;
      }

      // Upload to IPFS
      const files = [{
        path: '/profile.json',
        content: [new TextEncoder().encode(JSON.stringify(profileData))]
      }];
      
      const cid = await uploadFiles(files);
      if (!cid) throw new Error('Failed to upload to IPFS');

      // Update contract
      const userRegistry = UserRegistry(web3);
      await userRegistry.methods
        .updateProfile(accounts[0], cid)
        .send({ from: accounts[0] });

      router.push('/');
    } catch (err) {
      console.error('Error saving profile:', err);
      setError('Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  if (!web3) {
    return (
      <Layout>
        <Message warning>
          <Message.Header>Not Connected</Message.Header>
          <p>Please connect your wallet to view or update your profile.</p>
        </Message>
      </Layout>
    );
  }

  return (
    <Layout>
      <Grid>
        <Grid.Column width={16}>
          <Header as="h1">{profile ? 'Update Profile' : 'Create Profile'}</Header>
          <Form onSubmit={handleSubmit} error={!!error} loading={loading || saving}>
            <Grid stackable>
              <Grid.Row columns={2}>
                <Grid.Column>
                  <Form.Field>
                    <Label basic pointing='below'>Name *</Label>
                    <Input
                      name="name"
                      placeholder="Your name"
                      value={formData.name}
                      onChange={handleChange}
                    />
                    <p className={styles.validationErrorMessage}>{vErrors.name}</p>
                  </Form.Field>
                </Grid.Column>
                <Grid.Column>
                  <Form.Field>
                    <Label basic pointing='below'>Email *</Label>
                    <Input
                      name="email"
                      placeholder="Your email"
                      value={formData.email}
                      onChange={handleChange}
                    />
                    <p className={styles.validationErrorMessage}>{vErrors.email}</p>
                  </Form.Field>
                </Grid.Column>
              </Grid.Row>
              <Grid.Row columns={2}>
                <Grid.Column>
                  <Form.Field>
                    <Label basic pointing='below'>Bluesky</Label>
                    <Input
                      name="bsky"
                      placeholder="Your BSky handle"
                      value={formData.bsky}
                      onChange={handleChange}
                    />
                  </Form.Field>
                </Grid.Column>
                <Grid.Column>
                  <Form.Field>
                    <Label basic pointing='below'>GitHub</Label>
                    <Input
                      name="github"
                      placeholder="Your GitHub username"
                      value={formData.github}
                      onChange={handleChange}
                    />
                  </Form.Field>
                </Grid.Column>
              </Grid.Row>
              <Grid.Row columns={2}>
                <Grid.Column>
                  <Form.Field>
                    <Popup
                      trigger={<Label basic pointing='below'><Icon name="image" />Profile Picture</Label>}
                      content="A PNG image file (max. 5M) for your profile"
                      basic
                    />
                    <Label as="label" basic htmlFor="upload" style={{ cursor: 'pointer' }}>
                      <Icon name="camera" />
                      Upload
                    </Label>
                    <input id="upload" hidden type="file" onChange={handleImageChange} />
                    <p className={styles.validationErrorMessage}>{vErrors.upload}</p>
                    <UIImage 
                      src={formData.imageUrl || '/camera.png'} 
                      size="tiny" 
                      style={{ marginTop: '1em' }}
                    />
                  </Form.Field>
                </Grid.Column>
                <Grid.Column>
                  <Form.Field>
                    <Label basic pointing='below'>Bio</Label>
                    <TextArea
                      name="bio"
                      placeholder="Tell us about yourself"
                      value={formData.bio}
                      onChange={handleChange}
                      rows={5}
                    />
                  </Form.Field>
                </Grid.Column>
              </Grid.Row>
            </Grid>
            {error && <Message error content={error} />}
            <div style={{ marginTop: '2em', textAlign: 'right' }}>
              <Button primary type="submit" loading={saving}>
                {profile ? 'Update Profile' : 'Create Profile'}
              </Button>
            </div>
          </Form>
        </Grid.Column>
      </Grid>
    </Layout>
  );
};

export default Profile; 