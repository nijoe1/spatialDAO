// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "@zondax/filecoin-solidity/contracts/v0.8/utils/Actor.sol";
import "@zondax/filecoin-solidity/contracts/v0.8/MarketAPI.sol";
contract dataDAOCore {

    /// @dev Send amount $FIL to the filecoin actor at actor_id 
    /// @dev that contributed to the DAO for replicating a commP
    /// @param actorID: actor at actor_id
    /// @param BountyReward: Amount of $FIL
    function reward(uint64 actorID, uint BountyReward) internal {
        bytes memory emptyParams = "";
        delete emptyParams;
        Actor.callByID(actorID,0, Misc.NONE_CODEC,emptyParams,BountyReward,false);
    }

}