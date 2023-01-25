// SPDX-License-Identifier: MIT


pragma solidity ^0.8.0;
import "@zondax/filecoin-solidity/contracts/v0.8/utils/Actor.sol";
import "@zondax/filecoin-solidity/contracts/v0.8/MarketAPI.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/access/AccessControlEnumerable.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";

abstract contract commpGovernor is AccessControlEnumerable {

    bytes32 public constant PROPOSER_ROLE = keccak256("PROPOSER_ROLE");
    bytes32 public constant VOTER_ROLE = keccak256("VOTER_ROLE");

    using EnumerableSet for EnumerableSet.UintSet;
    using EnumerableSet for EnumerableSet.AddressSet;
    using Counters for Counters.Counter;
    Counters.Counter private commpID;

    struct proposal {
        uint proposalID;
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

    EnumerableSet.UintSet private onBounties;

    mapping(bytes => bounty) public commpToBounty;

    mapping(bytes => proposal) public commpToProposal;

    mapping(uint256 => bytes) public idToCommP;

    mapping(uint256 => EnumerableSet.AddressSet ) private proposal_voters; 

    mapping(bytes => EnumerableSet.UintSet) private commpToDeals;

    mapping(bytes => mapping(uint64 => bool)) public commpToSPs;

    mapping(uint64 => bool) public blacklistedSPs;


    function createProposal( bytes memory commP, string memory proposalURL,uint256 duration) public {
        require(duration > 0);
        // checking if commP already proposed
        require(!isCommpProposed(commP));
        // Checking if msg.sender has the authority to create a proposal
        require(checkProposerRole(msg.sender));
        commpID.increment();
        idToCommP[commpID.current()] = commP;        
        commpToProposal[commP] = proposal(commpID.current(),proposalURL,0,block.number,false, true, duration);
    }

    function vote(bytes memory commP, bool desition) public{
        // checking if the proposal is active
        require(commpToProposal[commP].Activestate);
        uint256 id = commpToProposal[commP].proposalID;
        // checking if msg.sender has the authority to vote
        require(checkVoterRole(msg.sender) || checkProposerRole(msg.sender));
        // Each voter can vote only once
        // checks if granted address has already voted
        require(!proposal_voters[id].contains(msg.sender));
        // Checking if proposal has ended
        require(!isProposalEnded(commP));
        // Setting msg.sender as voted == true
        proposal_voters[id].add(msg.sender);
        if(desition){
            commpToProposal[commP].votes++;
        }else{
            commpToProposal[commP].votes--;
        }
    }   

    function executeProposal(bytes memory commP) public {
        // Checking if the proposal has ended
        require(isProposalEnded(commP));
        if(commpToProposal[commP].votes >= 0){
            commpToProposal[commP].result = true;
        }
        // declarinf proposal as executed non active
        commpToProposal[commP].Activestate = false;
        uint256 id = commpToProposal[commP].proposalID;
        // deleting all the voters to save contract storage state
        delete proposal_voters[id];
    }

    function createBounty(bytes memory commP, uint256 numberOfBounties, uint256 bountyReward,int64 minDealDays,uint256 size) public {
        // You must create a Bounty with more than 1 replications
        require(numberOfBounties > 0);
        // "DOES_NOT_HAVE_PROPOSER_ROLE"
        require(checkProposerRole(msg.sender));
        // Checks if the proposal for that CID  is ended and has passed  !
        require(isValidProposedFile(commP));
        // require that the Bounty was Filled and all deals have expired or never created
        
        // If numberOfBounties = 0 and there are deals claimed for that CID that means that a bounty 
        // has succesfully rewarded all its replications. If so a proposer can override the bounty
        // and also we clear terminated deals it will revert if there is still an active deal for that bounty
        uint256 numberOfDeals = commpToDeals[commP].length();            
        if(commpToBounty[commP].numberOfBounties == 0 && numberOfDeals > 0 ){
            clear_terminated_deals(commP);
        }

        uint256 required_tokens = numberOfBounties * bountyReward;
        commpToBounty[commP] = bounty(numberOfBounties, bountyReward, 0, required_tokens, false, size, minDealDays);
        onBounties.add(commpToProposal[commP].proposalID);
    }

    function fundBounty(bytes memory commP) public payable {
        // Require that the CID bounty is not yet fully funded and also is not already fullfilled
        // There is the case where enabled == false and numberOfBounties == 0 That means that the 
        // Bounty is fullfilled all the clients have been paid
        // require that bounty needs more funding
        require(!commpToBounty[commP].enabled);
        require(commpToBounty[commP].donatedTokens + msg.value <= commpToBounty[commP].requiredTokens);
        // Bounty is Over all clients have taken their bounties
        // require(bounty.numberOfBounties > 0);
        // 
        require(commpToBounty[commP].donatedTokens < commpToBounty[commP].requiredTokens);
        commpToBounty[commP].donatedTokens = commpToBounty[commP].donatedTokens + msg.value;
        // If this fund filled the required tokens for that bounty enable the bounty
        if(commpToBounty[commP].donatedTokens == commpToBounty[commP].requiredTokens){
            commpToBounty[commP].enabled = true;
        }
    }

    function clear_terminated_deals(bytes memory commP) internal {
            uint256 i = 0;
            uint256 currDeal;
            uint256 numberOfActiveDeals = 0;
            uint256 size = commpToDeals[commP].length();            
            // handling expired deal removals based on the EnumerableSet implementation logic
            while(i != size){
                currDeal = uint256(commpToDeals[commP].at(i));
                 // get deal Term ( start - end )
                int64 endOfDeal = MarketAPI.getDealTerm(uint64(currDeal)).end;
                // dealDuration represents the remaining days of the deal
                int64 dealDuration = endOfDeal - int64(uint64(block.number));
                // get deal Activation State
                int64 terminatedEpoch = MarketAPI.getDealActivation(uint64(currDeal)).terminated;
                
                uint64 dealProvider = MarketAPI.getDealProvider(uint64(currDeal)).provider;
                
                // if(isDealTerminated == 1){ NA RWTISW POTE SIMAINEI OTI ENA DEAL EGINE TERMINATED OXI TIN WRA POY PREPEI

                if(dealDuration > 0 && terminatedEpoch > 0){
                    blacklistProvider(dealProvider);
                    commpToDeals[commP].remove(currDeal);
                    size--;
                    continue;
                }
                if(dealDuration <= 0){
                    commpToSPs[commP][dealProvider] = false;
                    commpToDeals[commP].remove(currDeal);
                    size--;
                    continue;
                }else{
                    numberOfActiveDeals++;
                }
                i++;           
            }
            if(numberOfActiveDeals > 0){
                // If the requested commP Bounty is already declared and has active deals revert
                revert();
            }
    }

    function claim_bounty(uint64 deal_id) public {
        // get deal SP
        uint64 provider = MarketAPI.getDealProvider(deal_id).provider;
        // get deal client
        uint64 client = MarketAPI.getDealClient(deal_id).client;
        // get deal Term ( start - end )
        int64 endOfDeal = MarketAPI.getDealTerm(deal_id).end;
        // dealDuration represents the remaining days of the deal
        int64 dealDuration = endOfDeal - int64(uint64(block.number));
        // get deal Activation State
        int64 terminatedEpoch = MarketAPI.getDealActivation(deal_id).terminated;
        // get deal Activation State
        int64 activationEpoch = MarketAPI.getDealActivation(deal_id).activated;
        // get deal commP and sizeof(commP)
        bytes memory commP = MarketAPI.getDealDataCommitment(deal_id).data;
        // Checking if the deal is valid. If not the transaction will fail
        authorizeDeal(commP, provider, dealDuration, terminatedEpoch,activationEpoch);
        bytes memory emptyParams = "";
        delete emptyParams;
        uint bountyReward = commpToBounty[commP].bountyReward;

        send(client, bountyReward);
        // Add deal for that CID
        commpToDeals[commP].add(uint256(deal_id));
        commpToBounty[commP].donatedTokens = commpToBounty[commP].donatedTokens - commpToBounty[commP].bountyReward;
        commpToBounty[commP].numberOfBounties --;
        if(commpToBounty[commP].numberOfBounties < 1){
            commpToBounty[commP].enabled = false;
            onBounties.remove(commpToProposal[commP].proposalID);
        }
    }

    function authorizeDeal(bytes memory commP, uint64 provider, int64 dealDuration, int64 terminated, int64 activationEpoch) internal {
        // Finding the number of days we need to give the bounty as the (currentDealDuration - 160 days = 460800 blocks)
        // dealDuration = dealDuration - 460800;
        // "the bounties for the CID is required not to have been taken OR Bounty requires to get founded"
        require(commpToBounty[commP].enabled);
        // require the deal provider is not already storing that deal
        require(!commpToSPs[commP][provider]);
        require(dealDuration - commpToBounty[commP].minDealDays > 0 );
        require(terminated == 0 && activationEpoch > 0); 
        commpToSPs[commP][provider] = true;
    }

    function isBountyEnabled(bytes memory commP) public view returns(bool){
        return commpToBounty[commP].enabled;
    }

    function isBountyFunded(uint256 commpid) public view returns(bool){
        return onBounties.contains(commpid);
    }

        // If a provider failed to keep the file of a deal we blacklist him
    function blacklistProvider(uint64 provider) internal{
        blacklistedSPs[provider] = true;
    }

    function isCommpProposed(bytes memory commP) public view returns(bool){
        if(commpToProposal[commP].proposalID > 0){
            return true;
        }
        return false;
    }
    
    function checkProposerRole(address proposer) public view returns(bool){
        // Getting the number of addresses that have `role` proposer.
        uint256 proposersCount = getRoleMemberCount(PROPOSER_ROLE);
        for(uint256 i = 0; i < proposersCount; i++){
            if(proposer == getRoleMember(PROPOSER_ROLE, i)){
                return true;
            }
        }
        return false;
    }

    function checkVoterRole(address voter) public view returns(bool){
        // Getting the number of addresses that have `role` proposer.
        uint256 voterCount = getRoleMemberCount(VOTER_ROLE);
        for(uint256 i = 0; i < voterCount; i++){
            if(voter == getRoleMember(PROPOSER_ROLE, i)){
                return true;
            }
        }
        return false;
    }

    function isValidProposedFile(bytes memory commP) public view returns(bool){
        if(isProposalEnded(commP)){
            return commpToProposal[commP].result;
        }
        return false;
    }

    // return true if a proposalDuration has passed
    function isProposalEnded( bytes memory commP) public view returns(bool){
        return (commpToProposal[commP].start + commpToProposal[commP].duration) <= block.number;
    }

    function getProposal(bytes memory commP) public view returns(proposal memory){
        return commpToProposal[commP];
    }

    function getTotalCIDs()public view returns(uint256){
        return commpID.current();
    }

    function getDeals(bytes memory commP) public view returns(uint32[] memory commP_deals){
        uint256 size = commpToDeals[commP].length();
        commP_deals = new uint32[](size);
        for (uint256 i = 0; i < size; i++) {
            commP_deals[i] = uint32(uint64(commpToDeals[commP].at(i)));
        }
        return commP_deals;
    }

    function send(uint64 actorID, uint BountyReward) internal {
        bytes memory emptyParams = "";
        delete emptyParams;
        Actor.callByID(actorID,0, Misc.NONE_CODEC,emptyParams,BountyReward);
    }


}
