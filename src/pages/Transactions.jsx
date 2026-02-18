import { useState, useEffect, useMemo, useRef, memo } from 'react';
import { useTranslation } from 'react-i18next';
import { useWallet } from '../contexts/WalletContext';
import { Copy, ExternalLink, CheckCircle2, Check, Clock, XCircle, X, ArrowLeftRight, RefreshCw, Layers, History, ChevronLeft, ChevronRight, ChevronDown, Search, SlidersHorizontal, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { timeAgo, formatAddress, copyToClipboard, getExplorerUrl } from '../utils/blockchain';
import { useTransactionHistory } from '../hooks/useTransactionHistory';
import { getItem, setItem } from '../utils/indexedDB';
import { NETWORKS } from '../config/networks';
import { useTotalVolume } from '../hooks/useTotalVolume';
import { useTotalBridgeVolume } from '../hooks/useTotalBridgeVolume';
import { useDappTransactionCount } from '../hooks/useDappTransactionCount';
import '../styles/transactions-styles.css';

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

  if (name.includes('arc')) return '/icons/arc.png';
  if (name.includes('base')) return '/icons/base.png';
  if (name.includes('sepolia') || name.includes('eth')) return '/icons/eth.png';

  return null;
};

// Helper to get token logo
const getTokenLogo = (symbol) => {
  if (!symbol) return null;
  const s = String(symbol).toUpperCase();
  if (s.includes('USDC')) return '/icons/usdc.png';
  if (s.includes('STC') || s.includes('STAC')) return '/icons/stc.png';
  if (s.includes('BALL')) return '/icons/ball.png';
  if (s.includes('MTB')) return '/icons/mtb.png';
  if (s.includes('ECR')) return '/icons/ecr.png';
  if (s.includes('ETH')) return '/icons/eth.png';
  if (s.includes('EURC')) return '/icons/eurc.png';
  return null;
};

const EmptyActivityState = () => {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col items-center justify-center py-16 md:py-24 px-6 overflow-hidden text-center">
      <div className="relative mb-14 md:mb-16 flex items-center justify-center scale-90 md:scale-100">
        <div className="absolute w-44 h-44 rounded-full border border-slate-200/60 dark:border-slate-700/40 animate-pulse" />
        <div className="absolute w-32 h-32 rounded-full border border-slate-300/40 dark:border-slate-600/25" />
        <div className="relative z-10 w-20 h-20 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center border border-slate-200/80 dark:border-slate-700/50 shadow-lg transition-all duration-300">
          <History size={36} className="text-slate-500 dark:text-slate-400" strokeWidth={1.5} />
        </div>
      </div>
      <div className="max-w-[280px] md:max-w-md mx-auto">
        <p className="text-slate-500 dark:text-slate-400 text-sm md:text-base font-semibold tracking-tight leading-relaxed transition-colors duration-300">
          {t('This account has no recent activity...')}
        </p>
      </div>
    </div>
  );
};

const SkeletonCard = () => (
  <div className="relative overflow-hidden rounded-2xl bg-white/50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 p-4 min-w-[180px]">
    <div className="skeleton w-24 h-3 mb-3 rounded-full opacity-50" />
    <div className="skeleton w-32 h-8 mb-2 rounded-lg" />
    <div className="skeleton w-20 h-3 rounded-full opacity-30" />
  </div>
);

const SkeletonRow = () => (
  <tr className="border-b border-slate-50 dark:border-white/[0.02]">
    <td className="p-4"><div className="skeleton w-24 h-5 rounded-lg" /></td>
    <td className="p-4"><div className="skeleton w-32 h-5 rounded-lg" /></td>
    <td className="p-4"><div className="skeleton w-32 h-5 rounded-lg" /></td>
    <td className="p-4"><div className="skeleton w-20 h-5 rounded-lg" /></td>
    <td className="p-4"><div className="skeleton w-16 h-4 rounded-lg" /></td>
    <td className="p-4"><div className="skeleton w-16 h-5 rounded-full" /></td>
    <td className="p-4"><div className="skeleton w-40 h-4 rounded-lg" /></td>
  </tr>
);

const SkeletonMobileCard = () => (
  <div className="card p-4 space-y-4 border border-slate-100 dark:border-slate-800">
    <div className="flex justify-between">
      <div className="skeleton w-20 h-4 rounded-lg" />
      <div className="skeleton w-16 h-3 rounded-lg" />
    </div>
    <div className="flex justify-center">
      <div className="skeleton w-24 h-7 rounded-full" />
    </div>
    <div className="flex gap-3 justify-between">
      <div className="flex-1 min-w-0">
        <div className="skeleton w-12 h-3 mb-2 rounded-full opacity-40" />
        <div className="skeleton w-full h-8 rounded-xl" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="skeleton w-12 h-3 mb-2 rounded-full opacity-40" />
        <div className="skeleton w-full h-8 rounded-xl" />
      </div>
    </div>
  </div>
);

const Transactions = () => {
  const { t } = useTranslation();
  const { isConnected, walletAddress, chainId } = useWallet();
  const [copiedHash, setCopiedHash] = useState(null);
  const prevWalletRef = useRef(null);

  // Fetch real-time transactions from blockchain (auto-updates every 30 seconds)
  const { transactions: blockchainTransactions, loading: transactionsLoading } = useTransactionHistory();

  // Activity data - stored in IndexedDB for persistence (web3-native)
  const [myTransactions, setMyTransactions] = useState([]);
  const [activeActivityTab, setActiveActivityTab] = useState('my'); // 'my' or 'all'

  // Automatically switch to 'all' tab if wallet is disconnected
  useEffect(() => {
    if (!isConnected && activeActivityTab === 'my') {
      setActiveActivityTab('all');
    }
  }, [isConnected, activeActivityTab]);

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'success', 'pending', 'failed'
  const [dateRangeFilter, setDateRangeFilter] = useState('all'); // 'all', '24h', '7d', '30d'
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showDateDropdown, setShowDateDropdown] = useState(false);

  // Global dapp stats for All Activity tab
  const { transactionCount, loading: txCountLoading } = useDappTransactionCount();

  // Stats for the cards - pass wallet address when on "My Activity" tab for per-wallet volumes
  const walletFilterForVolume = activeActivityTab === 'my' && walletAddress ? walletAddress : null;
  const { totalVolume: swapVolume, loading: swapVolumeLoading } = useTotalVolume(walletFilterForVolume);
  const { totalVolume: bridgeVolume, loading: bridgeVolumeLoading } = useTotalBridgeVolume(walletFilterForVolume);

  // Calculate swap count for the volume card
  const swapCount = useMemo(() => {
    const txs = activeActivityTab === 'my' ? myTransactions : blockchainTransactions;
    if (!txs || !Array.isArray(txs)) return 0;
    return txs.filter(tx => tx.type === 'Swap' && tx.status === 'success').length;
  }, [activeActivityTab, myTransactions, blockchainTransactions]);

  // Helper: Backup transactions to sessionStorage for recovery
  const backupToSessionStorage = (address, transactions) => {
    try {
      if (address && transactions && transactions.length > 0) {
        const key = `stac_tx_backup_${address.toLowerCase()}`;
        sessionStorage.setItem(key, JSON.stringify(transactions));
      }
    } catch {
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
    } catch {
      return null;
    }
    return null;
  };

  // Load transactions from IndexedDB on mount and when wallet address changes
  useEffect(() => {
    const loadTransactions = async () => {
      try {
        prevWalletRef.current = walletAddress;

        // Load ALL transactions from IndexedDB (shared across wallets for "All Activity")
        const allSaved = await getItem('myTransactions');

        if (allSaved && Array.isArray(allSaved)) {
          setMyTransactions(allSaved);

          if (walletAddress) {
            const walletAddressLower = walletAddress.toLowerCase();
            const walletOnly = allSaved.filter(tx => tx.address?.toLowerCase() === walletAddressLower);
            backupToSessionStorage(walletAddress, walletOnly);
          }
        } else {
          // No data in IndexedDB, try sessionStorage recovery if wallet is connected
          if (walletAddress) {
            const recovered = recoverFromSessionStorage(walletAddress);
            if (recovered && recovered.length > 0) {
              setMyTransactions(recovered);
              await setItem('myTransactions', recovered);
            } else {
              setMyTransactions([]);
            }
          } else {
            setMyTransactions([]);
          }
        }
      } catch (err) {
        console.error('Error loading transactions:', err);
        setMyTransactions([]);
      }
    };

    loadTransactions();
  }, [walletAddress]); // Reload when wallet address changes

  // Merge blockchain transactions with IndexedDB transactions
  // PRIORITY: IndexedDB transactions have accurate from/to chains (user-selected)
  // Blockchain transactions are fallback when no user-saved data exists
  const mergedTransactions = useMemo(() => {
    // Basic wallet filter
    const walletAddressLower = walletAddress?.toLowerCase();

    // 1. Get filtered blockchain transactions (if My Activity, only user's; if All, all of them)
    // For now, blockchainTransactions usually returns the latest block's activity anyway
    const filteredBlockchain = blockchainTransactions.filter(tx => {
      if (activeActivityTab === 'my') {
        if (!walletAddressLower) return false;
        if (tx.from && tx.from.toLowerCase() === walletAddressLower) return true;
        if (tx.to && tx.to.toLowerCase() === walletAddressLower) return true;
        if (tx.address && tx.address.toLowerCase() === walletAddressLower) return true;
        return false;
      }
      return true; // Show all for "All Activity"
    });

    // 2. Load all local transactions from IndexedDB state (filtered by tab)
    const filteredLocal = myTransactions.filter(tx => {
      // Basic cleanup for blockchain-fetched bridge transactions
      if (tx.type === 'Bridge' && tx.isOutgoing !== undefined) {
        return false;
      }

      if (activeActivityTab === 'my') {
        if (!walletAddressLower) return false;
        return tx.address?.toLowerCase() === walletAddressLower;
      }
      return true; // Show all for "All Activity"
    });

    // Build set of local transaction hashes for deduplication
    const localSet = new Set(filteredLocal.map(tx => tx.hash));

    // 3. Add blockchain transactions that don't exist in local storage
    const blockchainOnly = filteredBlockchain.filter(tx => {
      // Deduplicate against local storage
      if (localSet.has(tx.hash)) return false;

      // We allow Bridge/Transfer transactions from the blockchain as a fallback
      // useTransactionHistory already attempts to format them correctly
      return true;
    });

    // Combine: local first (accurate user data), then blockchain-only
    const merged = [...filteredLocal, ...blockchainOnly].sort((a, b) => {
      const timeA = a.timestamp || 0;
      const timeB = b.timestamp || 0;
      return timeB - timeA;
    });

    return merged;
  }, [blockchainTransactions, myTransactions, walletAddress, activeActivityTab]);

  // Apply filters (search, status, date range) to merged transactions
  const filteredTransactions = useMemo(() => {
    let filtered = [...mergedTransactions];

    // Search filter - match hash, tokens, type, amount, or wallet address
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(tx => {
        // Match transaction hash
        if (tx.hash && tx.hash.toLowerCase().includes(query)) return true;
        // Match from field (token or chain)
        if (tx.from && String(tx.from).toLowerCase().includes(query)) return true;
        // Match to field (token or chain)
        if (tx.to && String(tx.to).toLowerCase().includes(query)) return true;
        // Match type
        if (tx.type && tx.type.toLowerCase().includes(query)) return true;
        // Match amount
        if (tx.amount && String(tx.amount).toLowerCase().includes(query)) return true;
        // Match wallet address (useful for All Activity tab)
        if (tx.address && tx.address.toLowerCase().includes(query)) return true;
        return false;
      });
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(tx => tx.status === statusFilter);
    }

    // Date range filter
    if (dateRangeFilter !== 'all') {
      const now = Date.now();
      let cutoff = 0;

      switch (dateRangeFilter) {
        case '24h':
          cutoff = now - (24 * 60 * 60 * 1000); // 24 hours
          break;
        case '7d':
          cutoff = now - (7 * 24 * 60 * 60 * 1000); // 7 days
          break;
        case '30d':
          cutoff = now - (30 * 24 * 60 * 60 * 1000); // 30 days
          break;
        default:
          cutoff = 0;
      }

      if (cutoff > 0) {
        filtered = filtered.filter(tx => {
          const txTime = tx.timestamp || 0;
          return txTime >= cutoff;
        });
      }
    }

    return filtered;
  }, [mergedTransactions, searchQuery, statusFilter, dateRangeFilter]);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const transactionsPerPage = 10;

  // Calculate pagination based on filtered transactions
  const totalPages = Math.ceil(filteredTransactions.length / transactionsPerPage);
  const startIndex = (currentPage - 1) * transactionsPerPage;
  const endIndex = startIndex + transactionsPerPage;
  const paginatedTransactions = filteredTransactions.slice(startIndex, endIndex);

  // Reset to page 1 when wallet or filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [walletAddress, searchQuery, statusFilter, dateRangeFilter]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showStatusDropdown || showDateDropdown) {
        const target = event.target;
        // Specifically allow hamburger menu button to trigger its own events without dropdown interference
        if (!target.closest('.relative') || target.closest('button[aria-label]')) {
          setShowStatusDropdown(false);
          setShowDateDropdown(false);
        }
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showStatusDropdown, showDateDropdown]);

  // Note: We don't save filtered transactions back to IndexedDB
  // The original transactions with all wallet addresses are kept in storage
  // We only filter when displaying. This preserves data for all wallets.

  // Listen for new transactions from other pages (Bridge, Swap, etc.)
  useEffect(() => {
    const handleTransactionSaved = async () => {
      console.log('🔄 Transaction saved event received, reloading all local activity...');
      try {
        const saved = await getItem('myTransactions');
        if (saved && Array.isArray(saved)) {
          setMyTransactions(saved);
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
  }, []); // Reload on event

  const handleCopyHash = async (hash) => {
    const success = await copyToClipboard(hash);
    if (success) {
      setCopiedHash(hash);
      setTimeout(() => {
        setCopiedHash(null);
      }, 2500);
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

    // If it's already just a number (no arrow, no letters), parse and round
    const cleanNumber = parseFloat(amountStr);
    if (!isNaN(cleanNumber) && !amountStr.includes('→') && !/[a-zA-Z]/.test(amountStr)) {
      return cleanNumber.toFixed(2);
    }

    // If it contains an arrow, extract the first number before the arrow
    if (amountStr.includes('→')) {
      // Format: "1 EURC → 1.096700 USDC" - extract first number
      const parts = amountStr.split('→');
      const firstPart = parts[0].trim();
      const numberMatch = firstPart.match(/^([\d.]+)/);
      if (numberMatch && numberMatch[1]) {
        return parseFloat(numberMatch[1]).toFixed(2);
      }
    }

    // Otherwise, extract the first number from the string
    // Format: "1 EURC" or "1.096700 USDC" - extract number
    const numberMatch = amountStr.match(/^([\d.]+)/);
    if (numberMatch && numberMatch[1]) {
      return parseFloat(numberMatch[1]).toFixed(2);
    }

    return amountStr;
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

    // Round to 2 decimal places for clean display
    const num = parseFloat(rawAmount);
    return num.toFixed(2);
  };

  return (
    <div className="transactions-container font-['Inter','Satoshi','General_Sans',sans-serif]">
      {/* Header Section */}
      <div className="transactions-header">
        <div className="transactions-title-section">
          <div className="flex flex-col mb-4">
            <h1 className="!mb-0 text-emerald-600 dark:text-emerald-500">{t('Transactions')}</h1>
            <span className="text-sm font-medium text-blue-500 dark:text-blue-400 mt-1">
              {activeActivityTab === 'all'
                ? (txCountLoading ? '...' : `${transactionCount?.toLocaleString() || '0'} ${t('total transactions')}`)
                : (isConnected ? `${mergedTransactions.length.toLocaleString()} ${t('total transactions')}` : `0 ${t('total transactions')}`)
              }
            </span>
          </div>

          {/* Tab Selector */}
          <div className="activity-tabs">
            {['my', 'all']
              .filter(tab => tab === 'all' || isConnected)
              .map((tab) => (
                <button
                  key={tab}
                  className={`activity-tab ${activeActivityTab === tab ? 'active' : ''}`}
                  onClick={() => setActiveActivityTab(tab)}
                >
                  {activeActivityTab === tab && (
                    <motion.div
                      layoutId="activeTabPill"
                      className="absolute inset-0 bg-slate-900 dark:bg-white rounded-[10px] shadow-sm"
                      transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                  <span className={`relative z-10 ${activeActivityTab === tab ? 'text-white dark:text-black' : 'text-slate-500 dark:text-slate-400'}`}>
                    {tab === 'my' ? t('My Transactions') : t('All Transactions')}
                  </span>
                </button>
              ))}
          </div>
        </div>

        {/* Stats Cards Row - Only visible on My Activity tab */}
        {activeActivityTab === 'my' && (
          <div className="stats-grid">
            {swapVolumeLoading ? <SkeletonCard /> : (
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-violet-50 via-purple-50 to-fuchsia-50 dark:from-violet-900/30 dark:via-purple-900/20 dark:to-fuchsia-900/20 border border-violet-100/50 dark:border-violet-700/30 p-4 min-w-[180px] shadow-sm hover:shadow-md transition-all duration-300">
                <svg className="absolute right-2 bottom-2 w-16 h-10 opacity-40" viewBox="0 0 60 30" fill="none">
                  <path d="M0 25 Q10 20 15 22 T30 15 T45 18 T60 8" stroke="url(#swapGradient)" strokeWidth="2" fill="none" strokeLinecap="round" />
                  <defs>
                    <linearGradient id="swapGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#8b5cf6" />
                      <stop offset="100%" stopColor="#06b6d4" />
                    </linearGradient>
                  </defs>
                </svg>

                <div className="relative z-10">
                  <span className="text-[11px] font-medium uppercase tracking-wider text-violet-600 dark:text-violet-400">{activeActivityTab === 'my' ? t('My Swap Volume') : t('Total Swap Volume')}</span>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-2xl font-semibold text-slate-800 dark:text-white">
                      {`$${(activeActivityTab === 'my' && !isConnected) ? '0' : swapVolume.toLocaleString()}`}
                    </span>
                    <span className="text-emerald-500 text-lg">↑</span>
                  </div>
                  <div className="text-xs font-medium text-emerald-500 mt-0.5">
                    {swapCount} {swapCount === 1 ? t('swap completed') : t('swaps completed')}
                  </div>
                </div>
              </div>
            )}

            {bridgeVolumeLoading ? <SkeletonCard /> : (
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-800/50 dark:via-blue-900/30 dark:to-indigo-900/20 border border-blue-100/50 dark:border-blue-700/30 p-4 min-w-[180px] shadow-sm hover:shadow-md transition-all duration-300">
                <div className="absolute right-3 top-1/2 -translate-y-1/2 opacity-30">
                  <Layers className="w-10 h-10 text-indigo-400 dark:text-indigo-500" strokeWidth={1.5} />
                </div>

                <div className="relative z-10">
                  <span className="text-[11px] font-medium uppercase tracking-wider text-indigo-600 dark:text-indigo-400">{activeActivityTab === 'my' ? t('My Bridge Volume') : t('Total Bridge Volume')}</span>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-2xl font-semibold text-slate-800 dark:text-white">
                      {`$${(activeActivityTab === 'my' && !isConnected) ? '0' : bridgeVolume.toLocaleString()}`}
                    </span>
                    <Layers className="w-5 h-5 text-indigo-500" strokeWidth={2} />
                  </div>
                  <div className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                    {t('Across 3 networks')}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Search and Filters Bar */}
      <div className="flex flex-col md:flex-row gap-3 mb-6">
        {/* Search Input */}
        <div className="flex-1 relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={activeActivityTab === 'all' ? t('Search by hash, token, or wallet address...') : t('Search by transaction hash or token symbol...')}
            className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0d0d0d] text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
          />
        </div>

        {/* Filter Buttons */}
        <div className="flex gap-2 flex-wrap">
          {/* Status Dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                setShowStatusDropdown(!showStatusDropdown);
                setShowDateDropdown(false);
              }}
              className="flex items-center gap-2 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0d0d0d] text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-sm font-medium"
            >
              {statusFilter === 'success' && (
                <div className="flex items-center justify-center w-4 h-4 rounded-full bg-emerald-500 shadow-sm mr-1">
                  <Check className="text-white" size={10} strokeWidth={4} />
                </div>
              )}
              {statusFilter === 'pending' && (
                <div className="flex items-center justify-center w-5 h-5 mr-1">
                  <Clock className="text-amber-500" size={16} strokeWidth={3} />
                </div>
              )}
              {statusFilter === 'failed' && (
                <div className="flex items-center justify-center w-5 h-5 mr-1">
                  <X className="text-red-500" size={16} strokeWidth={3} />
                </div>
              )}
              {statusFilter === 'all' && <SlidersHorizontal size={16} />}
              <span>
                {statusFilter === 'all' ? t('Status') : statusFilter === 'success' ? t('Success') : statusFilter === 'pending' ? t('Pending') : t('Failed')}
              </span>
              <ChevronDown size={14} className={`transition-transform ${showStatusDropdown ? 'rotate-180' : ''} opacity-50`} />
            </button>
            <AnimatePresence>
              {showStatusDropdown && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="absolute top-full mt-2 right-0 md:left-auto left-0 w-full md:w-44 bg-white dark:bg-black border border-slate-200 dark:border-gray-800 rounded-xl shadow-xl z-50 overflow-hidden backdrop-blur-xl"
                >
                  {[
                    { value: 'all', label: t('All Status'), icon: null },
                    {
                      value: 'success', label: t('Success'), icon: (
                        <div className="flex items-center justify-center w-4 h-4 rounded-full bg-emerald-500 shadow-sm">
                          <Check className="text-white" size={10} strokeWidth={4} />
                        </div>
                      )
                    },
                    {
                      value: 'pending', label: t('Pending'), icon: (
                        <div className="flex items-center justify-center w-5 h-5">
                          <Clock className="text-amber-500" size={16} strokeWidth={3} />
                        </div>
                      )
                    },
                    {
                      value: 'failed', label: t('Failed'), icon: (
                        <div className="flex items-center justify-center w-5 h-5">
                          <X className="text-red-500" size={16} strokeWidth={3} />
                        </div>
                      )
                    }
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => {
                        setStatusFilter(option.value);
                        setShowStatusDropdown(false);
                      }}
                      className={`w-full px-4 py-3 text-left text-sm font-medium transition-colors flex items-center gap-3 ${statusFilter === option.value
                        ? 'text-blue-600 dark:text-blue-400'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-gray-800/50'
                        }`}
                    >
                      {option.icon}
                      {option.label}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Date Range Dropdown */}
          <div className="relative">
            <button
              onClick={() => {
                setShowDateDropdown(!showDateDropdown);
                setShowStatusDropdown(false);
              }}
              className={`flex items-center gap-2 px-4 py-3 rounded-xl border transition-colors text-sm font-medium ${dateRangeFilter !== 'all'
                ? 'bg-purple-50 dark:bg-purple-900/30 border-purple-200 dark:border-purple-700 text-purple-700 dark:text-purple-400'
                : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0d0d0d] text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
            >
              <Calendar size={16} />
              <span>{dateRangeFilter === 'all' ? t('Date Range') : dateRangeFilter === '24h' ? t('Last 24h') : dateRangeFilter === '7d' ? t('Last 7 Days') : t('Last 30 Days')}</span>
              <ChevronDown size={14} className={`transition-transform ${showDateDropdown ? 'rotate-180' : ''} opacity-50`} />
            </button>
            <AnimatePresence>
              {showDateDropdown && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="absolute top-full mt-2 right-0 md:left-auto left-0 w-full md:w-40 bg-white dark:bg-black border border-slate-200 dark:border-gray-800 rounded-xl shadow-xl z-50 overflow-hidden backdrop-blur-xl"
                >
                  {[
                    { value: 'all', label: t('All Time') },
                    { value: '24h', label: t('Last 24h') },
                    { value: '7d', label: t('Last 7 Days') },
                    { value: '30d', label: t('Last 30 Days') }
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => {
                        setDateRangeFilter(option.value);
                        setShowDateDropdown(false);
                      }}
                      className={`w-full px-4 py-3 text-left text-sm font-medium transition-colors ${dateRangeFilter === option.value
                        ? 'bg-purple-50 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-gray-800/50'
                        }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Transactions Table - Premium Desktop View */}
      <div className="hidden md:block">
        {transactionsLoading ? (
          <div className="transactions-table-container">
            <table className="tx-table">
              <thead>
                <tr>
                  <th>{t('Type')}</th>
                  <th>{t('From')}</th>
                  <th>{t('To')}</th>
                  <th>{t('Amount')}</th>
                  <th>{t('Time')}</th>
                  <th>{t('Status')}</th>
                  <th>{t('Transaction Hash')}</th>
                </tr>
              </thead>
              <tbody>
                {[...Array(5)].map((_, i) => <SkeletonRow key={i} />)}
              </tbody>
            </table>
          </div>
        ) : filteredTransactions.length > 0 ? (
          <div className="transactions-table-container">
            <table className="tx-table">
              <thead>
                <tr>
                  <th>{t('Type')}</th>
                  <th>{t('From')}</th>
                  <th>{t('To')}</th>
                  <th>{t('Amount')}</th>
                  <th>{t('Time')}</th>
                  <th>{t('Status')}</th>
                  <th>{t('Transaction Hash')}</th>
                </tr>
              </thead>
              <tbody>
                {paginatedTransactions.map((tx, index) => (
                  <motion.tr
                    key={tx.id || tx.hash || `tx-${index}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                  >
                    <td>
                      <div className="type-cell">
                        <span className="type-label">{tx.type}</span>
                        {tx.type === 'Bridge' ? (
                          <span className="type-badge bridge">{t('Cross-Chain')}</span>
                        ) : tx.type === 'Swap' && getNetworkName(tx.chainId) ? (
                          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200/50 dark:border-slate-700/50 w-fit">
                            <div className={`w-3 h-3 ${getNetworkName(tx.chainId)?.toLowerCase().includes('base') ? 'base-sepolia-icon-representation' : 'rounded-full overflow-hidden'}`}>
                              <img src={getChainIcon(getNetworkName(tx.chainId))} alt="" className="w-full h-full object-contain" />
                            </div>
                            <span className="text-[10px] text-slate-600 dark:text-slate-400 font-medium uppercase tracking-wider">
                              {getNetworkName(tx.chainId)}
                            </span>
                          </div>
                        ) : null}
                      </div>
                    </td>

                    <td>
                      <div className="entity-cell">
                        {tx.type === 'Bridge' ? (
                          <>
                            <div className={`w-6 h-6 ${tx.from?.toLowerCase().includes('base') ? 'base-sepolia-icon-representation' : 'rounded-full overflow-hidden'}`}>
                              <img src={getChainIcon(tx.from) || '/icons/eth.png'} alt="" className="w-full h-full object-cover" />
                            </div>
                            <span className="entity-name">{tx.from}</span>
                          </>
                        ) : (
                          <>
                            <img src={getTokenLogo(getSwapFromToken(tx)) || '/icons/stc.png'} alt="" className="entity-icon" />
                            <span className="entity-name uppercase">{getSwapFromToken(tx)}</span>
                          </>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="entity-cell">
                        {tx.type === 'Bridge' ? (
                          <>
                            <div className={`w-6 h-6 ${tx.to?.toLowerCase().includes('base') ? 'base-sepolia-icon-representation' : 'rounded-full overflow-hidden'}`}>
                              <img src={getChainIcon(tx.to) || '/icons/eth.png'} alt="" className="w-full h-full object-cover" />
                            </div>
                            <span className="entity-name">{tx.to}</span>
                          </>
                        ) : (
                          <>
                            <img src={getTokenLogo(getSwapToToken(tx)) || '/icons/stc.png'} alt="" className="entity-icon" />
                            <span className="entity-name uppercase">{getSwapToToken(tx)}</span>
                          </>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="amount-cell">
                        {getSwapAmount(tx)}
                      </div>
                    </td>
                    <td>
                      <div className="text-slate-500 font-medium whitespace-nowrap">
                        {timeAgo(tx.timestamp)}
                      </div>
                    </td>
                    <td>
                      {tx.status === 'success' ? (
                        <div className="inline-flex items-center gap-2">
                          <CheckCircle2 className="text-emerald-500" size={16} />
                          <span className="text-sm font-medium text-emerald-500 dark:text-emerald-400">{t('Success')}</span>
                        </div>
                      ) : tx.status === 'pending' ? (
                        <div className="inline-flex items-center gap-2">
                          <Clock className="text-amber-500" size={16} />
                          <span className="text-sm font-medium text-amber-500 dark:text-amber-400">{t('Pending')}</span>
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-2">
                          <XCircle className="text-red-500" size={16} />
                          <span className="text-sm font-medium text-red-500 dark:text-red-400">{t('Failed')}</span>
                        </div>
                      )}
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleCopyHash(tx.hash)}
                          className="hash-link relative"
                        >
                          <span>{formatAddress(tx.hash)}</span>
                          <Copy size={14} className="opacity-40" />
                          <AnimatePresence>
                            {copiedHash === tx.hash && (
                              <motion.span
                                initial={{ opacity: 0, y: 5, scale: 0.9 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 5, scale: 0.9 }}
                                className="absolute -top-11 left-1/2 -translate-x-1/2 bg-slate-950 text-white text-[10px] px-2.5 py-1.5 rounded-lg font-bold shadow-xl border border-white/10 whitespace-nowrap z-50 capitalize"
                              >
                                {t('copied')}
                              </motion.span>
                            )}
                          </AnimatePresence>
                        </button>
                        <a
                          href={getExplorerUrl(tx.hash, tx.chainId || chainId || 11155111)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-blue-500 transition-colors"
                        >
                          <ExternalLink size={14} />
                        </a>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>

            <div className="table-footer">
              <div className="pagination-info">
                {t('Showing')} {startIndex + 1}-{Math.min(endIndex, filteredTransactions.length)} {t('of')} {filteredTransactions.length} {t('transactions')}
              </div>
              <div className="pagination-controls">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="pagination-btn"
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="pagination-btn"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="card text-center py-20">
            {transactionsLoading ? (
              <div className="flex flex-col items-center gap-3">
                <RefreshCw className="animate-spin text-blue-500" size={32} />
                <p className="text-slate-500 font-medium">{t('Loading transactions...')}</p>
              </div>
            ) : (
              <EmptyActivityState />
            )}
          </div>
        )}
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-4">
        {transactionsLoading ? (
          <div className="space-y-4 px-4">
            {[...Array(3)].map((_, i) => <SkeletonMobileCard key={i} />)}
          </div>
        ) : filteredTransactions.length > 0 ? (
          paginatedTransactions.map((tx, index) => (
            <motion.div
              key={tx.id || tx.hash || `tx-${index}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`card p-4 space-y-3.5 touch-manipulation ${tx.type === 'Swap'
                ? 'border border-blue-100/80 dark:border-blue-900/40 bg-gradient-to-b from-white to-blue-50/40 dark:from-gray-900 dark:to-blue-950/15'
                : 'border border-slate-100 dark:border-slate-800'
                }`}
            >
              {/* Header Row - Type and Time */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex flex-col gap-1.5">
                  <span className="text-sm font-semibold text-slate-900 dark:text-white uppercase tracking-wider">{tx.type}</span>
                  {tx.type === 'Swap' && getNetworkName(tx.chainId) && (
                    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 w-fit">
                      <img src={getChainIcon(getNetworkName(tx.chainId))} alt="" className="w-3 h-3 object-contain" />
                      <span className="text-[10px] font-medium uppercase tracking-wider">
                        {getNetworkName(tx.chainId)}
                      </span>
                    </div>
                  )}
                  {tx.type === 'Bridge' && (
                    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 w-fit">
                      <ArrowLeftRight size={10} />
                      <span className="text-[10px] font-medium uppercase tracking-wider">{t('Cross-Chain')}</span>
                    </div>
                  )}
                </div>
                <span className="text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap flex-shrink-0 font-medium">{timeAgo(tx.timestamp)}</span>
              </div>

              {/* Centered Status */}
              <div className="flex justify-center py-1">
                {tx.status === 'success' ? (
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20">
                    <CheckCircle2 className="text-emerald-500" size={14} />
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">{t('Success')}</span>
                  </div>
                ) : tx.status === 'pending' ? (
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/20">
                    <Clock className="text-amber-500" size={14} />
                    <span className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wide">{t('Pending')}</span>
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20">
                    <XCircle className="text-red-500" size={14} />
                    <span className="text-xs font-bold text-red-600 dark:text-red-400 uppercase tracking-wide">{t('Failed')}</span>
                  </div>
                )}
              </div>

              {/* From/To (You Pay/You Receive) Row - Unified for Swap and Bridge */}
              <div className="flex items-center gap-3 py-1 bg-slate-50/50 dark:bg-white/5 rounded-2xl px-3 border border-slate-100/50 dark:border-white/5">
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] font-medium text-slate-400 dark:text-slate-500 mb-1 uppercase tracking-wider">
                    {tx.type === 'Swap' ? t('You Pay') : t('From')}
                  </div>
                  <div className="flex items-center gap-2 min-w-0">
                    {tx.type === 'Bridge' ? (
                      <>
                        <img src={getChainIcon(tx.from) || '/icons/eth.png'} alt="" className="w-5 h-5 rounded-full object-cover" />
                        <span className="text-sm font-semibold text-slate-800 dark:text-white truncate">{tx.from}</span>
                      </>
                    ) : (
                      <>
                        <img src={getTokenLogo(getSwapFromToken(tx)) || '/icons/stc.png'} alt="" className="w-5 h-5 rounded-full object-cover" />
                        <span className="text-sm font-semibold text-slate-800 dark:text-white truncate uppercase">{getSwapFromToken(tx)}</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex flex-col items-center justify-center gap-1 px-1">
                  <div className="w-8 h-[2px] bg-slate-200 dark:bg-slate-700 rounded-full" />
                  <ArrowLeftRight size={14} className="text-blue-500 dark:text-blue-400" />
                  <div className="w-8 h-[2px] bg-slate-200 dark:bg-slate-700 rounded-full" />
                </div>

                <div className="flex-1 min-w-0 text-right">
                  <div className="text-[10px] font-medium text-slate-400 dark:text-slate-500 mb-1 uppercase tracking-wider">
                    {tx.type === 'Swap' ? t('You Receive') : t('To')}
                  </div>
                  <div className="flex items-center justify-end gap-2 min-w-0">
                    {tx.type === 'Bridge' ? (
                      <>
                        <img src={getChainIcon(tx.to) || '/icons/eth.png'} alt="" className="w-5 h-5 rounded-full object-cover" />
                        <span className="text-sm font-semibold text-slate-800 dark:text-white truncate">{tx.to}</span>
                      </>
                    ) : (
                      <>
                        <img src={getTokenLogo(getSwapToToken(tx)) || '/icons/stc.png'} alt="" className="w-5 h-5 rounded-full object-cover drop-shadow-[0_4px_8px_rgba(59,130,246,0.25)]" />
                        <span className="text-sm font-semibold text-slate-800 dark:text-white truncate uppercase">{getSwapToToken(tx)}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Amount Row - Unified */}
              <div className="flex items-center justify-between py-2.5 bg-slate-900/[0.03] dark:bg-white/[0.03] rounded-xl px-4 border border-slate-900/[0.05] dark:border-white/[0.05] shadow-inner group/amount transition-all duration-300">
                <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-slate-500 dark:text-slate-400">{t('Amount')}</span>
                <div className="flex items-center gap-2 group-hover/amount:scale-[1.02] transition-transform duration-300">
                  <span className="text-base font-semibold text-slate-900 dark:text-white tabular-nums tracking-tight">
                    {tx.type === 'Swap' ? (getSwapToAmount(tx) || getSwapAmount(tx)) : getSwapAmount(tx)}
                  </span>
                  {tx.type === 'Swap' ? (
                    // Swap Amount: Just the number, No icon or symbol as requested
                    null
                  ) : (
                    <>
                      {/* Bridge dynamic token display - Default to USDC if no symbol found in amount */}
                      <img src={getTokenLogo(tx.amount?.includes(' ') ? tx.amount.split(' ')[1] : 'USDC') || '/icons/usdc.png'} alt="" className="w-5 h-5 rounded-full drop-shadow-[0_4px_8px_rgba(59,130,246,0.25)]" />
                      <span className="text-sm font-semibold text-slate-900 dark:text-white uppercase tracking-tight">
                        {tx.amount?.includes(' ') ? tx.amount.split(' ')[1] : 'USDC'}
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Transaction Hash - Improved layout */}
              <div className="pt-2.5 border-t border-gray-200 dark:border-gray-700">
                <div className="flex flex-col gap-2">
                  <span className="text-xs font-medium text-gray-600 dark:text-gray-400">{t('Transaction Hash')}</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleCopyHash(tx.hash)}
                      className="flex-1 font-mono text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center justify-between gap-2 touch-manipulation min-h-[44px] px-3 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg active:bg-blue-100 dark:active:bg-blue-900/30 transition-colors relative"
                    >
                      <span className="truncate">{formatAddress(tx.hash)}</span>
                      <Copy size={16} className="flex-shrink-0 opacity-60" />
                      <AnimatePresence>
                        {copiedHash === tx.hash && (
                          <motion.span
                            initial={{ opacity: 0, y: 5, scale: 0.9 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 5, scale: 0.9 }}
                            className="absolute -top-11 left-1/2 -translate-x-1/2 bg-slate-950 text-white text-[10px] px-2.5 py-1.5 rounded-lg font-bold shadow-xl border border-white/10 whitespace-nowrap z-50 capitalize"
                          >
                            {t('copied')}
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </button>
                    <a
                      href={getExplorerUrl(tx.hash, tx.chainId || chainId || 11155111)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 touch-manipulation min-h-[44px] min-w-[44px] flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg active:bg-gray-200 dark:active:bg-gray-700 transition-colors"
                    >
                      <ExternalLink size={18} />
                    </a>
                  </div>
                </div>
              </div>
            </motion.div>
          ))
        ) : (
          <EmptyActivityState />
        )}
      </div>

      {/* Mobile-only pagination footer if needed */}
      <div className="md:hidden">
        {mergedTransactions.length > transactionsPerPage && (
          <div className="flex items-center justify-center gap-4 mt-6 pb-10">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="pagination-btn"
            >
              <ChevronLeft size={20} />
            </button>
            <div className="text-sm font-bold text-slate-500">
              {currentPage} / {totalPages}
            </div>
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="pagination-btn"
            >
              <ChevronRight size={20} />
            </button>
          </div>
        )}
      </div>

    </div >
  );
};

export default memo(Transactions);
