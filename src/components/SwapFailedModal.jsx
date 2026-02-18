import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertCircle } from 'lucide-react';
import '../styles/swap-styles.css';

const SwapFailedModal = ({ isOpen, onClose, error }) => {
    const { t } = useTranslation();

    const getCleanErrorMessage = (msg) => {
        if (!msg) return t('The transaction was cancelled or failed on-chain.');
        const lowerMsg = String(msg).toLowerCase();

        if (lowerMsg.includes('user rejected') || lowerMsg.includes('user denied') || lowerMsg.includes('action_rejected')) {
            return t('Transaction cancelled: You rejected the request in your wallet.');
        }
        if (lowerMsg.includes('insufficient funds') || lowerMsg.includes('exceeds the balance')) {
            return t('Insufficient balance to cover the transaction cost.');
        }
        if (lowerMsg.includes('slippage') || lowerMsg.includes('price impact') || lowerMsg.includes('too much')) {
            return t('Swap failed due to high price impact or slippage.');
        }

        return msg.length > 120 ? t('The transaction failed. Please try again.') : msg;
    };


    const modalContent = (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className="swap-modal-backdrop"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                >
                    <motion.div
                        className="swap-modal-container swap-confirm-modal"
                        initial={{ scale: 0.95, opacity: 0, y: 12 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.95, opacity: 0, y: 12 }}
                        transition={{ type: 'spring', damping: 28, stiffness: 380 }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            onClick={onClose}
                            className="swap-modal-close-button-alt"
                            aria-label="Close"
                        >
                            <X size={18} />
                        </button>

                        <div className="swap-modal-content">
                            <div className="flex flex-col items-center mb-8">
                                <div className="swap-modal-error-circle-wrapper mb-4">
                                    <div className="swap-modal-error-circle">
                                        <AlertCircle size={32} strokeWidth={2.5} className="text-red-500" />
                                    </div>
                                </div>
                                <h2 className="swap-confirm-title text-center !mb-2" style={{ color: '#ef4444' }}>{t('Swap Failed')}</h2>
                                <p className="text-[14px] text-slate-500 dark:text-slate-400 text-center leading-relaxed px-4">
                                    {getCleanErrorMessage(error?.message || error)}
                                </p>
                            </div>


                            <button
                                onClick={onClose}
                                className="swap-modal-action-button"
                            >
                                {t('Try Again')}
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );

    return createPortal(modalContent, document.body);
};

export default SwapFailedModal;
