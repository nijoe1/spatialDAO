import {ethers} from "ethers";
import {DAO_abi, daoFactoryAddress, factory_abi} from "../constants"
import {useSigner} from "wagmi";
import CID from 'cids';


// Proposals are created only by proposers and We make an Orbis Post with each post to contain the commP + info
//  So from that we know how to find the possible states of the Proposal by those conditions

    // if isProposalEnded == false {Voting Period}
    // if isProposalEnded == true && getCommPPropsal(commP).activateState == true {Proposal needs execution}
    // if isProposalEnded == true && isValidProposedFile == true {Proposal Passed}
    // if isProposalEnded == true && isValidProposedFile == false {Proposal Declined}

// Bounties are created only by proposers and We make an Orbis Post with each post to  contain the commP + info 
//  So from that we know how to find the possible states of the Proposal by those conditions

    // If isBountyCreated == true and isBountyEnabled == false {Funding Phase}
    // if isBountyEnabled == true {Claiming Phase}
    // If isBountyCreated == false and isBountyEnabled == false {Fully claimed Phase}


export const useContract = () => {
    const {data: signer} = useSigner()

    const contract = new ethers.Contract(daoFactoryAddress["dao-factory"], factory_abi, signer!)
    console.log(contract)
    const PROPOSER_ROLE = "0xb09aa5aeb3702cfd50b6b62bc4532604938f21248a27a1d5ca736082b6819cc1"
    const VOTER_ROLE = "0x72c3eec1760bf69946625c2d4fb8e44e2c806345041960b434674fb9ab3976cf"
    // Creates a new DataDao
    const createDataDao = async (proposers: string[], voters: string[], name: string, groupID: string) => {
        const tx = await contract.createDataDAO(proposers,voters,name,groupID)
        return await tx.wait()
    }

    //  Returns all the info from all the DataDAOs that the factory has created (address, name ,groupID)
    const getDataDaos = async () => {
        const res = await contract.getAllDAOs()
        console.log(res)
    }

    // Get a list of all possible files on hyperspace by using 
    // this endpoint = https://marketdeals-hyperspace.s3.amazonaws.com/StateMarketDeals.json
    // this endpoint returns all the deals in the testnet 
    // Check first if that commP is already proposed
    // you can do that by calling isCommpProposed(commP) 
    // Create a proposal Post on the groupID of that DAO with info about the commP (commP , description, size)

    // proposal metadata is the hardcoded ipfs cid
    const createProposal = async(DAOaddress: string, commP:string, proposalMetadata: string, durationInBlocks: number) => {
        const DaoContract = new ethers.Contract(DAOaddress, DAO_abi, signer!)
        const cidHexRaw = new CID(commP).toString('base16').substring(1)
        const cidHex = "0x00" + cidHexRaw
        const tx = await DaoContract.createProposal(cidHex,proposalMetadata,durationInBlocks)
        return await tx.wait()
    }

    // Check first checkVoterRole || checkProposerRole to the caller
    // Voting happens in the Proposal post if the proposal is not ended
    // you can check that by calling isProposalEnded(commP)
    const vote = async(DAOaddress:string, commP:string, desition: boolean) => {
        const DaoContract = new ethers.Contract(DAOaddress, DAO_abi, signer!)
        const cidHexRaw = new CID(commP).toString('base16').substring(1)
        const cidHex = "0x00" + cidHexRaw
        const tx = await DaoContract.vote(cidHex,desition)
        return await tx.wait()
    }

    // Check first that the proposal has ended 
    const executeProposal = async(DAOaddress:string, commP:string) => {
        const DaoContract = new ethers.Contract(DAOaddress, DAO_abi, signer!)
        const cidHexRaw = new CID(commP).toString('base16').substring(1)
        const cidHex = "0x00" + cidHexRaw
        const tx = await DaoContract.executeProposal(cidHex)
        return await tx.wait()
    }

    // Check first that commP has passed a proposal by calling  isValidProposedFile(commP)
    // Only proposers can make that action
    const createBounty = async(DAOaddress:string, commP:string, numberOfBounties: number, bountyReward: number, minDealDays:number, fileSize:number) => {
        const DaoContract = new ethers.Contract(DAOaddress, DAO_abi, signer!)
        const cidHexRaw = new CID(commP).toString('base16').substring(1)
        const cidHex = "0x00" + cidHexRaw
        const tx = await DaoContract.createBounty(cidHex,numberOfBounties,bountyReward,minDealDays,fileSize)
        return await tx.wait()
    }

    // Everyone can Fund
    // Dont fund more that the remaining needed fnding you can get the remaining needed funding
    // by getting the bunty details using getCommpBounty(commP) and find the requiredTokens - donatedTokens
    const fundBounty = async(DAOaddress:string, commP:string, fundAmount:number) => {
        const DaoContract = new ethers.Contract(DAOaddress, DAO_abi, signer!)
        const cidHexRaw = new CID(commP).toString('base16').substring(1)
        const cidHex = "0x00" + cidHexRaw
        const amount = fundAmount.toString()
        const tx = await DaoContract.vote(cidHex, {value: ethers.utils.parseEther(amount)})
        return await tx.wait()
    }

    // Anyone can call but is builded to get called by the dealler to get the reward
    // but whoever calls it if that dealID corresponds to a commP that has an enabled bounty
    // the function will reward the dealMaker 
    const claim_bounty = async(DAOaddress:string, dealID: number) => {
        const DaoContract = new ethers.Contract(DAOaddress, DAO_abi, signer!)
        const tx = await DaoContract.claim_bounty(dealID)
        return await tx.wait()
    }

    // Returns the dealIDs that have been claimed for a certain commP
    // Desplay them in the Bounty Card
    const getCommpDeals = async (DAOaddress:string, commP: string) => {
        const DaoContract = new ethers.Contract(DAOaddress, DAO_abi, signer!)
        const cidHexRaw = new CID(commP).toString('base16').substring(1)
        const cidHex = "0x00" + cidHexRaw
        return await DaoContract.isBountyEnabled(cidHex)
    }

    // Returns a bool if the bounty has successfully funded and has more claims to give returns true
    const isBountyEnabled = async (DAOaddress:string, commP: string) => {
        const DaoContract = new ethers.Contract(DAOaddress, DAO_abi, signer!)
        const cidHexRaw = new CID(commP).toString('base16').substring(1)
        const cidHex = "0x00" + cidHexRaw
        return await DaoContract.isBountyEnabled(cidHex)
    }

    // Returns true from the time that the bounty has been created untill the bounty has gives all its claims
    const isBountyCreated = async (DAOaddress:string, commP_Id: number) => {
        const DaoContract = new ethers.Contract(DAOaddress, DAO_abi, signer!)
        return await DaoContract.isBountyFunded(commP_Id)
    }


    // Returns true id that commP has beed proposed and the result after voting was True/yes
    const isValidProposedFile = async (DAOaddress:string, commP: string) => {
        const cidHexRaw = new CID(commP).toString('base16').substring(1)
        const cidHex = "0x00" + cidHexRaw
        const DaoContract = new ethers.Contract(DAOaddress, DAO_abi, signer!)
        return await DaoContract.isValidProposedFile(cidHex)
    }

    // Checks is an address has the voter role by returning a bool
    const checkVoterRole = async (DAOaddress:string, voter: string) => {
        const DaoContract = new ethers.Contract(DAOaddress, DAO_abi, signer!)
        return await DaoContract.checkVoterRole(voter)
    }

    // Checks is an address has the proposer role by returning a bool
    const checkProposerRole = async (DAOaddress:string, proposer: string) => {
        const DaoContract = new ethers.Contract(DAOaddress, DAO_abi, signer!)
        return await DaoContract.checkProposerRole(proposer)
    }
    
    // Returns the total amount of CIDs proposed in the DAO 
    const getTotalCIDs = async (DAOaddress:string) => {
        const DaoContract = new ethers.Contract(DAOaddress, DAO_abi, signer!)
        return await DaoContract.getTotalCIDs()
    }

    // returns the the CBOR value of the commP with ID x
    const getCommpByID = async (DAOaddress:string, id:number) => {
        const DaoContract = new ethers.Contract(DAOaddress, DAO_abi, signer!)
        return await DaoContract.idToCommP(id)
    }

    // returns the Bounty details of a CBOR commP
    const getCommpBounty = async (DAOaddress:string, commP:string) => {
        const DaoContract = new ethers.Contract(DAOaddress, DAO_abi, signer!)
        const cidHexRaw = new CID(commP).toString('base16').substring(1)
        const cidHex = "0x00" + cidHexRaw
        return await DaoContract.commpToBounty(cidHex)
    }

    // returns the Proposal details of a CBOR commP
    const getCommpProposal = async (DAOaddress:string, commP:string) => {
        const DaoContract = new ethers.Contract(DAOaddress, DAO_abi, signer!)
        const cidHexRaw = new CID(commP).toString('base16').substring(1)
        const cidHex = "0x00" + cidHexRaw
        return await DaoContract.commpToProposal(cidHex)
    }

    // Returns of a commP has been already proposed
    const isCommpProposed = async (DAOaddress:string, commP:string) => {
        const DaoContract = new ethers.Contract(DAOaddress, DAO_abi, signer!)
        const cidHexRaw = new CID(commP).toString('base16').substring(1)
        const cidHex = "0x00" + cidHexRaw
        return await DaoContract.isCommpProposed(cidHex)
    }

    // returns true if a proposal has ended
    const isProposalEnded = async (DAOaddress:string, commP:string) => {
        const DaoContract = new ethers.Contract(DAOaddress, DAO_abi, signer!)
        const cidHexRaw = new CID(commP).toString('base16').substring(1)
        const cidHex = "0x00" + cidHexRaw
        return await DaoContract.isProposalEnded(cidHex)
    }

    // Only the creator of the DAO can do that the ADMIN
    const addVoter = async(DAOaddress:string, newVoterAddress:string) => {
        const DaoContract = new ethers.Contract(DAOaddress, DAO_abi, signer!)
        const tx = await DaoContract.grantRole(VOTER_ROLE,newVoterAddress)
        return await tx.wait()
    }

    // Only the creator of the DAO can do that the ADMIN
    const removeVoter = async(DAOaddress:string, VoterAddress:string) => {
        const DaoContract = new ethers.Contract(DAOaddress, DAO_abi, signer!)
        const tx = await DaoContract.revokeRole(VOTER_ROLE, VoterAddress)
        return await tx.wait()
    }

    // Only the creator of the DAO can do that the ADMIN
    const addProposer = async(DAOaddress:string, newProposerAddress:string) => {
        const DaoContract = new ethers.Contract(DAOaddress, DAO_abi, signer!)
        const tx = await DaoContract.grantRole(PROPOSER_ROLE, newProposerAddress)
        return await tx.wait()
    }

    // Only the creator of the DAO can do that the ADMIN
    const removeProposer = async(DAOaddress:string, newProposerAddress:string) => {
        const DaoContract = new ethers.Contract(DAOaddress, DAO_abi, signer!)
        const tx = await DaoContract.revokeRole(PROPOSER_ROLE, newProposerAddress)
        return await tx.wait()
    }


    return {
        createDataDao,
        getDataDaos,
        createProposal,
        vote,
        executeProposal,
        createBounty,
        fundBounty,
        claim_bounty,
        isBountyEnabled,
        isBountyCreated,
        isValidProposedFile,
        checkVoterRole,
        checkProposerRole,
        getTotalCIDs,
        getCommpDeals,
        getCommpByID,
        getCommpBounty,
        getCommpProposal,
        isProposalEnded,
        isCommpProposed,
        addVoter,
        removeVoter,
        addProposer,
        removeProposer
    }
}