import React from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertCircle, AlertTriangle, ArrowRight } from 'lucide-react';

const BridgeFailedModal = ({ isOpen, onClose, fromChain, toChain, errorTitle, errorMessage }) => {
  const { t } = useTranslation();
  // Format error message with number highlighting
  const formatErrorMessage = (message) => {
    if (!message) return t('An unknown error occurred during the bridge transaction.');

    const numberRegex = /(\d+\.?\d*)/g;
    const parts = message.split(numberRegex);

    return parts.map((part, index) => {
      if (/^\d+\.?\d*$/.test(part)) {
        return (
          <span key={index} className="font-mono font-bold text-red-600 dark:text-red-400">
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
            className="relative bridging-modal-container"
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 400 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button (Absolute) - Match SwapModal alt button style */}
            <button
              onClick={onClose}
              className="bridging-modal-close-button-alt"
              aria-label="Close"
            >
              <X size={20} />
            </button>

            <div className="bridging-modal-content">
              <div className="bridging-modal-heading-container">
                <h2 className="bridging-modal-youre-bridging text-red-500">
                  {errorTitle || t('Transaction Failed')}
                </h2>
              </div>
              {/* Network Visualization Card */}
              <motion.div
                className="bridging-modal-network-container"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                <div className="flex flex-row items-center justify-between gap-4">
                  {/* Source Chain Card */}
                  <div className="bridging-modal-network-card">
                    <img
                      src={fromChain?.includes('Arc') ? "/icons/Arc.png" : fromChain?.includes('Base') ? "/icons/base.png" : "/icons/eth.png"}
                      alt={fromChain}
                      className="bridging-modal-network-icon"
                    />
                    <p className="bridging-modal-network-name">{fromChain}</p>
                  </div>

                  {/* Arrow Connector */}
                  <div className="bridging-modal-arrow-container">
                    <ArrowRight className="bridging-modal-arrow" size={16} strokeWidth={3} />
                  </div>

                  {/* Destination Chain Card */}
                  <div className="bridging-modal-network-card">
                    <img
                      src={toChain?.includes('Arc') ? "/icons/Arc.png" : toChain?.includes('Base') ? "/icons/base.png" : "/icons/eth.png"}
                      alt={toChain}
                      className="bridging-modal-network-icon"
                    />
                    <p className="bridging-modal-network-name">{toChain}</p>
                  </div>
                </div>
              </motion.div>

              {/* Enhanced Error Message Card */}
              <motion.div
                className="bridging-modal-error-card"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                <AlertTriangle size={20} className="bridging-modal-error-icon" strokeWidth={2.5} />
                <div className="flex-1">
                  <p className="bridging-modal-error-title">
                    {t('Error Details')}
                  </p>
                  <p className="bridging-modal-error-text">
                    {formatErrorMessage(errorMessage || t('An unknown error occurred during the bridge transaction.'))}
                  </p>
                </div>
              </motion.div>

              {/* Notice for safety */}
              <motion.div
                className="bridging-modal-notice mt-6"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.6 }}
              >
                <AlertCircle size={20} className="bridging-modal-notice-icon" strokeWidth={2.5} />
                <div className="flex-1">
                  <p className="bridging-modal-notice-title">{t('Helpful Tip')}</p>
                  <p className="bridging-modal-notice-text">
                    {t('bridgeFailedTip')}
                  </p>
                </div>
              </motion.div>

              {/* Action Buttons */}
              <div className="bridging-modal-buttons-container mt-8">
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
