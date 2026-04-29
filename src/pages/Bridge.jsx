import { useState, useRef, useEffect, useCallback, memo } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { useWallet } from '../hooks/useWallet';
import { useSwitchChain } from 'wagmi';
import { ArrowRight, Loader, Wallet, X, ChevronDown, Search, Check, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { NETWORKS } from '../config/networks';
import { sanitizeInput } from '../utils/blockchain';
import { useBridge } from '../hooks/useBridge';
import { getItem, setItem } from '../utils/indexedDB';
import BridgingModal from '../components/BridgingModal';
import BridgeFailedModal from '../components/BridgeFailedModal';
import BridgeSuccessModal from '../components/BridgeSuccessModal';
import BridgeRejectedModal from '../components/BridgeRejectedModal';
import BridgeCancelledModal from '../components/BridgeCancelledModal';
import '../styles/bridge-styles.css';
import { logger } from '../utils/logger';

// --- Chain Selector Modal ---
const ChainSelector = ({ isOpen, onClose, selectedChain, onSelect, exclude }) => {
  const { t } = useTranslation();
  const chainSearchRef = useRef(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (isOpen) {
      setSearchQuery('');
      setTimeout(() => chainSearchRef.current?.focus(), 150);
    }
  }, [isOpen]);

  const chainList = ['Arc Testnet', 'Ethereum Sepolia', 'Base Sepolia'];
  const filteredChains = chainList.filter(name => {
    const query = searchQuery.toLowerCase();
    const chainCfg = Object.values(NETWORKS).find(n => n.chainName === name || n.chainName.includes(name));
    const decimalId = chainCfg?.chainId ? parseInt(chainCfg.chainId, 16).toString() : '';
    return name.toLowerCase().includes(query) || decimalId.includes(query);
  });

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[100000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="w-full max-w-[400px] bg-white dark:bg-[#121212] rounded-[2rem] sm:rounded-[2.5rem] overflow-hidden border border-slate-200 dark:border-white/[0.08] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.2)] dark:shadow-[0_40px_80px_-16px_rgba(0,0,0,0.8)] mx-4"
            initial={{ scale: 0.98, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.98, opacity: 0, y: 10 }}
            transition={{ type: 'spring', damping: 30, stiffness: 400 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-7 pt-7 pb-4 flex items-center justify-between">
              <div className="space-y-0.5">
                <h3 className="text-xl font-semibold text-slate-900 dark:text-white font-['Satoshi','Inter',sans-serif] tracking-tight">
                  {t('Select Network')}
                </h3>
                <p className="text-[12px] text-slate-500 dark:text-slate-400">
                  {t('Choose a chain to bridge assets.')}
                </p>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-full text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-all"
              >
                <X size={18} />
              </button>
            </div>

            <div className="px-5 pb-2">
              <div className="relative group">
                <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-white/20 group-focus-within:text-slate-600 dark:group-focus-within:text-white/40 transition-colors" />
                <input
                  ref={chainSearchRef}
                  type="text"
                  placeholder={t('Search network or chain ID')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-transparent border border-slate-200 dark:border-white/[0.08] rounded-xl pl-11 pr-4 py-3 text-[13px] text-slate-900 dark:text-white outline-none focus:border-slate-300 dark:focus:border-white/20 transition-all font-['Satoshi','Inter',sans-serif] placeholder:text-slate-400 dark:placeholder:text-white/40"
                />
              </div>
            </div>

            {/* NETWORK LIST */}
            <div className="px-3 pb-2 pt-4 max-h-[480px] overflow-y-auto custom-scrollbar">
              <div className="px-3 space-y-1.5">
                {filteredChains.map((name, i) => {
                  const isExcluded = name === exclude;
                  const isSelected = name === selectedChain;
                  const chainCfg = Object.values(NETWORKS).find(n =>
                    n.chainName === name || n.chainName.includes(name)
                  );

                  return (
                    <motion.button
                      key={name}
                      disabled={isExcluded}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.03 }}
                      onClick={() => !isExcluded && (onSelect(name), onClose())}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all duration-200 group relative ${
                        isSelected
                          ? 'bg-slate-100 dark:bg-white/[0.06] border border-slate-200/50 dark:border-white/[0.08]'
                          : isExcluded
                            ? 'opacity-30 cursor-not-allowed'
                            : 'hover:bg-slate-50 dark:hover:bg-white/[0.03] border border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 overflow-hidden transition-all duration-300 ${
                          isSelected
                            ? 'bg-white dark:bg-[#1A1A1A] border border-slate-200 dark:border-white/20 shadow-sm'
                            : 'bg-white dark:bg-white/5 border border-slate-200/50 dark:border-white/10 group-hover:border-slate-300 dark:group-hover:border-white/20'
                        }`}>
                          <img
                            src={chainCfg?.iconUrl}
                            alt={name}
                            className={`w-5 h-5 object-contain transition-transform duration-300 group-hover:scale-110 shrink-0 ${isSelected ? 'scale-110' : ''}`}
                          />
                        </div>
                        <div className="text-left min-w-0 flex flex-col justify-center">
                          <p className={`text-[14px] font-semibold font-['Satoshi','Inter',sans-serif] tracking-tight text-slate-900 dark:text-white leading-tight`}>
                            {name}
                          </p>
                          <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium font-mono mt-0.5">
                            {chainCfg?.chainId ? `ID: ${parseInt(chainCfg.chainId, 16)}` : 'N/A'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        {chainCfg?.tag && chainCfg.tag !== 'Mainnet' && chainCfg.tag !== 'L2' && chainCfg.tag !== 'L1' && (
                          <span className="text-[9px] font-semibold text-slate-400 dark:text-slate-600 uppercase tracking-widest bg-slate-100 dark:bg-white/5 px-1.5 py-0.5 rounded-md">
                            {chainCfg.tag}
                          </span>
                        )}
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </div>

            {/* FOOTER */}
            <div className="mt-4 border-t border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.01] px-6 py-5 flex items-center justify-center gap-2">
              <Info size={14} className="text-slate-400" />
              <p className="text-[12px] text-slate-500 dark:text-slate-400 font-['Satoshi','Inter',sans-serif]">
                {t("Don't see your network?")}{' '}
                <button className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline">
                  {t('Add Custom Chain')}
                </button>
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
};

// --- Main Bridge Component ---
const Bridge = () => {
  const { t } = useTranslation();
  const { isConnected, walletAddress, status } = useWallet();
  const { switchChainAsync } = useSwitchChain();
  const { bridge, claim, state, reset, tokenBalance, isLoadingBalance, refreshBalances } = useBridge();

  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  // Selected Chains
  const [fromChain, setFromChain] = useState('Sepolia');
  const [toChain, setToChain] = useState('Arc Testnet');
  const [amount, setAmount] = useState('');

  // UI States
  const [bridgeLoading, setBridgeLoading] = useState(false);
  const [showChainSelector, setShowChainSelector] = useState(null);
  const [showBridgingModal, setShowBridgingModal] = useState(false);
  const [showBridgeFailedModal, setShowBridgeFailedModal] = useState(false);
  const [showBridgeSuccessModal, setShowBridgeSuccessModal] = useState(false);
  const [showBridgeRejectedModal, setShowBridgeRejectedModal] = useState(false);
  const [showBridgeCancelledModal, setShowBridgeCancelledModal] = useState(false);
  const [bridgeStartTime, setBridgeStartTime] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [stopTimer, setStopTimer] = useState(true);
  const [bridgeError, setBridgeError] = useState({ title: 'Error Details', message: '' });
  const [bridgeFinalTime, setBridgeFinalTime] = useState(null);
  const [sourceTxHash, setSourceTxHash] = useState(null);

  const bridgeInitiatedRef = useRef(false);
  const initialFromChainRef = useRef(null);
  const initialToChainRef = useRef(null);
  const savedHashesRef = useRef(new Set());

  const isBridgeInProgress = bridgeLoading || state.isLoading || (state.step !== 'idle' && state.step !== 'success' && state.step !== 'error');

  // HELPERS
  const getChainIdByName = useCallback((n) => ({ 'Arc Testnet': 5042002, 'Sepolia': 11155111, 'Base Sepolia': 84532 }[n]), []);

  const saveBridgeTransaction = useCallback(async (hash, status, destHash = null) => {
    if (!hash || savedHashesRef.current.has(hash)) return;

    try {
      // Session lock immediately to prevent race conditions
      savedHashesRef.current.add(hash);

      const saved = await getItem('myTransactions') || [];
      // Persistent deduplication: check if hash already exists in DB
      const exists = saved.some(tx => tx.hash === hash);
      if (exists) return;

      const tx = {
        id: hash || `bridge-${Date.now()}`,
        type: 'Bridge',
        from: fromChain,
        to: toChain,
        amount: amount || '0',
        timestamp: Date.now(),
        status,
        hash,
        destHash, // Add destHash to storage
        fromChainId: getChainIdByName(fromChain), // Save chain IDs as well for explorer links
        toChainId: getChainIdByName(toChain),
        address: walletAddress?.toLowerCase(),
      };

      await setItem('myTransactions', [tx, ...saved].slice(0, 50));
      window.dispatchEvent(new CustomEvent('bridgeTransactionSaved'));
      logger.info(`[Bridge] Transaction ${hash} saved successfully.`);
    } catch (e) {
      logger.warn('Save failed', e);
      // Re-allow retry on failure? Actually status 'success' is solid
    }
  }, [fromChain, toChain, amount, walletAddress]);

  const handleNetworkChange = async (n) => {
    if (isBridgeInProgress) return;
    const cid = getChainIdByName(n);
    if (isConnected && cid) {
      try { await switchChainAsync({ chainId: cid }); setFromChain(n); } catch (e) { logger.warn('Switch rejected', e); }
    } else setFromChain(n);
  };

  const handleAmountChange = (val) => {
    setAmount(sanitizeInput(val));
  };

  const handleBridge = useCallback(async () => {
    if (!isConnected) { setBridgeError({ title: 'Wallet Required', message: 'Please connect your wallet to bridge.' }); setShowBridgeFailedModal(true); return; }
    if (!amount || parseFloat(amount) < 1) { setBridgeError({ title: 'Invalid Amount', message: 'Minimum bridge amount is 1 USDC.' }); setShowBridgeFailedModal(true); return; }

    setBridgeLoading(true);
    setBridgeStartTime(Date.now());
    setStopTimer(false);
    bridgeInitiatedRef.current = true;
    initialFromChainRef.current = fromChain;
    initialToChainRef.current = toChain;
    setShowBridgingModal(true);

    const dirMap = {
      'Sepolia': { 'Arc Testnet': 'sepolia-to-arc', 'Base Sepolia': 'sepolia-to-base' },
      'Arc Testnet': { 'Sepolia': 'arc-to-sepolia', 'Base Sepolia': 'arc-to-base' },
      'Base Sepolia': { 'Sepolia': 'base-to-sepolia', 'Arc Testnet': 'base-to-arc' }
    };

    try {
      const direction = dirMap[fromChain][toChain];
      await bridge('USDC', amount, direction);
    } catch (e) {
      setBridgeLoading(false);
      setShowBridgingModal(false);
      setBridgeError({ title: 'Execution Error', message: e.message });
      setShowBridgeFailedModal(true);
    }
  }, [isConnected, amount, fromChain, toChain, bridge]);

  const handleReset = (clear = true) => {
    if (clear) setAmount('');
    setShowBridgingModal(false);
    setShowBridgeSuccessModal(false);
    setShowBridgeFailedModal(false);
    setShowBridgeRejectedModal(false);
    setShowBridgeCancelledModal(false);
    setBridgeLoading(false);
    bridgeInitiatedRef.current = false;
    reset();
  };

  // TIMER
  useEffect(() => {
    let timer;
    if (isBridgeInProgress && !stopTimer) {
      timer = setInterval(() => {
        const start = bridgeStartTime || Date.now();
        setElapsedTime(Math.floor((Date.now() - start) / 1000));
      }, 1000);
    } else {
      clearInterval(timer);
    }
    return () => clearInterval(timer);
  }, [isBridgeInProgress, stopTimer, bridgeStartTime]);

  // SUCCESS HANDLER
  useEffect(() => {
    if (state.step === 'success' && state.sourceTxHash) {
      setSourceTxHash(state.sourceTxHash);
      if (bridgeStartTime) {
        const s = (Date.now() - bridgeStartTime) / 1000;
        setBridgeFinalTime(s > 60 ? `${Math.floor(s / 60)}m ${Math.floor(s % 60)}s` : `${Math.floor(s)}s`);
      }
      setShowBridgingModal(false);
      setShowBridgeSuccessModal(true);

      // Force saving with receiveTxHash if available, otherwise just use sourceTxHash
      saveBridgeTransaction(state.sourceTxHash, 'success', state.receiveTxHash);
      setBridgeStartTime(null);
      refreshBalances();
    }
  }, [state.step, state.sourceTxHash, state.receiveTxHash, bridgeStartTime, refreshBalances, saveBridgeTransaction]);

  // COMPLEMENTARY SYNC: Update destHash if it becomes available later
  useEffect(() => {
    const updateDestHash = async () => {
      if (state.receiveTxHash && sourceTxHash) {
        const saved = await getItem('myTransactions') || [];
        const idx = saved.findIndex(tx => tx.hash === sourceTxHash);
        if (idx !== -1 && !saved[idx].destHash) {
          saved[idx].destHash = state.receiveTxHash;
          await setItem('myTransactions', saved);
          window.dispatchEvent(new CustomEvent('bridgeTransactionSaved'));
        }
      }
    };
    updateDestHash();
  }, [state.receiveTxHash, sourceTxHash]);

  // ERROR HANDLER
  useEffect(() => {
    if (state.step === 'error' && state.error) {
      setShowBridgingModal(false);
      setBridgeError({ title: 'Transfer Failed', message: state.error });
      setShowBridgeFailedModal(true);
      setBridgeLoading(false);
      setBridgeStartTime(null);
    }
  }, [state]);

  const formatTime = (s) => s > 60 ? `${Math.floor(s / 60)}m ${s % 60}s` : `${s}s`;

  const forwardingFee = toChain === 'Sepolia' ? 1.25 : 0.20;
  const receiveAmount = Math.max(0, (parseFloat(amount) || 0) - forwardingFee).toFixed(2);

  if (!mounted) return null;

  return (
    <div className="fixed inset-0 top-[64px] flex flex-col items-center justify-start overflow-y-auto overflow-x-hidden bg-premium-gray custom-scrollbar pb-10 pt-4 sm:pt-12 md:pt-16">
      <div className="w-full max-w-lg">

        <motion.div
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          className="bg-white dark:bg-surface-dark border border-slate-100 dark:border-white/10 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.08)] dark:shadow-[0_32px_64px_-12px_rgba(0,0,0,0.8)] rounded-[2.5rem] overflow-hidden"
        >
          {/* COMPACT INTERACTIVE HEADER */}
          <div className="px-5 sm:px-8 pt-6 sm:pt-8 pb-4 flex items-center justify-between border-b border-slate-100 dark:border-white/5">
            <div className="space-y-1">
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tighter leading-none font-['Satoshi','Inter',sans-serif]">{t('Bridge Assets')}</h2>
            </div>
            <button
              onClick={() => switchChainAsync({ chainId: 5042002 })}
              className="px-3 sm:px-4 py-1.5 sm:py-2 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-[10px] sm:text-[11px] items-center gap-2 group transition-all hover:bg-slate-100 dark:hover:bg-white/10 flex text-slate-500 dark:text-slate-300 font-mono"
            >
              <Wallet size={12} className="group-hover:translate-x-0.5 transition-transform" />
              <span>{t('Add Arc')}</span>
            </button>
          </div>

          <div className="p-5 sm:p-8 pt-4 sm:pt-6 space-y-6 sm:space-y-8">
            {/* DUAL-INPUT DESIGN */}
            <div className="space-y-4">
              <div className="grid grid-cols-[1fr,42px,1fr] sm:grid-cols-[1fr,48px,1fr] items-end gap-2 sm:gap-3 relative">
                <div className="space-y-1.5">
                  <label className="text-[9px] sm:text-[10px] uppercase font-mono tracking-[0.2em] text-slate-500 dark:text-slate-300 px-1">{t('Source')}</label>
                  <button
                    onClick={() => !isBridgeInProgress && setShowChainSelector('from')}
                    className="w-full flex items-center justify-between px-3.5 sm:px-4.5 py-3 sm:py-3.5 group bg-slate-50/50 dark:bg-white/[0.04] border border-slate-100 dark:border-white/[0.08] rounded-2xl hover:border-slate-300 dark:hover:border-white/20 transition-all active:scale-[0.98] outline-none h-11 sm:h-12"
                  >
                    <div className="flex items-center gap-2 sm:gap-2.5 overflow-hidden">
                      <img
                        src={Object.values(NETWORKS).find(n => n.chainName === fromChain || n.chainName.includes(fromChain))?.iconUrl}
                        className="w-3.5 sm:w-4 h-3.5 sm:h-4 object-contain shrink-0"
                        alt=""
                      />
                      <span className="text-[13px] sm:text-sm font-['Satoshi','Inter',sans-serif] text-slate-900 dark:text-white truncate">{fromChain}</span>
                    </div>
                    <ChevronDown size={10} className="text-slate-300 group-hover:text-slate-500 transition-colors shrink-0" />
                  </button>
                </div>

                <div className="flex justify-center">
                  <button
                    onClick={async () => {
                      if (isBridgeInProgress) return;
                      const f = fromChain;
                      const t = toChain;
                      if (isConnected) {
                        try {
                          await switchChainAsync({ chainId: getChainIdByName(t) });
                          setFromChain(t);
                          setToChain(f);
                        } catch (e) {
                          logger.warn('Swap rejected', e);
                        }
                      } else {
                        setFromChain(t);
                        setToChain(f);
                      }
                    }}
                    disabled={isBridgeInProgress}
                    className="w-10 sm:w-12 h-11 sm:h-12 flex items-center justify-center rounded-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all active:scale-90 shadow-sm dark:shadow-none"
                  >
                    <ArrowRight size={16} sm:size={18} strokeWidth={2.5} />
                  </button>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[9px] sm:text-[10px] uppercase font-mono tracking-[0.2em] text-slate-500 dark:text-slate-300 px-1">{t('Destination')}</label>
                  <button
                    onClick={() => !isBridgeInProgress && setShowChainSelector('to')}
                    className="w-full flex items-center justify-between px-3.5 sm:px-4.5 py-3 sm:py-3.5 group bg-slate-50/50 dark:bg-white/[0.04] border border-slate-100 dark:border-white/[0.08] rounded-2xl hover:border-slate-300 dark:hover:border-white/20 transition-all active:scale-[0.98] outline-none"
                  >
                    <div className="flex items-center gap-2 sm:gap-2.5 overflow-hidden">
                      <img
                        src={Object.values(NETWORKS).find(n => n.chainName === toChain || n.chainName.includes(toChain))?.iconUrl}
                        className="w-3.5 sm:w-4 h-3.5 sm:h-4 object-contain shrink-0"
                        alt=""
                      />
                      <span className="text-[13px] sm:text-sm font-['Satoshi','Inter',sans-serif] text-slate-900 dark:text-white truncate">{toChain}</span>
                    </div>
                    <ChevronDown size={10} className="text-slate-300 group-hover:text-indigo-500 transition-colors shrink-0" />
                  </button>
                </div>
              </div>
            </div>

            {/* AMOUNT CARD */}
            <div className="p-4 sm:p-6 bg-slate-50/50 dark:bg-white/[0.04] border border-slate-100 dark:border-white/5 rounded-[1.5rem] sm:rounded-[2rem] space-y-3 sm:space-y-4 group/well transition-all duration-300 hover:bg-slate-100/50 dark:hover:bg-white/[0.06]">
              <div className="flex items-center justify-between">
                <label className="text-[9px] sm:text-[10px] uppercase font-mono tracking-[0.2em] text-slate-500 dark:text-slate-300">{t('Amount')}</label>
              </div>

              <div className="flex items-end justify-between gap-2 sm:gap-4">
                <input
                  type="text"
                  inputMode="decimal"
                  value={amount}
                  onChange={(e) => handleAmountChange(e.target.value)}
                  placeholder="0.00"
                  className="w-full min-w-0 bg-transparent text-3xl sm:text-5xl font-['Satoshi','Inter',sans-serif] font-semibold leading-none text-slate-900 dark:text-white outline-none placeholder:text-slate-200 dark:placeholder:text-white/5 tracking-tight"
                />
                <div className="shrink-0 flex items-center gap-1.5 sm:gap-2.5 px-2.5 sm:px-3 py-1.5 sm:py-1.5 bg-white dark:bg-white/10 rounded-xl border border-slate-200 dark:border-white/10 shadow-sm">
                  <img src="/icons/usdc.png" className="w-4 h-4 sm:w-5 sm:h-5" alt="USDC" />
                  <span className="text-[11px] sm:text-[13px] font-bold text-slate-900 dark:text-white tracking-tight">USDC</span>
                </div>
              </div>

              <div className="flex items-center justify-between gap-3 pt-1">
                <div className="flex gap-1.5 sm:gap-2">
                  {['25%', '50%', 'MAX'].map(p => (
                    <button
                      key={p}
                      onClick={() => {
                        if (!tokenBalance) return;
                        const bal = parseFloat(tokenBalance);
                        if (p === 'MAX') setAmount(Math.max(0, bal - 0.01).toFixed(2));
                        else setAmount((bal * parseInt(p) / 100).toFixed(2));
                      }}
                      className="flex-1 sm:flex-none px-2.5 sm:px-4 py-1.5 font-mono text-[9px] sm:text-[10px] tracking-widest uppercase border border-slate-200 dark:border-white/10 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 transition-all text-slate-500 hover:text-slate-900 dark:hover:text-white"
                    >
                      {p}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-1.5 font-mono text-[9px] sm:text-[10px] text-slate-500 dark:text-slate-300">
                  <span>BAL:</span>
                  <span className="text-slate-900 dark:text-slate-200">
                    {isLoadingBalance ? (
                      <div className="w-10 h-3 bg-slate-200 dark:bg-white/10 rounded-sm animate-pulse" />
                    ) : (
                      Number(tokenBalance || 0).toFixed(2)
                    )}
                  </span>
                </div>
              </div>
            </div>

            {/* BRIDGE DETAILS (FLAT LIST) */}
            <div className="space-y-4 px-1 pt-2 border-t border-slate-100 dark:border-white/5">
              <div className="flex items-center justify-between text-[11px] sm:text-[12px] text-slate-500 dark:text-slate-300">
                <div className="flex items-center gap-1.5 font-['Satoshi','Inter',sans-serif]">
                  <Info size={12} className="opacity-70" />
                  <span>Relayer Execution Fee</span>
                </div>
                <span className="font-mono text-slate-700 dark:text-white">{forwardingFee.toFixed(2)} USDC</span>
              </div>
              <div className="flex items-center justify-between text-[11px] sm:text-[12px] text-slate-500 dark:text-slate-300">
                <div className="flex items-center gap-1.5 font-['Satoshi','Inter',sans-serif]">
                  <Info size={12} className="opacity-70" />
                  <span>Est. Confirmation Time</span>
                </div>
                <span className="font-mono text-slate-700 dark:text-white">~18s</span>
              </div>
              <div className="pt-3 border-t border-slate-100 dark:border-white/5 flex items-center justify-between">
                <span className="text-[10px] uppercase font-mono tracking-[0.2em] text-slate-500 dark:text-slate-300">{t('Est. Received')}</span>
                <span className="text-sm sm:text-base font-mono text-slate-700 dark:text-white tabular-nums tracking-tight">
                  {receiveAmount} USDC
                </span>
              </div>
            </div>

            {/* ACTION BUTTON — FLAT BRAND STYLE */}
            <div className="pt-2">
              <button
                onClick={handleBridge}
                disabled={!amount || isBridgeInProgress || (parseFloat(amount) > parseFloat(tokenBalance || '0'))}
                className={`w-full h-12 sm:h-14 rounded-2xl text-[15px] sm:text-[16px] font-bold tracking-tight transition-all relative overflow-hidden group active:scale-95 flex items-center justify-center gap-2.5 ${!amount
                    ? 'bg-slate-100 dark:bg-white/5 text-slate-300 cursor-not-allowed border border-slate-200 dark:border-white/10'
                    : isBridgeInProgress
                      ? 'bg-indigo-500/10 dark:bg-indigo-600/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20'
                      : 'bg-[#6366F1] dark:bg-indigo-600 text-white hover:brightness-110 active:scale-[0.98]'
                  }`}
              >
                <div className="relative z-10 flex items-center justify-center gap-2.5">
                  {status === 'disconnected' ? (
                    <><Wallet size={16} sm:size={18} /><span>Connect Wallet</span></>
                  ) : bridgeLoading || isBridgeInProgress ? (
                    <><Loader size={16} sm:size={18} className="animate-spin text-indigo-500 shadow-brand" /><span>{t('Bridging')}...</span></>
                  ) : (
                    <span>Bridge</span>
                  )}
                </div>
              </button>
            </div>
          </div>
        </motion.div>
      </div>



      <ChainSelector
        isOpen={showChainSelector === 'from'}
        onClose={() => setShowChainSelector(null)}
        selectedChain={fromChain}
        onSelect={handleNetworkChange}
        exclude={toChain}
      />
      <ChainSelector
        isOpen={showChainSelector === 'to'}
        onClose={() => setShowChainSelector(null)}
        selectedChain={toChain}
        onSelect={(n) => !isBridgeInProgress && setToChain(n)}
        exclude={fromChain}
      />

      {/* MODALS TRANSFERRED FROM PREVIOUS VERSION */}
      <BridgingModal isOpen={showBridgingModal} onClose={() => setShowBridgingModal(false)} fromChain={initialFromChainRef.current || fromChain} toChain={initialToChainRef.current || toChain} amount={amount} startTime={bridgeStartTime} state={state} stopTimer={stopTimer} onClaim={claim} />
      <BridgeFailedModal isOpen={showBridgeFailedModal} onClose={() => handleReset(false)} onRetry={handleBridge} fromChain={fromChain} toChain={toChain} errorTitle={bridgeError.title} errorMessage={bridgeError.message} state={state} />
      <BridgeSuccessModal
        isOpen={showBridgeSuccessModal}
        onClose={() => handleReset(true)}
        fromChain={fromChain}
        toChain={toChain}
        amount={state.result?.amount || amount}
        timeTaken={bridgeFinalTime}
        sourceTxHash={sourceTxHash}
        destTxHash={state.receiveTxHash}
      />
      <BridgeRejectedModal isOpen={showBridgeRejectedModal} onClose={() => handleReset(false)} fromChain={fromChain} toChain={toChain} />
      <BridgeCancelledModal isOpen={showBridgeCancelledModal} onClose={() => handleReset(false)} fromChain={fromChain} toChain={toChain} />
    </div>
  );
};

export default memo(Bridge);