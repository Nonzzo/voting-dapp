const { ethers } = require("ethers");

async function main() {
    // Connect to the wallet using MetaMask provider
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    await provider.send("eth_requestAccounts", []);
    const signer = provider.getSigner();

    // Get the contract factory
    const VotingSystem = await ethers.getContractFactory("VotingSystem");
    
    // Deploy the contract
    console.log("Deploying VotingSystem...");
    const votingSystem = await VotingSystem.deploy();
    await votingSystem.deployed();
    
    console.log("VotingSystem deployed to:", votingSystem.address);
    return votingSystem;
}