import React from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const FeedbackButton = ({ isOpen, setIsOpen }) => {
    const { t } = useTranslation();

    // Smart Auto-Close: Listen for Tally submission events
    React.useEffect(() => {
        const handleMessage = (e) => {
            if (typeof e.data === 'string' && e.data.includes('Tally.FormSubmitted')) {
                // Wait 3 seconds so user can see the "Thanks" message, then auto-close
                setTimeout(() => {
                    setIsOpen(false);
                }, 3000);
            }
        };

        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, [setIsOpen]);

    return (
        <>
            {createPortal(
                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    className="fixed bottom-6 right-6 z-[9999] hidden md:block"
                >
                    <button
                        onClick={() => setIsOpen(true)}
                        className="group relative flex items-center gap-3 px-5 py-3 h-[52px] bg-white dark:bg-black border border-slate-200 dark:border-white/10 rounded-full shadow-[0_8px_32px_rgba(0,0,0,0.12)] hover:shadow-[0_12px_48px_rgba(0,0,0,0.2)] dark:hover:shadow-[0_12px_48px_rgba(0,0,0,0.8)] transition-all duration-300 active:scale-95 overflow-hidden"
                    >
                        {/* Hover Gradient Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/0 via-blue-500/0 to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                        <div className="relative w-7 h-7 flex items-center justify-center bg-blue-500/10 rounded-lg group-hover:scale-110 transition-transform duration-300">
                            <MessageSquare size={16} className="text-blue-600 dark:text-blue-400" />
                        </div>
                        <span className="relative text-[13px] font-black text-slate-800 dark:text-slate-100 tracking-tight">
                            {t('Feedback')}
                        </span>
                    </button>
                </motion.div>,
                document.body
            )}

            <AnimatePresence>
                {isOpen && createPortal(
                    <div className="fixed inset-0 z-[100000] overflow-hidden flex items-center justify-center p-0 sm:p-6 md:p-10">
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsOpen(false)}
                            className="absolute inset-0 bg-slate-900/40 dark:bg-black/98 sm:dark:bg-black/80 backdrop-blur-md"
                        />

                        {/* Modal Container */}
                        <motion.div
                            initial={typeof window !== 'undefined' && window.innerWidth < 768 ? { y: '100%' } : { opacity: 0, scale: 0.98, y: 30 }}
                            animate={{ y: 0, opacity: 1, scale: 1 }}
                            exit={typeof window !== 'undefined' && window.innerWidth < 768 ? { y: '100%' } : { opacity: 0, scale: 0.98, y: 30 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="relative w-full h-full sm:h-auto sm:max-w-[540px] bg-white dark:bg-black sm:rounded-[28px] shadow-[0_32px_128px_rgba(0,0,0,0.15)] dark:shadow-[0_48px_160px_rgba(0,0,0,0.8)] flex flex-col overflow-hidden border-t sm:border border-slate-200/80 dark:border-white/[0.08]"
                            style={{ maxHeight: typeof window !== 'undefined' && window.innerWidth < 768 ? '100dvh' : 'min(820px, 90vh)' }}
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between px-6 sm:px-8 py-5 bg-white dark:bg-black border-b border-slate-100 dark:border-white/[0.08] sticky top-0 z-10">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-[14px] bg-blue-500/10 flex items-center justify-center">
                                        <MessageSquare size={22} className="text-blue-500" />
                                    </div>
                                    <div>
                                        <h2 className="text-[17px] font-normal text-slate-800 dark:text-slate-200 tracking-tight leading-none">{t("Feedback")}</h2>
                                        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 tracking-[0.05em] uppercase mt-1.5 flex items-center gap-1.5">
                                            <span className="w-1 h-1 rounded-full bg-blue-500 animate-pulse"></span>
                                            {t("Internal Distribution")}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="p-2 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-all active:scale-90"
                                >
                                    <X size={20} strokeWidth={2.5} />
                                </button>
                            </div>

                            {/* Body — Iframe Contaner */}
                            <div className="flex-1 relative w-full bg-white overflow-hidden min-h-0">
                                <iframe
                                    src="https://tally.so/embed/7RLbaA?hideTitle=1&transparentBackground=1"
                                    width="100%"
                                    height="100%"
                                    frameBorder="0"
                                    marginHeight="0"
                                    marginWidth="0"
                                    className="absolute inset-0"
                                    style={{ background: 'transparent' }}
                                    title="Feedback Form"
                                ></iframe>
                            </div>

                            {/* Footer */}
                            <div className="px-6 sm:px-8 py-4 border-t border-slate-100 dark:border-white/[0.08] bg-slate-50/50 dark:bg-black/80 flex items-center justify-end sticky bottom-0">
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="w-full sm:w-auto px-6 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.05] dark:hover:bg-white/[0.1] text-slate-600 dark:text-slate-300 text-[12px] font-bold rounded-full transition-all active:scale-95 border border-transparent dark:border-white/[0.05]"
                                >
                                    {t("Close")}
                                </button>
                            </div>
                        </motion.div>
                    </div>,
                    document.body
                )}
            </AnimatePresence>
        </>
    );
};

export default FeedbackButton;
