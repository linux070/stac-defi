
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { TrendingUp, Wallet, Network, Activity, ShieldCheck, Zap, ArrowRight, Code2, Layers, Droplets, ArrowRightLeft, ArrowUp, RefreshCw } from 'lucide-react';
import { motion, useMotionValue, useSpring, AnimatePresence, useReducedMotion } from 'framer-motion';
import { formatCurrency, formatNumber } from '../utils/blockchain';
import { useDappTransactionCount } from '../hooks/useDappTransactionCount';
import { useDappBridgeCount } from '../hooks/useDappBridgeCount';
import { useActiveUsers } from '../hooks/useActiveUsers';
import { useNetworkUptime } from '../hooks/useNetworkUptime';
import { useTotalVolume } from '../hooks/useTotalVolume';
import { useTotalValueProcessed } from '../hooks/useTotalValueProcessed';

import { useTransactionHistory } from '../hooks/useTransactionHistory';
import LanguageSelector from '../components/LanguageSelector';
import { useTheme } from '../hooks/useTheme';

const Home = ({ setActiveTab }) => {
  const { t } = useTranslation();
  const { darkMode } = useTheme();
  const { fetchGlobalStats } = useTransactionHistory();
  const { transactionCount, change, trend } = useDappTransactionCount();
  const { bridgeCount, change: bridgeChange, trend: bridgeTrend } = useDappBridgeCount();
  const { activeUsers, change: usersChange, trend: usersTrend } = useActiveUsers();
  const { uptime, change: uptimeChange, trend: uptimeTrend } = useNetworkUptime();
  const { totalVolume, loading: volumeLoading } = useTotalVolume();
  const { totalValue, loading: tvpLoading } = useTotalValueProcessed();

  // Initial fetch for global stats
  useEffect(() => {
    fetchGlobalStats();
    // Poll for global updates every minute
    const interval = setInterval(fetchGlobalStats, 60000);
    return () => clearInterval(interval);
  }, [fetchGlobalStats]);

  const [stats, setStats] = useState({
    volume: { value: totalVolume || 0, change: 0, trend: 'up' },
    tvl: { value: totalValue || 0, change: 0, trend: 'up' },
    users: { value: activeUsers || 0, change: usersChange || 0, trend: usersTrend || 'stable' },
    transactions: { value: transactionCount || 0, change: change || 0, trend: trend || 'stable' },
    crossChain: { value: bridgeCount || 0, change: bridgeChange || 0, trend: bridgeTrend || 'stable' },
    uptime: { value: uptime || 0, change: uptimeChange || 0, trend: uptimeTrend || 'stable' },
  });

  // Gatekeeping function to enter the app
  const handleGetStarted = () => {
    setActiveTab('swap');
  };

  // Update transaction count, change, and trend when real data is available
  useEffect(() => {
    if (transactionCount !== null) {
      setStats(prevStats => ({
        ...prevStats,
        transactions: {
          ...prevStats.transactions,
          value: transactionCount,
          change: change !== null ? change : prevStats.transactions.change,
          trend: trend !== 'stable' ? trend : prevStats.transactions.trend,
        },
      }));
    }
  }, [transactionCount, change, trend]);

  // Update bridge count, change, and trend when real data is available
  useEffect(() => {
    if (bridgeCount !== null) {
      setStats(prevStats => ({
        ...prevStats,
        crossChain: {
          ...prevStats.crossChain,
          value: bridgeCount,
          change: bridgeChange !== null ? bridgeChange : prevStats.crossChain.change,
          trend: bridgeTrend !== 'stable' ? bridgeTrend : prevStats.crossChain.trend,
        },
      }));
    }
  }, [bridgeCount, bridgeChange, bridgeTrend]);

  // Update active users count, change, and trend when real data is available
  useEffect(() => {
    if (activeUsers !== null) {
      setStats(prevStats => ({
        ...prevStats,
        users: {
          ...prevStats.users,
          value: activeUsers,
          change: usersChange !== null ? usersChange : prevStats.users.change,
          trend: usersTrend !== 'stable' ? usersTrend : prevStats.users.trend,
        },
      }));
    }
  }, [activeUsers, usersChange, usersTrend]);

  // Update network uptime, change, and trend when real data is available
  useEffect(() => {
    if (uptime !== null) {
      setStats(prevStats => ({
        ...prevStats,
        uptime: {
          ...prevStats.uptime,
          value: uptime,
          change: uptimeChange !== null ? uptimeChange : prevStats.uptime.change,
          trend: uptimeTrend !== 'stable' ? uptimeTrend : prevStats.uptime.trend,
        },
      }));
    }
  }, [uptime, uptimeChange, uptimeTrend]);

  // Update total volume when real data is available
  useEffect(() => {
    if (totalVolume !== null && !volumeLoading) {
      setStats(prevStats => ({
        ...prevStats,
        volume: {
          ...prevStats.volume,
          value: totalVolume,
        },
      }));
    }
  }, [totalVolume, volumeLoading]);

  const [showScrollTop, setShowScrollTop] = useState(false);
  const shouldReduceMotion = useReducedMotion();

  // Scroll to top visibility logic
  useEffect(() => {
    const handleScroll = () => {
      // Show button after scrolling down 400px
      if (window.scrollY > 400) {
        setShowScrollTop(true);
      } else {
        setShowScrollTop(false);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: shouldReduceMotion ? 'auto' : 'smooth'
    });
  };

  // Update total value processed when real data is available
  useEffect(() => {
    if (totalValue !== null && !tvpLoading) {
      setStats(prevStats => ({
        ...prevStats,
        tvl: {
          ...prevStats.tvl,
          value: totalValue,
        },
      }));
    }
  }, [totalValue, tvpLoading]);

  // Animated Number Component with Pulse effect
  const AnimatedNumber = ({ value, formatFn }) => {
    const motionValue = useMotionValue(value);
    const springValue = useSpring(motionValue, {
      damping: 25,
      stiffness: 60,
      restDelta: 0.001
    });
    const [display, setDisplay] = useState(formatFn(value));
    const [isPulsing, setIsPulsing] = useState(false);

    useEffect(() => {
      motionValue.set(value);
      setIsPulsing(true);
      const timer = setTimeout(() => setIsPulsing(false), 800);
      return () => clearTimeout(timer);
    }, [value, motionValue]);

    useEffect(() => {
      return springValue.on("change", (latest) => {
        setDisplay(formatFn(latest));
      });
    }, [springValue, formatFn]);

    return (
      <motion.span
        animate={isPulsing ? {
          scale: [1, 1.05, 1],
          filter: ["brightness(1)", "brightness(1.5)", "brightness(1)"],
        } : {}}
        transition={{ duration: 0.4 }}
      >
        {display}
      </motion.span>
    );
  };

  // The simulation useEffect has been removed to ensure all data is pulled exclusively from the dApp hooks.

  const statCards = [
    {
      id: 'tvl',
      label: t('Total Volume'),
      rawValue: stats.tvl.value,
      formatFn: (val) => formatCurrency(val, 0),
      lucideIcon: TrendingUp,
      iconColor: 'primary',
      suffix: 'USD'
    },
    {
      id: 'volume',
      label: t('Swap Volume'),
      rawValue: stats.volume.value,
      formatFn: (val) => formatCurrency(val, 0),
      lucideIcon: RefreshCw,
      iconColor: 'indigo',
      suffix: 'USD'
    },
    {
      id: 'bridge',
      label: t('Bridge Stats'),
      rawValue: stats.crossChain.value,
      formatFn: (val) => formatNumber(Math.floor(val)),
      lucideIcon: Network,
      iconColor: 'purple',
      suffix: t('Transfers')
    },
    {
      id: 'users',
      label: t('Active Users'),
      rawValue: stats.users.value,
      formatFn: (val) => formatNumber(Math.floor(val)),
      lucideIcon: Wallet,
      iconColor: 'orange',
      suffix: t('Wallets')
    },
    {
      id: 'transactions',
      label: t('Transactions'),
      rawValue: stats.transactions.value,
      formatFn: (val) => formatNumber(Math.floor(val)),
      lucideIcon: Activity,
      iconColor: 'pink',
      suffix: t('Total')
    },
    {
      id: 'uptime',
      label: t('Network Uptime'),
      rawValue: stats.uptime.value,
      formatFn: (val) => `${Math.round(val)}%`,
      lucideIcon: ShieldCheck,
      iconColor: 'green',
      suffix: t('Uptime')
    },
  ];

  const getIconColor = () => {
    return 'text-slate-900 dark:text-white opacity-80';
  };

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      {/* Hero Section */}
      <section className="relative pt-32 pb-16 overflow-hidden flex flex-col items-center justify-center bg-white dark:bg-black dark:border-b dark:border-white/5 hero-blueprint-grid">
        {/* Dark Mode Background Blobs (Exactly Matched with Swap Page / BackgroundGradient.jsx) */}
        <div className="hidden dark:block absolute inset-0 overflow-hidden pointer-events-none">
          {/* Primary Glow */}
          <div className="absolute top-[-15%] left-[-10%] w-[700px] h-[700px] bg-white rounded-full mix-blend-plus-lighter filter blur-[120px] opacity-70 animate-blob" style={{ willChange: 'transform' }}></div>

          {/* Secondary Blobs */}
          <div className="absolute top-[5%] left-[5%] w-[500px] h-[500px] bg-slate-800/30 rounded-full mix-blend-plus-lighter filter blur-[100px] opacity-20 animate-blob animation-delay-3000" style={{ willChange: 'transform' }}></div>
          <div className="absolute top-[-10%] right-[10%] w-[600px] h-[600px] bg-slate-800/20 rounded-full mix-blend-plus-lighter filter blur-[120px] opacity-20 animate-blob" style={{ willChange: 'transform' }}></div>
          <div className="absolute bottom-[-15%] right-[-10%] w-[800px] h-[800px] bg-slate-900/40 rounded-full mix-blend-plus-lighter filter blur-[130px] opacity-20 animate-blob animation-delay-2000" style={{ willChange: 'transform' }}></div>
          <div className="absolute bottom-[15%] right-[5%] w-[600px] h-[600px] bg-slate-800/25 rounded-full mix-blend-plus-lighter filter blur-[110px] opacity-20 animate-blob animation-delay-5000" style={{ willChange: 'transform' }}></div>

          {/* Center Ambient Glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-white filter blur-[150px] opacity-30 pointer-events-none"></div>

          {/* Grain Texture Overlay */}
          <div className="absolute inset-0 opacity-[0.06] pointer-events-none" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}></div>
        </div>
        {/* Blueprint Decorative Elements Removed */}

        <div className="relative z-10 text-center max-w-6xl mx-auto px-6 pt-4 pb-10">
          {/* Main Title with HUD Brackets */}
          <div className="relative inline-block px-4 py-8 sm:px-24 sm:py-16 lg:px-32">
            <div className="absolute top-0 left-0 w-4 h-4 sm:w-8 sm:h-8 border-t-[2px] border-l-[2px] border-slate-400 dark:border-white/30"></div>
            <div className="absolute top-0 right-0 w-4 h-4 sm:w-8 sm:h-8 border-t-[2px] border-r-[2px] border-slate-400 dark:border-white/30"></div>
            <div className="absolute bottom-0 left-0 w-4 h-4 sm:w-8 sm:h-8 border-b-[2px] border-l-[2px] border-slate-400 dark:border-white/30"></div>
            <div className="absolute bottom-0 right-0 w-4 h-4 sm:w-8 sm:h-8 border-b-[2px] border-r-[2px] border-slate-400 dark:border-white/30"></div>

            <motion.h1
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-4xl sm:text-6xl md:text-[60px] lg:text-[75px] xl:text-[85px] font-bold tracking-tighter text-[#0f172a] dark:text-white leading-[1.1] sm:leading-[0.82] mb-0 md:whitespace-nowrap"
            >
              {t('Home of DeFi on')} <span className="text-black dark:text-white dark:text-white">{t('Arc')}</span>
            </motion.h1>
          </div>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg md:text-xl text-slate-500 dark:text-slate-400 mt-6 mb-8 max-w-2xl mx-auto leading-relaxed"
          >
            {t('Swap tokens, bridge assets, and provide liquidity with')} <span className="text-black dark:text-white font-semibold">{t('zero friction')}</span>. {t('Built on')} <span className="text-black dark:text-white dark:text-white font-medium">{t('Arc\'s')}</span> {t('enterprise-grade infrastructure.')}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-5 mb-12"
          >
            <button
              onClick={handleGetStarted}
              className="w-full sm:w-52 h-16 bg-black dark:bg-white text-white dark:text-black rounded-2xl font-bold hover:bg-black dark:bg-white active:scale-[0.97] transition-all duration-300 flex items-center justify-center space-x-2 text-lg group"
            >
              <span>{t('Get Started')}</span>
              <ArrowRight size={22} strokeWidth={2.5} className="group-hover:translate-x-1 transition-transform" />
            </button>
            <a
              href="https://www.arc.network/"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-52 h-16 bg-white dark:bg-black text-[#0f172a] dark:text-white border-2 border-slate-200 dark:border-white/10 rounded-2xl font-bold hover:bg-slate-50 dark:hover:bg-white/5 active:scale-[0.98] transition-all duration-300 flex items-center justify-center text-lg"
            >
              {t('Learn More')}
            </a>
          </motion.div>

          {/* Bottom Labels with Underlines */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="flex flex-wrap items-center justify-center gap-x-8 gap-y-8 sm:gap-x-16 sm:gap-y-12"
          >
            {[
              { label: t('Sub-second Finality') },
              { label: t('USDC Gas Fees') },
              { label: t('Best Execution') }
            ].map((feature, i) => (
              <div key={i} className="flex flex-col items-center">
                <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 dark:text-white uppercase tracking-[0.2em] sm:tracking-[0.3em]">
                  {feature.label}
                </span>
                <div className="w-8 sm:w-10 h-0.5 bg-black dark:bg-white mt-3 sm:mt-4 rounded-full"></div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Network Statistics */}
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
              <div className={`mb-4 ${getIconColor()}`}>
                <stat.lucideIcon size={24} strokeWidth={2} />
              </div>
              <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-3">{stat.label}</p>
              <div className="flex flex-col items-center">
                <h3 className="text-4xl md:text-5xl font-bold text-[#0f172a] dark:text-white mb-1 tabular-nums">
                  <AnimatedNumber value={stat.rawValue} formatFn={stat.formatFn} />
                </h3>
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-600 uppercase tracking-widest">{stat.suffix}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Supported Assets */}
      <section className="py-24 bg-slate-50/50 dark:bg-[#020617]/50 border-y border-slate-100 dark:border-white/5">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-[#0f172a] dark:text-white mb-6 tracking-tight">{t('Supported Assets')}</h2>
          <p className="text-slate-500 dark:text-slate-400 max-w-2xl mx-auto mb-16 leading-relaxed">
            {t('Seamlessly interact with the world\'s most trusted digital assets, and Stac\'s own tokens on Arc network.')}
          </p>

          <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-12 sm:gap-x-16 lg:gap-x-20">
            {[
              { name: t('USDC'), icon: '/icons/usdc.png', symbol: 'USDC' },
              { name: t('EURC'), icon: '/icons/eurc.png', symbol: 'EURC' },
              { name: t('Stac Token'), icon: '/icons/stc.png', symbol: 'STC' },
              { name: t('MTB Token'), icon: '/icons/mtb.png', symbol: 'MTB' },
              { name: t('Ball Token'), icon: '/icons/ball.png', symbol: 'BALL' },
              { name: t('ECR Token'), icon: '/icons/ecr.png', symbol: 'ECR' }
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

      {/* How it Works */}
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
              iconColor: 'text-black dark:text-white'
            },
            {
              title: t('Bridge Tokens'),
              desc: t('Seamlessly move your assets across multiple chains with institutional-grade security and minimal friction.'),
              icon: ArrowRightLeft,
              bg: 'bg-slate-50 dark:bg-black dark:bg-[#131720]',
              iconColor: 'text-black dark:text-white'
            },
            {
              title: t('Provide Liquidity'),
              desc: t('Earn protocol fees'),
              icon: Droplets,
              bg: 'bg-slate-50 dark:bg-black dark:bg-[#131720]',
              iconColor: 'text-black dark:text-white'
            }
          ].map((step, i) => (
            <div key={i} className="flex flex-col items-start p-8 rounded-3xl bg-slate-50 dark:bg-[#020617] border border-slate-100 dark:border-white/5 transition-all duration-300 hover:border-black dark:hover:border-white">
              <div className={`w-12 h-12 flex items-center justify-center rounded-xl ${step.bg} mb-8`}>
                <step.icon size={20} className={step.iconColor} />
              </div>
              <h3 className="text-xl font-bold text-[#0f172a] dark:text-white mb-4">{step.title}</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                {step.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Why Choose Arc */}
      <section className="py-24 px-6 md:px-12 max-w-7xl mx-auto">
        <div className="text-center mb-20">
          <h2 className="text-4xl md:text-5xl font-bold text-[#0f172a] dark:text-white mb-8 tracking-tight">{t('Why Choose Arc')}</h2>
          <p className="text-slate-500 dark:text-slate-400 max-w-3xl mx-auto leading-relaxed text-lg font-medium">
            {t('Arc description')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {[
            {
              title: t('Lightning Fast'),
              desc: t('Experience sub-second finality on every transaction. Our proprietary consensus mechanism ensures your trades are executed at the speed of thought.'),
              icon: Zap,
              iconColor: 'text-black dark:text-white'
            },
            {
              title: t('Institutional Security'),
              desc: t('Benefit from multi-layered security protocols and battle-tested smart contracts audited by the world\'s leading firms.'),
              icon: ShieldCheck,
              iconColor: 'text-black dark:text-white'
            },
            {
              title: t('Zero Friction'),
              desc: t('Removal of DeFi complexity. Pay gas fees in USDC, enjoy automated portfolio management, and bridge assets seamlessly.'),
              icon: Layers,
              iconColor: 'text-black dark:text-white'
            },
            {
              title: t('Developer Friendly'),
              desc: t('Build on Arc with ease using our comprehensive SDKs, robust documentation, and modular API architecture.'),
              icon: Code2,
              iconColor: 'text-black dark:text-white'
            }
          ].map((feature, i) => (
            <div key={i} className="flex flex-col items-start p-10 rounded-3xl bg-slate-50 dark:bg-[#131720] border border-slate-100 dark:border-white/5 transition-all duration-300 hover:border-black dark:hover:border-white group">
              <div className="mb-6">
                <feature.icon size={20} className={feature.iconColor} />
              </div>
              <h3 className="text-2xl font-bold text-[#0f172a] dark:text-white mb-4 tracking-tight">{feature.title}</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                {feature.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Institutional Footer - Integrated for unified page reload */}
      <footer className="bg-white dark:bg-black border-t border-slate-200 dark:border-white/10 pt-10 pb-16 md:pb-12 mt-8">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-12 mb-16 text-left">
            {/* Brand Column */}
            <div className="col-span-2 lg:col-span-1">
              <div className="flex items-center gap-2 mb-6 cursor-pointer" onClick={() => {
                setActiveTab('home');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}>
                <div className="h-8 w-6 overflow-hidden flex-shrink-0 bg-transparent">
                  <img src="/icons/stac.png" alt="" className="h-8 max-w-none object-cover dark:invert" style={{ objectPosition: 'left' }} />
                </div>
                <div className="h-8 overflow-hidden flex-shrink-0 ml-1.5 bg-transparent">
                  <img src="/icons/stac.png" alt="Stac" className="h-8 max-w-none object-cover dark:invert" style={{ marginLeft: '-24px' }} />
                </div>
              </div>
              <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed max-w-[240px]">
                {t('footer.description')}
              </p>
            </div>

            {/* Product Column */}
            <div className="flex flex-col items-start">
              <h4 className="font-bold text-black dark:text-white mb-6 uppercase tracking-wider text-xs">{t('Product')}</h4>
              <ul className="space-y-4 text-left">
                <li><button onClick={() => setActiveTab('swap')} className="text-slate-500 dark:text-slate-400 hover:text-black dark:hover:text-white transition-all duration-300 text-sm font-medium">{t('Swap')}</button></li>
                <li><button onClick={() => setActiveTab('bridge')} className="text-slate-500 dark:text-slate-400 hover:text-black dark:hover:text-white transition-all duration-300 text-sm font-medium">{t('Bridge')}</button></li>
                <li><button onClick={() => setActiveTab('liquidity')} className="text-slate-400 dark:text-slate-500 cursor-not-allowed text-sm flex items-center gap-2">{t('Liquidity')} <span className="text-[10px] opacity-60 uppercase tracking-widest">{t('Soon')}</span></button></li>
              </ul>
            </div>

            {/* Developers Column */}
            <div className="flex flex-col items-start">
              <h4 className="font-bold text-black dark:text-white mb-6 uppercase tracking-wider text-xs">{t('Developers')}</h4>
              <ul className="space-y-4 text-left">
                <li><a href="https://docs.arc.network" className="text-slate-500 dark:text-slate-400 hover:text-black dark:hover:text-white transition-all duration-300 text-sm font-medium">{t('Documentation')}</a></li>
                <li><a href="https://www.arc.network/ecosystem" className="text-slate-500 dark:text-slate-400 hover:text-black dark:hover:text-white transition-all duration-300 text-sm font-medium">{t('Ecosystem')}</a></li>
                <li><a href="https://community.arc.network/" className="text-slate-500 dark:text-slate-400 hover:text-black dark:hover:text-white transition-all duration-300 text-sm font-medium">{t('Community')}</a></li>
              </ul>
            </div>

            {/* App Settings */}
            <div className="flex flex-col items-start">
              <h4 className="font-bold text-black dark:text-white mb-6 uppercase tracking-wider text-xs">{t('App Settings')}</h4>
              <ul className="space-y-4 text-left">
                <li>
                  <button
                    onClick={() => window.dispatchEvent(new CustomEvent('open-updates'))}
                    className="text-slate-500 dark:text-slate-400 hover:text-black dark:hover:text-white transition-all duration-300 text-sm font-medium"
                  >
                    {t("What's New")}
                  </button>
                </li>
                <li>
                  <LanguageSelector placement="footer" />
                </li>
              </ul>
            </div>

            {/* Socials Column */}
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

          {/* Bottom Section - Seamless continuation */}
          <div className="flex flex-col md:grid md:grid-cols-3 items-center gap-4 md:gap-0 text-[10px] sm:text-xs font-semibold text-slate-400 uppercase tracking-[0.15em] mt-8 md:mt-12">

            {/* Left Section: Copyright */}
            <div className="md:col-span-1 flex flex-col md:flex-row items-center justify-center md:justify-start gap-4 md:gap-x-2 md:gap-y-1">
              <span>© 2026 Stac . All rights reserved</span>

              {/* Mobile Credit (Stacked underneath) */}
              <div className="flex md:hidden flex-col items-center gap-2 pb-4">
                <div className="flex items-center gap-2 text-slate-400">
                  <span>Built by :</span>
                  <a
                    href="https://x.com/linux_mode"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-slate-500 dark:text-slate-400 hover:text-black dark:hover:text-white transition-all duration-300 font-bold uppercase tracking-[0.15em]"
                  >
                    Linux
                  </a>
                </div>
              </div>
            </div>

            {/* Center Section: Credit (Desktop only) */}
            <div className="hidden md:flex md:col-span-1 items-center justify-center gap-1.5">
              <div className="flex items-center gap-2 text-slate-400 dark:text-slate-500">
                <span>Built by :</span>
                <div className="flex items-center gap-2">
                  <a
                    href="https://x.com/linux_mode"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-slate-500 dark:text-slate-400 hover:text-black dark:hover:text-white transition-all duration-300 font-bold uppercase tracking-[0.15em]"
                  >
                    Linux
                  </a>
                </div>
              </div>
            </div>

            {/* Right Section: Empty for Desktop Balance */}
            <div className="hidden md:block md:col-span-1"></div>
          </div>
        </div>
      </footer>

      {/* Scroll to Top Button */}
      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0.5, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.5, y: 20 }}
            whileHover={{ y: -4, transition: { duration: 0.2 } }}
            whileTap={{ scale: 0.95 }}
            onClick={scrollToTop}
            className="fixed bottom-6 right-6 sm:bottom-8 sm:right-8 z-[100] p-3 sm:p-4 rounded-2xl bg-white/90 dark:bg-[#0f172a]/90 backdrop-blur-xl border border-slate-200/50 dark:border-white/10 shadow-2xl shadow-black dark:shadow-white text-black dark:text-white dark:text-white flex items-center justify-center transition-all hover:bg-slate-50 dark:hover:bg-[#1e293b] group outline-none focus-visible:ring-2 focus-visible:ring-black dark:ring-white"
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