import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { X, MessageSquare, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { createPortal } from 'react-dom';
import { useTheme } from '../hooks/useTheme';

const FeedbackButton = ({ isOpen, setIsOpen }) => {
    const { t } = useTranslation();
    const { darkMode } = useTheme();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [iframeLoaded, setIframeLoaded] = useState(false);

    // Smart Auto-Close: Listen for Tally form submission
    useEffect(() => {
        const handleMessage = (e) => {
            if (e.data && typeof e.data === 'string' && (e.data.includes('tally-form-submit') || e.data.includes('form-submitted'))) {
                setIsSubmitting(true);
                setTimeout(() => {
                    setIsOpen(false);
                    // Reset submitting state after modal close
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
            {/* Floating Trigger — Icon-Only Premium DeFi Style */}
            {!isOpen && createPortal(
                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ type: 'spring', damping: 18, stiffness: 260, delay: 0.8 }}
                    className="fixed bottom-6 right-6 z-[9000] hidden md:block"
                >
                    <button
                        onClick={() => setIsOpen(true)}
                        aria-label={t('Feedback')}
                        className="group relative w-[52px] h-[52px] flex items-center justify-center rounded-[16px] bg-blue-500 text-white shadow-[0_8px_32px_rgba(59,130,246,0.3)] hover:bg-blue-600 hover:shadow-[0_12px_48px_rgba(59,130,246,0.5)] transition-all duration-300 active:scale-90 overflow-hidden border border-white/20"
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/25 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                        <MessageSquare size={24} strokeWidth={2.4} className="relative z-10 transition-transform group-hover:scale-110" />
                    </button>
                </motion.div>,
                document.body
            )}

            {/* Modal Portal — TRULY ALWAYS MOUNTED FOR INSTANT LOADING */}
            {createPortal(
                <div
                    className={`fixed inset-0 z-[100000] flex items-center justify-center p-0 sm:p-6 md:p-10 overflow-hidden transition-all duration-300 ${isOpen ? 'visible' : 'invisible pointer-events-none'}`}
                >
                    {/* Backdrop */}
                    <div
                        className={`absolute inset-0 bg-slate-900/40 dark:bg-black/98 sm:dark:bg-black/80 backdrop-blur-md transition-opacity duration-300 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
                        onClick={() => !isSubmitting && setIsOpen(false)}
                    />

                    {/* Modal Container */}
                    <div
                        className={`relative w-full h-[100dvh] sm:h-auto sm:max-w-[920px] bg-white dark:bg-black sm:rounded-[28px] shadow-[0_32px_128px_rgba(0,0,0,0.15)] dark:shadow-[0_48px_160px_rgba(0,0,0,0.8)] flex flex-col overflow-hidden border-t sm:border border-slate-200/80 dark:border-white/[0.08] transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] ${isOpen ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-12 opacity-0 scale-95'}`}
                        style={{ maxHeight: typeof window !== 'undefined' && window.innerWidth < 768 ? '100dvh' : 'min(720px, 92vh)' }}
                    >
                        {/* Header — MATCHES CHANGE LOG STYLE */}
                        <div className="flex items-center justify-between px-6 sm:px-8 py-5 bg-white dark:bg-black border-b border-slate-100 dark:border-white/[0.08] sticky top-0 z-50">
                            <div className="flex items-center">
                                <h2 className="text-[18px] font-normal text-slate-800 dark:text-slate-200 tracking-tight leading-none">
                                    {t('Feedback')}
                                </h2>
                            </div>
                            <button
                                onClick={() => !isSubmitting && setIsOpen(false)}
                                className="p-2 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-all active:scale-90"
                            >
                                <X size={20} strokeWidth={2.5} />
                            </button>
                        </div>

                        {/* Form Content — Background Pre-loaded Logic */}
                        <div className="flex-grow relative bg-white dark:bg-black overflow-y-auto no-scrollbar touch-pan-y">
                            {(!iframeLoaded || isSubmitting) && (
                                <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-white dark:bg-black">
                                    <div className="relative">
                                        <Loader2 size={32} className="text-blue-500 animate-spin" />
                                        <div className="absolute inset-0 blur-xl bg-blue-500/20 animate-pulse"></div>
                                    </div>
                                    <span className="mt-4 text-[11px] font-bold text-slate-400 dark:text-slate-600 uppercase tracking-[0.2em] animate-pulse">
                                        {isSubmitting ? t('Sending...') : t('Connecting')}
                                    </span>
                                </div>
                            )}

                            {/* The iframe is ALWAYS mounted, so it hydrates instantly when opened */}
                            <div className={`w-full min-h-full flex flex-col transition-all duration-300 ${iframeLoaded ? 'opacity-100' : 'opacity-0'}`}
                                style={{
                                    filter: darkMode ? 'invert(1) hue-rotate(180deg) brightness(1.05) contrast(1.05)' : 'none',
                                    background: darkMode ? '#ffffff' : 'transparent'
                                }}
                            >
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
                                    style={{ border: 'none', background: 'transparent', minHeight: '600px', pointerEvents: isOpen ? 'auto' : 'none' }}
                                    className="flex-grow"
                                ></iframe>
                            </div>
                        </div>

                        {/* Footer Decoration */}
                        <div className="px-6 sm:px-8 py-4 border-t border-slate-100 dark:border-white/[0.08] bg-slate-50/50 dark:bg-black/90 flex items-center justify-end sticky bottom-0 z-50">
                            <button
                                onClick={() => setIsOpen(false)}
                                className="w-full sm:w-auto px-6 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.05] dark:hover:bg-white/[0.1] text-slate-600 dark:text-slate-300 text-[12px] font-bold rounded-full transition-all active:scale-95 border border-transparent dark:border-white/[0.05]"
                            >
                                {t("Close")}
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </>
    );
};

export default FeedbackButton;
