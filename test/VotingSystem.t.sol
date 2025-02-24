// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Test.sol";
import "../src/VotingSystem.sol";

contract VotingSystemTest is Test {
    VotingSystem votingSystem;
    address admin;
    address voter1;
    address voter2;

    function setUp() public {
        admin = address(this);
        votingSystem = new VotingSystem();
        voter1 = makeAddr("voter1");
        voter2 = makeAddr("voter2");
        vm.deal(voter1, 1 ether);
        vm.deal(voter2, 1 ether);
    }

    function test_InitialState() public view {
        assertTrue(votingSystem.electionActive());
        assertFalse(votingSystem.electionEnded());
        assertEq(votingSystem.admin(), address(this));
    }

    function test_RegisterCandidate() public {
        votingSystem.registerCandidate("Alice");
        string[] memory candidates = votingSystem.getCandidates();
        assertEq(candidates.length, 1);
        assertEq(candidates[0], "Alice");
    }

    function test_RegisterVoter() public {
        votingSystem.registerVoter(voter1);
        assertTrue(votingSystem.voters(voter1));
    }

    function test_SuccessfulVote() public {
        votingSystem.registerCandidate("Bob");
        votingSystem.registerVoter(voter1);

        vm.prank(voter1);
        votingSystem.vote("Bob");

        assertEq(votingSystem.getVotes("Bob"), 1);
    }

    function test_RevertWhen_VotingWithoutRegistration() public {
        votingSystem.registerCandidate("Charlie");
        
        vm.prank(voter1);
        vm.expectRevert("You are not a registered voter");
        votingSystem.vote("Charlie");
    }

    function test_RevertWhen_VotingTwice() public {
        votingSystem.registerCandidate("David");
        votingSystem.registerVoter(voter1);

        vm.startPrank(voter1);
        votingSystem.vote("David");
        
        vm.expectRevert("Already voted");
        votingSystem.vote("David");
        vm.stopPrank();
    }

    function test_CloseElection() public {
        votingSystem.registerCandidate("Eve");
        votingSystem.registerVoter(voter1);
        
        vm.prank(voter1);
        votingSystem.vote("Eve");

        votingSystem.closeElection();
        
        assertTrue(votingSystem.electionEnded());
        assertFalse(votingSystem.electionActive());
    }

    function test_RevertWhen_VotingAfterClose() public {
        votingSystem.registerCandidate("Frank");
        votingSystem.registerVoter(voter1);
        votingSystem.closeElection();

        vm.prank(voter1);
        vm.expectRevert("Election is not active");
        votingSystem.vote("Frank");
    }

    function test_ElectionReset() public {
        votingSystem.registerCandidate("Grace");
        votingSystem.closeElection();
        
        votingSystem.resetElection();
        
        assertTrue(votingSystem.electionActive());
        assertFalse(votingSystem.electionEnded());
    }

    function test_RevertWhen_NonAdminResetsElection() public {
        vm.prank(voter1);
        vm.expectRevert("Not authorized");
        votingSystem.resetElection();
    }

    function test_StoreAndRetrieveIPFSHash() public {
        // First close the election
        votingSystem.registerCandidate("TestCandidate");
        votingSystem.registerVoter(voter1);
        vm.prank(voter1);
        votingSystem.vote("TestCandidate");
        votingSystem.closeElection();

        // Now store IPFS hash
        string memory testHash = "QmTest123";
        votingSystem.storeElectionResultsIPFS(testHash);
        assertEq(votingSystem.electionResultsIPFSHash(), testHash);
    }
}