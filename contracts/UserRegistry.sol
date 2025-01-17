// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.8.2 <0.9.0;

contract UserRegistry {
    struct UserProfile {
        bool exists;
        string profileCid;
        uint256 updatedAt;
    }
    
    mapping(address => UserProfile) public profiles;
    
    event ProfileUpdated(
        address indexed user,
        string profileCid,
        uint256 timestamp
    );
    
    function updateProfile(address user, string memory profileCid) external {
        require(msg.sender == user, "Only profile owner can update their profile");
        
        profiles[user] = UserProfile({
            exists: true,
            profileCid: profileCid,
            updatedAt: block.timestamp
        });
        
        emit ProfileUpdated(user, profileCid, block.timestamp);
    }
    
    function getProfile(address user) external view returns (UserProfile memory) {
        return profiles[user];
    }
    
    function hasProfile(address user) external view returns (bool) {
        return profiles[user].exists;
    }
}