import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader, CheckCircle, X, AlertCircle, Clock, Info, ArrowRight } from 'lucide-react';
import '../styles/bridge-styles.css';

const BridgingModal = ({ isOpen, onClose, fromChain, toChain, startTime, state, stopTimer }) => {
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
            className="relative bridging-modal-container overflow-hidden"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Gradient Header */}
            <div className={`bridging-modal-header ${modalState === 'completed' ? 'bridging-modal-header-completed' : ''}`}>
              <button
                onClick={onClose}
                className="bridging-modal-close-button"
              >
                <X size={20} className="text-white" />
              </button>

              <div className="flex flex-col items-center text-white">
                <motion.div
                  className="relative mb-3"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.1, type: 'spring' }}
                >
                  {modalState === 'inProgress' ? (
                    <div className="bridging-modal-loader-container">
                      <Loader className="animate-spin text-white" size={24} strokeWidth={2.5} />
                    </div>
                  ) : (
                    <div className="bridging-modal-loader-container">
                      <CheckCircle size={24} className="text-white" strokeWidth={2.5} />
                    </div>
                  )}
                  <motion.div
                    className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-white flex items-center justify-center shadow-lg"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.3, type: 'spring' }}
                  >
                    {modalState === 'inProgress' ? (
                      <motion.div
                        className="w-2 h-2 rounded-full"
                        style={{ background: 'var(--bridge-accent-primary)' }}
                        animate={{ scale: [1, 1.2, 1], opacity: [1, 0.7, 1] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      />
                    ) : (
                      <CheckCircle size={16} className="text-green-500" />
                    )}
                  </motion.div>
                </motion.div>
                <motion.h3
                  className="bridging-modal-title"
                  initial={{ y: -10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  {modalState === 'inProgress' ? 'Bridging in Progress' : 'Bridge Completed'}
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
                    {fromChain.includes('Arc') ? (
                      <img
                        src="/icons/Arc.png"
                        alt="Arc Testnet"
                        className="bridging-modal-network-icon object-contain"
                      />
                    ) : fromChain.includes('Base') ? (
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
                    <p className="bridging-modal-network-name">{fromChain}</p>
                  </div>

                  {/* Arrow Connector */}
                  <div className="flex items-center justify-center flex-shrink-0">
                    <ArrowRight className="bridging-modal-arrow w-4 h-4" strokeWidth={2} />
                  </div>

                  {/* Destination Chain Card */}
                  <div className="bridging-modal-network-card">
                    {toChain.includes('Arc') ? (
                      <img
                        src="/icons/Arc.png"
                        alt="Arc Testnet"
                        className="bridging-modal-network-icon object-contain"
                      />
                    ) : toChain.includes('Base') ? (
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
                    <p className="bridging-modal-network-name">{toChain}</p>
                  </div>
                </div>
              </motion.div>

              {modalState === 'inProgress' && (
                <>
                  <p className="bridging-modal-bridge-text">
                    Bridging from {fromChain} to {toChain}
                  </p>

                  <div className="bridging-modal-progress-card">
                    <div className="bridging-modal-progress-header">
                      <span className="bridging-modal-progress-label">Elapsed Time</span>
                      <span className="bridging-modal-progress-time">{formatTime(displayTime)}</span>
                    </div>
                    <div className="bridging-modal-progress-bar-container">
                      <div
                        className="bridging-modal-progress-bar"
                        style={{ width: `${Math.min(100, (displayTime / 120) * 100)}%` }}
                      ></div>
                    </div>
                    <p className="bridging-modal-progress-estimate">
                      Estimated completion time : 1-2 minutes.
                    </p>
                  </div>

                  {/* Important Notice */}
                  <motion.div
                    className="bridging-modal-notice"
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.5 }}
                  >
                    <div className="flex-shrink-0">
                      <Info size={20} className="bridging-modal-notice-icon" strokeWidth={2.5} />
                    </div>
                    <div className="flex-1">
                      <p className="bridging-modal-notice-title">
                        Important Notice
                      </p>
                      <p className="bridging-modal-notice-text">
                        Please keep this window open until the transaction completes. Closing it may interrupt the bridging process.
                      </p>
                    </div>
                  </motion.div>
                </>
              )}

              {modalState === 'completed' && (
                <motion.div
                  className="space-y-4"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  {/* Success Message */}
                  <motion.p
                    className="bridging-modal-success-message"
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.4 }}
                  >
                    Your funds have been successfully credited to {toChain}
                  </motion.p>

                  {/* Success Stats Card */}
                  <div className="bridging-modal-success-card">
                    <div className="flex items-center justify-center gap-2 mb-4">
                      <CheckCircle size={20} className="text-green-500" strokeWidth={2.5} />
                      <span className="bridging-modal-success-label">Bridge Completed</span>
                    </div>
                    <div className="bg-white/80 dark:bg-slate-700/60 rounded-xl p-5 text-center shadow-sm border border-slate-200/50 dark:border-slate-600/40">
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <Clock size={16} className="text-green-500" />
                        <span className="bridging-modal-success-label">Completion Time</span>
                      </div>
                      <p className="bridging-modal-success-time">{formatTime(displayTime)}</p>
                    </div>
                  </div>
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