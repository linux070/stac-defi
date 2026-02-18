import { useState, useRef, useEffect } from 'react';
import { Bell, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';

const NotificationBell = ({ placement = 'header' }) => {
    const { t } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    const [hasUnread, setHasUnread] = useState(true);
    const bellRef = useRef(null);



    const [expandedVersions, setExpandedVersions] = useState(["v2.3    Feb 18, 2026"]);

    const updates = [
        {
            version: "v2.3   Feb 18, 2026",
            items: [
                {
                    title: t("DeFi Icon Overhaul"),
                    description: t("Replaced generic icons with purpose-built DeFi icons across all stat cards, quick actions, and feature sections."),
                    time: "now"
                },
                {
                    title: t("Premium Icon Containers"),
                    description: t("Color-tinted backgrounds with matching borders, removing the old blur-glow template style."),
                    time: "now"
                },
                {
                    title: t("Particle Animation Rework"),
                    description: t("Rebuilt the hero flow with minimal monochrome particles and theme-aware colors using native SVG."),
                    time: "now"
                },
                {
                    title: t("Mobile-First Responsiveness"),
                    description: t("All pages, modals, and components now properly sized for mobile viewports and small screens."),
                    time: "now"
                },
                {
                    title: t("Branding Purification"),
                    description: t("Removed legacy 'Kyber' code and branding to solidify original identity."),
                    time: "now"
                },
                {
                    title: t("Typography & Data Polish"),
                    description: t("Standardized weights and tabular numbers for better financial clarity."),
                    time: "now"
                }
            ]
        },
        {
            version: "v2.2   Feb 8, 2026",
            items: [
                {
                    title: t("Transaction History Backup"),
                    description: t("Integrated fail-safe IndexedDB logging for cross-chain transactions, ensuring your history is preserved even across browser refreshes."),
                    time: "3d ago"
                },
                {
                    title: t("Network Auto-Switch"),
                    description: t("Smart network detection that automatically prompts for the correct blockchain when initiating a Bridge or Swap operation."),
                    time: "3d ago"
                },
                {
                    title: t("Bridge UI Refinement"),
                    description: t("Upgraded to a premium neutral grey aesthetic with unified button styling and improved network selector layouts for better clarity."),
                    time: "3d ago"
                },
                {
                    title: t("Cross-App Design Sync"),
                    description: t("Synchronized Swap and Bridge input boxes with pill-shaped selectors and matched focus glows for a seamless interface."),
                    time: "3d ago"
                },
                {
                    title: t("Network Logo Persistence"),
                    description: t("Redesigned the chain selector logic to ensure icons remain permanent and accurate during network switches."),
                    time: "3d ago"
                },
                {
                    title: t("Mobile Ergonomics & Branding"),
                    description: t("Optimized tooltips/labels for mobile devices and unified Circle CCTP branding across all bridge modals."),
                    time: "3d ago"
                }
            ]
        },
        {
            version: "v2.1    Jan 21, 2026",
            items: [
                {
                    title: t("Multi-Chain Balance Dashboard"),
                    description: t("Real-time USDC balances across Arc Testnet, Sepolia, and Base Sepolia now visible in a single unified view."),
                    time: "3w ago"
                },
                {
                    title: t("Protocol Health Monitoring"),
                    description: t("New real-time hooks for Network Uptime and Active User metrics to track protocol growth and reliability."),
                    time: "3w ago"
                },
                {
                    title: t("Base Sepolia Integration"),
                    description: t("Seamlessly switch to Base Sepolia directly from the wallet dropdown with full asset visibility."),
                    time: "3w ago"
                },
                {
                    title: t("Token Asset Refresh"),
                    description: t("Updated branding for tokens with high-fidelity PNG assets across the platform."),
                    time: "3w ago"
                }
            ]
        },
        {
            version: "v2.0    Jan 11, 2026",
            items: [
                {
                    title: t("Stac Digital Cemetery"),
                    description: t("A themed experience for terminated subscriptions with character-driven visuals and death certificates."),
                    time: "1mo ago"
                },
                {
                    title: t("Optimized Data Layer"),
                    description: t("Integrated IndexedDB for blazingly fast transaction state management and persistent local caching."),
                    time: "1mo ago"
                },
                {
                    title: t("Precision Decimal Handling"),
                    description: t("Critical fix for Sepolia balance accuracy (18 decimals) versus Arc Testnet (6 decimals)."),
                    time: "1mo ago"
                },
                {
                    title: t("Privy Authentication"),
                    description: t("Integrated enterprise-grade auth flow for secure and seamless wallet onboarding."),
                    time: "1mo ago"
                }
            ]
        },
        {
            version: "v1.9    Jan 04, 2026",
            items: [
                {
                    title: t("Global Language Support"),
                    description: t("Standardized localization for English, German, Spanish, French, and Chinese users."),
                    time: "1mo ago"
                },
                {
                    title: t("Instant Theme Engine"),
                    description: t("Zero-latency light/dark mode switching optimized specifically for mobile wallet browsers."),
                    time: "1mo ago"
                },
                {
                    title: t("Unified Activity Feed"),
                    description: t("Track real-time protocol usage globally with the new 'All Activity' transaction stream."),
                    time: "1mo ago"
                }
            ]
        },
        {
            version: "v1.8    Dec 28, 2025",
            items: [
                {
                    title: t("Dynamic Swap Interface"),
                    description: t("Refined the swap experience with better slippage protection and real-time quote updates."),
                    time: "1mo ago"
                },
                {
                    title: t("Circle CCTP Bridge"),
                    description: t("Implemented secure, official cross-chain transfers powered by Circle's Cross-Chain Transfer Protocol."),
                    time: "1mo ago"
                },
                {
                    title: t("Liquidity Early Access"),
                    description: t("Preview of the Liquidity pools and yield farming UI for early community testers."),
                    time: "1mo ago"
                }
            ]
        },
        {
            version: "v1.7    Dec 15, 2025",
            items: [
                {
                    title: t("Multi-Network Bridge"),
                    description: t("Launch of the initial bridge infrastructure supporting Sepolia to Arc Testnet transfers."),
                    time: "2mo ago"
                },
                {
                    title: t("USDC Gas Engine"),
                    description: t("Predictable transaction costs with stablecoin-based gas fee estimates across the DEX."),
                    time: "2mo ago"
                },
                {
                    title: t("Security Audit Prep"),
                    description: t("Comprehensive refactor of bridge contracts and flow for enterprise-grade security standards."),
                    time: "2mo ago"
                }
            ]
        },
        {
            version: "v1.6    Dec 01, 2025",
            items: [
                {
                    title: t("Arc Testnet Genesis"),
                    description: t("Official support for the Arc Network core infrastructure and sub-second finality."),
                    time: "2mo ago"
                },
                {
                    title: t("Real-time Metrics"),
                    description: t("Initial deployment of the TVL and Processed Volume tracking system for network transparency."),
                    time: "2mo ago"
                },
                {
                    title: t("DEX Foundation"),
                    description: t("Launch of the core swap logic and token registry system on the testnet."),
                    time: "2mo ago"
                }
            ]
        }
    ];

    const toggleVersion = (version) => {
        setExpandedVersions(prev =>
            prev.includes(version)
                ? prev.filter(v => v !== version)
                : [...prev, version]
        );
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (bellRef.current && !bellRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const toggleOpen = () => {
        setIsOpen(!isOpen);
        if (!isOpen) setHasUnread(false);
    };

    return (
        <div ref={bellRef} className="relative">
            {/* Bell Button */}
            <button
                onClick={toggleOpen}
                className={`h-[44px] relative px-3.5 rounded-2xl border transition-all duration-300 active:scale-95 group flex items-center gap-2.5 backdrop-blur-xl font-medium ${isOpen
                    ? 'bg-white dark:bg-white/10 border-blue-500/40 dark:border-blue-400/40 text-blue-600 dark:text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.1)]'
                    : 'bg-slate-50/50 dark:bg-white/5 border-slate-200/60 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-white/10 hover:border-blue-500/30 dark:hover:border-blue-400/30 hover:shadow-sm'
                    }`}
                aria-label={t("Toggle Notifications")}
            >
                <div className="relative flex items-center justify-center">
                    <Bell
                        size={placement === 'mobile' ? 22 : 18}
                        className={`${isOpen ? 'text-blue-500' : ''} transition-transform group-hover:rotate-12`}
                    />

                    {/* Notification Badge */}
                    {hasUnread && (
                        <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-black animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
                    )}
                </div>

                {/* Text inside the button (Desktop only) */}
                {placement === 'header' && (
                    <span className={`text-[14px] font-bold tracking-tight hidden xl:block ${isOpen ? 'text-blue-600 dark:text-blue-400' : 'text-slate-600 dark:text-slate-400'}`}>
                        {t("What's New")}
                    </span>
                )}
            </button>

            {/* Dropdown Popover */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.1 }}
                        className={`absolute mt-8 w-[92vw] max-w-[350px] md:max-w-[420px] bg-white/80 dark:bg-[#0b0c10]/95 rounded-[32px] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] border border-slate-200/60 dark:border-white/10 overflow-hidden z-[5000] backdrop-blur-3xl ring-1 ring-black/5 dark:ring-white/5 
                        ${placement === 'mobile' ? 'right-[-44px]' : 'right-[-80px] lg:right-[-120px]'}`}
                    >
                        {/* Dropdown Header */}
                        <div className="p-6 pb-4 flex items-center justify-between border-b border-slate-100 dark:border-white/5 bg-slate-50/30 dark:bg-white/[0.01]">
                            <div className="flex flex-col">
                                <h4 className="text-[20px] font-bold tracking-tight text-slate-900 dark:text-white leading-none mb-2">{t("What's New?")}</h4>
                                <div className="flex items-center gap-2">
                                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold tracking-[0.1em]">{t("Latest Updates on Stac")}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-2 h-9 w-9 flex items-center justify-center rounded-xl hover:bg-slate-100 dark:hover:bg-white/10 transition-colors text-slate-400"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Notifications List - Accordion Style */}
                        <div className="max-h-[520px] overflow-y-auto custom-scrollbar p-3 space-y-2 bg-transparent pb-10">
                            {updates.map((versionGroup, vIdx) => (
                                <div key={vIdx} className="overflow-hidden">
                                    <button
                                        onClick={() => toggleVersion(versionGroup.version)}
                                        className="w-full flex items-center justify-between px-5 py-3 rounded-2xl hover:bg-slate-100/50 dark:hover:bg-white/5 transition-colors group"
                                    >
                                        <span className="text-[13px] font-bold font-['Inter'] text-slate-900 dark:text-white tracking-tight whitespace-pre">{versionGroup.version}</span>
                                        <div className={`transition-transform duration-300 ${expandedVersions.includes(versionGroup.version) ? 'rotate-180' : ''}`}>
                                            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                <path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                            </svg>
                                        </div>
                                    </button>

                                    <AnimatePresence>
                                        {expandedVersions.includes(versionGroup.version) && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                className="overflow-hidden"
                                            >
                                                <div className="space-y-0 pb-4">
                                                    {versionGroup.items.map((update, idx) => (
                                                        <div
                                                            key={idx}
                                                            className="px-5 py-3 rounded-[24px] transition-all cursor-pointer group/item relative overflow-hidden"
                                                        >
                                                            <div className="flex gap-4 relative z-10">
                                                                <div className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-slate-900 dark:bg-white mt-2 opacity-60" />
                                                                <div className="flex-1 min-w-0 flex flex-col justify-center">
                                                                    <div className="flex items-center justify-between mb-0.5">
                                                                        <h4 className="text-[15px] font-bold text-slate-900 dark:text-white truncate tracking-tight">
                                                                            {update.title}
                                                                        </h4>
                                                                        <span className="text-[10px] text-slate-600 dark:text-slate-300 font-bold lowercase bg-slate-100 dark:bg-white/10 px-2 py-0.5 rounded-lg ml-3 whitespace-nowrap">
                                                                            {update.time}
                                                                        </span>
                                                                    </div>
                                                                    <p className="text-[13px] text-slate-500 dark:text-slate-400 leading-[1.5] font-normal opacity-80">
                                                                        {update.description}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default NotificationBell;
