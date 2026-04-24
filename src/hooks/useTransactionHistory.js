import { useState, useEffect, useRef, useCallback } from 'react';
import { useAccount } from 'wagmi';
import { createPublicClient, http, decodeEventLog } from 'viem';
import { sepolia } from 'viem/chains';
import { SEPOLIA_CHAIN_ID, ARC_CHAIN_ID, BASE_SEPOLIA_CHAIN_ID } from './useBridge';
import { getItem, setItem } from '../utils/indexedDB';
import { DEX_ADDRESS, TOKENS } from '../config/constants';

// Chain configurations — use env vars with public fallbacks
const ARC_RPC_URLS = [
  import.meta.env.VITE_ARC_RPC_URL || 'https://rpc.testnet.arc.network',
].filter(Boolean);

const SEPOLIA_RPC_URLS = [
  import.meta.env.VITE_SEPOLIA_RPC_URL || 'https://ethereum-sepolia-rpc.publicnode.com',
].filter(Boolean);

const BASE_SEPOLIA_RPC_URLS = [
  import.meta.env.VITE_BASE_SEPOLIA_RPC_URL,
  'https://base-sepolia.blockpi.network/v1/rpc/public',
  'https://base-sepolia-rpc.publicnode.com',
].filter(Boolean);


// USDC contract addresses for all chains
const USDC_CONTRACTS = {
  [SEPOLIA_CHAIN_ID]: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238',
  [ARC_CHAIN_ID]: '0x3600000000000000000000000000000000000000',
  [BASE_SEPOLIA_CHAIN_ID]: '0x036CbD53842c5426634e7929541eC2318f3dCF7e',
};

// Transfer event signature
const TRANSFER_EVENT_SIGNATURE = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';

// Circle TokenMessenger addresses for bridge detection
const TOKEN_MESSENGER = {
  [SEPOLIA_CHAIN_ID]: '0x9f3B8679c0583664491542A4876b6C1484C272C3',
  [ARC_CHAIN_ID]: '0x3200000000000000000000000000000000000000', // Arc testnet bridge
  [BASE_SEPOLIA_CHAIN_ID]: '0x9f3B8679c0583664491542A4876b6C1484C272C3',
};

// Storage keys
const TRANSACTIONS_STORAGE_KEY = 'myTransactions';
const GLOBAL_TX_KEY = 'globalTransactions';

const backupToSessionStorage = (walletAddress, transactions) => {
  try {
    if (typeof sessionStorage !== 'undefined' && walletAddress) {
      const key = `stac_tx_backup_${walletAddress.toLowerCase()}`;
      sessionStorage.setItem(key, JSON.stringify(transactions));
    }
  } catch { /* ignore */ }
};

const recoverFromSessionStorage = (walletAddress) => {
  try {
    if (typeof sessionStorage !== 'undefined' && walletAddress) {
      const key = `stac_tx_backup_${walletAddress.toLowerCase()}`;
      const data = sessionStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    }
  } catch { return null; }
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
      console.warn(`[useTransactionHistory] Truncated JSON detected from RPC.`);
      throw new Error(`Malformed JSON response from RPC`);
    }
    return response;
  }
};

// Persistent clients
const clients = {};
const getClient = (chainId, rpcUrls, chain) => {
  if (!clients[chainId]) {
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
      } catch { /* ignore */ }
    }
  }
  return clients[chainId];
};

const createArcClient = () => getClient(ARC_CHAIN_ID, ARC_RPC_URLS);
const createSepoliaClient = () => getClient(SEPOLIA_CHAIN_ID, SEPOLIA_RPC_URLS, sepolia);
const createBaseSepoliaClient = () => getClient(BASE_SEPOLIA_CHAIN_ID, BASE_SEPOLIA_RPC_URLS);

// Token mapping
const OTHER_TOKENS = {};
Object.entries(TOKENS).forEach(([symbol, address]) => {
  OTHER_TOKENS[address.toLowerCase()] = symbol;
});
OTHER_TOKENS[USDC_CONTRACTS[ARC_CHAIN_ID].toLowerCase()] = 'USDC';

// Swap event signature hash from StacDEX
const SWAP_EVENT_SIGNATURE = '0xdc381c81559902678f24b219ed05f63bc0dc2e81b671fccf207ed2e4f014f329';

const determineTransactionType = (tx, logs, chainId) => {
  const isSwapEvent = logs?.some(log => log.topics?.[0]?.toLowerCase() === SWAP_EVENT_SIGNATURE);
  if (isSwapEvent) return 'Swap';

  const bridgeMessenger = TOKEN_MESSENGER[chainId]?.toLowerCase();
  const isBridge = logs?.some(log =>
    log.address?.toLowerCase() === bridgeMessenger ||
    log.topics?.[1]?.toLowerCase().includes(bridgeMessenger?.slice(2)) ||
    log.topics?.[2]?.toLowerCase().includes(bridgeMessenger?.slice(2))
  );
  if (isBridge) return 'Bridge';

  const usdcAddress = USDC_CONTRACTS[chainId];
  if (!usdcAddress) return 'Transaction';
  const hasUSDCTransfer = logs?.some(log => log.address?.toLowerCase() === usdcAddress.toLowerCase());
  const hasOtherToken = logs?.some(log => log.address && OTHER_TOKENS[log.address.toLowerCase()]);
  if (hasUSDCTransfer && hasOtherToken) return 'Swap';
  return hasUSDCTransfer ? 'Transfer' : 'Transaction';
};

const formatTransaction = (tx, receipt, block, chainId, chainName, address) => {
  const timestamp = block?.timestamp ? Number(block.timestamp) * 1000 : Date.now();
  const type = determineTransactionType(tx, receipt?.logs, chainId);
  const userAddr = address?.toLowerCase();

  let amount = '0.00';
  let isOutgoing = true;
  let fromLabel = chainName;
  let toLabel = chainName;

  if (receipt?.logs) {
    // 1. Check for DEX Swap Event
    const swapLog = receipt.logs.find(log => log.topics?.[0]?.toLowerCase() === SWAP_EVENT_SIGNATURE);
    if (swapLog) {
      try {
        const transfers = receipt.logs.filter(l => l.topics?.[0] === TRANSFER_EVENT_SIGNATURE);
        const userLower = userAddr?.replace('0x', '');

        const sentLog = transfers.find(l => userLower && l.topics?.[1]?.toLowerCase().includes(userLower));
        const receivedLog = transfers.find(l => userLower && l.topics?.[2]?.toLowerCase().includes(userLower));

        if (sentLog && receivedLog) {
          const fromToken = OTHER_TOKENS[sentLog.address.toLowerCase()] || 'Unknown';
          const toToken = OTHER_TOKENS[receivedLog.address.toLowerCase()] || 'Unknown';

          fromLabel = fromToken;
          toLabel = toToken;
          isOutgoing = true;

          const hexAmount = sentLog.data.startsWith('0x') ? sentLog.data.slice(2) : sentLog.data;
          const decimals = fromToken === 'USDC' ? 1000000 : 1e18;
          amount = (Number(BigInt('0x' + hexAmount)) / decimals).toFixed(2);

          return { id: tx.hash, type: 'Swap', from: fromLabel, to: toLabel, amount, timestamp, status: 'success', hash: tx.hash, chainId, chainName, address: userAddr, isOutgoing, isStacTx };
        }
      } catch (e) {
        console.warn("Failed to parse Swap logs", e);
      }
    }

    // 2. Fallback to USDC Transfer detection
    const usdcAddress = USDC_CONTRACTS[chainId];
    const usdcLogs = receipt.logs.filter(log =>
      log.address?.toLowerCase() === usdcAddress.toLowerCase() &&
      log.topics?.[0] === TRANSFER_EVENT_SIGNATURE
    );

    const otherLogs = receipt.logs.filter(log =>
      log.address?.toLowerCase() !== usdcAddress.toLowerCase() &&
      log.topics?.[0] === TRANSFER_EVENT_SIGNATURE &&
      log.address && OTHER_TOKENS[log.address.toLowerCase()]
    );

    if (usdcLogs.length > 0) {
      const log = usdcLogs[0];
      const userLower = userAddr?.replace('0x', '');
      const toTopic = log.topics?.[2]?.toLowerCase() || '';

      if (type === 'Swap' && otherLogs.length > 0) {
        const otherTokenAddress = otherLogs[0].address.toLowerCase();
        const otherToken = OTHER_TOKENS[otherTokenAddress];
        const isReceivingUSDC = userLower && toTopic.includes(userLower);

        if (isReceivingUSDC) {
          fromLabel = otherToken;
          toLabel = 'USDC';
          isOutgoing = true;
        } else {
          fromLabel = 'USDC';
          toLabel = otherToken;
          isOutgoing = false;
        }
      } else {
        isOutgoing = userLower ? !toTopic.includes(userLower) : true;
      }

      try {
        if (log.data && log.data !== '0x') {
          const hexAmount = log.data.startsWith('0x') ? log.data.slice(2) : log.data;
          const decimals = usdcAddress.toLowerCase() === log.address.toLowerCase() ? 1000000 : 1e18;
          amount = (Number(BigInt('0x' + hexAmount)) / decimals).toFixed(2);
        }
      } catch { amount = 'N/A'; }
    }
  }

  return {
    id: tx.hash,
    type,
    from: fromLabel,
    to: toLabel,
    amount,
    timestamp,
    status: receipt?.status === 'success' ? 'success' : 'failed',
    hash: tx.hash,
    chainId,
    chainName,
    address: userAddr,
    isOutgoing,
    isStacTx, // Identified earlier
  };
};

const deduplicateBridgeTransactions = (transactions) => {
  if (!Array.isArray(transactions)) return [];
  const bridgeTxs = transactions.filter(tx => tx?.type === 'Bridge');
  const otherTxs = transactions.filter(tx => tx?.type !== 'Bridge');
  const bridgeGroups = new Map();
  bridgeTxs.forEach(tx => {
    const timeWindow = Math.floor(tx.timestamp / (5 * 60 * 1000));
    const key = `${tx.amount}_${timeWindow}`;
    if (!bridgeGroups.has(key)) bridgeGroups.set(key, []);
    bridgeGroups.get(key).push(tx);
  });
  const uniqueBridgeTxs = [];
  bridgeGroups.forEach((group) => {
    if (group.length === 1) uniqueBridgeTxs.push(group[0]);
    else {
      const indexedDBTx = group.find(tx => tx.isOutgoing === undefined);
      uniqueBridgeTxs.push(indexedDBTx || group[0]);
    }
  });
  return [...uniqueBridgeTxs, ...otherTxs].filter(Boolean);
};

let globalIsFetchingHistory = false;
let globalIsFetchingStats = false;
let lastStatsFetchTime = 0;

export function useTransactionHistory() {
  const { address, isConnected } = useAccount();
  const [transactions, setTransactions] = useState([]);
  const [globalTransactions, setGlobalTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const lastFetchRef = useRef(0);
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

      let walletTransactions = allTransactions.filter(tx =>
        tx?.address && tx.address.toLowerCase() === walletAddressLower
      );

      if (walletTransactions.length === 0) {
        const recovered = recoverFromSessionStorage(walletAddress);
        if (recovered && recovered.length > 0) {
          walletTransactions = recovered;
          const merged = [...allTransactions, ...recovered];
          await setItem(TRANSACTIONS_STORAGE_KEY, merged.slice(0, 500));
        }
      }

      if (walletTransactions.length > 0) {
        backupToSessionStorage(walletAddress, walletTransactions);
      }
      return walletTransactions;
    } catch (err) {
      console.error("[useTransactionHistory] Load error:", err);
      return [];
    }
  }, []);

  const fetchChainTransactions = useCallback(async (chainId, chainName, client, targetAddress = null) => {
    if (!client) return [];

    // Recovery range if we have no local history
    const isInitialLoad = transactionsRef.current.length === 0;
    // VERY IMPORTANT: Keep range small for Arc to avoid 413. 
    // Arc is fast but RPC is sensitive.
    const range = (chainId === ARC_CHAIN_ID) ? (isInitialLoad ? 5000n : 500n) : (isInitialLoad ? 20000n : 1000n);

    try {
      const nowBlock = await client.getBlockNumber();
      const fromBlock = nowBlock - range > 0n ? nowBlock - range : 0n;
      const usdcAddress = USDC_CONTRACTS[chainId];
      if (!usdcAddress) return [];

      const searchAddress = targetAddress || address;
      if (!searchAddress) return [];

      const filterConfig = {
        address: usdcAddress,
        event: {
          type: 'event', name: 'Transfer',
          inputs: [
            { type: 'address', indexed: true, name: 'from' },
            { type: 'address', indexed: true, name: 'to' },
            { type: 'uint256', indexed: false, name: 'value' }
          ],
        },
        fromBlock,
        toBlock: nowBlock,
      };

      // Fetch logs with targeted filter to avoid payload too large
      const [fromLogs, toLogs] = await Promise.all([
        client.getLogs({ ...filterConfig, args: { from: searchAddress } }),
        client.getLogs({ ...filterConfig, args: { to: searchAddress } }),
      ]).catch(() => [[], []]);

      let logs = [...fromLogs, ...toLogs];

      // For personal history, also check DEX logs for swaps
      if (!targetAddress) {
        const [dexFromLogs, dexToLogs] = await Promise.all([
          client.getLogs({ ...filterConfig, args: { from: DEX_ADDRESS } }),
          client.getLogs({ ...filterConfig, args: { to: DEX_ADDRESS } }),
        ]).catch(() => [[], []]);
        // Only include DEX logs that might be relevant to the current user (if any)
        // or just merge them all if we want a global view
        logs = [...logs, ...dexFromLogs, ...dexToLogs];
      }

      if (logs.length === 0) return [];

      const uniqueTxHashes = new Set();
      const sortedLogs = logs.sort((a, b) => Number(b.blockNumber) - Number(a.blockNumber));

      const txHashesToProcess = [];
      for (const log of sortedLogs) {
        if (!uniqueTxHashes.has(log.transactionHash)) {
          uniqueTxHashes.add(log.transactionHash);
          txHashesToProcess.push(log.transactionHash);
        }
        if (txHashesToProcess.length >= 10) break; // Reduced to 10 for better speed/reliability
      }

      const results = await Promise.all(txHashesToProcess.map(async (hash) => {
        try {
          const [tx, receipt] = await Promise.all([
            client.getTransaction({ hash }),
            client.getTransactionReceipt({ hash })
          ]);
          let block = null;
          if (receipt?.blockNumber) {
            block = await client.getBlock({ blockNumber: receipt.blockNumber }).catch(() => null);
          }
          return formatTransaction(tx, receipt, block, chainId, chainName, address || tx.from);
        } catch { return null; }
      }));

      return results.filter(Boolean);
    } catch (err) {
      if (!err.message?.includes('429')) console.error(`[useTransactionHistory] Chain error on ${chainName}:`, err);
      return [];
    }
  }, [address]);

  const fetchTransactions = useCallback(async () => {
    if (!isConnected || !address || globalIsFetchingHistory) return;
    const now = Date.now();
    const hasNoTransactions = transactionsRef.current.length === 0;
    if (!hasNoTransactions && (now - lastFetchRef.current < 20000)) return;

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
        setTransactions(prev => {
          const hashes = new Set(prev.map(t => t.hash));
          const newTxs = combined.filter(t => !hashes.has(t.hash));
          if (newTxs.length === 0) return prev;
          const merged = [...newTxs, ...prev].sort((a, b) => b.timestamp - a.timestamp).slice(0, 200);

          getItem(TRANSACTIONS_STORAGE_KEY).then(async (all) => {
            const history = all || [];
            const historyHashes = new Set(history.map(tx => tx.hash));
            const uniqueNew = newTxs.filter(tx => !historyHashes.has(tx.hash));
            if (uniqueNew.length > 0) {
              await setItem(TRANSACTIONS_STORAGE_KEY, [...uniqueNew, ...history].slice(0, 500));
              backupToSessionStorage(address, merged);
            }
          });
          return merged;
        });
      }
    } catch (err) {
      console.error("[useTransactionHistory] Fetch failed:", err);
      setError('Fetch failed');
    } finally {
      setLoading(false);
      globalIsFetchingHistory = false;
    }
  }, [isConnected, address, fetchChainTransactions]);

  const fetchGlobalStats = useCallback(async () => {
    const now = Date.now();
    if (globalIsFetchingStats || (now - lastStatsFetchTime < 30000)) return;

    globalIsFetchingStats = true;
    lastStatsFetchTime = now;
    try {
      const arcClient = createArcClient(); const sepoliaClient = createSepoliaClient(); const baseSepoliaClient = createBaseSepoliaClient();
      const [arcTxs, sepoliaTxs, baseSepoliaTxs] = await Promise.all([
        arcClient ? fetchChainTransactions(ARC_CHAIN_ID, 'Arc Testnet', arcClient, DEX_ADDRESS) : [],
        sepoliaClient ? fetchChainTransactions(SEPOLIA_CHAIN_ID, 'Sepolia', sepoliaClient, DEX_ADDRESS) : [],
        baseSepoliaClient ? fetchChainTransactions(BASE_SEPOLIA_CHAIN_ID, 'Base Sepolia', baseSepoliaClient, DEX_ADDRESS) : [],
      ]);
      const globalTxs = [...arcTxs, ...sepoliaTxs, ...baseSepoliaTxs];
      const existing = await getItem(GLOBAL_TX_KEY) || [];
      const seenHashes = new Set(existing.map(tx => tx.hash || tx.id));
      const uniqueNewTxs = globalTxs.filter(tx => (tx.hash || tx.id) && !seenHashes.has(tx.hash || tx.id));
      const newGlobalTxs = [...uniqueNewTxs, ...existing].slice(0, 200);
      await setItem(GLOBAL_TX_KEY, newGlobalTxs);
      setGlobalTransactions(newGlobalTxs);
    } catch { /* ignore */ } finally {
      globalIsFetchingStats = false;
    }
  }, [fetchChainTransactions]);

  useEffect(() => {
    const init = async () => {
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
    const i = setInterval(() => { fetchTransactions(); fetchGlobalStats(); }, 45000);
    return () => { clearTimeout(t); clearInterval(i); };
  }, [isConnected, address, fetchTransactions, fetchGlobalStats]);

  return { transactions, globalTransactions, loading, error, refetch: fetchTransactions, fetchGlobalStats };
}
