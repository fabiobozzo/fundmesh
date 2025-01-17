// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.8.2 <0.9.0;

import "@openzeppelin/contracts/utils/Strings.sol";

import "./Model.sol";
import "./ProjectNFT.sol";

contract Project {
    uint private id;
    address public owner;
    address payable public recipient;
    string public cid;
    uint public minimumContribution;
    uint public targetContribution;
    
    uint public deadline;
    uint public contributorsCount;
    mapping(address => uint) public contributors; // datetime of last contribution
    Model.Status public status;

    Model.Milestone[] public milestones;
    Model.Status[] public milestoneStatuses;

    ProjectNFT public nft;

    modifier restricted() {
        require(msg.sender == owner);
        _;
    }

    modifier onlyRecipient() {
        require(msg.sender == recipient);
        _;
    }

    constructor(
        uint _id,
        address _owner,
        address _recipient,
        string memory _cid,
        uint _minimumContribution,
        uint _targetContribution,
        uint _deadline,
        string memory nftNamePrefix,
        string memory nftSymbolPrefix
    ) {
        id = _id;
        owner = _owner;
        cid = _cid;
        minimumContribution = _minimumContribution;
        targetContribution = _targetContribution;
        deadline = _deadline;
        recipient = payable(_recipient);

        nft = new ProjectNFT(
            address(this),
            string(abi.encodePacked(nftNamePrefix, Strings.toString(id))),
            string(abi.encodePacked(nftSymbolPrefix, Strings.toString(id)))
        );
    }

    function getSummary()
        public
        view
        returns (
            uint,
            address,
            string memory,
            uint,
            uint,
            uint,
            uint,
            bool,
            uint,
            uint,
            bool,
            uint
        )
    {
        return (
            address(this).balance,
            recipient,
            cid,
            minimumContribution,
            targetContribution,
            deadline,
            contributorsCount,
            status.approved,
            status.approvedAt,
            status.approvalsCount,
            status.completed,
            status.completedAt
        );
    }

    function getApproval(address _address) public view returns (uint) {
        return status.approvals[_address];
    }

    function getReward(address _address) public view returns (uint256, string memory) {
        if (status.rewards[_address]) {
            uint256 tokenId = nft.tokenOfOwnerByIndex(_address, 0);
            return (tokenId, nft.tokenURI(tokenId));
        }

        return (0, '');
    }

    function getContribution(address _address) public view returns (uint) {
        return contributors[_address];
    }

    function contribute() public payable {
        // The transaction value must be higher than the minimum contribution for this project
        require(msg.value >= minimumContribution, "Contribution below minimum");
    
        // Allow contributions up to target + minimum to handle rounding
        require(address(this).balance <= targetContribution + minimumContribution, "Contribution would exceed target");

        // After the project deadline is past it is no longer possible to contribute to it
        require(block.timestamp < deadline);

        if (contributors[msg.sender] == 0) {
            contributorsCount++;
        }

        contributors[msg.sender] = block.timestamp;

        emit ContributionMade(
            msg.sender,
            msg.value,
            address(this).balance,
            contributorsCount,
            block.timestamp
        );
    }

    function approve() public {
        // The `targetContribution` must be reached in order to approve the project
        require(address(this).balance >= targetContribution, "Target contribution not reached");

        // The approver must be a contributor to this project
        require(contributors[msg.sender] > 0, "Not a contributor");

        // The approver cannot approve the project more than once
        require(status.approvals[msg.sender] == 0, "Already approved");

        // All project milestones must be completed before the project can be approved
        if (milestones.length > 0) {
            for (uint i = 0; i < milestoneStatuses.length; i++) {
                require(milestoneStatuses[i].completed, "All milestones must be completed first");
            }
        }

        status.approvals[msg.sender] = block.timestamp;
        status.approvalsCount++;

        emit ApprovalSubmitted(
            msg.sender,
            status.approvalsCount,
            block.timestamp
        );

        // Quorum check
        if (status.approvalsCount >= ((contributorsCount / 2) + 1)) {
            status.approved = true;
            status.approvedAt = block.timestamp;
            emit ProjectApproved(block.timestamp);
        }
    }

    function reward(string memory tokenURI) public {
        // The project must be approved before rewards can be claimed
        require(status.approved, "Project not approved");

        // The requestor must be a contributor to this project
        require(contributors[msg.sender] > 0, "Not a contributor");

        // The requestor cannot claim more than one reward
        require(!status.rewards[msg.sender], "Already rewarded");

        nft.safeMint(msg.sender, tokenURI);
        status.rewards[msg.sender] = true;
        
        uint256 tokenId = nft.tokenOfOwnerByIndex(msg.sender, 0);
        emit RewardClaimed(
            msg.sender,
            tokenId,
            tokenURI,
            block.timestamp
        );
    }

    function withdraw() public onlyRecipient {
        // The project must be approved first and all milestones must be completed in order to withdraw its final value
        require(status.approved, "Project not approved");
        
        // All milestones must be completed
        for (uint i = 0; i < milestoneStatuses.length; i++) {
            require(milestoneStatuses[i].completed, "Pending milestones");
        }

        require(!status.completed, "Project already completed");

        recipient.transfer(address(this).balance);
        status.completed = true;
        status.completedAt = block.timestamp;
        
        emit ProjectCompleted(
            recipient,
            address(this).balance,
            block.timestamp
        );
    }

    /*
     * ==================
     * Milestones methods
     * ==================
     */
    function getMilestonesCount() public view returns (uint) {
        return milestones.length;
    }

    function createMilestones(
        string[] memory descriptions,
        uint[] memory thresholds,
        address[] memory recipients
    ) public restricted {
        // Input arrays must have the same length
        require(
            descriptions.length == thresholds.length &&
                thresholds.length == recipients.length
        );

        for (uint i = 0; i < descriptions.length; i++) {
            createMilestone(descriptions[i], thresholds[i], recipients[i]);
        }
    }

    function createMilestone(
        string memory _description,
        uint _threshold,
        address _recipient
    ) public restricted {
        require(bytes(_description).length > 0);
        require(_threshold > 0);
        require(_threshold < targetContribution);
        require(_recipient != address(0));

        // `milestones` are in ascending order by `threshold`
        // A new milestone cannot have a lower threshold than existing ones
        if (milestones.length > 0) {
            require(_threshold > milestones[milestones.length - 1].threshold);
        }

        Model.Milestone storage newMilestone = milestones.push();
        newMilestone.description = _description;
        newMilestone.threshold = _threshold;
        newMilestone.recipient = payable(_recipient);
        milestoneStatuses.push();
    }

    function approveMilestone(uint index) public {
        require(index < milestones.length, "Invalid milestone index");
        Model.Milestone storage milestone = milestones[index];
        Model.Status storage mStatus = milestoneStatuses[index];

        // Previous milestones must be completed first
        if (index > 0) {
            for (uint i = 0; i < index; i++) {
                require(milestoneStatuses[i].completed, "Previous milestones must be completed first");
            }
        }

        require(contributors[msg.sender] > 0, "Not a contributor");
        require(mStatus.approvals[msg.sender] == 0, "Already approved this milestone");

        // For milestone approval, we only need the current balance to cover 
        // the difference between this milestone and previous ones
        uint requiredBalance = milestone.threshold;
        if (index > 0) {
            requiredBalance = milestone.threshold - milestones[index - 1].threshold;
        }
        require(address(this).balance >= requiredBalance, "Milestone threshold not reached");

        mStatus.approvals[msg.sender] = block.timestamp;
        mStatus.approvalsCount++;

        emit MilestoneApprovalSubmitted(
            index,
            msg.sender,
            mStatus.approvalsCount,
            block.timestamp
        );

        if (mStatus.approvalsCount >= ((contributorsCount / 2) + 1)) {
            mStatus.approved = true;
            mStatus.approvedAt = block.timestamp;
            emit MilestoneApproved(index, block.timestamp);
        }
    }

    function withdrawMilestone(uint index) public restricted {
        Model.Milestone storage milestone = milestones[index];
        Model.Status storage mStatus = milestoneStatuses[index];

        // The milestone must be approved first in order to withdraw its value
        require(mStatus.approved, "Milestone not approved");
        require(!mStatus.completed, "Milestone already completed");

        // The amount available to withdraw at each approved milestone is equal to its
        // threshold minus all the previous completed milestones' thresholds
        uint withdrawAmount = milestone.threshold;
        for (uint i = 0; i < index; i++) {
            // Previous milestones must be completed first
            require(milestoneStatuses[i].completed, "Previous milestones pending");
            withdrawAmount = withdrawAmount - milestones[i].threshold;
        }

        milestone.recipient.transfer(withdrawAmount);
        mStatus.completed = true;
        mStatus.completedAt = block.timestamp;

        emit MilestoneCompleted(
            index,
            milestone.recipient,
            withdrawAmount,
            block.timestamp
        );
    }

    /*
     * =======
     * Events
     * =======
     */

    event ContributionMade(
        address indexed contributor,
        uint amount,
        uint currentBalance,
        uint contributorsCount,
        uint timestamp
    );

    event ApprovalSubmitted(
        address indexed approver,
        uint approvalsCount,
        uint timestamp
    );

    event ProjectApproved(uint timestamp);

    event ProjectCompleted(
        address indexed recipient,
        uint amount,
        uint timestamp
    );

    event MilestoneApprovalSubmitted(
        uint indexed milestoneIndex,
        address indexed approver,
        uint approvalsCount,
        uint timestamp
    );

    event MilestoneApproved(
        uint indexed milestoneIndex,
        uint timestamp
    );

    event MilestoneCompleted(
        uint indexed milestoneIndex,
        address indexed recipient,
        uint amount,
        uint timestamp
    );

    event RewardClaimed(
        address indexed contributor,
        uint256 tokenId,
        string tokenURI,
        uint timestamp
    );
}
