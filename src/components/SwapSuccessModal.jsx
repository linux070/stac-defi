import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, ExternalLink } from 'lucide-react';
import { getExplorerUrl } from '../utils/blockchain';
import { useWallet } from '../hooks/useWallet';
import { useState } from 'react';

/**
 * SwapSuccessModal — Agency-Grade "Liquid Glass" Redesign
 * Inspired by Jumper/Stac architecture. 
 * Final Refinement: Focused actions and enhanced copy interaction.
 */
const SwapSuccessModal = ({ isOpen, onClose, fromToken, toToken, fromAmount, toAmount, actualAmount, txHash }) => {
    const { t } = useTranslation();
    const { chainId } = useWallet();

    // Final display amount prioritizes on-chain ground truth over UI quotes
    const displayToAmount = actualAmount || toAmount;

    const formatAmount = (val) => {
        if (!val) return '0.0000';
        const num = parseFloat(val);
        if (num === 0) return '0.0000';
        return num.toLocaleString(undefined, {
            minimumFractionDigits: 4,
            maximumFractionDigits: 4
        });
    };

    const getTokenIcon = (symbol) => {
        if (!symbol) return null;
        const s = String(symbol).toUpperCase();
        const iconMap = {
            'USDC': '/icons/usdc.png',
            'EURC': '/icons/eurc.png',
            'STC': '/icons/stc.png',
            'STAC': '/icons/stc.png',
            'BALL': '/icons/ball.png',
            'MTB': '/icons/mtb.png',
            'ETH': '/icons/eth.png'
        };
        return iconMap[s] || null;
    };

    const explorerUrl = txHash ? getExplorerUrl(txHash, chainId) : null;

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
                stiffness: 350,
                duration: 0.5,
                staggerChildren: 0.08,
                delayChildren: 0.1
            }
        },
        exit: { opacity: 0, scale: 0.98, y: 15, transition: { duration: 0.2 } }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 15 },
        visible: { opacity: 1, y: 0, transition: { type: "spring", damping: 20, stiffness: 300 } }
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
                        className="w-full max-w-[480px] bg-white dark:bg-[#0B0F1A] border border-slate-200 dark:border-white/10 rounded-[32px] overflow-hidden shadow-2xl relative"
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
                                className="w-10 h-10 flex items-center justify-center rounded-full bg-slate-50 dark:bg-white/[0.04] text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200/50 dark:border-white/[0.08] active:scale-95 transition-all duration-300"
                            >
                                <X size={18} strokeWidth={2.5} />
                            </button>
                        </div>

                        {/* Status Section */}
                        <div className="px-10 pb-2 text-center relative z-10">
                            <motion.div variants={itemVariants} className="flex flex-col items-center">
                                <div className="relative mb-4">
                                    <div className="w-16 h-16 rounded-full bg-emerald-500 flex items-center justify-center text-white shadow-[0_0_40px_-8px_rgba(16,185,129,0.4)] relative">
                                        <Check size={32} strokeWidth={4} />
                                    </div>
                                </div>

                                <h2 className="text-[12px] font-bold uppercase tracking-[0.2em] text-slate-900 dark:text-white font-mono mb-4">
                                    Transaction Completed
                                </h2>
                                <p className="text-[14px] font-medium text-slate-500 dark:text-slate-400 max-w-[280px] mx-auto leading-relaxed">
                                    Your transaction has been completed on the network.
                                </p>
                            </motion.div>
                        </div>

                        {/* Transaction Receipt */}
                        <motion.div variants={itemVariants} className="px-8 mt-2 mb-2 relative z-10">
                            <div className="bg-slate-50 dark:bg-white/[0.03] border border-slate-100 dark:border-white/5 rounded-[24px] p-6 relative overflow-hidden flex flex-col gap-4">
                                {/* Input Asset Row */}
                                <div className="flex items-center justify-between px-2 relative z-10">
                                    <div className="flex items-center gap-4">
                                        <div className="relative">
                                            <div className="w-10 h-10 rounded-full overflow-hidden border border-slate-200 dark:border-white/10 p-0 bg-white dark:bg-white/5 shadow-sm">
                                                <img src={getTokenIcon(fromToken?.symbol)} alt="" className="w-full h-full object-cover" />
                                            </div>
                                            <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-white dark:bg-[#0B0F1A] border border-slate-200 dark:border-white/10 p-0.5 shadow-sm">
                                                <img src="/icons/arc.png" alt="" className="w-full h-full object-contain" />
                                            </div>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[14px] font-geist font-bold text-slate-900 dark:text-white uppercase tracking-tight leading-none mb-1">{fromToken?.symbol}</span>
                                            <span className="text-[10px] font-mono font-medium text-slate-400 dark:text-slate-500 uppercase tracking-widest">Sent</span>
                                        </div>
                                    </div>
                                    <span className="text-[20px] font-mono font-medium text-slate-900 dark:text-white tracking-tighter tabular-nums leading-none">
                                        {formatAmount(fromAmount)}
                                    </span>
                                </div>

                                {/* Compact Vertical Flow Connector */}
                                <div className="flex px-2 relative z-10 -my-2">
                                    <div className="w-[1px] h-4 bg-gradient-to-b from-slate-200 to-transparent dark:from-white/10 flex items-center justify-center relative left-[20px]">
                                        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-3 bg-slate-200 dark:bg-white/10 rounded-full" />
                                    </div>
                                </div>

                                {/* Output Asset Row */}
                                <div className="flex items-center justify-between px-2 relative z-10">
                                    <div className="flex items-center gap-4">
                                        <div className="relative">
                                            <div className="w-10 h-10 rounded-full overflow-hidden border border-slate-200 dark:border-white/10 p-0 bg-white dark:bg-white/5 shadow-sm">
                                                <img src={getTokenIcon(toToken?.symbol)} alt="" className="w-full h-full object-cover" />
                                            </div>
                                            <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-white dark:bg-[#0B0F1A] border border-slate-200 dark:border-white/10 p-0.5 shadow-sm">
                                                <img src="/icons/arc.png" alt="" className="w-full h-full object-contain" />
                                            </div>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[14px] font-geist font-bold text-slate-900 dark:text-white uppercase tracking-tight leading-none mb-1">{toToken?.symbol}</span>
                                            <span className="text-[10px] font-mono font-medium text-slate-400 dark:text-slate-500 uppercase tracking-widest">Received</span>
                                        </div>
                                    </div>
                                    <span className="text-[22px] font-mono font-medium text-slate-900 dark:text-white tracking-tighter tabular-nums leading-none">
                                        {formatAmount(displayToAmount)}
                                    </span>
                                </div>

                                <div className="h-px bg-slate-200/50 dark:bg-white/5 mx-[-1.5rem]" />

                                {/* Hash Section */}
                                <div className="flex justify-between items-center group/hash">
                                    <div className="flex items-center gap-2">
                                        <span className="text-[11px] font-mono text-slate-400 uppercase tracking-widest">Transaction Hash</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-[13px] text-indigo-500/80 font-mono">
                                            {txHash?.slice(0, 6)}...{txHash?.slice(-4)}
                                        </span>
                                        <a href={explorerUrl} target="_blank" rel="noopener noreferrer" className="p-1 hover:bg-slate-100 dark:hover:bg-white/5 rounded-md transition-colors text-slate-400 hover:text-indigo-500">
                                            <ExternalLink size={14} />
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </motion.div>

                        {/* Action Suite */}
                        <motion.div variants={itemVariants} className="px-10 pb-8 relative z-10 text-center">
                            <button
                                onClick={onClose}
                                className="w-full h-14 rounded-2xl bg-[#6366F1] dark:bg-indigo-600 text-white font-bold text-[15px] shadow-[0_12px_24px_-8px_rgba(99,102,241,0.5)] hover:brightness-110 active:scale-[0.98] transition-all duration-300 flex items-center justify-center gap-2 group"
                            >
                                Done
                            </button>

                            <div className="flex items-center justify-center gap-2.5 pt-6">
                                <img src="/icons/arc.png" className="w-4 h-4 rounded-full" alt="" />
                                <span className="text-[11px] font-bold text-slate-400/80 uppercase tracking-[0.2em]">Powered by App Kit</span>
                            </div>
                        </motion.div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>,
        document.body
    );
};

export default SwapSuccessModal;
