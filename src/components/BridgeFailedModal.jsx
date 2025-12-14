import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertCircle } from 'lucide-react';

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
                <div className="relative">
                  {/* Red circle with exclamation mark */}
                  <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                    <AlertCircle size={32} className="text-red-500" />
                  </div>
                  {/* Green X overlay */}
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-green-500 flex items-center justify-center">
                    <X size={16} className="text-white" />
                  </div>
                </div>
              </div>

              <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">
                Bridge Failed
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
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{fromChain}</p>
                </div>
                
                <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700 relative">
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-red-500 flex items-center justify-center">
                    <X size={16} className="text-white" />
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
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{toChain}</p>
                </div>
              </div>

              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Bridge transaction failed
              </p>
              
              <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 text-left mb-6">
                <h4 className="font-semibold text-red-800 dark:text-red-200 mb-2">{errorTitle}</h4>
                <p className="text-sm text-red-600 dark:text-red-300">
                  {errorMessage}
                </p>
              </div>
              
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                Please try again or contact support if the issue persists.
              </p>
              
              {/* Retry button */}
              <button 
                onClick={onClose}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
              >
                Try Again
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default BridgeFailedModal;