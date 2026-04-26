import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Info } from 'lucide-react';
import '../styles/bridge-styles.css';

const BridgeCancelledModal = ({ isOpen, onClose, fromChain, toChain }) => {
  const { t } = useTranslation();

  const getChainIcon = (name) => {
    if (!name) return "/icons/eth.png";
    const n = String(name).toLowerCase();
    if (n.includes('arc')) return "/icons/arc.png";
    if (n.includes('base')) return "/icons/base.png";
    return "/icons/eth.png";
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
            className="w-full max-w-[420px] max-h-[calc(100dvh-40px)] overflow-y-auto custom-scrollbar bg-white dark:bg-surface-dark rounded-[24px] sm:rounded-[32px] overflow-hidden shadow-2xl dark:shadow-[0_32px_64px_-12px_rgba(0,0,0,0.8)] border border-slate-200 dark:border-white/10"
            initial={{ scale: 0.95, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 30 }}
            transition={{ type: 'spring', damping: 25, stiffness: 400 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 sm:p-8 pb-4">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-2">
                   <div className="w-2 h-2 rounded-full bg-slate-400" />
                    <span className="text-[12px] font-bold uppercase tracking-[0.2em] text-slate-900 dark:text-white font-mono">
                      Transaction Aborted
                    </span>
                </div>
                <button onClick={onClose} className="p-1 hover:bg-slate-100 dark:hover:bg-white/5 rounded-full transition-colors text-slate-400">
                  <X size={18} />
                </button>
              </div>

              <h2 className="text-[32px] font-instrument leading-none tracking-tight text-slate-900 dark:text-white mb-2">
                Bridge Aborted
              </h2>
              <p className="text-sm text-slate-500 font-geist">
                The transaction process was manually stopped before finalization. No assets have been transferred.
              </p>
            </div>

            <div className="p-6 sm:p-8 pt-0 space-y-4 sm:space-y-6">
              <div className="bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 rounded-2xl p-6 flex items-start gap-4">
                 <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center shrink-0">
                    <Info size={18} className="text-slate-400" />
                 </div>
                 <p className="text-xs text-slate-500 dark:text-slate-400 font-geist leading-relaxed">
                   You can restart the process at any time. Your current wallet balance remains unchanged and assets are secured in their original vault.
                 </p>
              </div>

              <div className="bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 rounded-2xl p-5 space-y-4">
                 <div className="flex justify-between items-center text-[11px] font-mono uppercase tracking-widest text-slate-600 dark:text-slate-300 font-bold">
                    <span>Source</span>
                    <div className="flex items-center gap-2">
                      <img src={getChainIcon(fromChain)} className="w-4 h-4" alt="" />
                      <span className="text-slate-900 dark:text-white">{fromChain}</span>
                    </div>
                 </div>
                 <div className="flex justify-between items-center text-[11px] font-mono uppercase tracking-widest text-slate-600 dark:text-slate-300 font-bold">
                    <span>Target</span>
                    <div className="flex items-center gap-2">
                      <img src={getChainIcon(toChain)} className="w-4 h-4" alt="" />
                      <span className="text-slate-900 dark:text-white">{toChain}</span>
                    </div>
                 </div>
              </div>

              <button 
                onClick={onClose}
                className="w-full py-4 bg-slate-900 dark:bg-white text-white dark:text-black rounded-xl text-xs font-bold uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-black/5"
              >
                Return to Bridge
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default BridgeCancelledModal;
