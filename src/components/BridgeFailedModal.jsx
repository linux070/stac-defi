import React from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertCircle, AlertTriangle, ArrowRight } from 'lucide-react';

const BridgeFailedModal = ({ isOpen, onClose, fromChain, toChain, errorTitle, errorMessage }) => {
  const { t } = useTranslation();
  // Format error message with number highlighting
  const formatErrorMessage = (message) => {
    if (!message) return 'An unknown error occurred during the bridge transaction.';

    const numberRegex = /(\d+\.?\d*)/g;
    const parts = message.split(numberRegex);

    return parts.map((part, index) => {
      if (/^\d+\.?\d*$/.test(part)) {
        return (
          <span key={index} className="font-mono font-bold text-red-900 dark:text-red-200">
            {part}
          </span>
        );
      }
      return <span key={index}>{part}</span>;
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center bridging-modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="relative bridging-modal-container overflow-hidden"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Gradient Header */}
            <div className="bridging-modal-header bridging-modal-header-failed">
              <button
                onClick={onClose}
                className="bridging-modal-close-button"
              >
                <X size={20} className="text-white" />
              </button>

              <div className="flex flex-col items-center text-white">
                <motion.div
                  className="mb-3"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.1, type: 'spring' }}
                >
                  <div className="bridging-modal-loader-container">
                    <AlertCircle size={24} className="text-white" strokeWidth={2.5} />
                  </div>
                </motion.div>
                <motion.h3
                  className="bridging-modal-title"
                  initial={{ y: -10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  {errorTitle || t('Transaction Failed')}
                </motion.h3>
              </div>
            </div>

            <div className="bridging-modal-content">
              {/* Network Visualization Card */}
              <motion.div
                className="bridging-modal-network-container"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <div className="flex flex-row items-center justify-between gap-3">
                  {/* Source Chain Card */}
                  <div className="bridging-modal-network-card">
                    {fromChain?.includes('Arc') ? (
                      <img
                        src="/icons/Arc.png"
                        alt="Arc Testnet"
                        className="bridging-modal-network-icon object-contain"
                      />
                    ) : fromChain?.includes('Base') ? (
                      <img
                        src="/icons/base.png"
                        alt="Base Sepolia"
                        className="bridging-modal-network-icon object-contain"
                      />
                    ) : (
                      <img
                        src="/icons/eth.png"
                        alt="Sepolia"
                        className="bridging-modal-network-icon object-contain"
                      />
                    )}
                    <p className="bridging-modal-network-name whitespace-nowrap">{fromChain}</p>
                  </div>

                  {/* Arrow Connector */}
                  <div className="flex items-center justify-center flex-shrink-0">
                    <ArrowRight className="bridging-modal-arrow w-4 h-4" strokeWidth={2} />
                  </div>

                  {/* Destination Chain Card */}
                  <div className="bridging-modal-network-card">
                    {toChain?.includes('Arc') ? (
                      <img
                        src="/icons/Arc.png"
                        alt="Arc Testnet"
                        className="bridging-modal-network-icon object-contain"
                      />
                    ) : toChain?.includes('Base') ? (
                      <img
                        src="/icons/base.png"
                        alt="Base Sepolia"
                        className="bridging-modal-network-icon object-contain"
                      />
                    ) : (
                      <img
                        src="/icons/eth.png"
                        alt="Sepolia"
                        className="bridging-modal-network-icon object-contain"
                      />
                    )}
                    <p className="bridging-modal-network-name whitespace-nowrap">{toChain}</p>
                  </div>
                </div>
              </motion.div>

              {/* Enhanced Error Message Card */}
              <motion.div
                className="bridging-modal-error-card"
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                <div className="flex-shrink-0">
                  <AlertTriangle size={20} className="bridging-modal-error-icon" strokeWidth={2.5} />
                </div>
                <div className="flex-1">
                  <p className="bridging-modal-error-title">
                    {t('Error Details')}
                  </p>
                  <p className="bridging-modal-error-text">
                    {formatErrorMessage(errorMessage || 'An unknown error occurred during the bridge transaction.')}
                  </p>
                </div>
              </motion.div>

              {/* Action Buttons */}
              <div className="bridging-modal-buttons-container">
                <motion.button
                  onClick={onClose}
                  className="bridging-modal-retry-button"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {t('Retry')}
                </motion.button>
                <motion.button
                  onClick={onClose}
                  className="bridging-modal-close-button-secondary"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {t('Close')}
                </motion.button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default BridgeFailedModal;
