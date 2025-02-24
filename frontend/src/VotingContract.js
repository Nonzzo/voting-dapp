import React, { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from './contractConfig';

function VotingContract() {
    const [contract, setContract] = useState(null);
    const [account, setAccount] = useState(null);
    const [candidates, setCandidates] = useState([]);
    const [newCandidate, setNewCandidate] = useState("");
    const [voterAddress, setVoterAddress] = useState("");
    const [isAdmin, setIsAdmin] = useState(false);
    const [isRegisteredVoter, setIsRegisteredVoter] = useState(false);
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);

    // Define handleAccountChange before it's used
    const handleAccountChange = useCallback(async (accounts) => {
        if (accounts.length > 0) {
            const currentAccount = accounts[0];
            setAccount(currentAccount);
            
            if (contract) {
                try {
                    // Check if connected account is admin
                    const adminAddress = await contract.admin();
                    const isAdminAccount = adminAddress.toLowerCase() === currentAccount.toLowerCase();
                    setIsAdmin(isAdminAccount);
                    
                    // Check if connected account is a registered voter
                    const isVoter = await contract.voters(currentAccount);
                    setIsRegisteredVoter(isVoter);
                    
                    // Load candidates
                    const candidateList = await contract.getCandidates();
                    setCandidates(candidateList);
                } catch (error) {
                    console.error("Error updating account status:", error);
                    setMessage("Error checking account status: " + error.message);
                }
            }
        } else {
            setAccount(null);
            setIsAdmin(false);
            setIsRegisteredVoter(false);
        }
    }, [contract]); // Add contract as dependency

    const checkNetwork = async () => {
        if (window.ethereum) {
            const chainId = await window.ethereum.request({ method: 'eth_chainId' });
            // Sepolia chain ID is 0xaa36a7
            if (chainId !== '0xaa36a7') {
                try {
                    await window.ethereum.request({
                        method: 'wallet_switchEthereumChain',
                        params: [{ chainId: '0xaa36a7' }], // Sepolia
                    });
                } catch (error) {
                    console.error('Failed to switch network:', error);
                    setMessage('Please switch to Sepolia network in MetaMask');
                }
            }
        }
    };

    const checkMetaMaskConnection = useCallback(async () => {
        if (typeof window.ethereum !== 'undefined') {
            try {
                // Remove existing listeners first
                window.ethereum.removeAllListeners('accountsChanged');
                window.ethereum.removeAllListeners('chainChanged');

                const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
                if (!accounts || accounts.length === 0) {
                    throw new Error('No accounts found');
                }

                const provider = new ethers.providers.Web3Provider(window.ethereum);
                const signer = provider.getSigner();
                const votingContract = new ethers.Contract(
                    CONTRACT_ADDRESS,
                    CONTRACT_ABI,
                    signer
                );
                
                setContract(votingContract);
                await handleAccountChange(accounts);
                
                // Add new listeners
                window.ethereum.on('accountsChanged', handleAccountChange);
                window.ethereum.on('chainChanged', () => window.location.reload());

                setMessage("");
            } catch (error) {
                console.error("Connection error:", error);
                setMessage("Error connecting: " + error.message);
            }
        } else {
            setMessage("Please install MetaMask!");
        }
    }, [handleAccountChange]);

    useEffect(() => {
        checkMetaMaskConnection();
        checkNetwork();
        return () => {
            if (window.ethereum) {
                window.ethereum.removeAllListeners('accountsChanged');
                window.ethereum.removeAllListeners('chainChanged');
            }
        };
    }, [checkMetaMaskConnection]);



    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!newCandidate.trim()) {
            setMessage("Please enter a candidate name");
            return;
        }
        await registerCandidate();
    };

    const registerCandidate = async () => {
        if (!contract) return;
        setLoading(true);
        setMessage("");
        try {
            const tx = await contract.registerCandidate(newCandidate);
            setMessage("Registering candidate... Please wait for confirmation.");
            await tx.wait();
            
            // Refresh candidates list
            const updatedCandidates = await contract.getCandidates();
            setCandidates(updatedCandidates);
            setNewCandidate(""); // Clear input
            setMessage("Candidate registered successfully!");
        } catch (error) {
            console.error("Error:", error);
            setMessage(error.message || "Error registering candidate");
        } finally {
            setLoading(false);
        }
    };

    const registerVoter = async (e) => {
        e.preventDefault();
        if (!contract || !voterAddress) {
            setMessage("Please enter an address");
            return;
        }
        setLoading(true);
        setMessage("");
        
        try {
            // Enhanced address validation
            if (!ethers.utils.isAddress(voterAddress)) {
                setMessage("Invalid Ethereum address format");
                return;
            }

            const tx = await contract.registerVoter(voterAddress);
            setMessage("Registering voter... Please wait for confirmation.");
            await tx.wait();
            setMessage("Voter registered successfully!");
            setVoterAddress(""); // Clear input
            
            // Update voter status if the registered address is the current user
            if (voterAddress.toLowerCase() === account?.toLowerCase()) {
                setIsRegisteredVoter(true);
            }
        } catch (error) {
            console.error("Error:", error);
            setMessage(error.message || "Error registering voter");
        } finally {
            setLoading(false);
        }
    };

    const vote = async (candidateName) => {
        if (!contract) return;
        setLoading(true);
        setMessage("");
        
        try {
            if (!isRegisteredVoter) {
                throw new Error("You are not a registered voter.");
            }
    
            // Check if already voted
            const hasVoted = await contract.hasVoted(account);
            if (hasVoted) {
                throw new Error("You have already voted.");
            }
    
            console.log('Voting for:', candidateName);
            console.log('Current account:', account);
            
            // Simple transaction without extra parameters
            const tx = await contract.vote(candidateName);
            setMessage("Casting vote... Please wait for confirmation.");
            
            const receipt = await tx.wait();
            console.log('Transaction receipt:', receipt);
            
            if (receipt.status === 1) {
                setMessage("Vote cast successfully!");
            } else {
                throw new Error("Transaction failed");
            }
    
        } catch (error) {
            console.error("Error:", error);
            if (error.code === 4001) {
                setMessage("Transaction rejected by user");
            } else {
                setMessage(error.message || "Error casting vote");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container">
            <h1>Voting System</h1>
            <p>Connected Account: {account}</p>
            {isAdmin && <p>You are the admin</p>}
            {isRegisteredVoter && <p>You are a registered voter</p>}
            
            {message && (
                <div className="message">
                    {message}
                </div>
            )}
            
            {/* Admin Section */}
            {isAdmin && (
                <div className="admin-section">
                    <h2>Admin Controls</h2>
                    
                    {/* Candidate Registration */}
                    <div className="registration-section">
                        <h3>Register Candidate</h3>
                        <form onSubmit={handleSubmit}>
                            <input 
                                value={newCandidate}
                                onChange={(e) => setNewCandidate(e.target.value)}
                                placeholder="Enter candidate name"
                                disabled={loading}
                            />
                            <button type="submit" disabled={loading}>
                                {loading ? "Processing..." : "Register Candidate"}
                            </button>
                        </form>
                    </div>

                    {/* Voter Registration */}
                    <div className="registration-section">
                        <h3>Register Voter</h3>
                        <form onSubmit={registerVoter}>
                            <input 
                                value={voterAddress}
                                onChange={(e) => setVoterAddress(e.target.value)}
                                placeholder="Enter voter's Ethereum address"
                                disabled={loading}
                            />
                            <button type="submit" disabled={loading}>
                                {loading ? "Processing..." : "Register Voter"}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Voting Section */}
            <div className="voting-section">
                <h2>Candidates</h2>
                {candidates.length === 0 ? (
                    <p>No candidates registered yet</p>
                ) : (
                    <ul>
                        {candidates.map((candidate, index) => (
                            <li key={index}>
                                {candidate}
                                <button 
                                    onClick={() => vote(candidate)}
                                    disabled={loading || !isRegisteredVoter}
                                >
                                    {loading ? "Processing..." : "Vote"}
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
                {!isRegisteredVoter && (
                    <p className="warning">You need to be registered to vote. Please contact the admin.</p>
                )}
            </div>
        </div>
    );
}

export default VotingContract;