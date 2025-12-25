import { useState, useEffect, useRef, useCallback } from 'react';
import { useAccount } from 'wagmi';
import { createPublicClient, http, formatUnits } from 'viem';
import { sepolia } from 'viem/chains';
import { SEPOLIA_CHAIN_ID, ARC_CHAIN_ID } from './useBridge';
import { getItem, setItem } from '../utils/indexedDB';

// Chain configurations
const ARC_RPC_URLS = [
  'https://rpc.testnet.arc.network/',
  'https://rpc.testnet.arc.network',
];

const SEPOLIA_RPC_URLS = [
  'https://ethereum-sepolia-rpc.publicnode.com',
  'https://rpc.sepolia.org',
  'https://sepolia.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161',
];

// USDC contract addresses for both chains
const USDC_CONTRACTS = {
  [SEPOLIA_CHAIN_ID]: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238',
  [ARC_CHAIN_ID]: '0x3600000000000000000000000000000000000000',
};

// ERC20 Transfer event signature
const TRANSFER_EVENT_SIGNATURE = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';

// Create public clients for both chains
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
            name: 'ETH',
            symbol: 'ETH',
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
  // In the future, we can add swap and LP detection
  if (hasUSDCTransfer) {
    // Check if this looks like a bridge (interaction with bridge contracts)
    // Bridge transactions typically involve transfers to/from bridge contracts
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

  // Extract amount from logs if available
  let amount = '0.00';
  const usdcAddress = USDC_CONTRACTS[chainId];
  if (receipt?.logs && usdcAddress) {
    const transferLogs = receipt.logs.filter(log =>
      log.address?.toLowerCase() === usdcAddress.toLowerCase() &&
      log.topics?.[0] === TRANSFER_EVENT_SIGNATURE
    );

    if (transferLogs.length > 0) {
      // Decode the amount from the log data
      // The amount is stored in log.data as a hex string
      try {
        const log = transferLogs[0];
        if (log.data && log.data !== '0x') {
          // Remove '0x' prefix and convert hex to decimal
          const hexAmount = log.data.startsWith('0x') ? log.data.slice(2) : log.data;
          const amountInSmallestUnit = BigInt('0x' + hexAmount);
          // USDC has 6 decimals
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
    // For bridge transactions, we need to determine the other chain
    if (chainId === SEPOLIA_CHAIN_ID) {
      fromChain = 'Sepolia';
      toChain = 'Arc Testnet';
    } else if (chainId === ARC_CHAIN_ID) {
      fromChain = 'Arc Testnet';
      toChain = 'Sepolia';
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
    address: address?.toLowerCase(),
  };
};

// Deduplicate bridge transactions
// Bridge transactions appear on both chains, so we need to identify and remove duplicates
const deduplicateBridgeTransactions = (transactions) => {
  const bridgeTxs = transactions.filter(tx => tx.type === 'Bridge');
  const otherTxs = transactions.filter(tx => tx.type !== 'Bridge');

  console.log(`🔍 Deduplicating ${bridgeTxs.length} bridge transactions...`);

  // Group bridge transactions by amount and approximate timestamp (within 10 minutes)
  const bridgeGroups = new Map();

  bridgeTxs.forEach(tx => {
    // Create a key based on amount and rounded timestamp (10 min window for better matching)
    const timeWindow = Math.floor(tx.timestamp / (10 * 60 * 1000)); // 10 minute windows
    const key = `${tx.amount}_${timeWindow}`;

    if (!bridgeGroups.has(key)) {
      bridgeGroups.set(key, []);
    }
    bridgeGroups.get(key).push(tx);
  });

  console.log(`📊 Found ${bridgeGroups.size} bridge transaction groups`);

  // For each group, keep only the source transaction (from Sepolia to Arc)
  const uniqueBridgeTxs = [];
  bridgeGroups.forEach((group, key) => {
    console.log(`Group ${key}: ${group.length} transactions`, group.map(tx => ({
      hash: tx.hash.slice(0, 10),
      chainId: tx.chainId,
      from: tx.from,
      to: tx.to
    })));

    if (group.length === 1) {
      // Only one transaction in this group, keep it
      uniqueBridgeTxs.push(group[0]);
    } else {
      // Multiple transactions - keep the one from Sepolia (source chain)
      // Handle both hex and decimal chainId formats
      const sepoliaTx = group.find(tx => {
        const chainId = typeof tx.chainId === 'string' && tx.chainId.startsWith('0x')
          ? parseInt(tx.chainId, 16)
          : parseInt(tx.chainId);
        return chainId === SEPOLIA_CHAIN_ID;
      });

      if (sepoliaTx) {
        console.log(`✅ Keeping Sepolia tx: ${sepoliaTx.hash.slice(0, 10)}, removing ${group.length - 1} duplicates`);
        uniqueBridgeTxs.push(sepoliaTx);
      } else {
        // If no Sepolia tx, keep the first one
        console.log(`⚠️ No Sepolia tx found, keeping first: ${group[0].hash.slice(0, 10)}`);
        uniqueBridgeTxs.push(group[0]);
      }
    }
  });

  console.log(`✨ Deduplicated to ${uniqueBridgeTxs.length} unique bridge transactions`);

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

  // Fetch transactions from a specific chain
  const fetchChainTransactions = useCallback(async (chainId, chainName, client) => {
    if (!client || !address) return [];

    try {
      // Get recent blocks (last 100 blocks for performance)
      const currentBlock = await client.getBlockNumber();
      const fromBlock = currentBlock - 100n > 0n ? currentBlock - 100n : 0n;

      // Fetch USDC transfer events for the user's address
      const usdcAddress = USDC_CONTRACTS[chainId];
      if (!usdcAddress) return [];

      // Fetch logs where user is sender
      const logsFrom = await client.getLogs({
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
        args: {
          from: address,
        },
        fromBlock,
        toBlock: currentBlock,
      });

      // Fetch logs where user is receiver
      const logsTo = await client.getLogs({
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
        args: {
          to: address,
        },
        fromBlock,
        toBlock: currentBlock,
      });

      // Combine both sets of logs
      const logs = [...logsFrom, ...logsTo];

      // Get unique transaction hashes
      const txHashes = [...new Set(logs.map(log => log.transactionHash))];

      // Fetch transaction details for each hash
      const txPromises = txHashes
        .filter(hash => !fetchedHashesRef.current.has(hash))
        .slice(0, 20) // Limit to 20 most recent to keep it lightweight
        .map(async (hash) => {
          try {
            const [tx, receipt] = await Promise.all([
              client.getTransaction({ hash }),
              client.getTransactionReceipt({ hash }),
            ]);

            // Debug: Log receipt status
            console.log(`Transaction ${hash} receipt status:`, receipt?.status);

            // Fetch block data to get the actual timestamp
            let block = null;
            if (receipt?.blockNumber) {
              try {
                // Add a timeout to prevent hanging on slow/broken RPC responses
                const blockPromise = client.getBlock({ blockNumber: receipt.blockNumber });
                const timeoutPromise = new Promise((_, reject) =>
                  setTimeout(() => reject(new Error('Block fetch timeout')), 5000)
                );
                block = await Promise.race([blockPromise, timeoutPromise]);
              } catch (err) {
                console.warn(`⚠️ Could not fetch block ${receipt.blockNumber}, using current time. Error:`, err.message);
                // Fallback: use current time if block fetch fails
                block = null;
              }
            }

            // Only include transactions from/to the user's address
            if (tx.from?.toLowerCase() === address.toLowerCase() ||
              receipt?.logs?.some(log =>
                log.topics?.[2]?.toLowerCase() === address.toLowerCase() ||
                log.topics?.[1]?.toLowerCase() === address.toLowerCase()
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

  // Fetch all transactions
  const fetchTransactions = useCallback(async () => {
    if (!isConnected || !address) {
      setTransactions([]);
      return;
    }

    // Throttle: only fetch if last fetch was more than 30 seconds ago
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

      const [arcTxs, sepoliaTxs] = await Promise.all([
        arcClient ? fetchChainTransactions(ARC_CHAIN_ID, 'Arc Testnet', arcClient) : [],
        sepoliaClient ? fetchChainTransactions(SEPOLIA_CHAIN_ID, 'Sepolia', sepoliaClient) : [],
      ]);

      // Combine, deduplicate, and sort by timestamp (newest first)
      const combinedTxs = [...arcTxs, ...sepoliaTxs];
      const deduplicatedTxs = deduplicateBridgeTransactions(combinedTxs);
      const allTxs = deduplicatedTxs.sort((a, b) => b.timestamp - a.timestamp);

      // Save to IndexedDB for persistence
      if (allTxs.length > 0) {
        try {
          // Load existing transactions from IndexedDB
          const existingTxs = await getItem('myTransactions') || [];

          // Merge new transactions with existing ones (avoid duplicates by hash)
          const existingHashes = new Set(existingTxs.map(tx => tx.hash));
          const newTxsToSave = allTxs.filter(tx => !existingHashes.has(tx.hash));

          if (newTxsToSave.length > 0 || existingTxs.length > 0) {
            // Merge and deduplicate the entire dataset to clean up old duplicates
            const mergedTxs = [...newTxsToSave, ...existingTxs];
            const deduplicatedMerged = deduplicateBridgeTransactions(mergedTxs);

            await setItem('myTransactions', deduplicatedMerged);
            console.log(`💾 Saved ${newTxsToSave.length} new transactions to IndexedDB (total: ${deduplicatedMerged.length} after deduplication)`);
          }
        } catch (err) {
          console.error('Error saving transactions to IndexedDB:', err);
        }
      }

      // Update state, merging with existing transactions
      setTransactions(prev => {
        const existingHashes = new Set(prev.map(tx => tx.hash));
        const newTxs = allTxs.filter(tx => !existingHashes.has(tx.hash));
        return [...newTxs, ...prev].slice(0, 100); // Keep only last 100 transactions
      });
    } catch (err) {
      console.error('Error fetching transaction history:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [isConnected, address, fetchChainTransactions]);

  // Load transactions from IndexedDB when wallet connects
  useEffect(() => {
    const loadSavedTransactions = async () => {
      if (!isConnected || !address) {
        setTransactions([]);
        return;
      }

      try {
        const savedTxs = await getItem('myTransactions') || [];

        // Filter transactions for the current wallet address
        const walletAddressLower = address.toLowerCase();
        const filteredTxs = savedTxs.filter(tx =>
          tx.address && tx.address.toLowerCase() === walletAddressLower
        );

        // Deduplicate bridge transactions
        const deduplicatedTxs = deduplicateBridgeTransactions(filteredTxs);

        console.log(`📂 Loaded ${deduplicatedTxs.length} transactions from IndexedDB for ${address}`);

        // Set the deduplicated and filtered transactions immediately
        if (deduplicatedTxs.length > 0) {
          setTransactions(deduplicatedTxs.sort((a, b) => b.timestamp - a.timestamp));
        }
      } catch (err) {
        console.error('Error loading transactions from IndexedDB:', err);
      }
    };

    loadSavedTransactions();
  }, [isConnected, address]);

  // Set up polling when wallet is connected
  useEffect(() => {
    if (!isConnected || !address) {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
      setTransactions([]);
      return;
    }

    // Initial fetch
    fetchTransactions();

    // Poll every 30 seconds (lightweight)
    pollingIntervalRef.current = setInterval(() => {
      fetchTransactions();
    }, 30000);

    return () => {
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
