import { useState, useCallback, useEffect } from 'react';
import { useWaitForTransactionReceipt } from 'wagmi';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, X, Loader2, ExternalLink, ArrowRight } from 'lucide-react';
import { createPortal } from 'react-dom';
import TransactionContext from './transactionContextDef';

const PersistentToast = ({ id, tx, onDismiss }) => {
    const { isSuccess, isError, isLoading } = useWaitForTransactionReceipt({
        hash: tx.hash,
        chainId: tx.chainId
    });

    const [shouldAutoDismiss, setShouldAutoDismiss] = useState(false);

    useEffect(() => {
        if (isSuccess || isError) {
            setShouldAutoDismiss(true);
            const timer = setTimeout(() => {
                onDismiss(id);
            }, 8000); // Give users time to see the success/error
            return () => clearTimeout(timer);
        }
    }, [isSuccess, isError, id, onDismiss]);

    const status = isLoading ? 'pending' : isSuccess ? 'success' : isError ? 'error' : 'pending';

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 50, scale: 0.9, x: 20 }}
            animate={{ opacity: 1, y: 0, scale: 1, x: 0 }}
            exit={{ opacity: 0, x: 100, scale: 0.8 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="bg-slate-900/90 dark:bg-slate-950/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-4 w-72 md:w-80 group relative overflow-hidden ring-1 ring-white/5"
        >
            {/* status bar background tracking */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-white/5" />

            {/* status bar progress animation */}
            {status === 'pending' && (
                <motion.div
                    className="absolute top-0 left-0 h-1 bg-blue-500"
                    initial={{ width: "0%" }}
                    animate={{ width: "100%" }}
                    transition={{ duration: 30, ease: "linear" }}
                />
            )}

            {status === 'success' && <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-500" />}
            {status === 'error' && <div className="absolute top-0 left-0 right-0 h-1 bg-red-500" />}

            <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors duration-500 ${status === 'pending' ? 'bg-blue-500/10' :
                    status === 'success' ? 'bg-emerald-500/10' :
                        'bg-red-500/10'
                    }`}>
                    {status === 'pending' ? <Loader2 className="animate-spin text-blue-500" size={20} /> :
                        status === 'success' ? <Check className="text-emerald-500" size={20} /> :
                            <X className="text-red-500" size={20} />}
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                        <p className="text-[13px] font-bold text-white truncate">{tx.description || 'Transaction'}</p>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5 font-medium leading-tight">
                        {status === 'pending' ? 'Processing on-chain...' :
                            status === 'success' ? 'Transaction confirmed' :
                                'Transaction failed'}
                    </p>

                    <div className="flex items-center gap-3 mt-2.5">
                        {tx.hash && tx.explorerUrl && (
                            <a
                                href={`${tx.explorerUrl}/tx/${tx.hash}`}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[10px] uppercase tracking-wider font-extrabold text-blue-400/80 hover:text-blue-400 flex items-center gap-1 transition-colors"
                            >
                                Explorer <ExternalLink size={10} />
                            </a>
                        )}

                        {tx.direction && (
                            <div className="flex items-center gap-1 text-[9px] text-slate-500 uppercase font-black">
                                <span>{tx.fromChain}</span>
                                <ArrowRight size={8} />
                                <span>{tx.toChain}</span>
                            </div>
                        )}
                    </div>
                </div>

                <button
                    onClick={() => onDismiss(id)}
                    className="p-1 rounded-lg hover:bg-white/10 text-slate-500 hover:text-white transition-all opacity-0 group-hover:opacity-100"
                >
                    <X size={14} />
                </button>
            </div>

            {/* Auto-dismiss progress bar for finished txs */}
            {shouldAutoDismiss && (
                <motion.div
                    className="absolute bottom-0 left-0 h-0.5 bg-white/20"
                    initial={{ width: "100%" }}
                    animate={{ width: "0%" }}
                    transition={{ duration: 8, ease: "linear" }}
                />
            )}
        </motion.div>
    );
};

export const TransactionProvider = ({ children }) => {
    const [toasts, setToasts] = useState([]);

    const addTransaction = useCallback((hash, config = {}) => {
        if (!hash) return null;

        const id = `${hash}-${Date.now()}`;
        const newToast = {
            id,
            hash,
            chainId: config.chainId,
            description: config.description || 'Blockchain Transaction',
            explorerUrl: config.explorerUrl || 'https://sepolia.etherscan.io',
            fromChain: config.fromChain,
            toChain: config.toChain,
            direction: !!(config.fromChain && config.toChain)
        };

        setToasts(prev => [newToast, ...prev]);
        return id;
    }, []);

    const dismissToast = useCallback((id) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    return (
        <TransactionContext.Provider value={{ addTransaction, dismissToast }}>
            {children}
            {createPortal(
                <div className="fixed bottom-6 right-6 z-[99999] flex flex-col gap-3 items-end pointer-events-none">
                    <div className="pointer-events-auto flex flex-col gap-3">
                        <AnimatePresence mode="popLayout">
                            {toasts.map(toast => (
                                <PersistentToast
                                    key={toast.id}
                                    id={toast.id}
                                    tx={toast}
                                    onDismiss={dismissToast}
                                />
                            ))}
                        </AnimatePresence>
                    </div>
                </div>,
                document.body
            )}
        </TransactionContext.Provider>
    );
};
