// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.8.2 <0.9.0;

library Model {
    struct Milestone {
        address payable recipient;
        string description;
        uint threshold;
    }
    struct Status {
        bool approved;
        uint approvedAt;
        uint approvalsCount;
        mapping(address => uint) approvals;
        bool completed;
        uint completedAt;
        mapping(address => bool) rewards;
        bool cancelled;
        uint cancelledAt;
    }
}
