import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader, CheckCircle, X, AlertCircle } from 'lucide-react';

const BridgingModal = ({ isOpen, onClose, fromChain, toChain, startTime, state }) => {
  const [elapsedTime, setElapsedTime] = useState(0);
  const [finalTime, setFinalTime] = useState(null);

  // Reset timer when modal opens with a new startTime (new transaction)
  useEffect(() => {
    if (isOpen && startTime) {
      setElapsedTime(0);
      setFinalTime(null);
    }
  }, [isOpen, startTime]);

  // Stop and capture final time immediately when success or error
  useEffect(() => {
    if (state?.step === 'success' || state?.step === 'error') {
      if (finalTime === null && startTime) {
        setFinalTime(Math.floor((Date.now() - startTime) / 1000));
      }
    }
  }, [state?.step, startTime, finalTime]);

  useEffect(() => {
    let interval;
    // Only run timer if in progress (not success, not error)
    if (isOpen && startTime && state?.step !== 'success' && state?.step !== 'error' && finalTime === null) {
      interval = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
    }
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isOpen, startTime, state?.step, finalTime]);

  // Use finalTime if available (transaction completed), otherwise use live elapsedTime
  const displayTime = finalTime !== null ? finalTime : elapsedTime;

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Determine modal state based on bridge state
  const getModalState = () => {
    if (state?.step === 'error') {
      return 'failed';
    } else if (state?.step === 'success') {
      return 'completed';
    } else {
      return 'inProgress';
    }
  };

  const modalState = getModalState();

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black bg-opacity-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 w-full max-w-md"
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
                  ) : modalState === 'completed' ? (
                    <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                      <CheckCircle size={32} className="text-green-500" />
                    </div>
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                      <AlertCircle size={32} className="text-red-500" />
                    </div>
                  )}
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                    {modalState === 'inProgress' ? (
                      <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                    ) : modalState === 'completed' ? (
                      <CheckCircle size={16} className="text-white" />
                    ) : (
                      <X size={16} className="text-white" />
                    )}
                  </div>
                </div>
              </div>

              <h3 className="text-xl font-bold mb-2">
                {modalState === 'inProgress' ? 'Bridging in Progress' : 
                 modalState === 'completed' ? 'Bridge Completed' : 'Bridge Failed'}
              </h3>
              
              <div className="flex items-center justify-center space-x-4 my-6">
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
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
                    {modalState === 'inProgress' ? (
                      <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                    ) : modalState === 'completed' ? (
                      <CheckCircle size={16} className="text-white" />
                    ) : (
                      <X size={16} className="text-white" />
                    )}
                  </div>
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
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    Bridging from {fromChain} to {toChain}
                  </p>

                  <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 mb-6">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 dark:text-gray-400">Elapsed Time</span>
                      <span className="font-semibold">{formatTime(displayTime)}</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2 mt-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full transition-all duration-1000 ease-out"
                        style={{ width: `${Math.min(100, (displayTime / 120) * 100)}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
                      Estimated completion: 1-2 minutes
                    </p>
                  </div>

                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Please keep this window open until the transaction completes.
                  </p>
                </>
              )}

              {modalState === 'completed' && (
                <div className="space-y-4">
                  <p className="text-gray-600 dark:text-gray-400">
                    Bridge completed successfully in {formatTime(displayTime)}
                  </p>
                  
                  <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 text-left">
                    <h4 className="font-semibold text-green-800 dark:text-green-200 mb-2">Transaction Details</h4>
                    <div className="space-y-2 text-sm">
                      <div>
                        <p className="text-gray-600 dark:text-gray-400">Source Transaction</p>
                        <p className="font-mono text-xs truncate bg-gray-100 dark:bg-gray-700 p-2 rounded">
                          {state?.sourceTxHash || 'N/A'}
                        </p>
                        <a 
                          href={fromChain.includes('Arc') ? 
                            `https://testnet.arcscan.app/tx/${state?.sourceTxHash}` : 
                            `https://sepolia.etherscan.io/tx/${state?.sourceTxHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-500 hover:underline text-xs"
                        >
                          View on explorer
                        </a>
                      </div>
                      <div>
                        <p className="text-gray-600 dark:text-gray-400">Destination Transaction</p>
                        <p className="font-mono text-xs truncate bg-gray-100 dark:bg-gray-700 p-2 rounded">
                          {state?.receiveTxHash || 'N/A'}
                        </p>
                        <a 
                          href={toChain.includes('Arc') ? 
                            `https://testnet.arcscan.app/tx/${state?.receiveTxHash}` : 
                            `https://sepolia.etherscan.io/tx/${state?.receiveTxHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-500 hover:underline text-xs"
                        >
                          View on explorer
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {modalState === 'failed' && (
                <div className="space-y-4">
                  <p className="text-gray-600 dark:text-gray-400">
                    Bridge transaction failed
                  </p>
                  
                  <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 text-left">
                    <h4 className="font-semibold text-red-800 dark:text-red-200 mb-2">Error Details</h4>
                    <p className="text-sm text-red-600 dark:text-red-300">
                      {state?.error || 'Transaction was rejected or cancelled by user'}
                    </p>
                  </div>
                  
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Please try again or contact support if the issue persists.
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