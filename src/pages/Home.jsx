// =============================================================================
// HOME PAGE (Landing Page)
// This is the first screen users see when they visit Stac.
// It introduces the protocol, displays live network statistics,
// lists supported tokens, explains how the app works, and ends with
// a footer full of links. No wallet connection is required to view this page.
// =============================================================================

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  TrendingUp, Wallet, Network, Activity, ShieldCheck,
  Zap, ArrowRight, Code2, Layers, Droplets, ArrowRightLeft,
  ArrowUp, RefreshCw
} from 'lucide-react';
import { motion, useMotionValue, useSpring, AnimatePresence, useReducedMotion } from 'framer-motion';
import { formatCurrency, formatNumber } from '../utils/blockchain';

// Hooks that pull live data from the blockchain and our backend
import { useDappTransactionCount } from '../hooks/useDappTransactionCount';
import { useDappBridgeCount } from '../hooks/useDappBridgeCount';
import { useActiveUsers } from '../hooks/useActiveUsers';
import { useNetworkUptime } from '../hooks/useNetworkUptime';
import { useTotalVolume } from '../hooks/useTotalVolume';
import { useTotalValueProcessed } from '../hooks/useTotalValueProcessed';
import { useTransactionHistory } from '../hooks/useTransactionHistory';
import LanguageSelector from '../components/LanguageSelector';
import { useTheme } from '../hooks/useTheme';


// =============================================================================
// HOME COMPONENT
// =============================================================================
const Home = ({ setActiveTab }) => {
  const { t } = useTranslation();
  const { darkMode } = useTheme();

  // `fetchGlobalStats` updates the shared dApp-wide transaction summary
  const { fetchGlobalStats } = useTransactionHistory();

  // --- Live stats from the blockchain / backend hooks ---
  // Each hook returns: a value, a percentage change, and a trend direction ('up'|'down'|'stable')
  const { transactionCount, change, trend } = useDappTransactionCount();
  const { bridgeCount, change: bridgeChange, trend: bridgeTrend } = useDappBridgeCount();
  const { activeUsers, change: usersChange, trend: usersTrend } = useActiveUsers();
  const { uptime, change: uptimeChange, trend: uptimeTrend } = useNetworkUptime();
  const { totalVolume, loading: volumeLoading } = useTotalVolume();
  const { totalValue, loading: tvpLoading } = useTotalValueProcessed();


  // ─── Poll global stats every 60 seconds ───────────────────────────────────
  useEffect(() => {
    fetchGlobalStats();
    const interval = setInterval(fetchGlobalStats, 60000);
    return () => clearInterval(interval);
  }, [fetchGlobalStats]);


  // ─── Stats object ──────────────────────────────────────────────────────────
  // Starts with safe default values, then gets updated by the individual effects below.
  const [stats, setStats] = useState({
    volume: { value: totalVolume || 0, change: 0, trend: 'up' },
    tvl: { value: totalValue || 0, change: 0, trend: 'up' },
    users: { value: activeUsers || 0, change: usersChange || 0, trend: usersTrend || 'stable' },
    transactions: { value: transactionCount || 0, change: change || 0, trend: trend || 'stable' },
    crossChain: { value: bridgeCount || 0, change: bridgeChange || 0, trend: bridgeTrend || 'stable' },
    uptime: { value: uptime || 0, change: uptimeChange || 0, trend: uptimeTrend || 'stable' },
  });


  // ─── Navigate to the Swap page when "Get Started" is clicked ─────────────
  const handleGetStarted = () => setActiveTab('swap');


  // ─── Keep stats in sync as live data arrives ───────────────────────────────
  // Each effect below updates only its specific stat slice to avoid full re-renders.

  // Update swap transaction count
  useEffect(() => {
    if (transactionCount !== null) {
      setStats(prev => ({
        ...prev,
        transactions: {
          ...prev.transactions,
          value: transactionCount,
          change: change !== null ? change : prev.transactions.change,
          trend: trend !== 'stable' ? trend : prev.transactions.trend,
        },
      }));
    }
  }, [transactionCount, change, trend]);

  // Update bridge transfer count
  useEffect(() => {
    if (bridgeCount !== null) {
      setStats(prev => ({
        ...prev,
        crossChain: {
          ...prev.crossChain,
          value: bridgeCount,
          change: bridgeChange !== null ? bridgeChange : prev.crossChain.change,
          trend: bridgeTrend !== 'stable' ? bridgeTrend : prev.crossChain.trend,
        },
      }));
    }
  }, [bridgeCount, bridgeChange, bridgeTrend]);

  // Update active wallet count
  useEffect(() => {
    if (activeUsers !== null) {
      setStats(prev => ({
        ...prev,
        users: {
          ...prev.users,
          value: activeUsers,
          change: usersChange !== null ? usersChange : prev.users.change,
          trend: usersTrend !== 'stable' ? usersTrend : prev.users.trend,
        },
      }));
    }
  }, [activeUsers, usersChange, usersTrend]);

  // Update network uptime percentage
  useEffect(() => {
    if (uptime !== null) {
      setStats(prev => ({
        ...prev,
        uptime: {
          ...prev.uptime,
          value: uptime,
          change: uptimeChange !== null ? uptimeChange : prev.uptime.change,
          trend: uptimeTrend !== 'stable' ? uptimeTrend : prev.uptime.trend,
        },
      }));
    }
  }, [uptime, uptimeChange, uptimeTrend]);

  // Update total USD swap volume
  useEffect(() => {
    if (totalVolume !== null && !volumeLoading) {
      setStats(prev => ({ ...prev, volume: { ...prev.volume, value: totalVolume } }));
    }
  }, [totalVolume, volumeLoading]);

  // Update total USD value processed (bridge + swap combined)
  useEffect(() => {
    if (totalValue !== null && !tvpLoading) {
      setStats(prev => ({ ...prev, tvl: { ...prev.tvl, value: totalValue } }));
    }
  }, [totalValue, tvpLoading]);


  // ─── "Scroll to top" button visibility ────────────────────────────────────
  // Shows up after the user scrolls down 400px
  const [showScrollTop, setShowScrollTop] = useState(false);
  const shouldReduceMotion = useReducedMotion(); // Respect "Reduce motion" OS setting

  useEffect(() => {
    const onScroll = () => setShowScrollTop(window.scrollY > 400);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollToTop = () =>
    window.scrollTo({ top: 0, behavior: shouldReduceMotion ? 'auto' : 'smooth' });


  // =============================================================================
  // ANIMATED NUMBER COMPONENT
  // Smoothly animates between old and new values using a spring physics curve.
  // Also briefly flashes brighter when the value updates.
  // =============================================================================
  const AnimatedNumber = ({ value, formatFn }) => {
    const motionValue = useMotionValue(value);
    const springValue = useSpring(motionValue, { damping: 25, stiffness: 60, restDelta: 0.001 });
    const [display, setDisplay] = useState(formatFn(value));
    const [isPulsing, setIsPulsing] = useState(false);

    // Trigger spring + pulse animation when value changes
    useEffect(() => {
      motionValue.set(value);
      setIsPulsing(true);
      const timer = setTimeout(() => setIsPulsing(false), 800);
      return () => clearTimeout(timer);
    }, [value, motionValue]);

    // While the spring runs, update the display text every frame
    useEffect(() => {
      return springValue.on('change', (latest) => setDisplay(formatFn(latest)));
    }, [springValue, formatFn]);

    return (
      <motion.span
        animate={isPulsing ? { scale: [1, 1.05, 1], filter: ['brightness(1)', 'brightness(1.5)', 'brightness(1)'] } : {}}
        transition={{ duration: 0.4 }}
      >
        {display}
      </motion.span>
    );
  };


  // =============================================================================
  // STAT CARDS CONFIGURATION
  // Each entry defines what data to show in the "Network Statistics" section.
  // =============================================================================
  const statCards = [
    { id: 'tvl', label: t('Total Volume'), rawValue: stats.tvl.value, formatFn: (v) => formatCurrency(v, 0), lucideIcon: TrendingUp, suffix: 'USD' },
    { id: 'volume', label: t('Swap Volume'), rawValue: stats.volume.value, formatFn: (v) => formatCurrency(v, 0), lucideIcon: RefreshCw, suffix: 'USD' },
    { id: 'bridge', label: t('Bridge Stats'), rawValue: stats.crossChain.value, formatFn: (v) => formatNumber(Math.floor(v)), lucideIcon: Network, suffix: t('Transfers') },
    { id: 'users', label: t('Active Users'), rawValue: stats.users.value, formatFn: (v) => formatNumber(Math.floor(v)), lucideIcon: Wallet, suffix: t('Wallets') },
    { id: 'transactions', label: t('Transactions'), rawValue: stats.transactions.value, formatFn: (v) => formatNumber(Math.floor(v)), lucideIcon: Activity, suffix: t('Total') },
    { id: 'uptime', label: t('Network Uptime'), rawValue: stats.uptime.value, formatFn: (v) => `${Math.round(v)}%`, lucideIcon: ShieldCheck, suffix: t('Uptime') },
  ];

  // All stat icons use the same monochrome colour (matches the app's theme)
  const getIconColor = () => 'text-slate-900 dark:text-white opacity-80';


  // =============================================================================
  // RENDER
  // =============================================================================
  return (
    <div className="min-h-screen bg-white dark:bg-black">

      {/* ==================================================================
          HERO SECTION
          The big headline + CTA buttons that greet new visitors.
      ================================================================== */}
      <section className="relative pt-32 pb-16 overflow-hidden flex flex-col items-center justify-center bg-white dark:bg-black dark:border-b dark:border-white/5 hero-blueprint-grid">

        {/* Ambient background blobs (dark mode only) — purely decorative */}
        <div className="hidden dark:block absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-15%] left-[-10%] w-[700px] h-[700px] bg-white rounded-full mix-blend-plus-lighter filter blur-[120px] opacity-70 animate-blob" style={{ willChange: 'transform' }} />
          <div className="absolute top-[5%]  left-[5%]  w-[500px] h-[500px] bg-slate-800/30 rounded-full mix-blend-plus-lighter filter blur-[100px] opacity-20 animate-blob animation-delay-3000" style={{ willChange: 'transform' }} />
          <div className="absolute top-[-10%] right-[10%] w-[600px] h-[600px] bg-slate-800/20 rounded-full mix-blend-plus-lighter filter blur-[120px] opacity-20 animate-blob" style={{ willChange: 'transform' }} />
          <div className="absolute bottom-[-15%] right-[-10%] w-[800px] h-[800px] bg-slate-900/40 rounded-full mix-blend-plus-lighter filter blur-[130px] opacity-20 animate-blob animation-delay-2000" style={{ willChange: 'transform' }} />
          <div className="absolute bottom-[15%] right-[5%] w-[600px] h-[600px] bg-slate-800/25 rounded-full mix-blend-plus-lighter filter blur-[110px] opacity-20 animate-blob animation-delay-5000" style={{ willChange: 'transform' }} />
          {/* Soft centre glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-white filter blur-[150px] opacity-30 pointer-events-none" />
          {/* Grain texture overlay for depth */}
          <div className="absolute inset-0 opacity-[0.06] pointer-events-none" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }} />
        </div>

        {/* Hero copy & buttons */}
        <div className="relative z-10 text-center max-w-6xl mx-auto px-6 pt-4 pb-10">
          {/* Decorative corner brackets around the main headline */}
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="relative inline-block px-4 py-8 sm:px-24 sm:py-16 lg:px-32"
          >
            <div className="absolute top-0    left-0  w-4 h-4 sm:w-8 sm:h-8 border-t-[2px] border-l-[2px] border-slate-400 dark:border-white/30" />
            <div className="absolute top-0    right-0 w-4 h-4 sm:w-8 sm:h-8 border-t-[2px] border-r-[2px] border-slate-400 dark:border-white/30" />
            <div className="absolute bottom-0 left-0  w-4 h-4 sm:w-8 sm:h-8 border-b-[2px] border-l-[2px] border-slate-400 dark:border-white/30" />
            <div className="absolute bottom-0 right-0 w-4 h-4 sm:w-8 sm:h-8 border-b-[2px] border-r-[2px] border-slate-400 dark:border-white/30" />

            <h1 className="text-4xl sm:text-6xl md:text-[60px] lg:text-[75px] xl:text-[85px] font-bold tracking-tighter text-[#0f172a] dark:text-white leading-[1.1] sm:leading-[0.82] mb-0 md:whitespace-nowrap">
              {t('Home of DeFi on')} <span className="text-black dark:text-white">{t('Arc')}</span>
            </h1>
          </motion.div>

          {/* Tagline */}
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="text-lg md:text-xl text-slate-500 dark:text-slate-300 mt-6 mb-8 max-w-2xl mx-auto leading-relaxed"
          >
            {t('Swap tokens, bridge assets, and provide liquidity with')} <span className="text-black dark:text-white font-semibold">{t('zero friction')}</span>. {t('Built on')} <span className="text-black dark:text-white font-medium">{t("Arc's")}</span> {t('enterprise-grade infrastructure.')}
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="flex flex-col sm:flex-row items-center justify-center gap-5 mb-12"
          >
            {/* "Get Started" → goes to the Swap tab */}
            <button
              onClick={handleGetStarted}
              className="w-full sm:w-52 h-16 bg-black dark:bg-white text-white dark:text-black rounded-2xl font-bold hover:bg-black dark:bg-white active:scale-[0.97] transition-all duration-300 flex items-center justify-center space-x-2 text-lg group"
            >
              <span>{t('Get Started')}</span>
              <ArrowRight size={22} strokeWidth={2.5} className="group-hover:translate-x-1 transition-transform" />
            </button>

            {/* "Learn More" → opens arcnetwork.io in a new tab */}
            <a
              href="https://www.arc.network/"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-52 h-16 bg-white dark:bg-black text-[#0f172a] dark:text-white border-2 border-slate-200 dark:border-white/10 rounded-2xl font-bold hover:bg-slate-50 dark:hover:bg-white/5 active:scale-[0.98] transition-all duration-300 flex items-center justify-center text-lg"
            >
              {t('Learn More')}
            </a>
          </motion.div>

          {/* Key selling-point labels */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="flex flex-wrap items-center justify-center gap-x-8 gap-y-8 sm:gap-x-16 sm:gap-y-12"
          >
            {[
              { label: t('Sub-second Finality') },
              { label: t('USDC Gas Fees') },
              { label: t('Best Execution') },
            ].map((feature, i) => (
              <div key={i} className="flex flex-col items-center">
                <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 dark:text-white uppercase tracking-[0.2em] sm:tracking-[0.3em]">
                  {feature.label}
                </span>
                <div className="w-8 sm:w-10 h-0.5 bg-black dark:bg-white mt-3 sm:mt-4 rounded-full" />
              </div>
            ))}
          </motion.div>
        </div>
      </section>


      {/* ==================================================================
          NETWORK STATISTICS SECTION
          Shows live dApp metrics (volume, users, uptime, etc.)
          Each number smoothly animates with a spring when it updates.
      ================================================================== */}
      <section className="py-24 px-6 md:px-12 max-w-7xl mx-auto">
        <div className="text-center mb-20">
          <h2 className="text-3xl md:text-4xl font-bold text-[#0f172a] dark:text-white mb-6 tracking-tight">{t('Network Statistics')}</h2>
          <p className="text-slate-500 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
            {t('Real-time performance metrics and institutional-grade data from across Stac.')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-16 gap-x-12">
          {statCards.map((stat, index) => (
            <motion.div
              key={stat.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05 }}
              className="flex flex-col items-center text-center"
            >
              {/* Stat icon */}
              <div className={`mb-4 ${getIconColor()}`}>
                <stat.lucideIcon size={24} strokeWidth={2} />
              </div>
              <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-3">{stat.label}</p>
              <div className="flex flex-col items-center">
                {/* Animated number display */}
                <h3 className="text-4xl md:text-5xl font-bold text-[#0f172a] dark:text-white mb-1 tabular-nums">
                  <AnimatedNumber value={stat.rawValue} formatFn={stat.formatFn} />
                </h3>
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-600 uppercase tracking-widest">{stat.suffix}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </section>


      {/* ==================================================================
          SUPPORTED ASSETS SECTION
          Shows logos and names of every token available on Stac.
      ================================================================== */}
      <section className="py-24 bg-slate-50/50 dark:bg-[#020617]/50 border-y border-slate-100 dark:border-white/5">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-[#0f172a] dark:text-white mb-6 tracking-tight">{t('Supported Assets')}</h2>
          <p className="text-slate-500 dark:text-slate-400 max-w-2xl mx-auto mb-16 leading-relaxed">
            {t("Seamlessly interact with the world's most trusted digital assets, and Stac's own tokens on Arc network.")}
          </p>

          <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-12 sm:gap-x-16 lg:gap-x-20">
            {[
              { name: t('USDC'), icon: '/icons/usdc.png', symbol: 'USDC' },
              { name: t('EURC'), icon: '/icons/eurc.png', symbol: 'EURC' },
              { name: t('Stac Token'), icon: '/icons/stc.png', symbol: 'STC' },
              { name: t('MTB Token'), icon: '/icons/mtb.png', symbol: 'MTB' },
              { name: t('Ball Token'), icon: '/icons/ball.png', symbol: 'BALL' },
              { name: t('ECR Token'), icon: '/icons/ecr.png', symbol: 'ECR' },
            ].map((token) => (
              <div key={token.name} className="group flex flex-col items-center text-center min-w-[100px]">
                <div className="w-16 h-16 rounded-full bg-white dark:bg-black border border-slate-200 dark:border-white/10 flex items-center justify-center mb-4 transition-all duration-300 group-hover:border-black dark:border-white group-hover:shadow-lg group-hover:shadow-black dark:shadow-white group-hover:-translate-y-1 overflow-hidden">
                  <img src={token.icon} alt={token.name} className="w-10 h-10 object-contain dark:invert-0" />
                </div>
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">{token.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* ==================================================================
          HOW IT WORKS SECTION
          Three simple cards explaining the core protocol features.
      ================================================================== */}
      <section className="py-24 px-6 md:px-12 max-w-7xl mx-auto">
        <div className="text-center mb-20">
          <h2 className="text-3xl md:text-4xl font-bold text-[#0f172a] dark:text-white mb-6 tracking-tight">{t('How it Works')}</h2>
          <p className="text-slate-500 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
            {t('How it Works description')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            {
              title: t('Swap Assets'),
              desc: t('Exchange digital assets with sub-second finality and the lowest gas fees in the industry using our optimized liquidity routes.'),
              icon: RefreshCw,
              bg: 'bg-slate-50 dark:bg-black dark:bg-[#131720]',
              iconColor: 'text-black dark:text-white',
            },
            {
              title: t('Bridge Tokens'),
              desc: t('Seamlessly move your assets across multiple chains with institutional-grade security and minimal friction.'),
              icon: ArrowRightLeft,
              bg: 'bg-slate-50 dark:bg-black dark:bg-[#131720]',
              iconColor: 'text-black dark:text-white',
            },
            {
              title: t('Provide Liquidity'),
              desc: t('Earn protocol fees'),
              icon: Droplets,
              bg: 'bg-slate-50 dark:bg-black dark:bg-[#131720]',
              iconColor: 'text-black dark:text-white',
            },
          ].map((step, i) => (
            <div key={i} className="flex flex-col items-start p-8 rounded-3xl bg-slate-50 dark:bg-[#020617] border border-slate-100 dark:border-white/5 transition-all duration-300 hover:border-black dark:hover:border-white">
              <div className={`w-12 h-12 flex items-center justify-center rounded-xl ${step.bg} mb-8`}>
                <step.icon size={20} className={step.iconColor} />
              </div>
              <h3 className="text-xl font-bold text-[#0f172a] dark:text-white mb-4">{step.title}</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-medium">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>


      {/* ==================================================================
          WHY CHOOSE ARC SECTION
          Four feature cards highlighting Arc's competitive advantages.
      ================================================================== */}
      <section className="py-24 px-6 md:px-12 max-w-7xl mx-auto">
        <div className="text-center mb-20">
          <h2 className="text-4xl md:text-5xl font-bold text-[#0f172a] dark:text-white mb-8 tracking-tight">{t('Why Choose Arc')}</h2>
          <p className="text-slate-500 dark:text-slate-400 max-w-3xl mx-auto leading-relaxed text-lg font-medium">
            {t('Arc description')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {[
            { title: t('Lightning Fast'), desc: t('Experience sub-second finality on every transaction. Our proprietary consensus mechanism ensures your trades are executed at the speed of thought.'), icon: Zap, iconColor: 'text-black dark:text-white' },
            { title: t('Institutional Security'), desc: t("Benefit from multi-layered security protocols and battle-tested smart contracts audited by the world's leading firms."), icon: ShieldCheck, iconColor: 'text-black dark:text-white' },
            { title: t('Zero Friction'), desc: t('Removal of DeFi complexity. Pay gas fees in USDC, enjoy automated portfolio management, and bridge assets seamlessly.'), icon: Layers, iconColor: 'text-black dark:text-white' },
            { title: t('Developer Friendly'), desc: t('Build on Arc with ease using our comprehensive SDKs, robust documentation, and modular API architecture.'), icon: Code2, iconColor: 'text-black dark:text-white' },
          ].map((feature, i) => (
            <div key={i} className="flex flex-col items-start p-10 rounded-3xl bg-slate-50 dark:bg-[#131720] border border-slate-100 dark:border-white/5 transition-all duration-300 hover:border-black dark:hover:border-white group">
              <div className="mb-6">
                <feature.icon size={20} className={feature.iconColor} />
              </div>
              <h3 className="text-2xl font-bold text-[#0f172a] dark:text-white mb-4 tracking-tight">{feature.title}</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-medium">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>


      {/* ==================================================================
          FOOTER
          Navigation links, social media, language selector, and attribution.
      ================================================================== */}
      <footer className="bg-white dark:bg-black border-t border-slate-200 dark:border-white/10 pt-10 pb-16 md:pb-12 mt-8">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-12 mb-16 text-left">

            {/* Brand column */}
            <div className="col-span-2 lg:col-span-1">
              <div
                className="flex items-center gap-2 mb-6 cursor-pointer"
                onClick={() => { setActiveTab('home'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              >
                {/* Split Stac logo into two halves using overflow-hidden */}
                <div className="h-8 w-6 overflow-hidden flex-shrink-0 bg-transparent">
                  <img src="/icons/stac.png" alt="" className="h-8 max-w-none object-cover dark:invert" style={{ objectPosition: 'left' }} />
                </div>
                <div className="h-8 overflow-hidden flex-shrink-0 ml-1.5 bg-transparent">
                  <img src="/icons/stac.png" alt="Stac" className="h-8 max-w-none object-cover dark:invert" style={{ marginLeft: '-24px' }} />
                </div>
              </div>
              <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed max-w-[240px]">{t('footer.description')}</p>
            </div>

            {/* Product links */}
            <div className="flex flex-col items-start">
              <h4 className="font-bold text-black dark:text-white mb-6 uppercase tracking-wider text-xs">{t('Product')}</h4>
              <ul className="space-y-4 text-left">
                <li><button onClick={() => setActiveTab('swap')} className="text-slate-500 dark:text-slate-400 hover:text-black dark:hover:text-white transition-all duration-300 text-sm font-medium">{t('Swap')}</button></li>
                <li><button onClick={() => setActiveTab('bridge')} className="text-slate-500 dark:text-slate-400 hover:text-black dark:hover:text-white transition-all duration-300 text-sm font-medium">{t('Bridge')}</button></li>
                <li><button onClick={() => setActiveTab('liquidity')} className="text-slate-400 dark:text-slate-500 cursor-not-allowed text-sm flex items-center gap-2">{t('Liquidity')} <span className="text-[10px] opacity-60 uppercase tracking-widest">{t('Soon')}</span></button></li>
              </ul>
            </div>

            {/* Developers / ecosystem links */}
            <div className="flex flex-col items-start">
              <h4 className="font-bold text-black dark:text-white mb-6 uppercase tracking-wider text-xs">{t('Developers')}</h4>
              <ul className="space-y-4 text-left">
                <li><a href="https://docs.arc.network" className="text-slate-500 dark:text-slate-400 hover:text-black dark:hover:text-white transition-all duration-300 text-sm font-medium">{t('Documentation')}</a></li>
                <li><a href="https://www.arc.network/ecosystem" className="text-slate-500 dark:text-slate-400 hover:text-black dark:hover:text-white transition-all duration-300 text-sm font-medium">{t('Ecosystem')}</a></li>
                <li><a href="https://community.arc.network/" className="text-slate-500 dark:text-slate-400 hover:text-black dark:hover:text-white transition-all duration-300 text-sm font-medium">{t('Community')}</a></li>
              </ul>
            </div>

            {/* App Settings — language picker and What's New */}
            <div className="flex flex-col items-start">
              <h4 className="font-bold text-black dark:text-white mb-6 uppercase tracking-wider text-xs">{t('App Settings')}</h4>
              <ul className="space-y-4 text-left">
                <li>
                  {/* What's New dispatches a custom event: Layout listens and opens the updates modal */}
                  <button
                    onClick={() => window.dispatchEvent(new CustomEvent('open-updates'))}
                    className="text-slate-500 dark:text-slate-400 hover:text-black dark:hover:text-white transition-all duration-300 text-sm font-medium"
                  >
                    {t("What's New")}
                  </button>
                </li>
                <li>
                  {/* Language selector renders a dropdown here in the footer */}
                  <LanguageSelector placement="footer" />
                </li>
              </ul>
            </div>

            {/* Social links */}
            <div className="flex flex-col items-start">
              <h4 className="font-bold text-black dark:text-white mb-6 uppercase tracking-wider text-xs">{t('Socials')}</h4>
              <ul className="space-y-4 text-left">
                <li><a href="https://x.com/stac_defi" target="_blank" rel="noopener noreferrer" className="text-slate-500 dark:text-slate-400 hover:text-black dark:hover:text-white transition-all duration-300 text-sm font-medium">{t('Twitter')}</a></li>
                <li><a href="#" className="text-slate-500 dark:text-slate-400 hover:text-black dark:hover:text-white transition-all duration-300 text-sm font-medium">{t('Discord')}</a></li>
                <li><a href="#" className="text-slate-500 dark:text-slate-400 hover:text-black dark:hover:text-white transition-all duration-300 text-sm font-medium">{t('Telegram')}</a></li>
                <li><a href="https://github.com/linux070/stac-defi" target="_blank" rel="noopener noreferrer" className="text-slate-500 dark:text-slate-400 hover:text-black dark:hover:text-white transition-all duration-300 text-sm font-medium">{t('GitHub')}</a></li>
              </ul>
            </div>
          </div>

          {/* Bottom copyright bar */}
          <div className="flex flex-col md:grid md:grid-cols-3 items-center gap-4 md:gap-0 text-[10px] sm:text-xs font-semibold text-slate-400 uppercase tracking-[0.15em] mt-8 md:mt-12">

            {/* Left: Copyright */}
            <div className="md:col-span-1 flex flex-col md:flex-row items-center justify-center md:justify-start gap-4 md:gap-x-2 md:gap-y-1">
              <span>© 2026 Stac . All rights reserved</span>
              {/* "Built by" credit — mobile only (stacked below copyright) */}
              <div className="flex md:hidden flex-col items-center gap-2 pb-4">
                <div className="flex items-center gap-2 text-slate-400">
                  <span>Built by :</span>
                  <a href="https://x.com/linux_mode" target="_blank" rel="noopener noreferrer" className="text-slate-500 dark:text-slate-400 hover:text-black dark:hover:text-white transition-all duration-300 font-bold uppercase tracking-[0.15em]">Linux</a>
                </div>
              </div>
            </div>

            {/* Centre: "Built by" credit — desktop only */}
            <div className="hidden md:flex md:col-span-1 items-center justify-center gap-1.5">
              <div className="flex items-center gap-2 text-slate-400 dark:text-slate-500">
                <span>Built by :</span>
                <a href="https://x.com/linux_mode" target="_blank" rel="noopener noreferrer" className="text-slate-500 dark:text-slate-400 hover:text-black dark:hover:text-white transition-all duration-300 font-bold uppercase tracking-[0.15em]">Linux</a>
              </div>
            </div>

            {/* Right: empty spacer to keep the grid balanced on desktop */}
            <div className="hidden md:block md:col-span-1" />
          </div>
        </div>
      </footer>


      {/* ==================================================================
          SCROLL TO TOP BUTTON
          Floats in the bottom-right corner. Appears after scrolling 400px.
          Respects "Reduce motion" OS preference.
      ================================================================== */}
      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0.5, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.5, y: 20 }}
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
            whileTap={{ scale: 0.95 }}
            onClick={scrollToTop}
            className="fixed bottom-6 right-6 sm:bottom-8 sm:right-8 z-[100] p-3 sm:p-4 rounded-2xl bg-white/90 dark:bg-[#0f172a]/90 backdrop-blur-xl border border-slate-200/50 dark:border-white/10 shadow-2xl shadow-black dark:shadow-white text-black dark:text-white flex items-center justify-center transition-all hover:bg-slate-50 dark:hover:bg-[#1e293b] group outline-none focus-visible:ring-2 focus-visible:ring-black dark:ring-white"
            aria-label="Scroll to top"
          >
            <ArrowUp size={24} strokeWidth={2.5} className="group-hover:-translate-y-0.5 transition-transform" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Home;