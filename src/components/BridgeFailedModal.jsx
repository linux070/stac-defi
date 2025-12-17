import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertCircle, AlertTriangle } from 'lucide-react';

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
                  <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg">
                    <AlertCircle size={32} className="text-white" strokeWidth={2.5} />
                  </div>
                </motion.div>
                <motion.h3 
                  className="text-xl sm:text-2xl font-bold tracking-tight"
                  initial={{ y: -10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  {errorTitle || 'Transaction Failed'}
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
                      {fromChain?.includes('Arc') ? (
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
                  
                  <div className="flex-1 h-0.5 bg-gradient-to-r from-gray-300 via-gray-200 to-gray-300 dark:from-gray-600 dark:via-gray-500 dark:to-gray-600 relative">
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-red-500 dark:bg-red-600 flex items-center justify-center shadow-lg border-2 border-white dark:border-gray-800">
                      <X size={14} className="text-white" strokeWidth={3} />
                    </div>
                  </div>
                  
                  <div className="text-center flex-shrink-0">
                    <div className="w-16 h-16 rounded-full bg-white dark:bg-gray-800 flex items-center justify-center mx-auto mb-2.5 shadow-md border-2 border-gray-200 dark:border-gray-600">
                      {toChain?.includes('Arc') ? (
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

              {/* Enhanced Error Message Card */}
              <motion.div 
                className="bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20 border-l-4 border-red-500 dark:border-red-400 rounded-r-xl p-5 mb-6 flex items-start gap-4 shadow-sm"
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                <div className="flex-shrink-0">
                  <AlertTriangle size={24} className="text-red-600 dark:text-red-400" strokeWidth={2.5} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-red-900 dark:text-red-200 mb-2.5">
                    Error Details
                  </p>
                  <p className="text-sm text-red-800 dark:text-red-300 break-words leading-relaxed">
                    {formatErrorMessage(errorMessage || 'An unknown error occurred during the bridge transaction.')}
                  </p>
                </div>
              </motion.div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <motion.button
                  onClick={onClose}
                  className="flex-1 py-3.5 px-5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 text-sm sm:text-base shadow-md hover:shadow-lg"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Retry
                </motion.button>
                <motion.button
                  onClick={onClose}
                  className="flex-1 py-3.5 px-5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl font-semibold hover:bg-slate-200 dark:hover:bg-slate-600 transition-all duration-200 text-sm sm:text-base shadow-sm hover:shadow-md"
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
