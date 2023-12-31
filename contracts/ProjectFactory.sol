// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.8.2 <0.9.0;

import "./Project.sol";

contract ProjectFactory {
    address[] public deployedProjects;

    function createProject(
        address recipient,
        string memory cid,
        uint256 minimumContribution,
        uint256 targetContribution,
        uint256 deadline,
        string memory completionDescription,
        string memory nftNamePrefix,
        string memory nftSymbolPrefix
    ) public {
        address newProject = address(
            new Project(
                deployedProjects.length + 1,
                msg.sender,
                cid,
                minimumContribution,
                targetContribution,
                deadline,
                payable(recipient),
                completionDescription,
                nftNamePrefix,
                nftSymbolPrefix
            )
        );

        deployedProjects.push(newProject);
    }

    function getDeployedProjects() public view returns (address[] memory) {
        return deployedProjects;
    }
}
