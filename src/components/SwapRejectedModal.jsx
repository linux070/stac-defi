import React from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle } from 'lucide-react';
import '../styles/swap-styles.css';

const SwapRejectedModal = ({ isOpen, onClose, fromToken, toToken }) => {
    const { t } = useTranslation();

    const getTokenIcon = (symbol) => {
        const iconMap = {
            'USDC': '/icons/usdc.png',
            'STC': '/icons/STC.png',
            'BALL': '/icons/ball.jpg',
            'MTB': '/icons/MTB.png',
            'ECR': '/icons/ECR.png'
        };
        return iconMap[symbol] || null;
    };

    const modalContent = (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className="fixed inset-0 z-[1000] swap-modal-backdrop"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                >
                    <motion.div
                        className="relative swap-modal-container max-w-[440px] w-full mx-4"
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 400 }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            onClick={onClose}
                            className="swap-modal-close-button-alt"
                            aria-label="Close"
                        >
                            <X size={20} />
                        </button>

                        <div className="swap-modal-content">
                            <div className="swap-modal-status-card-new">
                                <div className="swap-modal-success-icon-wrapper">
                                    <motion.div
                                        className="swap-modal-error-circle"
                                        style={{ backgroundColor: 'rgba(245, 158, 11, 0.12)', color: '#f59e0b', borderColor: 'rgba(245, 158, 11, 0.2)' }}
                                        initial={{ scale: 0, rotate: -45 }}
                                        animate={{ scale: 1, rotate: 0 }}
                                        transition={{ delay: 0.2, type: 'spring' }}
                                    >
                                        <AlertTriangle size={40} strokeWidth={3} />
                                    </motion.div>
                                </div>

                                <h4 className="swap-modal-status-title-new" style={{ color: '#f59e0b' }}>{t('Transaction Rejected')}</h4>
                                <p className="swap-modal-success-summary-text">
                                    {t('User Rejected Request')}
                                </p>

                                <p className="text-center text-slate-500 dark:text-slate-400 text-sm px-6 mb-4">
                                    {t('The transaction was rejected in your wallet. If this was a mistake, please try again.')}
                                </p>



                                <button
                                    onClick={onClose}
                                    className="swap-modal-action-button-secondary-new"
                                >
                                    {t('Back to Swap')}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );

    return createPortal(modalContent, document.body);
};

export default SwapRejectedModal;
