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
            'STC': '/icons/stc.png',
            'BALL': '/icons/ball.png',
            'MTB': '/icons/mtb.png',
            'ECR': '/icons/ecr.png',
            'EURC': '/icons/eurc.png'
        };
        return iconMap[symbol] || null;
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
                            <div className="flex flex-col items-center mb-6">
                                <div className="swap-modal-warning-circle-wrapper mb-5">
                                    <div className="swap-modal-checkmark-circle" style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', borderColor: 'rgba(245, 158, 11, 0.15)', width: '80px', height: '80px' }}>
                                        <AlertTriangle size={36} strokeWidth={2} />
                                    </div>
                                </div>

                                <h2 className="text-[22px] font-bold text-center !mb-1" style={{ color: '#f59e0b', letterSpacing: '-0.01em' }}>
                                    {t('Transaction Rejected')}
                                </h2>
                                <p className="text-[14px] text-slate-500 font-semibold mb-6">
                                    {t('User Rejected Request')}
                                </p>

                                <p className="text-[14px] text-slate-400 dark:text-slate-500 text-center leading-relaxed px-6 mb-8 font-medium">
                                    {t('The transaction was rejected in your wallet. If this was a mistake, please try again.')}
                                </p>

                                <div className="swap-rejected-info-box w-full mb-8">
                                    <div className="flex items-center justify-between py-1">
                                        <span className="text-[14px] text-slate-400 font-medium">{t('Selling')}</span>
                                        <div className="flex items-center gap-2.5">
                                            <img src={getTokenIcon(fromToken?.symbol)} alt="" className="w-6 h-6 rounded-full" />
                                            <span className="text-[15px] font-bold text-slate-600 dark:text-white">{fromToken?.symbol || 'USDC'}</span>
                                        </div>
                                    </div>
                                    <div className="h-[1px] bg-slate-100 dark:bg-white/5 my-4" />
                                    <div className="flex items-center justify-between py-1">
                                        <span className="text-[14px] text-slate-400 font-medium">{t('Buying')}</span>
                                        <div className="flex items-center gap-2.5">
                                            <img src={getTokenIcon(toToken?.symbol)} alt="" className="w-6 h-6 rounded-full" />
                                            <span className="text-[15px] font-bold text-slate-600 dark:text-white">{toToken?.symbol || 'STC'}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={onClose}
                                className="swap-rejected-back-button"
                            >
                                {t('Back to Swap')}
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );

    return createPortal(modalContent, document.body);
};

export default SwapRejectedModal;
