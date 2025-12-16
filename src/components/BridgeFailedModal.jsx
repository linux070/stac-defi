import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertCircle, RefreshCw } from 'lucide-react';

const BridgeFailedModal = ({ isOpen, onClose, fromChain, toChain, errorTitle, errorMessage }) => {
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
                <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                  <AlertCircle size={32} className="text-red-500" />
                </div>
              </div>

              <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">
                {errorTitle || 'Bridge Failed'}
              </h3>

              <div className="flex items-center justify-center space-x-4 my-6">
                <div className="text-center">
                  <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mx-auto mb-2">
                    {fromChain?.includes('Arc') ? (
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
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{fromChain}</p>
                </div>
                
                <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700 relative">
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-red-500 flex items-center justify-center">
                    <X size={16} className="text-white" />
                  </div>
                </div>
                
                <div className="text-center">
                  <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mx-auto mb-2">
                    {toChain?.includes('Arc') ? (
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
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{toChain}</p>
                </div>
              </div>

              <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 mb-6 text-left">
                <p className="text-sm text-red-800 dark:text-red-200 font-medium mb-2">Error Details:</p>
                <p className="text-sm text-red-700 dark:text-red-300">
                  {errorMessage || 'An unknown error occurred during the bridge transaction.'}
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 py-3 px-4 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg font-semibold hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    onClose();
                    // The parent component will handle retry logic
                    window.location.reload();
                  }}
                  className="flex-1 py-3 px-4 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"
                >
                  <RefreshCw size={18} />
                  Retry
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default BridgeFailedModal;
