// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "./commpGovernor.sol";

contract spatialDAO is commpGovernor  {

    // The daoName
    string public DaoName;
    // The ceramic network decentralized group like descord
    string public groupID;

    constructor(address[] memory DAOadmins, address[] memory DAOvoters,string memory name, string memory groupid) {

        for (uint256 i = 0; i < DAOadmins.length; ++i) {
            _setupRole(DEFAULT_ADMIN_ROLE, DAOadmins[i]);
        }
        for (uint256 i = 0; i < DAOvoters.length; ++i) {
            _grantRole(VOTER_ROLE, DAOvoters[i]);
        }
        DaoName = name;
        groupID = groupid;
    }


}