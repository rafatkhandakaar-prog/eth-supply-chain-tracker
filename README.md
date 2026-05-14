# Supply Chain Tracker

A clean blockchain dApp for supply chain transparency. The app uses Ethereum smart contract state directly, without any external database.

## Project structure
- `contracts/SupplyChain.sol`: Solidity smart contract for adding, transferring, and querying items.
- `src/App.tsx`: React frontend with wallet connect and contract interaction.
- `vite.config.ts`: Vite build config.

## Local development
1. Install dependencies:
   ```sh
   npm install
   ```
2. Start the dev server:
   ```sh
   npm run dev
   ```
3. Open the app in your browser.

## Deployment notes
1. Compile and deploy `contracts/SupplyChain.sol` via Remix to Ethereum Sepolia.
2. Copy the deployed contract address.
3. Enter the address in the frontend contract field or add it to `.env` as `VITE_CONTRACT_ADDRESS`.
4. Connect MetaMask to Sepolia and interact with the dApp.

## No database design
This solution stores all state on-chain using a smart contract, so there is no separate database layer.
