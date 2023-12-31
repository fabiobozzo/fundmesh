// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.8.2 <0.9.0;

import "@openzeppelin/contracts/utils/Strings.sol";

import "./Model.sol";
import "./ProjectNFT.sol";

contract Project {
    uint private id;
    address public owner;
    string public cid;
    uint public minimumContribution;
    uint public targetContribution;
    uint public deadline;
    uint public contributorsCount;

    mapping(address => uint) public contributors; // datetime of last contribution
    Model.Milestone[] public milestones;

    ProjectNFT public nft;

    modifier restricted() {
        require(msg.sender == owner);
        _;
    }

    constructor(
        uint _id,
        address _owner,
        string memory _cid,
        uint _minimumContribution,
        uint _targetContribution,
        uint _deadline,
        address payable recipient,
        string memory completionDescription,
        string memory nftNamePrefix,
        string memory nftSymbolPrefix
    ) {
        id = _id;
        owner = _owner;
        cid = _cid;
        minimumContribution = _minimumContribution;
        targetContribution = _targetContribution;
        deadline = _deadline;

        nft = new ProjectNFT(
            address(this),
            string(abi.encodePacked(nftNamePrefix, Strings.toString(id))),
            string(abi.encodePacked(nftSymbolPrefix, Strings.toString(id)))
        );

        _createMilestone(completionDescription, _targetContribution, recipient);
    }

    function getSummary()
        public
        view
        returns (uint, address, string memory, uint, uint, uint, uint)
    {
        return (
            address(this).balance,
            owner,
            cid,
            minimumContribution,
            targetContribution,
            deadline,
            contributorsCount
        );
    }

    function contribute() public payable {
        // The transaction value must be higher than the minimum contribution for this project
        require(msg.value > minimumContribution);

        // The transaction value must be lower than the target contribution for this project
        require(msg.value < targetContribution);

        // After the project deadline is past it is no longer possible to contribute to it
        require(block.timestamp < deadline);

        if (contributors[msg.sender] == 0) {
            contributorsCount++;
        }

        contributors[msg.sender] = block.timestamp;
    }

    function getMilestonesCount() public view returns (uint) {
        return milestones.length;
    }

    function createMilestone(
        string memory description,
        uint threshold,
        address _recipient
    ) public restricted {
        // The completion milestone cannot be overwritten or duplicated
        require(threshold < targetContribution);

        _createMilestone(description, threshold, _recipient);
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

    function _createMilestone(
        string memory description,
        uint threshold,
        address recipient
    ) private {
        for (uint i = 0; i < milestones.length; i++) {
            // A new milestone cannot have a lower threshold than existing ones
            require(milestones[i].threshold >= threshold);
        }

        Model.Milestone storage newMilestone = milestones.push();

        newMilestone.description = description;
        newMilestone.threshold = threshold;
        newMilestone.recipient = payable(recipient);
        newMilestone.approved = false;
        newMilestone.approvalsCount = 0;
    }

    function approveMilestone(uint index) public payable {
        if (msg.value > 0) {
            contribute();
        }

        Model.Milestone storage milestone = milestones[index];

        // The milestone must be reached in order to approve it
        require(address(this).balance >= milestone.threshold);

        // The approver must be a contributor to this project
        require(contributors[msg.sender] > 0);

        // The approver cannot approve a milestone more than once
        require(milestone.approvals[msg.sender] == 0);

        milestone.approvals[msg.sender] = block.timestamp;
        milestone.approvalsCount++;

        if (milestone.approvalsCount > (contributorsCount / 2)) {
            milestone.approved = true;
            milestone.approvedAt = block.timestamp;
        }
    }

    function rewardMilestone(uint index, string memory tokenURI) public {
        Model.Milestone storage milestone = milestones[index];
        uint approval = milestone.approvals[msg.sender];

        if (milestone.threshold != targetContribution) {
            // Only milestone approvers can be rewarded for it
            // Except for the last milestone aka project completion
            require(approval > 0);
        }

        // Approvers can be rewarded only once for the same milestone
        require(!milestone.rewards[msg.sender]);
        milestone.rewards[msg.sender] = true;

        nft.safeMint(msg.sender, tokenURI);
    }

    function withdrawMilestone(uint index) public restricted {
        // The milestone at `index` must exist
        require(index < milestones.length);

        Model.Milestone storage milestone = milestones[index];

        // The amount available to withdraw at each approved milestone is equal to
        // `targetContribution` minus all the previous completed milestone thresholds
        uint withdrawAmount = milestone.threshold;
        for (uint i = 0; i <= index; i++) {
            if (i < index) {
                // Previous milestones must be completed first
                require(milestones[i].completed);
                withdrawAmount = withdrawAmount - milestones[i].threshold;
            } else {
                // The milestone must be approved first in order to withdraw its value
                require(milestones[i].approved);
            }
        }

        milestone.recipient.transfer(withdrawAmount);
        milestone.completed = true;
        milestone.completedAt = block.timestamp;
    }
}
