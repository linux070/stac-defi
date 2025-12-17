import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader, CheckCircle, X, AlertCircle, Clock, Info } from 'lucide-react';

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
          className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 bg-black bg-opacity-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Gradient Header */}
            <div className={`relative px-6 py-5 ${
              modalState === 'inProgress' 
                ? 'bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-600' 
                : 'bg-gradient-to-r from-green-500 via-emerald-500 to-emerald-600'
            }`}>
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-white/20 transition-all duration-200"
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
                    <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg">
                      <Loader className="animate-spin text-white" size={32} strokeWidth={2.5} />
                    </div>
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg">
                      <CheckCircle size={32} className="text-white" strokeWidth={2.5} />
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
                        className="w-2 h-2 bg-blue-500 rounded-full"
                        animate={{ scale: [1, 1.2, 1], opacity: [1, 0.7, 1] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      />
                    ) : (
                      <CheckCircle size={16} className="text-green-500" />
                    )}
                  </motion.div>
                </motion.div>
                <motion.h3 
                  className="text-xl sm:text-2xl font-bold tracking-tight"
                  initial={{ y: -10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  {modalState === 'inProgress' ? 'Bridging in Progress' : 'Bridge Completed'}
                </motion.h3>
              </div>
            </div>

            <div className="p-6">
              {/* Network Visualization Card */}
              <motion.div 
                className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700/40 dark:to-gray-800/40 rounded-xl p-5 mb-6 border border-gray-200/50 dark:border-gray-600/30 shadow-sm"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <div className="flex items-center justify-center space-x-4 sm:space-x-6">
                  <div className="text-center flex-shrink-0">
                    <div className="w-16 h-16 rounded-full bg-white dark:bg-gray-800 flex items-center justify-center mx-auto mb-2.5 shadow-md border-2 border-gray-200 dark:border-gray-600">
                      {fromChain.includes('Arc') ? (
                        <img 
                          src="/icons/Arc.png" 
                          alt="Arc Testnet" 
                          className="w-11 h-11 rounded-full object-contain"
                        />
                      ) : (
                        <img 
                          src="/icons/eth.png" 
                          alt="Sepolia" 
                          className="w-11 h-11 rounded-full object-contain"
                        />
                      )}
                    </div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{fromChain}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 font-medium">Source</p>
                  </div>
                  
                  <div className="flex-1 h-0.5 bg-gradient-to-r from-gray-300 via-gray-200 to-gray-300 dark:from-gray-600 dark:via-gray-500 dark:to-gray-600"></div>
                  
                  <div className="text-center flex-shrink-0">
                    <div className="w-16 h-16 rounded-full bg-white dark:bg-gray-800 flex items-center justify-center mx-auto mb-2.5 shadow-md border-2 border-gray-200 dark:border-gray-600">
                      {toChain.includes('Arc') ? (
                        <img 
                          src="/icons/Arc.png" 
                          alt="Arc Testnet" 
                          className="w-11 h-11 rounded-full object-contain"
                        />
                      ) : (
                        <img 
                          src="/icons/eth.png" 
                          alt="Sepolia" 
                          className="w-11 h-11 rounded-full object-contain"
                        />
                      )}
                    </div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{toChain}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 font-medium">Destination</p>
                  </div>
                </div>
              </motion.div>

              {modalState === 'inProgress' && (
                <>
                  <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-4 sm:mb-6 px-2">
                    Bridging from {fromChain} to {toChain}
                  </p>

                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Elapsed Time</span>
                      <span className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white">{formatTime(displayTime)}</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2 mt-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full transition-all duration-1000 ease-out"
                        style={{ width: `${Math.min(100, (displayTime / 120) * 100)}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
                      Estimated completion time : 1-2 minutes.
                    </p>
                  </div>

                  <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 px-2">
                    Please keep this window open until the transaction completes.
                  </p>
                </>
              )}

              {modalState === 'completed' && (
                <motion.div 
                  className="space-y-4"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  {/* Success Stats Card */}
                  <div className="bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 dark:from-green-900/20 dark:via-emerald-900/20 dark:to-teal-900/20 rounded-2xl p-6 border border-green-200/60 dark:border-green-800/40 shadow-lg">
                    <div className="flex items-center justify-center gap-2 mb-4">
                      <CheckCircle size={20} className="text-green-600 dark:text-green-400" strokeWidth={2.5} />
                      <span className="text-sm font-bold text-green-900 dark:text-green-200 uppercase tracking-wide">Bridge Completed</span>
                    </div>
                    <div className="bg-white/80 dark:bg-slate-700/60 rounded-xl p-5 text-center shadow-sm border border-slate-200/50 dark:border-slate-600/40">
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <Clock size={16} className="text-green-600 dark:text-green-400" />
                        <span className="text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wide">Completion Time</span>
                      </div>
                      <p className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">{formatTime(displayTime)}</p>
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