import { useState, useEffect, useMemo, useRef, memo } from 'react';
import { useTranslation } from 'react-i18next';
import { useWallet } from '../hooks/useWallet';
import { Copy, ExternalLink, Check, Clock, XCircle, X, ArrowLeftRight, Layers, History, ChevronLeft, ChevronRight, ChevronDown, Search, SlidersHorizontal, Calendar, TrendingUp } from 'lucide-react';
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
  if (chainIdNum === NETWORKS.ARC_TESTNET.id || chainId === NETWORKS.ARC_TESTNET.chainId) {
    return 'Arc Testnet';
  } else if (chainIdNum === NETWORKS.ETHEREUM_SEPOLIA.id || chainId === NETWORKS.ETHEREUM_SEPOLIA.chainId) {
    return 'Sepolia';
  } else if (chainIdNum === NETWORKS.BASE_SEPOLIA.id || chainId === NETWORKS.BASE_SEPOLIA.chainId) {
    return 'Base Sepolia';
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
  <div className="relative overflow-hidden rounded-2xl bg-slate-50/50 dark:bg-white/[0.02] border border-slate-200/60 dark:border-white/10 p-3.5 min-w-[170px]">
    <div className="skeleton w-20 h-2.5 mb-3 rounded-full opacity-50" />
    <div className="skeleton w-28 h-7 mb-2 rounded-lg" />
    <div className="skeleton w-24 h-2.5 rounded-full opacity-30" />
  </div>
);

const SkeletonRow = () => (
  <tr className="border-b border-slate-200/40 dark:border-white/[0.05]">
    <td className="p-[1.25rem]"><div className="skeleton w-24 h-5 rounded-lg" /></td>
    <td className="p-[1.25rem]"><div className="skeleton w-32 h-5 rounded-lg" /></td>
    <td className="p-[1.25rem]"><div className="skeleton w-32 h-5 rounded-lg" /></td>
    <td className="p-[1.25rem]"><div className="skeleton w-20 h-5 rounded-lg" /></td>
    <td className="p-[1.25rem]"><div className="skeleton w-16 h-4 rounded-lg" /></td>
    <td className="p-[1.25rem]">
      <div className="flex items-center gap-2">
        <div className="skeleton w-4 h-4 rounded-full opacity-60" />
        <div className="skeleton w-12 h-4 rounded-md opacity-40" />
      </div>
    </td>
    <td className="p-[1.25rem]"><div className="skeleton w-40 h-4 rounded-lg" /></td>
  </tr>
);

const SkeletonMobileCard = () => (
  <div className="relative overflow-hidden rounded-2xl bg-slate-50/50 dark:bg-white/[0.02] border border-slate-200/60 dark:border-white/10 p-4 space-y-3.5">
    <div className="flex justify-between items-start">
      <div className="space-y-2">
        <div className="skeleton w-20 h-4 rounded-lg" />
        <div className="skeleton w-24 h-3.5 rounded-full opacity-40" />
      </div>
      <div className="skeleton w-16 h-3 rounded-lg opacity-40" />
    </div>
    <div className="flex justify-center">
      <div className="skeleton w-28 h-7 rounded-full opacity-60" />
    </div>
    <div className="flex gap-3 justify-between items-center py-1">
      <div className="flex-1">
        <div className="skeleton w-full h-8 rounded-xl opacity-50" />
      </div>
      <div className="skeleton w-6 h-[2px] rounded-full opacity-20" />
      <div className="flex-1">
        <div className="skeleton w-full h-8 rounded-xl opacity-50" />
      </div>
    </div>
    <div className="pt-2 border-t border-slate-100 dark:border-slate-800/50">
      <div className="skeleton w-full h-9 rounded-lg opacity-30" />
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
              <div className="relative overflow-hidden rounded-2xl bg-slate-50/50 dark:bg-white/[0.02] border border-slate-200/60 dark:border-white/10 p-3.5 min-w-[170px] shadow-sm hover:border-blue-500/30 transition-all duration-300 group">
                <svg className="absolute -right-2 -bottom-2 w-20 h-12 opacity-[0.08] dark:opacity-[0.15] transition-opacity group-hover:opacity-20" viewBox="0 0 60 30" fill="none">
                  <path d="M0 25 Q10 20 15 22 T30 15 T45 18 T60 8" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" className="text-blue-500" />
                </svg>

                <div className="relative z-10">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 opacity-80">{activeActivityTab === 'my' ? t('My Swap Volume') : t('Total Swap Volume')}</span>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="text-xl font-bold text-slate-800 dark:text-white tabular-nums">
                      {`$${(activeActivityTab === 'my' && !isConnected) ? '0' : swapVolume.toLocaleString()}`}
                    </span>
                    <TrendingUp size={14} className="text-emerald-500" />
                  </div>
                  <div className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-500/80 mt-1 flex items-center gap-1">
                    {swapCount} {swapCount === 1 ? t('swap completed') : t('swaps completed')}
                  </div>
                </div>
              </div>
            )}

            {bridgeVolumeLoading ? <SkeletonCard /> : (
              <div className="relative overflow-hidden rounded-2xl bg-slate-50/50 dark:bg-white/[0.02] border border-slate-200/60 dark:border-white/10 p-3.5 min-w-[170px] shadow-sm hover:border-blue-500/30 transition-all duration-300 group">
                <div className="absolute -right-2 -top-1 opacity-[0.06] dark:opacity-[0.1] group-hover:opacity-[0.12] transition-opacity rotate-12">
                  <Layers className="w-16 h-16 text-blue-500" strokeWidth={1} />
                </div>

                <div className="relative z-10">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 opacity-80">{activeActivityTab === 'my' ? t('My Bridge Volume') : t('Total Bridge Volume')}</span>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="text-xl font-bold text-slate-800 dark:text-white tabular-nums">
                      {`$${(activeActivityTab === 'my' && !isConnected) ? '0' : bridgeVolume.toLocaleString()}`}
                    </span>
                    <Layers size={14} className="text-blue-500" strokeWidth={2.5} />
                  </div>
                  <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mt-1">
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
              className="flex items-center justify-between gap-2 px-4 py-3 min-w-[145px] rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0d0d0d] text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-sm font-medium"
            >
              <div className="flex items-center gap-2">
                {statusFilter === 'success' && (
                  <div className="flex items-center justify-center w-4 h-4 rounded-full bg-emerald-500 shadow-sm mr-0.5">
                    <Check className="text-white" size={10} strokeWidth={4} />
                  </div>
                )}
                {statusFilter === 'pending' && (
                  <div className="flex items-center justify-center w-5 h-5 mr-0.5">
                    <Clock className="text-amber-500" size={16} strokeWidth={3} />
                  </div>
                )}
                {statusFilter === 'failed' && (
                  <div className="flex items-center justify-center w-5 h-5 mr-0.5">
                    <X className="text-red-500" size={16} strokeWidth={3} />
                  </div>
                )}
                {statusFilter === 'all' && <SlidersHorizontal size={16} className="mr-0.5" />}
                <span>
                  {statusFilter === 'all' ? t('All Status') : statusFilter === 'success' ? t('Success') : statusFilter === 'pending' ? t('Pending') : t('Failed')}
                </span>
              </div>
              <ChevronDown size={14} className={`transition-transform ${showStatusDropdown ? 'rotate-180' : ''} opacity-50 flex-shrink-0`} />
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
              className={`flex items-center justify-between gap-2 px-4 py-3 min-w-[145px] rounded-xl border transition-colors text-sm font-medium ${dateRangeFilter !== 'all'
                ? 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-700 text-blue-700 dark:text-blue-400'
                : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0d0d0d] text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
            >
              <div className="flex items-center gap-2">
                <Calendar size={16} />
                <span>{dateRangeFilter === 'all' ? t('All Time') : dateRangeFilter === '24h' ? t('Last 24h') : dateRangeFilter === '7d' ? t('Last 7 Days') : t('Last 30 Days')}</span>
              </div>
              <ChevronDown size={14} className={`transition-transform ${showDateDropdown ? 'rotate-180' : ''} opacity-50 flex-shrink-0`} />
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
                        ? 'bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400'
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
        <div className="transactions-table-container flex flex-col">
          {transactionsLoading ? (
            <table className="tx-table">
              <thead>
                <tr>
                  <th>{t('Type')}</th>
                  <th>{t('From')}</th>
                  <th>{t('To')}</th>
                  <th>{t('Amount')}</th>
                  <th>{t('Time')}</th>
                  <th className="w-[92px] min-w-[92px]">{t('Status')}</th>
                  <th>{t('Transaction Hash')}</th>
                </tr>
              </thead>
              <tbody>
                {[...Array(transactionsPerPage)].map((_, i) => <SkeletonRow key={i} />)}
              </tbody>
            </table>
          ) : filteredTransactions.length > 0 ? (
            <>
              <table className="tx-table">
                <thead>
                  <tr>
                    <th>{t('Type')}</th>
                    <th>{t('From')}</th>
                    <th>{t('To')}</th>
                    <th>{t('Amount')}</th>
                    <th>{t('Time')}</th>
                    <th className="w-[92px] min-w-[92px]">{t('Status')}</th>
                    <th>{t('Transaction Hash')}</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedTransactions.map((tx, index) => (
                    <tr key={tx.id || tx.hash || `tx-${index}`} className="group">
                      <td>
                        <div className="type-cell">
                          <span className="type-label">{tx.type}</span>
                          {tx.type === 'Swap' && getNetworkName(tx.chainId) && (
                            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 w-fit">
                              <img src={getChainIcon(getNetworkName(tx.chainId))} alt="" className="w-3 h-3 object-contain" />
                              <span className="text-[10px] font-medium uppercase tracking-wider">
                                {t(getNetworkName(tx.chainId))}
                              </span>
                            </div>
                          )}
                          {tx.type === 'Bridge' && (
                            <span className="type-badge bridge">{t('Cross-Chain')}</span>
                          )}
                        </div>
                      </td>
                      <td>
                        <div className="entity-cell">
                          {tx.type === 'Bridge' ? (
                            (() => {
                              const chainKey = String(tx.from || '').toLowerCase();
                              if (chainKey.includes('arc')) return <div className="entity-icon bg-black shadow-md"><img src="/icons/arc.png" alt="Arc" /></div>;
                              if (chainKey.includes('base')) return <div className="entity-icon bg-white shadow-md"><img src="/icons/base.png" alt="Base" /></div>;
                              if (chainKey.includes('sepolia')) return <div className="entity-icon bg-white shadow-md"><img src="/icons/eth.png" alt="ETH" /></div>;
                              return <div className="entity-icon"><img src={getChainIcon(tx.from) || '/icons/eth.png'} alt="" /></div>;
                            })()
                          ) : (
                            <div className="entity-icon">
                              <img src={getTokenLogo(getSwapFromToken(tx)) || '/icons/stc.png'} alt="" />
                            </div>
                          )}
                          <span className="entity-name uppercase">{tx.type === 'Bridge' ? t(tx.from) : getSwapFromToken(tx)}</span>
                        </div>
                      </td>
                      <td>
                        <div className="entity-cell">
                          {tx.type === 'Bridge' ? (
                            <div className="entity-icon">
                              <img src={getChainIcon(tx.to) || '/icons/eth.png'} alt="" />
                            </div>
                          ) : (
                            <div className="entity-icon">
                              <img src={getTokenLogo(getSwapToToken(tx)) || '/icons/stc.png'} alt="" />
                            </div>
                          )}
                          <span className="entity-name uppercase">{tx.type === 'Bridge' ? t(tx.to) : getSwapToToken(tx)}</span>
                        </div>
                      </td>
                      <td>
                        <div className="amount-cell tabular-nums">
                          {tx.type === 'Swap' ? (getSwapToAmount(tx) || getSwapAmount(tx)) : getSwapAmount(tx)}
                        </div>
                      </td>
                      <td>
                        <span className="text-slate-500 dark:text-slate-400 whitespace-nowrap font-medium">{timeAgo(tx.timestamp)}</span>
                      </td>
                      <td className="w-[92px] min-w-[92px]">
                        <div className="flex items-center gap-2.5 whitespace-nowrap">
                          {tx.status === 'success' ? (
                            <div className="flex items-center justify-center w-4 h-4 rounded-full bg-emerald-500 shadow-sm flex-shrink-0">
                              <Check className="text-white" size={10} strokeWidth={4} />
                            </div>
                          ) : tx.status === 'failed' ? (
                            <XCircle className="text-red-500" size={16} />
                          ) : (
                            <Clock className="text-amber-500" size={16} />
                          )}
                          <span className={`font-normal text-[15px] ${tx.status === 'success' ? 'text-emerald-500' : tx.status === 'failed' ? 'text-red-500' : 'text-amber-500'}`}>
                            {tx.status === 'success' ? t('Success') : tx.status === 'failed' ? t('Failed') : t('Pending')}
                          </span>
                        </div>
                      </td>
                      <td>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => handleCopyHash(tx.hash)}
                            className="hash-link group/hash flex items-center gap-1.5 transition-colors relative"
                          >
                            <span className="opacity-80 group-hover/hash:opacity-100">{formatAddress(tx.hash)}</span>
                            <Copy size={14} className="opacity-40 group-hover/hash:opacity-100 transition-all" />
                            <AnimatePresence>
                              {copiedHash === tx.hash && (
                                <motion.span
                                  initial={{ opacity: 0, scale: 0.9, y: 10 }}
                                  animate={{ opacity: 1, scale: 1, y: 0 }}
                                  exit={{ opacity: 0, scale: 0.9, y: 10 }}
                                  className="absolute -top-10 left-0 bg-slate-950 text-white text-[10px] px-2 py-1 rounded-md shadow-xl border border-white/10 z-50 whitespace-nowrap"
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
                            className="p-2 rounded-lg bg-slate-100 dark:bg-white/[0.05] text-slate-400 hover:text-blue-500 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-all"
                          >
                            <ExternalLink size={14} />
                          </a>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="table-footer mt-auto">
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
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <EmptyActivityState />
            </div>
          )}
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-4 min-h-[500px]">
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
                  <span className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">{tx.type}</span>
                  {tx.type === 'Swap' && getNetworkName(tx.chainId) && (
                    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-blue-100/50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 w-fit">
                      <img src={getChainIcon(getNetworkName(tx.chainId))} alt="" className="w-3.5 h-3.5 object-contain" />
                      <span className="text-[10px] font-bold uppercase tracking-wider">
                        {t(getNetworkName(tx.chainId))}
                      </span>
                    </div>
                  )}
                  {tx.type === 'Bridge' && (
                    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-100/50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 w-fit">
                      <ArrowLeftRight size={10} />
                      <span className="text-[10px] font-bold uppercase tracking-wider">{t('Cross-Chain')}</span>
                    </div>
                  )}
                </div>
                <span className="text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap flex-shrink-0 font-bold bg-slate-100 dark:bg-white/5 px-2.5 py-1 rounded-lg tabular-nums">{timeAgo(tx.timestamp)}</span>
              </div>

              {/* Centered Status */}
              <div className="flex justify-center py-1">
                {tx.status === 'success' ? (
                  <div className="inline-flex items-center gap-2.5">
                    <div className="flex items-center justify-center w-4.5 h-4.5 rounded-full bg-emerald-500 shadow-sm">
                      <Check className="text-white" size={11} strokeWidth={4} />
                    </div>
                    <span className="text-[15px] font-normal text-emerald-500">{t('Success')}</span>
                  </div>
                ) : tx.status === 'pending' ? (
                  <div className="inline-flex items-center gap-2.5">
                    <Clock className="text-amber-500" size={16} strokeWidth={2.5} />
                    <span className="text-[15px] font-normal text-amber-500">{t('Pending')}</span>
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-2.5">
                    <XCircle className="text-red-500" size={16} />
                    <span className="text-[15px] font-normal text-red-500">{t('Failed')}</span>
                  </div>
                )}
              </div>

              {/* Transactions Entities */}
              <div className="flex items-center py-3 px-1">
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 mb-1 uppercase tracking-widest">
                    {tx.type === 'Swap' ? t('You Pay') : t('From')}
                  </div>
                  <div className="flex items-center gap-2 min-w-0">
                    {tx.type === 'Bridge' ? (
                      (() => {
                        const chainKey = String(tx.from || '').toLowerCase();
                        if (chainKey.includes('arc')) return <img src="/icons/arc.png" alt="Arc" loading="lazy" decoding="async" className="w-5 h-5 rounded-full object-cover bg-black" />;
                        if (chainKey.includes('base')) return <img src="/icons/base.png" alt="Base" loading="lazy" decoding="async" className="w-5 h-5 rounded-full object-cover bg-white shadow-sm" />;
                        if (chainKey.includes('sepolia')) return <img src="/icons/eth.png" alt="ETH" loading="lazy" decoding="async" className="w-5 h-5 rounded-full object-cover bg-white shadow-sm" />;
                        return <img src={getChainIcon(tx.from) || '/icons/eth.png'} alt="" loading="lazy" decoding="async" className="w-5 h-5 rounded-full object-cover" />;
                      })()
                    ) : (
                      <>
                        <img src={getTokenLogo(getSwapFromToken(tx)) || '/icons/stc.png'} alt="" loading="lazy" decoding="async" className="w-5 h-5 rounded-full object-cover shadow-sm" />
                        <span className="text-sm font-bold text-slate-800 dark:text-white truncate uppercase">{getSwapFromToken(tx)}</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex flex-col items-center justify-center gap-1.5 px-3">
                  <ArrowLeftRight size={14} className="text-blue-500 dark:text-blue-400 opacity-80" />
                </div>

                <div className="flex-1 min-w-0 text-right">
                  <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 mb-1 uppercase tracking-widest">
                    {tx.type === 'Swap' ? t('You Receive') : t('To')}
                  </div>
                  <div className="flex items-center justify-end gap-2 min-w-0">
                    {tx.type === 'Bridge' ? (
                      <>
                        <img src={getChainIcon(tx.to) || '/icons/eth.png'} alt="" loading="lazy" decoding="async" className="w-5 h-5 rounded-full object-cover shadow-sm" />
                        <span className="text-sm font-bold text-slate-800 dark:text-white truncate">{t(tx.to)}</span>
                      </>
                    ) : (
                      <>
                        <img src={getTokenLogo(getSwapToToken(tx)) || '/icons/stc.png'} alt="" loading="lazy" decoding="async" className="w-5 h-5 rounded-full object-cover drop-shadow-[0_4px_8px_rgba(59,130,246,0.25)]" />
                        <span className="text-sm font-bold text-slate-800 dark:text-white truncate uppercase">{getSwapToToken(tx)}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Amount Row */}
              <div className="flex items-center justify-between py-3 bg-slate-50/50 dark:bg-white/[0.03] rounded-xl px-4 border border-slate-200/50 dark:border-white/5">
                <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">{t('Amount')}</span>
                <span className="text-base font-bold text-slate-900 dark:text-white tabular-nums tracking-tight">
                  {tx.type === 'Swap' ? (getSwapToAmount(tx) || getSwapAmount(tx)) : getSwapAmount(tx)}
                </span>
              </div>

              {/* Transaction Actions */}
              <div className="pt-3.5 border-t border-slate-100 dark:border-white/5 flex gap-2">
                <button
                  onClick={() => handleCopyHash(tx.hash)}
                  className="flex-1 flex items-center justify-between px-4 py-3 bg-slate-50/80 dark:bg-white/[0.03] border border-slate-200/50 dark:border-white/10 rounded-xl text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-all font-bold text-xs relative"
                >
                  <div className="flex items-center gap-2 overflow-hidden">
                    <Copy size={14} className="opacity-60 flex-shrink-0" />
                    <span className="truncate tabular-nums opacity-80">{formatAddress(tx.hash)}</span>
                  </div>
                  <AnimatePresence>
                    {copiedHash === tx.hash && (
                      <motion.span
                        initial={{ opacity: 0, y: 10, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.9 }}
                        className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-950 text-white text-[10px] px-2.5 py-1.5 rounded-lg font-bold shadow-xl border border-white/10 whitespace-nowrap z-50 capitalize"
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
                  className="flex items-center justify-center p-3 bg-slate-50/80 dark:bg-white/[0.03] border border-slate-200/50 dark:border-white/10 rounded-xl text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-all"
                >
                  <ExternalLink size={18} />
                </a>
              </div>
            </motion.div>
          ))
        ) : (
          <EmptyActivityState />
        )}
      </div>

      {/* Mobile-only pagination footer */}
      <div className="md:hidden">
        {filteredTransactions.length > transactionsPerPage && (
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

    </div>
  );
};

export default memo(Transactions);
