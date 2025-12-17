import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader, CheckCircle, X, AlertCircle, Clock, Info, ArrowRight } from 'lucide-react';

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
                    <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg">
                      <Loader className="animate-spin text-white w-6 h-6 sm:w-8 sm:h-8" strokeWidth={2.5} />
                    </div>
                  ) : (
                    <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg">
                      <CheckCircle size={24} className="text-white sm:w-8 sm:h-8" strokeWidth={2.5} />
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

            <div className="p-4 sm:p-6">
              {/* Network Visualization Card */}
              <motion.div 
                className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700/40 dark:to-gray-800/40 rounded-xl p-3 sm:p-5 mb-4 sm:mb-6 border border-gray-200/50 dark:border-gray-600/30 shadow-sm"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                <div className="flex flex-col sm:flex-row items-center justify-between px-4 sm:px-10 md:px-12 gap-3 sm:gap-0">
                  {/* Source Chain Card */}
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-2.5 sm:p-3 shadow-md border border-gray-200 dark:border-gray-600 dark:shadow-lg dark:shadow-gray-900/50 flex flex-col items-center w-full sm:w-auto min-w-[80px] sm:min-w-[100px]">
                    {fromChain.includes('Arc') ? (
                      <img 
                        src="/icons/Arc.png" 
                        alt="Arc Testnet" 
                        className="w-9 h-9 sm:w-10 sm:h-10 mb-1.5 object-contain dark:brightness-110 dark:drop-shadow-[0_0_6px_rgba(147,51,234,0.4)]"
                      />
                    ) : (
                      <img 
                        src="/icons/eth.png" 
                        alt="Sepolia" 
                        className="w-9 h-9 sm:w-10 sm:h-10 mb-1.5 object-contain dark:brightness-110 dark:drop-shadow-[0_0_6px_rgba(255,255,255,0.3)]"
                      />
                    )}
                    <p className="text-[10px] sm:text-xs font-semibold text-gray-900 dark:text-white text-center">{fromChain}</p>
                  </div>
                  
                  {/* Arrow Connector */}
                  <div className="flex items-center justify-center flex-shrink-0">
                    <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600 dark:text-gray-300 dark:drop-shadow-[0_0_4px_rgba(255,255,255,0.3)] rotate-90 sm:rotate-0" strokeWidth={2} />
                  </div>
                  
                  {/* Destination Chain Card */}
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-2.5 sm:p-3 shadow-md border border-gray-200 dark:border-gray-700 flex flex-col items-center w-full sm:w-auto min-w-[80px] sm:min-w-[100px]">
                    {toChain.includes('Arc') ? (
                      <img 
                        src="/icons/Arc.png" 
                        alt="Arc Testnet" 
                        className="w-9 h-9 sm:w-10 sm:h-10 mb-1.5 object-contain"
                      />
                    ) : (
                      <img 
                        src="/icons/eth.png" 
                        alt="Sepolia" 
                        className="w-9 h-9 sm:w-10 sm:h-10 mb-1.5 object-contain"
                      />
                    )}
                    <p className="text-[10px] sm:text-xs font-semibold text-gray-900 dark:text-white text-center">{toChain}</p>
                  </div>
                </div>
              </motion.div>

              {modalState === 'inProgress' && (
                <>
                  <p className="text-xs sm:text-sm md:text-base text-gray-600 dark:text-gray-400 mb-3 sm:mb-4 md:mb-6 px-2 text-center sm:text-left">
                    Bridging from {fromChain} to {toChain}
                  </p>

                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 sm:p-4 mb-3 sm:mb-4 md:mb-6">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Elapsed Time</span>
                      <span className="text-xs sm:text-sm md:text-base font-semibold text-gray-900 dark:text-white">{formatTime(displayTime)}</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-1.5 sm:h-2 mt-2">
                      <div 
                        className="bg-blue-500 h-1.5 sm:h-2 rounded-full transition-all duration-1000 ease-out"
                        style={{ width: `${Math.min(100, (displayTime / 120) * 100)}%` }}
                      ></div>
                    </div>
                    <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
                      Estimated completion time : 1-2 minutes.
                    </p>
                  </div>

                  {/* Important Notice */}
                  <motion.div 
                    className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-500 dark:border-yellow-400 rounded-r-xl p-3 sm:p-5 flex items-start gap-2 sm:gap-4 shadow-sm"
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.5 }}
                  >
                    <div className="flex-shrink-0">
                      <Info size={20} className="text-yellow-600 dark:text-yellow-300 dark:drop-shadow-[0_0_6px_rgba(234,179,8,0.5)] sm:w-6 sm:h-6" strokeWidth={2.5} />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs sm:text-sm font-bold text-yellow-900 dark:text-yellow-200 mb-1 sm:mb-1.5">
                        Important Notice
                      </p>
                      <p className="text-[11px] sm:text-xs md:text-sm text-yellow-800 dark:text-yellow-300 leading-relaxed">
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
                    className="text-xs sm:text-sm md:text-base text-gray-600 dark:text-gray-400 mb-4 text-center sm:text-left"
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.4 }}
                  >
                    Your funds have been successfully credited to {toChain}
                  </motion.p>

                  {/* Success Stats Card */}
                  <div className="bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 dark:from-green-900/20 dark:via-emerald-900/20 dark:to-teal-900/20 rounded-2xl p-4 sm:p-6 border border-green-200/60 dark:border-green-800/40 shadow-lg">
                    <div className="flex items-center justify-center gap-2 mb-3 sm:mb-4">
                      <CheckCircle size={18} className="text-green-600 dark:text-green-300 dark:drop-shadow-[0_0_6px_rgba(34,197,94,0.5)] sm:w-5 sm:h-5" strokeWidth={2.5} />
                      <span className="text-xs sm:text-sm font-bold text-green-900 dark:text-green-200 uppercase tracking-wide">Bridge Completed</span>
                    </div>
                    <div className="bg-white/80 dark:bg-slate-700/60 rounded-xl p-4 sm:p-5 text-center shadow-sm border border-slate-200/50 dark:border-slate-600/40">
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <Clock size={14} className="text-green-600 dark:text-green-300 dark:drop-shadow-[0_0_4px_rgba(34,197,94,0.4)] sm:w-4 sm:h-4" />
                        <span className="text-[10px] sm:text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wide">Completion Time</span>
                      </div>
                      <p className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white tracking-tight">{formatTime(displayTime)}</p>
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