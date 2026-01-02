import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useWallet } from '../contexts/WalletContext';
import { Copy, ExternalLink, CheckCircle, Clock, XCircle, ArrowLeftRight, RefreshCw, Layers, History } from 'lucide-react';
import { motion } from 'framer-motion';
import { timeAgo, formatAddress, copyToClipboard, getExplorerUrl } from '../utils/blockchain';
import { useTransactionHistory } from '../hooks/useTransactionHistory';
import { getItem, setItem } from '../utils/indexedDB';
import { NETWORKS } from '../config/networks';

// Helper function to get network name from chainId
const getNetworkName = (chainId) => {
  if (!chainId) return null;

  // Handle both hex and decimal chainId
  const chainIdNum = typeof chainId === 'string' && chainId.startsWith('0x')
    ? parseInt(chainId, 16)
    : parseInt(chainId);

  // Match chainId to network
  if (chainIdNum === 5042002 || chainId === '0x4cef52' || chainId === '5042002') {
    return NETWORKS.ARC_TESTNET.chainName; // "Arc Testnet"
  } else if (chainIdNum === 11155111 || chainId === '0xaa36a7' || chainId === '11155111') {
    return NETWORKS.ETHEREUM_SEPOLIA.chainName; // "Sepolia Testnet"
  } else if (chainIdNum === 84532 || chainId === '0x14a34' || chainId === '84532') {
    return NETWORKS.BASE_SEPOLIA.chainName; // "Base Sepolia"
  }

  return null;
};

// Helper to get chain icon
const getChainIcon = (chainName) => {
  if (!chainName) return null;
  const name = chainName.toLowerCase();

  if (name.includes('arc')) return '/icons/Arc.png';
  if (name.includes('base')) return '/icons/base.png';
  if (name.includes('sepolia') || name.includes('eth')) return '/icons/eth.png';

  return null;
};

// Helper to get token logo
const getTokenLogo = (symbol) => {
  if (!symbol) return null;
  const s = String(symbol).toLowerCase();
  if (s.includes('usdc')) return '/icons/usdc.png';
  if (s.includes('stck') || s.includes('stac')) return '/icons/stac.png';
  if (s.includes('ball')) return '/icons/ball.jpg';
  if (s.includes('mtb')) return '/icons/MTB.png';
  if (s.includes('ecr')) return '/icons/ECR.png';
  if (s.includes('eth')) return '/icons/eth.png';
  if (s.includes('eurc')) return '/icons/eurc.png';
  return null;
};

const EmptyActivityState = () => (
  <div className="flex flex-col items-center justify-center py-16 md:py-24 px-6 overflow-hidden text-center">
    <div className="relative mb-14 md:mb-16 flex items-center justify-center scale-90 md:scale-100">
      {/* Refined concentric rings */}
      <div className="absolute w-44 h-44 rounded-full border border-slate-200/60 dark:border-slate-700/40 animate-pulse" />
      <div className="absolute w-32 h-32 rounded-full border border-slate-300/40 dark:border-slate-600/25" />

      {/* Central icon container */}
      <div className="relative z-10 w-20 h-20 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center border border-slate-200/80 dark:border-slate-700/50 shadow-lg transition-all duration-300">
        <History size={36} className="text-slate-500 dark:text-slate-400" strokeWidth={1.5} />
      </div>
    </div>
    <div className="max-w-[280px] md:max-w-md mx-auto">
      <p className="text-slate-500 dark:text-slate-400 text-sm md:text-base font-semibold tracking-tight leading-relaxed transition-colors duration-300">
        This account has no recent activity...
      </p>
    </div>
  </div>
);

const Transactions = () => {
  const { t } = useTranslation();
  const { isConnected, walletAddress, chainId } = useWallet();
  const [copiedHash, setCopiedHash] = useState('');
  const [previousWallet, setPreviousWallet] = useState(null);

  // Fetch real-time transactions from blockchain (auto-updates every 30 seconds)
  const { transactions: blockchainTransactions, loading: transactionsLoading } = useTransactionHistory();

  // Activity data - stored in IndexedDB for persistence (web3-native)
  const [myTransactions, setMyTransactions] = useState([]);
  const [loadingLocalTransactions, setLoadingLocalTransactions] = useState(true);

  // Helper: Backup transactions to sessionStorage for recovery
  const backupToSessionStorage = (address, transactions) => {
    try {
      if (address && transactions && transactions.length > 0) {
        const key = `stac_tx_backup_${address.toLowerCase()}`;
        sessionStorage.setItem(key, JSON.stringify(transactions));
      }
    } catch (err) {
      // Silently fail
    }
  };

  // Helper: Recover transactions from sessionStorage
  const recoverFromSessionStorage = (address) => {
    try {
      if (address) {
        const key = `stac_tx_backup_${address.toLowerCase()}`;
        const data = sessionStorage.getItem(key);
        return data ? JSON.parse(data) : null;
      }
    } catch (err) {
      return null;
    }
    return null;
  };

  // Load transactions from IndexedDB on mount and when wallet address changes
  useEffect(() => {
    const loadTransactions = async () => {
      setLoadingLocalTransactions(true);

      try {
        // Detect wallet change and clear previous data
        if (previousWallet && previousWallet !== walletAddress) {
          console.log(`👛 Wallet switched: ${previousWallet.slice(0, 6)} → ${walletAddress?.slice(0, 6) || 'none'}`);
          setMyTransactions([]); // Clear immediately on wallet change
        }

        if (!walletAddress) {
          console.log('⚠️ No wallet connected, showing empty transactions');
          setMyTransactions([]);
          setLoadingLocalTransactions(false);
          return;
        }

        setPreviousWallet(walletAddress);
        const walletAddressLower = walletAddress.toLowerCase();

        // Try to load from IndexedDB first
        const saved = await getItem('myTransactions');
        console.log('📦 Loading transactions from IndexedDB:', {
          totalInStorage: saved?.length || 0,
          walletAddress: walletAddressLower
        });

        if (saved && Array.isArray(saved)) {
          // Filter transactions by current wallet address
          const filtered = saved.filter(tx => {
            if (tx.address) {
              return tx.address.toLowerCase() === walletAddressLower;
            }
            return false;
          });

          if (filtered.length > 0) {
            console.log(`✅ Loaded ${filtered.length} transactions for ${walletAddress.slice(0, 6)}...`);
            setMyTransactions(filtered);
            // Backup to sessionStorage
            backupToSessionStorage(walletAddress, filtered);
          } else {
            // No transactions in IndexedDB, try sessionStorage recovery
            const recovered = recoverFromSessionStorage(walletAddress);
            if (recovered && recovered.length > 0) {
              console.log(`🔄 Recovered ${recovered.length} transactions from sessionStorage`);
              setMyTransactions(recovered);
              // Save recovered transactions back to IndexedDB
              const allSaved = saved || [];
              const merged = [...recovered, ...allSaved.filter(tx =>
                tx.address?.toLowerCase() !== walletAddressLower
              )];
              await setItem('myTransactions', merged);
            } else {
              console.log(`📭 No transactions found for ${walletAddress.slice(0, 6)}...`);
              setMyTransactions([]);
            }
          }
        } else {
          // No data in IndexedDB, try sessionStorage
          const recovered = recoverFromSessionStorage(walletAddress);
          if (recovered && recovered.length > 0) {
            console.log(`🔄 Recovered ${recovered.length} transactions from sessionStorage (no IndexedDB data)`);
            setMyTransactions(recovered);
            await setItem('myTransactions', recovered);
          } else {
            console.log('📭 No transactions found in any storage');
            setMyTransactions([]);
          }
        }
      } catch (err) {
        console.error('Error loading transactions:', err);
        setMyTransactions([]);
      } finally {
        setLoadingLocalTransactions(false);
      }
    };

    loadTransactions();
  }, [walletAddress]); // Reload when wallet address changes

  // Merge blockchain transactions with IndexedDB transactions
  // PRIORITY: IndexedDB transactions have accurate from/to chains (user-selected)
  // Blockchain transactions are fallback when no user-saved data exists
  const mergedTransactions = useMemo(() => {
    if (!walletAddress) {
      return [];
    }

    const walletAddressLower = walletAddress.toLowerCase();

    // Filter blockchain transactions by wallet address
    const filteredBlockchain = blockchainTransactions.filter(tx => {
      // Check if transaction is from/to the current wallet
      if (tx.from && tx.from.toLowerCase() === walletAddressLower) return true;
      if (tx.to && tx.to.toLowerCase() === walletAddressLower) return true;
      // If transaction has address field, use that
      if (tx.address && tx.address.toLowerCase() === walletAddressLower) return true;
      return false;
    });

    // Filter local transactions by wallet address
    // Cleanup: remove blockchain-fetched Bridge transactions (have isOutgoing flag)
    // Keep only user-saved Bridge transactions (no isOutgoing flag)
    const filteredLocal = myTransactions.filter(tx => {
      if (!tx.address) return false;
      if (tx.address.toLowerCase() !== walletAddressLower) return false;

      // Remove blockchain-fetched Bridge transactions that were accidentally saved
      // They have incorrect heuristic chains - only user-saved Bridge txs are accurate
      if (tx.type === 'Bridge' && tx.isOutgoing !== undefined) {
        return false; // Skip blockchain-fetched Bridge transactions
      }

      return true;
    });
    // Build set of local transaction hashes for deduplication
    const localSet = new Set(filteredLocal.map(tx => tx.hash));

    // Add blockchain transactions that don't exist in local storage
    // CRITICAL: We only show Bridge/Swap activity carried out on THIS dApp
    // This is ensured by only showing Bridge transactions that have a matching record in local storage
    const blockchainOnly = filteredBlockchain.filter(tx => {
      // If we already have it locally, don't add it again (deduplication)
      if (localSet.has(tx.hash)) return false;

      // EXCLUDE: Bridge and Transfer types from blockchain sources directly
      // These are often "noise" from external dApps or standard transfers
      // We only show Bridge transactions if they were explicitly saved by our dApp
      if (tx.type === 'Bridge' || tx.type === 'Transfer') return false;

      // ALLOW: Swaps (often useful catch-all for dApp swaps if local save failed)
      return true;
    });

    // Combine: local first (accurate user data), then blockchain-only (other types like Swaps)
    const merged = [...filteredLocal, ...blockchainOnly].sort((a, b) => {
      const timeA = a.timestamp || 0;
      const timeB = b.timestamp || 0;
      return timeB - timeA;
    });

    console.log('🔄 Merged transactions:', {
      blockchain: filteredBlockchain.length,
      local: filteredLocal.length,
      blockchainOnly: blockchainOnly.length,
      total: merged.length,
      walletAddress: walletAddressLower
    });

    return merged;
  }, [blockchainTransactions, myTransactions, walletAddress]);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const transactionsPerPage = 10;

  // Calculate pagination
  const totalPages = Math.ceil(mergedTransactions.length / transactionsPerPage);
  const startIndex = (currentPage - 1) * transactionsPerPage;
  const endIndex = startIndex + transactionsPerPage;
  const paginatedTransactions = mergedTransactions.slice(startIndex, endIndex);

  // Reset to page 1 when wallet changes
  useEffect(() => {
    setCurrentPage(1);
  }, [walletAddress]);

  // Note: We don't save filtered transactions back to IndexedDB
  // The original transactions with all wallet addresses are kept in storage
  // We only filter when displaying. This preserves data for all wallets.

  // Listen for new transactions from other pages (Bridge, Swap, etc.)
  useEffect(() => {
    const handleTransactionSaved = async () => {
      // Reload transactions when a new one is saved
      // Filter by current wallet address
      console.log('🔄 Transaction saved event received, reloading...');
      try {
        const saved = await getItem('myTransactions');
        if (saved && Array.isArray(saved)) {
          if (walletAddress) {
            const walletAddressLower = walletAddress.toLowerCase();
            const filtered = saved.filter(tx => {
              // Only include transactions with matching address
              if (tx.address) {
                return tx.address.toLowerCase() === walletAddressLower;
              }
              // Exclude transactions without address field
              return false;
            });
            console.log('🔄 Reloaded transactions after save:', {
              total: saved.length,
              filtered: filtered.length,
              walletAddress: walletAddressLower
            });
            setMyTransactions(filtered);
          } else {
            setMyTransactions([]);
          }
        }
      } catch (err) {
        console.error('Error reloading transactions:', err);
      }
    };

    window.addEventListener('bridgeTransactionSaved', handleTransactionSaved);
    window.addEventListener('swapTransactionSaved', handleTransactionSaved);
    window.addEventListener('lpTransactionSaved', handleTransactionSaved);

    return () => {
      window.removeEventListener('bridgeTransactionSaved', handleTransactionSaved);
      window.removeEventListener('swapTransactionSaved', handleTransactionSaved);
      window.removeEventListener('lpTransactionSaved', handleTransactionSaved);
    };
  }, [walletAddress]); // Include walletAddress in dependencies

  const handleCopyHash = async (hash) => {
    const success = await copyToClipboard(hash);
    if (success) {
      setCopiedHash(hash);
      setTimeout(() => setCopiedHash(''), 2000);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="text-green-600 dark:text-green-400" size={20} />;
      case 'pending':
        return <Clock className="text-yellow-600 dark:text-yellow-400 animate-pulse" size={20} />;
      case 'failed':
        return <XCircle className="text-red-600 dark:text-red-400" size={20} />;
      default:
        return null;
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'Bridge':
        return <ArrowLeftRight size={16} className="mr-1.5" />;
      case 'Swap':
        return <RefreshCw size={16} className="mr-1.5" />;
      case 'Add LP':
      case 'Remove LP':
        return <Layers size={16} className="mr-1.5" />;
      default:
        return null;
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'Swap':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400';
      case 'Bridge':
        return 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400';
      case 'Add LP':
        return 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400';
      case 'Remove LP':
        return 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400';
      default:
        return 'bg-gray-100 dark:bg-gray-900/30 text-gray-600 dark:text-gray-400';
    }
  };

  // Helper functions to format swap transaction data
  const getSwapFromToken = (tx) => {
    if (tx.type !== 'Swap') return tx.from || '';
    if (!tx.from) return '';

    const fromStr = String(tx.from).trim();

    // If it's already just a token symbol (no spaces, no numbers), return it
    if (!fromStr.includes(' ') && !/^\d/.test(fromStr)) return fromStr;

    // Extract token symbol from formats like "1.0 USDC", "1 EURC", etc.
    // Split by space and get the last part (token symbol)
    const parts = fromStr.split(/\s+/).filter(p => p.length > 0);
    if (parts.length > 1) {
      // Return the last part which should be the token symbol
      return parts[parts.length - 1];
    }

    // If only one part, check if it's a token (contains letters) or a number
    if (/[A-Za-z]/.test(parts[0])) {
      return parts[0];
    }

    return fromStr;
  };

  const getSwapToToken = (tx) => {
    if (tx.type !== 'Swap') return tx.to || '';
    if (!tx.to) return '';

    const toStr = String(tx.to).trim();

    // If it's already just a token symbol (no spaces, no numbers at start), return it
    if (!toStr.includes(' ') && !/^\d/.test(toStr)) return toStr;

    // Extract token symbol from formats like "1.096700 USDC", "1.1 EURC", etc.
    // Split by space and get the last part (token symbol)
    const parts = toStr.split(/\s+/).filter(p => p && p.length > 0);
    if (parts.length > 1) {
      // Return the last part which should be the token symbol
      const token = parts[parts.length - 1];
      return token || toStr;
    }

    // If only one part, check if it's a token (contains letters) or a number
    if (parts.length > 0 && /[A-Za-z]/.test(parts[0])) {
      return parts[0];
    }

    return toStr;
  };

  const getSwapAmount = (tx) => {
    if (tx.type !== 'Swap') return tx.amount || '';
    if (!tx.amount) return '';

    const amountStr = String(tx.amount).trim();

    // If it's already just a number (no arrow, no letters), return it
    const cleanNumber = parseFloat(amountStr);
    if (!isNaN(cleanNumber) && !amountStr.includes('→') && !/[a-zA-Z]/.test(amountStr)) {
      return String(cleanNumber);
    }

    // If it contains an arrow, extract the first number before the arrow
    if (amountStr.includes('→')) {
      // Format: "1 EURC → 1.096700 USDC" - extract first number
      const parts = amountStr.split('→');
      const firstPart = parts[0].trim();
      const numberMatch = firstPart.match(/^([\d.]+)/);
      if (numberMatch && numberMatch[1]) {
        return numberMatch[1];
      }
    }

    // Otherwise, extract the first number from the string
    // Format: "1 EURC" or "1.096700 USDC" - extract number
    const numberMatch = amountStr.match(/^([\d.]+)/);
    if (numberMatch && numberMatch[1]) {
      return numberMatch[1];
    }

    return amountStr;
  };

  // Helper to get from amount for swap transactions
  const getSwapFromAmount = (tx) => {
    if (tx.type !== 'Swap') return '';
    if (!tx.from) return '';

    const fromStr = String(tx.from).trim();
    const numberMatch = fromStr.match(/^([\d.]+)/);
    if (!numberMatch) return '';

    // Maintain precision for small amounts
    const num = parseFloat(numberMatch[1]);
    if (num < 0.001) return num.toFixed(6);
    if (num < 0.01) return num.toFixed(4);
    return numberMatch[1];
  };

  // Helper to get to amount for swap transactions
  const getSwapToAmount = (tx) => {
    if (tx.type !== 'Swap') return '';

    let rawAmount = '';

    // First try to extract from tx.to
    if (tx.to) {
      const toStr = String(tx.to).trim();
      const numberMatch = toStr.match(/^([\d.]+)/);
      if (numberMatch && numberMatch[1]) {
        rawAmount = numberMatch[1];
      }
    }

    // If tx.amount contains arrow format, extract the second number
    if (!rawAmount && tx.amount && String(tx.amount).includes('→')) {
      const amountStr = String(tx.amount).trim();
      const parts = amountStr.split('→');
      if (parts.length > 1) {
        const secondPart = parts[1].trim();
        const numberMatch = secondPart.match(/^([\d.]+)/);
        if (numberMatch && numberMatch[1]) {
          rawAmount = numberMatch[1];
        }
      }
    }

    if (!rawAmount) return '';

    // Maintain precision for small amounts
    const num = parseFloat(rawAmount);
    if (num < 0.001) return num.toFixed(6);
    if (num < 0.01) return num.toFixed(4);
    return rawAmount;
  };

  return (
    <div className="max-w-6xl mx-auto w-full px-4 sm:px-4 md:px-0">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold mb-2">{t('Transactions')}</h1>
      </div>

      {/* Activity Table - Desktop */}
      <div className="card overflow-x-auto hidden md:block">
        {mergedTransactions.length > 0 ? (
          <table className="w-full min-w-[800px]">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-3 md:py-4 text-xs md:text-sm">Type</th>
                <th className="text-left py-3 md:py-4 text-xs md:text-sm">From</th>
                <th className="text-left py-3 md:py-4 text-xs md:text-sm">To</th>
                <th className="text-left py-3 md:py-4 text-xs md:text-sm">Amount</th>
                <th className="text-left py-3 md:py-4 text-xs md:text-sm">Time</th>
                <th className="text-left py-3 md:py-4 text-xs md:text-sm">Status</th>
                <th className="text-left py-3 md:py-4 text-xs md:text-sm">Transaction Hash</th>
              </tr>
            </thead>
            <tbody>
              {paginatedTransactions.map((tx, index) => (
                <motion.tr
                  key={tx.id || tx.hash || `tx-${index}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                >
                  <td className="py-3 md:py-4">
                    {tx.type === 'Swap' ? (
                      <div className="flex flex-col gap-1.5">
                        <span className="text-xs md:text-sm font-bold text-slate-900 dark:text-white">{tx.type}</span>
                        {getNetworkName(tx.chainId) && (
                          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200/50 dark:border-slate-700/50 w-fit">
                            <img src={getChainIcon(getNetworkName(tx.chainId))} alt="" className="w-3 h-3 object-contain" />
                            <span className="text-[10px] text-slate-600 dark:text-slate-400 font-bold uppercase tracking-wider">
                              {getNetworkName(tx.chainId)}
                            </span>
                          </div>
                        )}
                      </div>
                    ) : tx.type === 'Bridge' ? (
                      <div className="flex flex-col gap-1.5">
                        <span className="text-xs md:text-sm font-bold text-slate-900 dark:text-white">{tx.type}</span>
                        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200/50 dark:border-slate-700/50 w-fit">
                          <span className="text-[10px] text-slate-600 dark:text-slate-400 font-bold uppercase tracking-wider">Cross-Chain</span>
                        </div>
                      </div>
                    ) : (
                      <span className={`inline-flex items-center px-2 py-1 md:px-3 md:py-1 rounded-full text-xs font-semibold ${getTypeColor(tx.type)}`}>
                        {getTypeIcon(tx.type)}
                        {tx.type}
                      </span>
                    )}
                  </td>
                  <td className="py-3 md:py-4 text-xs md:text-sm font-medium">
                    {tx.type === 'Bridge' ? (
                      getChainIcon(tx.from) ? (
                        <div className="flex items-center gap-2">
                          <img src={getChainIcon(tx.from)} alt={tx.from} className="w-5 h-5 rounded-full object-cover" />
                          <span>{tx.from}</span>
                        </div>
                      ) : (
                        tx.from
                      )
                    ) : (
                      <div className="flex items-center gap-2.5">
                        <div className="w-6 h-6 rounded-full flex items-center justify-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                          {getTokenLogo(getSwapFromToken(tx)) ? (
                            <img src={getTokenLogo(getSwapFromToken(tx))} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full rounded-full bg-slate-100 dark:bg-slate-700" />
                          )}
                        </div>
                        <span className="font-bold text-slate-900 dark:text-white uppercase tracking-tight">{getSwapFromToken(tx)}</span>
                      </div>
                    )}
                  </td>
                  <td className="py-3 md:py-4 text-xs md:text-sm font-medium">
                    {tx.type === 'Bridge' ? (
                      getChainIcon(tx.to) ? (
                        <div className="flex items-center gap-2">
                          <img src={getChainIcon(tx.to)} alt={tx.to} className="w-5 h-5 rounded-full object-cover" />
                          <span>{tx.to}</span>
                        </div>
                      ) : (
                        tx.to
                      )
                    ) : (
                      <div className="flex items-center gap-2.5">
                        <div className="w-6 h-6 rounded-full flex items-center justify-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                          {getTokenLogo(getSwapToToken(tx)) ? (
                            <img src={getTokenLogo(getSwapToToken(tx))} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full rounded-full bg-slate-100 dark:bg-slate-700" />
                          )}
                        </div>
                        <span className="font-bold text-slate-900 dark:text-white uppercase tracking-tight">{getSwapToToken(tx)}</span>
                      </div>
                    )}
                  </td>
                  <td className="py-3 md:py-4 text-xs md:text-sm font-semibold">{getSwapAmount(tx)}</td>
                  <td className="py-3 md:py-4 text-xs md:text-sm text-gray-500">{timeAgo(tx.timestamp)}</td>
                  <td className="py-3 md:py-4">
                    {tx.status === 'success' ? (
                      <span className="inline-flex items-center px-3 py-1.5 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/30 rounded-lg">
                        <div className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-500 mr-2 flex-shrink-0">
                          <CheckCircle className="text-white" size={14} />
                        </div>
                        <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">Success</span>
                      </span>
                    ) : (
                      <div className="flex items-center space-x-1 md:space-x-2">
                        {getStatusIcon(tx.status)}
                        <span className="capitalize text-xs md:text-sm">{tx.status}</span>
                      </div>
                    )}
                  </td>
                  <td className="py-3 md:py-4">
                    <div className="flex items-center space-x-1 md:space-x-2">
                      <button
                        onClick={() => handleCopyHash(tx.hash)}
                        className="font-mono text-xs md:text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center space-x-1"
                        title="Copy"
                      >
                        <span>{formatAddress(tx.hash)}</span>
                        {copiedHash === tx.hash ? (
                          <CheckCircle size={12} className="text-green-600" />
                        ) : (
                          <Copy size={12} />
                        )}
                      </button>
                      <a
                        href={getExplorerUrl(tx.hash, tx.chainId || chainId || 11155111)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-500 hover:text-blue-600 dark:hover:text-blue-400"
                        title="View on Explorer"
                      >
                        <ExternalLink size={12} />
                      </a>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="text-center py-8 md:py-12">
            {transactionsLoading ? (
              <div className="flex flex-col items-center gap-2">
                <RefreshCw className="animate-spin text-blue-600 dark:text-blue-400" size={24} />
                <p className="text-gray-500 dark:text-gray-400">Loading transactions...</p>
              </div>
            ) : (
              <EmptyActivityState />
            )}
          </div>
        )}
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-3">
        {mergedTransactions.length > 0 ? (
          paginatedTransactions.map((tx, index) => (
            <motion.div
              key={tx.id || tx.hash || `tx-${index}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`card p-4 space-y-3.5 touch-manipulation ${tx.type === 'Swap'
                ? 'border border-blue-100/80 dark:border-blue-900/40 bg-gradient-to-b from-white to-blue-50/40 dark:from-gray-900 dark:to-blue-950/15'
                : ''
                }`}
            >
              {/* Header Row - Type, Status, and Time */}
              {tx.type === 'Swap' ? (
                <div className="flex flex-col gap-2">
                  {/* Top row: Swap title and Time */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex flex-col gap-1.5">
                      <span className="text-sm font-semibold text-slate-900 dark:text-white">{tx.type}</span>
                      {getNetworkName(tx.chainId) && (
                        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 w-fit">
                          <img src={getChainIcon(getNetworkName(tx.chainId))} alt="" className="w-3 h-3 object-contain" />
                          <span className="text-[10px] font-bold uppercase tracking-wider">
                            {getNetworkName(tx.chainId)}
                          </span>
                        </div>
                      )}
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap flex-shrink-0">{timeAgo(tx.timestamp)}</span>
                  </div>
                  {/* Centered Success button */}
                  <div className="flex justify-center">
                    {tx.status === 'success' ? (
                      <span className="inline-flex items-center px-2.5 py-1" style={{
                        backgroundColor: '#E0F2F1',
                        border: '1px solid #80CBC4',
                        borderRadius: '8px'
                      }}>
                        <span className="flex items-center justify-center w-4 h-4 rounded-full mr-1.5 flex-shrink-0" style={{
                          backgroundColor: '#00897B'
                        }}>
                          <i className="fa fa-check-circle text-white" style={{ fontSize: '10px', lineHeight: '1' }}></i>
                        </span>
                        <span className="text-xs font-semibold" style={{ color: '#00695C' }}>Success</span>
                      </span>
                    ) : (
                      <div className="flex items-center space-x-1">
                        {getStatusIcon(tx.status)}
                        <span className="capitalize text-xs font-medium">{tx.status}</span>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {/* Top row: Bridge title and Time */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex flex-col gap-1.5">
                      {tx.type === 'Bridge' ? (
                        <span className="text-sm font-semibold text-slate-900 dark:text-white">{tx.type}</span>
                      ) : (
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${getTypeColor(tx.type)}`}>
                          {getTypeIcon(tx.type)}
                          {tx.type}
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap flex-shrink-0">{timeAgo(tx.timestamp)}</span>
                  </div>
                  {/* Centered Success button */}
                  <div className="flex justify-center">
                    {tx.status === 'success' ? (
                      <span className="inline-flex items-center px-2.5 py-1" style={{
                        backgroundColor: '#E0F2F1',
                        border: '1px solid #80CBC4',
                        borderRadius: '8px'
                      }}>
                        <span className="flex items-center justify-center w-4 h-4 rounded-full mr-1.5 flex-shrink-0" style={{
                          backgroundColor: '#00897B'
                        }}>
                          <i className="fa fa-check-circle text-white" style={{ fontSize: '10px', lineHeight: '1' }}></i>
                        </span>
                        <span className="text-xs font-semibold" style={{ color: '#00695C' }}>Success</span>
                      </span>
                    ) : (
                      <div className="flex items-center space-x-1">
                        {getStatusIcon(tx.status)}
                        <span className="capitalize text-xs font-medium">{tx.status}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {tx.type === 'Swap' ? (
                <>
                  {/* Swap Summary - Mobile optimized */}
                  <div className="rounded-xl border border-blue-100/70 dark:border-blue-900/40 bg-white/70 dark:bg-gray-900/40 p-3">
                    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
                      <div className="min-w-0">
                        <div className="text-[11px] font-medium text-gray-500 dark:text-gray-400 mb-1">You pay</div>
                        <div className="flex items-center gap-2 min-w-0">
                          {getTokenLogo(getSwapFromToken(tx)) && (
                            <img src={getTokenLogo(getSwapFromToken(tx))} alt="" className="w-5 h-5 rounded-full object-cover border border-white/10" />
                          )}
                          <div className="flex items-baseline gap-1.5 min-w-0">
                            {(getSwapFromAmount(tx) || getSwapAmount(tx)) && (
                              <span className="text-base font-extrabold text-slate-900 dark:text-white tabular-nums truncate">
                                {getSwapFromAmount(tx) || getSwapAmount(tx)}
                              </span>
                            )}
                            <span className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                              {getSwapFromToken(tx)}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-center">
                        <ArrowLeftRight size={18} className="text-blue-400 dark:text-blue-500 flex-shrink-0" />
                      </div>

                      <div className="min-w-0">
                        <div className="text-[11px] font-medium text-gray-500 dark:text-gray-400 mb-1 text-right">You receive</div>
                        <div className="flex items-center justify-end gap-2 min-w-0">
                          <div className="flex items-baseline justify-end gap-1.5 min-w-0 order-1">
                            {getSwapToAmount(tx) && (
                              <span className="text-base font-extrabold text-slate-900 dark:text-white tabular-nums truncate">
                                {getSwapToAmount(tx)}
                              </span>
                            )}
                            <span className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                              {getSwapToToken(tx)}
                            </span>
                          </div>
                          {getTokenLogo(getSwapToToken(tx)) && (
                            <img src={getTokenLogo(getSwapToToken(tx))} alt="" className="w-5 h-5 rounded-full object-cover border border-white/10 order-2" />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {/* From/To Row - Improved spacing and layout */}
                  <div className="flex items-center gap-3 py-1.5">
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">From</div>
                      <div className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                        {tx.type === 'Bridge' ? (
                          getChainIcon(tx.from) ? (
                            <div className="flex items-center gap-1.5">
                              <img src={getChainIcon(tx.from)} alt={tx.from} className="w-4 h-4 rounded-full object-cover" />
                              <span>{tx.from}</span>
                            </div>
                          ) : (
                            tx.from
                          )
                        ) : (
                          getSwapFromToken(tx)
                        )}
                      </div>
                    </div>
                    <ArrowLeftRight size={18} className="text-gray-400 dark:text-gray-500 flex-shrink-0" />
                    <div className="flex-1 min-w-0 text-right">
                      <div className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">To</div>
                      <div className="text-sm font-semibold text-slate-900 dark:text-white truncate flex justify-end">
                        {tx.type === 'Bridge' ? (
                          getChainIcon(tx.to) ? (
                            <div className="flex items-center gap-1.5">
                              <img src={getChainIcon(tx.to)} alt={tx.to} className="w-4 h-4 rounded-full object-cover" />
                              <span>{tx.to}</span>
                            </div>
                          ) : (
                            tx.to
                          )
                        ) : (
                          getSwapToToken(tx)
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Amount - Better visual hierarchy */}
                  <div className="flex items-center justify-between py-1.5 bg-gray-50 dark:bg-gray-800/50 rounded-lg px-3 -mx-1">
                    <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Amount</span>
                    <span className="text-base font-bold text-slate-900 dark:text-white">{getSwapAmount(tx)}</span>
                  </div>
                </>
              )}

              {/* Transaction Hash - Improved layout */}
              <div className="pt-2.5 border-t border-gray-200 dark:border-gray-700">
                <div className="flex flex-col gap-2">
                  <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Transaction Hash</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleCopyHash(tx.hash)}
                      className="flex-1 font-mono text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center justify-between gap-2 touch-manipulation min-h-[44px] px-3 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg active:bg-blue-100 dark:active:bg-blue-900/30 transition-colors"
                      title="Copy"
                    >
                      <span className="truncate">{formatAddress(tx.hash)}</span>
                      {copiedHash === tx.hash ? (
                        <CheckCircle size={16} className="text-green-600 flex-shrink-0" />
                      ) : (
                        <Copy size={16} className="flex-shrink-0 opacity-60" />
                      )}
                    </button>
                    <a
                      href={getExplorerUrl(tx.hash, tx.chainId || chainId || 11155111)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 touch-manipulation min-h-[44px] min-w-[44px] flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg active:bg-gray-200 dark:active:bg-gray-700 transition-colors"
                      title="View on Explorer"
                    >
                      <ExternalLink size={18} />
                    </a>
                  </div>
                </div>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="text-center py-12 px-4">
            {transactionsLoading ? (
              <div className="flex flex-col items-center gap-3">
                <RefreshCw className="animate-spin text-blue-600 dark:text-blue-400" size={28} />
                <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">Loading transactions...</p>
              </div>
            ) : (
              <EmptyActivityState />
            )}
          </div>
        )}
      </div>

      {/* Pagination Controls */}
      {mergedTransactions.length > transactionsPerPage && (
        <div className="flex items-center justify-center gap-3 mt-8 pb-6">
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="w-10 h-10 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-bold text-lg disabled:opacity-30 disabled:cursor-not-allowed hover:bg-blue-50 dark:hover:bg-gray-700 hover:border-blue-300 dark:hover:border-blue-600 transition-all duration-200 flex items-center justify-center"
            aria-label="Previous page"
          >
            ‹
          </button>
          <div className="px-4 py-2 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              Page <span className="text-blue-600 dark:text-blue-400">{currentPage}</span> of {totalPages}
            </span>
          </div>
          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="w-10 h-10 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-bold text-lg disabled:opacity-30 disabled:cursor-not-allowed hover:bg-blue-50 dark:hover:bg-gray-700 hover:border-blue-300 dark:hover:border-blue-600 transition-all duration-200 flex items-center justify-center"
            aria-label="Next page"
          >
            ›
          </button>
        </div>
      )}
    </div >
  );
};

export default Transactions;
