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

    // Check for common technical/RPC error patterns
    const isTechnicalError =
      msg.toLowerCase().includes('http request failed') ||
      msg.toLowerCase().includes('unterminated string') ||
      msg.toLowerCase().includes('json') ||
      msg.toLowerCase().includes('viem') ||
      msg.toLowerCase().includes('mint step failed') ||
      msg.toLowerCase().includes('drpc.org');

    if (isTechnicalError) {
      return t('Network error on destination chain. Please ensure you are connected to the correct network and try again.');
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
            <button
              onClick={onClose}
              className="bridging-modal-close-button-alt"
              aria-label="Close"
            >
              <X size={20} />
            </button>

            <div className="bridging-modal-content">
              <motion.div
                className="space-y-6"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'spring', damping: 20, stiffness: 300 }}
              >
                <div className="bridging-modal-status-card-new">
                  <div className="bridging-modal-success-icon-wrapper">
                    <motion.div
                      className="bridging-modal-failed-circle"
                      initial={{ scale: 0, rotate: -45 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ delay: 0.2, type: 'spring' }}
                    >
                      <X size={40} strokeWidth={4} />
                    </motion.div>
                  </div>

                  <div className="text-center mb-6">
                    <h4 className="bridging-modal-status-title-new title-failed">
                      {t('Transaction Failed')}
                    </h4>
                    <p className="bridging-modal-success-message">
                      {getCleanErrorMessage(errorMessage)}
                    </p>
                  </div>

                  <div className="bridging-modal-success-details mb-8">
                    <div className="bridging-modal-success-info-row">
                      <span>{t('Source')}</span>
                      <div className="flex items-center gap-2">
                        <div className={`w-5 h-5 ${safeFromChain.toLowerCase().includes('base') ? 'base-sepolia-icon-representation' : 'rounded-full overflow-hidden'}`}>
                          <img src={getChainIcon(safeFromChain)} alt="" className="w-full h-full object-cover" />
                        </div>
                        <span className="value">{safeFromChain}</span>
                      </div>
                    </div>
                    <div className="bridging-modal-success-info-row">
                      <span>{t('Destination')}</span>
                      <div className="flex items-center gap-2">
                        <div className={`w-5 h-5 ${safeToChain.toLowerCase().includes('base') ? 'base-sepolia-icon-representation' : 'rounded-full overflow-hidden'}`}>
                          <img src={getChainIcon(safeToChain)} alt="" className="w-full h-full object-cover" />
                        </div>
                        <span className="value">{safeToChain}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={onClose}
                    className="bridging-modal-action-button-secondary-new"
                  >
                    {t('Retry')}
                  </button>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return createPortal(modalContent, document.body);
};

export default BridgeFailedModal;
