// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.8.2 <0.9.0;

import "./Project.sol";

contract ProjectFactory {
    address[] public deployedProjects;
    mapping(address => address[]) public userProjects;
    address public owner;

    constructor() {
        owner = msg.sender;
    }

    event ProjectCreated(
        uint indexed id,
        address indexed projectAddress,
        address indexed owner,
        string cid,
        uint minimumContribution,
        uint targetContribution,
        uint deadline,
        uint timestamp
    );

    function createProject(
        address recipient,
        string memory cid,
        uint256 minimumContribution,
        uint256 targetContribution,
        uint256 deadline,
        string memory nftNamePrefix,
        string memory nftSymbolPrefix
    ) public {
        address newProject = address(
            new Project(
                deployedProjects.length + 1,
                msg.sender,
                recipient,
                cid,
                minimumContribution,
                targetContribution,
                deadline,
                nftNamePrefix,
                nftSymbolPrefix,
                owner
            )
        );

        deployedProjects.push(newProject);
        userProjects[msg.sender].push(newProject);

        emit ProjectCreated(
            deployedProjects.length,
            newProject,
            msg.sender,
            cid,
            minimumContribution,
            targetContribution,
            deadline,
            block.timestamp
        );
    }

    function getDeployedProjects() public view returns (address[] memory) {
        return deployedProjects;
    }

    function getUserProjects() public view returns (address[] memory) {
        return userProjects[msg.sender];
    }
}
