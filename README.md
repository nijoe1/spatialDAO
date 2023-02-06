<h1>
 Welcome to spatialDAO
</h1>

<p>
<img src="./web-interface/public/logo.webp" alt="alt text" width="40%"/>
</p>

[Demo video](https://stream.mux.com/hMlMlXtSLYVoXjFdMgPhRtG00r9FluR2NjI02aAmw00MSw/high.mp4)

to run on localhost just run
**yarn install**
**yarn dev**

Our application is hosted on that link.
 * [dapp link](https://spatialdao.live/)


Authors
 * [nijoe1](https://github.com/nijoe1)
 * [Suhel-Kap](https://github.com/Suhel-Kap)

## Short Description

SpatialDAO is a dataDAO Factory that allows created dataDAOs in the platform to make file proposals and bounties for specific commitment pieces. Deal clients, on the other hand, are hunting bounties and making storage deals for DAO-proposed data and getting rewarded for that!
<br/>

## Long Description
SpatialDAO is a platform that enables organizations to create and monetize their own dataDAOs (Decentralized Autonomous Organizations) using the Filecoin Ethereum Virtual Machine (FEVM). The platform operates on a bounty philosophy, where each organization has a set of proposers, voters, and administrators. Administrators can add or remove proposers, proposers can create proposals for data storage, and voters can vote on the importance of the data. If a proposal is accepted, proposers can create bounties to fund the storage of that data. Bounties can only be created for successfully voted files, and they keep information about the bounty reward and the number of bounties the organization will offer for that file. Deal clients in the Filecoin ecosystem can search for bounties, create storage deals for the files that have bounties, and claim bounties once the dataDAO contract verifies that the storage deal has been made on the network. The SpatialDAO offers a social layer that utilizes Orbis.club that is operating on the Ceramic network to allow organizations to explore proposals and bounties, as well as providing a communication layer for its members.

 ## ARCHITECTURE

<p align="left">
<img src="./web-interface/public/spatialDAO_architecture.webp"/>
 
# Technologies Used

<br/>
This is how we used the FEVM hyperspace testnet - NFT.Storage - Orbis SDK - Gitcoin Passport
<br />
<br />
  
   **Gitcoin Passport** 
    <br />
        We are using Gitcoin Passport by leveraging the Orbis SDK to display to each UserProfile their Verifiable Credentials but also we are using the VCs to lock content and finally to assign into a Vocdoni Proposal only members with the isHuman Verifiable Credential to be sure that no bot is able to vote into that proposal.
        <br/>
        **Here is the code snippet that we are leveraging GitcoinPassport**
        <br/>
        **https://github.com/Suhel-Kap/the-crypto-studio/blob/main/components/UserVcs.tsx**
  <br/>
   **Orbis SDK** 
    <br />
       The Crypto Studio uses the orbis SDK, built on the Ceramic network, to power its decentralized social platform. Orbis provides us user profiles, posts, and spaces for organization and collaboration managment, as well as tools for creating polls (via Vocdoni), posts, encrypted posts (via Lit Protocol), and NFTs. All of this information is stored on the Ceramic network to ensure a decentralized and secure environment. Orbis plays a key role in enabling The Crypto Studio to function as a decentralized social platform and provide a range of features for users to connect and engage with NFT communities.
        <br />
         // ** **
         <br />
         <br />
  **NFT.STORAGE**
     <br />
       All the files that consist an NFT are stored on the IPFS network using NFT.STORAGE
       The code snippets that are using NFT.STORAGE modules are located here:
       <br/>
        // ** **
    <br />
   
  ## SmartContracts
  Our contract is deployed on FEVM HyperSpace Testnet here is the contract glif explorer Link . 
<br />
####https://explorer.glif.io/address/t410fhqvk5g43q5jjeyqdxd3aizi6mii7bm45xft3kvy/?network=hyperspacenet

