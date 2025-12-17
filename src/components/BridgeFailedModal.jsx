import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertCircle, AlertTriangle, ArrowRight } from 'lucide-react';

const BridgeFailedModal = ({ isOpen, onClose, fromChain, toChain, errorTitle, errorMessage }) => {
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
            <div className="relative px-6 py-5 bg-gradient-to-r from-red-500 via-rose-500 to-red-600">
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-white/20 transition-all duration-200"
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
                  <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg">
                    <AlertCircle size={24} className="text-white sm:w-8 sm:h-8" strokeWidth={2.5} />
                  </div>
                </motion.div>
                <motion.h3 
                  className="text-lg sm:text-xl md:text-2xl font-bold tracking-tight text-center px-2"
                  initial={{ y: -10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  {errorTitle || 'Transaction Failed'}
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
                    {fromChain?.includes('Arc') ? (
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
                    {toChain?.includes('Arc') ? (
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

              {/* Enhanced Error Message Card */}
              <motion.div 
                className="bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20 border-l-4 border-red-500 dark:border-red-400 rounded-r-xl p-3 sm:p-5 mb-4 sm:mb-6 flex items-start gap-2 sm:gap-4 shadow-sm"
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                <div className="flex-shrink-0">
                  <AlertTriangle size={20} className="text-red-600 dark:text-red-300 dark:drop-shadow-[0_0_6px_rgba(239,68,68,0.5)] sm:w-6 sm:h-6" strokeWidth={2.5} />
                </div>
                <div className="flex-1">
                  <p className="text-xs sm:text-sm font-bold text-red-900 dark:text-red-200 mb-2 sm:mb-2.5">
                    Error Details
                  </p>
                  <p className="text-[11px] sm:text-sm text-red-800 dark:text-red-300 break-words leading-relaxed">
                    {formatErrorMessage(errorMessage || 'An unknown error occurred during the bridge transaction.')}
                  </p>
                </div>
              </motion.div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                <motion.button
                  onClick={onClose}
                  className="flex-1 py-3 sm:py-3.5 px-4 sm:px-5 text-xs sm:text-sm md:text-base border-2 border-blue-400 text-blue-500 dark:text-blue-400 rounded-xl transition-all duration-200 hover:bg-blue-50 dark:hover:bg-blue-900/20 font-semibold"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Retry
                </motion.button>
                <motion.button
                  onClick={onClose}
                  className="flex-1 py-3 sm:py-3.5 px-4 sm:px-5 text-xs sm:text-sm md:text-base border-2 border-gray-400 text-gray-500 dark:text-gray-400 rounded-xl transition-all duration-200 hover:bg-gray-50 dark:hover:bg-gray-900/20 font-semibold"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Close
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
