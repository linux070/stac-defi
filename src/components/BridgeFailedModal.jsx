import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import '../styles/bridge-styles.css';


const BridgeFailedModal = ({ isOpen, onClose, fromChain, toChain, errorMessage }) => {
  const { t } = useTranslation();

  // Safety checks for chain names
  const safeFromChain = typeof fromChain === 'string' ? fromChain : 'Sepolia';
  const safeToChain = typeof toChain === 'string' ? toChain : 'Arc Testnet';

  // Helper to simplify technical RPC/Network errors
  const getCleanErrorMessage = (msg) => {
    if (!msg) return t('User rejected the transaction in wallet.');

    const isTechnicalError =
      msg.toLowerCase().includes('http request failed') ||
      msg.toLowerCase().includes('unterminated string') ||
      msg.toLowerCase().includes('json') ||
      msg.toLowerCase().includes('viem') ||
      msg.toLowerCase().includes('failed to fetch') ||
      msg.toLowerCase().includes('maximum retry attempts') ||
      msg.toLowerCase().includes('mint step failed') ||
      msg.toLowerCase().includes('drpc.org') ||
      msg.toLowerCase().includes('execution reverted') ||
      msg.toLowerCase().includes('estimategas');

    if (isTechnicalError) {
      return t('A temporary network error occurred. Please click Retry to try again.');
    }

    // fallback to original if it's already user-friendly (like rejection)
    return msg;
  };

  const getChainIcon = (name) => {
    if (!name) return "/icons/eth.png";
    const n = String(name).toLowerCase();
    if (n.includes('arc')) return "/icons/arc.png";
    if (n.includes('base')) return "/icons/base.png";
    return "/icons/eth.png";
  };

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[100000] bridging-modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="relative bridging-modal-container"
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 400 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button (Absolute) */}
            <button onClick={onClose} className="bridging-modal-close-button-alt" aria-label="Close">
              <X size={20} />
            </button>

            <div className="bridging-modal-content p-6 sm:p-8">
              <div className="bridging-modal-status-card-new text-center">
                <div className="flex justify-center mb-6">
                  <div className="w-20 h-20 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center border-2 border-red-500/20">
                    <X size={40} className="text-red-500" strokeWidth={3} />
                  </div>
                </div>

                <div className="mb-6">
                  <h4 className="text-2xl font-bold text-black dark:text-white mb-2">
                    {t('Transaction Failed')}
                  </h4>
                  <p className="text-sm text-slate-500 dark:text-gray-400 leading-relaxed max-w-[280px] mx-auto">
                    {getCleanErrorMessage(errorMessage)}
                  </p>
                </div>

                <div className="bridging-modal-success-details mb-8 text-left bg-slate-50 dark:bg-white/5 rounded-2xl p-4 border border-slate-200/50 dark:border-white/10">
                  {/* Source Row */}
                  <div className="flex justify-between items-center py-2 border-b border-slate-200/50 dark:border-white/10">
                    <span className="text-sm font-medium text-slate-500">{t('Source')}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full overflow-hidden">
                        <img src={getChainIcon(safeFromChain)} alt="" className="w-full h-full object-cover" />
                      </div>
                      <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{safeFromChain}</span>
                    </div>
                  </div>
                  {/* Destination Row */}
                  <div className="flex justify-between items-center py-2 mt-1">
                    <span className="text-sm font-medium text-slate-500">{t('Destination')}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full overflow-hidden">
                        <img src={getChainIcon(safeToChain)} alt="" className="w-full h-full object-cover" />
                      </div>
                      <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{safeToChain}</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={onClose}
                  className="w-full py-4 rounded-2xl bg-slate-100 dark:bg-white/10 text-black dark:text-white font-bold transition-all active:scale-[0.98] hover:bg-slate-200 dark:hover:bg-white/20"
                >
                  {t('Retry')}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return createPortal(modalContent, document.body);
};

export default BridgeFailedModal;
