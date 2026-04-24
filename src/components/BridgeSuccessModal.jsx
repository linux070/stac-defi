import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ExternalLink, Check } from 'lucide-react';
import { getExplorerUrl } from '../utils/blockchain';
import '../styles/bridge-styles.css';

const BridgeSuccessModal = ({ isOpen, onClose, fromChain, toChain, amount, timeTaken, sourceTxHash, destTxHash }) => {

    const getChainIcon = (name) => {
        if (!name) return "/icons/eth.png";
        const n = String(name).toLowerCase();
        if (n.includes('arc')) return "/icons/arc.png";
        if (n.includes('base')) return "/icons/base.png";
        return "/icons/eth.png";
    };

    const getChainIdForName = (name) => {
        const n = String(name).toLowerCase();
        if (n.includes('arc')) return '0x4cef52';
        if (n.includes('base')) return 84532;
        return 11155111;
    };

    const sourceExplorerUrl = sourceTxHash ? getExplorerUrl(sourceTxHash, getChainIdForName(fromChain)) : null;
    const destExplorerUrl = destTxHash ? getExplorerUrl(destTxHash, getChainIdForName(toChain)) : null;

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className="fixed inset-0 z-[100000] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                >
                    <motion.div
                        className="w-full max-w-[480px] bg-white dark:bg-[#0B0F1A] rounded-[32px] overflow-hidden shadow-[0_32px_80px_-20px_rgba(0,0,0,0.4)] border border-slate-200 dark:border-white/10"
                        initial={{ scale: 0.95, opacity: 0, y: 30 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.95, opacity: 0, y: 30 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 350, duration: 0.5 }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="p-8 pb-4 text-center">
                            <div className="flex justify-end mb-2 -mr-4 -mt-4">
                                <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-white/5 rounded-full transition-colors text-slate-400">
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="flex flex-col items-center mb-6">
                                <motion.div
                                    initial={{ scale: 0, rotate: -45 }}
                                    animate={{ scale: 1, rotate: 0 }}
                                    transition={{ type: 'spring', delay: 0.2 }}
                                    className="w-16 h-16 rounded-full bg-emerald-500 flex items-center justify-center mb-5 text-white shadow-[0_0_40px_-8px_rgba(16,185,129,0.4)]"
                                >
                                    <Check size={32} strokeWidth={4} />
                                </motion.div>
                                <span className="text-[12px] font-bold uppercase tracking-[0.2em] text-slate-900 dark:text-white font-mono">
                                    Transaction Completed
                                </span>
                            </div>

                            <p className="text-[15px] text-slate-500 dark:text-slate-400 font-medium leading-[1.4] max-w-[280px] mx-auto mt-2">
                                Your asset has been successfully bridged to the destination chain
                            </p>
                        </div>

                        <div className="px-8 pb-10 space-y-6">
                            <div className="bg-slate-50 dark:bg-white/[0.03] border border-slate-100 dark:border-white/5 rounded-[24px] p-6 space-y-5">
                                <div className="flex justify-between items-center">
                                    <span className="text-[11px] text-slate-400 uppercase tracking-widest">AMOUNT</span>
                                    <span className="text-[15px] font-medium text-slate-900 dark:text-white tabular-nums">{amount} USDC</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-[11px] text-slate-400 uppercase tracking-widest">TIME</span>
                                    <span className="text-[15px] font-medium text-slate-900 dark:text-white tabular-nums">{timeTaken}</span>
                                </div>

                                <div className="h-px bg-slate-200/50 dark:bg-white/5 mx-[-1.5rem]" />

                                <div className="space-y-5 pt-1">
                                    <span className="text-[11px] text-slate-400 uppercase tracking-[0.2em] block">Transaction Hash</span>

                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center group/hash font-mono">
                                            <div className="flex items-center gap-3">
                                                <div className="w-6 h-6 rounded-full overflow-hidden border border-slate-200 dark:border-white/10 p-0.5 bg-white dark:bg-white/5">
                                                    <img src={getChainIcon(fromChain)} className="w-full h-full" alt="" />
                                                </div>
                                                <span className="text-[11px] text-slate-400 uppercase tracking-widest">SOURCE</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-[13px] text-indigo-500/80 font-mono">
                                                    {sourceTxHash?.slice(0, 6)}...{sourceTxHash?.slice(-4)}
                                                </span>
                                                <a href={sourceExplorerUrl} target="_blank" rel="noopener noreferrer" className="p-1 hover:bg-indigo-500/10 rounded-md transition-colors text-slate-400 hover:text-indigo-500">
                                                    <ExternalLink size={14} />
                                                </a>
                                            </div>
                                        </div>

                                        {destTxHash && (
                                            <div className="flex justify-between items-center group/hash font-mono pt-1">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-6 h-6 rounded-full overflow-hidden border border-slate-200 dark:border-white/10 p-0.5 bg-white dark:bg-white/5">
                                                        <img src={getChainIcon(toChain)} className="w-full h-full" alt="" />
                                                    </div>
                                                    <span className="text-[11px] text-slate-400 uppercase tracking-widest">DESTINATION</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[13px] text-indigo-500/80 font-mono">
                                                        {destTxHash?.slice(0, 6)}...{destTxHash?.slice(-4)}
                                                    </span>
                                                    <a href={destExplorerUrl} target="_blank" rel="noopener noreferrer" className="p-1 hover:bg-indigo-500/10 rounded-md transition-colors text-slate-400 hover:text-indigo-500">
                                                        <ExternalLink size={14} />
                                                    </a>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col gap-3">
                                <button
                                    onClick={onClose}
                                    className="w-full h-14 bg-[#6366F1] dark:bg-indigo-600 text-white rounded-2xl text-[14px] font-bold uppercase tracking-widest hover:bg-indigo-500 dark:hover:bg-indigo-400 active:scale-[0.98] transition-all shadow-[0_12px_24px_-8px_rgba(79,70,229,0.3)]"
                                >
                                    Done
                                </button>
                            </div>

                            <div className="flex items-center justify-center gap-2.5 pt-4">
                                <img src="/icons/arc.png" className="w-4 h-4 rounded-full" alt="" />
                                <span className="text-[11px] font-bold text-slate-400/80 uppercase tracking-[0.2em]">Powered by App Kit</span>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>,
        document.body
    );
};

export default BridgeSuccessModal;
