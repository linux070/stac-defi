import { motion, AnimatePresence } from 'framer-motion';
import { X, Zap, Box, Shield, Layers } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const UpdatesModal = ({ isOpen, onClose }) => {
    const { t } = useTranslation();

    const updates = [
        {
            version: "v2.3",
            date: "  Feb, 18 2026",
            items: [
                {
                    title: t("DeFi Icon Overhaul"),
                    description: t("Replaced all generic icons with purpose-built DeFi icons — TrendingUp for volume, Wallet for users, Network for cross-chain, Activity for transactions, and ShieldCheck for uptime."),
                    icon: <Zap size={20} className="text-blue-500" />,
                    tag: t("Design")
                },
                {
                    title: t("Premium Icon Containers"),
                    description: t("Redesigned icon containers with color-tinted backgrounds and matching borders, removing the old blur-glow AI template style for a production DeFi look."),
                    icon: <Layers size={20} className="text-indigo-500" />,
                    tag: t("UI")
                },
                {
                    title: t("Particle Animation Rework"),
                    description: t("Rebuilt the hero flow animation with minimal monochrome particles, hairline orbit paths, and theme-aware colors using native SVG for zero JS overhead."),
                    icon: <Box size={20} className="text-purple-500" />,
                    tag: t("Animation")
                },
                {
                    title: t("Mobile-First Responsiveness"),
                    description: t("Prioritized mobile viewport across all pages — modals, inputs, cards, and navigation now properly size and space on small screens."),
                    icon: <Shield size={20} className="text-emerald-500" />,
                    tag: t("Mobile")
                },
                {
                    title: t("Theme Toggle Sync"),
                    description: t("All icons, particles, and containers now seamlessly adapt to light and dark mode via currentColor inheritance and Tailwind dark: variants."),
                    icon: <Shield size={20} className="text-cyan-500" />,
                    tag: t("Theme")
                },
                {
                    title: t("Branding Purification"),
                    description: t("Complete removal of legacy 'Kyber' branding assets, logic, and code references across the entire repository to solidify Stac's unique identity."),
                    icon: <Shield size={20} className="text-blue-600" />,
                    tag: t("Core")
                },
                {
                    title: t("Dynamic Viewport Stability"),
                    description: t("Implemented 'dvh' (Dynamic Viewport Height) units for all primary modals, ensuring stability and correct sizing in mobile wallet browsers."),
                    icon: <Box size={20} className="text-indigo-600" />,
                    tag: t("Mobile")
                },
                {
                    title: t("Typography & Layout Polish"),
                    description: t("Refined font weights and implemented tabular number formatting for all financial data to ensure professional readability on all screens."),
                    icon: <Layers size={20} className="text-emerald-500" />,
                    tag: t("UI")
                }
            ]
        },
        {
            version: "v2.2",
            date: "  Feb, 10 2026",
            items: [
                {
                    title: t("Premium DeFi UI Refresh"),
                    description: t("Upgraded all modals, input boxes, and selectors with a premium glassmorphism aesthetic and refined micro-interactions."),
                    icon: <Zap size={20} className="text-blue-500" />,
                    tag: t("Design")
                },
                {
                    title: t("Transaction History Backup"),
                    description: t("Integrated fail-safe IndexedDB logging for cross-chain transactions, ensuring your history is preserved even across browser refreshes."),
                    icon: <Layers size={20} className="text-blue-600" />,
                    tag: t("Core")
                },
                {
                    title: t("Network Auto-Switch"),
                    description: t("Smart network detection that automatically prompts for the correct blockchain when initiating a Bridge or Swap operation."),
                    icon: <Box size={20} className="text-indigo-500" />,
                    tag: t("Logic")
                },
                {
                    title: t("Precision Gas Monitoring"),
                    description: t("Real-time gas estimation engine for Circle CCTP transfers with millisecond accuracy for cost transparency."),
                    icon: <Shield size={20} className="text-emerald-500" />,
                    tag: t("Trading")
                },
                {
                    title: t("Slippage Optimization"),
                    description: t("Enhanced slippage toolbar with a softer, page-matching light blue theme and modern Satoshi typography for precision."),
                    icon: <Shield size={20} className="text-indigo-500" />,
                    tag: t("Trading")
                },
                {
                    title: t("Compact UI Layout"),
                    description: t("Streamlined token selectors and input groups to a professional DeFi size, optimizing vertical space for a tighter feel."),
                    icon: <Layers size={20} className="text-cyan-500" />,
                    tag: t("Layout")
                },
                {
                    title: t("Bridge Reliability Engine"),
                    description: t("Re-engineered the cross-chain bridge logic for zero-flicker stability and optimized transaction monitoring."),
                    icon: <Box size={20} className="text-purple-500" />,
                    tag: t("Core")
                }
            ]
        },
        {
            version: "v2.1",
            date: "  Jan, 21 2026",
            items: [
                {
                    title: t("Multi-Chain Balance Dashboard"),
                    description: t("Unified view of USDC balances across Arc, Sepolia, and Base Sepolia with real-time syncing."),
                    icon: <Shield size={20} className="text-amber-500" />,
                    tag: t("Balance")
                },
                {
                    title: t("Base Sepolia Integration"),
                    description: t("Seamless network transition and full asset visibility for the Base ecosystem."),
                    icon: <Box size={20} className="text-emerald-500" />,
                    tag: t("Network")
                }
            ]
        },
        {
            version: "v2.0",
            date: "  Jan, 11 2026",
            items: [
                {
                    title: t("Performance Upgrade"),
                    description: t("Re-engineered RPC fetching allowing for instantaneous multi-chain updates."),
                    icon: <Zap size={20} className="text-blue-600" />,
                    tag: t("Speed")
                }
            ]
        }
    ];

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.1 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-[100000]"
                    />

                    {/* Modal Container */}
                    <div className="fixed inset-0 flex items-center justify-center p-4 z-[100001] pointer-events-none">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.1 }}
                            className="w-full max-w-2xl max-h-[90vh] max-h-[90dvh] bg-white dark:bg-slate-950 rounded-[32px] md:rounded-[48px] shadow-[0_32px_128px_rgba(0,0,0,0.4)] border border-gray-100 dark:border-white/10 overflow-hidden pointer-events-auto flex flex-col relative"
                        >
                            {/* Decorative Background Glow */}
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-32 bg-blue-500/10 blur-[100px] pointer-events-none"></div>

                            {/* Header */}
                            <div className="p-5 sm:p-8 md:p-10 border-b border-gray-100 dark:border-white/5 flex items-center justify-between bg-slate-50/30 dark:bg-white/[0.01] backdrop-blur-md relative z-10">
                                <div className="flex items-center space-x-5">
                                    <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-[20px] md:rounded-[24px] bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white shadow-2xl shadow-blue-500/40">
                                        <Zap size={24} className="fill-white/20 animate-pulse sm:hidden" />
                                        <Zap size={32} className="fill-white/20 animate-pulse hidden sm:block" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h2 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white leading-tight tracking-tight">{t("What's New?")}</h2>
                                        <p className="text-[11px] md:text-[12px] text-blue-500 dark:text-blue-400 font-bold tracking-tight mt-1 whitespace-pre">{t("Platform Changelog • v2.3    Feb 18, 2026")}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="p-3 rounded-2xl bg-white dark:bg-white/5 border border-slate-100 dark:border-white/10 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-500 transition-all duration-300 shadow-sm"
                                >
                                    <X size={24} />
                                </button>
                            </div>

                            {/* Content - Optimized Flex Scroll */}
                            <div className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-6 md:p-12 space-y-8 sm:space-y-12 bg-white dark:bg-slate-950 relative z-10">
                                {updates.map((versionGroup, groupIdx) => (
                                    <div key={groupIdx} className="space-y-8">
                                        <div className="flex items-center gap-4 px-2">
                                            <div className="h-[1px] flex-1 bg-slate-100 dark:bg-white/5"></div>
                                            <div className="flex flex-col items-center">
                                                <span className="text-[14px] font-black text-blue-600 dark:text-blue-400 tracking-tight whitespace-pre">{versionGroup.version}{versionGroup.date}</span>
                                            </div>
                                            <div className="h-[1px] flex-1 bg-slate-100 dark:bg-white/5"></div>
                                        </div>

                                        <div className="space-y-10">
                                            {versionGroup.items.map((update, idx) => (
                                                <div key={idx} className="flex items-start space-x-5 md:space-x-8 group cursor-default">
                                                    <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 md:w-16 md:h-16 rounded-[16px] sm:rounded-[20px] md:rounded-[24px] bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 flex items-center justify-center transition-all duration-500 group-hover:scale-110 group-hover:bg-white dark:group-hover:bg-white/10 group-hover:shadow-2xl group-hover:shadow-blue-500/10">
                                                        <div className="scale-110 md:scale-135">
                                                            {update.icon}
                                                        </div>
                                                    </div>
                                                    <div className={`flex-1 min-w-0`}>
                                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2 gap-2">
                                                            <h3 className="text-base md:text-xl font-black text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors leading-tight tracking-tight">
                                                                {update.title}
                                                            </h3>
                                                            <span className="self-start sm:self-center text-[9px] md:text-[10px] font-black uppercase tracking-[0.1em] px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 whitespace-nowrap border border-blue-100 dark:border-blue-500/20 shadow-sm">
                                                                {update.tag}
                                                            </span>
                                                        </div>
                                                        <p className="text-[13px] md:text-[15px] text-slate-500 dark:text-slate-400 leading-relaxed font-bold opacity-90 transition-opacity group-hover:opacity-100">
                                                            {update.description}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Footer */}
                            <div className="p-5 sm:p-8 md:p-12 bg-slate-50/50 dark:bg-white/[0.02] border-t border-gray-100 dark:border-white/5 relative z-10">
                                <button
                                    onClick={onClose}
                                    className="w-full py-4 sm:py-5 md:py-6 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-[20px] md:rounded-[28px] font-black text-sm sm:text-base md:text-lg hover:shadow-[0_20px_40px_rgba(37,99,235,0.3)] transition-all active:scale-[0.98] transform hover:-translate-y-1"
                                >
                                    {t("Got it, take me back")}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                </>
            )}
        </AnimatePresence>
    );
};

export default UpdatesModal;
