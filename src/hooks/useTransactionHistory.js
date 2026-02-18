import { useState, useEffect, useRef, useCallback } from 'react';
import { useAccount } from 'wagmi';
import { createPublicClient, http } from 'viem';
import { sepolia } from 'viem/chains';
import { SEPOLIA_CHAIN_ID, ARC_CHAIN_ID, BASE_SEPOLIA_CHAIN_ID } from './useBridge';
import { getItem, setItem } from '../utils/indexedDB';

// Chain configurations
const ARC_RPC_URLS = [
  'https://rpc.testnet.arc.network',
];

const SEPOLIA_RPC_URLS = [
  'https://ethereum-sepolia-rpc.publicnode.com',
];

const BASE_SEPOLIA_RPC_URLS = [
  'https://sepolia.base.org',
  'https://base-sepolia.blockpi.network/v1/rpc/public',
];

// USDC contract addresses for all chains
const USDC_CONTRACTS = {
  [SEPOLIA_CHAIN_ID]: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238',
  [ARC_CHAIN_ID]: '0x3600000000000000000000000000000000000000',
  [BASE_SEPOLIA_CHAIN_ID]: '0x036CbD53842c5426634e7929541eC2318f3dCF7e',
};

// ERC20 Transfer event signature
const TRANSFER_EVENT_SIGNATURE = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';

// Storage key for all transactions (shared across wallets)
const TRANSACTIONS_STORAGE_KEY = 'myTransactions';
const GLOBAL_TX_KEY = 'globalTransactions'; // Cache for global transactions

const backupToSessionStorage = (walletAddress, transactions) => {
  try {
    if (typeof sessionStorage !== 'undefined') {
      const key = `stac_tx_backup_${walletAddress.toLowerCase()}`;
      sessionStorage.setItem(key, JSON.stringify(transactions));
    }
  } catch {
    // Silently fail
  }
};

const recoverFromSessionStorage = (walletAddress) => {
  try {
    if (typeof sessionStorage !== 'undefined') {
      const key = `stac_tx_backup_${walletAddress.toLowerCase()}`;
      const data = sessionStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    }
  } catch {
    return null;
  }
  return null;
};

const safeRpcFetch = async (url, options) => {
  const response = await fetch(url, options);
  const clone = response.clone();
  try {
    const text = await clone.text();
    JSON.parse(text);
    return response;
  } catch (err) {
    if (err instanceof SyntaxError) {
      console.warn(`[SuperBridge] Truncated JSON detected. Switching providers...`);
      throw new Error(`Malformed JSON response from RPC: ${err.message}`);
    }
    return response;
  }
};

// Persistent clients to avoid re-creation
const clients = {};

const getClient = (chainId, rpcUrls, chain) => {
  if (!clients[chainId]) {
    // Try the first working URL from the list
    for (const rpcUrl of rpcUrls) {
      try {
        clients[chainId] = createPublicClient({
          chain: chain || {
            id: chainId,
            name: chainId === ARC_CHAIN_ID ? 'Arc Testnet' : 'Base Sepolia',
            network: chainId === ARC_CHAIN_ID ? 'arc-testnet' : 'base-sepolia',
            nativeCurrency: chainId === ARC_CHAIN_ID ? { decimals: 18, name: 'USDC', symbol: 'USDC' } : { decimals: 18, name: 'ETH', symbol: 'ETH' },
            rpcUrls: { default: { http: [rpcUrl] }, public: { http: [rpcUrl] } },
            testnet: true,
          },
          transport: http(rpcUrl, { retryCount: 3, timeout: 20000, fetch: safeRpcFetch }),
          batch: { multicall: true },
        });
        if (clients[chainId]) break;
      } catch {
        console.warn(`Failed to create client for ${chainId} with ${rpcUrl}`);
      }
    }
  }
  return clients[chainId];
};

const createArcClient = () => getClient(ARC_CHAIN_ID, ARC_RPC_URLS);
const createSepoliaClient = () => getClient(SEPOLIA_CHAIN_ID, SEPOLIA_RPC_URLS, sepolia);
const createBaseSepoliaClient = () => getClient(BASE_SEPOLIA_CHAIN_ID, BASE_SEPOLIA_RPC_URLS);

const determineTransactionType = (tx, logs, chainId) => {
  const usdcAddress = USDC_CONTRACTS[chainId];
  if (!usdcAddress) return 'Transaction';
  const hasUSDCTransfer = logs?.some(log => log.address?.toLowerCase() === usdcAddress.toLowerCase());
  return hasUSDCTransfer ? 'Transfer' : 'Transaction';
};

const formatTransaction = (tx, receipt, block, chainId, chainName, address) => {
  const timestamp = block?.timestamp ? Number(block.timestamp) * 1000 : Date.now();
  const type = determineTransactionType(tx, receipt?.logs, chainId);
  let amount = '0.00';
  let isOutgoing = true;
  const usdcAddress = USDC_CONTRACTS[chainId];
  if (receipt?.logs && usdcAddress) {
    const transferLogs = receipt.logs.filter(log =>
      log.address?.toLowerCase() === usdcAddress.toLowerCase() &&
      log.topics?.[0] === TRANSFER_EVENT_SIGNATURE
    );
    if (transferLogs.length > 0) {
      const log = transferLogs[0];
      const userLower = address.toLowerCase().replace('0x', '');
      const toTopic = log.topics?.[2]?.toLowerCase() || '';
      isOutgoing = !toTopic.includes(userLower);
      try {
        if (log.data && log.data !== '0x') {
          const hexAmount = log.data.startsWith('0x') ? log.data.slice(2) : log.data;
          amount = (Number(BigInt('0x' + hexAmount)) / 1000000).toFixed(2);
        }
      } catch { amount = 'N/A'; }
    }
  }
  return {
    id: tx.hash, type, from: chainName, to: chainName, amount, timestamp,
    status: receipt?.status === 'success' ? 'success' : 'failed',
    hash: tx.hash, chainId, chainName, address: address?.toLowerCase(), isOutgoing,
  };
};

const formatGlobalTransaction = (log, chainId, chainName) => {
  let amount = '0.00';
  try {
    if (log.args && log.args.value) {
      amount = (Number(log.args.value) / 1000000).toFixed(2);
    } else if (log.data && log.data !== '0x') {
      const hexAmount = log.data.startsWith('0x') ? log.data.slice(2) : log.data;
      amount = (Number(BigInt('0x' + hexAmount)) / 1000000).toFixed(2);
    }
  } catch { amount = '0.00'; }
  return {
    id: log.transactionHash, hash: log.transactionHash, type: 'Swap',
    amount, timestamp: Date.now(), status: 'success', chainId, chainName, isGlobal: true
  };
};

const deduplicateBridgeTransactions = (transactions) => {
  const bridgeTxs = transactions.filter(tx => tx.type === 'Bridge');
  const otherTxs = transactions.filter(tx => tx.type !== 'Bridge');
  const bridgeGroups = new Map();
  bridgeTxs.forEach(tx => {
    const timeWindow = Math.floor(tx.timestamp / (5 * 60 * 1000));
    const key = `${tx.amount}_${timeWindow}`;
    if (!bridgeGroups.has(key)) bridgeGroups.set(key, []);
    bridgeGroups.get(key).push(tx);
  });
  const uniqueBridgeTxs = [];
  bridgeGroups.forEach((group) => {
    if (group.length === 1) {
      uniqueBridgeTxs.push(group[0]);
    } else {
      const indexedDBTx = group.find(tx => tx.isOutgoing === undefined);
      uniqueBridgeTxs.push(indexedDBTx || group[0]);
    }
  });
  return [...uniqueBridgeTxs, ...otherTxs];
};

let globalIsFetchingHistory = false;
let globalIsFetchingStats = false;
let lastStatsFetchTime = 0;

export function useTransactionHistory() {
  const { address, isConnected } = useAccount();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const lastFetchRef = useRef(0);
  const fetchedHashesRef = useRef(new Set());
  const previousAddressRef = useRef(null);
  const transactionsRef = useRef([]);

  useEffect(() => {
    transactionsRef.current = transactions;
  }, [transactions]);

  const loadWalletTransactions = useCallback(async (walletAddress) => {
    if (!walletAddress) return [];
    try {
      const walletAddressLower = walletAddress.toLowerCase();
      let allTransactions = await getItem(TRANSACTIONS_STORAGE_KEY) || [];
      let walletTransactions = allTransactions.filter(tx => tx.address && tx.address.toLowerCase() === walletAddressLower);
      if (walletTransactions.length === 0) {
        const recovered = recoverFromSessionStorage(walletAddress);
        if (recovered && recovered.length > 0) {
          walletTransactions = recovered;
          await setItem(TRANSACTIONS_STORAGE_KEY, [...allTransactions, ...recovered]);
        }
      }
      if (walletTransactions.length > 0) {
        backupToSessionStorage(walletAddress, walletTransactions);
      }
      return walletTransactions;
    } catch { return []; }
  }, []);

  const fetchChainTransactions = useCallback(async (chainId, chainName, client, targetAddress = null) => {
    if (!client) return [];
    const searchAddress = targetAddress || address;
    if (!searchAddress) {
      try {
        const currentBlock = await client.getBlockNumber();
        const logs = await client.getLogs({
          address: USDC_CONTRACTS[chainId],
          event: {
            type: 'event', name: 'Transfer',
            inputs: [{ type: 'address', indexed: true, name: 'from' }, { type: 'address', indexed: true, name: 'to' }, { type: 'uint256', indexed: false, name: 'value' }],
          },
          fromBlock: currentBlock - 50n > 0n ? currentBlock - 50n : 0n,
          toBlock: currentBlock,
        });
        return logs.map(log => formatGlobalTransaction(log, chainId, chainName));
      } catch { return []; }
    }

    try {
      const currentBlock = await client.getBlockNumber();
      const fromBlock = currentBlock - 100n > 0n ? currentBlock - 100n : 0n;
      const usdcAddress = USDC_CONTRACTS[chainId];
      if (!usdcAddress) return [];
      const [logsFrom, logsTo] = await Promise.all([
        client.getLogs({ address: usdcAddress, event: { type: 'event', name: 'Transfer', inputs: [{ type: 'address', indexed: true, name: 'from' }, { type: 'address', indexed: true, name: 'to' }, { type: 'uint256', indexed: false, name: 'value' }] }, args: { from: address }, fromBlock, toBlock: currentBlock }),
        client.getLogs({ address: usdcAddress, event: { type: 'event', name: 'Transfer', inputs: [{ type: 'address', indexed: true, name: 'from' }, { type: 'address', indexed: true, name: 'to' }, { type: 'uint256', indexed: false, name: 'value' }] }, args: { to: address }, fromBlock, toBlock: currentBlock }),
      ]);
      const txHashes = [...new Set([...logsFrom, ...logsTo].map(log => log.transactionHash))];
      const existingHashes = new Set(transactionsRef.current.map(tx => tx.hash));
      const txPromises = txHashes.filter(hash => !fetchedHashesRef.current.has(hash) && !existingHashes.has(hash)).slice(0, 15).map(async (hash) => {
        try {
          const [tx, receipt] = await Promise.all([client.getTransaction({ hash }), client.getTransactionReceipt({ hash })]);
          let block = null;
          if (receipt?.blockNumber) {
            try { block = await Promise.race([client.getBlock({ blockNumber: receipt.blockNumber }), new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 5000))]); } catch { block = null; }
          }
          if (tx.from?.toLowerCase() === address.toLowerCase() || receipt?.logs?.some(l => l.topics?.[1]?.toLowerCase().includes(address.toLowerCase().slice(2)) || l.topics?.[2]?.toLowerCase().includes(address.toLowerCase().slice(2)))) {
            fetchedHashesRef.current.add(hash);
            return formatTransaction(tx, receipt, block, chainId, chainName, address);
          }
        } catch { return null; }
        return null;
      });
      const results = await Promise.all(txPromises);
      return results.filter(Boolean);
    } catch { return []; }
  }, [address]);

  const fetchTransactions = useCallback(async () => {
    if (!isConnected || !address || globalIsFetchingHistory) return;
    const now = Date.now();
    if (now - lastFetchRef.current < 20000) return;

    globalIsFetchingHistory = true;
    setLoading(true); lastFetchRef.current = now;
    try {
      const arcClient = createArcClient(); const sepoliaClient = createSepoliaClient(); const baseSepoliaClient = createBaseSepoliaClient();
      const [arcTxs, sepoliaTxs, baseSepoliaTxs] = await Promise.all([
        arcClient ? fetchChainTransactions(ARC_CHAIN_ID, 'Arc Testnet', arcClient) : [],
        sepoliaClient ? fetchChainTransactions(SEPOLIA_CHAIN_ID, 'Sepolia', sepoliaClient) : [],
        baseSepoliaClient ? fetchChainTransactions(BASE_SEPOLIA_CHAIN_ID, 'Base Sepolia', baseSepoliaClient) : [],
      ]);
      const combined = [...arcTxs, ...sepoliaTxs, ...baseSepoliaTxs];
      if (combined.length > 0) {
        const deduped = deduplicateBridgeTransactions(combined);
        setTransactions(prev => {
          const hashes = new Set(prev.map(t => t.hash));
          const newTxs = deduped.filter(t => !hashes.has(t.hash)).sort((a, b) => b.timestamp - a.timestamp);
          const merged = newTxs.length === 0 ? prev : [...newTxs, ...prev].slice(0, 100);
          if (newTxs.length > 0) {
            backupToSessionStorage(address, merged);
          }
          return merged;
        });
      }
    } catch { setError('Fetch failed'); } finally {
      setLoading(false);
      globalIsFetchingHistory = false;
    }
  }, [isConnected, address, fetchChainTransactions]);

  const fetchGlobalStats = useCallback(async () => {
    const now = Date.now();
    if (globalIsFetchingStats || (now - lastStatsFetchTime < 20000)) return;

    globalIsFetchingStats = true;
    lastStatsFetchTime = now;
    try {
      const arcClient = createArcClient(); const sepoliaClient = createSepoliaClient(); const baseSepoliaClient = createBaseSepoliaClient();
      const [arcTxs, sepoliaTxs, baseSepoliaTxs] = await Promise.all([
        arcClient ? fetchChainTransactions(ARC_CHAIN_ID, 'Arc Testnet', arcClient, null) : [],
        sepoliaClient ? fetchChainTransactions(SEPOLIA_CHAIN_ID, 'Sepolia', sepoliaClient, null) : [],
        baseSepoliaClient ? fetchChainTransactions(BASE_SEPOLIA_CHAIN_ID, 'Base Sepolia', baseSepoliaClient, null) : [],
      ]);
      const globalTxs = [...arcTxs, ...sepoliaTxs, ...baseSepoliaTxs];
      const existing = await getItem(GLOBAL_TX_KEY) || [];
      await setItem(GLOBAL_TX_KEY, [...globalTxs, ...existing].slice(0, 200));
      window.dispatchEvent(new CustomEvent('globalStatsUpdated'));
    } catch { /* ignore */ } finally {
      globalIsFetchingStats = false;
    }
  }, [fetchChainTransactions]);

  useEffect(() => {
    const init = async () => {
      if (previousAddressRef.current !== address) {
        fetchedHashesRef.current.clear(); lastFetchRef.current = 0;
      }
      if (!isConnected || !address) {
        setTransactions([]); previousAddressRef.current = null;
        fetchGlobalStats(); return;
      }
      if (previousAddressRef.current !== address) {
        previousAddressRef.current = address;
        setLoading(true);
        const saved = await loadWalletTransactions(address);
        setTransactions(deduplicateBridgeTransactions(saved).sort((a, b) => b.timestamp - a.timestamp));
        setLoading(false);
        fetchGlobalStats();
      }
    };
    init();
  }, [isConnected, address, loadWalletTransactions, fetchGlobalStats]);

  useEffect(() => {
    fetchGlobalStats();
    if (!isConnected || !address) return;
    const t = setTimeout(fetchTransactions, 1000);
    const i = setInterval(() => { fetchTransactions(); fetchGlobalStats(); }, 30000);
    return () => { clearTimeout(t); clearInterval(i); };
  }, [isConnected, address, fetchTransactions, fetchGlobalStats]);

  return { transactions, loading, error, refetch: fetchTransactions, fetchGlobalStats };
}
