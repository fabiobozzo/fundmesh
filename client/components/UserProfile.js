import React, { useState, useEffect } from 'react';
import { Label, Popup, Image, Icon } from 'semantic-ui-react';
import { truncateEthAddress } from '@/utils/web3';
import { UserRegistry } from '@/web3/contracts';

const UserProfile = ({ web3, address, label }) => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!web3 || !address) return;
      
      try {
        const registry = UserRegistry(web3);
        const userProfile = await registry.methods.getProfile(address).call();
        
        if (userProfile.exists) {
          const response = await fetch(`${process.env.NEXT_PUBLIC_IPFS_GW}/${userProfile.profileCid}/profile.json`);
          if (response.ok) {
            const metadata = await response.json();
            setProfile({
              ...metadata,
              imageUrl: metadata.imageCid ? `${process.env.NEXT_PUBLIC_IPFS_GW}/${metadata.imageCid}` : null,
              updatedAt: userProfile.updatedAt
            });
          }
        }
      } catch (err) {
        console.error('Error fetching profile:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [web3, address]);

  return (
    <Popup
      trigger={
        <Label as='a' basic>
          {label && `${label}: `}
          {profile?.name ? `${profile.name} (${truncateEthAddress(address)})` : truncateEthAddress(address)}
        </Label>
      }
      hoverable
      wide
    >
      <div style={{ minWidth: '250px' }}>
        {profile?.imageUrl && (
          <Image 
            src={profile.imageUrl}
            size='small' 
            centered 
            style={{ 
              marginBottom: '10px', 
              borderRadius: '8px',
              maxHeight: '200px',
              objectFit: 'cover'
            }} 
          />
        )}
        <div style={{ textAlign: 'center' }}>
          {profile?.name && <h4 style={{ margin: '5px 0' }}>{profile.name}</h4>}
          <div style={{ opacity: 0.7, fontSize: '0.9em', marginBottom: '8px' }}>
            Explore: 
            <a 
              href={`https://sepolia.etherscan.io/address/${address}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ 
                color: '#2185d0',
                textDecoration: 'none',
                cursor: 'pointer',
                marginLeft: '5px'
              }}
              onMouseEnter={(e) => e.target.style.textDecoration = 'underline'}
              onMouseLeave={(e) => e.target.style.textDecoration = 'none'}
            >
              <Icon name='external' size='small' /> {address} 
            </a>
          </div>
          {profile?.bio && (
            <p style={{ margin: '10px 0', fontSize: '0.95em' }}>{profile.bio}</p>
          )}
          {profile?.updatedAt && (
            <div style={{ fontSize: '0.8em', opacity: 0.6 }}>
              Last updated: {new Date(Number(profile.updatedAt) * 1000).toLocaleDateString()}
            </div>
          )}
        </div>
      </div>
    </Popup>
  );
};

export default UserProfile; 