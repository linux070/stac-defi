import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle } from 'lucide-react';
import '../styles/bridge-styles.css';

const BridgeFailedModal = ({ isOpen, onClose, onRetry, fromChain, toChain, errorMessage, state }) => {
  const { t } = useTranslation();

  const getCleanErrorMessage = (msg) => {
    if (!msg) return t('User rejected the transaction in wallet.');
    const errorStr = String(msg?.message || msg);
    const isInternalError =
      errorStr.toLowerCase().includes('unterminated string') ||
      errorStr.toLowerCase().includes('json') ||
      errorStr.toLowerCase().includes('failed to fetch') ||
      errorStr.toLowerCase().includes('maximum retry attempts') ||
      errorStr.toLowerCase().includes('drpc.org');

    if (isInternalError) {
      return t('A temporary network error occurred. Please click Retry to try again.');
    }
    return errorStr;
  };

  const getChainIcon = (name) => {
    if (!name) return "/icons/eth.png";
    const n = String(name).toLowerCase();
    if (n.includes('arc')) return "/icons/arc.png";
    if (n.includes('base')) return "/icons/base.png";
    return "/icons/eth.png";
  };

  // Helper to convert to Title Case
  const toTitleCase = (str) => {
    if (!str) return '';
    return str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
  };

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
            className="w-full max-w-[420px] max-h-[calc(100dvh-40px)] overflow-y-auto custom-scrollbar bg-white dark:bg-[#121212] rounded-[24px] sm:rounded-[32px] overflow-hidden shadow-2xl dark:shadow-[0_32px_64px_-12px_rgba(0,0,0,0.8)] border border-slate-200 dark:border-white/10"
            initial={{ scale: 0.95, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 30 }}
            transition={{ type: 'spring', damping: 25, stiffness: 400 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 sm:p-8 pb-4 text-center">
              <div className="flex justify-end -mr-4 -mt-4 mb-2">
                <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-white/5 rounded-full transition-colors text-slate-400">
                  <X size={20} />
                </button>
              </div>

              <div className="flex flex-col items-center mb-6">
                <motion.div 
                    initial={{ scale: 0, rotate: -45 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: 'spring', delay: 0.2 }}
                    className="w-16 h-16 rounded-full bg-slate-50 dark:bg-white/[0.03] flex items-center justify-center mb-5 border border-slate-200 dark:border-white/5"
                >
                    <AlertTriangle size={32} className="text-red-500" strokeWidth={2} />
                </motion.div>
                <span className="text-[12px] font-bold uppercase tracking-[0.2em] text-slate-900 dark:text-white font-mono">
                  Transaction Failed
                </span>
              </div>

              <p className="text-[15px] text-slate-500 dark:text-slate-400 font-medium leading-[1.4] max-w-[280px] mx-auto">
                The transaction could not be finalized on the selected network.
              </p>
            </div>

            <div className="px-6 sm:px-8 pb-8 sm:pb-10 space-y-4 sm:space-y-6">
              <div className="bg-slate-50 dark:bg-white/[0.03] border border-slate-200/50 dark:border-white/5 rounded-[24px] p-6 space-y-5">
                 <div className="flex justify-between items-center">
                    <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-widest">SOURCE</span>
                    <div className="flex items-center gap-2">
                      <img src={getChainIcon(fromChain)} className="w-5 h-5 rounded-full" alt="" />
                      <span className="text-sm font-medium text-slate-900 dark:text-white">{toTitleCase(fromChain)}</span>
                    </div>
                 </div>
                 <div className="flex justify-between items-center">
                    <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-widest">DESTINATION</span>
                    <div className="flex items-center gap-2">
                      <img src={getChainIcon(toChain)} className="w-5 h-5 rounded-full" alt="" />
                      <span className="text-sm font-medium text-slate-900 dark:text-white">{toTitleCase(toChain)}</span>
                    </div>
                 </div>
              </div>

              <div className="flex gap-3">
                 <button 
                   onClick={onRetry}
                   className="flex-1 h-14 bg-[#6366F1] dark:bg-indigo-600 text-white rounded-2xl text-[13px] font-bold uppercase tracking-widest hover:brightness-110 active:scale-[0.98] transition-all shadow-[0_12px_24px_-8px_rgba(99,102,241,0.3)]"
                 >
                   Retry
                 </button>
                 <button 
                   onClick={onClose}
                   className="flex-1 h-14 bg-transparent border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white rounded-2xl text-[13px] font-bold uppercase tracking-widest hover:bg-slate-100 dark:hover:bg-white/5 active:scale-[0.98] transition-all"
                 >
                   Dismiss
                 </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default BridgeFailedModal;
