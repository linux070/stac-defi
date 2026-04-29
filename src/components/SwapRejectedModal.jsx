import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle, ArrowRight } from 'lucide-react';

const SwapRejectedModal = ({ isOpen, onClose, fromToken, toToken }) => {
    const { t } = useTranslation();

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

    if (typeof document === 'undefined') return null;

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className="fixed inset-0 z-[100000] flex items-center justify-center p-4 bg-black/40 dark:bg-black/60 backdrop-blur-sm"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                >
                    <motion.div
                        className="w-full max-w-[420px] max-h-[calc(100dvh-40px)] overflow-y-auto custom-scrollbar bg-white dark:bg-[#121212] border border-slate-200/60 dark:border-white/5 rounded-[24px] sm:rounded-[32px] overflow-hidden shadow-2xl dark:shadow-[0_32px_64px_-12px_rgba(0,0,0,0.8)]"
                        initial={{ scale: 0.95, opacity: 0, y: 12 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.95, opacity: 0, y: 12 }}
                        transition={{ type: 'spring', damping: 28, stiffness: 380 }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header Area */}
                        <div className="relative px-6 sm:px-8 pt-8 sm:pt-10 pb-6 flex flex-col items-center text-center">
                            <button
                                onClick={onClose}
                                className="absolute top-6 right-6 w-8 h-8 flex items-center justify-center rounded-full bg-slate-50 dark:bg-white/5 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
                            >
                                <X size={15} strokeWidth={2.5} />
                            </button>

                            {/* Circular Warning Icon with Wave Pulse */}
                            <div className="relative mb-6">
                                <motion.div 
                                    className="absolute -inset-1 rounded-full border-2 border-amber-500/30"
                                    animate={{ scale: [1, 1.4, 1], opacity: [0.6, 0, 0.6] }}
                                    transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
                                />
                                <div className="w-14 h-14 rounded-full bg-amber-500 flex items-center justify-center text-white">
                                    <AlertTriangle size={24} strokeWidth={3} className="mt-[1px]" />
                                </div>
                            </div>

                            <h2 className="text-[22px] font-['Satoshi','Inter',sans-serif] font-bold text-slate-900 dark:text-white tracking-tight leading-tight mb-1.5">
                                Transaction Rejected
                            </h2>
                            <p className="max-w-[85%] text-[13px] font-medium text-slate-500 dark:text-slate-400">
                                You rejected the request in your wallet. If this was a mistake, please try again.
                            </p>
                        </div>

                        {/* Transaction Detail Box (Double-Bezel) */}
                        <div className="px-6 mb-8 pt-2">
                            <div className="p-1.5 bg-slate-100/30 dark:bg-white/[0.02] border border-slate-100/50 dark:border-white/5 rounded-[2.5rem]">
                                <div className="bg-white dark:bg-[#0D111C] border border-slate-200/20 dark:border-white/5 rounded-[calc(2.5rem-6px)] p-6 shadow-sm">
                                    <div className="flex items-center justify-between gap-4">
                                        <div className="flex-1 flex flex-col items-center gap-2 min-w-0">
                                            <span className="text-[10px] font-mono tracking-widest text-slate-600 dark:text-slate-300 font-bold uppercase">Selling</span>
                                            <div className="flex items-center gap-2.5">
                                                <img src={getTokenIcon(fromToken?.symbol)} alt="" className="w-7 h-7 rounded-full" />
                                                <span className="text-[17px] font-['Satoshi','Inter',sans-serif] font-bold text-slate-900 dark:text-white">{fromToken?.symbol || 'USDC'}</span>
                                            </div>
                                        </div>

                                        <div className="w-9 h-9 flex items-center justify-center rounded-full bg-slate-50 dark:bg-white/5 flex-shrink-0">
                                            <ArrowRight size={14} className="text-slate-400" />
                                        </div>

                                        <div className="flex-1 flex flex-col items-center gap-2 min-w-0">
                                             <span className="text-[10px] font-mono tracking-widest text-slate-600 dark:text-slate-300 font-bold uppercase">Buying</span>
                                            <div className="flex items-center gap-2.5">
                                                <img src={getTokenIcon(toToken?.symbol)} alt="" className="w-7 h-7 rounded-full" />
                                                <span className="text-[17px] font-['Satoshi','Inter',sans-serif] font-bold text-slate-900 dark:text-white">{toToken?.symbol || 'EURC'}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons Cluster */}
                        <div className="px-6 sm:px-8 pb-8 sm:pb-10">
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={onClose}
                                    className="flex-1 h-12 rounded-[1.25rem] bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 text-slate-900 dark:text-white font-bold text-[14px] active:scale-[0.98] transition-all"
                                >
                                    Back to Swap
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

export default SwapRejectedModal;
