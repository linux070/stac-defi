// =============================================================================
// SWAP PAGE — PREMIUM UTILITARIAN MINIMALISM
// Institutional Standard / Ethereal Glass / Satoshi Font Stack
// =============================================================================

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useWallet } from '../hooks/useWallet';
import { useAccount } from 'wagmi';
import { ArrowDownUp, Wallet, ChevronDown, Check, Info, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { TOKENS } from '../config/networks';

import { sanitizeInput } from '../utils/blockchain';
import { CHAINS } from '../config/constants';

import useMultiChainBalances from '../hooks/useMultiChainBalances';
import Toast from '../components/Toast';
import { useSwap } from '../hooks/useSwap';
import { getItem, setItem } from '../utils/indexedDB';
import SwapSuccessModal from '../components/SwapSuccessModal';
import SwapFailedModal from '../components/SwapFailedModal';
import SwapRejectedModal from '../components/SwapRejectedModal';
import '../styles/bridge-styles.css';
import { useModal } from '../contexts/ModalContext';
import { logger } from '../utils/logger';


// =============================================================================
// TOKEN ICON HELPER
// =============================================================================
const getTokenIcon = (symbol) => {
  if (!symbol) return null;
  const s = String(symbol).toUpperCase();
  const iconMap = {
    USDC: '/icons/usdc.png',
    STC: '/icons/stc.png',
    STAC: '/icons/stc.png',
    BALL: '/icons/ball.png',
    MTB: '/icons/mtb.png',
    ECR: '/icons/ecr.png',
    EURC: '/icons/eurc.png',
    ETH: '/icons/eth.png',
  };
  if (s.includes('MTB')) return '/icons/mtb.png';
  if (s.includes('STC') || s.includes('STAC')) return '/icons/stc.png';
  return iconMap[s] || null;
};


// =============================================================================
// TOKEN PILL (Static Badge)
// =============================================================================
const TokenPill = ({ symbol }) => {
  const icon = getTokenIcon(symbol);
  return (
    <div className="shrink-0 flex items-center gap-2 pl-2 pr-3 py-1.5 bg-white dark:bg-white/[0.06] rounded-full border border-slate-200/80 dark:border-white/[0.08] shadow-[0_1px_3px_rgba(0,0,0,0.04)] dark:shadow-none transition-all duration-200">
      <div className="w-6 h-6 rounded-full bg-slate-50 dark:bg-white/[0.04] border border-slate-100 dark:border-white/[0.06] flex items-center justify-center overflow-hidden">
        {icon ? (
          <img src={icon} alt={symbol} className="w-4 h-4 object-contain" />
        ) : (
          <span className="text-[9px] font-bold font-mono">{symbol?.charAt(0)}</span>
        )}
      </div>
      <span className="text-[13px] font-['Satoshi','Inter',sans-serif] font-semibold text-slate-900 dark:text-white tracking-tight">{symbol}</span>
    </div>
  );
};


// =============================================================================
// MAIN SWAP COMPONENT
// =============================================================================
const Swap = () => {
  const { t } = useTranslation();
  const { isConnected, chainId, status } = useWallet();
  const { address } = useAccount();
  const { setIsFocusedModalOpen } = useModal();

  const wasConnectedRef = useRef(
    typeof window !== 'undefined' ? localStorage.getItem('walletConnected') === 'true' : false
  );
  const wasConnected = wasConnectedRef.current;

  // ── Token State ──
  const [fromToken, setFromToken] = useState('USDC');
  const [toToken, setToToken] = useState('EURC');

  // ── Amount State ──
  const [fromAmount, setFromAmount] = useState('');
  const [toAmount, setToAmount] = useState('');
  const [lastEditedField, setLastEditedField] = useState('from');
  const [debouncedFromAmount, setDebouncedFromAmount] = useState('');
  const [slippage, setSlippage] = useState(0.5);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedFromAmount(fromAmount);
      // Immediately clear both sides if fromAmount is empty
      if (!fromAmount || fromAmount === '') {
        setToAmount('');
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [fromAmount]);


  // ── UI State ──
  const [showSlippage, setShowSlippage] = useState(false);
  const [showQuoteDetails, setShowQuoteDetails] = useState(false);
  const [showSwapSuccessModal, setShowSwapSuccessModal] = useState(false);
  const [showSwapFailedModal, setShowSwapFailedModal] = useState(false);
  const [showSwapRejectedModal, setShowSwapRejectedModal] = useState(false);
  const [lastSwapTxHash, setLastSwapTxHash] = useState(null);
  const [swapError, setSwapError] = useState(null);
  const [frozenSwapData, setFrozenSwapData] = useState(null);
  const [toast, setToast] = useState({ visible: false, type: 'info', message: '' });
  const savedHashesRef = useRef(new Set());


  const showToast = (type, message, duration = 3000) => {
    setToast({ visible: true, type, message });
    setTimeout(() => setToast({ visible: false, type: 'info', message: '' }), duration);
  };

  // ── Focused Modal Sync ──
  useEffect(() => {
    const anyOpen = showSwapSuccessModal || showSwapFailedModal || showSwapRejectedModal || showQuoteDetails;
    setIsFocusedModalOpen(anyOpen);
    return () => setIsFocusedModalOpen(false);
  }, [showSwapSuccessModal, showSwapFailedModal, showSwapRejectedModal, showQuoteDetails, setIsFocusedModalOpen]);

  // ── Slippage Click-Away ──
  useEffect(() => {
    if (!showSlippage) return;
    const handleGlobalClick = () => setShowSlippage(false);
    document.addEventListener('click', handleGlobalClick);
    return () => document.removeEventListener('click', handleGlobalClick);
  }, [showSlippage]);

  // ── Quote Details Click-Away ──
  useEffect(() => {
    if (!showQuoteDetails) return;
    const handleGlobalClick = () => setShowQuoteDetails(false);
    document.addEventListener('click', handleGlobalClick);
    return () => document.removeEventListener('click', handleGlobalClick);
  }, [showQuoteDetails]);

  // ── Token Objects ──
  const fromTokenObj = useMemo(() => TOKENS[fromToken], [fromToken]);
  const toTokenObj = useMemo(() => TOKENS[toToken], [toToken]);

  // ── Unified Swap & Quote ──
  const swapState = useSwap(fromToken, toToken, debouncedFromAmount, slippage);
  const { bestQuote } = swapState;

  // ── Balance Hooks ──
  const { balances: multiChainBalances } = useMultiChainBalances(address, isConnected);

  const getFullBalanceData = (symbol) => {
    const cidNum = chainId ? (typeof chainId === 'string' ? parseInt(chainId, 16) : chainId) : null;
    const isArc = cidNum === 5042002;

    if (symbol === 'USDC') {
      if (isArc) return { balance: multiChainBalances?.arcTestnet?.usdc || '0.00', loading: multiChainBalances?.arcTestnet?.loading || false };
      if (cidNum === 11155111) return { balance: multiChainBalances?.sepolia?.usdc || '0.00', loading: multiChainBalances?.sepolia?.loading || false };
      if (cidNum === 84532) return { balance: multiChainBalances?.baseSepolia?.usdc || '0.00', loading: multiChainBalances?.baseSepolia?.loading || false };
    }

    if (symbol === 'EURC' && isArc) {
      return { balance: multiChainBalances?.arcTestnet?.eurc || '0.00', loading: multiChainBalances?.arcTestnet?.loading || false };
    }

    return { balance: '0.00', loading: false };
  };

  const fromBalanceData = getFullBalanceData(fromToken);
  const toBalanceData = getFullBalanceData(toToken);

  const fromBalance = fromBalanceData.balance;
  const fromLoading = fromBalanceData.loading;
  const toBalance = toBalanceData.balance;
  const toLoading = toBalanceData.loading;



  // ── Reset tokens on chain switch ──
  useEffect(() => {
    const noETHChains = ['0x4cef52', '0xaa36a7'];
    if (noETHChains.includes(chainId)) {
      if (fromToken === 'ETH') setFromToken('USDC');
      if (toToken === 'ETH') setToToken('USDC');
    }
  }, [chainId, fromToken, toToken]);

  // ── Sync "To" amount from swap quote ──
  useEffect(() => {
    // Sync toAmount when expectedOut changes from hook
    const isFromEmpty = !fromAmount || fromAmount === '';

    // Prevent flickering: wait until debounced amount catches up with user typing
    if (fromAmount !== debouncedFromAmount) return;

    if (!swapState.isLoading && lastEditedField === 'from') {
      if (!isFromEmpty && swapState.expectedOut && swapState.expectedOut !== '0' && swapState.expectedOut !== '0.00' && swapState.expectedOut !== '0.0000') {
        // Use 4 decimal places for precision visibility
        const val = parseFloat(swapState.expectedOut).toFixed(4);
        if (val !== parseFloat(toAmount || 0).toFixed(4)) {
          setToAmount(val);
        }
      } else if (isFromEmpty) {
        // Force clear toAmount if fromAmount is empty
        if (toAmount !== '') setToAmount('');
      }
    }
  }, [swapState.expectedOut, swapState.isLoading, fromAmount, debouncedFromAmount, lastEditedField, toAmount]);

  // =============================================================================
  // EVENT HANDLERS
  // =============================================================================
  const handleFromAmountChange = (val) => {
    const sanitized = sanitizeInput(val);
    setLastEditedField('from');
    setFromAmount(sanitized);

    // FAST-PATH: Calculate Circle fee instantly in UI for smoothness
    if (sanitized && parseFloat(sanitized) > 0) {
      const amount = parseFloat(sanitized);
      const isCirclePair = (fromToken === 'USDC' && toToken === 'EURC') || (fromToken === 'EURC' && toToken === 'USDC');

      if (isCirclePair) {
        // Official Arc Provider Fee: 0.02% (2 basis points)
        const result = (amount * 0.9998).toFixed(4);
        setToAmount(result);
      }
    } else {
      setToAmount('');
    }
  };


  const handleToAmountChange = (val) => {
    const sanitized = sanitizeInput(val);
    setLastEditedField('to');
    setToAmount(sanitized);

    if (sanitized && parseFloat(sanitized) > 0 && swapState.price && parseFloat(swapState.price) > 0) {
      const price = parseFloat(swapState.price);
      const isBuying = fromToken === 'USDC';
      const calcFrom = isBuying
        ? (parseFloat(sanitized) * price).toFixed(4)
        : (parseFloat(sanitized) / price).toFixed(4);
      setFromAmount(calcFrom);
    } else {
      setFromAmount('');
    }
  };

  const handleSwitch = () => {
    const newFromToken = toToken;
    const newToToken = fromToken;
    const newFromAmount = toAmount;

    setFromToken(newFromToken);
    setToToken(newToToken);
    setFromAmount(newFromAmount);

    // Re-calculate instantly on switch
    if (newFromAmount && parseFloat(newFromAmount) > 0) {
      const amount = parseFloat(newFromAmount);
      const isCirclePair = (newFromToken === 'USDC' && newToToken === 'EURC') || (newFromToken === 'EURC' && newToToken === 'USDC');
      if (isCirclePair) {
        // Apply 0.02% provider fee and 4 decimals
        setToAmount((amount * 0.9998).toFixed(4));
      }
    } else {
      setToAmount('');
    }
  };

  const handleMaxClick = (side = 'from') => {
    const bal = side === 'from' ? fromBalance : toBalance;
    if (!bal || parseFloat(bal) === 0) {
      showToast('warning', t('No balance available'));
      return;
    }

    if (side === 'from') {
      const cidNum = chainId ? (typeof chainId === 'string' ? parseInt(chainId, 16) : chainId) : null;
      if (cidNum === CHAINS.ARC_TESTNET && fromToken === 'USDC') {
        const balance = parseFloat(bal);
        const buffer = 1.5;
        if (balance <= buffer) {
          showToast('error', `Insufficient balance for gas. Keep at least ${buffer} USDC for Arc fees.`);
          return;
        }
        setFromAmount((balance - buffer).toFixed(2));
      } else {
        setFromAmount(parseFloat(bal).toFixed(2));
      }
    } else {
      handleToAmountChange(bal);
    }
  };

  const handlePercentClick = (percent, side = 'from') => {
    const bal = side === 'from' ? fromBalance : toBalance;
    if (!bal || parseFloat(bal) === 0) return;
    const b = parseFloat(bal);
    if (percent === 'MAX') {
      handleMaxClick(side);
    } else {
      const pct = parseInt(percent) / 100;
      const val = (b * pct).toFixed(2);
      if (side === 'from') {
        setLastEditedField('from');
        setFromAmount(val);
      } else {
        handleToAmountChange(val);
      }
    }
  };

  const handleFaucetClick = (e) => {
    e.preventDefault();
    window.open('https://faucet.circle.com/', '_blank');
  };

  const handleSwapError = useCallback((error) => {
    const errorMsg = swapState.error || error?.message || error?.toString() || '';
    const lower = errorMsg.toLowerCase();

    const isRejection =
      lower.includes('user rejected') ||
      lower.includes('user denied') ||
      lower.includes('action_rejected') ||
      lower.includes('request rejected') ||
      lower.includes('rejected by user') ||
      error?.name === 'UserRejectedRequestError' ||
      error?.code === 4001;

    setSwapError(errorMsg);

    if (isRejection) {
      setShowSwapRejectedModal(true);
    } else {
      setShowSwapFailedModal(true);
    }

    if (swapState.reset) swapState.reset();
  }, [swapState]);

  const handleSwapSuccess = useCallback((txHash) => {
    if (!txHash || savedHashesRef.current.has(txHash)) return;

    const frozen = {
      fromToken: fromTokenObj,
      toToken: toTokenObj,
      fromAmount,
      toAmount: swapState.actualAmountOut || swapState.expectedOut || toAmount,
    };

    setLastSwapTxHash(txHash);
    setFrozenSwapData(frozen);
    setShowSwapSuccessModal(true);

    setFromAmount('');
    setToAmount('');

    if (txHash && address) {
      const logTransaction = async () => {
        try {
          // Double-lock: session & persistent
          savedHashesRef.current.add(txHash);
          const history = await getItem('myTransactions') || [];
          const alreadySaved = history.some(tx => tx.hash === txHash);

          if (!alreadySaved) {
            const newTx = {
              id: txHash,
              hash: txHash,
              type: 'Swap',
              from: `${frozen.fromAmount} ${frozen.fromToken?.symbol}`,
              to: `${frozen.toAmount} ${frozen.toToken?.symbol}`,
              amount: `${frozen.fromAmount} ${frozen.fromToken?.symbol} → ${frozen.toAmount} ${frozen.toToken?.symbol}`,
              timestamp: Date.now(),
              status: 'success',
              address: address.toLowerCase(),
              chainId,
            };
            await setItem('myTransactions', [newTx, ...history].slice(0, 100));
            window.dispatchEvent(new CustomEvent('swapTransactionSaved'));
          }
        } catch (err) {
          logger.error('Failed to save swap transaction to history:', err);
        }
      };
      logTransaction();
    }

    if (swapState.reset) swapState.reset();
  }, [fromTokenObj, toTokenObj, fromAmount, swapState, toAmount, address, chainId]);

  const handleSwapClick = async () => {
    if (!isConnected) {
      showToast('error', t('connectWalletFirst'));
      return;
    }
    if (!fromAmount || parseFloat(fromAmount) <= 0) {
      showToast('error', t('Please enter a valid amount'));
      return;
    }

    try {
      if (swapState.needsApproval) {
        await swapState.handleApprove();
      } else {
        await swapState.handleSwap();
      }
    } catch (err) {
      handleSwapError(err);
    }
  };

  useEffect(() => {
    if (swapState.swapSuccess && swapState.txHash) {
      handleSwapSuccess(swapState.txHash);
    }
  }, [swapState.swapSuccess, swapState.txHash, handleSwapSuccess]);



  useEffect(() => {
    if (swapState.error) {
      handleSwapError(swapState.error);
    }
  }, [swapState.error, handleSwapError]);


  // =============================================================================
  // RENDER
  // =============================================================================
  return (
    <div className="fixed inset-0 top-[64px] flex flex-col items-center justify-start overflow-y-auto overflow-x-hidden bg-premium-gray custom-scrollbar pb-10 pt-4 sm:pt-12 md:pt-16">
      <div className="w-full max-w-lg px-2 sm:px-4">

        <motion.div
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          className="bg-white dark:bg-surface-dark backdrop-blur-2xl border border-slate-100 dark:border-white/10 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.08)] dark:shadow-[0_32px_64px_-12px_rgba(0,0,0,0.8)] rounded-[1.75rem] sm:rounded-[2.5rem] overflow-hidden"
        >
          {/* ── HEADER ── */}
          <div className="px-5 sm:px-8 pt-6 sm:pt-8 pb-4 flex items-center justify-between border-b border-slate-100 dark:border-white/5">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tighter leading-none font-['Satoshi','Inter',sans-serif]">{t('Swap Assets')}</h2>
            {/* Faucet */}
            <button
              onClick={handleFaucetClick}
              className="px-3 sm:px-4 py-1.5 sm:py-2 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-[10px] sm:text-[11px] flex items-center gap-2 group transition-all duration-200 ease-[cubic-bezier(0.32,0.72,0,1)] hover:bg-slate-100 dark:hover:bg-white/10 text-slate-500 dark:text-slate-300 font-mono"
            >
              <Info size={12} strokeWidth={2} className="group-hover:translate-x-0.5 transition-transform text-brand" />
              <span>{t('Faucet')}</span>
            </button>
          </div>

          {/* ── BODY ── */}
          <div className="p-4 sm:p-6 pt-4 sm:pt-6 space-y-4 sm:space-y-5">

            {/* SELL ASSET WELL */}
            <div className="space-y-2">
              <div className="flex items-center px-1">
                <label className="text-[9px] sm:text-[10px] uppercase font-mono tracking-[0.2em] text-slate-500 dark:text-slate-300">{t('Sell Asset')}</label>
              </div>

              <div className="p-4 sm:p-6 bg-slate-50/50 dark:bg-white/[0.04] border border-slate-100 dark:border-white/5 rounded-[1.5rem] sm:rounded-[2rem] space-y-3 sm:space-y-4 group/well transition-all duration-300 hover:bg-slate-100/50 dark:hover:bg-white/[0.06]">
                <div className="flex items-end justify-between gap-3 sm:gap-4">
                  <input
                    type="text"
                    inputMode="decimal"
                    value={fromAmount}
                    onChange={(e) => handleFromAmountChange(e.target.value)}
                    placeholder="0.00"
                    className="w-full min-w-0 bg-transparent text-3xl sm:text-5xl font-semibold leading-none text-slate-900 dark:text-white outline-none placeholder:text-slate-200 dark:placeholder:text-white/5 tracking-tight font-['Satoshi','Inter',sans-serif]"
                  />
                  <TokenPill symbol={fromToken} />
                </div>

                <div className="flex items-center justify-between gap-3 pt-1">
                  <div className="flex gap-1.5 sm:gap-2">
                    {['25%', '50%', 'MAX'].map(p => (
                      <button
                        key={p}
                        onClick={() => handlePercentClick(p, 'from')}
                        className="flex-1 sm:flex-none px-2.5 sm:px-4 py-1.5 font-mono text-[9px] sm:text-[10px] tracking-widest uppercase border border-slate-200 dark:border-white/10 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 transition-all duration-200 ease-[cubic-bezier(0.32,0.72,0,1)] text-slate-500 hover:text-slate-900 dark:hover:text-white"
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center gap-1.5 font-mono text-[9px] sm:text-[10px] text-slate-500 dark:text-slate-300">
                    <span>BAL:</span>
                    <span className="text-slate-900 dark:text-slate-200">
                      {fromLoading ? (
                        <div className="w-10 h-3 bg-slate-200 dark:bg-white/10 rounded-sm animate-pulse" />
                      ) : (
                        Number(fromBalance || 0).toFixed(2)
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* SWITCH BUTTON */}
            <div className="flex justify-center -my-2.5 relative z-10">
              <button
                onClick={handleSwitch}
                className="w-10 h-10 sm:w-11 sm:h-11 flex items-center justify-center rounded-full bg-white dark:bg-surface-dark border border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-300 shadow-[0_4px_12px_rgba(0,0,0,0.08)] dark:shadow-[0_4px_12px_rgba(0,0,0,0.8)] transition-all active:scale-95 hover:bg-slate-50 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white"
                title={t('Switch Tokens')}
              >
                <ArrowDownUp size={16} sm:size={18} strokeWidth={2.5} />
              </button>
            </div>

            {/* BUY ASSET WELL */}
            <div className="space-y-2">
              <div className="flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <label className="text-[9px] sm:text-[10px] uppercase font-mono tracking-[0.2em] text-slate-500 dark:text-slate-300">
                    {swapState.actualAmountOut ? t('Asset Received') : t('Buy Asset')}
                  </label>
                  {!swapState.actualAmountOut && parseFloat(fromAmount) > 0 && (
                    <span className="text-[9px] font-mono text-slate-400 dark:text-slate-400 italic">(Estimate)</span>
                  )}
                  {swapState.actualAmountOut && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="w-3.5 h-3.5 rounded-full bg-emerald-500/10 flex items-center justify-center"
                    >
                      <Check size={8} className="text-emerald-500" strokeWidth={3} />
                    </motion.div>
                  )}
                </div>
              </div>

              <div className="p-4 sm:p-6 bg-slate-50/50 dark:bg-white/[0.04] border border-slate-100 dark:border-white/5 rounded-[1.5rem] sm:rounded-[2rem] space-y-3 sm:space-y-4 group/well transition-all duration-300 hover:bg-slate-100/50 dark:hover:bg-white/[0.06]">
                <div className="flex items-end justify-between gap-3 sm:gap-4">
                  <input
                    type="text"
                    readOnly
                    value={(swapState.actualAmountOut || toAmount) ? parseFloat(swapState.actualAmountOut || toAmount).toFixed(4) : ''}
                    placeholder="0.00"
                    className="w-full min-w-0 bg-transparent text-3xl sm:text-5xl font-semibold leading-none text-slate-900 dark:text-white outline-none placeholder:text-slate-200 dark:placeholder:text-white/5 tracking-tight font-['Satoshi','Inter',sans-serif]"
                  />
                  <TokenPill symbol={toToken} />
                </div>

                <div className="flex items-center justify-between gap-3 pt-1">
                  <div className="flex gap-1.5 sm:gap-2">
                    {['25%', '50%', 'MAX'].map(p => (
                      <button
                        key={p}
                        onClick={() => handlePercentClick(p, 'to')}
                        className="flex-1 sm:flex-none px-2.5 sm:px-4 py-1.5 font-mono text-[9px] sm:text-[10px] tracking-widest uppercase border border-slate-200 dark:border-white/10 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 transition-all duration-200 ease-[cubic-bezier(0.32,0.72,0,1)] text-slate-500 hover:text-slate-900 dark:hover:text-white"
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center gap-1.5 font-mono text-[9px] sm:text-[10px] text-slate-500 dark:text-slate-300">
                    <span>BAL:</span>
                    <span className="text-slate-900 dark:text-slate-200">
                      {toLoading ? (
                        <div className="w-10 h-3 bg-slate-200 dark:bg-white/10 rounded-sm animate-pulse" />
                      ) : (
                        Number(toBalance || 0).toFixed(2)
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* PREMIUM SWAP DETAILS DISCLOSURE */}
            {(bestQuote || parseFloat(fromAmount) > 0) && (
              <div className="px-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowQuoteDetails(!showQuoteDetails);
                  }}
                  className="w-full flex items-center justify-between px-4 py-3.5 bg-slate-50/50 dark:bg-white/[0.03] border border-slate-100 dark:border-white/5 rounded-2xl hover:bg-slate-100/50 dark:hover:bg-white/[0.06] transition-all duration-300 group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-white dark:bg-white/5 shadow-sm border border-slate-100 dark:border-white/10 flex items-center justify-center">
                      <Info size={12} className="text-slate-400 dark:text-slate-500 group-hover:text-brand transition-colors" />
                    </div>
                    <span className="text-[12px] font-semibold text-slate-600 dark:text-slate-300 font-['Satoshi','Inter',sans-serif] tracking-tight">Swap Details</span>
                  </div>
                  <div className="flex items-center gap-3">
                    {!showQuoteDetails && swapState.price && (
                      <span className="text-[11px] font-mono text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-white/5 px-2 py-0.5 rounded-md">
                        1 {fromToken} ≈ {parseFloat(swapState.price).toFixed(4)} {toToken}
                      </span>
                    )}
                    <ChevronDown size={14} className={`text-slate-400 transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${showQuoteDetails ? 'rotate-180' : ''}`} />
                  </div>
                </button>

                <AnimatePresence>
                  {showQuoteDetails && (
                    <motion.div
                      initial={{ opacity: 0, height: 0, y: -10 }}
                      animate={{ opacity: 1, height: 'auto', y: 0 }}
                      exit={{ opacity: 0, height: 0, y: -10 }}
                      transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
                      className="overflow-visible"
                    >
                      <div className="pt-3 pb-2 space-y-1">
                        <div className="p-4 rounded-2xl bg-slate-50/30 dark:bg-white/[0.02] border border-slate-100/50 dark:border-white/[0.03] space-y-3.5">

                          {/* Stac Fee Row (Restored Text) */}
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-geist text-slate-500 dark:text-slate-400">Stac Fee</span>
                            <span className="text-[11px] font-mono text-slate-700 dark:text-white"><span className="opacity-50">Free</span></span>
                          </div>

                          {/* Price Impact Row (Restored Text) */}
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-geist text-slate-500 dark:text-slate-400">Price Impact</span>
                            <span className={`text-[11px] font-mono ${parseFloat(swapState.priceImpact) > 2 ? 'text-amber-500' : 'text-slate-700 dark:text-white'}`}>
                              {swapState.priceImpact || '< 0.01'}%
                            </span>
                          </div>

                          {/* Slippage Row (UNTOUCHED LOGIC) */}
                          <div className="pt-3 border-t border-slate-100 dark:border-white/5 flex items-center justify-between relative">
                            <span className="text-[11px] font-geist text-slate-500 dark:text-slate-400">Slippage Tolerance</span>
                            <div className="relative">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setShowSlippage(!showSlippage);
                                }}
                                className="flex items-center gap-1.5 pl-2.5 pr-2 py-1 bg-white dark:bg-white/[0.06] rounded-lg border border-slate-200/80 dark:border-white/[0.08] hover:border-slate-300 dark:hover:border-white/15 hover:bg-slate-50 dark:hover:bg-white/[0.1] transition-all duration-200 font-mono text-[11px] text-slate-700 dark:text-slate-200 shadow-sm"
                              >
                                {slippage}%
                                <ChevronDown size={12} className={`text-slate-300 transition-transform duration-300 ${showSlippage ? 'rotate-180' : ''}`} />
                              </button>

                              <AnimatePresence>
                                {showSlippage && (
                                  <motion.div
                                    initial={{ opacity: 0, scale: 0.98, y: -5 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.98, y: -5 }}
                                    transition={{ duration: 0.15 }}
                                    className="absolute right-0 top-full mt-2 z-[101] w-56 bg-white dark:bg-[#1A1A1A] border border-slate-200 dark:border-white/10 rounded-xl shadow-xl p-3 space-y-3"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <div className="grid grid-cols-3 gap-1.5">
                                      {[0.1, 0.5, 1.0].map((val) => (
                                        <button
                                          key={val}
                                          onClick={() => {
                                            setSlippage(val);
                                            setShowSlippage(false);
                                          }}
                                          className={`py-1.5 rounded-lg text-[10.5px] font-mono transition-colors ${slippage === val
                                            ? 'bg-[#6366F1] text-white shadow-sm'
                                            : 'bg-slate-50 dark:bg-white/5 text-slate-500 hover:bg-slate-100 dark:hover:bg-white/10 border border-slate-100 dark:border-white/[0.02]'
                                            }`}
                                        >
                                          {val}%
                                        </button>
                                      ))}
                                    </div>

                                    <div className="space-y-0 text-left">
                                      <div className="relative group/slip">
                                        <input
                                          type="text"
                                          inputMode="decimal"
                                          placeholder="Custom"
                                          onChange={(e) => {
                                            const val = e.target.value.replace(/[^0-9.]/g, '');
                                            const num = parseFloat(val);
                                            if (!isNaN(num) && num >= 0 && num <= 50) setSlippage(num);
                                          }}
                                          className={`w-full bg-slate-50 dark:bg-black/40 border rounded-xl pl-3 py-2 text-[12px] font-mono outline-none transition-all text-slate-800 dark:text-slate-200 placeholder:text-slate-300 dark:placeholder:text-slate-600 ${parseFloat(slippage) > 1.0 ? 'pr-12 border-amber-500/50 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/10' : 'pr-8 border-slate-200 dark:border-white/10 focus:border-[#6366F1] dark:focus:border-indigo-500 focus:ring-2 focus:ring-[#6366F1]/10 dark:focus:ring-indigo-500/10'}`}
                                        />
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                                          <AnimatePresence>
                                            {parseFloat(slippage) > 1.0 && (
                                              <div className="relative flex items-center">
                                                <AlertTriangle size={14} strokeWidth={2.5} className="text-amber-500" />
                                                <motion.div
                                                  initial={{ opacity: 0, scale: 0.9, y: -5 }}
                                                  animate={{ opacity: 1, scale: 1, y: 0 }}
                                                  exit={{ opacity: 0, scale: 0.9, y: -5 }}
                                                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                                                  className="absolute w-[200px] right-[-12px] top-full mt-[14px] bg-amber-50 dark:bg-[#1a1306] text-amber-900 dark:text-amber-500 border border-amber-500/30 rounded-xl p-3 text-[11px] font-geist font-medium leading-[1.35] shadow-[0_20px_40px_-15px_rgba(245,158,11,0.2)] dark:shadow-[0_20px_40px_-15px_rgba(245,158,11,0.1)] z-50 pointer-events-none"
                                                >
                                                  Caution: High slippage increases your risk of frontrunning and unfavorable rates.
                                                  <div className="absolute bottom-full right-4 -mb-[5px] w-2.5 h-2.5 bg-amber-50 dark:bg-[#1a1306] border-t border-l border-amber-500/30 rotate-45 transform"></div>
                                                </motion.div>
                                              </div>
                                            )}
                                          </AnimatePresence>
                                          <span className={`text-[11px] font-mono transition-colors ${parseFloat(slippage) > 1.0 ? 'text-amber-500' : 'text-slate-300 group-focus-within/slip:text-[#6366F1]'}`}>%</span>
                                        </div>
                                      </div>
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* ACTION BUTTON */}
            <div className="pt-2">
              <button
                onClick={handleSwapClick}
                disabled={
                  (status === 'disconnected' && !wasConnected) ||
                  !fromAmount ||
                  parseFloat(fromAmount) <= 0 ||
                  parseFloat(fromAmount) > parseFloat(fromBalance) ||
                  swapState.isLoading ||
                  status === 'reconnecting' ||
                  status === 'connecting'
                }
                className={`w-full h-12 sm:h-14 rounded-2xl text-[15px] sm:text-[16px] font-bold tracking-tight transition-all duration-200 ease-[cubic-bezier(0.32,0.72,0,1)] relative overflow-hidden group active:scale-[0.98] flex items-center justify-center gap-2.5 ${((!fromAmount || parseFloat(fromAmount) <= 0 || parseFloat(fromAmount) > parseFloat(fromBalance)) && !swapState.isLoading)
                  ? 'bg-slate-100 dark:bg-white/5 text-slate-300 cursor-not-allowed border border-slate-200 dark:border-white/10'
                  : 'bg-[#6366F1] dark:bg-indigo-600 text-white hover:brightness-110'
                  }`}
              >
                <div className="relative z-10 flex items-center justify-center gap-2.5">
                  {(status === 'reconnecting' || status === 'connecting' || wasConnected) && !isConnected ? (
                    <span>{t('Swap')}</span>
                  ) : status === 'disconnected' ? (
                    <><Wallet size={16} strokeWidth={1.5} /><span>{t('Connect Wallet')}</span></>
                  ) : parseFloat(fromAmount) > parseFloat(fromBalance) && !swapState.isLoading ? (
                    <span>{t('Insufficient Balance')}</span>
                  ) : swapState.isLoading ? (
                    <div className="flex items-center gap-3">
                      <span className="font-geist">{swapState.isApproving ? 'Approving' : 'Swapping'}</span>
                      <div className="flex gap-1">
                        <motion.div animate={{ opacity: [0.2, 1, 0.2] }} transition={{ repeat: Infinity, duration: 0.8, times: [0, 0.5, 1] }} className="w-1.5 h-1.5 rounded-full bg-white" />
                        <motion.div animate={{ opacity: [0.2, 1, 0.2] }} transition={{ repeat: Infinity, duration: 0.8, times: [0, 0.5, 1], delay: 0.15 }} className="w-1.5 h-1.5 rounded-full bg-white" />
                        <motion.div animate={{ opacity: [0.2, 1, 0.2] }} transition={{ repeat: Infinity, duration: 0.8, times: [0, 0.5, 1], delay: 0.3 }} className="w-1.5 h-1.5 rounded-full bg-white" />
                      </div>
                    </div>
                  ) : swapState.needsApproval ? (

                    <span>{t('Approve')} {fromToken}</span>
                  ) : (
                    <span>{t('Swap')}</span>
                  )}
                </div>
              </button>
            </div>
          </div>
        </motion.div>
      </div>

      {/* ── MODALS ── */}
      <SwapSuccessModal
        isOpen={showSwapSuccessModal}
        onClose={() => setShowSwapSuccessModal(false)}
        fromToken={frozenSwapData?.fromToken}
        toToken={frozenSwapData?.toToken}
        fromAmount={frozenSwapData?.fromAmount}
        toAmount={frozenSwapData?.toAmount}
        actualAmount={swapState.actualAmountOut}
        txHash={lastSwapTxHash}
      />

      <SwapFailedModal
        isOpen={showSwapFailedModal}
        onClose={() => setShowSwapFailedModal(false)}
        error={swapError}
        fromToken={fromTokenObj}
        toToken={toTokenObj}
      />

      <SwapRejectedModal
        isOpen={showSwapRejectedModal}
        onClose={() => setShowSwapRejectedModal(false)}
        fromToken={frozenSwapData?.fromToken || fromTokenObj}
        toToken={frozenSwapData?.toToken || toTokenObj}
      />

      <Toast
        type={toast.type}
        message={toast.message}
        visible={toast.visible}
        onClose={() => setToast({ ...toast, visible: false })}
      />
    </div>
  );
};

export default Swap;