// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

contract VotingSystem {
    address public admin;
    mapping(address => bool) public voters;
    mapping(address => bool) public hasVoted;
    mapping(string => bool) public validCandidates;
    mapping(string => uint256) public votes;
    string[] public candidates;
    bool public electionActive = true;
    bool public electionEnded;
    string public electionResultsIPFSHash;
    mapping(string => uint256) public finalResults;

    event CandidateRegistered(string candidateName);
    event VoterRegistered(address voter);
    event Voted(address voter, string candidate);
    event ElectionClosed();
    event ElectionReset();
    event ElectionResultsStored(string ipfsHash);
    event FinalResultsCalculated();
    
    constructor() {
        admin = msg.sender;
    }
    
    modifier onlyAdmin() {
        require(msg.sender == admin, "Not authorized");
        _;
    }

    modifier electionOpen() {
        require(electionActive, "Election is not active");
        require(!electionEnded, "Election has ended");
        _;
    }

    // Register candidates
    function registerCandidate(string memory candidateName) public onlyAdmin electionOpen {
        require(!validCandidates[candidateName], "Candidate already registered");
        candidates.push(candidateName);
        validCandidates[candidateName] = true;
        emit CandidateRegistered(candidateName);
    }

    // Register a voter
    function registerVoter(address voter) public onlyAdmin electionOpen {
        require(!voters[voter], "Voter already registered");
        voters[voter] = true;
        emit VoterRegistered(voter);
    }

    // Cast vote
    function vote(string memory candidateName) public electionOpen {
        require(voters[msg.sender], "You are not a registered voter");
        require(!hasVoted[msg.sender], "Already voted");
        require(validCandidates[candidateName], "Invalid candidate");
        
        votes[candidateName] += 1;
        hasVoted[msg.sender] = true;
        emit Voted(msg.sender, candidateName);
    }

    // Close the election and calculate final results
    function closeElection() public onlyAdmin {
        require(electionActive, "Election is not active");
        require(!electionEnded, "Election already ended");
        
        electionActive = false;
        electionEnded = true;
        
        // Calculate and store final results
        for(uint i = 0; i < candidates.length; i++) {
            string memory candidateName = candidates[i];
            finalResults[candidateName] = votes[candidateName];
        }
        
        emit ElectionClosed();
        emit FinalResultsCalculated();
    }

    // Store election results IPFS hash
    function storeElectionResultsIPFS(string memory ipfsHash) public onlyAdmin {
        require(electionEnded, "Election must be ended first");
        require(bytes(ipfsHash).length > 0, "Invalid IPFS hash");
        
        electionResultsIPFSHash = ipfsHash;
        emit ElectionResultsStored(ipfsHash);
    }

    // Get final results for a candidate
    function getFinalResults(string memory candidateName) public view returns (uint256) {
        require(electionEnded, "Election has not ended yet");
        require(validCandidates[candidateName], "Invalid candidate");
        return finalResults[candidateName];
    }

    // Reset the election
    function resetElection() public onlyAdmin {
        require(!electionActive && electionEnded, "Can only reset after election has ended");
        
        // Reset election state
        electionActive = true;
        electionEnded = false;
        electionResultsIPFSHash = "";
        
        // Reset votes and final results
        for (uint i = 0; i < candidates.length; i++) {
            votes[candidates[i]] = 0;
            finalResults[candidates[i]] = 0;
        }
        
        // Reset voter status but maintain registration
        for (uint i = 0; i < candidates.length; i++) {
            hasVoted[msg.sender] = false;
        }
        
        emit ElectionReset();
    }

    // Transfer admin rights
    function transferAdmin(address newAdmin) public onlyAdmin {
        require(newAdmin != address(0), "Invalid address");
        admin = newAdmin;
    }

    // Get vote count for a candidate
    function getVotes(string memory candidateName) public view returns (uint256) {
        require(validCandidates[candidateName], "Invalid candidate");
        return votes[candidateName];
    }

    // Get list of all candidates
    function getCandidates() public view returns (string[] memory) {
        return candidates;
    }

    // Get election status
    function getElectionStatus() public view returns (bool isActive, bool isEnded, string memory resultsHash) {
        return (electionActive, electionEnded, electionResultsIPFSHash);
    }
}