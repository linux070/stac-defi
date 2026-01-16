import React from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, ExternalLink, ArrowRight } from 'lucide-react';
import { getExplorerUrl } from '../utils/blockchain';
import { useWallet } from '../contexts/WalletContext';
import '../styles/swap-styles.css';

const SwapSuccessModal = ({ isOpen, onClose, fromToken, toToken, fromAmount, toAmount, txHash }) => {
    const { t } = useTranslation();
    const { chainId } = useWallet();

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

    const explorerUrl = txHash ? getExplorerUrl(txHash, chainId) : null;

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
                                        className="swap-modal-checkmark-circle"
                                        initial={{ scale: 0, rotate: -45 }}
                                        animate={{ scale: 1, rotate: 0 }}
                                        transition={{ delay: 0.2, type: 'spring' }}
                                    >
                                        <Check size={40} strokeWidth={4} />
                                    </motion.div>
                                </div>

                                <h4 className="swap-modal-status-title-new">{t('Transaction Confirmed!')}</h4>
                                <div className="swap-modal-success-summary-text">
                                    {t('Swap Successful!')}
                                </div>

                                <div className="swap-modal-success-summary-visual my-8">
                                    <div className="swap-modal-success-token-badge">
                                        <img src={getTokenIcon(fromToken?.symbol)} alt="" className="swap-modal-success-token-img" />
                                        <span>{fromAmount} {fromToken?.symbol}</span>
                                    </div>
                                    <div className="swap-modal-success-path-arrow">
                                        <ArrowRight size={18} />
                                    </div>
                                    <div className="swap-modal-success-token-badge">
                                        <img src={getTokenIcon(toToken?.symbol)} alt="" className="swap-modal-success-token-img" />
                                        <span>{toAmount} {toToken?.symbol}</span>
                                    </div>
                                </div>

                                {explorerUrl && (
                                    <a
                                        href={explorerUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center justify-center gap-2 text-blue-500 hover:text-blue-600 font-semibold text-sm mb-6 transition-colors"
                                    >
                                        {t('View on Explorer')}
                                        <ExternalLink size={14} />
                                    </a>
                                )}

                                <button
                                    onClick={onClose}
                                    className="swap-modal-action-button-secondary-new"
                                >
                                    {t('Done')}
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

export default SwapSuccessModal;
