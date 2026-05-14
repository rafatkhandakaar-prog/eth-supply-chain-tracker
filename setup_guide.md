# ✅ Complete Setup Guide — Supply Chain Tracker

Follow these steps in order. Everything is **free**.

---

## STEP 1 — Install MetaMask (2 min)

1. Go to **[metamask.io/download](https://metamask.io/download)**
2. Click **"Install MetaMask for Chrome"** (or your browser)
3. Click **"Create a new wallet"**
4. Set a password → write down your **Secret Recovery Phrase** somewhere safe
5. Finish setup — you now have a wallet

---

## STEP 2 — Switch to Sepolia Test Network (1 min)

1. Open MetaMask (fox icon in your browser)
2. At the top, click the network dropdown (it says **"Ethereum Mainnet"**)
3. Click **"Show test networks"** → select **"Sepolia"**

> You should now see **"Sepolia test network"** at the top of MetaMask.

---

## STEP 3 — Get Free Test ETH (2 min)

1. Copy your wallet address from MetaMask (click the address at the top, it copies automatically)
2. Go to **[sepoliafaucet.com](https://sepoliafaucet.com)**
3. Paste your wallet address → click **"Send Me ETH"**
4. Wait ~30 seconds → you'll see **0.5 ETH** appear in MetaMask

> If that faucet doesn't work, try **[faucet.quicknode.com/ethereum/sepolia](https://faucet.quicknode.com/ethereum/sepolia)**

---

## STEP 4 — Deploy the Smart Contract on Remix (5 min)

1. Go to **[remix.ethereum.org](https://remix.ethereum.org)**
2. In the left panel, click the **📄 File Explorer** icon
3. Click **"contracts"** folder → right-click → **"New File"** → name it `SupplyChain.sol`
4. Paste the contract code below into that file:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract SupplyChain {
    struct Item {
        uint id;
        string name;
        address owner;
        address[] history;
    }

    mapping(uint => Item) public items;
    uint public itemCount;

    event ItemAdded(uint id, string name, address owner);
    event ItemTransferred(uint id, address from, address to);

    function addItem(string memory _name) public {
        itemCount++;
        items[itemCount] = Item(itemCount, _name, msg.sender, new address[](0));
        items[itemCount].history.push(msg.sender);
        emit ItemAdded(itemCount, _name, msg.sender);
    }

    function transferItem(uint _id, address _to) public {
        require(items[_id].owner == msg.sender, "Not owner");
        items[_id].owner = _to;
        items[_id].history.push(_to);
        emit ItemTransferred(_id, msg.sender, _to);
    }

    function getHistory(uint _id) public view returns (address[] memory) {
        return items[_id].history;
    }
}
```

5. Click the **⚙️ Solidity Compiler** icon (left panel) → click **"Compile SupplyChain.sol"**
6. Click the **🚀 Deploy & Run** icon (left panel)
7. Change **"Environment"** dropdown to **"Injected Provider - MetaMask"**
8. MetaMask will pop up → click **"Connect"** → select your account → **"Next"** → **"Connect"**
9. Make sure **"Contract"** dropdown shows `SupplyChain`
10. Click the orange **"Deploy"** button
11. MetaMask pops up → click **"Confirm"** (costs ~0.001 free Sepolia ETH)
12. Wait 10–20 seconds → in Remix bottom panel you'll see **"Deployed Contracts"**
13. Click to expand it → **copy the contract address** (starts with `0x…`)

---

## STEP 5 — Connect to Your App (1 min)

1. Make sure your app is running → open **[http://localhost:5173](http://localhost:5173)**
2. Paste the contract address into the **"Contract Address"** field at the top of the app
3. Click **"Connect Wallet"** → approve in MetaMask
4. You're done! 🎉

---

## STEP 6 — Test It

| Action | How |
|--------|-----|
| Add an item | Go to **➕ Add Item** tab → type a name → click Add |
| Browse all items | Go to **📦 Browse** tab → items appear as cards |
| Transfer an item | Go to **🔁 Transfer** tab → enter item ID + recipient address |
| View history | Go to **🔍 Query** tab → enter item ID → see full ownership history |

> Each action will trigger a MetaMask popup — just click **"Confirm"** and wait ~15 seconds for the transaction.

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| MetaMask not detected | Refresh the page after installing MetaMask |
| Transaction fails | Make sure you're on **Sepolia** in MetaMask |
| No ETH for gas | Go back to Step 3 and get free ETH from the faucet |
| Items not loading | Double-check the contract address is correct |
