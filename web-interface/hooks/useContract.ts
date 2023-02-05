import {ethers} from "ethers";
import {factory_abi, daoFactoryAddress} from "../constants"
import {useSigner} from "wagmi";
import CID from 'cids';


// Proposals are created only by proposers and We make an Orbis Post with each post to contain the commP + info
//  So from that we know how to find the possible states of the Proposal by those conditions

// if isProposalEnded == false {Voting Period}
// if isProposalEnded == true && isValidProposedFile == true {Proposal Passed}
// if isProposalEnded == true && isValidProposedFile == false {Proposal Declined}

// Bounties are created only by proposers and We make an Orbis Post with each post to  contain the commP + info 
//  So from that we know how to find the possible states of the Proposal by those conditions

// If isBountyCreated == true and isBountyEnabled == false {Funding Phase}
// if isBountyEnabled == true {Claiming Phase}
// If isBountyCreated == false and isBountyEnabled == false {Fully claimed Phase}
// if isProposalEnded == true && isValidProposedFile == true && !isBountyEnabled {you can create bounty}

export const useContract = () => {


    const {data: signer} = useSigner()

    const contract = new ethers.Contract(daoFactoryAddress["dao-factory"], factory_abi, signer!)
    const ADMIN_ROLE = "0x0000000000000000000000000000000000000000000000000000000000000000"
    const VOTER_ROLE = "0x72c3eec1760bf69946625c2d4fb8e44e2c806345041960b434674fb9ab3976cf"
    // Creates a new DataDao
    const createDataDao = async (admins: string[], voters: string[], name: string, groupID: string) => {
        const tx = await contract.createDataDAO(admins, voters, name, groupID)
        return await tx.wait()
    }

    //  Returns all the info from all the DataDAOs that the factory has created (address, name ,groupID)
    const getDataDaos = async () => {
        return await contract.getAllDAOs()
    }

    // Get a list of all possible files on hyperspace by using 
    // this endpoint = https://marketdeals-hyperspace.s3.amazonaws.com/StateMarketDeals.json
    // this endpoint returns all the deals in the testnet 
    // Check first if that commP is already proposed
    // you can do that by calling isCommpProposed(commP) 
    // Create a proposal Post on the groupID of that DAO with info about the commP (commP , description, size)
    const createProposal = async (DaoContract: ethers.Contract, commP: string, proposalMetadata: string, durationInBlocks: number) => {
        const cidHexRaw = new CID(commP).toString('base16').substring(1)
        const cidHex = "0x00" + cidHexRaw
        const tx = await DaoContract.createProposal(cidHex, proposalMetadata, durationInBlocks, {gasLimit: 10000000000})
        return tx.wait()
    }

    // Check first checkVoterRole || checkProposerRole to the caller
    // Voting happens in the Proposal post if the proposal is not ended
    // you can check that by calling isProposalEnded(commP)
    const vote = async (DaoContract: ethers.Contract, commP: string, decision: boolean) => {
        const cidHexRaw = new CID(commP).toString('base16').substring(1)
        const cidHex = "0x00" + cidHexRaw
        const tx = await DaoContract.vote(cidHex, decision, {gasLimit: 10000000000})
        return await tx.wait()
    }

    // Check first that commP has passed a proposal by calling  isValidProposedFile(commP)
    // Only proposers can make that action
    const createBounty = async (DaoContract: ethers.Contract, commP: string, numberOfBounties: number, bountyReward: number, minDealDays: number, fileSize: number) => {
        const cidHexRaw = new CID(commP).toString('base16').substring(1)
        const cidHex = "0x00" + cidHexRaw
        const amount = ethers.utils.parseEther(bountyReward.toString())
        console.log("cidHex", cidHex, "numberOfBounties", numberOfBounties, "amount", amount, "minDealDays", minDealDays, "fileSize", fileSize)
        const tx = await DaoContract.createBounty(cidHex, numberOfBounties, amount, minDealDays, fileSize, {gasLimit: 10000000000})
        return await tx.wait()
    }

    // Everyone can Fund
    // Dont fund more that the remaining needed fnding you can get the remaining needed funding
    // by getting the bunty details using getCommpBounty(commP) and find the requiredTokens - donatedTokens
    const fundBounty = async (DaoContract: ethers.Contract, commP: string, fundAmount: string) => {
        const cidHexRaw = new CID(commP).toString('base16').substring(1)
        const cidHex = "0x00" + cidHexRaw
        const amount = ethers.utils.parseEther(fundAmount)
        const tx = await DaoContract.fundBounty(cidHex, {value: amount, gasLimit: 10000000000})
        return await tx.wait()
    }

    // Anyone can call but is built to get called by the dealer to get the reward
    // but whoever calls it if that dealID corresponds to a commP that has an enabled bounty
    // the function will reward the dealMaker 
    const claim_bounty = async (DaoContract: ethers.Contract, dealID: number) => {
        const tx = await DaoContract.claim_bounty(dealID, {gasLimit: 10000000000})
        return await tx.wait()
    }

    // Returns the dealIDs that have been claimed for a certain commP
    // Desplay them in the Bounty Card
    const getCommpDeals = async (DaoContract: ethers.Contract, commP: string) => {
        const cidHexRaw = new CID(commP).toString('base16').substring(1)
        const cidHex = "0x00" + cidHexRaw
        return await DaoContract.getDeals(cidHex)
    }

    // Returns true from the time that the bounty has been created untill the bounty has gives all its claims
    const isBountyCreated = async (DaoContract: ethers.Contract, commP_Id: number) => {
        return await DaoContract.isBountyFunded(commP_Id)
    }


    // Returns true id that commP has beed proposed and the result after voting was True/yes
    const isValidProposedFile = async (DaoContract: ethers.Contract, commP: string) => {
        const cidHexRaw = new CID(commP).toString('base16').substring(1)
        const cidHex = "0x00" + cidHexRaw
        return await DaoContract.isValidProposedFile(cidHex)
    }

    // Checks is an address has the voter role by returning a bool
    const checkVoterRole = async (DaoContract: ethers.Contract, voter: string) => {
        return await DaoContract.hasRole(VOTER_ROLE,voter)
    }

    // Checks is an address has the proposer role by returning a bool
    const checkProposerRole = async (DaoContract: ethers.Contract, proposer: string) => {
        return await DaoContract.hasRole(ADMIN_ROLE,proposer)
    }

    // returns the Bounty details of a CBOR commP
    const getCommpBounty = async (DaoContract: ethers.Contract, commP: string) => {
        const cidHexRaw = new CID(commP).toString('base16').substring(1)
        const cidHex = "0x00" + cidHexRaw
        return await DaoContract.commpToBounty(cidHex)
    }

    // returns the Proposal details of a CBOR commP
    const getCommpProposal = async (DaoContract: ethers.Contract, commP: string) => {
        const cidHexRaw = new CID(commP).toString('base16').substring(1)
        const cidHex = "0x00" + cidHexRaw
        return await DaoContract.commpToProposal(cidHex)
    }

    // Returns of a commP has been already proposed
    const isCommpProposed = async (DaoContract: ethers.Contract, commP: string) => {
        const cidHexRaw = new CID(commP).toString('base16').substring(1)
        const cidHex = "0x00" + cidHexRaw
        return await DaoContract.isCommpProposed(cidHex)
    }

    // returns true if a proposal has ended
    const isProposalEnded = async (DaoContract: ethers.Contract, commP: string) => {
        const cidHexRaw = new CID(commP).toString('base16').substring(1)
        const cidHex = "0x00" + cidHexRaw
        return await DaoContract.isProposalEnded(cidHex)
    }

    // Only the creator of the DAO can do that the ADMIN
    const addVoter = async (DaoContract: ethers.Contract, newVoterAddress: string) => {
        const tx = await DaoContract.grantRole(VOTER_ROLE, newVoterAddress, {gasLimit: 10000000000})
        return await tx.wait()
    }

    // Only the creator of the DAO can do that the ADMIN
    const removeVoter = async (DaoContract: ethers.Contract, VoterAddress: string) => {
        const tx = await DaoContract.revokeRole(VOTER_ROLE, VoterAddress, {gasLimit: 10000000000})
        return await tx.wait()
    }

    // Only the creator of the DAO can do that the ADMIN
    const addProposer = async (DaoContract: ethers.Contract, newProposerAddress: string) => {
        const tx = await DaoContract.grantRole(ADMIN_ROLE, newProposerAddress, {gasLimit: 10000000000})
        return await tx.wait()
    }

    // Only the creator of the DAO can do that the ADMIN
    const removeProposer = async (DaoContract: ethers.Contract, newProposerAddress: string) => {
        const tx = await DaoContract.revokeRole(ADMIN_ROLE, newProposerAddress, {gasLimit: 10000000000})
        return await tx.wait()
    }


    return {
        createDataDao,
        getDataDaos,
        createProposal,
        vote,
        createBounty,
        fundBounty,
        claim_bounty,
        isBountyCreated,
        isValidProposedFile,
        checkVoterRole,
        checkProposerRole,
        getCommpDeals,
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
