
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { TrendingUp, Wallet, Network, ArrowLeftRight, Activity, ShieldCheck, Zap, CircleDollarSign, Landmark, Cable, Droplets, ArrowRight } from 'lucide-react';
import { motion, useMotionValue, useSpring } from 'framer-motion';
import { formatCurrency, formatNumber } from '../utils/blockchain';
import { useDappTransactionCount } from '../hooks/useDappTransactionCount';
import { useDappBridgeCount } from '../hooks/useDappBridgeCount';
import { useActiveUsers } from '../hooks/useActiveUsers';
import { useNetworkUptime } from '../hooks/useNetworkUptime';
import { useTotalVolume } from '../hooks/useTotalVolume';
import { useTotalValueProcessed } from '../hooks/useTotalValueProcessed';

import { useTransactionHistory } from '../hooks/useTransactionHistory';

const Home = ({ setActiveTab }) => {
  const { t } = useTranslation();
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
      change: stats.tvl.change,
      trend: stats.tvl.trend,
      lucideIcon: TrendingUp,
      iconColor: 'text-blue-600 dark:text-blue-400',
      iconBg: 'bg-blue-50 dark:bg-blue-500/10',
      iconBorder: 'border-blue-100 dark:border-blue-500/20',
      description: t('Swaps, Bridges & LP combined')
    },
    {
      id: 'volume',
      label: t('Swap Volume'),
      rawValue: stats.volume.value,
      formatFn: (val) => formatCurrency(val, 0),
      change: stats.volume.change,
      trend: stats.volume.trend,
      lucideIcon: ArrowLeftRight,
      iconColor: 'text-emerald-600 dark:text-emerald-400',
      iconBg: 'bg-emerald-50 dark:bg-emerald-500/10',
      iconBorder: 'border-emerald-100 dark:border-emerald-500/20',
      description: t('Total swap volume in USD')
    },
    {
      id: 'Cross-Chain',
      label: t('Cross Chain Transfers'),
      rawValue: stats.crossChain.value,
      formatFn: (val) => formatNumber(Math.floor(val)),
      change: stats.crossChain.change,
      trend: stats.crossChain.trend,
      lucideIcon: Network,
      iconColor: 'text-indigo-600 dark:text-indigo-400',
      iconBg: 'bg-indigo-50 dark:bg-indigo-500/10',
      iconBorder: 'border-indigo-100 dark:border-indigo-500/20',
      description: t('Bridge transaction count')
    },
    {
      id: 'users',
      label: t('Active Users'),
      rawValue: stats.users.value,
      formatFn: (val) => formatNumber(Math.floor(val)),
      change: stats.users.change,
      trend: stats.users.trend,
      lucideIcon: Wallet,
      iconColor: 'text-amber-600 dark:text-amber-400',
      iconBg: 'bg-amber-50 dark:bg-amber-500/10',
      iconBorder: 'border-amber-100 dark:border-amber-500/20',
      description: t('Total unique wallet addresses')
    },
    {
      id: 'transactions',
      label: t('Transaction Count'),
      rawValue: stats.transactions.value,
      formatFn: (val) => formatNumber(Math.floor(val)),
      change: stats.transactions.change,
      trend: stats.transactions.trend,
      lucideIcon: Activity,
      iconColor: 'text-violet-600 dark:text-violet-400',
      iconBg: 'bg-violet-50 dark:bg-violet-500/10',
      iconBorder: 'border-violet-100 dark:border-violet-500/20',
      description: t('Count from indexer')
    },
    {
      id: 'uptime',
      label: t('Network Uptime'),
      rawValue: stats.uptime.value,
      formatFn: (val) => `${Math.round(val)}% `,
      change: stats.uptime.change,
      trend: stats.uptime.trend,
      lucideIcon: ShieldCheck,
      iconColor: 'text-cyan-600 dark:text-cyan-400',
      iconBg: 'bg-cyan-50 dark:bg-cyan-500/10',
      iconBorder: 'border-cyan-100 dark:border-cyan-500/20',
      description: t('Operational reliability')
    },
  ];

  return (
    <div className="space-y-8 px-2 sm:px-0">
      <div className="space-y-12 pb-20">
        {/* Hero Section */}
        <section className="relative pt-24 pb-32 overflow-hidden min-h-[85vh] md:min-h-[75vh] flex flex-col justify-center">
          {/* Pulsing Blue Background Styling */}
          <div className="absolute inset-0 pointer-events-none z-0">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] opacity-40">
              <div className="absolute inset-0 bg-blue-400/20 dark:bg-blue-600/10 rounded-full blur-[140px] animate-[pulse_8s_ease-in-out_infinite]"></div>
              <div className="absolute top-1/4 left-1/4 w-1/2 h-1/2 bg-blue-500/10 dark:bg-blue-400/5 rounded-full blur-[100px] animate-[pulse_6s_ease-in-out_infinite_1s]"></div>
            </div>
          </div>

          {/* Token Flow Lines & Constellation */}
          <div className="absolute inset-0 pointer-events-none z-0">
            {/* Flow Line & Particles — Minimal DeFi Style */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none z-0 text-blue-500 dark:text-blue-400/80" viewBox="0 0 100 100" preserveAspectRatio="none">
              <defs>
                <linearGradient id="flowGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="currentColor" stopOpacity="0" />
                  <stop offset="25%" stopColor="currentColor" stopOpacity="0.5" />
                  <stop offset="75%" stopColor="currentColor" stopOpacity="0.5" />
                  <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
                </linearGradient>
                <mask id="centerMask">
                  <rect width="100%" height="100%" fill="white" />
                  <ellipse cx="50" cy="50" rx="18" ry="12" fill="black" />
                </mask>
              </defs>

              {/* Subtle orbit line */}
              <motion.path
                d="M -10,85 C 20,85 40,65 50,50 C 60,35 80,15 110,10"
                stroke="url(#flowGrad)"
                strokeWidth="0.5"
                fill="none"
                mask="url(#centerMask)"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 2.5, ease: "easeInOut" }}
                vectorEffect="non-scaling-stroke"
              />

              {/* Micro-particles — monochrome, no glow */}
              {[
                { r: 0.5, duration: 14, delay: 0 },
                { r: 0.4, duration: 18, delay: 4 },
                { r: 0.45, duration: 16, delay: 8 },
              ].map((p, i) => (
                <circle key={i} r={p.r} fill="currentColor">
                  <animateMotion
                    dur={`${p.duration}s`}
                    repeatCount="indefinite"
                    begin={`${p.delay}s`}
                    path="M -10,85 C 20,85 40,65 50,50 C 60,35 80,15 110,10"
                  />
                  <animate
                    attributeName="opacity"
                    values="0;0.9;0.9;0"
                    keyTimes="0;0.08;0.92;1"
                    dur={`${p.duration}s`}
                    repeatCount="indefinite"
                    begin={`${p.delay}s`}
                  />
                </circle>
              ))}
            </svg>

            {/* Token Constellation - Icons Only */}
            {/* Top Right: EURC - Moved to Right for symmetry with USDC */}
            {/* Token Constellation - Icons Only */}
            {/* Top Right: EURC - Moved to Right for symmetry with USDC */}
            <div className="absolute top-[2%] right-2 w-20 h-20 md:top-[3%] md:right-0 md:w-36 md:h-36 rotate-[12deg] z-10 transition-transform duration-700 hover:scale-110 opacity-80 md:opacity-100">
              <img src="/icons/eurc.png" alt="" loading="eager" fetchPriority="high" className="w-full h-full object-contain filter drop-shadow(0 20px 40px rgba(59,130,246,0.18))" />
            </div>

            {/* Bottom Left: USDC - Primary anchor, Size Adjusted to match EURC */}
            <div className="absolute bottom-[2%] left-2 w-20 h-20 md:bottom-[5%] md:left-[4%] md:w-36 md:h-36 -rotate-[12deg] z-10 transition-transform duration-700 hover:scale-105 opacity-80 md:opacity-100">
              <img src="/icons/usdc.png" alt="" loading="eager" fetchPriority="high" className="w-full h-full object-contain filter drop-shadow(0 20px 40px rgba(59,130,246,0.18))" />
            </div>

            {/* Accents for Depth - Hidden on mobile to reduce clutter, visible on tablet+ */}
            <div className="hidden md:block absolute top-[5%] left-[5%] w-14 h-14 md:w-20 md:h-20 rotate-[25deg] z-0 opacity-90 blur-[2px] transition-transform duration-700 hover:scale-110">
              <img src="/icons/mtb.png" alt="" loading="lazy" decoding="async" className="w-full h-full object-contain filter drop-shadow(0 15px 30px rgba(59,130,246,0.12))" />
            </div>

            <div className="hidden md:block absolute bottom-[20%] right-[5%] w-16 h-16 md:w-24 md:h-24 rotate-[-15deg] z-0 opacity-90 blur-[2px] transition-transform duration-700 hover:scale-110">
              <img src="/icons/ecr.png" alt="" loading="lazy" decoding="async" className="w-full h-full object-contain filter drop-shadow(0 15px 30px rgba(59,130,246,0.12))" />
            </div>
          </div>

          <div className="relative z-10 text-center max-w-5xl mx-auto px-4">
            <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-[100px] mb-8 tracking-tighter leading-[1] text-slate-800 dark:text-white">
              <span className="font-extralight">{t('Home of DeFi on')}</span>{' '}
              <span className="font-semibold text-blue-600 dark:text-blue-500">Arc</span>
            </h1>

            <p className="text-lg md:text-xl text-slate-500 dark:text-slate-400 mb-12 max-w-2xl mx-auto leading-relaxed">
              {t('Swap tokens, bridge assets, and provide liquidity with')} <span className="text-slate-900 dark:text-white font-medium">{t('zero friction')}</span>.
              <br className="hidden md:block" /> {t('Built on')} <span className="text-slate-900 dark:text-white font-medium">{t('Arc\'s')}</span> {t('enterprise-grade infrastructure.')}
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-5 mb-16 px-4">
              <button
                onClick={handleGetStarted}
                className="w-full sm:w-56 bg-[#0f172a] dark:bg-white text-white dark:text-[#0f172a] h-14 rounded-2xl font-bold hover:scale-[1.02] hover:bg-blue-600 dark:hover:bg-blue-500 hover:text-white dark:hover:text-white hover:shadow-blue-500/25 active:scale-[0.98] active:bg-blue-700 dark:active:bg-blue-600 transition-all duration-300 shadow-xl shadow-slate-900/20 dark:shadow-white/10 flex items-center justify-center space-x-3 group"
              >
                <span>{t('Get Started')}</span>
                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </button>
              <a
                href="https://www.arc.network/"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-56 bg-white dark:bg-[#0f172a]/40 backdrop-blur-md text-slate-900 dark:text-white border border-slate-200 dark:border-white/5 h-14 rounded-2xl font-bold hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 dark:hover:bg-blue-500/10 dark:hover:text-blue-400 dark:hover:border-blue-500/30 active:scale-[0.98] transition-all duration-300 flex items-center justify-center shadow-sm"
              >
                {t('Learn More')}
              </a>
            </div>

            {/* Bottom Feature Labels - Naked Text */}
            <div className="flex flex-wrap justify-center gap-8 mt-4">
              {[
                { label: t('Sub-second Finality') },
                { label: t('USDC Gas Fees') },
                { label: t('Best Execution') }
              ].map((feature, i) => (
                <div key={i} className="cursor-default">
                  <span className="text-sm md:text-base font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                    {feature.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Statistics Dashboard */}
        <section className="px-4">
          <div className="mb-10 text-left">
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white mb-2">{t('Network Statistics')}</h2>
            <p className="text-slate-500 dark:text-slate-400 max-w-2xl">{t('Real-time metrics updated automatically')}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {statCards.map((stat, index) => {
              return (
                <motion.div
                  key={stat.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="card group hover:scale-[1.02]"
                >
                  <div className="flex items-start justify-between mb-6">
                    <div className={`w-10 h-10 md:w-11 md:h-11 flex items-center justify-center rounded-xl ${stat.iconBg} border ${stat.iconBorder} transition-all duration-300 group-hover:shadow-sm`}>
                      {stat.lucideIcon && (
                        <stat.lucideIcon
                          size={20}
                          strokeWidth={1.75}
                          className={`${stat.iconColor} transition-colors duration-300`}
                        />
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-500 uppercase tracking-widest">{stat.label}</p>
                    <h3 className="text-3xl md:text-4xl font-medium text-slate-900 dark:text-white tracking-tight tabular-nums">
                      <AnimatedNumber value={stat.rawValue} formatFn={stat.formatFn} />
                    </h3>
                  </div>

                  <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <p className="text-xs text-slate-400 dark:text-slate-500 max-w-[70%] leading-relaxed">
                      {stat.description}
                    </p>
                    <div className="flex items-center space-x-2">
                      <div className="relative">
                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
                        <div className="absolute inset-0 w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping opacity-75"></div>
                      </div>
                      <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">{t('Live')}</span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </section>

        {/* Quick Actions */}
        <section className="px-4">
          <div className="mb-10 text-left">
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white mb-2">{t('Quick Actions')}</h2>
            <p className="text-slate-500 dark:text-slate-400 max-w-2xl">{t('Everything you need to manage your assets on Arc')}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              onClick={() => setActiveTab('swap')}
              className="card group cursor-pointer flex flex-col items-start"
            >
              <div className="mb-6">
                <div className="w-10 h-10 md:w-11 md:h-11 flex items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 transition-all duration-300 group-hover:shadow-sm">
                  <ArrowLeftRight size={20} className="text-blue-600 dark:text-blue-400 transition-colors duration-300" strokeWidth={1.75} />
                </div>
              </div>

              <div className="space-y-2 mb-8">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white uppercase tracking-tight">{t('Swap Tokens')}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                  {t('Exchange tokens instantly at the best rates')}
                </p>
              </div>

              <div className="mt-auto w-full">
                <div className="inline-flex items-center justify-center w-full h-12 rounded-xl border border-blue-500/30 text-blue-600 dark:text-blue-400 text-xs font-bold uppercase tracking-widest md:group-hover:bg-blue-600 md:group-hover:text-white group-active:bg-blue-100 dark:group-active:bg-blue-500/20 group-active:scale-[0.98] transition-all duration-300">
                  <span>{t('Start swapping')}</span>
                  <ArrowRight className="ml-2 group-hover:translate-x-1" size={16} />
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              onClick={() => setActiveTab('bridge')}
              className="card group cursor-pointer flex flex-col items-start"
            >
              <div className="mb-6">
                <div className="w-10 h-10 md:w-11 md:h-11 flex items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 transition-all duration-300 group-hover:shadow-sm">
                  <Cable size={20} className="text-emerald-600 dark:text-emerald-400 transition-colors duration-300" strokeWidth={1.75} />
                </div>
              </div>

              <div className="space-y-2 mb-8">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white uppercase tracking-tight">{t('Bridge Assets')}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                  {t('Transfer assets between Sepolia and Arc Testnet')}
                </p>
              </div>

              <div className="mt-auto w-full">
                <div className="inline-flex items-center justify-center w-full h-12 rounded-xl border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold uppercase tracking-widest md:group-hover:bg-emerald-600 md:group-hover:text-white group-active:bg-emerald-100 dark:group-active:bg-emerald-500/20 group-active:scale-[0.98] transition-all duration-300">
                  <span>{t('Start bridging')}</span>
                  <ArrowRight className="ml-2 group-hover:translate-x-1" size={16} />
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              onClick={() => setActiveTab('liquidity')}
              className="card group cursor-pointer flex flex-col items-start"
            >
              <div className="mb-6">
                <div className="w-10 h-10 md:w-11 md:h-11 flex items-center justify-center rounded-xl bg-violet-50 dark:bg-violet-500/10 border border-violet-100 dark:border-violet-500/20 transition-all duration-300 group-hover:shadow-sm">
                  <Droplets size={20} className="text-violet-600 dark:text-violet-400 transition-colors duration-300" strokeWidth={1.75} />
                </div>
              </div>

              <div className="space-y-2 mb-8">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white uppercase tracking-tight">{t('Add Liquidity')}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                  {t('Provide liquidity to earn passive income')}
                </p>
              </div>

              <div className="mt-auto w-full">
                <div className="inline-flex items-center justify-center w-full h-12 rounded-xl border border-purple-500/30 text-purple-600 dark:text-purple-400 text-xs font-bold uppercase tracking-widest md:group-hover:bg-purple-600 md:group-hover:text-white group-active:bg-purple-100 dark:group-active:bg-purple-500/20 group-active:scale-[0.98] transition-all duration-300">
                  <span>{t('Start earning')}</span>
                  <ArrowRight className="ml-2 group-hover:translate-x-1" size={16} />
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Why Arc Network Section */}
        <section className="px-4">
          <div className="mb-10 text-left">
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white mb-2">{t('Why Arc Network')}</h2>
            <p className="text-slate-500 dark:text-slate-400 max-w-2xl">{t('Experience the next generation of blockchain infrastructure')}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Lightning Fast */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="card group flex flex-col items-start hover:border-blue-500/50"
            >
              <div className="mb-6">
                <div className="w-10 h-10 md:w-11 md:h-11 flex items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 transition-all duration-300 group-hover:shadow-sm">
                  <Zap size={20} className="text-blue-600 dark:text-blue-400 transition-colors duration-300" strokeWidth={1.75} />
                </div>
              </div>

              <h3 className="text-lg font-bold text-slate-900 dark:text-white uppercase tracking-tight mb-3">
                {t('Lightning Fast')}
              </h3>

              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                {t('Sub-second finality with transaction speeds up to 1000x faster than traditional blockchains.')}
              </p>
            </motion.div>

            {/* USDC Gas Fee */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="card group flex flex-col items-start hover:border-emerald-500/50"
            >
              <div className="mb-6">
                <div className="w-10 h-10 md:w-11 md:h-11 flex items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 transition-all duration-300 group-hover:shadow-sm">
                  <CircleDollarSign size={20} className="text-emerald-600 dark:text-emerald-400 transition-colors duration-300" strokeWidth={1.75} />
                </div>
              </div>

              <h3 className="text-lg font-bold text-slate-900 dark:text-white uppercase tracking-tight mb-3">
                {t('USDC Gas Fee')}
              </h3>

              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                {t('Predictable transaction costs with stablecoin-based gas fees for better UX.')}
              </p>
            </motion.div>

            {/* Enterprise Grade */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="card group flex flex-col items-start hover:border-purple-500/50"
            >
              <div className="mb-6">
                <div className="w-10 h-10 md:w-11 md:h-11 flex items-center justify-center rounded-xl bg-violet-50 dark:bg-violet-500/10 border border-violet-100 dark:border-violet-500/20 transition-all duration-300 group-hover:shadow-sm">
                  <Landmark size={20} className="text-violet-600 dark:text-violet-400 transition-colors duration-300" strokeWidth={1.75} />
                </div>
              </div>

              <h3 className="text-lg font-bold text-slate-900 dark:text-white uppercase tracking-tight mb-3">
                {t('Enterprise Grade')}
              </h3>

              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                {t('Built for institutional use with advanced security and compliance features.')}
              </p>
            </motion.div>
          </div>
        </section>
      </div >
    </div >
  );
};

export default Home;