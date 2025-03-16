# Decentralized Voting System

A blockchain-based voting system built with Solidity, Foundry, React, and Ethereum. This dApp features secure voting mechanisms, admin controls, and result storage on IPFS via Pinata.

## Features

- 🔐 Secure voting mechanism with MetaMask integration
- 👥 Admin-controlled voter registration
- 📊 Real-time vote counting
- 🗳️ Multiple candidate support
- 📜 IPFS result storage using Pinata
- 🔄 Election state management (active/ended)
- 🛑 Result finalization and publishing

## Tech Stack

- **Smart Contract Development**:
  - Solidity
  - Foundry (Forge)
  - Sepolia Testnet

- **Frontend**:
  - React.js
  - ethers.js v5
  - CSS3

- **Storage & Infrastructure**:
  - IPFS (Pinata)
  - MetaMask

## Prerequisites

- [Git](https://git-scm.com/)
- [Foundry](https://book.getfoundry.sh/getting-started/installation)
- [Node.js](https://nodejs.org/) (v14 or later)
- [MetaMask](https://metamask.io/)
- Sepolia ETH ([faucet](https://sepoliafaucet.com/))

## Installation

1. Clone the repository:
```bash
git clone https://github.com/Nonzzo/voting-dapp.git
cd voting-dapp
```

2. Install Foundry dependencies and compile contracts:
```bash

forge install
forge build
```

3. Install frontend dependencies:
```bash
cd frontend
npm install
```

## Configuration

1. Create a `.env` file in the frontend directory:
```properties
REACT_APP_PINATA_JWT=your_pinata_jwt_here
```

2. Create `contractConfig.js` in your frontend:

```javascript
// filepath: /Users/mac/voting-dapp/frontend/src/contractConfig.js
export const CONTRACT_ADDRESS = "0xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx";
export const CONTRACT_ABI = [...]; // Your contract ABI here
```

2. Import and use in your React components:

```javascript
import { CONTRACT_ADDRESS, CONTRACT_ABI } from './contractConfig';

// Initialize contract
const contract = new ethers.Contract(
    CONTRACT_ADDRESS,
    CONTRACT_ABI,
    signer
);
```

## Deployment

1. Deploy the contract using Forge:
```bash
forge create --rpc-url $SEPOLIA_RPC_URL --private-key $PRIVATE_KEY --broadcast
```

2. Start the frontend development server:
```bash
cd frontend
npm start
```

## Usage

### Admin Functions
- Register voters using their Ethereum addresses
- Add candidates to the ballot
- Monitor real-time voting progress
- End election and publish results to IPFS

### Voter Functions
- Connect with MetaMask
- Vote for a candidate (if registered)
- View election results after closure

## Smart Contract Functions

```solidity
function registerVoter(address voter) external;
function registerCandidate(string memory candidateName) external;
function vote(string memory candidateName) external;
function closeElection() external;
function getElectionStatus() external view returns (bool, bool, string memory);
```

## Testing

1. Run contract tests:
```bash
forge test
```

## Security Considerations

- Only registered voters can cast votes
- One vote per registered address
- Only admin can register voters and candidates
- Results are permanently stored on IPFS
- Election state changes are irreversible

## IPFS Integration

The dApp uses Pinata for IPFS storage:
- Election results are uploaded to IPFS
- CID is stored in the smart contract
- Results are viewable via Pinata Gateway

### More Notes
- Keep your contract address and ABI updated after new deployments
- MetaMask must be connected to Sepolia testnet
- Admin functions will fail if called from non-admin address
- All write functions require MetaMask confirmation and gas fees

## Environment Setup

1. Configure Sepolia network in MetaMask:
   - Network Name: Sepolia Test Network
   - RPC URL: https://sepolia.infura.io/v3/your-project-id
   - Chain ID: 11155111
   - Currency Symbol: SEP

2. Get test ETH from [Sepolia Faucet](https://sepoliafaucet.com)

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [Foundry](https://book.getfoundry.sh/)
- [Pinata IPFS](https://www.pinata.cloud/)
- [ethers.js](https://docs.ethers.org/v5/)
