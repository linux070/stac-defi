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
  Zap, ArrowRight, Code2, Layers, Droplets, ArrowRightLeft,
  ArrowUp, RefreshCw, ShieldCheck
} from 'lucide-react';
import { motion, useMotionValue, useSpring, AnimatePresence, useReducedMotion } from 'framer-motion';
import { formatCurrency, formatNumber } from '../utils/blockchain';

// Hooks that pull live data from the blockchain and our backend
import { useDappTransactionCount } from '../hooks/useDappTransactionCount';
import { useActiveUsers } from '../hooks/useActiveUsers';
import { useTotalValueProcessed } from '../hooks/useTotalValueProcessed';


import { useTransactionHistory } from '../hooks/useTransactionHistory';
import { useTheme } from '../hooks/useTheme';
import StacLogo from '../components/StacLogo';


// =============================================================================
// SCRAMBLE TEXT COMPONENT
// Creates a high-end "shuffling/hacking" transition on hover for legal links.
// =============================================================================
const ScrambleText = ({ text, className }) => {
  const [displayText, setDisplayText] = useState(text);
  const [isHovering, setIsHovering] = useState(false);
  const chars = "ABCDEF1234567890!@#$%^&*()_+-=[]{}|;:,.<>?";

  useEffect(() => {
    if (!isHovering) {
      setDisplayText(text);
      return;
    }

    let iteration = 0;
    const interval = setInterval(() => {
      setDisplayText(
        text
          .split("")
          .map((char, index) => {
            if (index < iteration) return text[index];
            if (char === " ") return " ";
            return chars[Math.floor(Math.random() * chars.length)];
          })
          .join("")
      );

      if (iteration >= text.length) clearInterval(interval);
      iteration += 1 / 2;
    }, 30);

    return () => clearInterval(interval);
  }, [isHovering, text]);

  return (
    <span
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      className={`${className} cursor-pointer select-none transition-colors duration-200`}
    >
      {displayText}
    </span>
  );
};


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
  const { activeUsers, change: usersChange, trend: usersTrend } = useActiveUsers();
  const { totalValue, loading: tvpLoading } = useTotalValueProcessed();

  // Poll global stats every 60 seconds
  useEffect(() => {
    fetchGlobalStats();
    const interval = setInterval(fetchGlobalStats, 60000);
    return () => clearInterval(interval);
  }, [fetchGlobalStats]);


  // ─── Stats object ──────────────────────────────────────────────────────────
  // Starts with safe default values, then gets updated by the individual effects below.
  const [stats, setStats] = useState({
    tvl: { value: totalValue || 0, change: 0, trend: 'up' },
    users: { value: activeUsers || 0, change: usersChange || 0, trend: usersTrend || 'stable' },
    transactions: { value: transactionCount || 0, change: change || 0, trend: trend || 'stable' },
  });


  // ─── Interactive Feature State ──────────────────────────────────────────
  // Used in the "Why Arc Network" dashboard screen to toggle visualizations.



  // Navigate to the Swap page when "Get Started" is clicked
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
  const AnimatedNumber = ({ value, formatFn = (n) => n }) => {
    const motionValue = useMotionValue(value);
    const springValue = useSpring(motionValue, {
      damping: 30,
      stiffness: 80,
      restDelta: 0.001
    });
    const [display, setDisplay] = useState(formatFn(value));

    useEffect(() => {
      motionValue.set(value);
    }, [value, motionValue]);

    useEffect(() => {
      return springValue.on('change', (latest) => setDisplay(formatFn(latest)));
    }, [springValue, formatFn]);

    return (
      <motion.span
        className="font-mono tabular-nums inline-block"
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
    { id: 'tvl', label: t('Total Value Processed'), rawValue: stats.tvl.value, formatFn: (v) => formatCurrency(v, 0, true) },
    { id: 'users', label: t('Active Users'), rawValue: stats.users.value, formatFn: (v) => formatNumber(Math.floor(v), true) },
    { id: 'transactions', label: t('Transactions'), rawValue: stats.transactions.value, formatFn: (v) => formatNumber(Math.floor(v), true) },
  ];

  // All stat icons use the same monochrome colour (matches the app's theme)



  // =============================================================================
  // RENDER
  // =============================================================================
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.15, ease: 'easeOut' }}
      className="min-h-screen bg-white dark:bg-page-dark"
    >
      <section className="relative pt-32 pb-16 lg:pt-0 lg:pb-0 lg:min-h-[100dvh] overflow-hidden flex flex-col items-center justify-center bg-white dark:bg-page-dark hero-blueprint-grid">
        <div className="hidden dark:block absolute inset-0 overflow-hidden pointer-events-none opacity-60">
          <div className="absolute top-[-10%] md:top-[-15%] left-[-20%] md:left-[-10%] w-[350px] md:w-[700px] h-[350px] md:h-[700px] bg-brand rounded-full mix-blend-plus-lighter filter blur-[80px] md:blur-[120px] opacity-10 animate-blob" style={{ willChange: 'transform' }} />
          <div className="absolute top-[5%] left-[5%] w-[300px] md:w-[500px] h-[300px] md:h-[500px] bg-brand-hover/30 rounded-full mix-blend-plus-lighter filter blur-[60px] md:blur-[100px] opacity-20 animate-blob animation-delay-3000" style={{ willChange: 'transform' }} />
          <div className="absolute top-[-5%] md:top-[-10%] right-[0%] md:right-[10%] w-[350px] md:w-[600px] h-[350px] md:h-[600px] bg-brand/20 rounded-full mix-blend-plus-lighter filter blur-[80px] md:blur-[120px] opacity-20 animate-blob" style={{ willChange: 'transform' }} />
          <div className="absolute bottom-[-10%] md:bottom-[-15%] right-[-10%] w-[400px] md:w-[800px] h-[400px] md:h-[800px] bg-brand-hover/40 rounded-full mix-blend-plus-lighter filter blur-[90px] md:blur-[130px] opacity-20 animate-blob animation-delay-2000" style={{ willChange: 'transform' }} />
          <div className="absolute bottom-[20%] md:bottom-[15%] right-[5%] w-[300px] md:w-[600px] h-[300px] md:h-[600px] bg-brand/25 rounded-full mix-blend-plus-lighter filter blur-[70px] md:blur-[110px] opacity-20 animate-blob animation-delay-5000" style={{ willChange: 'transform' }} />
          <div className="absolute top-[35%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-brand filter blur-[100px] md:blur-[150px] opacity-[0.05] pointer-events-none" />
          <div className="absolute inset-0 opacity-[0.06] pointer-events-none" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }} />
        </div>

        <div className="relative z-10 text-center max-w-6xl mx-auto px-6 pt-4 pb-10 lg:py-20 lg:flex lg:flex-col lg:items-center lg:justify-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.99 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="relative inline-block px-4 py-8 sm:px-24 sm:py-16 lg:px-32"
          >
            <div className="absolute top-0 left-0 w-4 h-4 sm:w-8 sm:h-8 border-t-[2px] border-l-[2px] border-brand/30 dark:border-brand-border" />
            <div className="absolute top-0 right-0 w-4 h-4 sm:w-8 sm:h-8 border-t-[2px] border-r-[2px] border-brand/30 dark:border-brand-border" />
            <div className="absolute bottom-0 left-0 w-4 h-4 sm:w-8 sm:h-8 border-b-[2px] border-l-[2px] border-brand/20 dark:border-brand/40" />
            <div className="absolute bottom-0 right-0 w-4 h-4 sm:w-8 sm:h-8 border-b-[2px] border-r-[2px] border-brand/20 dark:border-brand/40" />

            <h1 className="text-4xl sm:text-6xl md:text-[60px] lg:text-[75px] xl:text-[85px] font-normal tracking-tighter text-[#0f172a] dark:text-white leading-[1.1] sm:leading-[0.82] mb-0 md:whitespace-nowrap">
              {t('Omnichain Liquidity, ')} <span className="text-brand">{t('Unified.')}</span>
            </h1>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.15, ease: 'easeOut', delay: 0.05 }}
            className="text-base sm:text-lg md:text-xl text-secondary/80 dark:text-secondary mt-10 mb-12 max-w-2xl mx-auto leading-relaxed font-medium"
          >
            {t('Swap tokens, bridge assets, and provide liquidity with zero friction. Built on Arc\'s enterprise-grade infrastructure.')}
          </motion.p>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="flex flex-row items-center justify-center gap-3 sm:gap-5 mb-12 w-full max-w-[400px] sm:max-w-none px-4 sm:px-0"
          >
            <button
              onClick={handleGetStarted}
              className="w-1/2 sm:w-52 h-14 sm:h-16 bg-brand text-white rounded-2xl font-bold hover:bg-brand-hover active:scale-[0.97] transition-all duration-300 flex items-center justify-center text-[15px] sm:text-lg group relative shadow-[0_1px_2px_rgba(0,0,0,0.1),inset_0_1px_1px_rgba(255,255,255,0.2)] overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/5 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <span className="relative z-10">{t('Get Started')}</span>
            </button>

            <a
              href="https://www.arc.network/"
              target="_blank"
              rel="noopener noreferrer"
              className="w-1/2 sm:w-52 h-14 sm:h-16 bg-white dark:bg-surface-dark text-[#0f172a] dark:text-white border-2 border-slate-200 dark:border-brand-border rounded-2xl font-bold hover:bg-slate-50 dark:hover:bg-surface-dark-hover active:scale-[0.98] transition-all duration-300 flex items-center justify-center text-[15px] sm:text-lg shadow-sm"
            >
              {t('Learn More')}
            </a>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="flex flex-wrap items-center justify-center gap-x-8 gap-y-8 sm:gap-x-16 sm:gap-y-12"
          >
            <div className="flex flex-col items-center">
              <span className="text-[10px] sm:text-[11px] font-bold text-secondary/60 dark:text-secondary uppercase tracking-[0.2em] sm:tracking-[0.3em]">
                {t('Sub-second Finality')}
              </span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-[10px] sm:text-[11px] font-bold text-secondary/60 dark:text-secondary uppercase tracking-[0.2em] sm:tracking-[0.3em]">
                {t('USDC Gas Fees')}
              </span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-[10px] sm:text-[11px] font-bold text-secondary/60 dark:text-secondary uppercase tracking-[0.2em] sm:tracking-[0.3em]">
                {t('Best Execution')}
              </span>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="py-20 lg:py-0 px-6 md:px-12 max-w-7xl mx-auto dark:bg-page-dark overflow-hidden lg:min-h-[100dvh] lg:flex lg:items-center lg:justify-center">
        <div className="relative group w-full">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-y-16 md:gap-y-0 relative z-10 w-full">
            {statCards.map((stat, index) => (
              <motion.div
                key={stat.id}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ delay: index * 0.1, duration: 0.6, ease: [0.32, 0.72, 0, 1] }}
                className="flex flex-col items-center text-center px-4"
              >
                <div className="relative mb-3 flex flex-col items-center justify-center">
                  <div className="text-6xl sm:text-7xl lg:text-8xl font-bold tracking-tight text-brand tabular-nums mb-1 leading-none select-none">
                    <AnimatedNumber value={stat.rawValue} formatFn={stat.formatFn} />
                  </div>
                </div>

                <div className="mt-4">
                  <span className="text-[12px] sm:text-[14px] font-bold text-slate-400 dark:text-secondary/50 uppercase tracking-[0.4em] font-mono leading-none">
                    {stat.label}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>



      {/* ==================================================================
          HOW IT WORKS SECTION
          Three simple cards explaining the core protocol features.
      ================================================================== */}
      {/* ==================================================================
          HOW IT WORKS SECTION
          Refined editorial layout with minimal borders and strong contrast.
      ================================================================== */}
      <section className="py-32 px-6 md:px-12 max-w-7xl mx-auto dark:bg-page-dark">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between mb-24 gap-8">
          <div className="max-w-2xl">
            <h2 className="text-5xl md:text-7xl font-bold text-[#0f172a] dark:text-white mb-8 tracking-tighter leading-[1] font-['Satoshi','Inter',sans-serif]">
              {t('How ')} <span className="text-brand">{t('Stac')}</span> {t('Works.')}
            </h2>
            <p className="text-lg text-slate-500 dark:text-secondary font-medium leading-relaxed max-w-xl">
              {t('Getting started with Stac is simple, secure, and designed for speed. Everything you need to manage your assets on Stac in three simple steps.')}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-0 border border-slate-200 dark:border-white/10 rounded-[3rem] overflow-hidden">
          {[
            {
              id: '01',
              title: t('Swap Assets'),
              desc: t('Exchange digital assets with sub-second finality and the lowest gas fees in the industry using our optimized liquidity routes.'),
              icon: RefreshCw,
            },
            {
              id: '02',
              title: t('Bridge Tokens'),
              desc: t('Seamlessly move your assets across multiple chains with institutional-grade security and minimal friction.'),
              icon: ArrowRightLeft,
            },
            {
              id: '03',
              title: t('Provide Liquidity'),
              desc: t('Earn protocol fees by providing liquidity to the network. Secure, transparent, and built for institutional scale.'),
              icon: Droplets,
            },
          ].map((step, i) => (
            <div key={i} className={`p-12 md:p-16 flex flex-col items-start transition-colors duration-500 hover:bg-slate-50 dark:hover:bg-white/5 border-b md:border-b-0 ${i < 2 ? 'md:border-r border-slate-200 dark:border-white/10' : ''}`}>
              <span className="text-6xl font-mono font-black text-brand/30 dark:text-brand/15 mb-10 translate-x-[-4px]">{step.id}</span>
              <h3 className="text-3xl font-bold text-[#0f172a] dark:text-white mb-6 tracking-tighter font-['Satoshi','Inter',sans-serif]">{step.title}</h3>
              <p className="text-slate-500 dark:text-secondary leading-relaxed font-medium text-lg max-w-[90%]">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ==================================================================
          WHY ARC NETWORK DASHBOARD
          A multi-layered, interactive operations center showcasing the protocol's 
          core infrastructure and institutional-grade features.
      ================================================================== */}
      {/* ==================================================================
          WHY ARC NETWORK BENTO DASHBOARD
          A multi-dimensional operations center showcasing all protocol advantages
          simultaneously in a high-fidelity grid system.
      ================================================================== */}
      {/* ==================================================================
          WHY ARC NETWORK BENTO DASHBOARD
          A multi-dimensional operations center showcasing all protocol advantages
          simultaneously in a high-fidelity grid system.
          Refined with a sophisticated Data-Pattern background and Testnet status.
      ================================================================== */}
      {/* ==================================================================
          WHY ARC NETWORK EDITORIAL DASHBOARD
          Asymmetrical bento-grid with high-end typographic rhythm and haptic details.
      ================================================================== */}
      <section className="relative py-40 px-6 overflow-hidden bg-white dark:bg-page-dark flex flex-col items-center">
        {/* Subtle Ambient Background */}
        <div className="absolute inset-0 opacity-[0.2] dark:opacity-[0.03] pointer-events-none"
          style={{ backgroundImage: `radial-gradient(${darkMode ? '#6366F1' : '#CBD5E1'} 0.5px, transparent 0.5px)`, backgroundSize: '32px 32px' }} />

        <div className="relative z-10 text-left mb-32 max-w-7xl mx-auto px-6 md:px-12 w-full">


          <motion.h2
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="text-5xl md:text-7xl font-bold text-slate-900 dark:text-white mb-10 tracking-tighter leading-[1] font-['Satoshi','Inter',sans-serif]"
          >
            {t('Why Build on ')} <span className="text-brand">{t('Arc.')}</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 15 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }}
            className="text-lg md:text-xl text-slate-500 dark:text-secondary max-w-3xl leading-relaxed font-medium"
          >
            {t('Arc is designed for scale and built for stability, Arc provides the robust foundations needed for the future of decentralized capital markets.')}
          </motion.p>
        </div>

        <div className="relative w-full max-w-7xl mx-auto z-10 grid grid-cols-1 md:grid-cols-12 gap-6 pb-20">

          <motion.div
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="md:col-span-8 group relative rounded-[2.5rem] bg-slate-50 dark:bg-white/[0.02] border border-slate-300 dark:border-white/10 p-10 md:p-12 overflow-hidden flex flex-col justify-between min-h-[500px]"
          >
            <div className="relative z-10">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 rounded-2xl bg-brand/10 flex items-center justify-center text-brand shadow-sm ring-1 ring-brand/10">
                  <Zap size={24} strokeWidth={2.5} />
                </div>
                <h3 className="text-3xl font-medium text-slate-900 dark:text-white tracking-tight">{t('Lightning Fast')}</h3>
              </div>
              <p className="text-lg text-slate-500 dark:text-secondary max-w-md font-medium leading-relaxed">{t('Experience sub-second finality on every transaction with Arc’s proprietary consensus mechanism, optimized for high-frequency trading.')}</p>
            </div>

            <div className="relative h-32 md:h-48 mt-12 bg-white/60 dark:bg-black/40 rounded-[2rem] border border-slate-200 dark:border-white/5 p-6 md:p-8 flex items-end gap-1 md:gap-1.5 overflow-hidden">
              {/* Haptic Waveform Grid */}
              <div className="absolute inset-0 opacity-[0.1] dark:opacity-[0.03] pointer-events-none" style={{ backgroundImage: `linear-gradient(#6366F1 1px, transparent 1px), linear-gradient(90deg, #6366F1 1px, transparent 1px)`, backgroundSize: '24px 24px' }} />

              {Array.from({ length: 48 }).map((_, i) => (
                <motion.div
                  key={i}
                  style={{ originY: 1, transformZ: 0 }}
                  animate={{
                    scaleY: [0.4 + Math.sin(i * 0.5) * 0.4, 0.8 + Math.cos(i * 0.8) * 0.2, 0.4 + Math.sin(i * 0.5) * 0.4]
                  }}
                  transition={{
                    duration: 1.5 + Math.random(),
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: i * 0.05
                  }}
                  className={`${i >= 30 ? 'hidden md:block' : ''} flex-grow bg-brand/40 rounded-full w-0.5 md:w-px h-full min-w-[1px]`}
                />
              ))}
            </div>
          </motion.div>

          {/* Secondary Card: Security (4 cols) */}
          <motion.div
            initial={{ opacity: 0, x: 20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
            className="md:col-span-4 rounded-[2.5rem] bg-brand border border-white/20 p-10 md:p-12 flex flex-col justify-between overflow-hidden relative group text-white"
          >
            <div className="relative z-10">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-white shadow-sm ring-1 ring-white/20">
                  <ShieldCheck size={24} strokeWidth={2.5} />
                </div>
                <h3 className="text-3xl font-medium text-white tracking-tight">{t('Institutional Security')}</h3>
              </div>
              <p className="text-lg text-white/80 font-medium leading-relaxed">{t('Arc employs a multi-tiered validation layer, ensuring zero-trust protocol integrity for every execution.')}</p>
            </div>

            <div className="mt-8 space-y-4 relative z-10">
              <div className="flex justify-between items-center py-3 border-t border-white/10">
                <span className="text-[10px] uppercase tracking-widest text-white/60 font-mono">{t('Protocol Integrity')}</span>
                <span className="text-xs font-mono text-emerald-400">{t('Validated')}</span>
              </div>
              <div className="flex justify-between items-center py-3 border-t border-white/10">
                <span className="text-[10px] uppercase tracking-widest text-white/60 font-mono">{t('Consensus Model')}</span>
                <span className="text-xs font-mono text-white">{t('Deterministic')}</span>
              </div>
              <div className="flex justify-between items-center py-3 border-t border-white/10">
                <span className="text-[10px] uppercase tracking-widest text-white/60 font-mono">{t('Network Architecture')}</span>
                <span className="text-xs font-mono text-white/70">{t('Sovereign')}</span>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true }}
            className="md:col-span-5 rounded-[2.5rem] bg-brand border border-white/20 p-10 md:p-12 flex flex-col justify-between overflow-hidden relative group text-white"
          >
            <div className="relative z-10">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-white shadow-sm ring-1 ring-white/20">
                  <Layers size={24} strokeWidth={2.5} />
                </div>
                <h3 className="text-3xl font-medium text-white tracking-tight">{t('Zero Friction')}</h3>
              </div>
              <p className="text-lg text-white/80 font-medium leading-relaxed">{t('Abstracting the complexity of blockchain interaction. Pay gas in any asset, with native support for USDC and EURC.')}</p>
            </div>

            <div className="mt-8 flex items-center justify-center py-12 relative overflow-hidden bg-white/10 dark:bg-black/20 rounded-3xl border border-white/5">
              <div className="relative w-64 h-32 flex items-center justify-center">
                {/* Static Orbital Path */}
                <div className="absolute inset-0 rounded-full border border-white/10" />

                {/* Static USDC Token (Left) */}
                <div className="absolute left-2 w-20 h-20 rounded-full bg-white border border-white/20 shadow-[0_8px_32px_rgba(255,255,255,0.1)] flex items-center justify-center overflow-hidden z-20">
                  <img src="/icons/usdc.png" alt="USDC" className="w-full h-full object-contain" />
                </div>

                {/* Connection Line */}
                <div className="absolute h-px w-32 bg-gradient-to-r from-white/20 via-white/40 to-white/20" />

                {/* Static EURC Token (Right) */}
                <div className="absolute right-2 w-20 h-20 rounded-full bg-white border border-white/20 shadow-[0_8px_32px_rgba(255,255,255,0.1)] flex items-center justify-center overflow-hidden z-20">
                  <img src="/icons/eurc.png" alt="EURC" className="w-full h-full object-cover" />
                </div>
              </div>
            </div>
          </motion.div>

          {/* Quaternary Card: Developer (7 cols) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="md:col-span-7 rounded-[2.5rem] bg-slate-50 dark:bg-white/[0.02] p-10 md:p-12 border border-slate-300 dark:border-white/10 overflow-hidden flex flex-col justify-between relative group"
          >
            <div className="relative z-10">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 rounded-2xl bg-brand/10 flex items-center justify-center text-brand shadow-sm ring-1 ring-brand/5">
                  <Code2 size={24} strokeWidth={2.5} />
                </div>
                <h3 className="text-3xl font-medium text-slate-900 dark:text-white tracking-tight font-['Satoshi','Inter',sans-serif]">{t('Developer Friendly')}</h3>
              </div>
              <p className="text-lg text-slate-500 dark:text-secondary font-medium leading-relaxed max-w-xl">
                {t('Build institutional-grade DeFi apps with our high-performance SDK and comprehensive testing environment.')}
              </p>
            </div>

            {/* High-Fidelity Double-Bezel Enclosure (Purged Labels) */}
            <div className="relative h-[280px] md:h-[320px] mt-12 bg-white/60 dark:bg-black/40 rounded-[2rem] border border-slate-200 dark:border-white/5 p-6 md:p-10 flex flex-col gap-3 overflow-hidden group/bezel">
              {/* Technical Grid Texture */}
              <div className="absolute inset-0 opacity-[0.08] dark:opacity-[0.03] pointer-events-none" style={{ backgroundImage: `linear-gradient(#6366F1 1px, transparent 1px), linear-gradient(90deg, #6366F1 1px, transparent 1px)`, backgroundSize: '32px 32px' }} />

              <div className="relative z-10 space-y-4">
                {/* Console Header */}
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-white/10" />
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-white/10" />
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-white/10" />
                </div>

                {/* Simulated SDK Test Output */}
                {[
                  { label: "ARC_PROTO_INIT", status: "DONE", color: "text-brand" },
                  { label: "RPC_CONSENSUS_SYNC", status: "SYNCED", color: "text-emerald-400" },
                  { label: "TX_GAS_ESTIMATOR_RELAY", status: "READY", color: "text-brand" },
                  { label: "SECURITY_VALIDATOR_ACTIVE", status: "OK", color: "text-emerald-400" },
                  { label: "DAPP_INSTANCE_DEPLOY", status: "WAITING", color: "text-slate-400" },
                ].map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.5 + i * 0.15, duration: 0.5 }}
                    className="flex items-center justify-between font-mono text-[10px] md:text-sm tracking-tight"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-slate-400 dark:text-secondary/30">{`> ${item.label}`}</span>
                    </div>
                    <div className={`px-2 py-0.5 rounded-md ${item.color} bg-current/10 font-bold border border-current/20`}>
                      {item.status}
                    </div>
                  </motion.div>
                ))}

                {/* Pulsing Loading Indicator */}
                <motion.div 
                  className="flex items-center gap-2 mt-8 text-brand font-mono text-xs"
                  animate={{ opacity: [1, 0.4, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  <span className="w-1.5 h-4 bg-brand" />
                  <span>{t('RUNNING_SUITE_V2.0...')}</span>
                </motion.div>
              </div>

              {/* Decorative Accent Glow */}
              <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-brand/5 dark:bg-brand/10 rounded-full blur-[80px] pointer-events-none" />
            </div>
          </motion.div>
        </div>
      </section>


      {/* ==================================================================
          FOOTER
          Navigation links, social media, language selector, and attribution.
      ================================================================== */}
      {/* ==================================================================
          MINIMALIST EDITORIAL FOOTER
      ================================================================== */}
      <footer className="w-full bg-white dark:bg-black border-t border-slate-100 dark:border-white/5 py-24 relative z-10">
        <div className="max-w-[1400px] mx-auto px-10">
          <div className="flex flex-col lg:grid lg:grid-cols-2 gap-20 items-start">
            <div className="max-w-md space-y-8">
              <div
                className="flex items-center gap-3 cursor-pointer group"
                onClick={() => { setActiveTab('home'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              >
                <StacLogo darkMode={darkMode} className="h-9 w-9 flex-shrink-0" />
                <h3 className="text-2xl font-medium tracking-tight text-slate-900 dark:text-white font-sans pt-0.5">STAC</h3>
              </div>
              <p className="text-lg text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                {t('leveraging Arc’s sub-second finality and USDC gas for frictionless, swapping, bridging, and liquidity provision.')}
              </p>
            </div>
            <div className="w-full grid grid-cols-2 md:grid-cols-3 gap-12 lg:gap-16">
              <div>
                <h4 className="text-[10px] uppercase tracking-[0.3em] font-medium text-slate-400 mb-6">{t('Product')}</h4>
                <ul className="space-y-4">
                  <li><button onClick={() => setActiveTab('swap')} className="relative group text-[15px] font-medium text-slate-500 dark:text-slate-400 hover:text-black dark:hover:text-white transition-all">
                    {t('Swap')}
                    <div className="absolute bottom-[-2px] left-0 right-0 h-[2px] bg-brand scale-x-0 group-hover:scale-x-100 transition-all duration-300 rounded-full" />
                  </button></li>
                  <li><button onClick={() => setActiveTab('bridge')} className="relative group text-[15px] font-medium text-slate-500 dark:text-slate-400 hover:text-black dark:hover:text-white transition-all">
                    {t('Bridge')}
                    <div className="absolute bottom-[-2px] left-0 right-0 h-[2px] bg-brand scale-x-0 group-hover:scale-x-100 transition-all duration-300 rounded-full" />
                  </button></li>
                  <li><button onClick={() => setActiveTab('liquidity')} className="text-[15px] font-medium text-slate-300 dark:text-slate-600 cursor-not-allowed flex items-center gap-2">{t('Liquidity')} <span className="text-[9px] uppercase tracking-widest bg-slate-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded-full">{t('Soon')}</span></button></li>
                </ul>
              </div>
              <div>
                <h4 className="text-[10px] uppercase tracking-[0.3em] font-medium text-slate-400 mb-6">{t('Developers')}</h4>
                <ul className="space-y-4">
                  <li><a href="https://docs.arc.network" target="_blank" rel="noreferrer" className="relative group text-[15px] font-medium text-slate-500 dark:text-slate-400 hover:text-black dark:hover:text-white transition-all">
                    {t('Documentation')}
                    <div className="absolute bottom-[-2px] left-0 right-0 h-[2px] bg-brand scale-x-0 group-hover:scale-x-100 transition-all duration-300 rounded-full" />
                  </a></li>
                  <li><a href="https://www.arc.network/ecosystem" target="_blank" rel="noreferrer" className="relative group text-[15px] font-medium text-slate-500 dark:text-slate-400 hover:text-black dark:hover:text-white transition-all">
                    {t('Ecosystem')}
                    <div className="absolute bottom-[-2px] left-0 right-0 h-[2px] bg-brand scale-x-0 group-hover:scale-x-100 transition-all duration-300 rounded-full" />
                  </a></li>
                  <li><a href="https://community.arc.network/" target="_blank" rel="noreferrer" className="relative group text-[15px] font-medium text-slate-500 dark:text-slate-400 hover:text-black dark:hover:text-white transition-all">
                    {t('Community')}
                    <div className="absolute bottom-[-2px] left-0 right-0 h-[2px] bg-brand scale-x-0 group-hover:scale-x-100 transition-all duration-300 rounded-full" />
                  </a></li>
                </ul>
              </div>
              <div className="col-span-2 md:col-span-1">
                <h4 className="text-[10px] uppercase tracking-[0.3em] font-medium text-slate-400 mb-6">{t('Socials')}</h4>
                <ul className="space-y-4">
                  <li><a href="https://x.com/stac_defi" target="_blank" rel="noreferrer" className="relative group text-[15px] font-medium text-slate-500 dark:text-slate-400 hover:text-black dark:hover:text-white transition-all">
                    {t('Twitter')}
                    <div className="absolute bottom-[-2px] left-0 right-0 h-[2px] bg-brand scale-x-0 group-hover:scale-x-100 transition-all duration-300 rounded-full" />
                  </a></li>
                  <li><a href="#" className="relative group text-[15px] font-medium text-slate-500 dark:text-slate-400 hover:text-black dark:hover:text-white transition-all">
                    {t('Discord')}
                    <div className="absolute bottom-[-2px] left-0 right-0 h-[2px] bg-brand scale-x-0 group-hover:scale-x-100 transition-all duration-300 rounded-full" />
                  </a></li>
                  <li><a href="https://github.com/linux070/stac-defi" target="_blank" rel="noreferrer" className="relative group text-[15px] font-medium text-slate-500 dark:text-slate-400 hover:text-black dark:hover:text-white transition-all">
                    {t('GitHub')}
                    <div className="absolute bottom-[-2px] left-0 right-0 h-[2px] bg-brand scale-x-0 group-hover:scale-x-100 transition-all duration-300 rounded-full" />
                  </a></li>
                </ul>
              </div>
            </div>
          </div>

          <div className="mt-32 grid grid-cols-1 md:grid-cols-2 items-center gap-8">
            <div className="flex justify-center md:justify-start font-mono text-[12px] text-slate-600 dark:text-slate-400 tracking-[0.1em]">
              <span>© 2026 Stac. All Rights Reserved.</span>
            </div>

            <div className="flex flex-wrap items-center justify-center md:justify-end gap-x-10 gap-y-4">
              <a href="#" className="font-mono text-[12px] text-slate-500 hover:text-black dark:text-slate-400 dark:hover:text-white transition-colors tracking-wide whitespace-nowrap">
                <ScrambleText text="Terms & Conditions" />
              </a>
              <a href="#" className="font-mono text-[12px] text-slate-500 hover:text-black dark:text-slate-400 dark:hover:text-white transition-colors tracking-wide whitespace-nowrap">
                <ScrambleText text="Privacy Policy" />
              </a>
              <a href="#" className="font-mono text-[12px] text-slate-500 hover:text-black dark:text-slate-400 dark:hover:text-white transition-colors tracking-wide whitespace-nowrap">
                <ScrambleText text="Cookie Policy" />
              </a>
            </div>
          </div>
        </div>
      </footer>

      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            whileTap={{ scale: 0.9 }}
            onClick={scrollToTop}
            className="fixed bottom-8 right-8 z-[100] w-12 h-12 rounded-full bg-brand text-white shadow-[0_10px_30px_rgba(124,111,255,0.4)] flex items-center justify-center transition-transform duration-300"
            aria-label="Scroll to top"
          >
            <ArrowUp size={20} strokeWidth={3.5} />
          </motion.button>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default Home;