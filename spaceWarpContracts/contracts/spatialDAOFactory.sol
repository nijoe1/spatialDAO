// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "./spatialDAO.sol";
contract spatialDAOFactory {
    DAO_INFO[] private _info;
    struct DAO_INFO{
        address DAO_address;
        string name;
        string groupID;
    }

    function createDataDAO(
        address[] memory DAO_proposers,
        address[] memory DAO_voters,
        string memory name,
        string memory groupid
    ) public {
        spatialDAO foundation = new spatialDAO(
            DAO_proposers,
            DAO_voters,
            name,
            groupid
        );
        _info.push(DAO_INFO(address(foundation),name,groupid));
    }

    function getAllDAOs()
        public
        view
        returns (DAO_INFO[] memory)
    {
        return (_info);
    }
}