import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Loader2, ArrowLeft, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';

const FeedbackButton = ({ isOpen, setIsOpen, showTrigger = true, onBack }) => {
    const { t } = useTranslation();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [iframeLoaded, setIframeLoaded] = useState(false);

    // Smart Auto-Close: Listen for Tally form submission
    useEffect(() => {
        const handleMessage = (e) => {
            if (e.data && typeof e.data === 'string' && (e.data.includes('tally-form-submit') || e.data.includes('form-submitted'))) {
                setIsSubmitting(true);
                setTimeout(() => {
                    setIsOpen(false);
                    setTimeout(() => setIsSubmitting(false), 500);
                }, 3000);
            }
        };

        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, [setIsOpen]);

    // Handle scroll lock
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    return (
        <>
            {/* Floating Trigger — Nested Island Architecture (Desktop Only) */}
            {createPortal(
                <AnimatePresence>
                    {(!isOpen && showTrigger) && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                            className="fixed bottom-10 right-10 z-[8000] hidden md:block"
                        >
                            {/* Outer Shell */}
                            <div className="p-1.5 rounded-[2rem] bg-white/5 dark:bg-black/20 backdrop-blur-xl border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.1)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
                                <button
                                    onClick={() => setIsOpen(true)}
                                    className="px-6 py-3 rounded-[calc(2rem-0.375rem)] bg-white dark:bg-page-dark flex items-center gap-3 group transition-all active:scale-[0.98] border border-slate-100 dark:border-white/5"
                                >
                                    <MessageSquare size={18} strokeWidth={2.5} className="text-brand transition-transform group-hover:scale-110" />
                                    <span className="text-[14px] font-bold tracking-tight text-slate-900 dark:text-white">{t("Feedback")}</span>
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>,
                document.body
            )}

            {/* Modal Portal — Double-Bezel & Soft Structuralism */}
            {createPortal(
                <AnimatePresence>
                    {isOpen && (
                        <div className="fixed inset-0 z-[100000] flex items-center justify-center overflow-hidden p-0 sm:p-6 md:p-12">
                            {/* Backdrop — Cinematic Depth */}
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.5 }}
                                className="absolute inset-0 bg-[#F7F6F3]/80 dark:bg-black/95 backdrop-blur-2xl"
                                onClick={() => !isSubmitting && setIsOpen(false)}
                            />

                            {/* Modal Architecture — The Double-Bezel Shell */}
                            <motion.div
                                initial={{ opacity: 0, scale: 0.96, y: 30 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.96, y: 30 }}
                                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                                className="relative w-full h-[100dvh] sm:h-auto sm:max-w-[760px] p-2 bg-black/5 dark:bg-white/5 rounded-[2.5rem] border border-black/5 dark:border-white/10 shadow-[0_48px_140px_rgba(0,0,0,0.1)] dark:shadow-[0_48px_140px_rgba(0,0,0,0.8)] flex flex-col overflow-hidden"
                                style={{ maxHeight: 'min(820px, 94vh)' }}
                            >
                                {/* Inner Core — Refractive Liquid Glass Core */}
                                <div className="w-full h-full bg-white dark:bg-page-dark rounded-[calc(2.5rem-0.5rem)] flex flex-col overflow-hidden border border-white/10 relative shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]">
                                    
                                    {/* Header — Editorial Luxury Architecture */}
                                    <div className="flex items-center justify-between px-10 py-7 bg-white/50 dark:bg-page-dark/50 backdrop-blur-md border-b border-slate-100 dark:border-white/5 sticky top-0 z-[60]">
                                        <div className="flex-1 flex justify-start">
                                            <button 
                                                onClick={() => { 
                                                    setIsOpen(false); 
                                                    if (onBack) onBack(); 
                                                }} 
                                                className="flex items-center gap-2.5 group/back active:scale-95 transition-all"
                                            >
                                                <div className="p-2 rounded-lg bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center group-hover/back:bg-slate-200 dark:group-hover/back:bg-white/10 transition-all">
                                                    <ArrowLeft size={18} strokeWidth={2.5} className="text-slate-600 dark:text-slate-300" />
                                                </div>
                                                <span className="text-[15px] font-medium tracking-tight text-slate-500 dark:text-slate-400 group-hover/back:text-slate-900 dark:group-hover/back:text-white transition-colors">{t('Back')}</span>
                                            </button>
                                        </div>
                                        <div className="flex-1 flex justify-center">
                                            <h2 className="text-[20px] font-semibold text-slate-900 dark:text-white tracking-tight leading-none font-['Satoshi','Plus_Jakarta_Sans',sans-serif]">
                                                {t("Feedback")}
                                            </h2>
                                        </div>
                                        <div className="flex-1 flex justify-end" />
                                    </div>

                                    {/* Document Content Area */}
                                    <div className="flex-grow relative overflow-y-auto no-scrollbar bg-slate-50/30 dark:bg-black/20">
                                        {/* Submitting Overlay */}
                                        {isSubmitting && (
                                            <motion.div 
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                className="absolute inset-0 z-[70] flex flex-col items-center justify-center bg-white/90 dark:bg-page-dark/95 backdrop-blur-md"
                                            >
                                                <div className="relative">
                                                    <Loader2 size={42} className="text-brand animate-spin" strokeWidth={2.5} />
                                                    <div className="absolute inset-0 blur-2xl bg-brand/20 animate-pulse" />
                                                </div>
                                                <span className="mt-6 text-[11px] font-black text-brand uppercase tracking-[0.4em]">
                                                    {t('Submitting...')}
                                                </span>
                                            </motion.div>
                                        )}

                                        {/* Iframe Viewport — Precision Engineering */}
                                        <div className={`w-full min-h-full flex flex-col transition-all duration-700 ${iframeLoaded ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-4 scale-[0.99]'}`}>
                                            <iframe
                                                src="https://tally.so/embed/7RLbaA?alignLeft=1&hideTitle=1&transparentBackground=1"
                                                loading="eager"
                                                width="100%"
                                                height="100%"
                                                frameBorder="0"
                                                marginHeight="0"
                                                marginWidth="0"
                                                title="Feedback Form"
                                                onLoad={() => setIframeLoaded(true)}
                                                style={{ border: 'none', background: 'transparent', minHeight: '620px', pointerEvents: isOpen ? 'auto' : 'none' }}
                                                className="flex-grow"
                                            ></iframe>
                                        </div>

                                        {/* Editorial Skeleton — Pure Vector Aesthetics */}
                                        {!iframeLoaded && (
                                            <div className="absolute inset-0 flex flex-col gap-8 p-12">
                                                <div className="h-6 w-48 rounded skeleton" />
                                                <div className="h-16 w-full rounded-2xl skeleton" />
                                                <div className="h-6 w-64 rounded skeleton" />
                                                <div className="h-40 w-full rounded-2xl skeleton" />
                                                <div className="h-6 w-40 rounded skeleton" />
                                                <div className="flex-1" />
                                                <div className="h-14 w-48 rounded-2xl skeleton" />
                                            </div>
                                        )}
                                    </div>

                                    {/* Action Island — Trailing Icon Pattern */}
                                    <div className="px-10 py-8 border-t border-slate-100 dark:border-white/5 bg-white/50 dark:bg-page-dark/50 backdrop-blur-md flex items-center justify-center sticky bottom-0 z-[60]">
                                        <button
                                            onClick={() => setIsOpen(false)}
                                            className="group relative px-12 py-4 bg-brand text-white text-[13px] font-black uppercase tracking-[0.2em] rounded-full shadow-2xl shadow-brand/20 active:scale-[0.96] transition-all overflow-hidden"
                                        >
                                            <span className="relative z-10">{t("Close")}</span>
                                            <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>,
                document.body
            )}
        </>
    );
};

export default FeedbackButton;
