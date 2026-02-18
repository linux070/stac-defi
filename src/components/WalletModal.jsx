import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useConnect } from 'wagmi';

const WalletModal = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const { connectors, connect } = useConnect();

  const handleConnect = async (connector) => {
    try {
      await connect({ connector });
      onClose();
    } catch (error) {
      console.error('Connection error:', error);
    }
  };

  if (!isOpen) return null;

  const modalContent = (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100000] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/40 backdrop-blur-[4px]"
          style={{ WebkitBackdropFilter: 'blur(1px)' }}
          onClick={onClose}
        />
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="relative w-full max-w-[380px] bg-white dark:bg-[#0f172a] shadow-2xl p-6 max-h-[80dvh] overflow-y-auto rounded-[28px] border border-black/10 dark:border-white/10"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">{t('Connect Wallet')}</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <div className="space-y-3">
            {connectors.map((connector) => (
              <button
                key={connector.id}
                onClick={() => handleConnect(connector)}
                className="w-full flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-2xl border border-gray-100 dark:border-white/5 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white dark:bg-gray-700 flex items-center justify-center p-2 shadow-sm">
                    {connector.icon ? (
                      <img src={connector.icon} alt={connector.name} className="w-full h-full object-contain" />
                    ) : (
                      <div className="w-full h-full bg-blue-500/10 rounded-lg" />
                    )}
                  </div>
                  <span className="font-bold text-gray-900 dark:text-white capitalize">{connector.name}</span>
                </div>
                <div className="w-8 h-8 rounded-full bg-white dark:bg-gray-700 flex items-center justify-center transition-transform group-hover:translate-x-1">
                  <span className="text-blue-500">→</span>
                </div>
              </button>
            ))}
          </div>

          <p className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
            {t('By connecting, you agree to our Terms of Service and Privacy Policy.')}
          </p>
        </motion.div>
      </div>
    </AnimatePresence>
  );

  return createPortal(modalContent, document.body);
};

export default WalletModal;
