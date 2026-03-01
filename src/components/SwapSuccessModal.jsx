import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, ExternalLink } from 'lucide-react';
import { getExplorerUrl } from '../utils/blockchain';
import { useWallet } from '../hooks/useWallet';
import '../styles/swap-styles.css';

const SwapSuccessModal = ({ isOpen, onClose, fromToken, toToken, fromAmount, toAmount, txHash }) => {
    const { t } = useTranslation();
    const { chainId } = useWallet();

    const formatAmount = (val) => {
        if (!val) return '0.00';
        const num = parseFloat(val);
        if (num === 0) return '0.00';
        return num.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    };

    const getTokenIcon = (symbol) => {
        if (!symbol) return null;
        const s = String(symbol).toUpperCase();
        const iconMap = {
            'USDC': '/icons/usdc.png',
            'STC': '/icons/stc.png',
            'STAC': '/icons/stc.png',
            'BALL': '/icons/ball.png',
            'MTB': '/icons/mtb.png',
            'ECR': '/icons/ecr.png',
            'EURC': '/icons/eurc.png',
            'ETH': '/icons/eth.png'
        };
        return iconMap[s] || null;
    };

    const explorerUrl = txHash ? getExplorerUrl(txHash, chainId) : null;

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
                                <div className="swap-modal-success-icon-wrapper mb-3">
                                    <div className="swap-modal-checkmark-circle">
                                        <Check size={32} strokeWidth={4} />
                                    </div>
                                </div>
                                <h2 className="swap-confirm-title text-center !mb-1">{t('Swap Successful!')}</h2>
                                <p className="text-[13px] text-slate-500 dark:text-slate-400 font-medium">
                                    {t('Your transaction has been processed')}
                                </p>
                            </div>

                            {/* Token Section */}
                            <div className="swap-confirm-token-section mb-6">
                                <div className="swap-confirm-token-row">
                                    <div className="swap-confirm-token-icon">
                                        <img src={getTokenIcon(fromToken?.symbol)} alt="" />
                                    </div>
                                    <div className="swap-confirm-token-info">
                                        <span className="swap-confirm-token-label">{t('SOLD')}</span>
                                        <span className="swap-confirm-token-amount">{formatAmount(fromAmount)} {fromToken?.symbol}</span>
                                    </div>
                                </div>

                                <div className="swap-confirm-token-row mt-3">
                                    <div className="swap-confirm-token-icon">
                                        <img src={getTokenIcon(toToken?.symbol)} alt="" />
                                    </div>
                                    <div className="swap-confirm-token-info">
                                        <span className="swap-confirm-token-label">{t('RECEIVED')}</span>
                                        <span className="swap-confirm-token-amount text-slate-500">{formatAmount(toAmount)} {toToken?.symbol}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Links & CTA */}
                            <div className="flex flex-col gap-3">
                                {explorerUrl && (
                                    <a
                                        href={explorerUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="group flex items-center justify-center gap-2.5 w-full py-3.5 bg-slate-50/50 dark:bg-white/[0.03] border border-slate-200/60 dark:border-white/10 rounded-2xl text-slate-600 dark:text-slate-400 hover:text-black dark:text-white dark:hover:text-black dark:text-white hover:border-black dark:border-white hover:bg-slate-50 dark:bg-black dark:hover:bg-black dark:bg-white transition-all duration-300 font-bold text-[13px] tracking-tight"
                                    >
                                        <ExternalLink size={14} className="opacity-60 group-hover:opacity-100 transition-opacity" />
                                        {t('View on Explorer')}
                                    </a>
                                )}
                                <button
                                    onClick={onClose}
                                    className="swap-modal-action-button"
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
