import React from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Info } from 'lucide-react';
import '../styles/bridge-styles.css';

const BridgeCancelledModal = ({ isOpen, onClose, fromChain, toChain }) => {
    const { t } = useTranslation();

    const getChainIcon = (name) => {
        if (!name) return "/icons/eth.png";
        const n = name.toLowerCase();
        if (n.includes('arc')) return "/icons/Arc.png";
        if (n.includes('base')) return "/icons/base.png";
        return "/icons/eth.png";
    };

    const modalContent = (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className="fixed inset-0 z-[1000] bridging-modal-backdrop"
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
                                        className="bridging-modal-failed-circle"
                                        style={{ backgroundColor: 'rgba(100, 116, 139, 0.12)', color: '#64748b', borderColor: 'rgba(100, 116, 139, 0.2)' }}
                                        initial={{ scale: 0, rotate: -45 }}
                                        animate={{ scale: 1, rotate: 0 }}
                                        transition={{ delay: 0.2, type: 'spring' }}
                                    >
                                        <Info size={40} strokeWidth={3} />
                                    </motion.div>
                                </div>

                                <h4 className="bridging-modal-status-title-new" style={{ color: '#64748b' }}>{t('Transaction Cancelled')}</h4>
                                <p className="bridging-modal-success-summary-text">
                                    {t('Process Stopped')}
                                </p>

                                <p className="text-center text-slate-500 dark:text-slate-400 text-sm px-6 mb-8">
                                    {t('The bridging process was cancelled or interrupted. No funds have been moved.')}
                                </p>

                                <div className="bridging-modal-success-details mb-8">
                                    <div className="bridging-modal-success-info-row">
                                        <span>{t('Source')}</span>
                                        <div className="flex items-center gap-2">
                                            <img src={getChainIcon(fromChain)} alt="" className="w-5 h-5 rounded-full object-cover" />
                                            <span className="value">{fromChain}</span>
                                        </div>
                                    </div>
                                    <div className="bridging-modal-success-info-row">
                                        <span>{t('Destination')}</span>
                                        <div className="flex items-center gap-2">
                                            <img src={getChainIcon(toChain)} alt="" className="w-5 h-5 rounded-full object-cover" />
                                            <span className="value">{toChain}</span>
                                        </div>
                                    </div>
                                </div>

                                <button
                                    onClick={onClose}
                                    className="bridging-modal-action-button-secondary-new"
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

export default BridgeCancelledModal;
