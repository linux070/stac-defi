import { Component } from 'react';
import { motion } from 'framer-motion';
import { logger } from '../utils/logger';

/**
 * Tab-level ErrorBoundary — Zen Minimalist Profile
 * Stripped of all decorative elements for maximum focus on recovery.
 */
class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        logger.error("Tab ErrorBoundary caught an error:", error, errorInfo);
    }

    resetError = () => {
        this.setState({ hasError: false, error: null });
    };

    render() {
        if (this.state.hasError) {
            return (
                <div className="fixed inset-0 z-[100000] flex items-center justify-center p-6 bg-white dark:bg-page-dark overflow-hidden font-['Satoshi','Inter',sans-serif] selection:bg-brand selection:text-white">
                    {/* Replicated background logic for visual depth since it's an overlay */}
                    <div className="absolute inset-0 z-0 opacity-[0.03] dark:opacity-[0.06] pointer-events-none" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}></div>
                    
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                        className="relative z-10 w-full max-w-md"
                    >
                        {/* Double-Bezel Architecture */}
                        <div className="p-1 rounded-[2.5rem] bg-slate-100/50 dark:bg-white/[0.03] border border-slate-200/50 dark:border-white/5 shadow-2xl shadow-black/5">
                            <div className="bg-white dark:bg-zinc-950 p-10 rounded-[calc(2.5rem-4px)] flex flex-col items-center text-center">

                                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-4 tracking-tight leading-none font-['Satoshi','Inter',sans-serif]">
                                    {this.props.title || "This section failed to load"}
                                </h3>

                                <p className="text-[17px] text-slate-500 dark:text-secondary mb-10 max-w-[32ch] leading-relaxed font-medium">
                                    {this.props.message || "An unexpected error occurred. Please try refreshing the page to recover."}
                                </p>

                                <div className="flex flex-col gap-3 w-full">
                                    <button
                                        onClick={() => window.location.reload()}
                                        className="w-full h-[54px] bg-slate-900 dark:bg-white text-white dark:text-black rounded-2xl font-bold text-[14px] uppercase tracking-widest transition-all active:scale-[0.98] active:-translate-y-[1px] shadow-lg shadow-black/10 flex items-center justify-center gap-3 group"
                                    >
                                        <span>Try Refreshing</span>
                                        <div className="w-6 h-6 rounded-full bg-white/10 dark:bg-black/5 flex items-center justify-center group-hover:translate-x-1 group-hover:-translate-y-[1px] transition-transform">
                                            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <path d="M2.5 12V0L12 6L2.5 12Z" fill="currentColor" className="scale-75 translate-x-[1px]"/>
                                            </svg>
                                        </div>
                                    </button>

                                    <button
                                        onClick={() => window.location.href = '/'}
                                        className="w-full h-[54px] bg-transparent border border-slate-200 dark:border-white/5 text-slate-500 dark:text-secondary rounded-2xl font-bold text-[14px] uppercase tracking-widest transition-all hover:bg-slate-50 dark:hover:bg-white/[0.03] active:scale-[0.98]"
                                    >
                                        Back to Home
                                    </button>
                                </div>

                                {this.state.error && (
                                    <div className="mt-12 pt-8 border-t border-slate-100 dark:border-white/5 w-full">
                                        <div className="flex items-center justify-center gap-2 mb-2">
                                            <div className="w-1 h-1 rounded-full bg-brand/50 animate-pulse" />
                                            <span className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-400 dark:text-slate-600 block">Critical Error Log</span>
                                        </div>
                                        <p className="text-[10px] font-mono text-slate-500 bg-slate-50 dark:bg-white/[0.01] py-2.5 px-4 rounded-xl border border-slate-100 dark:border-white/5 break-all max-h-[80px] overflow-y-auto scrollbar-none font-medium">
                                            {this.state.error.name}: {this.state.error.message}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
