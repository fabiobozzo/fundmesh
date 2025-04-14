# FundMesh

[![Build Status](https://github.com/fabiobozzo/fundmesh/actions/workflows/test.yml/badge.svg)](https://github.com/fabiobozzo/fundmesh/actions)
[![License: GPL-3.0](https://img.shields.io/badge/License-GPL--3.0-blue.svg)](https://www.gnu.org/licenses/gpl-3.0)
[![Solidity](https://img.shields.io/badge/Solidity-0.8.24-blue.svg)](https://soliditylang.org/)
[![Ethereum](https://img.shields.io/badge/Ethereum-Sepolia-blueviolet)](https://sepolia.etherscan.io/)
[![Next.js](https://img.shields.io/badge/Next.js-14.0.4-black)](https://nextjs.org/)

## Overview

FundMesh is a decentralized crowdfunding DApp built on Ethereum. 
The platform introduces innovative trust mechanisms and milestone-based funding releases to create better alignment between project creators and backers.

### Key Features

- **Milestone-Based Funding**: (WIP) Funds are released progressively as projects achieve community-approved milestones.
- **Community Governance**: Contributors vote on whether projects should receive their next funding tranche.
- **NFT Rewards**: Contributors earn commemorative NFTs for projects they've helped succeed.
- **Full Transparency**: All project funding and governance operates on-chain for complete transparency.
- **No Platform Fees**: Direct creator-to-backer funding without intermediaries.

> **Note:** The milestone-based funding feature is currently a work-in-progress and under active development.

| Feature | Status |
|---------|--------|
| Project Creation | ✅ Implemented |
| Basic Funding | ✅ Implemented |
| NFT Rewards | ✅ Implemented |
| User Profiles | ✅ Implemented |
| Milestone-Based Funding | 🚧 In Progress |
| Community Governance | 🚧 In Progress |

## Live Demo

Visit [FundMesh](https://fundmesh.vercel.app/) to try the live application on Sepolia testnet.

## Technology Stack

- **Blockchain**: Ethereum (Sepolia Testnet)
- **Smart Contracts**: Solidity 0.8.24
- **Testing**: Mocha
- **Frontend**: Next.js, Semantic UI React
- **Web3 Integration**: web3.js
- **Storage**: IPFS

## Local Development

### Prerequisites

- Node.js (v16+)
- npm or yarn
- MetaMask wallet extension
- Infura API key (for deployment)

### Setup

1. Clone the repository
   ```
   git clone https://github.com/fabiobozzo/fundmesh.git
   cd fundmesh
   ```

2. Install dependencies
   ```
   npm install
   ```

3. Compile smart contracts
   ```
   npm run compile
   ```

5. Set up client
   ```
   cd client
   npm install
   ```

6. Create a `.env.local` file in the client directory
    ```
    NEXT_PUBLIC_INFURA_IPFS_AUTH=<Infura IPFS Basic auth (username:password base64 encoded)>
    NEXT_PUBLIC_FACTORY_ADDRESS=0x78caB003969157988B6591Fe97A1870a04DBc2f3
    NEXT_PUBLIC_USER_REGISTRY_ADDRESS=0xb89cfA9D2A6468D244e3AB16ab1C518869cc0A10
    NEXT_PUBLIC_IPFS_GW=https://ipfs.io/ipfs
    NEXT_PUBLIC_SUBGRAPH_URL=https://api.studio.thegraph.com/query/57162/fundmesh/version/latest
    ```

7. Run the client
   ```
   npm run dev
   ```

Visit `http://localhost:3000` to see the application.

## Smart Contract Architecture

- **Project Contract**: Core contract handling project creation, funding, and milestone progression
- **ProjectFactory**: Factory contract for deploying new Project instances
- **ProjectNFT**: ERC-721 implementation for reward NFTs

## Testing

The project includes comprehensive tests covering all smart contract functionality:

```
npm test
```

## Deployment

### Deploying to Sepolia Testnet

1. Configure environment variables (create a `.env` file)
   ```
   MNEMONIC=<your_wallet_mnemonic>
   INFURA_KEY=<your_infura_key>
   ```

2. Deploy contracts
   ```
   npm run deploy:sepolia
   ```

3. Update client config with deployed contract addresses

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create a new branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Commit your changes (`git commit -m 'Add some amazing feature'`)
5. Push to the branch (`git push origin feature/amazing-feature`)
6. Open a Pull Request

## License

This project is licensed under the GPL-3.0 License - see the LICENSE file for details.

## Acknowledgments

- OpenZeppelin for secure contract libraries
- Ethereum community for developer resources
- Solidity documentation contributors
