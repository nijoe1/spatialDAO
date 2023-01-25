// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;
import "./commpGovernor.sol";

contract spatialDAO is commpGovernor  {
    // using Counters for Counters.Counter;
    // Counters.Counter private commpID;
    // Counters.Counter private proposalID;

    string public DaoName;

    string public groupID;

    // constructor(address[] memory DAOmembers, string memory name, string memory ceramic_group_chat) {

    constructor(address[] memory DAOproposers, address[] memory DAOvoters) {
        // The creator of the contract has the ADMIN Access!
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        for (uint256 i = 0; i < DAOproposers.length; ++i) {
            _grantRole(PROPOSER_ROLE, DAOproposers[i]);
        }
        for (uint256 i = 0; i < DAOvoters.length; ++i) {
            _grantRole(VOTER_ROLE, DAOvoters[i]);
        }
    }


}

