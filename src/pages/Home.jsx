// =============================================================================
// HOME PAGE (Landing Page)
// This is the first screen users see when they visit Stac.
// It introduces the protocol, displays live network statistics,
// lists supported tokens, explains how the app works, and ends with
// a footer full of links. No wallet connection is required to view this page.
// =============================================================================

import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Zap, ArrowRight, Code2, Layers, Droplets, ArrowRightLeft,
  ArrowUp, RefreshCw, ChevronDown
} from 'lucide-react';
import { motion, useMotionValue, useSpring, AnimatePresence, useReducedMotion } from 'framer-motion';
import { formatCurrency, formatNumber } from '../utils/blockchain';
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
// FAQ ACCORDION COMPONENT
// A clean, accessible accordion with GPU-only animations (transform + opacity).
// Each item expands to reveal its answer with a smooth height transition.
// =============================================================================
const faqData = [
  {
    question: 'How long does a bridge or swap take?',
    answer: "It's nearly instant. Most moves happen in less than a minute. You won't have to sit around refreshing your screen waiting for 'confirmations.'",
  },
  {
    question: 'What are the fees?',
    answer: "We keep it simple and cheap. Most transactions cost about one cent. Plus, you pay for fees in USDC, so you don't have to worry about the price of a random gas token jumping around.",
  },
  {
    question: 'Is my money safe during the move?',
    answer: 'Yes. We use professional-grade security (the same tech used by major financial institutions) to ensure your assets are protected every step of the way.',
  },
  {
    question: 'Do I need a special token to pay for gas?',
    answer: "Nope! That's the best part about Arc. You can use the USDC you already have to pay for your transaction fees. No need to go buy a separate 'gas token' just to move your money.",
  },
  {
    question: 'What happens if my transaction fails?',
    answer: "Because Arc has 'instant finality,' transactions either work immediately or they don't happen at all. Your money won't get 'stuck' in limbo between networks.",
  },
];

const FaqItem = ({ item, index, isOpen, onToggle, t, shouldReduceMotion }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ delay: index * 0.08, duration: 0.5, ease: [0.32, 0.72, 0, 1] }}
      className="border-b border-slate-200 dark:border-white/10"
    >
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between py-7 text-left group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 dark:focus-visible:ring-offset-page-dark rounded-lg"
        aria-expanded={isOpen}
      >
        <span className="text-lg sm:text-xl font-medium text-slate-900 dark:text-white pr-8 leading-snug tracking-tight">
          {t(item.question)}
        </span>
        <span
          className="flex-shrink-0 w-10 h-10 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center transition-colors duration-200 group-hover:bg-slate-200 dark:group-hover:bg-white/10"
        >
          <ChevronDown
            size={20}
            strokeWidth={2}
            className={`text-slate-500 dark:text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : 'rotate-0'}`}
            style={{ willChange: 'transform' }}
          />
        </span>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{
              height: { duration: shouldReduceMotion ? 0 : 0.3, ease: [0.32, 0.72, 0, 1] },
              opacity: { duration: shouldReduceMotion ? 0 : 0.2 },
            }}
            className="overflow-hidden"
          >
            <p className="pb-8 text-base sm:text-lg text-slate-600 dark:text-slate-400 leading-relaxed max-w-3xl font-normal">
              {t(item.answer)}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const FaqAccordion = ({ t, shouldReduceMotion }) => {
  const [openIndex, setOpenIndex] = useState(null);

  const handleToggle = (index) => {
    setOpenIndex((prev) => (prev === index ? null : index));
  };

  return (
    <div className="w-full">
      {faqData.map((item, index) => (
        <FaqItem
          key={index}
          item={item}
          index={index}
          isOpen={openIndex === index}
          onToggle={() => handleToggle(index)}
          t={t}
          shouldReduceMotion={shouldReduceMotion}
        />
      ))}
    </div>
  );
};




// =============================================================================
// HOME COMPONENT
// =============================================================================
const Home = ({ setActiveTab }) => {
  const { t } = useTranslation();
  const { darkMode } = useTheme();

  // ─── Stats object ──────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    return {
      tvl: { value: 0, change: 0, trend: 'up' },
      users: { value: 0, change: 0, trend: 'stable' },
      transactions: { value: 0, change: 0, trend: 'stable' },
    };
  }, []);

  // ─── Interactive Feature State ──────────────────────────────────────────
  // Used in the "Why Arc Network" tabbed feature showcase.
  const [activeFeature, setActiveFeature] = useState(0);

  // Navigate to the Swap page when "Get Started" is clicked
  const handleGetStarted = () => setActiveTab('swap');

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
      className="min-h-screen bg-white dark:bg-transparent"
    >
      <section className="relative pt-32 pb-16 lg:pt-0 lg:pb-0 lg:min-h-[100dvh] overflow-hidden flex flex-col items-center justify-center bg-white dark:bg-transparent">

        <div className="relative z-10 text-center max-w-6xl mx-auto px-6 pt-4 pb-10 lg:py-20 lg:flex lg:flex-col lg:items-center lg:justify-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.99 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="relative inline-block px-2 py-8 sm:px-24 sm:py-16 lg:px-32"
          >

            <h1 className="text-[32px] sm:text-6xl md:text-[60px] lg:text-[75px] xl:text-[85px] font-normal tracking-tighter text-[#0f172a] dark:text-white leading-[1.15] sm:leading-[0.82] mb-0 md:whitespace-nowrap">
              {t('Swap, Bridge, ')} <span className="text-[#1E293B] dark:text-blue-200">{t('with App Kit.')}</span>
            </h1>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.15, ease: 'easeOut', delay: 0.05 }}
            className="text-lg sm:text-xl md:text-2xl text-slate-600 dark:text-slate-400 mt-6 mb-12 max-w-3xl mx-auto leading-relaxed font-normal"
          >
            {t('Experience direct on-chain interactions, seamless swapping, and cross-chain bridging, all powered by the Arc App Kit.')}
          </motion.p>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16 w-full px-6 sm:px-0"
          >
            <button
              onClick={handleGetStarted}
              className="w-full sm:w-52 h-14 bg-brand text-white rounded-xl font-medium hover:bg-brand-hover active:scale-[0.98] transition-all duration-200 flex items-center justify-center text-base sm:text-lg shadow-sm"
            >
              {t('Get Started')}
            </button>

            <a
              href="https://www.arc.network/"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-52 h-14 bg-slate-100 dark:bg-slate-800/50 text-slate-900 dark:text-white rounded-xl font-medium hover:bg-slate-200 dark:hover:bg-slate-800 active:scale-[0.98] transition-all duration-200 flex items-center justify-center text-base sm:text-lg"
            >
              {t('Learn More')}
            </a>
          </motion.div>

        </div>
      </section>

      {/* ==================================================================
          HOW STAC WORKS
          Clean editorial card grid with soft UI styling.
      ================================================================== */}
      <section className="py-16 sm:py-24 px-6 md:px-12 bg-slate-50/50 dark:bg-surface-dark/50 border-y border-slate-200/50 dark:border-white/5">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between mb-16 gap-8">
            <div className="max-w-2xl">
              <h2 className="text-5xl md:text-7xl font-bold text-[#0f172a] dark:text-white mb-8 tracking-tighter leading-[1.1] font-['Satoshi','Inter',sans-serif]">
                {t('How ')} <span className="text-brand">{t('Stac')}</span> {t('Works.')}
              </h2>
              <p className="text-xl text-slate-500 dark:text-secondary font-medium leading-relaxed max-w-xl">
                {t('Getting started is simple, fast, and secure. Everything you need to manage your assets on Stac in three simple steps.')}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-0 border border-slate-200/60 dark:border-white/10 rounded-[3rem] overflow-hidden bg-white dark:bg-black/20 shadow-sm">
            {[
              {
                id: '01',
                title: t('Swap Assets'),
                desc: t('Trade faster, Pay less. Experience instant swaps and ultra-low costs on Arc.'),
                icon: RefreshCw,
              },
              {
                id: '02',
                title: t('Bridge Assets'),
                desc: t('Move your assets across networks in seconds. Experience total freedom with top-tier protection and total peace of mind.'),
                icon: ArrowRightLeft,
              },
              {
                id: '03',
                title: t('Provide Liquidity'),
                desc: t('Earn protocol fees by providing liquidity to the network. Secure, transparent, and built for institutional scale.'),
                icon: Droplets,
              },
            ].map((step, i) => (
              <div key={i} className={`p-10 md:p-14 flex flex-col items-start transition-colors duration-500 hover:bg-slate-50 dark:hover:bg-white/5 ${i < 2 ? 'border-b md:border-b-0 md:border-r border-slate-200 dark:border-white/10' : ''}`}>
                <span className="text-6xl font-mono font-black text-brand/30 dark:text-brand/15 mb-10 translate-x-[-4px]">{step.id}</span>
                <h3 className="text-3xl font-bold text-[#0f172a] dark:text-white mb-6 tracking-tighter font-['Satoshi','Inter',sans-serif]">{step.title}</h3>
                <p className="text-slate-500 dark:text-secondary leading-relaxed font-medium text-lg max-w-[90%]">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ==================================================================
          NETWORK STATISTICS
          Compact statistics with high-fidelity counters.
          COMMENTED OUT UNTIL INDEXER SYNC COMPLETE
      ================================================================== */}
      {/* 
      <section className="py-16 sm:py-20 px-6 md:px-12 max-w-7xl mx-auto dark:bg-page-dark overflow-hidden">
        <div className="relative group w-full">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-y-16 md:gap-y-0 relative z-10 w-full items-center">
            {statCards.map((stat, index) => (
              <motion.div
                key={stat.id}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ delay: index * 0.1, duration: 0.6, ease: [0.32, 0.72, 0, 1] }}
                className="flex flex-col items-center text-center px-4"
              >
                <div className="relative mb-2 flex flex-col items-center justify-center">
                  <div className="text-6xl sm:text-7xl lg:text-[100px] font-bold tracking-tighter text-brand tabular-nums mb-0 leading-none select-none">
                    <AnimatedNumber value={stat.rawValue} formatFn={stat.formatFn} />
                  </div>
                </div>

                <div className="mt-6">
                  <span className="text-[12px] sm:text-[13px] font-black text-slate-400 dark:text-secondary/50 uppercase tracking-[0.2em] font-mono leading-none">
                    {stat.label}
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
      */}




      {/* ==================================================================
          WHY BUILD ON ARC
          Relay-style tabbed feature showcase with subtle grey background.
      ================================================================== */}
      <section className="py-20 sm:py-32 lg:py-40 px-6 md:px-12 bg-white dark:bg-transparent relative overflow-hidden">
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-8 sm:mb-12 lg:mb-16">
            <h2 className="text-[clamp(2.25rem,7vw,5.5rem)] font-bold tracking-tighter text-[#0f172a] dark:text-white leading-[1.2] mb-0 font-['Satoshi','Inter',sans-serif]">
              {t('Why Build on ')} <span className="text-brand">{t('Arc.')}</span>
            </h2>
          </div>

          {/* Pill Tabs */}
          <div className="flex flex-wrap lg:flex-nowrap items-center justify-center gap-3 sm:gap-4 mb-6 sm:mb-10 lg:mb-14 py-4 px-4 md:px-0">
            <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 mx-auto">
              {[
                { label: t('Lightning Fast') },
                { label: t('Security') },
                { label: t('Zero Friction') },
                { label: t('Developer Friendly') },
              ].map((tab, i) => (
                <button
                  key={i}
                  onClick={() => setActiveFeature(i)}
                  className={`flex items-center gap-2 sm:gap-3 px-4 sm:px-8 md:px-10 py-2.5 sm:py-3.5 md:py-4 rounded-full text-[11px] sm:text-sm md:text-lg font-medium transition-all duration-300 border ${activeFeature === i
                    ? 'bg-[#0f172a] dark:bg-white text-white dark:text-[#0f172a] border-[#0f172a] dark:border-white shadow-xl shadow-slate-200 dark:shadow-none translate-y-[-2px]'
                    : 'bg-slate-50/80 dark:bg-white/5 text-slate-500 dark:text-slate-400 border-slate-200/60 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/20'
                    }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 sm:gap-16 lg:gap-20 items-center">
            {/* Left: Icon Visual */}
            <div className="relative flex items-center justify-center min-h-[300px] sm:min-h-[350px] md:min-h-[450px] bg-slate-50/50 dark:bg-surface-dark rounded-[2rem] sm:rounded-[2.5rem] lg:rounded-[3rem] border border-slate-200/60 dark:border-white/5 overflow-hidden shadow-inner">

              <AnimatePresence mode="wait">
                <motion.div
                  key={activeFeature}
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: shouldReduceMotion ? 0 : 0.3, ease: [0.32, 0.72, 0, 1] }}
                  className="relative z-10 w-full h-full flex flex-col items-center justify-center p-8 md:p-12"
                >
                  {activeFeature === 0 && (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-12">
                      <div className="relative">
                        <motion.div
                          className="absolute inset-0 bg-brand/20 rounded-full blur-3xl"
                          animate={{ scale: [1, 1.8, 1], opacity: [0.2, 0.5, 0.2] }}
                          transition={{ duration: 3, repeat: Infinity }}
                        />
                        {/* Lo-Fi Beat Waveform */}
                        <div className="flex items-end gap-2 h-24 relative z-10">
                          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16].map((_, idx) => (
                            <motion.div
                              key={idx}
                              className="w-1.5 md:w-2 bg-brand rounded-full"
                              animate={{ height: [12, 64, 12] }}
                              transition={{
                                duration: 0.6 + (idx * 0.05),
                                repeat: Infinity,
                                delay: idx * 0.08,
                                ease: "easeInOut"
                              }}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                  {activeFeature === 1 && (
                    <div className="flex flex-col items-center gap-8">
                      <div className="relative flex items-center justify-center">
                        {/* Outer Glow */}
                        <motion.div 
                          className="absolute w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl"
                          animate={{ scale: [1, 1.4, 1], opacity: [0.2, 0.5, 0.2] }}
                          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                        />
                        
                        {/* Rotating Orbit */}
                        <motion.div 
                          className="absolute w-32 h-32 border border-emerald-500/20 rounded-full"
                          animate={{ rotate: 360 }}
                          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                        >
                          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-2 bg-emerald-500 rounded-full shadow-[0_0_10px_#10b981]" />
                        </motion.div>

                        <div className="w-28 h-28 rounded-full bg-white dark:bg-white/5 flex items-center justify-center border border-emerald-500/20 relative z-10 shadow-2xl overflow-hidden">
                          {/* Scanning Line */}
                          <motion.div 
                            className="absolute left-0 right-0 h-[1px] bg-emerald-500/40 z-20"
                            animate={{ top: ['0%', '100%', '0%'] }}
                            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                          />
                          
                          <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-500 relative z-10">
                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                            <motion.path 
                              d="m9 12 2 2 4-4" 
                              initial={{ pathLength: 0 }}
                              animate={{ pathLength: 1 }}
                              transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 1 }}
                            />
                          </svg>
                        </div>
                      </div>
                      <div className="flex flex-col items-center text-center">
                        <span className="text-xl font-bold text-slate-900 dark:text-white mb-2">{t('Protocol Security')}</span>
                        <span className="text-sm text-slate-500 dark:text-slate-400 font-medium">{t('Institutional-grade protocol protection')}</span>
                      </div>
                    </div>
                  )}
                  {activeFeature === 2 && (
                    <div className="flex flex-col items-center gap-8">
                      <motion.div
                        className="relative"
                        animate={{ y: [0, -10, 0] }}
                        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                      >
                        <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-3xl scale-150" />
                        <div className="w-32 h-32 rounded-full bg-white dark:bg-white/10 p-4 border border-slate-200 dark:border-white/10 flex items-center justify-center relative z-10 shadow-2xl">
                          <img src="/icons/usdc.png" alt="USDC" className="w-full h-full object-contain" />
                        </div>
                      </motion.div>
                      <div className="flex flex-col items-center text-center">
                        <span className="text-xl font-bold text-slate-900 dark:text-white mb-2">{t('Frictionless Gas')}</span>
                        <span className="text-sm text-slate-500 dark:text-slate-400 font-medium">{t('Powered by native USDC gas abstraction')}</span>
                      </div>
                    </div>
                  )}
                  {activeFeature === 3 && (
                    <div className="w-full h-full flex flex-col pt-4">
                      {/* Header Window Controls */}
                      <div className="flex items-center gap-1.5 mb-10">
                        <div className="w-2 h-2 rounded-full bg-slate-300 dark:bg-white/20" />
                        <div className="w-2 h-2 rounded-full bg-slate-300 dark:bg-white/20" />
                        <div className="w-2 h-2 rounded-full bg-slate-300 dark:bg-white/20" />
                      </div>

                      {/* Full Console Status Log */}
                      <div className="space-y-6 flex-grow">
                        {[
                          { label: "ARC_PROTO_INIT", status: "DONE", color: "text-brand", bgColor: "bg-brand/5" },
                          { label: "RPC_CONSENSUS_SYNC", status: "SYNCED", color: "text-emerald-500", bgColor: "bg-emerald-500/5" },
                          { label: "TX_GAS_ESTIMATOR_RELAY", status: "READY", color: "text-brand", bgColor: "bg-brand/5" },
                          { label: "SECURITY_VALIDATOR_ACTIVE", status: "OK", color: "text-emerald-500", bgColor: "bg-emerald-500/5" },
                          { label: "DAPP_INSTANCE_DEPLOY", status: "WAITING", color: "text-slate-400", bgColor: "bg-slate-400/5" },
                        ].map((item, i) => (
                          <div key={i} className="flex items-center justify-between font-mono text-xs md:text-sm">
                            <div className="flex items-center gap-4">
                              <span className="text-slate-300 dark:text-white/10 select-none">{">"}</span>
                              <span className="text-slate-500 dark:text-slate-400 tracking-tight">{item.label}</span>
                            </div>
                            <span className={`px-3 py-1 rounded-md border border-current/10 ${item.color} ${item.bgColor} font-bold text-[10px] tracking-widest uppercase`}>
                              {item.status}
                            </span>
                          </div>
                        ))}
                      </div>

                      {/* Live Footer Status */}
                      <motion.div
                        className="flex items-center gap-3 mt-auto pt-8 text-brand font-mono text-xs border-t border-slate-200 dark:border-white/5"
                        animate={{ opacity: [1, 0.4, 1] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      >
                        <span className="w-2 h-4 bg-brand" />
                        <span className="tracking-widest uppercase">{t('RUNNING_SUITE_V2.0...')}</span>
                      </motion.div>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Right: Description */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeFeature}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: shouldReduceMotion ? 0 : 0.25, ease: [0.32, 0.72, 0, 1] }}
                className="flex flex-col items-start"
              >
                {activeFeature === 0 && (
                  <>
                    <h3 className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#0f172a] dark:text-white mb-4 sm:mb-6 tracking-tighter leading-tight font-['Satoshi','Inter',sans-serif]">
                      {t('Sub-second finality. Every transaction.')}
                    </h3>
                    <p className="text-base sm:text-lg text-slate-500 dark:text-slate-400 leading-relaxed font-normal max-w-lg">
                      {t('Arc\'s proprietary consensus mechanism delivers instant settlement optimized for high-frequency, real-time execution. No waiting, no uncertainty.')}
                    </p>
                  </>
                )}
                {activeFeature === 1 && (
                  <>
                    <h3 className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#0f172a] dark:text-white mb-4 sm:mb-6 tracking-tighter leading-tight font-['Satoshi','Inter',sans-serif]">
                      {t('Institutional-grade security.')}
                    </h3>
                    <p className="text-base sm:text-lg text-slate-500 dark:text-slate-400 leading-relaxed font-normal max-w-lg">
                      {t('Multi-tiered validation ensures zero-trust protocol integrity for every execution. The same security standards used by major financial institutions.')}
                    </p>
                  </>
                )}
                {activeFeature === 2 && (
                  <>
                    <h3 className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#0f172a] dark:text-white mb-4 sm:mb-6 tracking-tighter leading-tight font-['Satoshi','Inter',sans-serif]">
                      {t('One token. Zero friction.')}
                    </h3>
                    <p className="text-base sm:text-lg text-slate-500 dark:text-slate-400 leading-relaxed font-normal max-w-lg">
                      {t('Pay gas in any asset with native support for USDC. No need to acquire a separate gas token just to transact.')}
                    </p>
                  </>
                )}
                {activeFeature === 3 && (
                  <>
                    <h3 className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#0f172a] dark:text-white mb-4 sm:mb-6 tracking-tighter leading-tight font-['Satoshi','Inter',sans-serif]">
                      {t('Ship faster. Build better.')}
                    </h3>
                    <p className="text-base sm:text-lg text-slate-500 dark:text-slate-400 leading-relaxed font-normal max-w-lg">
                      {t('Build institutional-grade DeFi applications with a high-performance SDK and comprehensive testing environment. From prototype to production in days.')}
                    </p>
                  </>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </section>


      {/* ==================================================================
          FAQ SECTION
          Clean accordion-style FAQ matching the editorial design language.
      ================================================================== */}
      <section className="py-24 px-6 md:px-12 bg-slate-50/50 dark:bg-surface-dark/50 border-y border-slate-200/50 dark:border-white/5">
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between mb-12 gap-8">
            <div className="max-w-2xl">
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-5xl md:text-7xl font-bold text-[#0f172a] dark:text-white mb-4 tracking-tighter leading-[1.2] font-['Satoshi','Inter',sans-serif]"
              >
                {t('Frequently Asked ')} <span className="text-brand">{t('Questions.')}</span>
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="text-lg text-slate-500 dark:text-secondary font-medium leading-relaxed max-w-xl"
              >
                {t('Everything you need to know about using Stac.')}
              </motion.p>
            </div>
          </div>

          <FaqAccordion t={t} shouldReduceMotion={shouldReduceMotion} />
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