import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader, CheckCircle, X, AlertCircle, Clock, Info, ArrowRight } from 'lucide-react';
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

  // Stop and capture final time immediately when success (not error - errors are handled by BridgeFailedModal)
  useEffect(() => {
    if (state?.step === 'success') {
      if (finalTime === null && startTime) {
        setFinalTime(Math.floor((Date.now() - startTime) / 1000));
      }
    }
  }, [state?.step, startTime, finalTime]);

  // Reset timer when bridge completes or errors
  useEffect(() => {
    if (state?.step === 'success' || state?.step === 'error') {
      // Reset elapsed time when bridge completes or errors
      // Note: finalTime is preserved for success to show completion time
      setElapsedTime(0);
      // Only reset finalTime on error, keep it for success to display completion time
      if (state?.step === 'error') {
        setFinalTime(null);
      }
    }
  }, [state?.step]);

  useEffect(() => {
    let interval;
    // Only run timer if in progress (not success, not error, and not stopped)
    if (isOpen && startTime && state?.step !== 'success' && state?.step !== 'error' && finalTime === null && !stopTimer) {
      interval = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
    } else if (stopTimer && finalTime === null) {
      // Stop timer at current value when cancelled
      setFinalTime(elapsedTime);
    }
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isOpen, startTime, state?.step, finalTime, stopTimer, elapsedTime]);

  // Use finalTime if available (transaction completed), otherwise use live elapsedTime
  const displayTime = finalTime !== null ? finalTime : elapsedTime;

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Determine modal state based on bridge state
  // Note: Errors are handled by BridgeFailedModal, so this modal only shows in-progress or success
  const getModalState = () => {
    if (state?.step === 'success') {
      return 'completed';
    } else {
      return 'inProgress';
    }
  };

  const modalState = getModalState();

  // Don't render if there's an error - BridgeFailedModal will handle it
  if (state?.step === 'error') {
    return null;
  }

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
                <h2 className="bridging-modal-youre-bridging">
                  {modalState === 'inProgress' ? t("You're bridging") : t('Bridge Completed')}
                </h2>
              </div>
              {/* Network Visualization Card */}
              <motion.div
                className="bridging-modal-network-container"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                <div>
                  {/* Source Chain Card */}
                  <div className="bridging-modal-network-card">
                    <img
                      src={fromChain.includes('Arc') ? "/icons/Arc.png" : fromChain.includes('Base') ? "/icons/base.png" : "/icons/eth.png"}
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
                      src={toChain.includes('Arc') ? "/icons/Arc.png" : toChain.includes('Base') ? "/icons/base.png" : "/icons/eth.png"}
                      alt={toChain}
                      className="bridging-modal-network-icon"
                    />
                    <p className="bridging-modal-network-name">{toChain}</p>
                  </div>
                </div>
              </motion.div>

              {modalState === 'inProgress' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  <p className="bridging-modal-bridge-text">
                    {t('Bridging from')} <strong>{fromChain}</strong> {t('To')} <strong>{toChain}</strong>
                  </p>

                  <div className="bridging-modal-progress-card">
                    <div className="bridging-modal-progress-header">
                      <span className="bridging-modal-progress-label">{t('Elapsed Time')}</span>
                      <span className="bridging-modal-progress-time">{formatTime(displayTime)}</span>
                    </div>
                    <div className="bridging-modal-progress-bar-container">
                      <motion.div
                        className="bridging-modal-progress-bar"
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(100, (displayTime / 120) * 100)}%` }}
                        transition={{ duration: 0.5 }}
                      />
                    </div>
                    <p className="bridging-modal-progress-estimate">
                      {t('Estimated completion time')}: 1-2 {t('minutes')}
                    </p>
                  </div>

                  {/* Important Notice */}
                  <motion.div
                    className="bridging-modal-notice"
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.6 }}
                  >
                    <Info size={20} className="bridging-modal-notice-icon" strokeWidth={2.5} />
                    <div className="flex-1">
                      <p className="bridging-modal-notice-title">{t('Important Notice')}</p>
                      <p className="bridging-modal-notice-text">{t('bridgingWindowNotice')}</p>
                    </div>
                  </motion.div>
                </motion.div>
              )}

              {modalState === 'completed' && (
                <motion.div
                  className="space-y-6 pt-2 pb-4"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  <div className="bridging-modal-status-card-new">
                    <div className="bridging-modal-success-icon-wrapper">
                      <div className="bridging-modal-checkmark-circle">
                        <Check size={32} strokeWidth={3} />
                      </div>
                    </div>
                    <h4 className="bridging-modal-status-title-new">{t('Bridge Successful!')}</h4>
                    <div className="bridging-modal-success-summary-text">
                      {t('You bridged')}
                    </div>
                    <div className="bridging-modal-success-summary-visual">
                      <div className="bridging-modal-success-chain-badge">
                        <img src={fromChain.includes('Arc') ? "/icons/Arc.png" : fromChain.includes('Base') ? "/icons/base.png" : "/icons/eth.png"} alt="" className="bridging-modal-success-chain-img" />
                        <span>{amount} USDC</span>
                      </div>
                      <div className="bridging-modal-success-path-arrow">
                        <ArrowRight size={14} />
                      </div>
                      <div className="bridging-modal-success-chain-badge">
                        <img src={toChain.includes('Arc') ? "/icons/Arc.png" : toChain.includes('Base') ? "/icons/base.png" : "/icons/eth.png"} alt="" className="bridging-modal-success-chain-img" />
                        <span>{amount} USDC</span>
                      </div>
                    </div>
                  </div>

                  <p className="bridging-modal-success-message">
                    {t('Your funds have been successfully credited to')} <strong>{toChain}</strong>
                  </p>

                  <button
                    onClick={onClose}
                    className="bridging-modal-action-button-secondary-new"
                  >
                    {t('Close')}
                  </button>
                </motion.div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default BridgingModal;