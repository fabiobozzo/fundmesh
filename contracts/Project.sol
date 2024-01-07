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

    function contribute() public payable {
        // The transaction value must be higher than the minimum contribution for this project
        require(msg.value >= minimumContribution);

        // The transaction value must be lower than the target contribution for this project
        require(msg.value < targetContribution);

        // After the project deadline is past it is no longer possible to contribute to it
        require(block.timestamp < deadline);

        if (contributors[msg.sender] == 0) {
            contributorsCount++;
        }

        contributors[msg.sender] = block.timestamp;
    }

    function approve() public {
        // The `targetContribution` must be reached in order to approve the project
        require(address(this).balance >= targetContribution);

        // The approver must be a contributor to this project
        require(contributors[msg.sender] > 0);

        // The approver cannot approve the project more than once
        require(status.approvals[msg.sender] == 0);

        // All project milestones must be approved before the project can be approved
        for (uint i = 0; i < milestoneStatuses.length; i++) {
            require(milestoneStatuses[i].approved);
        }

        status.approvals[msg.sender] = block.timestamp;
        status.approvalsCount++;

        if (status.approvalsCount > (contributorsCount / 2)) {
            status.approved = true;
            status.approvedAt = block.timestamp;
        }
    }

    function reward(string memory tokenURI) public {
        require(!status.completed)
        require(status.approved);

        // Only project approvers can be rewarded for its completion
        uint approval = status.approvals[msg.sender];
        require(approval > 0);

        // Approvers can be rewarded only once for the project completion
        require(!status.rewards[msg.sender]);

        status.rewards[msg.sender] = true;
        nft.safeMint(msg.sender, tokenURI);
    }

    function withdraw() public restricted {
        // The project must be approved first and all its milestones
        // must be completed in order to withdraw its final value
        require(status.approved);
        for (uint i = 0; i < milestoneStatuses.length; i++) {
            require(milestoneStatuses[i].completed);
        }

        recipient.transfer(address(this).balance);
        status.completed = true;
        status.completedAt = block.timestamp;
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
        Model.Milestone storage milestone = milestones[index];
        Model.Status storage mStatus = milestoneStatuses[index];

        // The milestone must be reached in order to approve it
        require(address(this).balance >= milestone.threshold);

        // The approver must be a contributor to this project
        require(contributors[msg.sender] > 0);

        // The approver cannot approve a milestone more than once
        require(mStatus.approvals[msg.sender] == 0);

        mStatus.approvals[msg.sender] = block.timestamp;
        mStatus.approvalsCount++;

        if (mStatus.approvalsCount > (contributorsCount / 2)) {
            mStatus.approved = true;
            mStatus.approvedAt = block.timestamp;
        }
    }

    function rewardMilestone(uint index, string memory tokenURI) public {
        Model.Status storage mStatus = milestoneStatuses[index];

        require(!mStatus.completed)

        // Only milestone approvers can be rewarded for it
        uint approval = mStatus.approvals[msg.sender];
        require(approval > 0);

        // Approvers can be rewarded only once for the same milestone
        require(!mStatus.rewards[msg.sender]);

        mStatus.rewards[msg.sender] = true;
        nft.safeMint(msg.sender, tokenURI);
    }

    function withdrawMilestone(uint index) public restricted {
        Model.Milestone storage milestone = milestones[index];
        Model.Status storage mStatus = milestoneStatuses[index];

        // The milestone must be approved first in order to withdraw its value
        require(mStatus.approved);

        // The amount available to withdraw at each approved milestone is equal to its
        // threshold minus all the previous completed milestones' thresholds
        uint withdrawAmount = milestone.threshold;
        for (uint i = 0; i < index; i++) {
            // Previous milestones must be completed first
            require(milestoneStatuses[i].completed);
            withdrawAmount = withdrawAmount - milestones[i].threshold;
        }

        milestone.recipient.transfer(withdrawAmount);
        mStatus.completed = true;
        mStatus.completedAt = block.timestamp;
    }
}
