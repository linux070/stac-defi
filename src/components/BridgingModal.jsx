import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader, CheckCircle, X, AlertCircle } from 'lucide-react';

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

  // Calculate progress percentage for dot animation (0% = source, 100% = destination)
  // Based on elapsed time with estimated completion of 120 seconds (2 minutes)
  const calculateDotProgress = () => {
    if (modalState === 'completed') {
      return 100; // Dot reaches destination when completed
    }
    // Calculate progress based on elapsed time, capped at 100%
    return Math.min(100, (displayTime / 120) * 100);
  };

  const dotProgress = calculateDotProgress();
  
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
            className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-4 sm:p-6 w-full max-w-md mx-4"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              <X size={20} className="text-gray-500 dark:text-gray-400" />
            </button>

            <div className="text-center">
              <div className="flex justify-center mb-4">
                <div className="relative">
                  {modalState === 'inProgress' ? (
                    <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                      <Loader className="animate-spin text-blue-500" size={32} />
                    </div>
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                      <CheckCircle size={32} className="text-green-500" />
                    </div>
                  )}
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                    {modalState === 'inProgress' ? (
                      <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                    ) : (
                      <CheckCircle size={16} className="text-white" />
                    )}
                  </div>
                </div>
              </div>

              <h3 className="text-lg sm:text-xl font-bold mb-2 text-gray-900 dark:text-white">
                {modalState === 'inProgress' ? 'Bridging in Progress' : 'Bridge Completed'}
              </h3>
              
              <div className="flex items-center justify-center space-x-2 sm:space-x-4 my-4 sm:my-6">
                <div className="text-center">
                  <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mx-auto mb-2">
                    {fromChain.includes('Arc') ? (
                      <img 
                        src="/icons/Arc.png" 
                        alt="Arc Testnet" 
                        className="w-8 h-8 rounded-full object-contain"
                      />
                    ) : (
                      <img 
                        src="/icons/eth.png" 
                        alt="Sepolia" 
                        className="w-8 h-8 rounded-full object-contain"
                      />
                    )}
                  </div>
                  <p className="text-sm font-medium">{fromChain}</p>
                </div>
                
                <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700 relative">
                  <motion.div
                    className="absolute top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center"
                    initial={{ left: '0%' }}
                    animate={{ left: `${dotProgress}%` }}
                    transition={{ 
                      type: 'tween',
                      ease: 'linear',
                      duration: 0.5 // Smooth animation when progress updates
                    }}
                    style={{ 
                      transform: 'translateX(-50%) translateY(-50%)', // Center the dot on its position
                    }}
                  >
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                  </motion.div>
                </div>
                
                <div className="text-center">
                  <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mx-auto mb-2">
                    {toChain.includes('Arc') ? (
                      <img 
                        src="/icons/Arc.png" 
                        alt="Arc Testnet" 
                        className="w-8 h-8 rounded-full object-contain"
                      />
                    ) : (
                      <img 
                        src="/icons/eth.png" 
                        alt="Sepolia" 
                        className="w-8 h-8 rounded-full object-contain"
                      />
                    )}
                  </div>
                  <p className="text-sm font-medium">{toChain}</p>
                </div>
              </div>

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
                <div className="space-y-4">
                  <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 px-2">
                    Bridge completed successfully in {formatTime(displayTime)}
                  </p>
                </div>
              )}

            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default BridgingModal;