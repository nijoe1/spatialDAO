// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

import "@zondax/filecoin-solidity/contracts/v0.8/types/CommonTypes.sol";
import "@zondax/filecoin-solidity/contracts/v0.8/types/MarketTypes.sol";
import "@zondax/filecoin-solidity/contracts/v0.8/MarketAPI.sol";
import "@zondax/filecoin-solidity/contracts/v0.8/utils/Actor.sol";
import "@zondax/filecoin-solidity/contracts/v0.8/SendAPI.sol";
import "@zondax/filecoin-solidity/contracts/v0.8/utils/Misc.sol";
import "@openzeppelin/contracts/access/AccessControlEnumerable.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract spatialDAO is AccessControlEnumerable  {
    address constant CALL_ACTOR_ID = 0xfe00000000000000000000000000000000000005;
    uint64 constant DEFAULT_FLAG = 0x00000000;
    uint64 constant METHOD_SEND = 0;

    bytes32 public constant PROPOSER_ROLE = keccak256("PROPOSER_ROLE");

    using EnumerableSet for EnumerableSet.UintSet;
    using Counters for Counters.Counter;
    Counters.Counter public commpID;

    mapping(bytes => mapping(uint64 => bool)) public cidProviders;
    
    mapping(bytes => EnumerableSet.UintSet) private cidToDeals;

    mapping(uint256 => bytes) private idToCID;

    mapping(bytes => Bounty) private cidToBounty;

    mapping(uint64 => bool) private bannedSPs;

    string public DaoName;

    string public Dao_groupID;

    struct Bounty{
        uint numberOfBounties;
        uint bountyReward;
        uint donatedTokens;
        uint requiredTokens;
        bool enabled;
        // bounty url { image - description - }
    }

    // constructor(address[] memory DAOmembers, string memory name, string memory ceramic_group_chat) {

    constructor(address[] memory DAOmembers) {
        // The creator of the contract has the ADMIN Access!
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        for (uint256 i = 0; i < DAOmembers.length; ++i) {
            _grantRole(PROPOSER_ROLE, DAOmembers[i]);
        }
    }

    function createBounty(bytes memory commP, uint256 numberOfBounties, uint256 bountyReward) public {
        require(checkProposerRole(msg.sender), "DOES_NOT_HAVE_PROPOSER_ROLE");
        // require that the Bounty was Filled or never created
        require(numberOfBounties > 0, "You must create a Bounty with more than 1 replications");

        bool commpExists = CIDexists(commP);
        // If CID Found and numberOfBounties are 0 that means that a bounty 
        // has succesfully rewarded all its replications. If so a proposer can override the bounty
        // and also we clear terminated deals
        if(commpExists && cidToBounty[commP].numberOfBounties == 0){
            uint256 numberOfDeals = cidToDeals[commP].length();
            clear_terminated_deals(commP, numberOfDeals);
        }

        if(!commpExists){
            commpID.increment();
            idToCID[commpID.current()] = commP;
        }

        uint256 required_tokens = numberOfBounties * bountyReward;
        cidToBounty[commP] = Bounty(numberOfBounties, bountyReward, 0, required_tokens, false);
    }

    function clear_terminated_deals(bytes memory commP, uint256 size) internal {
            uint256 i = 0;
            uint256 currDeal;
            // handling expired deal removals based on the EnumerableSet implementation logic
            while(i != size){
                currDeal = uint256(cidToDeals[commP].at(i));
                 // get deal Term ( start - end )
                int64 endOfDeal = MarketAPI.getDealTerm(uint64(currDeal)).end;
                // dealDuration represents the remaining days of the deal
                int64 dealDuration = endOfDeal - int64(uint64(block.number));
                // get deal Activation State
                int64 isDealTerminated = MarketAPI.getDealActivation(uint64(currDeal)).terminated;
                // To Do if terminated ban provider instead of using bool use uint8 0=false 1=true 2==banned
                if(dealDuration <= 0 || isDealTerminated == 1){
                    uint64 dealProvider = MarketAPI.getDealProvider(uint64(currDeal)).provider;
                    // Because deal has expired and each CID can only get stored once
                    // On each provider we release that dealProvider for that commP!
                    cidProviders[commP][dealProvider] = false;
                    // If deal is terminated or 
                    cidToDeals[commP].remove(currDeal);
                    size--;
                    continue;
                }
                i++;           
            }
    }

    function fundBounty(bytes memory commP) public payable {
        // Require that the CID bounty is not yet fully funded and also is not already fullfilled
        // There is the case where enabled == false and numberOfBounties == 0 That means that the 
        // Bounty is fullfilled all the clients have been paid
        require(!cidToBounty[commP].enabled, "Bounty Is fully founded");
        require(cidToBounty[commP].numberOfBounties > 0, "Bounty is Over all clients have taken their bounties");
        cidToBounty[commP].donatedTokens = cidToBounty[commP].donatedTokens + msg.value;
        // If this fund filled the required tokens for that bounty enable the bounty
        if(cidToBounty[commP].donatedTokens >= cidToBounty[commP].requiredTokens){
            cidToBounty[commP].enabled = true;
        }
    }

    function authorizeDeal(bytes memory cidraw, uint64 provider, int64 dealDuration, int64 terminated) internal {
        // Finding the number of days we need to give the bounty as the (currentDealDuration - 160 days = 460800 blocks)
        dealDuration = dealDuration - 460800;
        require(cidToBounty[cidraw].enabled, "the bounties for the CID have been taken or Bounty requires to get founded");
        require(!cidProviders[cidraw][provider], "deal failed policy check: has provider already claimed this cid?");
        require(dealDuration > 0 , "Not as many Days as wanted for the Deal");
        require(terminated == 0, "dealNotActive || dealTerminated"); 
        cidProviders[cidraw][provider] = true;
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
        int64 isDealTerminated = MarketAPI.getDealActivation(deal_id).terminated;
        // get deal commP and sizeof(commP)
        bytes memory commP = MarketAPI.getDealDataCommitment(deal_id).data;
        // Checking if the deal is valid
        authorizeDeal(commP, provider, dealDuration, isDealTerminated);
        bytes memory emptyParams = "";
        delete emptyParams;
        uint bountyReward = cidToBounty[commP].bountyReward;
        // getting the client address bytes
        bytes memory clientAddress = Actor.callByID(client, METHOD_SEND, Misc.NONE_CODEC, emptyParams, bountyReward);
        // Sending the bounty Reward to the client
        SendAPI.send(clientAddress, bountyReward);
        // Add deal for that CID
        cidToDeals[commP].add(deal_id);
        cidToBounty[commP].donatedTokens = cidToBounty[commP].donatedTokens - cidToBounty[commP].bountyReward;
        cidToBounty[commP].numberOfBounties --;
        if(cidToBounty[commP].numberOfBounties < 1){
            cidToBounty[commP].enabled = false;
        }
    }

    function getDeals(bytes memory commP) public view returns(uint32[] memory commP_deals){
        uint256 size = cidToDeals[commP].length();
        commP_deals = new uint32[](size);
        for (uint256 i = 0; i < size; ++i) {
            commP_deals[i] = uint32(cidToDeals[commP].at(i));
        }
        return commP_deals;
    }

    function checkProposerRole(address proposer) internal view returns(bool){
        // Getting the number of addresses that have `role` proposer.
        uint256 proposersCount = getRoleMemberCount(PROPOSER_ROLE);
        for(uint256 i = 0; i < proposersCount; i++){
            if(proposer == getRoleMember(PROPOSER_ROLE, i)){
                return true;
            }
        }
        return false;
    }

    function CIDexists(bytes memory commP) internal view returns(bool){
        for(uint256 i = 0; i < commpID.current(); i++){
            if(keccak256(commP) == keccak256(idToCID[i])){
                return true;
            }
        }
        return false;
    }

}
