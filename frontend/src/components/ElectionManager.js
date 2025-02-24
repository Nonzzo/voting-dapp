import React, { useState, useEffect, useCallback } from 'react';
import { uploadToIPFS } from '../utils/ipfs';
import IPFSTest from './IPFSTest';
import './ElectionManager.css';

const PINATA_GATEWAY = 'https://gateway.pinata.cloud/ipfs';

const ElectionManager = ({ contract, isAdmin }) => {
    const [electionStatus, setElectionStatus] = useState({
        isActive: true,
        isEnded: false,
        resultsHash: ''
    });
    const [results, setResults] = useState({});
    const [candidates, setCandidates] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [ipfsHash, setIpfsHash] = useState('');
    const [currentVotes, setCurrentVotes] = useState({});

    const loadCandidates = useCallback(async () => {
        if (!contract) return;
        try {
            const candidateList = await contract.getCandidates();
            setCandidates(candidateList);
        } catch (error) {
            console.error('Error loading candidates:', error);
        }
    }, [contract]);

    const loadCurrentVotes = useCallback(async () => {
        if (!contract || !candidates.length) return;
        try {
            const votes = {};
            for (const candidate of candidates) {
                const voteCount = await contract.getVotes(candidate);
                votes[candidate] = voteCount.toString();
            }
            setCurrentVotes(votes);
        } catch (error) {
            console.error('Error loading votes:', error);
        }
    }, [contract, candidates]);

    const loadElectionStatus = useCallback(async () => {
        if (!contract) return;
        try {
            const [isActive, isEnded] = await Promise.all([
                contract.electionActive(),
                contract.electionEnded()
            ]);
            
            const hash = await contract.electionResultsIPFSHash();
            
            setElectionStatus({
                isActive,
                isEnded,
                resultsHash: hash
            });
            
            if (hash) {
                setIpfsHash(hash);
            }
        } catch (error) {
            console.error('Error loading election status:', error);
            setError('Failed to load election status');
        }
    }, [contract]);

    useEffect(() => {
        if (contract && isAdmin) {
            loadCandidates();
            loadElectionStatus();
        }
    }, [contract, isAdmin, loadCandidates, loadElectionStatus]);

    useEffect(() => {
        if (contract && isAdmin && !electionStatus.isEnded) {
            loadCurrentVotes();
            const interval = setInterval(loadCurrentVotes, 10000);
            return () => clearInterval(interval);
        }
    }, [contract, isAdmin, electionStatus.isEnded, loadCurrentVotes]);

    const handleEndElection = async () => {
        if (!contract) return;
        setLoading(true);
        setError('');
        
        try {
            // First close the election
            const closeTx = await contract.closeElection();
            setMessage("Closing election... Please wait for confirmation.");
            await closeTx.wait();

            // Get final results
            const results = {};
            for (const candidate of candidates) {
                const votes = await contract.getFinalResults(candidate);
                results[candidate] = votes.toString();
            }

            // Prepare data for IPFS
            const electionData = {
                endTime: new Date().toISOString(),
                results,
                candidates: candidates.map(name => ({
                    name,
                    votes: results[name]
                }))
            };

            // Upload to IPFS
            setMessage("Uploading results to IPFS...");
            const hash = await uploadToIPFS(electionData);
            setIpfsHash(hash);

            // Store hash in contract
            setMessage("Storing IPFS hash on blockchain...");
            const hashTx = await contract.storeElectionResultsIPFS(hash);
            await hashTx.wait();

            setResults(results);
            await loadElectionStatus();
            setMessage("Election closed successfully!");
        } catch (error) {
            console.error('Error ending election:', error);
            setError(error.message || 'Failed to end election');
        } finally {
            setLoading(false);
        }
    };

    if (!isAdmin) {
        return null;
    }

    return (
        <div className="election-manager">
            <h2>Election Management</h2>
            
            {error && <div className="error-message">{error}</div>}
            {message && <div className="success-message">{message}</div>}
            
            {!electionStatus.isEnded && (
                <>
                    <IPFSTest />
                    <div className="current-votes">
                        <h3>Current Vote Counts</h3>
                        {Object.entries(currentVotes).map(([candidate, votes]) => (
                            <div key={candidate} className="vote-count-item">
                                <span className="candidate-name">{candidate}</span>
                                <span className="vote-count">{votes} votes</span>
                            </div>
                        ))}
                    </div>
                    <button 
                        className="end-election-btn"
                        onClick={handleEndElection}
                        disabled={loading}
                    >
                        {loading ? "Processing..." : "End Election"}
                    </button>
                </>
            )}
            
            {electionStatus.isEnded && (
                <div className="results-section">
                    <h3>Final Results</h3>
                    {Object.entries(results).map(([candidate, votes]) => (
                        <div key={candidate} className="result-item">
                            <span className="candidate-name">{candidate}</span>
                            <span className="vote-count">{votes} votes</span>
                        </div>
                    ))}
                    
                    {ipfsHash && (
                        <div className="ipfs-info">
                            <h4>IPFS Information</h4>
                            <p>Content Hash (CID): {ipfsHash}</p>
                            <div className="ipfs-links">
                                <h5>View on IPFS Gateways:</h5>
                                <ul>
                                    <li>
                                        <a 
                                             href={`${PINATA_GATEWAY}/${ipfsHash}`}
                                             target="_blank"
                                             rel="noopener noreferrer"
                                        >
                                            View IPFS Results on Pinata Gateway
                                        </a>
                                    
                                        
                                    </li>
                                </ul>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default ElectionManager;