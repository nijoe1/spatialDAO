//SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

interface ICommpGovernor {

    struct proposal {
        uint commpID;
        string detailsURL;
        int64 votes;
        uint start;
        bool result;
        bool Activestate;
        uint duration;
    }

    struct bounty{
        uint numberOfBounties;
        uint bountyReward;
        uint donatedTokens;
        uint requiredTokens;
        bool enabled;
        uint256 size;
        int64 minDealDays; 
    }

    /// @dev Emitted when a proposal for a commP is created
    /// @param id: id of the commP    
    /// @param commP: cid of the deal proposal
    event CommpProposed (
        uint id,
        bytes commP
    );

    /// @dev Emitted when a bounty for a commP is added to the DAO
    /// @param commP: cid of the Bounty
    event bountyCreated (
        bytes commP
    );

    /// @dev Emitted when a bounty for a commP is fully funded: ready for claims
    /// @param commP: cid of the Bounty
    event bountyFullyFunded (
        bytes commP
    );

}