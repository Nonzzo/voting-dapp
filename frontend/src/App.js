import React, { useState, useEffect } from 'react';
import './App.css';
import VotingContract from './VotingContract';
import ElectionManager from './components/ElectionManager';
import { ethers } from 'ethers';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from './contractConfig';
window.CONTRACT_ABI = CONTRACT_ABI;
window.CONTRACT_ADDRESS = CONTRACT_ADDRESS;
window.ethers = ethers;

function App() {
  const [contract, setContract] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [account, setAccount] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const initializeEthereum = async () => {
      if (window.ethereum) {
        try {
          // Request account access
          const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
          setAccount(accounts[0]);

          const provider = new ethers.providers.Web3Provider(window.ethereum);
          const signer = provider.getSigner();
          
          // Initialize contract with imported address and ABI
          const votingContract = new ethers.Contract(
            CONTRACT_ADDRESS,
            CONTRACT_ABI,
            signer
          );

          setContract(votingContract);

          // Check if current user is admin
          const adminAddress = await votingContract.admin();
          setIsAdmin(adminAddress.toLowerCase() === accounts[0].toLowerCase());

          // Setup event listeners for account changes
          window.ethereum.on('accountsChanged', handleAccountChange);
          window.ethereum.on('chainChanged', () => window.location.reload());

        } catch (error) {
          console.error("Error connecting to Ethereum:", error);
          setError(error.message);
        }
      } else {
        setError("Please install MetaMask to use this application");
      }
    };

    const handleAccountChange = async (accounts) => {
      if (accounts.length > 0) {
        setAccount(accounts[0]);
        // Re-check admin status with new account
        if (contract) {
          const adminAddress = await contract.admin();
          setIsAdmin(adminAddress.toLowerCase() === accounts[0].toLowerCase());
        }
      } else {
        setAccount('');
        setIsAdmin(false);
      }
    };

    initializeEthereum();

    // Cleanup function
    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', handleAccountChange);
        window.ethereum.removeListener('chainChanged', () => {});
      }
    };
  }, [contract]); // Add contract as dependency

  return (
    <div className="App">
      <header className="App-header">
        <h1>Decentralized Voting System</h1>
        {account && (
          <p className="account-info">
            Connected Account: {account.slice(0, 6)}...{account.slice(-4)}
          </p>
        )}
      </header>

      <main>
        {error && <div className="error-message">{error}</div>}
        
        {contract && <VotingContract contract={contract} account={account} />}
        
        {contract && (
          <ElectionManager 
            contract={contract} 
            isAdmin={isAdmin}
          />
        )}
      </main>

      <footer>
        <p>Built with Ethereum, React, and MetaMask</p>
      </footer>
    </div>
  );
}

export default App;