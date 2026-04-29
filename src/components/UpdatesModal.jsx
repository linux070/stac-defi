import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const UpdatesModal = ({ isOpen, onClose }) => {
    const { t } = useTranslation();
    const [selectedIdx, setSelectedIdx] = useState(0);

    const updates = [
        {
            version: "v2.5.0",
            title: "Goldsky & Network Speed",
            date: "April 26, 2026",
            isLatest: true,
            description: "Faster transaction indexing and real-time network visibility.",
            items: [
                {
                    title: "Goldsky Integration",
                    description: "High-speed indexing for lightning-fast transaction tracking and activity feeds.",
                },
                {
                    title: "Optimized Activity Feed",
                    description: "Global transaction logs now update instantly with zero delay.",
                },
                {
                    title: "UI/UX Refinement",
                    description: "Premium slate-grey filters and refined interaction weights for a cleaner, high-end aesthetic.",
                },
                {
                    title: "Ledger Persistence",
                    description: "Unified global and personal history with resilient subgraph-powered recovery.",
                },
                {
                    title: "AppKit Stability",
                    description: "Enhanced wallet connection resilience for a smoother start-to-finish experience.",
                }
            ]
        },
        {
            version: "v2.4.5",
            title: "Persistent Ledger & Local Sync",
            date: "April 24, 2026",
            description: "Your data now stays with you across every session.",
            items: [
                {
                    title: "IndexedDB Persistence",
                    description: "Transaction history is now securely stored locally, surviving refreshes and cache clears.",
                },
                {
                    title: "Local Sync Engine",
                    description: "Instant balance updates and preference retrieval using optimized local storage.",
                },
                {
                    title: "Resilient Recovery",
                    description: "Reconstruct your entire activity ledger from on-chain data in seconds.",
                }
            ]
        },
        {
            version: "v2.4.0",
            title: "UI Polish & Optimization",
            date: "April 21, 2026",
            description: "Refined spacing, typography, and performance tuning.",
            items: [
                {
                    title: "Spacing & Typography",
                    description: "Improved layout and font scaling for better readability across all devices.",
                },
                {
                    title: "Performance Tuning",
                    description: "Reduced main-thread overhead for smoother animations and transitions.",
                },
                {
                    title: "Global Stats Refresh",
                    description: "Live network stats now update more frequently with lower CPU usage.",
                }
            ]
        },
        {
            version: "v2.3.4",
            title: "Wallet & Bridge Reliability",
            date: "Feb 22, 2026",
            description: "Better wallet connection and smoother bridging.",
            items: [
                {
                    title: "Wallet Reconnection Fix",
                    description: "Your wallet now stays connected when you refresh the page — no more flickering or disconnects.",
                },
                {
                    title: "Wallet Avatar Caching",
                    description: "Your wallet icon loads instantly on return visits instead of showing a blank placeholder.",
                },
                {
                    title: "Bridge Backup",
                    description: "Added extra servers for the bridge to keep it working even when the main service is busy.",
                },
                {
                    title: "Balance Checks",
                    description: "The app now double-checks your balance before you bridge tokens.",
                },
                {
                    title: "Better Fee Display",
                    description: "All fees are now shown clearly in your bridge confirmation.",
                }
            ]
        },
        {
            version: "v2.3.0",
            title: "New Mobile Layout",
            date: "Feb 20, 2026",
            description: "Major visual update for mobile and a new home page layout.",
            items: [
                {
                    title: "Mobile Account Details",
                    description: "New view for your account on mobile — see networks and balances in one place.",
                },
                {
                    title: "Smooth Animations",
                    description: "Menus and settings slide in and out smoothly on mobile.",
                },
                {
                    title: "Clean Home Page",
                    description: "Updated the main page with a simpler grid and better spacing.",
                },
                {
                    title: "Easier Reading",
                    description: "Adjusted font sizes to make text easier to read.",
                }
            ]
        },
        {
            version: "v2.2.0",
            title: "Visual Fixes",
            date: "Feb 16, 2026",
            description: "Small improvements to tokens, the footer, and music buttons.",
            items: [
                {
                    title: "Token Name Fix",
                    description: "Correct token names now show up if a trade is cancelled.",
                },
                {
                    title: "Page Alignment",
                    description: "Headings are now centered across all devices.",
                },
                {
                    title: "New Footer",
                    description: "Added links to our social channels with a cleaner design.",
                },
                {
                    title: "Rounded Buttons",
                    description: "Music player buttons now match the rest of the app's style.",
                }
            ]
        },
        {
            version: "v2.1.0",
            title: "Performance & Icons",
            date: "Feb 10, 2026",
            description: "Faster balance loading and unified icons.",
            items: [
                {
                    title: "Quick Balances",
                    description: "Balances load instantly even when switching networks.",
                },
                {
                    title: "Multi-Chain View",
                    description: "Check your assets across all networks at once.",
                },
                {
                    title: "Instant Loading",
                    description: "The app now remembers your data to save loading time.",
                },
                {
                    title: "Matching Icons",
                    description: "Token logos now look the same across all pages.",
                },
                {
                    title: "New Font",
                    description: "Switched to a cleaner font for better clarity.",
                }
            ]
        },
        {
            version: "v1.8.0",
            title: "New Tokens",
            date: "Dec 15, 2025",
            description: "Support for more tokens and a transaction history log.",
            items: [
                {
                    title: "Added BALL, MTB, ECR",
                    description: "You can now trade and move these three new tokens.",
                },
                {
                    title: "History Log",
                    description: "See your past transactions in a simple list.",
                }
            ]
        },
        {
            version: "v1.5.0",
            title: "Official Launch",
            date: "Nov 01, 2025",
            description: "The first public version of Stac.",
            items: [
                {
                    title: "Swap & Bridge",
                    description: "Main trading and bridging features are now live.",
                },
                {
                    title: "Initial Security",
                    description: "Security layers added to keep your funds safe.",
                }
            ]
        },
        {
            version: "v1.0.0",
            title: "Core Protocol",
            date: "Oct 15, 2025",
            description: "The beginning of the Stac protocol.",
            items: [
                {
                    title: "Foundations",
                    description: "Basic infrastructure launched on the network.",
                },
                {
                    title: "Docs Published",
                    description: "First version of the documentation is ready.",
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
        <AnimatePresence mode="wait">
            {isOpen && (
                <div className="fixed inset-0 z-[100000] overflow-hidden flex items-center justify-center p-0 sm:p-6 md:p-10">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/40 dark:bg-black/98 sm:dark:bg-black/80 backdrop-blur-md"
                    />

                    {/* Modal Container */}
                    <motion.div
                        initial={typeof window !== 'undefined' && window.innerWidth < 768 ? { y: '100%' } : { opacity: 0, scale: 0.98, y: 30 }}
                        animate={{ y: 0, opacity: 1, scale: 1 }}
                        exit={typeof window !== 'undefined' && window.innerWidth < 768 ? { y: '100%' } : { opacity: 0, scale: 0.98, y: 30 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="relative w-full h-full sm:h-auto sm:max-w-[1080px] bg-white dark:bg-[#121212] rounded-none sm:rounded-[32px] shadow-[0_32px_128px_rgba(0,0,0,0.15)] dark:shadow-[0_48px_160px_rgba(0,0,0,0.8)] flex flex-col overflow-hidden sm:border border-slate-200/80 dark:border-white/5"
                        style={{ maxHeight: typeof window !== 'undefined' && window.innerWidth < 768 ? '100dvh' : 'min(820px, 92vh)' }}
                    >
                         {/* Header */}
                         <div className="flex items-center justify-between px-6 sm:px-10 py-7 bg-white dark:bg-[#121212] border-b border-slate-100 dark:border-white/[0.05] sticky top-0 z-50">
                             <div className="flex-1 flex justify-start">
                                 <button
                                     onClick={onClose}
                                     className="w-10 h-10 flex items-center justify-center rounded-full text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-all active:scale-90 border border-transparent"
                                 >
                                     <ChevronLeft size={22} strokeWidth={2.5} />
                                 </button>
                             </div>
                             <div className="flex-1 flex justify-center">
                                 <h2 className="text-[14px] font-bold text-slate-800 dark:text-white tracking-tight">{t("What's New")}</h2>
                             </div>
                             <div className="flex-1 flex justify-end" />
                         </div>

                        {/* Body — Split Panel / Accordion */}
                        <div className="flex-1 flex flex-col md:flex-row overflow-hidden min-h-0 relative">

                            {/* Left Sidebar — Desktop Only */}
                            <div className="hidden md:block w-[280px] flex-shrink-0 border-r border-slate-100 dark:border-white/[0.05] bg-slate-50/10 dark:bg-white/[0.02] overflow-y-auto no-scrollbar">
                                <div className="px-5 pt-5 pb-2">
                                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-[0.15em]">
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
                                                 className={`w-full text-left px-4 py-4 rounded-2xl transition-all duration-300 group flex flex-col relative ${isActive
                                                     ? 'bg-slate-100 dark:bg-white/5 shadow-sm active:scale-[0.98]'
                                                     : 'hover:bg-slate-50 dark:hover:bg-white/[0.02]'
                                                     }`}
                                             >
                                                 <div className="flex items-center justify-between w-full gap-3 mb-1.5">
                                                     <span className={`text-[15px] font-bold tracking-tight ${isActive ? 'text-black dark:text-white' : 'text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white'}`}>
                                                         {version.version}
                                                     </span>
                                                     {version.isLatest && (
                                                         <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest ${isActive ? 'bg-black dark:bg-white text-white dark:text-black' : 'bg-slate-200 dark:bg-white/10 text-slate-500 dark:text-slate-400'}`}>
                                                             {t("NEW")}
                                                         </span>
                                                     )}
                                                 </div>
                                                 <span className={`text-[11px] font-medium transition-colors ${isActive ? 'text-slate-500 dark:text-slate-500' : 'text-slate-400 dark:text-slate-600'}`}>
                                                     {version.date}
                                                 </span>
                                                 {isActive && (
                                                     <motion.div 
                                                         layoutId="activeIndicator"
                                                         className="absolute left-0 top-4 bottom-4 w-1 bg-brand rounded-full"
                                                         initial={false}
                                                     />
                                                 )}
                                             </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Main Content Area */}
                            <div className="flex-1 overflow-y-auto no-scrollbar bg-white dark:bg-[#121212] scroll-smooth">
                                <div className="flex flex-col md:block">
                                    {updates.map((version, idx) => {
                                        const isActive = selectedIdx === idx;
                                        return (
                                            <div
                                                key={idx}
                                                id={`version-${idx}`}
                                                className={`md:p-12 border-b border-slate-50 dark:border-white/[0.05] last:border-0 transition-all duration-300 ${isActive ? 'opacity-100' : 'md:opacity-40'}`}
                                            >
                                                {/* Mobile Accordion Header */}
                                                <button
                                                    onClick={() => setSelectedIdx(isActive ? -1 : idx)}
                                                    className="md:hidden w-full px-6 py-6 flex items-center justify-between group transition-colors hover:bg-slate-50 dark:hover:bg-white/[0.02]"
                                                >
                                                    <div className="flex flex-col items-start text-left">
                                                        <div className="flex items-center gap-3 mb-1.5">
                                                            <span className={`text-[17px] font-bold tracking-tight ${isActive ? 'text-black dark:text-white' : 'text-slate-600 dark:text-slate-400'}`}>
                                                                {version.version}
                                                            </span>
                                                            {version.isLatest && (
                                                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest ${isActive ? 'bg-black dark:bg-white text-white dark:text-black' : 'bg-slate-100 dark:bg-white/5 text-slate-400'}`}>
                                                                    {t("NEW")}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <span className="text-[12px] font-medium text-slate-500 dark:text-slate-500 tracking-wider">
                                                            {version.date}
                                                        </span>
                                                    </div>
                                                    <div className={`p-2.5 rounded-xl bg-slate-100 dark:bg-white/5 transition-transform duration-300 ${isActive ? 'rotate-180 text-black dark:text-white shadow-sm' : 'text-slate-400'}`}>
                                                        <ChevronDown size={20} strokeWidth={2.5} />
                                                    </div>
                                                </button>

                                                {/* Version Content */}
                                                <AnimatePresence mode="wait">
                                                    {(isActive || (typeof window !== 'undefined' && window.innerWidth >= 768)) && (
                                                        <motion.div
                                                            initial={typeof window !== 'undefined' && window.innerWidth < 768 ? { height: 0, opacity: 0 } : { opacity: 1 }}
                                                            animate={typeof window !== 'undefined' && window.innerWidth < 768 ? { height: 'auto', opacity: 1 } : { opacity: 1 }}
                                                            exit={typeof window !== 'undefined' && window.innerWidth < 768 ? { height: 0, opacity: 0 } : { opacity: 1 }}
                                                            transition={{ duration: 0.3, ease: 'easeInOut' }}
                                                            className="overflow-hidden"
                                                        >
                                                            <div className="px-6 pb-10 md:p-0">

                                                                <h3 className="text-[clamp(1.25rem,5vw,2.5rem)] font-bold text-black dark:text-white tracking-tight leading-[1.1] mb-6 md:mb-8">
                                                                    {version.title}
                                                                </h3>

                                                                <p className="text-[15px] sm:text-[17px] leading-relaxed text-slate-500 dark:text-slate-400 font-medium max-w-[640px] mb-10 md:mb-12">
                                                                    {version.description}
                                                                </p>

                                                                 <div className="space-y-8 md:space-y-10">
                                                                     {version.items.map((item, itemIdx) => (
                                                                         <div key={itemIdx} className="flex gap-5 items-start group/item">
                                                                             <div className="mt-2.5 w-1.5 h-1.5 rounded-full bg-brand/40 dark:bg-brand/60 ring-4 ring-brand/5 dark:ring-brand/10 transition-all duration-300" />
                                                                             <div className="flex flex-col text-left">
                                                                                 <h4 className="text-[18px] font-bold text-slate-900 dark:text-white tracking-tight mb-2">
                                                                                     {item.title}
                                                                                 </h4>
                                                                                 <p className="text-[16px] leading-relaxed text-slate-500 dark:text-slate-400 font-medium">
                                                                                     {item.description}
                                                                                 </p>
                                                                             </div>
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
                        <div className="px-8 sm:px-10 py-7 border-t border-slate-100 dark:border-white/5 bg-white dark:bg-[#121212] flex items-center justify-center sticky bottom-0 z-50">
                             <button
                                 onClick={onClose}
                                 className="px-16 py-4 bg-slate-900 dark:bg-white text-white dark:text-black hover:opacity-90 transition-all active:scale-95 text-[13px] font-black uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-black/10"
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
