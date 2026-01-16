import React from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertCircle } from 'lucide-react';
import '../styles/swap-styles.css';

const SwapFailedModal = ({ isOpen, onClose, error, fromToken, toToken }) => {
    const { t } = useTranslation();

    const getCleanErrorMessage = (msg) => {
        if (!msg) return t('User rejected the transaction in wallet.');

        const lowerMsg = msg.toLowerCase();

        // User rejection
        if (lowerMsg.includes('user rejected') || lowerMsg.includes('user denied') || lowerMsg.includes('action_rejected')) {
            return t('Transaction cancelled: You rejected the request in your wallet.');
        }

        // Insufficient funds
        if (lowerMsg.includes('insufficient funds') || lowerMsg.includes('exceeds the balance')) {
            return t('Insufficient funds: You do not have enough native tokens to cover the gas fee.');
        }

        // Slippage / Price Impact
        if (lowerMsg.includes('slippage') || lowerMsg.includes('price impact') || lowerMsg.includes('too much')) {
            return t('Swap failed due to high price impact or slippage. Please try increasing your slippage tolerance.');
        }

        // fallback for short technical strings
        if (msg.length > 150) {
            return t('The transaction was cancelled or failed on-chain. Please verify your wallet and try again.');
        }

        return msg;
    };

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
                                        className="swap-modal-failed-circle"
                                        initial={{ scale: 0, rotate: -45 }}
                                        animate={{ scale: 1, rotate: 0 }}
                                        transition={{ delay: 0.2, type: 'spring' }}
                                    >
                                        <X size={40} strokeWidth={4} />
                                    </motion.div>
                                </div>

                                <h4 className="swap-modal-status-title-new title-failed">
                                    {t('Swap Failed')}
                                </h4>

                                <p className="swap-modal-status-text px-4 mb-6">
                                    {getCleanErrorMessage(error?.message || error)}
                                </p>

                                <div className="swap-modal-success-details mb-8">
                                    <div className="swap-modal-success-info-row">
                                        <span>{t('From')}</span>
                                        <div className="flex items-center gap-2">
                                            <img src={getTokenIcon(fromToken?.symbol)} alt="" className="w-5 h-5 rounded-full object-cover" />
                                            <span className="value">{fromToken?.symbol}</span>
                                        </div>
                                    </div>
                                    <div className="swap-modal-success-info-row">
                                        <span>{t('To')}</span>
                                        <div className="flex items-center gap-2">
                                            <img src={getTokenIcon(toToken?.symbol)} alt="" className="w-5 h-5 rounded-full object-cover" />
                                            <span className="value">{toToken?.symbol}</span>
                                        </div>
                                    </div>
                                </div>

                                <button
                                    onClick={onClose}
                                    className="swap-modal-action-button-secondary-new"
                                >
                                    {t('Try Again')}
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

export default SwapFailedModal;
