import { useState, useEffect, useMemo, memo } from 'react';
import { useTranslation } from 'react-i18next';
import { useWallet } from '../hooks/useWallet';
import { 
  Search, 
  ChevronDown, 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle2,
  Check,
  Copy,
  Clock,
  Inbox
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { timeAgo, formatAddress, copyToClipboard, getExplorerUrl } from '../utils/blockchain';
import { getItem, setItem } from '../utils/indexedDB';
import { useDappTransactionCount } from '../hooks/useDappTransactionCount';
import { useTransactionHistory } from '../hooks/useTransactionHistory';
import '../styles/transactions-styles.css';

// =============================================================================
// STAC-TIER IDENTITY STACK [NON-REDUNDANT REFACTOR]
// =============================================================================

const StacAssetIdentity = memo(({ tokenSymbol, chainName, amount, isToAmount }) => {
  const tokenSrc = getTokenLogo(tokenSymbol);
  const chainSrc = getChainIcon(chainName);
  const fullName = getTokenName(tokenSymbol);

  const formattedAmount = useMemo(() => {
    if (!amount || amount === '0.00') return null;
    const num = parseFloat(String(amount).replace(/[^-0-9.]/g, ''));
    if (isNaN(num)) return amount;
    
    if (isToAmount) {
      return num.toLocaleString(undefined, { minimumFractionDigits: 4, maximumFractionDigits: 4 });
    }
    return num % 1 === 0 ? num.toString() : num.toLocaleString(undefined, { maximumFractionDigits: 6 });
  }, [amount, isToAmount]);

  return (
    <div className="asset-group-stac">
      <div className="asset-badge-wrapper">
        <div className="main-token-icon">
          <img src={tokenSrc} alt={tokenSymbol || 'token'} />
        </div>
        <div className="chain-badge-overlay">
          <img src={chainSrc} alt={chainName || 'chain'} />
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
  if (s.includes('USDC')) return 'USD Coin';
  if (s.includes('EURC')) return 'Euro Coin';
  if (s.includes('STC') || s.includes('STAC')) return 'Stac Token';
  if (s.includes('ETH')) return 'Ethereum';
  return s;
};

const getChainIcon = (chainName) => {
  if (!chainName) return '/icons/eth.png';
  const name = String(chainName).toLowerCase();
  if (name.includes('arc') || name.includes('5042002') || name.includes('4cef52')) return '/icons/arc.png';
  if (name.includes('base') || name.includes('84532') || name.includes('8453')) return '/icons/base.png';
  if (name.includes('eth') || name.includes('sepolia') || name.includes('11155111')) return '/icons/eth.png';
  return '/icons/eth.png';
};

const getTokenLogo = (symbol) => {
  if (!symbol) return '/icons/stc.png';
  const s = String(symbol).toUpperCase();
  if (s.includes('USDC')) return '/icons/usdc.png';
  if (s.includes('EURC')) return '/icons/eurc.png';
  if (s.includes('STC') || s.includes('STAC')) return '/icons/stc.png';
  if (s.includes('ETH')) return '/icons/eth.png';
  return '/icons/stc.png';
};

const getSwapFromToken = (tx) => {
  if (!tx) return '';
  if (tx.type !== 'Swap') return tx.fromToken || (tx.from && tx.from.includes(' ') ? tx.from.split(' ').pop() : (tx.from || ''));
  const fromStr = String(tx.from || '').trim();
  return fromStr.includes(' ') ? fromStr.split(' ').pop() : fromStr;
};

// =============================================================================
// MAIN ARCHITECTURE - LOCAL-ONLY "SITE INTEGRATED" LEDGER
// =============================================================================

const Transactions = () => {
  const { t } = useTranslation();
  const { isConnected, walletAddress, chainId: activeChainId } = useWallet();
  const [tooltipHash, setTooltipHash] = useState(null);
  
  // USE THE UNIFIED HOOK FOR REAL-TIME SYNC
  const { transactions: hookTransactions, globalTransactions, loading: hookLoading, refetch } = useTransactionHistory();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateRangeFilter, setDateRangeFilter] = useState('all');
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showDateDropdown, setShowDateDropdown] = useState(false);
  const [hoveredHash, setHoveredHash] = useState(null);

  const [currentPage, setCurrentPage] = useState(1);
  const transactionsPerPage = 10;

  // Sync session event listeners
  useEffect(() => {
    const handleSync = () => { if (typeof refetch === 'function') refetch(); };
    window.addEventListener('bridgeTransactionSaved', handleSync);
    window.addEventListener('swapTransactionSaved', handleSync);
    window.addEventListener('lpTransactionSaved', handleSync);
    return () => {
      window.removeEventListener('bridgeTransactionSaved', handleSync);
      window.removeEventListener('swapTransactionSaved', handleSync);
      window.removeEventListener('lpTransactionSaved', handleSync);
    };
  }, [refetch]);

  // COMBINE AND DEDUPLICATE WITH MAXIMUM SAFETY
  const localTransactions = useMemo(() => {
    try {
      const personal = Array.isArray(hookTransactions) ? hookTransactions : [];
      const globalList = Array.isArray(globalTransactions) ? globalTransactions : [];
      const combined = [...personal, ...globalList];
      
      const seen = new Set();
      const result = [];
      
      for (const tx of combined) {
        if (!tx) continue;
        const hash = tx.hash || tx.id;
        if (!hash || seen.has(hash)) continue;
        
        // ONLY SHOW DAPP TRANSACTIONS: check flag or type
        if (!tx.isStacTx && tx.type !== 'Swap' && tx.type !== 'Bridge') continue;

        seen.add(hash);
        result.push(tx);
      }
      
      return result.sort((a, b) => (Number(b.timestamp) || 0) - (Number(a.timestamp) || 0));
    } catch (e) {
      console.error("Error memoizing transactions:", e);
      return [];
    }
  }, [hookTransactions, globalTransactions]);

  const filteredTxs = useMemo(() => {
    try {
      let filtered = [...localTransactions];

      if (statusFilter !== 'all') {
        filtered = filtered.filter(tx => (tx?.status || 'success').toLowerCase() === statusFilter);
      }

      const q = searchQuery?.toLowerCase().trim() || '';
      if (q) {
        filtered = filtered.filter(tx => 
          (tx?.hash?.toLowerCase().includes(q)) ||
          (getTokenName(getSwapFromToken(tx)).toLowerCase().includes(q)) ||
          (tx?.from?.toLowerCase().includes(q)) ||
          (tx?.to?.toLowerCase().includes(q))
        );
      }

      if (dateRangeFilter !== 'all') {
        const now = Date.now();
        const oneDay = 24 * 60 * 60 * 1000;
        const sevenDays = 7 * oneDay;
        const thirtyDays = 30 * oneDay;

        filtered = filtered.filter(tx => {
          if (!tx?.timestamp) return false;
          const ts = new Date(tx.timestamp).getTime();
          if (isNaN(ts)) return false;

          const age = now - ts;

          if (dateRangeFilter === '24h') {
            return age >= 0 && age <= oneDay;
          }
          if (dateRangeFilter === '7d') {
            return age > oneDay && age <= sevenDays;
          }
          if (dateRangeFilter === '30d') {
            return age > sevenDays && age <= thirtyDays;
          }
          return true;
        });
      }

      return filtered;
    } catch (e) {
      console.error("Error filtering transactions:", e);
      return [];
    }
  }, [localTransactions, searchQuery, statusFilter, dateRangeFilter]);

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
    <div className="transactions-container">
      <header className="transactions-header">
        <div className="transactions-title-section">
          <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>{t('Transactions')}</motion.h1>
          <div className="flex items-center gap-3">
             <motion.p className="transactions-subtitle">
              {`${filteredTxs.length} ${t('transactions')}`}
            </motion.p>
          </div>
        </div>
      </header>

      {/* SYNCED DASHBOARD TOOLBAR */}
      <div className="filter-bar">
        <div className="search-input-wrapper">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder={t('Search by hash, token, or wallet ...')}
            value={searchQuery}
            onChange={(e) => {setSearchQuery(e.target.value); setCurrentPage(1);}}
          />
        </div>

        <div className="filter-group">
          <div className="relative">
            <button onClick={() => { setShowStatusDropdown(!showStatusDropdown); setShowDateDropdown(false); }} className={`filter-dropdown-btn ${showStatusDropdown || statusFilter !== 'all' ? 'active' : ''}`}>
              <span className="flex-1 text-left">{statusFilter === 'all' ? t('All Status') : t(statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1))}</span>
              <ChevronDown size={14} className={showStatusDropdown ? 'rotate-180' : ''} strokeWidth={3.5} />
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
            <button onClick={() => { setShowDateDropdown(!showDateDropdown); setShowStatusDropdown(false); }} className={`filter-dropdown-btn ${showDateDropdown || dateRangeFilter !== 'all' ? 'active' : ''}`}>
              <span className="flex-1 text-left">{dateRangeFilter === 'all' ? t('All Time') : t(dateRangeFilter.toUpperCase())}</span>
              <ChevronDown size={14} className={showDateDropdown ? 'rotate-180' : ''} strokeWidth={3.5} />
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
          {filteredTxs.length > 0 ? (
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
                  if (!tx) return null;
                  const isBridge = tx.type === 'Bridge';
                  let fromToken, toToken, fromChain, toChain, fromAmount, toAmount;

                  if (isBridge) {
                    fromToken = tx.fromToken || 'USDC';
                    toToken = tx.toToken || 'USDC';
                    fromChain = tx.from;
                    toChain = tx.to;
                    fromAmount = tx.amount;
                    if (tx.receiveAmount) {
                      toAmount = tx.receiveAmount;
                    } else {
                      const fee = toChain?.toLowerCase().includes('sepolia') ? 1.25 : 0.20;
                      toAmount = Math.max(0, (parseFloat(tx.amount) || 0) - fee).toFixed(2);
                    }
                  } else {
                    const fromParts = String(tx.from || '').split(' ');
                    fromAmount = fromParts[0];
                    fromToken = fromParts[1] || 'USDC';
                    
                    const toParts = String(tx.to || '').split(' ');
                    toAmount = toParts[0];
                    toToken = toParts[1] || 'EURC';
                    
                    fromChain = 'Arc';
                    toChain = 'Arc';
                  }

                  const txStatus = tx.status || 'success';

                  return (
                    <tr key={tx.hash || tx.id}>
                      <td className="col-type" data-label={t('Type')}>
                        <div className="type-column-stack">
                          <span className="type-main-txt">{t(tx.type || 'Transaction')}</span>
                          <span className="type-sub-addr">{formatAddress(tx.address || walletAddress)}</span>
                        </div>
                      </td>
                      <td className="col-from" data-label={t('From')}><StacAssetIdentity tokenSymbol={fromToken} chainName={fromChain} amount={fromAmount} isToAmount={false} /></td>
                      <td className="col-to" data-label={t('To')}><StacAssetIdentity tokenSymbol={toToken} chainName={toChain} amount={toAmount} isToAmount={true} /></td>
                    <td className="col-status" data-label={t('Status')}>
                      <div className={`status-pill ${txStatus}`}>
                        {txStatus === 'success' ? (
                          <div className="status-icon-filled"><Check size={10} /></div>
                        ) : (
                          <div className="status-icon-pending"><Clock size={12} strokeWidth={3} /></div>
                        )}
                        {t(txStatus.charAt(0).toUpperCase() + txStatus.slice(1))}
                      </div>
                    </td>
                    <td className="col-time" data-label={t('Time')}><span className="time-txt">{timeAgo(tx.timestamp)}</span></td>
                    <td className="col-hash" data-label={t('Hash')}>
                        {isBridge ? (
                          <div className="tx-hash-stack is-bridge">
                            <div className="tx-hash-box">
                              <span className="hash-label">SRC</span>
                              <div className="chain-mini-icon mr-2">
                                <img src={getChainIcon(tx.fromChainId || tx.chainId)} alt="" />
                              </div>
                              <a href={getExplorerUrl(tx.hash, tx.fromChainId || tx.chainId || activeChainId)} target="_blank" rel="noopener" className="hash-link">
                                {formatAddress(tx.hash)}
                              </a>
                              <div className="relative inline-flex items-center">
                                <button 
                                  onClick={() => handleCopyText(tx.hash, `src-${tx.hash}`)} 
                                  onMouseEnter={() => setHoveredHash(`src-${tx.hash}`)}
                                  onMouseLeave={() => setHoveredHash(null)}
                                  className="copy-button-minimal"
                                >
                                  <Copy size={12} strokeWidth={2} />
                                </button>
                                <AnimatePresence>
                                  {(tooltipHash === `src-${tx.hash}` || hoveredHash === `src-${tx.hash}`) && (
                                    <motion.div 
                                      initial={{ opacity: 0, y: 10, scale: 0.95 }} 
                                      animate={{ opacity: 1, y: 0, scale: 1 }} 
                                      exit={{ opacity: 0, y: 10, scale: 0.95 }} 
                                      className="copy-tooltip-stac"
                                    >
                                      {tooltipHash === `src-${tx.hash}` ? t('Copied') : t('Copy Hash')}
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </div>
                            </div>

                            <div className="tx-hash-box dest">
                              <span className="hash-label">DST</span>
                              <div className="chain-mini-icon mr-2">
                                <img src={getChainIcon(tx.toChainId || activeChainId)} alt="" />
                              </div>
                              {tx.destHash ? (
                                <>
                                  <a href={getExplorerUrl(tx.destHash, tx.toChainId || activeChainId)} target="_blank" rel="noopener" className="hash-link">
                                    {formatAddress(tx.destHash)}
                                  </a>
                                  <div className="relative inline-flex items-center ml-1">
                                    <button 
                                      onClick={() => handleCopyText(tx.destHash, `dest-${tx.hash}`)} 
                                      onMouseEnter={() => setHoveredHash(`dest-${tx.hash}`)}
                                      onMouseLeave={() => setHoveredHash(null)}
                                      className="copy-button-minimal"
                                    >
                                      <Copy size={12} strokeWidth={2} />
                                    </button>
                                    <AnimatePresence>
                                      {(tooltipHash === `dest-${tx.hash}` || hoveredHash === `dest-${tx.hash}`) && (
                                        <motion.div 
                                          initial={{ opacity: 0, y: 10, scale: 0.95 }} 
                                          animate={{ opacity: 1, y: 0, scale: 1 }} 
                                          exit={{ opacity: 0, y: 10, scale: 0.95 }} 
                                          className="copy-tooltip-stac"
                                        >
                                          {tooltipHash === `dest-${tx.hash}` ? t('Copied') : t('Copy Hash')}
                                        </motion.div>
                                      )}
                                    </AnimatePresence>
                                  </div>
                                </>
                              ) : (
                                <span className="hash-pending">{t('Relaying')}...</span>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="swap-hash-container">
                            <div className="tx-hash-box swap-hash-centered">
                              <a href={getExplorerUrl(tx.hash, tx.fromChainId || tx.chainId || activeChainId)} target="_blank" rel="noopener" className="hash-link">
                                {formatAddress(tx.hash)}
                              </a>
                              <div className="relative inline-flex items-center">
                                <button 
                                  onClick={() => handleCopyText(tx.hash, tx.hash)} 
                                  onMouseEnter={() => setHoveredHash(tx.hash)}
                                  onMouseLeave={() => setHoveredHash(null)}
                                  className="copy-button-minimal"
                                >
                                  <Copy size={12} strokeWidth={2} />
                                </button>
                                <AnimatePresence>
                                  {(tooltipHash === tx.hash || hoveredHash === tx.hash) && (
                                    <motion.div 
                                      initial={{ opacity: 0, y: 10, scale: 0.95 }} 
                                      animate={{ opacity: 1, y: 0, scale: 1 }} 
                                      exit={{ opacity: 0, y: 10, scale: 0.95 }} 
                                      className="copy-tooltip-stac"
                                    >
                                      {tooltipHash === tx.hash ? t('Copied') : t('Copy Hash')}
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
