import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useWallet } from '../contexts/WalletContext';
import { X, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const WalletModal = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const { connectWallet, isConnecting, error: walletError } = useWallet();
  const [error, setError] = useState('');

  const wallets = [
    { id: 'metamask', name: 'MetaMask', icon: '🦊', available: typeof window !== 'undefined' && window.ethereum?.isMetaMask },
    { id: 'walletconnect', name: 'WalletConnect', icon: '🔗', available: true },
    { id: 'coinbase', name: 'Coinbase Wallet', icon: '💼', available: typeof window !== 'undefined' && window.ethereum?.isCoinbaseWallet },
    { id: 'rabby', name: 'Rabby', icon: '🐰', available: typeof window !== 'undefined' && window.ethereum?.isRabby }
  ];

  const handleConnect = async (walletId) => {
    setError('');
    try {
      await connectWallet(walletId);
      onClose();
    } catch (err) {
      setError(err.message);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        />
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="relative w-full max-w-md bg-white dark:bg-gray-800 rounded-none shadow-2xl p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">{t('Connect Wallet')}</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-none"
            >
              <X size={20} />
            </button>
          </div>

          {(error || walletError) && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start space-x-2">
              <AlertCircle size={20} className="text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-600 dark:text-red-400">{error || walletError}</p>
            </div>
          )}

          <div className="space-y-3">
            {wallets.map((wallet) => (
              <button
                key={wallet.id}
                onClick={() => handleConnect(wallet.id)}
                disabled={!wallet.available || isConnecting}
                className={`w-full p-4 rounded-none border-2 transition-all duration-200 flex items-center justify-between
                  ${wallet.available
                    ? 'border-gray-200 dark:border-gray-700 hover:border-primary-500 hover:shadow-lg'
                    : 'border-gray-100 dark:border-gray-800 opacity-50 cursor-not-allowed'
                  }
                  ${isConnecting ? 'opacity-50 cursor-wait' : ''}
                `}
              >
                <div className="flex items-center space-x-3">
                  <span className="text-3xl">{wallet.icon}</span>
                  <span className="font-semibold">{wallet.name}</span>
                </div>
                {!wallet.available && (
                  <span className="text-xs text-gray-500">{t('Not installed')}</span>
                )}
              </button>
            ))}
          </div>

          <p className="mt-6 text-xs text-center text-gray-500 dark:text-gray-400">
            {t('By connecting a wallet, you agree to our Terms of Service')}
          </p>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default WalletModal;
