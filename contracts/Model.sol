// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.8.2 <0.9.0;

library Model {
    struct Milestone {
        address payable recipient;
        string description;
        uint threshold;
        bool approved;
        uint approvedAt;
        uint approvalsCount; // min 50% of `approvers` for a Request to pass
        mapping(address => uint) approvals;
        bool completed;
        uint completedAt;
        mapping(address => bool) rewards;
    }
}
