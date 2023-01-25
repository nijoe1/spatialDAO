// SPDX-License-Identifier: MIT
pragma solidity >0.4.23 <0.9.0;
import "./spatialDAO.sol";
contract DAOFactory {

    spatialDAO[] private _daos;
    DAO_INFO[] private _info;
    struct DAO_INFO{
        string name;
        string groupID;
    }

    function createDataDAO(
        address[] memory DAO_proposers,
        address[] memory DAO_voters
    ) public {
        spatialDAO foundation = new spatialDAO(
            DAO_proposers,
            DAO_voters
           
        );
        _daos.push(foundation); 
    }

    function getAllDAOs()
        public
        view
        returns (spatialDAO[] memory, DAO_INFO[] memory)
    {
        return (_daos,_info);
    }

}