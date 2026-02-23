import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, ExternalLink } from 'lucide-react';
import { getExplorerUrl } from '../utils/blockchain';
import { useWallet } from '../hooks/useWallet';
import '../styles/bridge-styles.css';

const BridgeSuccessModal = ({ isOpen, onClose, fromChain, toChain, amount, timeTaken, txHash }) => {
    const { t } = useTranslation();
    const { chainId } = useWallet();

    const getChainIcon = (name) => {
        if (!name) return "/icons/eth.png";
        const n = String(name).toLowerCase();
        if (n.includes('arc')) return "/icons/arc.png";
        if (n.includes('base')) return "/icons/base.png";
        return "/icons/eth.png";
    };

    const explorerUrl = txHash ? getExplorerUrl(txHash, fromChain?.includes('Arc') ? '0x4cef52' : chainId) : null;

    const modalContent = (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className="fixed inset-0 z-[100000] bridging-modal-backdrop"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                >
                    <motion.div
                        className="relative bridging-modal-container"
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 400 }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            onClick={onClose}
                            className="bridging-modal-close-button-alt"
                            aria-label="Close"
                        >
                            <X size={20} />
                        </button>

                        <div className="bridging-modal-content">
                            <div className="bridging-modal-status-card-new">
                                <div className="bridging-modal-success-icon-wrapper">
                                    <motion.div
                                        className="bridging-modal-checkmark-circle"
                                        initial={{ scale: 0, rotate: -45 }}
                                        animate={{ scale: 1, rotate: 0 }}
                                        transition={{ delay: 0.2, type: 'spring' }}
                                    >
                                        <Check size={40} strokeWidth={4} />
                                    </motion.div>
                                </div>

                                <h4 className="bridging-modal-status-title-new">{t('Transaction Confirmed!')}</h4>
                                <p className="bridging-modal-success-summary-text">
                                    {t('Bridge Successful!')}
                                </p>

                                <div className="bridging-modal-success-details mb-8">
                                    <div className="bridging-modal-success-info-row">
                                        <span>{t('Amount')}</span>
                                        <span className="value">{amount} USDC</span>
                                    </div>
                                    <div className="bridging-modal-success-info-row">
                                        <span>{t('Time taken')}</span>
                                        <span className="value">{timeTaken}</span>
                                    </div>
                                    <div className="bridging-modal-success-info-row">
                                        <span>{t('From')}</span>
                                        <div className="flex items-center gap-2">
                                            <div className={`w-5 h-5 ${fromChain?.toLowerCase().includes('base') ? 'base-sepolia-icon-representation' : 'rounded-full overflow-hidden'}`}>
                                                <img src={getChainIcon(fromChain)} alt="" className="w-full h-full object-cover" />
                                            </div>
                                            <span className="value">{fromChain}</span>
                                        </div>
                                    </div>
                                    <div className="bridging-modal-success-info-row">
                                        <span>{t('To')}</span>
                                        <div className="flex items-center gap-2">
                                            <div className={`w-5 h-5 ${toChain?.toLowerCase().includes('base') ? 'base-sepolia-icon-representation' : 'rounded-full overflow-hidden'}`}>
                                                <img src={getChainIcon(toChain)} alt="" className="w-full h-full object-cover" />
                                            </div>
                                            <span className="value">{toChain}</span>
                                        </div>
                                    </div>
                                </div>

                                {explorerUrl && (
                                    <a
                                        href={explorerUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="group flex items-center justify-center gap-2.5 w-full py-3.5 bg-slate-50/50 dark:bg-white/[0.03] border border-slate-200/60 dark:border-white/10 rounded-2xl text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-500/30 hover:bg-blue-50/50 dark:hover:bg-blue-500/5 transition-all duration-300 font-bold text-[13px] mb-6 tracking-tight"
                                    >
                                        <ExternalLink size={14} className="opacity-60 group-hover:opacity-100 transition-opacity" />
                                        {t('View on Explorer')}
                                    </a>
                                )}

                                <button
                                    onClick={onClose}
                                    className="bridging-modal-action-button-secondary-new"
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

export default BridgeSuccessModal;
