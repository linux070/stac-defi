import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle } from 'lucide-react';
import '../styles/bridge-styles.css';

const BridgeRejectedModal = ({ isOpen, onClose, fromChain, toChain }) => {
    const { t } = useTranslation();

    const getChainIcon = (name) => {
        if (!name) return "/icons/eth.png";
        const n = String(name).toLowerCase();
        if (n.includes('arc')) return "/icons/arc.png";
        if (n.includes('base')) return "/icons/base.png";
        return "/icons/eth.png";
    };

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
                        className="w-full max-w-[420px] max-h-[calc(100dvh-40px)] overflow-y-auto custom-scrollbar bg-white dark:bg-surface-dark rounded-[24px] sm:rounded-[32px] overflow-hidden shadow-2xl dark:shadow-[0_32px_64px_-12px_rgba(0,0,0,0.8)] border border-slate-200 dark:border-white/10"
                        initial={{ scale: 0.95, opacity: 0, y: 30 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.95, opacity: 0, y: 30 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 400 }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="p-6 sm:p-8 pb-4 text-center">
                            <div className="flex justify-end -mr-4 -mt-4 mb-2">
                                <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-white/5 rounded-full transition-colors text-slate-400">
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="flex flex-col items-center mb-6">
                                <motion.div
                                    initial={{ scale: 0, rotate: -45 }}
                                    animate={{ scale: 1, rotate: 0 }}
                                    transition={{ type: 'spring', delay: 0.2 }}
                                    className="w-16 h-16 rounded-full bg-slate-50 dark:bg-white/[0.03] flex items-center justify-center mb-5 border border-slate-200 dark:border-white/5"
                                >
                                    <AlertTriangle size={32} className="text-amber-500" strokeWidth={2} />
                                </motion.div>
                                <span className="text-[12px] font-bold uppercase tracking-[0.2em] text-slate-900 dark:text-white font-mono">
                                    Transaction Rejected
                                </span>
                            </div>

                            <p className="text-[15px] text-slate-500 dark:text-slate-400 font-medium leading-[1.4] max-w-[280px] mx-auto">
                                {t('The transaction was rejected in your wallet. If this was a mistake, please try again.')}
                            </p>
                        </div>

                        <div className="px-6 sm:px-8 pb-8 sm:pb-10 space-y-4 sm:space-y-6">
                            <div className="bg-slate-50 dark:bg-white/[0.03] border border-slate-200/50 dark:border-white/5 rounded-[24px] p-6 space-y-5">
                                <div className="flex justify-between items-center">
                                    <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-widest">{t('Source')}</span>
                                    <div className="flex items-center gap-2">
                                        <img src={getChainIcon(fromChain)} className="w-5 h-5 rounded-full" alt="" />
                                        <span className="text-sm font-medium text-slate-900 dark:text-white">{fromChain}</span>
                                    </div>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-widest">{t('Destination')}</span>
                                    <div className="flex items-center gap-2">
                                        <img src={getChainIcon(toChain)} className="w-5 h-5 rounded-full" alt="" />
                                        <span className="text-sm font-medium text-slate-900 dark:text-white">{toChain}</span>
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={onClose}
                                className="w-full py-4 bg-slate-900 dark:bg-white text-white dark:text-black rounded-xl text-xs font-bold uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-black/5"
                            >
                                {t('Back to Bridge')}
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );

    return createPortal(modalContent, document.body);
};

export default BridgeRejectedModal;
