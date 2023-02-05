// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import "@zondax/filecoin-solidity/contracts/v0.8/MarketAPI.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "./interfaces/ICommpGovernor.sol";
import "./dataDAOCore.sol";

abstract contract commpGovernor is AccessControl , ICommpGovernor, dataDAOCore {

    bytes32 public constant VOTER_ROLE = keccak256("VOTER_ROLE");
    using EnumerableSet for EnumerableSet.UintSet;
    using EnumerableSet for EnumerableSet.AddressSet;
    using Counters for Counters.Counter;
    Counters.Counter public commpID;

    EnumerableSet.UintSet private onBounties;

    mapping(bytes => bounty) public commpToBounty;

    mapping(bytes => proposal) public commpToProposal;

    mapping(uint256 => EnumerableSet.AddressSet ) private proposal_voters; 

    mapping(bytes => EnumerableSet.UintSet) private commpToDeals;

    mapping(bytes => mapping(uint64 => bool)) public commpToSPs;


    /// @dev Creates a new file proposal. 
    /// @param commP: cid for which the proposal is to be created.
    /// @param proposalURL: contains an IPFS link for Clients to get the file and create a deal for
    /// @param dealDurationInDays: deal duration in Days
    function createProposal( bytes memory commP, string memory proposalURL,uint256 dealDurationInDays) public {
        require(dealDurationInDays > 0, "proposal must be more than 0 blocks");
        require(!isCommpProposed(commP), "commP is already proposed");
        require(hasRole(DEFAULT_ADMIN_ROLE,msg.sender), "anothorized action only afmins can create proposals");
        commpID.increment();

        proposal memory newProposal = proposal({
            commpID: commpID.current(),
            detailsURL: proposalURL,
            votes: 0,
            start: block.number,
            result: false, 
            Activestate: true, 
            duration: dealDurationInDays
        });
        commpToProposal[commP] = newProposal;
        emit CommpProposed(commpID.current(),commP);
    }


    /// @dev Voting on the proposal - This would enable the commP to get stored by 
    /// @dev the DAO by creating a Bounty on accepted Proposal
    /// @param commP: cid of the proposal to vote
    /// @param _choice: decision of the msg.sender admin||voter on the proposal
    function vote(bytes memory commP, bool _choice) public{
        require(commpToProposal[commP].Activestate, "proposal Inactive");
        require(!isProposalEnded(commP), "proposal has ended");
        require(hasRole(VOTER_ROLE,msg.sender) || hasRole(DEFAULT_ADMIN_ROLE,msg.sender),"anothorized voter");
        uint256 id = commpToProposal[commP].commpID;
        require(!proposal_voters[id].contains(msg.sender), "you can only vote once");
        proposal_voters[id].add(msg.sender);
        if(_choice){
            commpToProposal[commP].votes++;
        }else{
            commpToProposal[commP].votes--;
        }
    }  

    /// @dev Creating a Bounty only for accepted proposals
    /// @param commP: cid of the bounty
    /// @param numberOfBounties: number of times this commP that will get replicated
    /// @param bountyReward: reward for each client or storageProvider that will make a deal for that commP
    /// @param minDealDays: minimum accepted days for a client or SP to claim the bounty
    /// @param size: size of the file
    function createBounty(bytes memory commP, uint256 numberOfBounties, uint256 bountyReward,int64 minDealDays,uint256 size) public {
        require(numberOfBounties > 0,"You must create a Bounty with more than 1 replications");
        require(hasRole(DEFAULT_ADMIN_ROLE,msg.sender),"DOES_NOT_HAVE_ADMIN_ROLE");
        require(isProposalEnded(commP),"proposal for this commP is still on voting phase");
        uint256 id = commpToProposal[commP].commpID;
        changeProposalState(commP,id);
        require(isValidProposedFile(commP),"this commP proposal is declined you cannot create a bounty");
        uint256 numberOfDeals = commpToDeals[commP].length();            
        if(commpToBounty[commP].numberOfBounties == 0 && numberOfDeals > 0 ){
            clear_terminated_deals(commP);
        }
        uint256 required_tokens = numberOfBounties * bountyReward;
        bounty memory newBounty = bounty({
            numberOfBounties: numberOfBounties, 
            bountyReward: bountyReward, 
            donatedTokens: 0, 
            requiredTokens: required_tokens, 
            enabled: false, 
            size: size, 
            minDealDays: minDealDays});
        commpToBounty[commP] = newBounty;

        onBounties.add(id);
        emit bountyCreated(commP);
    }

    /// @dev Funding a Bounty
    /// @param commP: cid of the bounty to get funded
    function fundBounty(bytes memory commP) public payable {
        require(!commpToBounty[commP].enabled, "bounty does not exists");
        require(commpToBounty[commP].donatedTokens + msg.value <= commpToBounty[commP].requiredTokens, "more funds than required");
        commpToBounty[commP].donatedTokens = commpToBounty[commP].donatedTokens + msg.value;
        // If this fund filled the required tokens for that bounty enable the bounty
        if(commpToBounty[commP].donatedTokens == commpToBounty[commP].requiredTokens){
            commpToBounty[commP].enabled = true;
            emit bountyFullyFunded(commP);
        }
    }


    /// @dev Deleting terminated or failed deals: Can be used to perpetualy store that commPs
    /// @dev once its deals are over create a new Bounty   
    /// @param commP: cid of the bounty that might get renewed
    function clear_terminated_deals(bytes memory commP) internal {
            uint256 i = 0;
            uint256 currDeal;
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
                if(dealDuration <= 0 || terminatedEpoch > 0){
                    commpToSPs[commP][dealProvider] = false;
                    commpToDeals[commP].remove(currDeal);
                    size--;
                    continue;
                }
                i++;           
            }
    }


    /// @dev Claiming a bounty: Client or SP that made a deal for a commP can claim it and 
    /// @dev get rewarded  
    /// @param deal_id: deal_id to check if DAO rules are met to reward the client or SP
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

        authorizeDeal(commP, provider, dealDuration, terminatedEpoch,activationEpoch);

        commpToSPs[commP][provider] = true;

        bytes memory emptyParams = "";
        delete emptyParams;
        uint bountyReward = commpToBounty[commP].bountyReward;

        reward(client, bountyReward);
        commpToDeals[commP].add(uint256(deal_id));
        commpToBounty[commP].donatedTokens = commpToBounty[commP].donatedTokens - commpToBounty[commP].bountyReward;
        commpToBounty[commP].numberOfBounties --;
        if(commpToBounty[commP].numberOfBounties < 1){
            commpToBounty[commP].enabled = false;
            onBounties.remove(commpToProposal[commP].commpID);
        }
    }

    /// @dev authorizing a deal claim
    /// @param commP: commP of the deal to check
    /// @param provider: provider of the deal check if he already storing the file
    /// @param dealDuration: checking if the dealDuration > BountyMinimumDealDays
    /// @param terminated: to check if the deal is failed to send storage proof
    /// @param activationEpoch: used in combination with the dealDuration
    function authorizeDeal(bytes memory commP, uint64 provider, int64 dealDuration, int64 terminated, int64 activationEpoch) internal view {
        require(commpToBounty[commP].enabled, "bounty on funding phase OR isFullyClaimed");
        require(!commpToSPs[commP][provider], "SP is already storing that file");
        require(dealDuration - commpToBounty[commP].minDealDays > 0 ,"deal ends too soon");
        require(terminated == 0 && activationEpoch > 0); 
    }

    /// @dev checking if a bounty is funded: used for the application logic
    /// @param commpid: the id of the commP
    function isBountyFunded(uint256 commpid) public view returns(bool){
        return onBounties.contains(commpid);
    }

    /// @dev checking if a commP is already proposed: used for the application logic
    /// @param commP: the commP to check
    function isCommpProposed(bytes memory commP) public view returns(bool){
        if(commpToProposal[commP].commpID > 0){
            return true;
        }
        return false;
    }

    /// @dev checking if a commP is accepted by a proposal
    /// @param commP: the commP to check
    function isValidProposedFile(bytes memory commP) public view returns(bool){
        if(isProposalEnded(commP)){
            return commpToProposal[commP].votes > 0;
        }
        return false;
    }

    /// @dev checking if a commP proposal hasEnded
    /// @param commP: the commP to check
    function isProposalEnded( bytes memory commP) public view returns(bool){
        return (commpToProposal[commP].start + commpToProposal[commP].duration) <= block.number;
    }

    /// @dev getting the claimed deals for a commP
    /// @param commP: the commP to get its deals
    function getDeals(bytes memory commP) public view returns(uint32[] memory commP_deals){
        uint256 size = commpToDeals[commP].length();
        commP_deals = new uint32[](size);
        for (uint256 i = 0; i < size; i++) {
            commP_deals[i] = uint32(uint64(commpToDeals[commP].at(i)));
        }
        return commP_deals;
    }

    /// @dev Internal function to change a proposal state while trying to create a Bounty
    /// @param commP: the commP to check votes 
    /// @param id: the id of the commP-Proposal to delete the voters
    function changeProposalState(bytes memory commP, uint256 id) internal {
        if(commpToProposal[commP].votes >= 0){
            commpToProposal[commP].result = true;
        }
        commpToProposal[commP].Activestate = false;
        delete proposal_voters[id];
    }
}
