import { useState, useMemo, memo, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useAccount } from 'wagmi';
import { transactionStore } from '../utils/transactionStore';
import { txService } from '../lib/txService';
import {
  Search,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Check,
  Copy,
  Clock,
  Inbox,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { timeAgo, formatAddress, copyToClipboard, getExplorerUrl } from '../utils/blockchain';
import '../styles/transactions-styles.css';




// =============================================================================
// SUB-COMPONENTS
// =============================================================================

const StacAssetIdentity = memo(({ tokenSymbol, chainName, amount, isToAmount }) => {
  const tokenSrc = getTokenLogo(tokenSymbol);
  const chainSrc = getChainIcon(chainName);
  const fullName = getTokenName(tokenSymbol);

  const formattedAmount = useMemo(() => {
    if (!amount || amount === '0' || amount === '0.00') return null;
    const cleanAmount = String(amount).replace(/[^-0-9.]/g, '');
    const num = parseFloat(cleanAmount);
    if (isNaN(num)) return amount;

    if (isToAmount) {
      return num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 });
    }
    return num % 1 === 0 ? num.toString() : num.toLocaleString(undefined, { maximumFractionDigits: 6 });
  }, [amount, isToAmount]);

  return (
    <div className="asset-group-stac">
      <div className="asset-badge-wrapper">
        <div className="main-token-icon">
          <img 
            src={tokenSrc} 
            alt={tokenSymbol || 'token'} 
            loading="lazy"
            onError={(e) => { e.target.src = '/icons/stc.png'; }}
          />
        </div>
        <div className="chain-badge-overlay">
          <img 
            src={chainSrc} 
            alt={chainName || 'chain'} 
            loading="lazy"
            onError={(e) => { e.target.src = '/icons/eth.png'; }}
          />
        </div>
      </div>
      <div className="asset-details-stac">
        <div className="asset-header-row">
          <span className="asset-name-stac">{fullName}</span>
        </div>
        {formattedAmount && (
          <span className="asset-amount-stac">
            <strong>{formattedAmount}</strong> {tokenSymbol}
          </span>
        )}
      </div>
    </div>
  );
});

StacAssetIdentity.displayName = 'StacAssetIdentity';

// =============================================================================
// DATA HELPERS
// =============================================================================

const getTokenName = (symbol) => {
  if (!symbol) return 'Unknown Token';
  const s = String(symbol).toUpperCase();
  if (s.includes('USDC') || s.includes('0X75FAF114EAFB1BDBE2F0316DF893FD58CE46AA4D')) return 'USD Coin';
  if (s.includes('EURC') || s.includes('0X89B50855AA3BE2F677CD6303CEC089B5F319D72A')) return 'Euro Coin';
  if (s.includes('STC') || s.includes('STAC')) return 'Stac Token';
  if (s.includes('ETH')) return 'Ethereum';
  return s.length > 10 ? 'Token' : s;
};

const getChainIcon = (chainName) => {
  if (!chainName) return '/icons/eth.png';
  const name = String(chainName).toLowerCase();
  if (name.includes('arc') || name.includes('5042002')) return '/icons/arc.png';
  if (name.includes('base') || name.includes('84532')) return '/icons/base.png';
  if (name.includes('eth') || name.includes('sepolia')) return '/icons/eth.png';
  return '/icons/eth.png';
};

const getTokenLogo = (symbol) => {
  if (!symbol) return '/icons/stc.png';
  const s = String(symbol).toUpperCase();
  if (s.includes('USDC') || s.includes('0X75FAF114EAFB1BDBE2F0316DF893FD58CE46AA4D')) return '/icons/usdc.png';
  if (s.includes('EURC') || s.includes('0X89B50855AA3BE2F677CD6303CEC089B5F319D72A')) return '/icons/eurc.png';
  if (s.includes('STC') || s.includes('STAC')) return '/icons/stc.png';
  if (s.includes('ETH')) return '/icons/eth.png';
  return '/icons/stc.png';
};

const TransactionSkeleton = () => (
  <div className="tx-skeleton-row">
    <div className="skeleton-item type"></div>
    <div className="skeleton-item asset"></div>
    <div className="skeleton-item asset"></div>
    <div className="skeleton-item status"></div>
    <div className="skeleton-item time"></div>
    <div className="skeleton-item hash"></div>
  </div>
);

const getChainIdByName = (name) => {
  const n = String(name).toLowerCase();
  if (n.includes('arc')) return 5042002;
  if (n.includes('base')) return 84532;
  if (n.includes('sepolia')) return 11155111;
  return 5042002;
};

// =============================================================================
// MAIN ARCHITECTURE - TRANSACTIONS LEDGER
// =============================================================================

const Transactions = () => {
  const { t } = useTranslation();
  const { address: connectedWallet } = useAccount();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateRangeFilter, setDateRangeFilter] = useState('all');
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showDateDropdown, setShowDateDropdown] = useState(false);
  const [hoveredHash, setHoveredHash] = useState(null);
  const [tooltipHash, setTooltipHash] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const transactionsPerPage = 10;

  const [supabaseTxs, setSupabaseTxs] = useState(() => {
    // Initial load from cache for instant UI
    const cached = localStorage.getItem('stac_global_tx_cache');
    try {
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });
  const [localTxs, setLocalTxs] = useState([]);
  const [isFetching, setIsFetching] = useState(supabaseTxs.length === 0);

  // Sync local optimistic transactions
  const syncLocalTxs = async () => {
    const txs = await transactionStore.getTransactions();
    console.log(`[Transactions] Synced ${txs.length} local transactions.`);
    setLocalTxs(txs);
  };

  // Fetch from Supabase (New Source of Truth)
  const fetchSupabaseHistory = useCallback(async () => {
    try {
      setIsFetching(true);
      const data = await txService.getConfirmedTransactions();
      // Map Supabase snake_case to UI camelCase
      const mapped = data.map(tx => ({
        id: tx.id,
        sender: tx.sender,
        tokenIn: tx.token_in,
        tokenOut: tx.token_out,
        amountIn: tx.amount_in,
        amountOut: tx.amount_out,
        type: tx.type,
        status: tx.status,
        chain: tx.chain,
        amount: tx.amount,
        receiveTxHash: tx.receive_tx_hash,
        sourceChain: tx.source_chain,
        destinationChain: tx.destination_chain,
        timestamp: typeof tx.timestamp === 'string' ? new Date(tx.timestamp).getTime() : tx.timestamp
      }));

      setSupabaseTxs(mapped);
      // Update cache for next load
      localStorage.setItem('stac_global_tx_cache', JSON.stringify(mapped));
    } catch (err) {
      console.error('[Transactions] Supabase Fetch Error:', err);
    } finally {
      setIsFetching(false);
    }
  }, []); // Global fetch, no wallet dependency

  useEffect(() => {
    fetchSupabaseHistory();
    syncLocalTxs();

    // 1. Listen for local store updates
    window.addEventListener('stac_transactions_updated', syncLocalTxs);

    // 2. Real-time subscription to Global Supabase updates
    let subscription = txService.subscribeToUpdates((newTx) => {
      // Optimistically add to top of list
      const mapped = {
        id: newTx.id,
        sender: newTx.sender,
        tokenIn: newTx.token_in,
        tokenOut: newTx.token_out,
        amountIn: newTx.amount_in,
        amountOut: newTx.amount_out,
        type: newTx.type,
        status: newTx.status,
        chain: newTx.chain,
        amount: newTx.amount,
        receiveTxHash: newTx.receive_tx_hash,
        sourceChain: newTx.source_chain,
        destinationChain: newTx.destination_chain,
        timestamp: typeof newTx.timestamp === 'string' ? new Date(newTx.timestamp).getTime() : newTx.timestamp
      };
      setSupabaseTxs(prev => {
        const exists = prev.find(t => t.id === mapped.id);
        if (exists) {
          return prev.map(t => t.id === mapped.id ? mapped : t);
        }
        return [mapped, ...prev];
      });
    });

    return () => {
      window.removeEventListener('stac_transactions_updated', syncLocalTxs);
      if (subscription) subscription.unsubscribe();
    };
  }, [fetchSupabaseHistory]); // Removed connectedWallet


  const filteredTxs = useMemo(() => {
    // 1. Merge Supabase and Local transactions
    const existingHashes = new Set();
    let combined = [];

    // Prioritize Supabase (Confirmed & Persistent)
    supabaseTxs.forEach(tx => {
      if (!existingHashes.has(tx.id)) {
        combined.push(tx);
        existingHashes.add(tx.id);
      }
    });

    // Add Local transactions (Optimistic/Pending)
    localTxs.forEach(tx => {
      if (!existingHashes.has(tx.id)) {
        combined.push(tx);
        existingHashes.add(tx.id);
      }
    });



    // Determine search/filter state
    // 2. Filter by Search Query (Wallet Address, Hash, or Token)
    if (searchQuery && searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase().trim();
      combined = combined.filter(tx =>
        (tx.sender && tx.sender.toLowerCase().includes(q)) ||
        (tx.id && tx.id.toLowerCase().includes(q)) ||
        (tx.tokenIn && tx.tokenIn.toLowerCase().includes(q)) ||
        (tx.tokenOut && tx.tokenOut.toLowerCase().includes(q))
      );
    }

    // 3. Status Filter
    if (statusFilter !== 'all') {
      combined = combined.filter(tx => (tx.status || 'success').toLowerCase() === statusFilter);
    }

    // 4. Date Range Filter
    if (dateRangeFilter !== 'all') {
      const now = Date.now();
      const oneDay = 24 * 60 * 60 * 1000;
      combined = combined.filter(tx => {
        if (!tx.timestamp) return false;
        const age = now - tx.timestamp;
        if (dateRangeFilter === '24h') return age <= oneDay;
        if (dateRangeFilter === '7d') return age <= 7 * oneDay;
        if (dateRangeFilter === '30d') return age <= 30 * oneDay;
        return true;
      });
    }

    // 5. Final Sort (Newest first)
    return combined.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
  }, [supabaseTxs, localTxs, statusFilter, searchQuery, dateRangeFilter]);

  const paginatedTxs = useMemo(() => {
    const start = (currentPage - 1) * transactionsPerPage;
    return filteredTxs.slice(start, start + transactionsPerPage);
  }, [filteredTxs, currentPage]);

  const totalPages = Math.ceil(filteredTxs.length / transactionsPerPage);

  const handleCopyText = async (text, hashKey) => {
    if (await copyToClipboard(text)) {
      setTooltipHash(hashKey);
      setTimeout(() => setTooltipHash(null), 1500);
    }
  };

  return (
    <div className="transactions-container pt-8 md:pt-12">
      <header className="transactions-header">
        <div className="transactions-title-section">
          <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            {t('Transactions')}
          </motion.h1>
          <div className="flex items-center gap-3">
            <motion.p className="transactions-subtitle">
              {`${filteredTxs.length} ${t('transactions')}`}
            </motion.p>
          </div>
        </div>
      </header>

      {/* FILTER BAR - RESTORED ORIGINAL UI */}
      <div className="filter-bar">
        <div className="search-input-wrapper">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder={t('Search by hash, token, or wallet ...')}
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
          />
          {searchQuery && (
            <button
              onClick={() => { setSearchQuery(''); setCurrentPage(1); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-100 dark:hover:bg-white/10 rounded-full transition-colors"
            >
              <X size={14} className="text-slate-400" />
            </button>
          )}
        </div>

        <div className="filter-group">
          <div className="relative">
            <button onClick={() => { setShowStatusDropdown(!showStatusDropdown); setShowDateDropdown(false); }} className={`filter-dropdown-btn ${showStatusDropdown ? 'active' : ''}`}>
              <span className="flex-1 text-left">{statusFilter === 'all' ? t('All Status') : t(statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1))}</span>
              <ChevronDown size={14} className={showStatusDropdown ? 'rotate-180' : ''} strokeWidth={2.5} />
            </button>
            <AnimatePresence>
              {showStatusDropdown && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }} className="dropdown-menu-vanguard">
                  {['all', 'success', 'pending', 'failed'].map(s => (
                    <button key={s} onClick={() => { setStatusFilter(s); setShowStatusDropdown(false); setCurrentPage(1); }} className={`dropdown-item-vanguard ${statusFilter === s ? 'selected' : ''}`}>
                      {s === 'all' ? t('All Status') : t(s.charAt(0).toUpperCase() + s.slice(1))}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="relative">
            <button onClick={() => { setShowDateDropdown(!showDateDropdown); setShowStatusDropdown(false); }} className={`filter-dropdown-btn ${showDateDropdown ? 'active' : ''}`}>
              <span className="flex-1 text-left">{dateRangeFilter === 'all' ? t('All Time') : t(dateRangeFilter.toUpperCase())}</span>
              <ChevronDown size={14} className={showDateDropdown ? 'rotate-180' : ''} strokeWidth={2.5} />
            </button>
            <AnimatePresence>
              {showDateDropdown && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }} className="dropdown-menu-vanguard">
                  {['all', '24h', '7d', '30d'].map(d => (
                    <button key={d} onClick={() => { setDateRangeFilter(d); setShowDateDropdown(false); setCurrentPage(1); }} className={`dropdown-item-vanguard ${dateRangeFilter === d ? 'selected' : ''}`}>
                      {d === 'all' ? t('All Time') : t(d.toUpperCase())}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <div className="transactions-table-container">
        <AnimatePresence mode="wait">
          {isFetching ? (
            <motion.div
              key="loading-skeletons"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="skeletons-wrapper"
            >
              {[...Array(5)].map((_, i) => <TransactionSkeleton key={i} />)}
            </motion.div>
          ) : filteredTxs.length > 0 ? (
            <motion.table key="results-table" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="tx-table">
              <thead>
                <tr>
                  <th className="col-type">{t('Type')}</th>
                  <th className="col-from">{t('From')}</th>
                  <th className="col-to">{t('To')}</th>
                  <th className="col-status">{t('Status')}</th>
                  <th className="col-time">{t('Time')}</th>
                  <th className="col-hash">{t('Transaction Hash')}</th>
                </tr>
              </thead>
              <tbody>
                {paginatedTxs.map((tx) => {
                  const isBridge = tx.type === 'Bridge';
                  const txStatus = (tx.status || 'success').toLowerCase();

                  return (
                    <tr key={tx.id}>
                      <td className="col-type" data-label={t('Type')}>
                        <div className="type-column-stack">
                          <span className="type-main-txt">{t(tx.type)}</span>
                          <span className="type-sub-addr">{formatAddress(tx.sender)}</span>
                        </div>
                      </td>
                      <td className="col-from" data-label={t('From')}>
                        {isBridge ? (
                          <StacAssetIdentity
                            tokenSymbol={tx.tokenIn || 'USDC'}
                            chainName={tx.sourceChain || tx.chain}
                            amount={tx.amount || tx.amountIn}
                            isToAmount={false}
                          />
                        ) : (
                          <StacAssetIdentity tokenSymbol={tx.tokenIn} chainName={tx.chain} amount={tx.amountIn} isToAmount={false} />
                        )}
                      </td>
                      <td className="col-to" data-label={t('To')}>
                        {isBridge ? (
                          <StacAssetIdentity
                            tokenSymbol={tx.tokenIn || 'USDC'}
                            chainName={tx.destinationChain}
                            amount={tx.amount || tx.amountOut}
                            isToAmount={true}
                          />
                        ) : (
                          <StacAssetIdentity tokenSymbol={tx.tokenOut} chainName={tx.chain} amount={tx.amountOut} isToAmount={true} />
                        )}
                      </td>
                      <td className="col-status" data-label={t('Status')}>
                        <div className={`status-pill ${txStatus === 'relaying' ? 'pending' : txStatus}`}>
                          {txStatus === 'success' ? (
                            <>
                              <div className="status-icon-filled"><Check size={10} strokeWidth={3} /></div>
                              <span>{t('Success')}</span>
                            </>
                          ) : (
                            <>
                              <div className="status-icon-pending">
                                {txStatus === 'relaying' ? <Clock size={10} strokeWidth={3} className="animate-pulse" /> : <X size={10} strokeWidth={3} />}
                              </div>
                              <span>{txStatus === 'relaying' ? t('Pending') : t('Failed')}</span>
                            </>
                          )}
                        </div>
                      </td>
                      <td className="col-time" data-label={t('Time')}><span className="time-txt">{timeAgo(tx.timestamp)}</span></td>
                      <td className="col-hash" data-label={t('Hash')}>
                        {isBridge ? (
                          <div className="tx-hash-stack is-bridge">
                            <div className="tx-hash-box">
                              <span className="hash-label">SRC</span>
                              <div className="chain-mini-icon mr-2">
                                <img src={getChainIcon(tx.sourceChain)} alt="" />
                              </div>
                              <a href={getExplorerUrl(tx.id, getChainIdByName(tx.sourceChain))} target="_blank" rel="noopener" className="hash-link">
                                {formatAddress(tx.id)}
                              </a>
                              <div className="relative inline-flex items-center">
                                <button
                                  onClick={() => handleCopyText(tx.id, `src-${tx.id}`)}
                                  onMouseEnter={() => setHoveredHash(`src-${tx.id}`)}
                                  onMouseLeave={() => setHoveredHash(null)}
                                  className="copy-button-minimal"
                                >
                                  <Copy size={12} strokeWidth={2} />
                                </button>
                                <AnimatePresence>
                                  {(tooltipHash === `src-${tx.id}` || hoveredHash === `src-${tx.id}`) && (
                                    <motion.div
                                      initial={{ opacity: 0, y: 5, scale: 0.95 }}
                                      animate={{ opacity: 1, y: 0, scale: 1 }}
                                      exit={{ opacity: 0, y: 5, scale: 0.95 }}
                                      className="tooltip-left-stac"
                                    >
                                      {tooltipHash === `src-${tx.id}` ? t('Copied') : t('Copy Hash')}
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </div>
                            </div>

                            <div className="tx-hash-box dest">
                              <span className="hash-label">DST</span>
                              <div className="chain-mini-icon mr-2">
                                <img src={getChainIcon(tx.destinationChain)} alt="" />
                              </div>
                              {tx.receiveTxHash ? (
                                <div className="flex items-center">
                                  <a href={getExplorerUrl(tx.receiveTxHash, getChainIdByName(tx.destinationChain))} target="_blank" rel="noopener" className="hash-link">
                                    {formatAddress(tx.receiveTxHash)}
                                  </a>
                                  <div className="relative inline-flex items-center ml-1">
                                    <button
                                      onClick={() => handleCopyText(tx.receiveTxHash, `dst-${tx.id}`)}
                                      onMouseEnter={() => setHoveredHash(`dst-${tx.id}`)}
                                      onMouseLeave={() => setHoveredHash(null)}
                                      className="copy-button-minimal"
                                    >
                                      <Copy size={12} strokeWidth={2} />
                                    </button>
                                    <AnimatePresence>
                                      {(tooltipHash === `dst-${tx.id}` || hoveredHash === `dst-${tx.id}`) && (
                                        <motion.div
                                          initial={{ opacity: 0, x: 5 }}
                                          animate={{ opacity: 1, x: 0 }}
                                          exit={{ opacity: 0, x: 5 }}
                                          className="tooltip-left-stac"
                                        >
                                          {tooltipHash === `dst-${tx.id}` ? t('Copied') : t('Copy Hash')}
                                        </motion.div>
                                      )}
                                    </AnimatePresence>
                                  </div>
                                </div>
                              ) : (tx.status === 'relaying' || tx.status === 'pending') ? (
                                <span className="hash-pending">{t('Relaying')}...</span>
                              ) : (
                                <span className="hash-pending" style={{ opacity: 0.4 }}>—</span>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="swap-hash-container">
                            <div className="tx-hash-box swap-hash-centered">
                              <a href={getExplorerUrl(tx.id, getChainIdByName(tx.chain))} target="_blank" rel="noopener" className="hash-link">
                                {formatAddress(tx.id)}
                              </a>
                              <div className="relative inline-flex items-center">
                                <button
                                  onClick={() => handleCopyText(tx.id, tx.id)}
                                  onMouseEnter={() => setHoveredHash(tx.id)}
                                  onMouseLeave={() => setHoveredHash(null)}
                                  className="copy-button-minimal"
                                >
                                  <Copy size={12} strokeWidth={2} />
                                </button>
                                <AnimatePresence>
                                  {(tooltipHash === tx.id || hoveredHash === tx.id) && (
                                    <motion.div
                                      initial={{ opacity: 0, y: 5, scale: 0.95 }}
                                      animate={{ opacity: 1, y: 0, scale: 1 }}
                                      exit={{ opacity: 0, y: 5, scale: 0.95 }}
                                      className="tooltip-left-stac"
                                    >
                                      {tooltipHash === tx.id ? t('Copied') : t('Copy Hash')}
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </div>
                            </div>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </motion.table>
          ) : (
            <motion.div key="empty-state" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="empty-state-vanguard">
              <Inbox size={48} strokeWidth={1.5} className="text-slate-400 mb-2" />
              <h2>{t('No Activity Found')}</h2>
              <p>{t('tryAdjustingFilters')}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {filteredTxs.length > 0 && (
          <footer className="pagination-footer">
            <span className="pagination-info">{t('Showing')} {Math.min(filteredTxs.length, (currentPage - 1) * transactionsPerPage + 1)}–{Math.min(filteredTxs.length, currentPage * transactionsPerPage)} {t('of')} {filteredTxs.length}</span>
            <div className="pagination-btns flex gap-3">
              <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="pagination-btn"><ChevronLeft size={16} strokeWidth={2} /></button>
              <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => p + 1)} className="pagination-btn"><ChevronRight size={16} strokeWidth={2} /></button>
            </div>
          </footer>
        )}
      </div>
    </div>
  );
};

export default memo(Transactions);
