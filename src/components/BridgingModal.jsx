import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader, CheckCircle, X, AlertCircle, Clock, Info, ArrowRight, Check, ArrowDown } from 'lucide-react';
import '../styles/bridge-styles.css';

const BridgingModal = ({ isOpen, onClose, fromChain, toChain, amount, startTime, state, stopTimer }) => {
  const { t } = useTranslation();
  const [elapsedTime, setElapsedTime] = useState(0);
  const [finalTime, setFinalTime] = useState(null);

  // Close modal immediately when error is detected - BridgeFailedModal will handle errors
  // Don't call onClose here - let the parent component handle the error state via useEffect
  // This prevents double-handling and ensures BridgeFailedModal is shown properly
  useEffect(() => {
    if (isOpen && state?.step === 'error') {
      console.log('🚨 BridgingModal detected error state - will close to show BridgeFailedModal');
      // The parent component's useEffect will handle closing this and showing BridgeFailedModal
      // We just need to ensure this modal doesn't render when there's an error
    }
  }, [isOpen, state?.step]);

  // Reset timer when modal opens with a new startTime (new transaction)
  useEffect(() => {
    if (isOpen && startTime) {
      setElapsedTime(0);
      setFinalTime(null);
    }
  }, [isOpen, startTime]);

  // Capture final time immediately on success if not already done
  useEffect(() => {
    if (state?.step === 'success' && finalTime === null && startTime) {
      setFinalTime(Math.floor((Date.now() - startTime) / 1000));
    }
  }, [state?.step, startTime, finalTime]);

  // Timer logic
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

  // Capture final time on success
  useEffect(() => {
    if (state?.step === 'success' && finalTime === null) {
      setFinalTime(elapsedTime);
    }
  }, [state?.step, elapsedTime, finalTime]);

  // Close modal logic on error
  useEffect(() => {
    if (isOpen && state?.step === 'error') {
      console.log('🚨 BridgingModal detected error state - will close to show BridgeFailedModal');
    }
  }, [isOpen, state?.step]);

  // Use finalTime if available (transaction completed), otherwise use live elapsedTime
  const displayTime = finalTime !== null ? finalTime : elapsedTime;

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins > 0) {
      return `${mins}m ${secs}s`;
    }
    return `${secs}s`;
  };

  // Determine modal state based on bridge state
  const getModalState = () => {
    if (state?.step === 'success') {
      return 'completed';
    } else {
      return 'inProgress';
    }
  };

  const modalState = getModalState();

  // Safety checks for chain names to prevent .includes() crashes
  const safeFromChain = typeof fromChain === 'string' ? fromChain : 'Sepolia';
  const safeToChain = typeof toChain === 'string' ? toChain : 'Arc Testnet';

  const getChainIcon = (name) => {
    if (name.includes('Arc')) return "/icons/Arc.png";
    if (name.includes('Base')) return "/icons/base.png";
    return "/icons/eth.png";
  };

  // Don't render if there's an error - BridgeFailedModal will handle it
  if (state?.step === 'error') {
    return null;
  }

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[999] bridging-modal-backdrop"
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
            {modalState !== 'completed' && (
              <button
                onClick={onClose}
                className="bridging-modal-close-button-alt"
                aria-label="Close"
              >
                <X size={20} />
              </button>
            )}

            <div className="bridging-modal-content">
              {/* Unified In-Progress Content Row */}
              {modalState === 'inProgress' && (
                <div className="space-y-4">
                  <div className="bridging-modal-heading-container">
                    <h2 className="bridging-modal-youre-bridging">{t("You're bridging")}</h2>
                  </div>

                  {/* Bridge Details Card (Swap Style) */}
                  <div className="bridging-modal-details-new">
                    {/* From Row */}
                    <div className="bridging-modal-amount-row">
                      <div className="bridging-modal-token-badge">
                        <div className="bridging-modal-token-icon-small">
                          <img src={getChainIcon(safeFromChain)} alt={safeFromChain} />
                        </div>
                      </div>
                      <div className="bridging-modal-amount-content">
                        <div className="bridging-modal-amount-label">{t('From Network')}</div>
                        <div className="bridging-modal-amount-value">{safeFromChain}</div>
                      </div>
                    </div>

                    {/* Arrow Separator */}
                    <div className="bridging-modal-arrow-container-new">
                      <ArrowDown size={14} />
                    </div>

                    {/* To Row */}
                    <div className="bridging-modal-amount-row">
                      <div className="bridging-modal-token-badge">
                        <div className="bridging-modal-token-icon-small">
                          <img src={getChainIcon(safeToChain)} alt={safeToChain} />
                        </div>
                      </div>
                      <div className="bridging-modal-amount-content">
                        <div className="bridging-modal-amount-label">{t('To Network')}</div>
                        <div className="bridging-modal-amount-value">{safeToChain}</div>
                      </div>
                    </div>
                  </div>

                  <div className="bridging-modal-progress-section-new">
                    <div className="bridging-modal-progress-header-new">
                      <div className="flex items-center justify-between w-full">
                        <div className="flex flex-col items-start gap-1">
                          <span className="bridging-modal-progress-label-new">{t('Elapsed Time')}</span>
                          <span className="bridging-modal-progress-time-new">{formatTime(displayTime)}</span>
                        </div>
                        <div className="bridging-modal-loader-wrapper">
                          <Loader className="animate-spin text-blue-400" size={24} />
                        </div>
                      </div>
                    </div>
                    <div className="bridging-modal-progress-bar-container">
                      <motion.div
                        className="bridging-modal-progress-bar"
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(100, (displayTime / 120) * 100)}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                      />
                    </div>
                    <div className="bridging-modal-progress-footer-new">
                      <div className="flex items-center gap-2">
                        <span className="bridging-modal-progress-estimate-new">
                          {t('Estimated completion time: 1-3 minutes')}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Concise Summary Notice */}
                  <div className="bridging-modal-notice-premium">
                    <div className="flex items-start gap-3">
                      <div className="bridging-modal-notice-icon-wrapper">
                        <Info size={18} />
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="bridging-modal-notice-title-premium">{t('Bridge in Progress')}</span>
                        <p className="bridging-modal-notice-text-premium">
                          {t('Please keep this window open while your assets are being securely transferred. Closing this modal will interrupt the bridging process.')}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {modalState === 'completed' && (
                <motion.div
                  className="space-y-6"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                >
                  <div className="bridging-modal-status-card-new">
                    <div className="bridging-modal-success-icon-wrapper">
                      <motion.div
                        className="bridging-modal-checkmark-circle"
                        initial={{ scale: 0, rotate: -45 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ delay: 0.2, type: 'spring' }}
                      >
                        <Check size={40} strokeWidth={4} />
                      </motion.div>
                    </div>
                    <h4 className="bridging-modal-status-title-new">{t('Transaction Confirmed!')}</h4>
                    <p className="bridging-modal-success-summary-text">
                      {t('Bridge Successful!')}
                    </p>

                    <div className="bridging-modal-success-details mb-8">
                      <div className="bridging-modal-success-info-row">
                        <span>{t('Time taken')}</span>
                        <span className="value">{formatTime(displayTime)}</span>
                      </div>
                      <div className="bridging-modal-success-info-row">
                        <span>{t('Source')}</span>
                        <div className="flex items-center gap-2">
                          <img src={getChainIcon(safeFromChain)} alt="" className="w-5 h-5 rounded-full object-cover" />
                          <span className="value">{safeFromChain}</span>
                        </div>
                      </div>
                      <div className="bridging-modal-success-info-row">
                        <span>{t('Destination')}</span>
                        <div className="flex items-center gap-2">
                          <img src={getChainIcon(safeToChain)} alt="" className="w-5 h-5 rounded-full object-cover" />
                          <span className="value">{safeToChain}</span>
                        </div>
                      </div>
                    </div>

                    <p className="bridging-modal-success-message mb-6" style={{ fontSize: '14px', color: 'var(--bridge-text-secondary)', lineHeight: '1.5', marginTop: '-8px' }}>
                      {t('Your funds have been successfully bridged and are now available on the destination network.')}
                    </p>

                    <button
                      onClick={onClose}
                      className="bridging-modal-action-button-secondary-new"
                    >
                      {t('Close')}
                    </button>
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return createPortal(modalContent, document.body);
};

export default BridgingModal;