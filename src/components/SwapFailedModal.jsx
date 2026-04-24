import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle } from 'lucide-react';

/**
 * SwapFailedModal — Refined Minimalist Update
 * Clean editorial style: parity with BridgeFailedModal.
 */
const SwapFailedModal = ({ isOpen, onClose, error }) => {
    const { t } = useTranslation();

    const getCleanErrorMessage = (msg) => {
        if (!msg) return t('An unexpected error occurred. Please try again.');
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

        return msg.length > 200 ? t('An unexpected error occurred. Please try again.') : msg;
    };

    if (typeof document === 'undefined') return null;

    // Animation Variants
    const modalVariants = {
        hidden: { opacity: 0, scale: 0.96, y: 30 },
        visible: {
            opacity: 1,
            scale: 1,
            y: 0,
            transition: {
                type: "spring",
                damping: 25,
                stiffness: 400,
                staggerChildren: 0.08,
                delayChildren: 0.1
            }
        },
        exit: { opacity: 0, scale: 0.98, y: 15, transition: { duration: 0.2 } }
    };

    return createPortal(
        <AnimatePresence mode="wait">
            {isOpen && (
                <motion.div
                    className="fixed inset-0 z-[100000] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                >
                    <motion.div
                        className="w-full max-w-[440px] bg-white dark:bg-[#0B0F1A] border border-slate-200 dark:border-white/10 rounded-[32px] overflow-hidden shadow-2xl relative"
                        variants={modalVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* High-End Glass Noise Overlay */}
                        <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] blend-overlay" />

                        {/* Top Navigation / Close */}
                        <div className="px-8 pt-8 flex justify-end relative z-10">
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-slate-100 dark:hover:bg-white/5 rounded-full transition-colors text-slate-400 active:scale-95"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Status Section */}
                        <div className="px-10 pb-4 text-center relative z-10">
                            <div className="flex flex-col items-center mb-6">
                                <motion.div 
                                    initial={{ scale: 0, rotate: -45 }}
                                    animate={{ scale: 1, rotate: 0 }}
                                    transition={{ type: 'spring', delay: 0.2 }}
                                    className="w-16 h-16 rounded-full bg-slate-50 dark:bg-white/[0.03] flex items-center justify-center mb-5 border border-slate-200 dark:border-white/5"
                                >
                                    <AlertTriangle size={32} className="text-red-500" strokeWidth={2} />
                                </motion.div>
                                <span className="text-[12px] font-bold uppercase tracking-[0.2em] text-slate-900 dark:text-white font-mono">
                                    Transaction Failed
                                </span>
                            </div>

                            <p className="text-[15px] text-slate-500 dark:text-slate-400 font-medium leading-[1.4] max-w-[280px] mx-auto">
                                {getCleanErrorMessage(error?.message || error)}
                            </p>
                        </div>

                        {/* Updated Action Suite - Parity with BridgeFailedModal */}
                        <div className="px-8 pb-10 relative z-10">
                            <div className="flex gap-3">
                                <button
                                    onClick={onClose}
                                    className="flex-1 h-14 bg-[#6366F1] dark:bg-indigo-600 text-white rounded-2xl text-[13px] font-bold uppercase tracking-widest hover:brightness-110 active:scale-[0.98] transition-all shadow-[0_12px_24px_-8px_rgba(99,102,241,0.3)]"
                                >
                                    Retry
                                </button>
                                <button
                                    onClick={onClose}
                                    className="flex-1 h-14 bg-transparent border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white rounded-2xl text-[13px] font-bold uppercase tracking-widest hover:bg-slate-100 dark:hover:bg-white/5 active:scale-[0.98] transition-all"
                                >
                                    Dismiss
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>,
        document.body
    );
};

export default SwapFailedModal;

