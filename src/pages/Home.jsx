
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { TrendingUp, Wallet, Network, ArrowLeftRight, Activity, ShieldCheck, Zap, ArrowRight, Code2, Layers, Droplets, ArrowRightLeft } from 'lucide-react';
import { motion, useMotionValue, useSpring } from 'framer-motion';
import { formatCurrency, formatNumber } from '../utils/blockchain';
import { useDappTransactionCount } from '../hooks/useDappTransactionCount';
import { useDappBridgeCount } from '../hooks/useDappBridgeCount';
import { useActiveUsers } from '../hooks/useActiveUsers';
import { useNetworkUptime } from '../hooks/useNetworkUptime';
import { useTotalVolume } from '../hooks/useTotalVolume';
import { useTotalValueProcessed } from '../hooks/useTotalValueProcessed';

import { useTransactionHistory } from '../hooks/useTransactionHistory';
import LanguageSelector from '../components/LanguageSelector';

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
      lucideIcon: TrendingUp,
      iconColor: 'blue',
      suffix: 'USD'
    },
    {
      id: 'volume',
      label: t('Swap Volume'),
      rawValue: stats.volume.value,
      formatFn: (val) => formatCurrency(val, 0),
      lucideIcon: ArrowLeftRight,
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

  const getIconColor = (color) => {
    const colors = {
      blue: 'text-blue-500',
      indigo: 'text-indigo-500',
      purple: 'text-purple-500',
      orange: 'text-orange-500',
      pink: 'text-pink-500',
      green: 'text-emerald-500'
    };
    return colors[color] || 'text-blue-500';
  };

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      {/* Hero Section */}
      <section className="relative pt-32 pb-16 overflow-hidden flex flex-col items-center justify-center border-b border-slate-100 dark:border-white/5 bg-[#eaf0f8] dark:bg-[#020617] hero-blueprint-grid">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {/* Main Blueprint Crosshair (Dashed) */}
          <div className="absolute inset-0">
            {/* Horizontal Dashed Axis */}
            <div className="absolute top-1/2 left-0 right-0 h-[1.5px] border-t border-dashed border-blue-500/30 dark:border-blue-400/20"></div>
            {/* Vertical Dashed Axis */}
            <div className="absolute left-1/2 top-0 bottom-0 w-[1.5px] border-l border-dashed border-blue-500/30 dark:border-blue-400/20"></div>

            {/* Major Grid Lines Readout (Technical detail) */}
            <div className="absolute top-[20%] left-0 right-0 h-[0.5px] bg-blue-500/15 dark:bg-blue-400/10"></div>
            <div className="absolute bottom-[20%] left-0 right-0 h-[0.5px] bg-blue-500/15 dark:bg-blue-400/10"></div>
          </div>

          {/* Technical Coordination Text - Hidden on small mobile */}
          <div className="hidden sm:block absolute top-24 right-10 text-[10px] font-bold text-slate-500 dark:text-slate-400 tracking-[0.25em] leading-relaxed text-right uppercase">
            {t('COORDS')}: 34.0522° N<br />118.2437° W
          </div>

          <div className="absolute bottom-12 left-6 sm:left-10 md:left-24 text-[10px] font-bold text-slate-500 dark:text-slate-400 tracking-[0.25em] uppercase">
            X: 1.02
          </div>

          <div className="absolute bottom-12 right-6 sm:right-10 md:right-24 text-[10px] font-bold text-slate-500 dark:text-slate-400 tracking-[0.25em] uppercase text-right">
            Y: 4.88
          </div>

          {/* Top Left Decoration Element */}
          <div className="absolute top-32 left-10 md:left-24 flex items-center gap-6">
            <div className="h-[0.5px] w-24 bg-slate-200 dark:bg-white/10"></div>
            <div className="flex gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500/20 dark:bg-blue-400/20"></div>
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500/20 dark:bg-blue-400/20"></div>
            </div>
          </div>
        </div>

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
              {t('Home of DeFi on')} <span className="text-blue-600 dark:text-blue-500">{t('Arc')}</span>
            </motion.h1>
          </div>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg md:text-xl text-slate-500 dark:text-slate-400 mt-6 mb-8 max-w-2xl mx-auto leading-relaxed"
          >
            {t('Swap tokens, bridge assets, and provide liquidity with')} <span className="text-slate-900 dark:text-white font-semibold">{t('zero friction')}</span>. {t('Built on')} <span className="text-blue-600 dark:text-blue-500 font-medium">{t('Arc\'s')}</span> {t('enterprise-grade infrastructure.')}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-5 mb-12"
          >
            <button
              onClick={handleGetStarted}
              className="w-full sm:w-52 h-16 bg-blue-500 text-white rounded-2xl font-bold hover:bg-blue-600 active:scale-[0.97] transition-all duration-300 flex items-center justify-center space-x-2 text-lg shadow-xl shadow-blue-500/20 hover:shadow-blue-500/30 group"
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
                <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 dark:text-slate-600 uppercase tracking-[0.2em] sm:tracking-[0.3em]">
                  {feature.label}
                </span>
                <div className="w-8 sm:w-10 h-0.5 bg-blue-500/50 mt-3 sm:mt-4 rounded-full"></div>
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
              <div className={`mb-4 ${getIconColor(stat.iconColor)}`}>
                <stat.lucideIcon size={24} strokeWidth={2.5} />
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
                <div className="w-16 h-16 rounded-full bg-white dark:bg-black border border-slate-200 dark:border-white/10 flex items-center justify-center mb-4 transition-all duration-300 group-hover:border-blue-500/50 group-hover:shadow-lg group-hover:shadow-blue-500/10 group-hover:-translate-y-1 overflow-hidden">
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
              icon: ArrowLeftRight,
              bg: 'bg-blue-50 dark:bg-blue-500/10',
              iconColor: 'text-blue-600'
            },
            {
              title: t('Bridge Tokens'),
              desc: t('Seamlessly move your assets across multiple chains with institutional-grade security and minimal friction.'),
              icon: ArrowRightLeft,
              bg: 'bg-indigo-50 dark:bg-indigo-500/10',
              iconColor: 'text-indigo-600'
            },
            {
              title: t('Provide Liquidity'),
              desc: t('Earn protocol fees'),
              icon: Droplets,
              bg: 'bg-blue-50 dark:bg-blue-500/10',
              iconColor: 'text-blue-600'
            }
          ].map((step, i) => (
            <div key={i} className="flex flex-col items-start p-8 rounded-3xl bg-slate-50 dark:bg-[#020617] border border-slate-100 dark:border-white/5 transition-all duration-300 hover:border-blue-500/30">
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
              iconColor: 'text-blue-500'
            },
            {
              title: t('Institutional Security'),
              desc: t('Benefit from multi-layered security protocols and battle-tested smart contracts audited by the world\'s leading firms.'),
              icon: ShieldCheck,
              iconColor: 'text-blue-500'
            },
            {
              title: t('Zero Friction'),
              desc: t('Removal of DeFi complexity. Pay gas fees in USDC, enjoy automated portfolio management, and bridge assets seamlessly.'),
              icon: Layers,
              iconColor: 'text-blue-500'
            },
            {
              title: t('Developer Friendly'),
              desc: t('Build on Arc with ease using our comprehensive SDKs, robust documentation, and modular API architecture.'),
              icon: Code2,
              iconColor: 'text-blue-500'
            }
          ].map((feature, i) => (
            <div key={i} className="flex flex-col items-start p-10 rounded-3xl bg-slate-50 dark:bg-[#131720] border border-slate-100 dark:border-white/5 transition-all duration-300 hover:border-blue-500/30 group">
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
              <h4 className="font-bold text-slate-900 dark:text-white mb-6 uppercase tracking-wider text-xs">{t('Product')}</h4>
              <ul className="space-y-4 text-left">
                <li><button onClick={() => setActiveTab('swap')} className="text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors text-sm">{t('Swap')}</button></li>
                <li><button onClick={() => setActiveTab('bridge')} className="text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors text-sm">{t('Bridge')}</button></li>
                <li><button onClick={() => setActiveTab('liquidity')} className="text-slate-400 dark:text-slate-500 cursor-not-allowed text-sm flex items-center gap-2">{t('Liquidity')} <span className="text-[10px] opacity-60 uppercase tracking-widest">{t('Soon')}</span></button></li>
              </ul>
            </div>

            {/* Developers Column */}
            <div className="flex flex-col items-start">
              <h4 className="font-bold text-slate-900 dark:text-white mb-6 uppercase tracking-wider text-xs">{t('Developers')}</h4>
              <ul className="space-y-4 text-left">
                <li><a href="https://docs.arc.network" className="text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors text-sm">{t('Documentation')}</a></li>
                <li><a href="https://www.arc.network/ecosystem" className="text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors text-sm">{t('Ecosystem')}</a></li>
                <li><a href="https://community.arc.network/" className="text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors text-sm">{t('Community')}</a></li>
              </ul>
            </div>

            {/* App Settings */}
            <div className="flex flex-col items-start">
              <h4 className="font-bold text-slate-900 dark:text-white mb-6 uppercase tracking-wider text-xs">{t('App Settings')}</h4>
              <ul className="space-y-4 text-left">
                <li>
                  <button
                    onClick={() => window.dispatchEvent(new CustomEvent('open-updates'))}
                    className="text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors text-sm"
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
              <h4 className="font-bold text-slate-900 dark:text-white mb-6 uppercase tracking-wider text-xs">{t('Socials')}</h4>
              <ul className="space-y-4 text-left">
                <li><a href="https://x.com/stac_defi" target="_blank" rel="noopener noreferrer" className="text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors text-sm">{t('Twitter')}</a></li>
                <li><a href="#" className="text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors text-sm">{t('Discord')}</a></li>
                <li><a href="#" className="text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors text-sm">{t('Telegram')}</a></li>
                <li><a href="https://github.com/linux070/stac-defi" target="_blank" rel="noopener noreferrer" className="text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors text-sm">{t('GitHub')}</a></li>
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
                    className="transition-colors font-semibold uppercase tracking-[0.15em]"
                  >
                    Linux
                  </a>
                </div>
              </div>
            </div>

            {/* Center Section: Credit (Desktop only) */}
            <div className="hidden md:flex md:col-span-1 items-center justify-center gap-1.5">
              <span>Built by :</span>
              <div className="flex items-center gap-2">
                <a
                  href="https://x.com/linux_mode"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition-colors font-semibold uppercase tracking-[0.15em]"
                >
                  Linux
                </a>
              </div>
            </div>

            {/* Right Section: Empty for Desktop Balance */}
            <div className="hidden md:block md:col-span-1"></div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;