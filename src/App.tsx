import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { BrowserProvider, Contract } from 'ethers'
import './App.css'

// ─── Config ───────────────────────────────────────────────────────────────────
const DEFAULT_CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS || ''
const ETHERSCAN_BASE = 'https://sepolia.etherscan.io'

// ─── ABI ──────────────────────────────────────────────────────────────────────
const abi = [
  {
    inputs: [{ internalType: 'string', name: '_name', type: 'string' }],
    name: 'addItem',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      { internalType: 'uint256', name: '_id', type: 'uint256' },
      { internalType: 'address', name: '_to', type: 'address' },
    ],
    name: 'transferItem',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'uint256', name: '_id', type: 'uint256' }],
    name: 'getHistory',
    outputs: [{ internalType: 'address[]', name: '', type: 'address[]' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    name: 'items',
    outputs: [
      { internalType: 'uint256', name: 'id', type: 'uint256' },
      { internalType: 'string', name: 'name', type: 'string' },
      { internalType: 'address', name: 'owner', type: 'address' },
      { internalType: 'address[]', name: 'history', type: 'address[]' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'itemCount',
    outputs: [{ internalType: 'uint256', name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
]

// ─── Types ────────────────────────────────────────────────────────────────────
type ItemDetail = { id: number; name: string; owner: string; history: string[] }
type Tab = 'add' | 'transfer' | 'browse' | 'query'
type ToastType = 'success' | 'error' | 'info' | 'warning'

interface Toast {
  id: number
  type: ToastType
  title: string
  message: string
  txHash?: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const shortAddr = (addr: string) =>
  addr ? `${addr.slice(0, 6)}…${addr.slice(-4)}` : ''

// ─── Toast Component ──────────────────────────────────────────────────────────
const TOAST_ICONS: Record<ToastType, string> = {
  success: '✅',
  error: '❌',
  info: 'ℹ️',
  warning: '⚠️',
}

function ToastContainer({
  toasts,
  onClose,
}: {
  toasts: Toast[]
  onClose: (id: number) => void
}) {
  return (
    <div className="toast-container" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className={`toast ${t.type}`} role="alert">
          <span className="toast-icon">{TOAST_ICONS[t.type]}</span>
          <div className="toast-body">
            <div className="toast-title">{t.title}</div>
            <div className="toast-msg">{t.message}</div>
            {t.txHash && (
              <a
                className="tx-link"
                href={`${ETHERSCAN_BASE}/tx/${t.txHash}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                🔗 View on Etherscan
              </a>
            )}
          </div>
          <button className="toast-close" onClick={() => onClose(t.id)} aria-label="Close">
            ✕
          </button>
        </div>
      ))}
    </div>
  )
}

// ─── Main App ─────────────────────────────────────────────────────────────────
function App() {
  const [wallet, setWallet] = useState('')
  const [wrongNetwork, setWrongNetwork] = useState(false)
  const [contractAddress, setContractAddress] = useState(DEFAULT_CONTRACT_ADDRESS)
  const [activeTab, setActiveTab] = useState<Tab>('add')

  // form fields
  const [itemName, setItemName] = useState('')
  const [transferId, setTransferId] = useState('')
  const [transferTo, setTransferTo] = useState('')
  const [queryId, setQueryId] = useState('')

  // data
  const [itemDetail, setItemDetail] = useState<ItemDetail | null>(null)
  const [browseItems, setBrowseItems] = useState<ItemDetail[]>([])
  const [totalItems, setTotalItems] = useState<number | null>(null)

  // loading
  const [loading, setLoading] = useState(false)
  const [browsing, setBrowsing] = useState(false)

  // toasts
  const [toasts, setToasts] = useState<Toast[]>([])
  const toastId = useRef(0)

  const addToast = useCallback((type: ToastType, title: string, message: string, txHash?: string) => {
    const id = ++toastId.current
    setToasts((prev) => [...prev, { id, type, title, message, txHash }])
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 6000)
  }, [])

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  // ─── Provider / Signer / Contract ─────────────────────────────
  const provider = useMemo(() => {
    if (typeof window !== 'undefined' && 'ethereum' in window) {
      return new BrowserProvider((window as any).ethereum)
    }
    return null
  }, [])

  // Helper: get a fresh signer + writable contract (ethers v6 getSigner is async)
  const getWritableContract = async () => {
    if (!provider) throw new Error('No provider')
    if (!contractAddress) throw new Error('No contract address')
    const s = await provider.getSigner()
    return new Contract(contractAddress, abi, s)
  }

  // Read-only contract (no signer required for view calls)
  const readContract = useMemo(() => {
    if (!contractAddress || !provider) return null
    try {
      return new Contract(contractAddress, abi, provider)
    } catch {
      return null
    }
  }, [contractAddress, provider])

  // ─── Connect Wallet ────────────────────────────────────────────
  const SEPOLIA_CHAIN_ID = '0xaa36a7' // 11155111

  const checkNetwork = async () => {
    if (!provider) return
    const network = await provider.getNetwork()
    const onSepolia = network.chainId === BigInt(11155111)
    setWrongNetwork(!onSepolia)
    return onSepolia
  }

  const switchToSepolia = async () => {
    try {
      await (window as any).ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: SEPOLIA_CHAIN_ID }],
      })
    } catch (err: any) {
      addToast('error', 'Network switch failed', err?.message || 'Please switch to Sepolia manually in MetaMask.')
    }
  }

  // Listen for MetaMask network/account changes
  useEffect(() => {
    const eth = (window as any).ethereum
    if (!eth) return
    const onChainChange = () => { checkNetwork(); setWallet(''); setBrowseItems([]); setTotalItems(null) }
    const onAccountChange = (accounts: string[]) => { setWallet(accounts[0] || '') }
    eth.on('chainChanged', onChainChange)
    eth.on('accountsChanged', onAccountChange)
    return () => {
      eth.removeListener('chainChanged', onChainChange)
      eth.removeListener('accountsChanged', onAccountChange)
    }
  }, [])

  const connectWallet = async () => {
    if (!provider) {
      addToast('error', 'MetaMask not found', 'Please install the MetaMask browser extension.')
      return
    }
    try {
      const accounts = await provider.send('eth_requestAccounts', [])
      setWallet(accounts[0])
      const onSepolia = await checkNetwork()
      if (!onSepolia) {
        addToast('warning', 'Wrong network', 'Switching you to Sepolia testnet…')
        await switchToSepolia()
      } else {
        addToast('success', 'Wallet connected', shortAddr(accounts[0]))
      }
    } catch {
      addToast('error', 'Connection rejected', 'You rejected the wallet connection.')
    }
  }

  // Fetch item count on contract change
  useEffect(() => {
    if (!readContract) { setTotalItems(null); return }
    readContract.itemCount().then((n: bigint) => setTotalItems(Number(n))).catch(() => setTotalItems(null))
  }, [readContract])

  // ─── Add Item ──────────────────────────────────────────────────
  const addItem = async () => {
    if (!contractAddress) { addToast('warning', 'Contract not set', 'Enter a valid deployed contract address.'); return }
    if (!wallet)          { addToast('warning', 'Wallet required', 'Connect your wallet first.'); return }
    if (!itemName.trim()) { addToast('warning', 'Name required', 'Enter an item name.'); return }
    try {
      setLoading(true)
      addToast('info', 'Sending transaction…', `Adding item "${itemName}"`)
      const c = await getWritableContract()
      const tx = await c.addItem(itemName)
      const receipt = await tx.wait()
      const newCount = totalItems !== null ? totalItems + 1 : null
      setTotalItems(newCount)
      addToast('success', 'Item added!', `"${itemName}" is now on-chain.`, receipt?.hash)
      setItemName('')
    } catch (err: any) {
      addToast('error', 'Transaction failed', err?.reason || err?.message || 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  // ─── Transfer Item ─────────────────────────────────────────────
  const transferItem = async () => {
    if (!contractAddress) { addToast('warning', 'Contract not set', 'Enter a valid deployed contract address.'); return }
    if (!wallet)          { addToast('warning', 'Wallet required', 'Connect your wallet first.'); return }
    if (!transferId || !transferTo.trim()) { addToast('warning', 'Fields required', 'Enter item ID and recipient address.'); return }
    try {
      setLoading(true)
      addToast('info', 'Sending transfer…', `Transferring item #${transferId}`)
      const c = await getWritableContract()
      const tx = await c.transferItem(Number(transferId), transferTo)
      const receipt = await tx.wait()
      addToast('success', 'Transfer complete!', `Item #${transferId} → ${shortAddr(transferTo)}`, receipt?.hash)
      setTransferId('')
      setTransferTo('')
    } catch (err: any) {
      addToast('error', 'Transfer failed', err?.reason || err?.message || 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  // ─── Query Item ────────────────────────────────────────────────
  const queryItem = async () => {
    if (!readContract) { addToast('warning', 'Contract not set', 'Enter a valid deployed contract address.'); return }
    if (!queryId) { addToast('warning', 'ID required', 'Enter an item ID to look up.'); return }
    try {
      setLoading(true)
      const raw = await readContract.items(Number(queryId))
      const history = await readContract.getHistory(Number(queryId))
      setItemDetail({ id: Number(raw.id), name: raw.name, owner: raw.owner, history: history as string[] })
    } catch (err: any) {
      addToast('error', 'Query failed', err?.reason || err?.message || 'Item not found')
      setItemDetail(null)
    } finally {
      setLoading(false)
    }
  }

  // ─── Browse Items ──────────────────────────────────────────────
  const browseAll = useCallback(async () => {
    if (!readContract) { addToast('warning', 'Contract not set', 'Enter a deployed contract address first.'); return }
    try {
      setBrowsing(true)
      setBrowseItems([])
      const count = Number(await readContract.itemCount())
      setTotalItems(count)
      if (count === 0) { setBrowsing(false); return }
      const fetched: ItemDetail[] = []
      for (let i = 1; i <= count; i++) {
        const raw = await readContract.items(i)
        const history = await readContract.getHistory(i)
        fetched.push({ id: i, name: raw.name, owner: raw.owner, history: history as string[] })
        setBrowseItems([...fetched])
      }
    } catch (err: any) {
      addToast('error', 'Browse failed', err?.message || 'Could not fetch items')
    } finally {
      setBrowsing(false)
    }
  }, [readContract, addToast])

  useEffect(() => {
    if (activeTab === 'browse') browseAll()
  }, [activeTab, browseAll])

  // ─── Render ────────────────────────────────────────────────────
  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <div className="header-brand">
          <div className="header-logo">⛓️</div>
          <div>
            <div className="header-title">Supply Chain Tracker</div>
            <div className="header-subtitle">Ethereum · Sepolia Testnet</div>
          </div>
        </div>
        <button
          id="btn-connect-wallet"
          className={`btn-wallet ${wallet ? 'connected' : ''}`}
          onClick={connectWallet}
        >
          <span className="wallet-dot" />
          {wallet ? shortAddr(wallet) : 'Connect Wallet'}
        </button>
      </header>

      {/* Wrong Network Banner */}
      {wrongNetwork && (
        <div style={{
          background: 'linear-gradient(90deg, #ff4444, #cc0000)',
          color: '#fff',
          textAlign: 'center',
          padding: '10px 20px',
          fontSize: '0.9rem',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 12,
        }}>
          ⚠️ Wrong network detected — please switch to Sepolia testnet
          <button
            onClick={switchToSepolia}
            style={{
              background: '#fff',
              color: '#cc0000',
              border: 'none',
              borderRadius: 6,
              padding: '4px 14px',
              fontWeight: 700,
              cursor: 'pointer',
              fontSize: '0.85rem',
            }}
          >
            Switch to Sepolia
          </button>
        </div>
      )}

      {/* Main */}
      <main className="main">
        {/* Hero */}
        <div className="hero">
          <div className="hero-badge">⛓ Blockchain Powered</div>
          <h1>Transparent Item Provenance</h1>
          <p>Track ownership history, add new items, and transfer assets — all on-chain with full transparency.</p>
        </div>

        {/* Stats */}
        <div className="stats-row">
          <div className="stat-card">
            <div className="stat-value">{totalItems !== null ? totalItems : '—'}</div>
            <div className="stat-label">Total Items</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{wallet ? '1' : '0'}</div>
            <div className="stat-label">Connected Wallets</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">Sepolia</div>
            <div className="stat-label">Network</div>
          </div>
        </div>

        {/* Contract Address */}
        <div className="contract-bar" id="contract-address-bar">
          <span className="contract-icon">📄</span>
          <input
            id="input-contract-address"
            value={contractAddress}
            onChange={(e) => setContractAddress(e.target.value)}
            placeholder="Paste deployed contract address (0x…)"
            spellCheck={false}
          />
          {contractAddress && (
            <a
              href={`${ETHERSCAN_BASE}/address/${contractAddress}`}
              target="_blank"
              rel="noopener noreferrer"
              title="View on Etherscan"
              style={{ fontSize: '1.1rem', textDecoration: 'none', color: 'var(--text-muted)' }}
            >
              🔗
            </a>
          )}
        </div>

        {/* Tabs */}
        <div className="tabs-bar" role="tablist">
          {([
            { id: 'add', label: '➕ Add Item' },
            { id: 'transfer', label: '🔁 Transfer' },
            { id: 'browse', label: '📦 Browse' },
            { id: 'query', label: '🔍 Query' },
          ] as { id: Tab; label: string }[]).map((tab) => (
            <button
              key={tab.id}
              id={`tab-${tab.id}`}
              role="tab"
              aria-selected={activeTab === tab.id}
              className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Panels */}
        {activeTab === 'add' && (
          <div className="card" role="tabpanel">
            <div className="card-title">➕ Add New Item</div>
            <div className="card-desc">Register a new item on the blockchain. You will become its first owner.</div>
            <div className="field">
              <label htmlFor="input-item-name">Item Name</label>
              <input
                id="input-item-name"
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                placeholder="e.g. Organic Coffee Batch #42"
                onKeyDown={(e) => e.key === 'Enter' && addItem()}
              />
            </div>
            <button
              id="btn-add-item"
              className="btn btn-primary"
              onClick={addItem}
              disabled={loading}
            >
              {loading ? <><span className="spinner" /> Processing…</> : '➕ Add Item to Chain'}
            </button>
          </div>
        )}

        {activeTab === 'transfer' && (
          <div className="card" role="tabpanel">
            <div className="card-title">🔁 Transfer Item</div>
            <div className="card-desc">Transfer ownership of an item you own to another Ethereum address.</div>
            <div className="field">
              <label htmlFor="input-transfer-id">Item ID</label>
              <input
                id="input-transfer-id"
                type="number"
                min="1"
                value={transferId}
                onChange={(e) => setTransferId(e.target.value)}
                placeholder="e.g. 1"
              />
            </div>
            <div className="field">
              <label htmlFor="input-transfer-to">Recipient Address</label>
              <input
                id="input-transfer-to"
                value={transferTo}
                onChange={(e) => setTransferTo(e.target.value)}
                placeholder="0x…"
                spellCheck={false}
              />
            </div>
            <button
              id="btn-transfer-item"
              className="btn btn-primary"
              onClick={transferItem}
              disabled={loading}
            >
              {loading ? <><span className="spinner" /> Processing…</> : '🔁 Transfer Item'}
            </button>
          </div>
        )}

        {activeTab === 'browse' && (
          <div className="card" role="tabpanel">
            <div className="browse-header">
              <div className="card-title">📦 All Items</div>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                {totalItems !== null && (
                  <span className="item-count-badge">{totalItems} items</span>
                )}
                <button
                  id="btn-refresh-items"
                  className="btn btn-primary"
                  style={{ width: 'auto', padding: '8px 18px', fontSize: '0.85rem' }}
                  onClick={browseAll}
                  disabled={browsing}
                >
                  {browsing ? <><span className="spinner" /> Loading…</> : '🔄 Refresh'}
                </button>
              </div>
            </div>
            <div className="card-desc">All items currently tracked on this contract.</div>

            {browsing && browseItems.length === 0 && (
              <div className="empty-state">
                <span className="spinner" style={{ width: 32, height: 32, borderWidth: 3, margin: '0 auto 16px', display: 'block' }} />
                Fetching items from the blockchain…
              </div>
            )}

            {!browsing && browseItems.length === 0 && totalItems === 0 && (
              <div className="empty-state">
                <div className="empty-icon">📭</div>
                <div>No items yet. Add your first item!</div>
              </div>
            )}

            {!browsing && browseItems.length === 0 && totalItems === null && (
              <div className="empty-state">
                <div className="empty-icon">⚠️</div>
                <div>Enter a contract address to browse items.</div>
              </div>
            )}

            {browseItems.length > 0 && (
              <div className="items-grid">
                {browseItems.map((item) => (
                  <div key={item.id} className="item-tile" id={`item-tile-${item.id}`}>
                    <div className="item-tile-id">Item #{item.id}</div>
                    <div className="item-tile-name">{item.name}</div>
                    <div className="item-tile-owner">👤 {shortAddr(item.owner)}</div>
                    <div className="item-tile-hops">🔗 {item.history.length} hop{item.history.length !== 1 ? 's' : ''} in history</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'query' && (
          <div className="card" role="tabpanel">
            <div className="card-title">🔍 Query Item</div>
            <div className="card-desc">Look up any item by its ID to see its full ownership history.</div>
            <div className="field">
              <label htmlFor="input-query-id">Item ID</label>
              <input
                id="input-query-id"
                type="number"
                min="1"
                value={queryId}
                onChange={(e) => { setQueryId(e.target.value); setItemDetail(null) }}
                placeholder="e.g. 1"
                onKeyDown={(e) => e.key === 'Enter' && queryItem()}
              />
            </div>
            <button
              id="btn-query-item"
              className="btn btn-primary"
              onClick={queryItem}
              disabled={loading}
            >
              {loading ? <><span className="spinner" /> Loading…</> : '🔍 Fetch Item'}
            </button>

            {itemDetail && (
              <div className="item-card">
                <div className="item-row">
                  <span className="item-row-label">ID</span>
                  <span className="item-row-val">#{itemDetail.id}</span>
                </div>
                <div className="item-row">
                  <span className="item-row-label">Name</span>
                  <span className="item-row-val">{itemDetail.name}</span>
                </div>
                <div className="item-row">
                  <span className="item-row-label">Owner</span>
                  <span className="item-row-val">
                    <a
                      href={`${ETHERSCAN_BASE}/address/${itemDetail.owner}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: 'var(--accent)', fontFamily: 'monospace' }}
                    >
                      {itemDetail.owner}
                    </a>
                  </span>
                </div>
                <div className="item-row" style={{ flexDirection: 'column', gap: 10 }}>
                  <span className="item-row-label">History ({itemDetail.history.length} hops)</span>
                  <ul className="history-list">
                    {itemDetail.history.map((addr, i) => (
                      <li key={`${addr}-${i}`} className="history-entry">
                        <span className="history-step">{i + 1}</span>
                        <a
                          href={`${ETHERSCAN_BASE}/address/${addr}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ color: 'var(--text-muted)', textDecoration: 'none' }}
                        >
                          {addr}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Toasts */}
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </div>
  )
}

export default App
