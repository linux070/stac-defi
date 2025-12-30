import { useState, useEffect, useRef, useCallback } from 'react';
import { useAccount } from 'wagmi';
import { createPublicClient, http, formatUnits } from 'viem';
import { sepolia } from 'viem/chains';
import { SEPOLIA_CHAIN_ID, ARC_CHAIN_ID, BASE_SEPOLIA_CHAIN_ID } from './useBridge';
import { getItem, setItem } from '../utils/indexedDB';

// Chain configurations
const ARC_RPC_URLS = [
  'https://rpc.testnet.arc.network',
];

const SEPOLIA_RPC_URLS = [
  'https://ethereum-sepolia-rpc.publicnode.com',
  'https://rpc.sepolia.org',
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

// Chain name mapping for display
const CHAIN_NAMES = {
  [SEPOLIA_CHAIN_ID]: 'Sepolia',
  [ARC_CHAIN_ID]: 'Arc Testnet',
  [BASE_SEPOLIA_CHAIN_ID]: 'Base Sepolia',
};

// ERC20 Transfer event signature
const TRANSFER_EVENT_SIGNATURE = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';

// Storage key for all transactions (shared across wallets)
const TRANSACTIONS_STORAGE_KEY = 'myTransactions';

// Backup to sessionStorage for recovery after site clear
const backupToSessionStorage = (walletAddress, transactions) => {
  try {
    if (typeof sessionStorage !== 'undefined') {
      const key = `stac_tx_backup_${walletAddress.toLowerCase()}`;
      sessionStorage.setItem(key, JSON.stringify(transactions));
    }
  } catch (err) {
    // Silently fail - sessionStorage might be unavailable
  }
};

// Recover from sessionStorage if IndexedDB was cleared
const recoverFromSessionStorage = (walletAddress) => {
  try {
    if (typeof sessionStorage !== 'undefined') {
      const key = `stac_tx_backup_${walletAddress.toLowerCase()}`;
      const data = sessionStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    }
  } catch (err) {
    return null;
  }
  return null;
};

// Create public clients for all chains
const createArcClient = () => {
  for (const rpcUrl of ARC_RPC_URLS) {
    try {
      return createPublicClient({
        chain: {
          id: ARC_CHAIN_ID,
          name: 'Arc Testnet',
          network: 'arc-testnet',
          nativeCurrency: {
            decimals: 18,
            name: 'USDC',
            symbol: 'USDC',
          },
          rpcUrls: {
            default: { http: [rpcUrl] },
            public: { http: [rpcUrl] },
          },
          blockExplorers: {
            default: { name: 'Arc Explorer', url: 'https://testnet.arcscan.app' },
          },
          testnet: true,
        },
        transport: http(rpcUrl, {
          retryCount: 2,
          timeout: 8000,
        }),
      });
    } catch (err) {
      continue;
    }
  }
  return null;
};

const createSepoliaClient = () => {
  for (const rpcUrl of SEPOLIA_RPC_URLS) {
    try {
      return createPublicClient({
        chain: sepolia,
        transport: http(rpcUrl, {
          retryCount: 2,
          timeout: 8000,
        }),
      });
    } catch (err) {
      continue;
    }
  }
  return null;
};

const createBaseSepoliaClient = () => {
  for (const rpcUrl of BASE_SEPOLIA_RPC_URLS) {
    try {
      return createPublicClient({
        chain: {
          id: BASE_SEPOLIA_CHAIN_ID,
          name: 'Base Sepolia',
          network: 'base-sepolia',
          nativeCurrency: {
            decimals: 18,
            name: 'ETH',
            symbol: 'ETH',
          },
          rpcUrls: {
            default: { http: [rpcUrl] },
            public: { http: [rpcUrl] },
          },
          blockExplorers: {
            default: { name: 'BaseScan', url: 'https://sepolia.basescan.org' },
          },
          testnet: true,
        },
        transport: http(rpcUrl, {
          retryCount: 2,
          timeout: 8000,
        }),
      });
    } catch (err) {
      continue;
    }
  }
  return null;
};

// Determine transaction type based on contract addresses and logs
const determineTransactionType = (tx, logs, chainId) => {
  // Check if it's a bridge transaction by looking for USDC transfers
  const usdcAddress = USDC_CONTRACTS[chainId];
  if (!usdcAddress) return 'Unknown';

  // Check for USDC transfer events
  const hasUSDCTransfer = logs?.some(log =>
    log.address?.toLowerCase() === usdcAddress.toLowerCase()
  );

  // For now, we'll identify bridge transactions
  if (hasUSDCTransfer) {
    return 'Bridge';
  }

  // Default to Bridge for now (can be enhanced later)
  return 'Bridge';
};

// Format transaction data
const formatTransaction = (tx, receipt, block, chainId, chainName, address) => {
  // Use actual block timestamp if available, otherwise use current time
  const timestamp = block?.timestamp
    ? Number(block.timestamp) * 1000 // Convert from Unix timestamp (seconds) to milliseconds
    : Date.now();

  // Get transaction type
  const type = determineTransactionType(tx, receipt?.logs, chainId);

  // Extract amount and direction from logs
  let amount = '0.00';
  let isOutgoing = true; // Default to outgoing (Source)

  const usdcAddress = USDC_CONTRACTS[chainId];
  if (receipt?.logs && usdcAddress) {
    const transferLogs = receipt.logs.filter(log =>
      log.address?.toLowerCase() === usdcAddress.toLowerCase() &&
      log.topics?.[0] === TRANSFER_EVENT_SIGNATURE
    );

    if (transferLogs.length > 0) {
      const log = transferLogs[0];

      // Check direction: From User = Outgoing, To User = Incoming
      const userLower = address.toLowerCase().replace('0x', '');
      const fromTopic = log.topics?.[1]?.toLowerCase() || '';
      const toTopic = log.topics?.[2]?.toLowerCase() || '';

      if (toTopic.includes(userLower)) {
        isOutgoing = false; // Incoming (Destination/Mint)
      } else {
        isOutgoing = true; // Outgoing (Source/Burn)
      }

      // Decode the amount from the log data
      try {
        if (log.data && log.data !== '0x') {
          const hexAmount = log.data.startsWith('0x') ? log.data.slice(2) : log.data;
          const amountInSmallestUnit = BigInt('0x' + hexAmount);
          const amountInUSDC = Number(amountInSmallestUnit) / 1000000;
          amount = amountInUSDC.toFixed(2);
        }
      } catch (err) {
        console.error('Error decoding transfer amount:', err);
        amount = 'N/A';
      }
    }
  }

  // Determine from/to chains for bridge transactions
  let fromChain = chainName;
  let toChain = chainName;

  if (type === 'Bridge') {
    if (isOutgoing) {
      fromChain = chainName;
      // Heuristic destination guessing (fallback when local data is missing)
      if (chainId === SEPOLIA_CHAIN_ID) {
        toChain = 'Arc Testnet';
      } else if (chainId === ARC_CHAIN_ID) {
        toChain = 'Sepolia';
      } else if (chainId === BASE_SEPOLIA_CHAIN_ID) {
        // Base Sepolia could go to Sepolia or Arc Testnet
        // Priority is given to user-saved transactions in activity page
        toChain = 'Sepolia';
      }
    } else {
      toChain = chainName;
      // Heuristic source guessing
      if (chainId === SEPOLIA_CHAIN_ID) {
        fromChain = 'Arc Testnet';
      } else if (chainId === ARC_CHAIN_ID) {
        fromChain = 'Sepolia';
      } else if (chainId === BASE_SEPOLIA_CHAIN_ID) {
        fromChain = 'Sepolia';
      }
    }
  }

  return {
    id: tx.hash,
    type,
    from: fromChain,
    to: toChain,
    amount,
    timestamp,
    status: receipt?.status === 'success' ? 'success' : receipt?.status === 'reverted' ? 'failed' : 'pending',
    hash: tx.hash,
    chainId,
    chainName, // Store chain name for display
    address: address?.toLowerCase(),
    isOutgoing,
  };
};

// Deduplicate bridge transactions
const deduplicateBridgeTransactions = (transactions) => {
  console.log(`🔍 Deduplicating ${transactions.length} transactions...`);

  const bridgeTxs = transactions.filter(tx => tx.type === 'Bridge');
  const otherTxs = transactions.filter(tx => tx.type !== 'Bridge');

  // Group bridge transactions by amount and timestamp (within 5 minute window)
  const bridgeGroups = new Map();

  bridgeTxs.forEach(tx => {
    const timeWindow = Math.floor(tx.timestamp / (5 * 60 * 1000));
    const key = `${tx.amount}_${timeWindow}`;

    if (!bridgeGroups.has(key)) {
      bridgeGroups.set(key, []);
    }
    bridgeGroups.get(key).push(tx);
  });

  // For each group, prefer the IndexedDB transaction
  const uniqueBridgeTxs = [];
  bridgeGroups.forEach((group) => {
    if (group.length === 1) {
      uniqueBridgeTxs.push(group[0]);
    } else {
      const indexedDBTx = group.find(tx => tx.isOutgoing === undefined);
      if (indexedDBTx) {
        uniqueBridgeTxs.push(indexedDBTx);
      } else {
        const outgoingTx = group.find(tx => tx.isOutgoing === true);
        uniqueBridgeTxs.push(outgoingTx || group[0]);
      }
    }
  });

  console.log(`✨ Deduplicated ${bridgeTxs.length} bridge txs to ${uniqueBridgeTxs.length} unique`);

  return [...uniqueBridgeTxs, ...otherTxs];
};

export function useTransactionHistory() {
  const { address, isConnected } = useAccount();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const pollingIntervalRef = useRef(null);
  const lastFetchRef = useRef(0);
  const fetchedHashesRef = useRef(new Set());
  const previousAddressRef = useRef(null);

  // Load transactions for a specific wallet address
  const loadWalletTransactions = useCallback(async (walletAddress) => {
    if (!walletAddress) return [];

    try {
      const walletAddressLower = walletAddress.toLowerCase();

      // Try to load from IndexedDB first
      let allTransactions = await getItem(TRANSACTIONS_STORAGE_KEY) || [];

      // Filter for this wallet
      let walletTransactions = allTransactions.filter(tx =>
        tx.address && tx.address.toLowerCase() === walletAddressLower
      );

      // If no transactions found, try sessionStorage backup
      if (walletTransactions.length === 0) {
        const recovered = recoverFromSessionStorage(walletAddress);
        if (recovered && recovered.length > 0) {
          console.log(`🔄 Recovered ${recovered.length} transactions from sessionStorage backup`);
          walletTransactions = recovered;

          // Save recovered transactions back to IndexedDB
          const merged = [...allTransactions, ...recovered];
          await setItem(TRANSACTIONS_STORAGE_KEY, merged);
        }
      }

      return walletTransactions;
    } catch (err) {
      console.error('Error loading wallet transactions:', err);
      return [];
    }
  }, []);

  // Save transactions ensuring wallet address is properly tagged
  const saveTransactions = useCallback(async (walletAddress, newTransactions) => {
    if (!walletAddress || !newTransactions || newTransactions.length === 0) return;

    try {
      const walletAddressLower = walletAddress.toLowerCase();

      // Get all existing transactions
      const allTransactions = await getItem(TRANSACTIONS_STORAGE_KEY) || [];

      // Get existing hashes for this wallet
      const existingHashes = new Set(
        allTransactions
          .filter(tx => tx.address?.toLowerCase() === walletAddressLower)
          .map(tx => tx.hash)
      );

      // Filter new transactions that don't exist yet
      const trulyNew = newTransactions.filter(tx => !existingHashes.has(tx.hash));

      if (trulyNew.length > 0) {
        // Tag all transactions with the wallet address
        const taggedNew = trulyNew.map(tx => ({
          ...tx,
          address: walletAddressLower,
        }));

        // Merge and save
        const merged = [...taggedNew, ...allTransactions].slice(0, 500); // Keep last 500
        await setItem(TRANSACTIONS_STORAGE_KEY, merged);

        // Backup to sessionStorage for this wallet
        const walletTxs = merged.filter(tx =>
          tx.address?.toLowerCase() === walletAddressLower
        );
        backupToSessionStorage(walletAddress, walletTxs);

        console.log(`💾 Saved ${trulyNew.length} new transactions for ${walletAddress.slice(0, 6)}...`);
      }
    } catch (err) {
      console.error('Error saving transactions:', err);
    }
  }, []);

  // Fetch transactions from a specific chain
  const fetchChainTransactions = useCallback(async (chainId, chainName, client) => {
    if (!client || !address) return [];

    try {
      const currentBlock = await client.getBlockNumber();
      const fromBlock = currentBlock - 100n > 0n ? currentBlock - 100n : 0n;

      const usdcAddress = USDC_CONTRACTS[chainId];
      if (!usdcAddress) return [];

      // Fetch logs where user is sender or receiver
      const [logsFrom, logsTo] = await Promise.all([
        client.getLogs({
          address: usdcAddress,
          event: {
            type: 'event',
            name: 'Transfer',
            inputs: [
              { type: 'address', indexed: true, name: 'from' },
              { type: 'address', indexed: true, name: 'to' },
              { type: 'uint256', indexed: false, name: 'value' },
            ],
          },
          args: { from: address },
          fromBlock,
          toBlock: currentBlock,
        }),
        client.getLogs({
          address: usdcAddress,
          event: {
            type: 'event',
            name: 'Transfer',
            inputs: [
              { type: 'address', indexed: true, name: 'from' },
              { type: 'address', indexed: true, name: 'to' },
              { type: 'uint256', indexed: false, name: 'value' },
            ],
          },
          args: { to: address },
          fromBlock,
          toBlock: currentBlock,
        }),
      ]);

      const logs = [...logsFrom, ...logsTo];
      const txHashes = [...new Set(logs.map(log => log.transactionHash))];

      const txPromises = txHashes
        .filter(hash => !fetchedHashesRef.current.has(hash))
        .slice(0, 20)
        .map(async (hash) => {
          try {
            const [tx, receipt] = await Promise.all([
              client.getTransaction({ hash }),
              client.getTransactionReceipt({ hash }),
            ]);

            let block = null;
            if (receipt?.blockNumber) {
              try {
                const blockPromise = client.getBlock({ blockNumber: receipt.blockNumber });
                const timeoutPromise = new Promise((_, reject) =>
                  setTimeout(() => reject(new Error('Block fetch timeout')), 5000)
                );
                block = await Promise.race([blockPromise, timeoutPromise]);
              } catch (err) {
                block = null;
              }
            }

            if (tx.from?.toLowerCase() === address.toLowerCase() ||
              receipt?.logs?.some(log =>
                log.topics?.[2]?.toLowerCase().includes(address.toLowerCase().slice(2)) ||
                log.topics?.[1]?.toLowerCase().includes(address.toLowerCase().slice(2))
              )) {
              fetchedHashesRef.current.add(hash);
              return formatTransaction(tx, receipt, block, chainId, chainName, address);
            }
            return null;
          } catch (err) {
            console.error(`Error fetching transaction ${hash}:`, err);
            return null;
          }
        });

      const results = await Promise.all(txPromises);
      return results.filter(Boolean);
    } catch (err) {
      console.error(`Error fetching transactions from ${chainName}:`, err);
      return [];
    }
  }, [address]);

  // Fetch all transactions from all chains
  const fetchTransactions = useCallback(async () => {
    if (!isConnected || !address) {
      setTransactions([]);
      return;
    }

    const now = Date.now();
    if (now - lastFetchRef.current < 30000) {
      return;
    }

    setLoading(true);
    setError(null);
    lastFetchRef.current = now;

    try {
      const arcClient = createArcClient();
      const sepoliaClient = createSepoliaClient();
      const baseSepoliaClient = createBaseSepoliaClient();

      const [arcTxs, sepoliaTxs, baseSepoliaTxs] = await Promise.all([
        arcClient ? fetchChainTransactions(ARC_CHAIN_ID, 'Arc Testnet', arcClient) : [],
        sepoliaClient ? fetchChainTransactions(SEPOLIA_CHAIN_ID, 'Sepolia', sepoliaClient) : [],
        baseSepoliaClient ? fetchChainTransactions(BASE_SEPOLIA_CHAIN_ID, 'Base Sepolia', baseSepoliaClient) : [],
      ]);

      const combinedTxs = [...arcTxs, ...sepoliaTxs, ...baseSepoliaTxs];
      const deduplicatedTxs = deduplicateBridgeTransactions(combinedTxs);
      const allTxs = deduplicatedTxs.sort((a, b) => b.timestamp - a.timestamp);

      // Update state with new transactions
      setTransactions(prev => {
        const existingHashes = new Set(prev.map(tx => tx.hash));
        const newTxs = allTxs.filter(tx => !existingHashes.has(tx.hash));
        const merged = [...newTxs, ...prev].slice(0, 100);
        return merged;
      });
    } catch (err) {
      console.error('Error fetching transaction history:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [isConnected, address, fetchChainTransactions]);

  // Effect: Handle wallet connection/disconnection and address changes
  useEffect(() => {
    const handleWalletChange = async () => {
      // Reset fetched hashes when wallet changes
      if (previousAddressRef.current !== address) {
        fetchedHashesRef.current.clear();
        lastFetchRef.current = 0;
      }

      if (!isConnected || !address) {
        // Wallet disconnected - clear transactions but data is already saved
        setTransactions([]);
        previousAddressRef.current = null;
        return;
      }

      // New wallet connected or address changed
      if (previousAddressRef.current !== address) {
        console.log(`👛 Wallet changed: ${previousAddressRef.current?.slice(0, 6) || 'none'} → ${address.slice(0, 6)}`);
        previousAddressRef.current = address;

        // Load transactions for the new wallet
        setLoading(true);
        try {
          const savedTxs = await loadWalletTransactions(address);

          if (savedTxs.length > 0) {
            const deduplicatedTxs = deduplicateBridgeTransactions(savedTxs);
            const sorted = deduplicatedTxs.sort((a, b) => b.timestamp - a.timestamp);
            setTransactions(sorted);
            console.log(`📂 Loaded ${sorted.length} transactions for ${address.slice(0, 6)}...`);
          } else {
            setTransactions([]);
            console.log(`📭 No saved transactions for ${address.slice(0, 6)}...`);
          }
        } catch (err) {
          console.error('Error loading wallet transactions:', err);
          setTransactions([]);
        } finally {
          setLoading(false);
        }
      }
    };

    handleWalletChange();
  }, [isConnected, address, loadWalletTransactions]);

  // Effect: Set up polling when wallet is connected
  useEffect(() => {
    if (!isConnected || !address) {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
      return;
    }

    // Initial fetch (delayed to allow IndexedDB load first)
    const initialFetchTimeout = setTimeout(() => {
      fetchTransactions();
    }, 1000);

    // Poll every 30 seconds
    pollingIntervalRef.current = setInterval(() => {
      fetchTransactions();
    }, 30000);

    return () => {
      clearTimeout(initialFetchTimeout);
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, [isConnected, address, fetchTransactions]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, []);

  return {
    transactions,
    loading,
    error,
    refetch: fetchTransactions,
  };
}

