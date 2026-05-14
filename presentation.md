# ⛓️ Supply Chain Tracker — Full Project Presentation

> **A Decentralized Application (dApp) built on Ethereum Blockchain**
> Developed with React, TypeScript, Solidity & ethers.js

---

## 📌 Table of Contents

1. [What is this project?](#1-what-is-this-project)
2. [Real World Problem it Solves](#2-real-world-problem-it-solves)
3. [Technology Stack](#3-technology-stack)
4. [System Architecture](#4-system-architecture)
5. [Smart Contract — The Heart of the App](#5-smart-contract--the-heart-of-the-app)
6. [Frontend Code Explained](#6-frontend-code-explained)
7. [Features & How They Work](#7-features--how-they-work)
8. [Deployment Details](#8-deployment-details)
9. [How to Use the App](#9-how-to-use-the-app)
10. [Why Blockchain?](#10-why-blockchain)

---

## 1. What is this Project?

**Supply Chain Tracker** is a **blockchain-powered web application** that lets anyone:
- **Register** physical or digital items on the Ethereum blockchain
- **Transfer** ownership of those items to another person (wallet)
- **Browse** all registered items publicly
- **Query** the full ownership history of any item

> 💡 Think of it like a **permanent, unfakeable digital certificate** for anything — products, artwork, documents, goods.

### Key Facts
| Property | Value |
|----------|-------|
| **Type** | Decentralized Application (dApp) |
| **Blockchain** | Ethereum — Sepolia Testnet |
| **Live Contract** | `0x06F396e56dBE1a524a6aFc624E37DBA5eD52B216` |
| **Network** | Sepolia (Chain ID: 11155111) |
| **Frontend** | React + TypeScript (Vite) |
| **Smart Contract** | Solidity ^0.8.0 |

---

## 2. Real World Problem it Solves

### The Problem with Traditional Supply Chains

In a normal supply chain:
- Records are stored in **private company databases**
- Records can be **edited or deleted**
- There is **no easy way to verify** if a product is genuine
- Middlemen can **lie about product history**

### Example Scenario 🌿

> A coffee farmer in Ethiopia sells coffee to an exporter → distributor → supermarket → customer.
>
> **Who owned it at each step? Was it really organic? Where did it really come from?**
> In traditional systems — you just have to trust. You can't verify.

### Our Solution ✅

With Supply Chain Tracker:

| Step | What Happens on Blockchain |
|------|---------------------------|
| Farmer registers batch | Item added with ID, name, and farmer's wallet as owner |
| Sells to exporter | `transferItem()` called — blockchain records new owner permanently |
| Exporter sells to distributor | Another transfer — history grows |
| Customer scans QR | Queries item by ID — sees **every single owner, in order, forever** |

> **Nobody can alter this history. Not even us. Not even the government. It's on the blockchain forever.**

---

## 3. Technology Stack

```
┌─────────────────────────────────────────────────────┐
│                   USER'S BROWSER                    │
│                                                     │
│   React + TypeScript (Frontend UI)                  │
│   ethers.js v6 (Blockchain Communication)           │
│   MetaMask (Wallet / Identity)                      │
└────────────────────┬────────────────────────────────┘
                     │ HTTPS / JSON-RPC
                     ▼
┌─────────────────────────────────────────────────────┐
│              ETHEREUM SEPOLIA TESTNET               │
│                                                     │
│   SupplyChain.sol (Smart Contract)                  │
│   Contract Address:                                 │
│   0x06F396e56dBE1a524a6aFc624E37DBA5eD52B216        │
└─────────────────────────────────────────────────────┘
```

### Each Technology Explained

| Technology | What It Is | Why We Use It |
|-----------|-----------|--------------|
| **React** | JavaScript UI framework | Build the interactive web interface |
| **TypeScript** | JavaScript with types | Catch bugs before they happen |
| **Vite** | Build tool / dev server | Fast local development |
| **Solidity** | Ethereum programming language | Write the smart contract |
| **ethers.js v6** | JavaScript Ethereum library | Connect React app to blockchain |
| **MetaMask** | Browser wallet extension | User identity + sign transactions |
| **Sepolia** | Ethereum test network | Deploy and test without real money |
| **Remix IDE** | Online Solidity editor | Compile and deploy the contract |

---

## 4. System Architecture

```
┌──────────────┐     1. User clicks      ┌──────────────────┐
│              │     "Add Item"          │                  │
│   React App  │ ─────────────────────► │    MetaMask      │
│ (localhost:  │                        │    Wallet        │
│    5173)     │ ◄───────────────────── │                  │
│              │     2. User approves    └────────┬─────────┘
└──────────────┘        transaction              │
                                                 │ 3. Signed
                                                 │    Transaction
                                                 ▼
                                    ┌────────────────────────┐
                                    │   Ethereum Sepolia     │
                                    │   Blockchain Network   │
                                    │                        │
                                    │  SupplyChain Contract  │
                                    │  - stores item data    │
                                    │  - enforces ownership  │
                                    │  - records history     │
                                    └────────────────────────┘
```

### Data Flow
1. User opens the app → connects MetaMask wallet
2. User fills a form (e.g., item name) → clicks a button
3. ethers.js builds a transaction and sends to MetaMask
4. MetaMask shows a popup → user confirms → signs with private key
5. Signed transaction goes to Ethereum Sepolia network
6. Miners/validators process it → data stored permanently
7. App shows success toast with transaction hash link

---

## 5. Smart Contract — The Heart of the App

The smart contract is the **backend** of this app. It runs on the blockchain — nobody controls it.

### Full Contract Code

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract SupplyChain {

    // ── Data Structure ─────────────────────────────────────
    struct Item {
        uint id;           // unique number (1, 2, 3...)
        string name;       // product name
        address owner;     // current owner's wallet address
        address[] history; // list of ALL past owners
    }

    // ── Storage ────────────────────────────────────────────
    mapping(uint => Item) public items;  // id → Item
    uint public itemCount;               // total number of items

    // ── Events (logs on blockchain) ────────────────────────
    event ItemAdded(uint id, string name, address owner);
    event ItemTransferred(uint id, address from, address to);

    // ── Function 1: Add a new item ─────────────────────────
    function addItem(string memory _name) public {
        itemCount++;                              // increase counter
        items[itemCount] = Item(                  // create new Item
            itemCount,                            // id
            _name,                                // name
            msg.sender,                           // owner = person calling
            new address[](0)                      // empty history array
        );
        items[itemCount].history.push(msg.sender); // add creator to history
        emit ItemAdded(itemCount, _name, msg.sender);
    }

    // ── Function 2: Transfer ownership ─────────────────────
    function transferItem(uint _id, address _to) public {
        require(
            items[_id].owner == msg.sender,       // MUST be current owner
            "Not owner"                            // error if not
        );
        items[_id].owner = _to;                   // set new owner
        items[_id].history.push(_to);             // record in history
        emit ItemTransferred(_id, msg.sender, _to);
    }

    // ── Function 3: Get full history ────────────────────────
    function getHistory(uint _id) public view returns (address[] memory) {
        return items[_id].history;                // return array of all owners
    }
}
```

### Line-by-Line Explanation

| Code | Simple Meaning |
|------|---------------|
| `struct Item` | A blueprint for what info each item stores |
| `mapping(uint => Item) public items` | A dictionary: number → item data |
| `uint public itemCount` | Counter that goes up every time a new item is added |
| `msg.sender` | The wallet address of whoever is calling this function |
| `require(items[_id].owner == msg.sender)` | Security check — only the owner can transfer |
| `items[itemCount].history.push(msg.sender)` | Add wallet to the ownership trail |
| `emit ItemAdded(...)` | Fire an event that apps can listen to |
| `public view` | This function only reads data, costs no gas |
| `nonpayable` | This function doesn't accept ETH payments |

---

## 6. Frontend Code Explained

### Project File Structure
```
Project1/
├── src/
│   ├── App.tsx          ← Main application (all logic + UI)
│   ├── App.css          ← All styling
│   ├── index.css        ← Global styles
│   └── main.tsx         ← Entry point
├── contracts/
│   └── SupplyChain.sol  ← Smart contract
├── .env                 ← Contract address config
├── package.json         ← Dependencies
└── vite.config.ts       ← Build config
```

---

### Part 1 — Connecting to Ethereum

```typescript
// Import ethers.js library
import { BrowserProvider, Contract } from 'ethers'

// Create a provider — connects to MetaMask
const provider = useMemo(() => {
  if (typeof window !== 'undefined' && 'ethereum' in window) {
    return new BrowserProvider((window as any).ethereum)
    //         ↑ BrowserProvider reads from MetaMask
  }
  return null
}, [])
```

> **What this does:** Checks if MetaMask is installed in the browser. If yes, creates a `BrowserProvider` which is like a phone line to the Ethereum network through MetaMask.

---

### Part 2 — Connecting the Wallet

```typescript
const connectWallet = async () => {
  // 1. Ask MetaMask to show account selection popup
  const accounts = await provider.send('eth_requestAccounts', [])
  
  // 2. Save the wallet address to state
  setWallet(accounts[0])
  
  // 3. Check if user is on Sepolia
  const onSepolia = await checkNetwork()
  
  // 4. Auto-switch to Sepolia if wrong network
  if (!onSepolia) {
    await switchToSepolia()
  }
}
```

> **What this does:** When user clicks "Connect Wallet", MetaMask pops up. User picks an account. The app saves the address and checks they're on Sepolia testnet.

---

### Part 3 — The ABI (App-to-Contract Interface)

```typescript
// ABI = Application Binary Interface
// It tells ethers.js what functions exist in the contract
const abi = [
  {
    name: 'addItem',           // function name
    type: 'function',
    stateMutability: 'nonpayable',  // writes to blockchain (costs gas)
    inputs: [{ name: '_name', type: 'string' }],
    outputs: [],
  },
  {
    name: 'transferItem',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: '_id', type: 'uint256' },
      { name: '_to', type: 'address' },
    ],
    outputs: [],
  },
  {
    name: 'itemCount',
    type: 'function',
    stateMutability: 'view',   // reads only (free, no gas)
    inputs: [],
    outputs: [{ type: 'uint256' }],
  }
]
```

> **What this does:** The ABI is like a **menu** that tells the JavaScript app "hey, here are the functions available in the smart contract and what inputs they need."

---

### Part 4 — Sending a Transaction (Add Item)

```typescript
const addItem = async () => {
  // ── Validation ─────────────────────────────────────
  if (!contractAddress) { /* warn */ return }
  if (!wallet)          { /* warn */ return }
  if (!itemName.trim()) { /* warn */ return }

  try {
    setLoading(true)

    // ── Get signer (wallet that signs the transaction) ──
    const signer = await provider.getSigner()
    //                            ↑ ethers v6: this is async!

    // ── Create contract instance with signer ────────────
    const contract = new Contract(contractAddress, abi, signer)
    //                  ↑ address    ↑ ABI    ↑ signer

    // ── Call the smart contract function ────────────────
    const tx = await contract.addItem(itemName)
    //                        ↑ calls addItem() on blockchain
    //    tx = transaction object (pending)

    // ── Wait for blockchain confirmation ────────────────
    const receipt = await tx.wait()
    //    receipt = confirmed! has transaction hash

    // ── Show success ────────────────────────────────────
    addToast('success', 'Item added!', `"${itemName}" is on-chain`, receipt?.hash)

  } catch (err: any) {
    addToast('error', 'Transaction failed', err?.message)
  } finally {
    setLoading(false)
  }
}
```

> **What this does step by step:**
> 1. Validates all fields are filled
> 2. Gets the user's signer (their wallet identity)
> 3. Creates a connection to the smart contract
> 4. Calls `addItem()` on the blockchain → MetaMask popup appears
> 5. Waits for Ethereum to confirm the transaction
> 6. Shows a success message with a link to Etherscan

---

### Part 5 — Network Safety Check

```typescript
// Check if MetaMask is on Sepolia
const checkNetwork = async () => {
  const network = await provider.getNetwork()
  const onSepolia = network.chainId === BigInt(11155111)
  setWrongNetwork(!onSepolia)  // show red banner if wrong
  return onSepolia
}

// Auto-switch to Sepolia
const switchToSepolia = async () => {
  await window.ethereum.request({
    method: 'wallet_switchEthereumChain',
    params: [{ chainId: '0xaa36a7' }],  // Sepolia chain ID in hex
  })
}

// Listen for network changes in real time
useEffect(() => {
  window.ethereum.on('chainChanged', () => {
    checkNetwork()   // re-check if user switches network
    setWallet('')    // reset wallet state
  })
}, [])
```

> **What this does:** Automatically detects if you switch MetaMask to the wrong network and shows a red warning banner with a one-click fix button.

---

## 7. Features & How They Work

### ➕ Add Item
- User types a product name
- Clicks "Add Item to Chain"
- MetaMask asks to confirm (costs ~0.0001 Sepolia ETH in gas)
- Smart contract runs `addItem()` — creates an Item struct on blockchain
- Item gets a permanent ID (1, 2, 3...) and the creator becomes owner

### 🔁 Transfer Item
- User enters item ID and recipient wallet address
- Smart contract checks: `require(items[_id].owner == msg.sender)`
- If you're not the owner → transaction is rejected automatically
- If you are → ownership transfers, history records the new owner

### 📦 Browse All Items
- App calls `itemCount()` to know how many items exist
- Loops from 1 to count, calls `items(id)` for each
- Displays name, current owner, and how many ownership hops happened
- All read-only — **completely free, no gas needed**

### 🔍 Query Single Item
- User enters any item ID
- App calls `items(id)` and `getHistory(id)`
- Shows full item details + every wallet address that ever owned it
- Links each address to Etherscan for full transparency

---

## 8. Deployment Details

### Smart Contract Deployment

| Field | Value |
|-------|-------|
| **Contract Name** | SupplyChain |
| **Network** | Ethereum Sepolia Testnet |
| **Contract Address** | `0x06F396e56dBE1a524a6aFc624E37DBA5eD52B216` |
| **Deployed By** | `0xa41A871028d4617a2E7859EFF8806385349c7f7A` |
| **Verified On** | Blockscout ✅, Routescan ✅, Sourcify ✅ |
| **Deploy Tool** | Remix IDE |
| **Compiler** | Solidity ^0.8.0 |

### How Deployment Worked
```
1. Wrote SupplyChain.sol in Remix IDE
2. Compiled with Solidity 0.8.0 → 0 errors ✅
3. Switched Remix to "Injected Provider - MetaMask"
4. MetaMask set to Sepolia Testnet
5. Clicked "Deploy" in Remix
6. MetaMask asked to confirm → Confirmed ✅
7. Contract deployed at 0x06F396...
8. Verification auto-completed on Blockscout, Routescan, Sourcify
```

### Frontend Deployment (Local)
```bash
# Install dependencies
npm install

# Run development server
npm run dev

# App runs at:
http://localhost:5173/
```

### Environment Configuration
```env
# .env file
VITE_CONTRACT_ADDRESS=0x06F396e56dBE1a524a6aFc624E37DBA5eD52B216
```

---

## 9. How to Use the App

### Prerequisites
- ✅ Google Chrome or Firefox
- ✅ MetaMask extension installed
- ✅ MetaMask set to **Sepolia Testnet**
- ✅ Some Sepolia ETH (free from faucet)

### Getting Free Sepolia ETH
1. Go to → https://cloud.google.com/application/web3/faucet/ethereum/sepolia
2. Sign in with Google
3. Paste your wallet address
4. Receive **0.05 free Sepolia ETH** instantly

### Step-by-Step Usage

```
Step 1: Open http://localhost:5173/
Step 2: Click "Connect Wallet" → approve in MetaMask
Step 3: App auto-checks you're on Sepolia ✅
Step 4: Go to ➕ Add Item tab
Step 5: Type item name (e.g. "Laptop Batch #1")
Step 6: Click "Add Item to Chain"
Step 7: MetaMask pops up → click Confirm
Step 8: Wait 15-30 seconds → ✅ "Item added!" toast appears
Step 9: Go to 📦 Browse → see your item!
Step 10: Go to 🔍 Query → type ID 1 → see full history
```

---

## 10. Why Blockchain?

### Comparison: Traditional Database vs Blockchain

| Feature | Traditional Database | Blockchain (Our App) |
|---------|---------------------|---------------------|
| Who controls data | Company/Owner | Nobody — decentralized |
| Can data be edited | Yes, anytime | **Never** |
| Can data be deleted | Yes | **Never** |
| Who can verify | Only authorized people | **Anyone in the world** |
| Cost to run | Server bills monthly | Gas fees per transaction |
| Downtime possible | Yes (server crash) | No — always running |
| Trust required | Must trust the company | **Trust the math** |

### Key Blockchain Concepts Used

| Concept | Explanation |
|---------|-------------|
| **Wallet Address** | Your identity on blockchain — like an email address |
| **Private Key** | Your password — MetaMask stores it |
| **Transaction** | Any action that changes blockchain state (costs gas) |
| **Gas** | Small fee paid to miners for processing your transaction |
| **Smart Contract** | Self-executing code that lives on the blockchain |
| **ABI** | The "menu" that tells your app what the contract can do |
| **Block** | A batch of confirmed transactions |
| **Testnet** | A practice blockchain that uses fake ETH |

---

## 📊 Summary

```
┌─────────────────────────────────────────────────────────────────┐
│                    PROJECT SUMMARY                              │
├─────────────────────────────────────────────────────────────────┤
│  Name        : Supply Chain Tracker                             │
│  Type        : Decentralized Application (dApp)                 │
│  Blockchain  : Ethereum Sepolia Testnet                         │
│  Contract    : 0x06F396e56dBE1a524a6aFc624E37DBA5eD52B216      │
│  Frontend    : React + TypeScript + Vite                        │
│  Contract    : Solidity ^0.8.0                                  │
│  Library     : ethers.js v6                                     │
│  Wallet      : MetaMask                                         │
├─────────────────────────────────────────────────────────────────┤
│  FEATURES:                                                      │
│  ✅ Add items to blockchain                                     │
│  ✅ Transfer ownership between wallets                          │
│  ✅ Browse all registered items                                 │
│  ✅ Query full ownership history                                │
│  ✅ Auto network detection & switching                          │
│  ✅ Live Etherscan transaction links                            │
│  ✅ Toast notifications                                         │
│  ✅ Fully decentralized — no server needed                      │
└─────────────────────────────────────────────────────────────────┘
```

---

*Presentation prepared for Supply Chain Tracker dApp — Built on Ethereum Sepolia Testnet*
