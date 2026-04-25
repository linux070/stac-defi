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

  const chainList = ['Arc Testnet', 'Sepolia', 'Base Sepolia'];
  const filteredChains = chainList.filter(chain => chain.toLowerCase().includes(searchQuery.toLowerCase()));

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[100000] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="w-full max-w-[420px] bg-white dark:bg-[#0B0F1A] rounded-[28px] overflow-hidden border border-slate-200 dark:border-white/10 shadow-[0_24px_48px_-12px_rgba(0,0,0,0.15)] dark:shadow-[0_24px_48px_-12px_rgba(0,0,0,0.5)]"
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 400 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* HEADER */}
            <div className="px-6 py-5 flex items-center justify-between border-b border-slate-100 dark:border-white/5">
              <h3 className="text-[17px] font-semibold text-slate-900 dark:text-white font-geist tracking-tight">
                {t('Select Network')}
              </h3>
              <button
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-full text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 active:scale-95 transition-all"
              >
                <X size={18} />
              </button>
            </div>

            {/* SEARCH */}
            <div className="px-5 pt-4 pb-2">
              <div className="relative">
                <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-300 dark:text-white/20" />
                <input
                  ref={chainSearchRef}
                  type="text"
                  placeholder={t('Search networks...')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/5 rounded-xl pl-10 pr-4 py-2.5 text-[13px] text-slate-900 dark:text-white outline-none focus:border-indigo-500/30 dark:focus:border-indigo-500/20 transition-colors font-mono placeholder:text-slate-400 dark:placeholder:text-white/15"
                />
              </div>
            </div>

            {/* NETWORK LIST */}
            <div className="px-3 pb-4 pt-1">
              <div className="space-y-0.5">
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
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        delay: 0.05 + (i * 0.04),
                        type: 'spring',
                        damping: 22,
                        stiffness: 350
                      }}
                      onClick={() => !isExcluded && (onSelect(name), onClose())}
                      className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl transition-all duration-150 ${
                        isSelected
                          ? 'bg-indigo-50/60 dark:bg-indigo-500/10 ring-1 ring-inset ring-indigo-500/20'
                          : isExcluded
                            ? 'opacity-35 cursor-not-allowed'
                            : 'hover:bg-slate-50 dark:hover:bg-white/[0.03] active:scale-[0.99]'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 overflow-hidden ${
                          isSelected
                            ? 'bg-white dark:bg-white/10 border border-indigo-200 dark:border-indigo-500/30'
                            : 'bg-white dark:bg-white/5 border border-slate-100 dark:border-white/10'
                        }`}>
                          <img
                            src={chainCfg?.iconUrl}
                            alt={name}
                            className="w-5 h-5 object-contain"
                          />
                        </div>
                        <div className="text-left min-w-0">
                          <p className={`text-[14px] font-geist font-medium tracking-tight truncate ${
                            isSelected ? 'text-indigo-700 dark:text-indigo-300' : 'text-slate-900 dark:text-white'
                          }`}>
                            {name}
                          </p>
                          <p className="text-[9px] text-slate-400 font-mono uppercase tracking-[0.15em] mt-0.5">
                            {chainCfg?.isMainnet ? 'Mainnet' : 'Testnet'}
                          </p>
                        </div>
                      </div>

                      {/* RIGHT INDICATOR */}
                      {isSelected ? (
                        <Check size={16} className="text-indigo-500 shrink-0" strokeWidth={2.5} />
                      ) : isExcluded ? (
                        <span className="text-[9px] font-mono text-slate-400 uppercase tracking-widest shrink-0">
                          {t('Active')}
                        </span>
                      ) : null}
                    </motion.button>
                  );
                })}
              </div>
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
    <div className="fixed inset-0 top-[64px] flex flex-col items-center justify-start sm:justify-start overflow-y-auto overflow-x-hidden bg-transparent custom-scrollbar pb-10 pt-4 sm:pt-12 md:pt-16">
      <div className="w-full max-w-[540px] px-2 sm:px-4">

        <motion.div
          initial={{ opacity: 0, scale: 0.98, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="bg-white/95 dark:bg-[#0B0F1A]/95 backdrop-blur-2xl border border-[#EAEAEA] dark:border-white/5 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] dark:shadow-[0_32px_64px_-16px_rgba(0,0,0,0.4)] rounded-[1.75rem] sm:rounded-[2.5rem] overflow-hidden"
        >
          {/* COMPACT INTERACTIVE HEADER */}
          <div className="px-5 sm:px-8 pt-6 sm:pt-8 pb-4 flex items-center justify-between border-b border-slate-100 dark:border-white/5">
            <div className="space-y-1">
              <h2 className="text-xl sm:text-2xl font-geist font-semibold text-slate-900 dark:text-white tracking-tight leading-none">{t('Bridge Assets')}</h2>
            </div>
            <button
              onClick={() => switchChainAsync({ chainId: 5042002 })}
              className="px-3 sm:px-4 py-1.5 sm:py-2 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-[10px] sm:text-[11px] items-center gap-2 group transition-all hover:bg-slate-100 dark:hover:bg-white/10 flex text-slate-500 dark:text-slate-400 font-mono"
            >
              <Wallet size={12} className="group-hover:translate-x-0.5 transition-transform" />
              <span>Add Arc</span>
            </button>
          </div>

          <div className="p-5 sm:p-8 pt-4 sm:pt-6 space-y-6 sm:space-y-8">
            {/* DUAL-INPUT DESIGN */}
            <div className="space-y-4">
              <div className="grid grid-cols-[1fr,42px,1fr] sm:grid-cols-[1fr,48px,1fr] items-end gap-2 sm:gap-3 relative">
                <div className="space-y-1.5">
                  <label className="text-[9px] sm:text-[10px] uppercase font-mono tracking-[0.2em] text-slate-400 px-1">{t('Source')}</label>
                  <button
                    onClick={() => !isBridgeInProgress && setShowChainSelector('from')}
                    className="w-full flex items-center justify-between px-2.5 sm:px-3.5 py-2.5 sm:py-3 group bg-slate-50/50 dark:bg-white/[0.03] border border-slate-100 dark:border-white/5 rounded-2xl hover:border-indigo-500/30 transition-all active:scale-[0.98] focus:ring-1 focus:ring-indigo-500/50 outline-none h-11 sm:h-12"
                  >
                    <div className="flex items-center gap-2 sm:gap-2.5 overflow-hidden">
                      <img
                        src={Object.values(NETWORKS).find(n => n.chainName === fromChain || n.chainName.includes(fromChain))?.iconUrl}
                        className="w-3.5 sm:w-4 h-3.5 sm:h-4 object-contain shrink-0"
                        alt=""
                      />
                      <span className="text-[13px] sm:text-sm font-geist text-slate-900 dark:text-white truncate">{fromChain}</span>
                    </div>
                    <ChevronDown size={10} className="text-slate-400 group-hover:text-indigo-500 transition-colors shrink-0" />
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
                    className="w-10 sm:w-12 h-11 sm:h-12 flex items-center justify-center rounded-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all active:scale-90 shadow-sm dark:shadow-none"
                  >
                    <ArrowRight size={16} sm:size={18} strokeWidth={2.5} />
                  </button>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[9px] sm:text-[10px] uppercase font-mono tracking-[0.2em] text-slate-400 px-1">{t('Destination')}</label>
                  <button
                    onClick={() => !isBridgeInProgress && setShowChainSelector('to')}
                    className="w-full flex items-center justify-between px-2.5 sm:px-3.5 py-2.5 sm:py-3 group bg-slate-50/50 dark:bg-white/[0.03] border border-slate-100 dark:border-white/5 rounded-2xl hover:border-indigo-500/30 transition-all active:scale-[0.98] focus:ring-1 focus:ring-indigo-500/50 outline-none"
                  >
                    <div className="flex items-center gap-2 sm:gap-2.5 overflow-hidden">
                      <img
                        src={Object.values(NETWORKS).find(n => n.chainName === toChain || n.chainName.includes(toChain))?.iconUrl}
                        className="w-3.5 sm:w-4 h-3.5 sm:h-4 object-contain shrink-0"
                        alt=""
                      />
                      <span className="text-[13px] sm:text-sm font-geist text-slate-900 dark:text-white truncate">{toChain}</span>
                    </div>
                    <ChevronDown size={10} className="text-slate-400 group-hover:text-indigo-500 transition-colors shrink-0" />
                  </button>
                </div>
              </div>
            </div>

            {/* AMOUNT CARD */}
            <div className="p-4 sm:p-6 bg-slate-50/50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 rounded-[1.25rem] sm:rounded-[2rem] space-y-3 sm:space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-[9px] sm:text-[10px] uppercase font-mono tracking-[0.2em] text-slate-400">{t('Amount')}</label>
              </div>

              <div className="flex items-end justify-between gap-2 sm:gap-4">
                <input
                  type="text"
                  inputMode="decimal"
                  value={amount}
                  onChange={(e) => setAmount(sanitizeInput(e.target.value))}
                  placeholder="0.00"
                  className="w-full bg-transparent text-3xl sm:text-5xl font-geist font-semibold leading-none text-slate-900 dark:text-white outline-none placeholder:text-slate-200 dark:placeholder:text-white/5 tracking-tight"
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
                <div className="flex items-center gap-1.5 font-mono text-[9px] sm:text-[10px] text-slate-400">
                  <span>BAL</span>
                  <span className="text-slate-900 dark:text-slate-200">
                    {isLoadingBalance ? '...' : Number(tokenBalance || 0).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* TRANSFER SUMMARY */}
            <div className="space-y-3 px-1 pt-1 sm:pt-2">
              <div className="flex items-center justify-between text-[11px] sm:text-[12px] text-slate-500 dark:text-slate-400">
                <div className="flex items-center gap-1.5">
                  <Info size={11} sm:size={12} className="text-slate-300" />
                  <span className="font-geist">Relayer Execution Fee</span>
                </div>
                <span className="font-mono text-slate-600 dark:text-slate-300">{forwardingFee.toFixed(2)} USDC</span>
              </div>
              <div className="flex items-center justify-between text-[11px] sm:text-[12px] text-slate-500 dark:text-slate-400">
                <div className="flex items-center gap-1.5">
                  <Info size={11} sm:size={12} className="text-slate-300" />
                  <span className="font-geist">Est. Confirmation Time</span>
                </div>
                <span className="font-mono text-slate-600 dark:text-slate-300">~18s</span>
              </div>
              <div className="flex items-center justify-between pt-3 sm:pt-4 border-t border-slate-100 dark:border-white/5">
                <span className="text-[9px] sm:text-[10px] uppercase font-mono tracking-[0.2em] text-slate-400">{t('Est. Received')}</span>
                <span className="text-sm sm:text-base font-mono text-slate-700 dark:text-slate-200 tracking-tight">
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
                    ? 'bg-slate-100 dark:bg-white/5 text-slate-400 cursor-not-allowed border border-slate-200 dark:border-white/10'
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