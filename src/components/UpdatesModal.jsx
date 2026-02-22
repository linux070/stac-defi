import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Zap, Shield, Layers, Box, TrendingUp, Cpu, History, Mail } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const UpdatesModal = ({ isOpen, onClose }) => {
    const { t } = useTranslation();
    const [selectedIdx, setSelectedIdx] = useState(0);

    const updates = [
        {
            version: "v2.3.0",
            title: "Institutional Interface Refactoring.",
            date: "Feb 18, 2026",
            isLatest: true,
            description: "Our biggest update yet, redesigned from the ground up to support high-frequency trading and professional asset management with zero-latency visual updates.",
            items: [
                {
                    icon: <Zap size={18} />,
                    title: "Iconography Overhaul",
                    description: "Replaced generic assets with purpose-built DeFi icons across all stat cards and feature sections.",
                    tag: "UI/UX"
                },
                {
                    icon: <Cpu size={18} />,
                    title: "Engine Optimization",
                    description: "Re-engineered hero animations using native SVG paths for zero JavaScript overhead and sub-second page rendering.",
                    tag: "Performance"
                },
                {
                    icon: <Layers size={18} />,
                    title: "Dynamic Viewport Stability",
                    description: "Implemented 'dvh' units for all modals, ensuring layout stability on mobile wallet browsers.",
                    tag: "Mobile"
                }
            ]
        },
        {
            version: "v2.2.4",
            title: "Hotfix & Polish.",
            date: "Jan 24, 2026",
            description: "Addressed critical edge cases in swap execution and refined the bridging UX with improved error messaging and loading states.",
            items: [
                {
                    icon: <Shield size={18} />,
                    title: "Swap Guard Rails",
                    description: "Added validation guards to prevent failed transactions from incomplete token approvals.",
                    tag: "Core"
                }
            ]
        },
        {
            version: "v2.2.0",
            title: "Stability & Data Integrity.",
            date: "Jan 02, 2026",
            description: "Major stability release focused on persistent transaction logging and smarter gas estimation across all supported chains.",
            items: [
                {
                    icon: <History size={18} />,
                    title: "Transaction Persistence",
                    description: "Integrated IndexedDB logging to preserve cross-chain history even after browser refreshes.",
                    tag: "Core"
                },
                {
                    icon: <TrendingUp size={18} />,
                    title: "Smart Gas Estimation",
                    description: "Real-time gas fee calculation engine for Circle CCTP, providing more accurate bridging cost estimates.",
                    tag: "Trading"
                }
            ]
        },
        {
            version: "v2.1.8",
            title: "Network & Speed Enhancements.",
            date: "Dec 15, 2025",
            description: "Performance-focused release with global balance caching, high-precision bridge timers, and reduced RPC overhead.",
            items: [
                {
                    icon: <Shield size={18} />,
                    title: "Global Balance Caching",
                    description: "Implemented a 5-second cooldown on RPC fetches to prevent rate limiting and ensure snappy balance updates.",
                    tag: "Performance"
                },
                {
                    icon: <Box size={18} />,
                    title: "High-Precision Bridge Timers",
                    description: "Refined progress system for cross-chain transfers with accurate countdowns and status messaging.",
                    tag: "Bridge"
                }
            ]
        }
    ];

    const selected = updates[selectedIdx];

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100000] overflow-hidden flex items-center justify-center p-4 sm:p-6 md:p-10">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-slate-900/40 dark:bg-black/80 backdrop-blur-md"
                    />

                    {/* Modal Container */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.98, y: 30 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.98, y: 30 }}
                        className="relative w-full max-w-[960px] bg-white dark:bg-slate-950 rounded-[28px] shadow-[0_32px_128px_rgba(0,0,0,0.15)] dark:shadow-[0_32px_128px_rgba(0,0,0,0.5)] flex flex-col overflow-hidden border border-slate-200/80 dark:border-white/[0.06]"
                        style={{ maxHeight: 'min(680px, 85vh)' }}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 sm:px-8 py-5 bg-white dark:bg-slate-950 border-b border-slate-100 dark:border-white/[0.06]">
                            <div className="flex items-center gap-3.5">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 dark:from-blue-500 dark:to-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-600/20">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                                    </svg>
                                </div>
                                <div>
                                    <h2 className="text-[17px] font-black text-slate-900 dark:text-white tracking-tight leading-none">{t("System Updates")}</h2>
                                    <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mt-1">
                                        {t("ARC PROTOCOL")} {selected.version}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-all active:scale-90"
                            >
                                <X size={20} strokeWidth={2.5} />
                            </button>
                        </div>

                        {/* Body — Split Panel */}
                        <div className="flex-1 flex flex-col md:flex-row overflow-hidden min-h-0">

                            {/* Left Sidebar — Version List */}
                            <div className="md:w-[240px] flex-shrink-0 border-b md:border-b-0 md:border-r border-slate-100 dark:border-white/[0.06] bg-slate-50/50 dark:bg-white/[0.015] overflow-y-auto">
                                <div className="px-5 pt-5 pb-2">
                                    <span className="text-[10px] font-bold text-blue-500 dark:text-blue-400 uppercase tracking-[0.15em]">
                                        {t("Release History")}
                                    </span>
                                </div>
                                <div className="p-2 space-y-0.5">
                                    {updates.map((version, idx) => {
                                        const isActive = selectedIdx === idx;
                                        return (
                                            <button
                                                key={idx}
                                                onClick={() => setSelectedIdx(idx)}
                                                className={`w-full text-left px-4 py-3 rounded-xl transition-all duration-200 group ${isActive
                                                        ? 'bg-white dark:bg-white/[0.06] shadow-sm border border-slate-200/80 dark:border-white/10'
                                                        : 'hover:bg-white/80 dark:hover:bg-white/[0.03] border border-transparent'
                                                    }`}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <span className={`text-[15px] font-black tracking-tight ${isActive ? 'text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-400'
                                                        }`}>
                                                        {version.version}
                                                    </span>
                                                    {version.isLatest && (
                                                        <span className="px-2 py-0.5 rounded-md bg-blue-500 text-white text-[9px] font-black uppercase tracking-wider">
                                                            {t("Latest")}
                                                        </span>
                                                    )}
                                                </div>
                                                <span className={`text-[11px] font-medium ${isActive ? 'text-slate-500 dark:text-slate-400' : 'text-slate-400 dark:text-slate-500'
                                                    }`}>
                                                    {version.date}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Right Content Panel */}
                            <div className="flex-1 overflow-y-auto min-h-0">
                                <AnimatePresence mode="wait">
                                    <motion.div
                                        key={selectedIdx}
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        transition={{ duration: 0.2, ease: 'easeOut' }}
                                        className="p-6 sm:p-10"
                                    >
                                        {/* Section Label */}
                                        <div className="flex items-center gap-3 mb-6">
                                            <div className="w-8 h-[2px] bg-slate-200 dark:bg-white/10 rounded-full" />
                                            <span className="text-[11px] font-bold text-blue-500 dark:text-blue-400 uppercase tracking-[0.15em]">
                                                {t("What's New")}
                                            </span>
                                        </div>

                                        {/* Title */}
                                        <h3 className="text-[clamp(1.75rem,4vw,2.75rem)] font-black text-slate-900 dark:text-white tracking-tight leading-[1.1] mb-5">
                                            {selected.title}
                                        </h3>

                                        {/* Description */}
                                        <p className="text-[15px] sm:text-[16px] leading-relaxed text-slate-500 dark:text-slate-400 font-medium max-w-[560px] mb-10">
                                            {selected.description}
                                        </p>

                                        {/* Change Items */}
                                        <div className="space-y-4">
                                            {selected.items.map((item, itemIdx) => (
                                                <div
                                                    key={itemIdx}
                                                    className="group flex items-start gap-4 p-4 rounded-2xl bg-slate-50/80 dark:bg-white/[0.025] border border-slate-100 dark:border-white/[0.05] hover:border-blue-500/20 dark:hover:border-blue-500/20 transition-all duration-300"
                                                >
                                                    <div className="w-10 h-10 rounded-xl bg-white dark:bg-white/[0.06] border border-slate-100 dark:border-white/[0.08] flex items-center justify-center text-blue-600 dark:text-blue-400 flex-shrink-0 shadow-sm group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600 transition-all duration-300">
                                                        {item.icon}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <h5 className="text-[14px] font-bold text-slate-900 dark:text-white tracking-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                                                {item.title}
                                                            </h5>
                                                            <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-white/[0.05] text-slate-400 dark:text-slate-500 text-[9px] font-bold uppercase tracking-wider border border-slate-200/50 dark:border-white/[0.04] flex-shrink-0">
                                                                {item.tag}
                                                            </span>
                                                        </div>
                                                        <p className="text-[13px] leading-relaxed text-slate-500 dark:text-slate-400 font-medium">
                                                            {item.description}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </motion.div>
                                </AnimatePresence>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="px-6 sm:px-8 py-4 border-t border-slate-100 dark:border-white/[0.06] bg-slate-50/50 dark:bg-white/[0.015] flex items-center justify-between gap-4">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
                                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest whitespace-nowrap">
                                    {t("Global Mainnet Stable")}
                                </span>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="hidden sm:flex items-center gap-2 text-slate-400 dark:text-slate-500">
                                    <Mail size={14} />
                                    <span className="text-[12px] font-medium whitespace-nowrap">{t("Subscribe to dev updates")}</span>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white text-[12px] font-bold rounded-full transition-all active:scale-95 shadow-sm whitespace-nowrap"
                                >
                                    {t("Notify Me")}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default UpdatesModal;
