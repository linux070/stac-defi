import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, ChevronRight } from 'lucide-react';
import '../styles/bridge-styles.css';

const BridgingModal = ({ isOpen, onClose, fromChain, toChain, amount, startTime, state, stopTimer, onClaim }) => {
  const { t } = useTranslation();
  const [elapsedTime, setElapsedTime] = useState(0);
  const [finalTime, setFinalTime] = useState(null);

  useEffect(() => {
    if (isOpen && startTime) {
      setElapsedTime(0);
      setFinalTime(null);
    }
  }, [isOpen, startTime]);

  useEffect(() => {
    let timer;
    if (isOpen && !stopTimer && finalTime === null) {
      const start = startTime || Date.now();
      timer = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - start) / 1000));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isOpen, stopTimer, startTime, finalTime]);

  useEffect(() => {
    if (state?.step === 'success' && finalTime === null) {
      setFinalTime(elapsedTime);
    }
  }, [state?.step, elapsedTime, finalTime]);

  const displayTime = finalTime !== null ? finalTime : elapsedTime;
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}m ${secs.toString().padStart(2, '0')}s` : `${secs}s`;
  };

  const getStepLabel = () => {
    switch (state?.step) {
      case 'switching-network': return 'Switching network...';
      case 'fetching-fees': return 'Fetching transfer fees...';
      case 'approving': return 'Approve USDC in your wallet...';
      case 'burning': return 'Confirming burn transaction...';
      case 'forwarding': return 'Circle is auto-minting on destination...';
      case 'claiming': return 'Initializing manual claim...';
      case 'fetching-attestation': return 'Fetching Circle attestation...';
      case 'minting': return 'Confirming mint on destination...';
      default: return 'Processing...';
    }
  };

  const getChainIcon = (name) => {
    if (name === 'Arc Testnet') return "/icons/arc.png";
    if (name === 'Base Sepolia') return "/icons/base.png";
    return "/icons/eth.png";
  };

  if (state?.step === 'error') return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[100000] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => state?.step === 'success' && onClose()}
        >
          <motion.div
            className="w-full max-w-[420px] max-h-[calc(100dvh-40px)] overflow-y-auto custom-scrollbar bg-white dark:bg-[#121212] rounded-[24px] sm:rounded-[32px] overflow-hidden shadow-2xl dark:shadow-[0_32px_64px_-12px_rgba(0,0,0,0.8)] border border-slate-200 dark:border-white/10"
            initial={{ scale: 0.95, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 30 }}
            transition={{ type: 'spring', damping: 25, stiffness: 400 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* PROGRESS HEADER */}
            <div className="p-6 sm:p-8 pb-4 text-center">
              <div className="flex justify-end mb-2 -mr-4 -mt-4">
                <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-white/5 rounded-full transition-colors text-slate-300">
                  <X size={20} />
                </button>
              </div>

              <div className="flex flex-col items-center mb-4">
                {state?.step !== 'success' ? (
                  <div className="w-14 h-14 rounded-full bg-indigo-500/10 flex items-center justify-center mb-4 text-indigo-500 relative">
                    <div className="modern-spinner">
                      {[...Array(12)].map((_, i) => <div key={i} />)}
                    </div>
                  </div>
                ) : (
                  <motion.div
                    initial={{ scale: 0, rotate: -45 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: 'spring', delay: 0.2 }}
                    className="w-14 h-14 rounded-full bg-emerald-500 flex items-center justify-center mb-4 text-white shadow-[0_0_32px_-8px_rgba(16,185,129,0.4)]"
                  >
                    <Check size={28} strokeWidth={4} />
                  </motion.div>
                )}
                
                <div className="flex items-center gap-2">
                   <span className="text-[12px] font-bold uppercase tracking-[0.2em] text-slate-900 dark:text-white font-mono">
                     {state?.step === 'success' ? 'Transaction Completed' : 'Transaction in Progress'}
                   </span>
                </div>
              </div>

              {state?.step === 'success' && (
                <p className="text-[15px] text-slate-500 dark:text-slate-300 leading-[1.5] font-medium max-w-[280px] mx-auto">
                  Your asset has been successfully bridged to the destination chain
                </p>
              )}
            </div>

            {/* MAIN CONTENT AREA */}
            <div className="p-4 sm:p-6 pt-0 space-y-4">
              {/* CHAIN VISUALIZER */}
              <div className="grid grid-cols-[1fr,40px,1fr] items-center gap-2 py-4 border-y border-slate-100 dark:border-white/5">
                <div className="flex flex-col items-center gap-2">
                   <div className="w-12 h-12 rounded-full bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 flex items-center justify-center">
                     <img src={getChainIcon(fromChain)} className="w-6 h-6" alt="" />
                   </div>
                   <span className="text-[11px] font-mono text-slate-600 dark:text-slate-300 uppercase font-bold tracking-wider">{fromChain}</span>
                </div>
                <div className="flex justify-center">
                   {state?.step === 'success' ? <Check size={20} className="text-emerald-500" /> : <ChevronRight size={22} className="text-slate-600 dark:text-slate-300" strokeWidth={4} />}
                </div>
                <div className="flex flex-col items-center gap-2">
                   <div className="w-12 h-12 rounded-full bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 flex items-center justify-center">
                     <img src={getChainIcon(toChain)} className="w-6 h-6" alt="" />
                   </div>
                   <span className="text-[11px] font-mono text-slate-600 dark:text-slate-300 uppercase font-bold tracking-wider">{toChain}</span>
                </div>
              </div>

              {/* STATS BENTO */}
              <div className="grid grid-cols-2 gap-3">
                 <div className="bg-slate-50 dark:bg-white/[0.03] p-4 rounded-xl border border-slate-100 dark:border-white/5">
                    <p className="text-[10px] uppercase tracking-widest font-mono text-slate-600 dark:text-slate-300 mb-1 font-bold">Amount</p>
                    <p className="text-lg font-instrument text-slate-900 dark:text-white">{amount} USDC</p>
                 </div>
                 <div className="bg-slate-50 dark:bg-white/[0.03] p-4 rounded-xl border border-slate-100 dark:border-white/5">
                    <p className="text-[10px] uppercase tracking-widest font-mono text-slate-600 dark:text-slate-300 mb-1 font-bold">Time</p>
                    <p className="text-lg font-instrument text-slate-900 dark:text-white">{formatTime(displayTime)}</p>
                 </div>
              </div>

              {/* STEP INDICATOR */}
              <div className="space-y-4">
                 <div className="flex items-center justify-between text-[11px] font-mono uppercase tracking-wider">
                   <span className="text-slate-500">{t(getStepLabel())}</span>
                   <span className="text-brand">{state?.step === 'success' ? '100%' : `${Math.min(95, Math.floor((displayTime/120)*100))}%`}</span>
                 </div>
                 <div className="h-1 w-full bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
                    <motion.div 
                      className="h-full bg-brand"
                      initial={{ width: 0 }}
                      animate={{ width: state?.step === 'success' ? '100%' : `${Math.min(95, Math.floor((displayTime/120)*100))}%` }}
                    />
                 </div>
              </div>

              {/* MANUAL CLAIM CTA */}
              {state?.messageHash && state?.step !== 'success' && (
                <div className="pt-4 mt-4 border-t border-slate-100 dark:border-white/5">
                   <p className="text-[11px] text-slate-500 mb-4 font-geist leading-relaxed">
                     The automatic relayer is taking longer than expected. You can manually complete the transfer once the attestation is verified.
                   </p>
                   <button 
                     onClick={onClaim}
                     className="w-full py-3 bg-brand/5 text-brand border border-brand/20 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-brand/10 active:scale-[0.98] transition-all"
                   >
                     Trigger Manual Claim
                   </button>
                </div>
              )}
            </div>

            {/* FOOTER */}
            <div className="p-4 sm:p-6 pt-0">
               <div className="flex items-center justify-center gap-2.5 pt-2">
                  <img src="/icons/arc.png" className="w-4 h-4 rounded-full" alt="" />
                  <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-[0.2em]">Powered by App Kit</span>
               </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default BridgingModal;