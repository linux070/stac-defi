import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const UpdatesModal = ({ isOpen, onClose }) => {
    const { t } = useTranslation();
    const [selectedIdx, setSelectedIdx] = useState(0);

    const updates = [
        {
            version: "v2.3.4",
            title: "Wallet Resilience & Bridge Optimization.",
            date: "Feb 22, 2026",
            isLatest: true,
            description: "Significant reliability updates for wallet session persistence and cross-chain bridging infrastructure on Arc Testnet.",
            items: [
                {
                    title: "Persistence Optimization",
                    description: "Refactored wallet state management to eliminate UI flickering during browser reloads.",
                },
                {
                    title: "Ghost Avatar System",
                    description: "Implemented immediate Jazzicon rendering for previously connected wallets using secure local caching.",
                },
                {
                    title: "Iris API Resilience",
                    description: "Deployed fallback mechanisms for Circle's Iris API to handle regional CORS and rate-limiting issues.",
                },
                {
                    title: "Pre-flight Balance Guards",
                    description: "Added real-time balance validation before bridging to prevent transaction failures.",
                },
                {
                    title: "Fee Transparency",
                    description: "Improved the received amount display in bridge success modals to account for all internal fees.",
                }
            ]
        },
        {
            version: "v2.3.0",
            title: "Mobile Interface & Landing Redesign.",
            date: "Feb 20, 2026",
            description: "A comprehensive overhaul of the mobile experience and core protocol landing page for the Arc ecosystem.",
            items: [
                {
                    title: "Account Details Modal",
                    description: "New full-screen mobile account details with integrated network switching and balance tracking.",
                },
                {
                    title: "Bottom Sheet Transitions",
                    description: "Implemented mobile-native drawer transitions for all wallet interactions.",
                },
                {
                    title: "Blueprint Grid System",
                    description: "Introduced a technical blueprint aesthetic to hero sections for enhanced visual precision.",
                },
                {
                    title: "Dynamic Typography",
                    description: "Refined font scales and weights to produce a more professional, institution-grade interface.",
                }
            ]
        },
        {
            version: "v2.2.0",
            title: "Core UX & Infrastructure Polish.",
            date: "Feb 16, 2026",
            description: "Visual polish and logic refinements for transaction states, media controls, and footer architecture.",
            items: [
                {
                    title: "Rejection UI Refinement",
                    description: "Redesigned the swap rejection modal to display source and destination tokens accurately.",
                },
                {
                    title: "Layout Centering",
                    description: "Optimized landing page heading hierarchy for better visual balance across resolutions.",
                },
                {
                    title: "Institutional Footer",
                    description: "Updated the credit footer with integrated social links and professional branding.",
                },
                {
                    title: "Audio Controller Polish",
                    description: "Redesigned music control buttons to match the protocol's custom squircle aesthetic.",
                }
            ]
        },
        {
            version: "v2.1.0",
            title: "Protocol Core & Identity Genesis.",
            date: "Feb 10, 2026",
            description: "Foundational architecture upgrade to the protocol's fetching layer and visual token standardization on Testnet.",
            items: [
                {
                    title: "RPC Optimization",
                    description: "Refined multi-chain balance fetching to prevent RPC rate-limiting during high-frequency usage.",
                },
                {
                    title: "Multi-Chain Hub",
                    description: "Integrated real-time balance tracking across Arc Testnet and associated liquid assets.",
                },
                {
                    title: "Global Balance Caching",
                    description: "Implemented a high-performance caching layer to ensure instantaneous balance updates.",
                },
                {
                    title: "Token Logo Standardization",
                    description: "Unified USDC and EURC iconography across Swap, Bridge, and Transaction modules.",
                },
                {
                    title: "Institutional Typography",
                    description: "Transitioned to an Inter and Satoshi-based font system for enhanced readability.",
                }
            ]
        },
        {
            version: "v1.8.0",
            title: "Alpha Network Expansion.",
            date: "Dec 15, 2025",
            description: "Expanded support for new digital assets (BALL, MTB, ECR) and initial transaction history logging.",
            items: [
                {
                    title: "Asset Integration",
                    description: "Onboarded BALL, MTB, and ECR tokens into the core swap and bridge modules.",
                },
                {
                    title: "Transaction History",
                    description: "Initial release of the transaction tracking system with local data persistence.",
                }
            ]
        },
        {
            version: "v1.5.0",
            title: "Genesis Release.",
            date: "Nov 01, 2025",
            description: "The first public deployment of the Stac protocol modules on the Arc Testnet ecosystem.",
            items: [
                {
                    title: "Core Modules Deployment",
                    description: "Launch of fully audited Swap and Bridge smart contract interfaces.",
                },
                {
                    title: "Security Foundation",
                    description: "Established the baseline security protocols for asset protection and user privacy.",
                }
            ]
        },
        {
            version: "v1.0.0",
            title: "Initial Protocol Launch.",
            date: "Oct 15, 2025",
            description: "The foundational release of the Stac DeFi engine, establishing core bridging and swapping primitives.",
            items: [
                {
                    title: "Protocol Foundation",
                    description: "Successful deployment of the baseline protocol architecture on the Arc network.",
                },
                {
                    title: "Technical Blueprint",
                    description: "Initial publication of the Stac protocol technical specifications.",
                }
            ]
        }
    ];

    const handleVersionSelect = (idx) => {
        setSelectedIdx(idx);
        if (window.innerWidth >= 768) {
            const element = document.getElementById(`version-${idx}`);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100000] overflow-hidden flex items-center justify-center p-0 sm:p-6 md:p-10">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-slate-900/40 dark:bg-black/98 sm:dark:bg-black/80 backdrop-blur-md"
                    />

                    {/* Modal Container */}
                    <motion.div
                        initial={typeof window !== 'undefined' && window.innerWidth < 768 ? { y: '100%' } : { opacity: 0, scale: 0.98, y: 30 }}
                        animate={{ y: 0, opacity: 1, scale: 1 }}
                        exit={typeof window !== 'undefined' && window.innerWidth < 768 ? { y: '100%' } : { opacity: 0, scale: 0.98, y: 30 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="relative w-full h-full sm:h-auto sm:max-w-[920px] bg-white dark:bg-black sm:rounded-[28px] shadow-[0_32px_128px_rgba(0,0,0,0.15)] dark:shadow-[0_48px_160px_rgba(0,0,0,0.8)] flex flex-col overflow-hidden border-t sm:border border-slate-200/80 dark:border-white/[0.08]"
                        style={{ maxHeight: typeof window !== 'undefined' && window.innerWidth < 768 ? '100dvh' : 'min(720px, 90vh)' }}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 sm:px-8 py-5 bg-white dark:bg-black border-b border-slate-100 dark:border-white/[0.08] sticky top-0 z-50">
                            <div className="flex items-center">
                                <h2 className="text-[18px] font-normal text-slate-800 dark:text-slate-200 tracking-tight leading-none">{t("Change Log")}</h2>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-all active:scale-90"
                            >
                                <X size={20} strokeWidth={2.5} />
                            </button>
                        </div>

                        {/* Body — Split Panel / Accordion */}
                        <div className="flex-1 flex flex-col md:flex-row overflow-hidden min-h-0 relative">

                            {/* Left Sidebar — Desktop Only */}
                            <div className="hidden md:block w-[260px] flex-shrink-0 border-r border-slate-100 dark:border-white/[0.08] bg-slate-50/30 dark:bg-white/[0.01] overflow-y-auto no-scrollbar">
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
                                                onClick={() => handleVersionSelect(idx)}
                                                className={`w-full text-left px-4 py-3 rounded-xl transition-all duration-200 group flex flex-col ${isActive
                                                    ? 'bg-blue-600 shadow-[0_8px_24px_rgba(37,99,235,0.2)] border-transparent text-white'
                                                    : 'hover:bg-slate-100 dark:hover:bg-active-bg dark:text-slate-400 border border-transparent'
                                                    }`}
                                            >
                                                <div className="flex items-center justify-between w-full gap-3">
                                                    <span className={`text-[15px] font-black tracking-tight ${isActive ? 'text-white' : 'text-slate-900 dark:text-slate-200'}`}>
                                                        {version.version}
                                                    </span>
                                                    {version.isLatest && (
                                                        <span className={`px-1.5 py-0.5 rounded-md text-[8px] font-black uppercase tracking-wider ${isActive ? 'bg-white text-blue-600' : 'bg-blue-500 text-white'}`}>
                                                            {t("Latest")}
                                                        </span>
                                                    )}
                                                </div>
                                                <span className={`text-[11px] font-medium mt-0.5 ${isActive ? 'text-blue-100' : 'text-slate-500 dark:text-slate-500'}`}>
                                                    {version.date}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Main Content Area — Scrollable Feed on Desktop, Accordion on Mobile */}
                            <div className="flex-1 overflow-y-auto no-scrollbar bg-white dark:bg-black/40 scroll-smooth">
                                <div className="flex flex-col md:block">
                                    {updates.map((version, idx) => {
                                        const isActive = selectedIdx === idx;
                                        return (
                                            <div
                                                key={idx}
                                                id={`version-${idx}`}
                                                className={`md:p-10 border-b border-slate-50 dark:border-white/[0.03] last:border-0 transition-all duration-300 ${isActive ? 'opacity-100' : 'md:opacity-40'}`}
                                            >
                                                {/* Mobile Accordion Header */}
                                                <button
                                                    onClick={() => setSelectedIdx(isActive ? -1 : idx)}
                                                    className="md:hidden w-full px-6 py-5 flex items-center justify-between group transition-colors hover:bg-slate-50 dark:hover:bg-white/[0.02]"
                                                >
                                                    <div className="flex flex-col items-start text-left">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span className={`text-[15px] font-black tracking-tight ${isActive ? 'text-blue-500' : 'text-slate-900 dark:text-slate-200'}`}>
                                                                {version.version}
                                                            </span>
                                                            {version.isLatest && (
                                                                <span className="px-1.5 py-0.5 rounded-md bg-blue-500 text-white text-[8px] font-black uppercase tracking-wider">
                                                                    {t("Latest")}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <span className="text-[11px] font-medium text-slate-500 dark:text-slate-500 uppercase tracking-wider">
                                                            {version.date}
                                                        </span>
                                                    </div>
                                                    <div className={`p-2 rounded-lg bg-slate-100 dark:bg-white/5 transition-transform duration-300 ${isActive ? 'rotate-180 text-blue-500' : 'text-slate-400'}`}>
                                                        <ChevronDown size={18} strokeWidth={3} />
                                                    </div>
                                                </button>

                                                {/* Version Content */}
                                                <AnimatePresence>
                                                    {(isActive || typeof window !== 'undefined' && window.innerWidth >= 768) && (
                                                        <motion.div
                                                            initial={typeof window !== 'undefined' && window.innerWidth < 768 ? { height: 0, opacity: 0 } : { opacity: 1 }}
                                                            animate={typeof window !== 'undefined' && window.innerWidth < 768 ? { height: 'auto', opacity: 1 } : { opacity: 1 }}
                                                            exit={typeof window !== 'undefined' && window.innerWidth < 768 ? { height: 0, opacity: 0 } : { opacity: 1 }}
                                                            transition={{ duration: 0.3, ease: 'easeInOut' }}
                                                            className="overflow-hidden"
                                                        >
                                                            <div className="px-6 pb-8 md:p-0">
                                                                <div className="hidden md:flex items-center gap-3 mb-6">
                                                                    <div className="w-8 h-[2px] bg-blue-500/20 rounded-full" />
                                                                    <span className="text-[10px] sm:text-[11px] font-bold text-blue-500 uppercase tracking-[0.15em]">
                                                                        {version.version} — {version.date}
                                                                    </span>
                                                                </div>

                                                                <h3 className="text-[clamp(1.15rem,5vw,2.25rem)] font-black text-slate-900 dark:text-white tracking-tight leading-[1.2] mb-5 md:mb-6">
                                                                    {version.title}
                                                                </h3>

                                                                <p className="text-[14px] sm:text-[16px] leading-relaxed text-slate-500 dark:text-slate-400 font-medium max-w-[600px] mb-8 md:mb-10">
                                                                    {version.description}
                                                                </p>

                                                                <div className="space-y-6 text-left">
                                                                    {version.items.map((item, itemIdx) => (
                                                                        <div
                                                                            key={itemIdx}
                                                                            className="relative pl-6 sm:pl-7"
                                                                        >
                                                                            <div className="absolute left-0 top-[10px] w-1.5 h-1.5 rounded-full bg-blue-500/30" />
                                                                            <h5 className="text-[14px] sm:text-[15px] font-bold text-slate-800 dark:text-slate-100 tracking-tight mb-2">
                                                                                {item.title}
                                                                            </h5>
                                                                            <p className="text-[13px] sm:text-[14px] leading-relaxed text-slate-500 dark:text-slate-400 font-medium">
                                                                                {item.description}
                                                                            </p>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="px-6 sm:px-8 py-4 border-t border-slate-100 dark:border-white/[0.08] bg-slate-50/50 dark:bg-black/80 flex items-center justify-end sticky bottom-0 z-50">
                            <button
                                onClick={onClose}
                                className="w-full sm:w-auto px-6 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.05] dark:hover:bg-white/[0.1] text-slate-600 dark:text-slate-300 text-[12px] font-bold rounded-full transition-all active:scale-95 border border-transparent dark:border-white/[0.05]"
                            >
                                {t("Close")}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default UpdatesModal;
