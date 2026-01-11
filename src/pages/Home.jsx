import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Layers, DollarSign, Users, Activity, ArrowUpRight, ArrowDownRight, Globe, Coins, Zap, ExternalLink, Link, Droplet, Shield, Wifi, ArrowLeftRight, Waypoints, Fuel, Building2, Signal, Hash, Boxes, BarChart3 } from 'lucide-react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { formatCurrency, formatNumber } from '../utils/blockchain';
import { ArrowUpDown } from "lucide-react";
import { useDappTransactionCount } from '../hooks/useDappTransactionCount';
import { useDappBridgeCount } from '../hooks/useDappBridgeCount';
import { useActiveUsers } from '../hooks/useActiveUsers';
import { useNetworkUptime } from '../hooks/useNetworkUptime';
import { useTotalVolume } from '../hooks/useTotalVolume';
import { useTotalValueProcessed } from '../hooks/useTotalValueProcessed';

const Home = ({ setActiveTab }) => {
  const { t } = useTranslation();
  const { transactionCount, change, trend, loading: txLoading } = useDappTransactionCount();
  const { bridgeCount, change: bridgeChange, trend: bridgeTrend } = useDappBridgeCount();
  const { activeUsers, change: usersChange, trend: usersTrend } = useActiveUsers();
  const { uptime, change: uptimeChange, trend: uptimeTrend } = useNetworkUptime();
  const { totalVolume, loading: volumeLoading } = useTotalVolume();
  const { totalValue, loading: tvpLoading } = useTotalValueProcessed();

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
      icon: Layers,
      lucideIcon: Layers,
      color: 'from-blue-500 to-blue-600',
      description: t('Swaps, Bridges & LP combined')
    },
    {
      id: 'volume',
      label: t('Swap Volume'),
      rawValue: stats.volume.value,
      formatFn: (val) => formatCurrency(val, 0),
      change: stats.volume.change,
      trend: stats.volume.trend,
      icon: BarChart3,
      lucideIcon: BarChart3,
      color: 'from-green-500 to-green-600',
      description: t('Total swap volume in USD')
    },
    {
      id: 'Cross-Chain',
      label: t('Cross Chain Transfers'),
      rawValue: stats.crossChain.value,
      formatFn: (val) => formatNumber(Math.floor(val)),
      change: stats.crossChain.change,
      trend: stats.crossChain.trend,
      icon: Globe,
      lucideIcon: Globe,
      color: 'from-indigo-500 to-indigo-600',
      description: t('Bridge transaction count')
    },
    {
      id: 'users',
      label: t('Active Users'),
      rawValue: stats.users.value,
      formatFn: (val) => formatNumber(Math.floor(val)),
      change: stats.users.change,
      trend: stats.users.trend,
      icon: Users,
      lucideIcon: Users,
      color: 'from-orange-500 to-orange-600',
      description: t('Total unique wallet addresses')
    },
    {
      id: 'transactions',
      label: t('Transaction Count'),
      rawValue: stats.transactions.value,
      formatFn: (val) => formatNumber(Math.floor(val)),
      change: stats.transactions.change,
      trend: stats.transactions.trend,
      icon: Boxes,
      lucideIcon: Boxes,
      color: 'from-purple-500 to-purple-600',
      description: t('Count from indexer')
    },
    {
      id: 'uptime',
      label: t('Network Uptime'),
      rawValue: stats.uptime.value,
      formatFn: (val) => `${Math.round(val)}%`,
      change: stats.uptime.change,
      trend: stats.uptime.trend,
      icon: Signal,
      lucideIcon: Signal,
      color: 'from-cyan-500 to-cyan-600',
      description: t('Operational reliability')
    },
  ];

  return (
    <div className="space-y-8 px-2 sm:px-0">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="animate-float rounded-3xl p-6 md:p-8 lg:p-12
        /* --- LIGHT MODE (Vibrant Gradient) --- */
        bg-gradient-to-br from-blue-600 to-indigo-600
        text-white
        shadow-xl shadow-blue-500/20
        
        /* --- DARK MODE (Subtle & Deep) --- */
        dark:bg-slate-800/40 
        dark:from-transparent dark:to-transparent /* Remove gradient in dark mode if you want glass */
        dark:backdrop-blur-md"
      >

        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiPjxkZWZzPjxwYXR0ZXJuIGlkPSJwYXR0ZXJuIiB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHBhdHRlcm5Vbml0cz0idXNlclNwYWNlT25Vc2UiIHBhdHRlcm5UcmFuc2Zvcm09InJvdGF0ZSg0NSkiPjxyZWN0IHdpZHRoPSIxIiBoZWlnaHQ9IjEiIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI3BhdHRlcm4pIi8+PC9zdmc+')] opacity-20"></div>
        <div className="relative z-10">

          <h1 className="text-3xl md:text-4xl lg:text-6xl xl:text-7xl font-bold mb-3 md:mb-4 leading-tight">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-white via-blue-200 to-white bg-[length:200%_auto] animate-text-shimmer">
              {t('Welcome to Stac')}
            </span>
          </h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-base md:text-lg lg:text-2xl opacity-90 mb-2 md:mb-3 max-w-2xl"
          >
            {t('Home of Defi on Arc')}
          </motion.p>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="text-sm md:text-base lg:text-lg opacity-75 mb-6 md:mb-8 max-w-2xl"
          >
            {t('Swap tokens, bridge assets, and provide liquidity with zero friction. Built on Arc\'s enterprise-grade infrastructure.')}
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-3 md:gap-4"
          >
            <button
              onClick={handleGetStarted}
              className="w-full sm:w-auto bg-white text-blue-600 px-6 py-3 md:px-7 md:py-4 rounded-xl font-bold hover:shadow-2xl hover:scale-105 transition-all duration-200 flex items-center justify-center space-x-2 shadow-lg"
            >
              <span>{t('Swap Now')}</span>
            </button>
            <a
              href="https://www.arc.network/"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto bg-white/20 border border-white/40 text-white px-6 py-3 md:px-8 md:py-3 rounded-xl font-bold hover:shadow-2xl hover:scale-105 transition-all duration-200 flex items-center justify-center space-x-2 backdrop-blur-sm"
            >
              <span>{t('Learn More')}</span>
            </a>
          </motion.div>

          {/* Key Benefits */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-6 md:mt-8 flex flex-wrap gap-4 md:gap-6 text-xs md:text-sm"
          >
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span>{t('features.subSecondFinality')}</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span>{t('features.usdcGasFees')}</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span>{t('features.bestExecution')}</span>
            </div>
          </motion.div>
        </div>

        {/* Background decorations */}
        <div className="absolute top-0 right-0 w-48 h-48 md:w-96 md:h-96 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 md:w-96 md:h-96 bg-white/10 rounded-full blur-3xl"></div>
      </motion.div>

      {/* Statistics Dashboard */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="card"
      >
        <div className="mb-6">
          <h2 className="text-xl md:text-2xl lg:text-3xl font-bold font-display tracking-tight text-slate-900 dark:text-white mb-2">{t('Network Statistics')}</h2>
          <p className="text-xs md:text-sm lg:text-base text-slate-500 dark:text-slate-400 mb-6 md:mb-8 max-w-2xl">{t('Real-time metrics updated automatically')}</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          {statCards.map((stat, index) => {
            const TrendIcon = stat.trend === 'up' ? ArrowUpRight : stat.trend === 'down' ? ArrowDownRight : null;
            return (
              <motion.div
                key={stat.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * index }}
                className="group relative overflow-hidden rounded-3xl p-6 md:p-8 bg-white shadow-sm hover:shadow-2xl hover:shadow-slate-200/50 dark:hover:shadow-blue-900/20 transition-all duration-500 dark:bg-slate-900/40 backdrop-blur-xl hover:-translate-y-2"
              >
                {/* 4-Corner Splitted Glow System */}
                <div className={`absolute -top-20 -left-20 w-48 h-48 bg-gradient-to-br ${stat.color} opacity-[0.04] dark:opacity-[0.1] group-hover:opacity-20 blur-[60px] transition-all duration-700 rounded-full`}></div>
                <div className={`absolute -top-20 -right-20 w-48 h-48 bg-gradient-to-bl ${stat.color} opacity-[0.04] dark:opacity-[0.1] group-hover:opacity-20 blur-[60px] transition-all duration-700 rounded-full`}></div>
                <div className={`absolute -bottom-20 -left-20 w-48 h-48 bg-gradient-to-tr ${stat.color} opacity-[0.04] dark:opacity-[0.1] group-hover:opacity-20 blur-[60px] transition-all duration-700 rounded-full`}></div>
                <div className={`absolute -bottom-20 -right-20 w-48 h-48 bg-gradient-to-tl ${stat.color} opacity-[0.04] dark:opacity-[0.1] group-hover:opacity-20 blur-[60px] transition-all duration-700 rounded-full`}></div>

                <div className="relative z-10">
                  <div className="flex items-start justify-between mb-6">
                    {/* Premium Icon Container */}
                    <div className="relative w-14 h-14 flex items-center justify-center">
                      {/* Floating Glow Blob behind icon */}
                      <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-25 blur-xl rounded-full group-hover:opacity-50 group-hover:scale-150 transition-all duration-700`}></div>

                      {/* Floating Icon - Transparent Background */}
                      <div className="relative z-10 group-hover:scale-125 group-hover:-rotate-12 transition-all duration-500">
                        {stat.lucideIcon && (
                          <stat.lucideIcon
                            size={32}
                            className={`transition-colors duration-300 ${stat.id === 'tvl' ? 'text-blue-500' :
                              stat.id === 'volume' ? 'text-green-500' :
                                stat.id === 'Cross-Chain' ? 'text-indigo-500' :
                                  stat.id === 'users' ? 'text-orange-500' :
                                    stat.id === 'transactions' ? 'text-purple-500' :
                                      'text-cyan-500'
                              }`}
                            strokeWidth={2.5}
                          />
                        )}
                      </div>
                    </div>

                    {/* Modern Trend Badge */}
                    {stat.trend !== 'stable' && (
                      <div className={`flex items-center space-x-1 text-xs font-bold px-3 py-1.5 rounded-full border shadow-sm backdrop-blur-md
                        ${stat.trend === 'up'
                          ? 'bg-green-500/10 text-green-600 border-green-500/20 dark:text-green-400'
                          : 'bg-red-500/10 text-red-600 border-red-500/20 dark:text-red-400'}`}
                      >
                        {TrendIcon && <TrendIcon size={14} strokeWidth={3} />}
                        <span>{Math.round(stat.change)}%</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-1">
                    <h3 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white font-mono tabular-nums tracking-tighter group-hover:scale-105 origin-left transition-transform duration-500">
                      <AnimatedNumber value={stat.rawValue} formatFn={stat.formatFn} />
                    </h3>
                    <p className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 opacity-80 group-hover:opacity-100 transition-opacity">
                      {stat.label}
                    </p>
                  </div>

                  <p className="mt-4 text-xs md:text-sm leading-relaxed text-slate-400 dark:text-slate-500 line-clamp-2 min-h-[2.5rem]">
                    {stat.description}
                  </p>

                  {/* Enhanced Status Indicator */}
                  <div className="mt-6 pt-6 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="relative">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <div className="absolute inset-0 w-2 h-2 bg-green-500 rounded-full animate-ping opacity-75"></div>
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">{t('Live')}</span>
                    </div>
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <Activity size={12} className="text-slate-300 dark:text-slate-600 animate-pulse" />
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="card"
      >
        <div className="mb-6">
          <h2 className="text-xl md:text-2xl lg:text-3xl font-bold font-display tracking-tight text-slate-900 dark:text-white mb-2">{t('Quick Actions')}</h2>
          <p className="text-xs md:text-sm lg:text-base text-slate-500 dark:text-slate-400 mb-6 md:mb-8 max-w-2xl">
            {t('Everything you need to manage your assets on Arc')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          {/* Swap Action */}
          <div
            onClick={() => setActiveTab('swap')}
            className="group relative overflow-hidden rounded-3xl p-6 md:p-8 bg-white shadow-sm hover:shadow-2xl hover:shadow-blue-200/50 dark:hover:shadow-blue-900/20 transition-all duration-500 dark:bg-slate-900/40 backdrop-blur-xl hover:-translate-y-2 cursor-pointer"
          >
            <div className={`absolute -top-20 -left-20 w-48 h-48 bg-gradient-to-br from-blue-500 to-blue-600 opacity-[0.04] dark:opacity-[0.1] group-hover:opacity-20 blur-[60px] transition-all duration-700 rounded-full`}></div>
            <div className={`absolute -top-20 -right-20 w-48 h-48 bg-gradient-to-bl from-blue-500 to-blue-600 opacity-[0.04] dark:opacity-[0.1] group-hover:opacity-20 blur-[60px] transition-all duration-700 rounded-full`}></div>
            <div className={`absolute -bottom-20 -left-20 w-48 h-48 bg-gradient-to-tr from-blue-500 to-blue-600 opacity-[0.04] dark:opacity-[0.1] group-hover:opacity-20 blur-[60px] transition-all duration-700 rounded-full`}></div>
            <div className={`absolute -bottom-20 -right-20 w-48 h-48 bg-gradient-to-tl from-blue-500 to-blue-600 opacity-[0.04] dark:opacity-[0.1] group-hover:opacity-20 blur-[60px] transition-all duration-700 rounded-full`}></div>

            <div className="relative z-10">
              <div className="relative w-14 h-14 flex items-center justify-center mb-6">
                <div className={`absolute inset-0 bg-gradient-to-br from-blue-500 to-blue-600 opacity-20 blur-xl rounded-full group-hover:opacity-40 group-hover:scale-150 transition-all duration-700`}></div>
                <div className="relative z-10 group-hover:scale-125 group-hover:-rotate-12 transition-all duration-500">
                  <ArrowLeftRight size={32} className="text-blue-500" strokeWidth={2.5} />
                </div>
              </div>
              <h3 className="font-black text-xl md:text-2xl mb-2 text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors uppercase tracking-tight">
                {t('Swap Tokens')}
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
                {t('Exchange tokens instantly at the best rates')}
              </p>
              <div className="flex items-center text-blue-600 dark:text-blue-400 text-xs font-bold uppercase tracking-widest">
                <span>{t('Start swapping')}</span>
                <ArrowUpRight className="ml-2 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" size={16} strokeWidth={3} />
              </div>
            </div>
          </div>

          {/* Bridge Action */}
          <div
            onClick={() => setActiveTab('bridge')}
            className="group relative overflow-hidden rounded-3xl p-6 md:p-8 bg-white shadow-sm hover:shadow-2xl hover:shadow-cyan-200/50 dark:hover:shadow-cyan-900/20 transition-all duration-500 dark:bg-slate-900/40 backdrop-blur-xl hover:-translate-y-2 cursor-pointer"
          >
            <div className={`absolute -top-20 -left-20 w-48 h-48 bg-gradient-to-br from-cyan-500 to-blue-600 opacity-[0.04] dark:opacity-[0.1] group-hover:opacity-20 blur-[60px] transition-all duration-700 rounded-full`}></div>
            <div className={`absolute -top-20 -right-20 w-48 h-48 bg-gradient-to-bl from-cyan-500 to-blue-600 opacity-[0.04] dark:opacity-[0.1] group-hover:opacity-20 blur-[60px] transition-all duration-700 rounded-full`}></div>
            <div className={`absolute -bottom-20 -left-20 w-48 h-48 bg-gradient-to-tr from-cyan-500 to-blue-600 opacity-[0.04] dark:opacity-[0.1] group-hover:opacity-20 blur-[60px] transition-all duration-700 rounded-full`}></div>
            <div className={`absolute -bottom-20 -right-20 w-48 h-48 bg-gradient-to-tl from-cyan-500 to-blue-600 opacity-[0.04] dark:opacity-[0.1] group-hover:opacity-20 blur-[60px] transition-all duration-700 rounded-full`}></div>

            <div className="relative z-10">
              <div className="relative w-14 h-14 flex items-center justify-center mb-6">
                <div className={`absolute inset-0 bg-gradient-to-br from-cyan-500 to-blue-600 opacity-20 blur-xl rounded-full group-hover:opacity-40 group-hover:scale-150 transition-all duration-700`}></div>
                <div className="relative z-10 group-hover:scale-125 group-hover:-rotate-12 transition-all duration-500">
                  <ArrowUpDown size={32} className="text-cyan-500" strokeWidth={2.5} />
                </div>
              </div>
              <h3 className="font-black text-xl md:text-2xl mb-2 text-slate-900 dark:text-white group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors uppercase tracking-tight">
                {t('Bridge Assets')}
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
                {t('Transfer assets between Sepolia and Arc Testnet')}
              </p>
              <div className="flex items-center text-cyan-600 dark:text-cyan-400 text-xs font-bold uppercase tracking-widest">
                <span>{t('Start bridging')}</span>
                <ArrowUpRight className="ml-2 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" size={16} strokeWidth={3} />
              </div>
            </div>
          </div>

          {/* Liquidity Action */}
          <div
            onClick={() => setActiveTab('liquidity')}
            className="group relative overflow-hidden rounded-3xl p-6 md:p-8 bg-white shadow-sm hover:shadow-2xl hover:shadow-indigo-200/50 dark:hover:shadow-indigo-900/20 transition-all duration-500 dark:bg-slate-900/40 backdrop-blur-xl hover:-translate-y-2 cursor-pointer"
          >
            <div className={`absolute -top-20 -left-20 w-48 h-48 bg-gradient-to-br from-indigo-500 to-blue-600 opacity-[0.04] dark:opacity-[0.1] group-hover:opacity-20 blur-[60px] transition-all duration-700 rounded-full`}></div>
            <div className={`absolute -top-20 -right-20 w-48 h-48 bg-gradient-to-bl from-indigo-500 to-blue-600 opacity-[0.04] dark:opacity-[0.1] group-hover:opacity-20 blur-[60px] transition-all duration-700 rounded-full`}></div>
            <div className={`absolute -bottom-20 -left-20 w-48 h-48 bg-gradient-to-tr from-indigo-500 to-blue-600 opacity-[0.04] dark:opacity-[0.1] group-hover:opacity-20 blur-[60px] transition-all duration-700 rounded-full`}></div>
            <div className={`absolute -bottom-20 -right-20 w-48 h-48 bg-gradient-to-tl from-indigo-500 to-blue-600 opacity-[0.04] dark:opacity-[0.1] group-hover:opacity-20 blur-[60px] transition-all duration-700 rounded-full`}></div>

            <div className="relative z-10">
              <div className="relative w-14 h-14 flex items-center justify-center mb-6">
                <div className={`absolute inset-0 bg-gradient-to-br from-indigo-500 to-blue-600 opacity-20 blur-xl rounded-full group-hover:opacity-40 group-hover:scale-150 transition-all duration-700`}></div>
                <div className="relative z-10 group-hover:scale-125 group-hover:-rotate-12 transition-all duration-500">
                  <Droplet size={32} className="text-indigo-500 dark:text-indigo-400" strokeWidth={2.5} />
                </div>
              </div>
              <h3 className="font-black text-xl md:text-2xl mb-2 text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors uppercase tracking-tight">
                {t('Add Liquidity')}
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
                {t('Provide liquidity to earn passive income')}
              </p>
              <div className="flex items-center text-indigo-600 dark:text-indigo-400 text-xs font-bold uppercase tracking-widest">
                <span>{t('Start earning')}</span>
                <ArrowUpRight className="ml-2 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" size={16} strokeWidth={3} />
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Why Arc Network Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="card mt-8 md:mt-12"
      >
        <div className="mb-6">
          <h2 className="text-xl md:text-2xl lg:text-3xl font-bold font-display tracking-tight text-slate-900 dark:text-white mb-2">{t('Why Arc Network')}</h2>
          <p className="text-xs md:text-sm lg:text-base text-slate-500 dark:text-slate-400 mb-6 md:mb-8 max-w-2xl">{t('Experience the next generation of blockchain infrastructure')}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          {/* Lightning Fast */}
          <div className="group relative overflow-hidden rounded-3xl p-6 md:p-8 bg-white shadow-sm hover:shadow-2xl hover:shadow-blue-200/50 dark:hover:shadow-blue-900/20 transition-all duration-500 dark:bg-slate-900/40 backdrop-blur-xl hover:-translate-y-2">
            <div className={`absolute -top-20 -left-20 w-48 h-48 bg-gradient-to-br from-blue-500 to-blue-600 opacity-[0.04] dark:opacity-[0.1] group-hover:opacity-20 blur-[60px] transition-all duration-700 rounded-full`}></div>
            <div className={`absolute -top-20 -right-20 w-48 h-48 bg-gradient-to-bl from-blue-500 to-blue-600 opacity-[0.04] dark:opacity-[0.1] group-hover:opacity-20 blur-[60px] transition-all duration-700 rounded-full`}></div>
            <div className={`absolute -bottom-20 -left-20 w-48 h-48 bg-gradient-to-tr from-blue-500 to-blue-600 opacity-[0.04] dark:opacity-[0.1] group-hover:opacity-20 blur-[60px] transition-all duration-700 rounded-full`}></div>
            <div className={`absolute -bottom-20 -right-20 w-48 h-48 bg-gradient-to-tl from-blue-500 to-blue-600 opacity-[0.04] dark:opacity-[0.1] group-hover:opacity-20 blur-[60px] transition-all duration-700 rounded-full`}></div>

            <div className="relative z-10">
              <div className="relative w-14 h-14 flex items-center justify-center mb-6">
                <div className={`absolute inset-0 bg-gradient-to-br from-blue-500 to-blue-600 opacity-20 blur-xl rounded-full group-hover:opacity-40 group-hover:scale-150 transition-all duration-700`}></div>
                <div className="relative z-10 group-hover:scale-125 group-hover:-rotate-12 transition-all duration-500">
                  <Zap size={32} className="text-blue-500" strokeWidth={2.5} />
                </div>
              </div>
              <h3 className="font-black text-xl md:text-2xl mb-2 text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors uppercase tracking-tight">{t('Lightning Fast')}</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">{t('Sub-second finality with transaction speeds up to 1000x faster than traditional blockchains.')}</p>
            </div>
          </div>

          {/* USDC Gas Fee */}
          <div className="group relative overflow-hidden rounded-3xl p-6 md:p-8 bg-white shadow-sm hover:shadow-2xl hover:shadow-green-200/50 dark:hover:shadow-green-900/20 transition-all duration-500 dark:bg-slate-900/40 backdrop-blur-xl hover:-translate-y-2">
            <div className={`absolute -top-20 -left-20 w-48 h-48 bg-gradient-to-br from-green-500 to-green-600 opacity-[0.04] dark:opacity-[0.1] group-hover:opacity-20 blur-[60px] transition-all duration-700 rounded-full`}></div>
            <div className={`absolute -top-20 -right-20 w-48 h-48 bg-gradient-to-bl from-green-500 to-green-600 opacity-[0.04] dark:opacity-[0.1] group-hover:opacity-20 blur-[60px] transition-all duration-700 rounded-full`}></div>
            <div className={`absolute -bottom-20 -left-20 w-48 h-48 bg-gradient-to-tr from-green-500 to-green-600 opacity-[0.04] dark:opacity-[0.1] group-hover:opacity-20 blur-[60px] transition-all duration-700 rounded-full`}></div>
            <div className={`absolute -bottom-20 -right-20 w-48 h-48 bg-gradient-to-tl from-green-500 to-green-600 opacity-[0.04] dark:opacity-[0.1] group-hover:opacity-20 blur-[60px] transition-all duration-700 rounded-full`}></div>

            <div className="relative z-10">
              <div className="relative w-14 h-14 flex items-center justify-center mb-6">
                <div className={`absolute inset-0 bg-gradient-to-br from-green-500 to-green-600 opacity-20 blur-xl rounded-full group-hover:opacity-40 group-hover:scale-150 transition-all duration-700`}></div>
                <div className="relative z-10 group-hover:scale-125 group-hover:-rotate-12 transition-all duration-500">
                  <Coins size={32} className="text-green-500" strokeWidth={2.5} />
                </div>
              </div>
              <h3 className="font-black text-xl md:text-2xl mb-2 text-slate-900 dark:text-white group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors uppercase tracking-tight">{t('USDC Gas Fee')}</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">{t('Predictable transaction costs with stablecoin-based gas fees for better UX.')}</p>
            </div>
          </div>

          {/* Enterprise Grade */}
          <div className="group relative overflow-hidden rounded-3xl p-6 md:p-8 bg-white shadow-sm hover:shadow-2xl hover:shadow-purple-200/50 dark:hover:shadow-purple-900/20 transition-all duration-500 dark:bg-slate-900/40 backdrop-blur-xl hover:-translate-y-2">
            <div className={`absolute -top-20 -left-20 w-48 h-48 bg-gradient-to-br from-purple-500 to-purple-600 opacity-[0.04] dark:opacity-[0.1] group-hover:opacity-20 blur-[60px] transition-all duration-700 rounded-full`}></div>
            <div className={`absolute -top-20 -right-20 w-48 h-48 bg-gradient-to-bl from-purple-500 to-purple-600 opacity-[0.04] dark:opacity-[0.1] group-hover:opacity-20 blur-[60px] transition-all duration-700 rounded-full`}></div>
            <div className={`absolute -bottom-20 -left-20 w-48 h-48 bg-gradient-to-tr from-purple-500 to-purple-600 opacity-[0.04] dark:opacity-[0.1] group-hover:opacity-20 blur-[60px] transition-all duration-700 rounded-full`}></div>
            <div className={`absolute -bottom-20 -right-20 w-48 h-48 bg-gradient-to-tl from-purple-500 to-purple-600 opacity-[0.04] dark:opacity-[0.1] group-hover:opacity-20 blur-[60px] transition-all duration-700 rounded-full`}></div>

            <div className="relative z-10">
              <div className="relative w-14 h-14 flex items-center justify-center mb-6">
                <div className={`absolute inset-0 bg-gradient-to-br from-purple-500 to-purple-600 opacity-20 blur-xl rounded-full group-hover:opacity-40 group-hover:scale-150 transition-all duration-700`}></div>
                <div className="relative z-10 group-hover:scale-125 group-hover:-rotate-12 transition-all duration-500">
                  <Building2 size={32} className="text-purple-500" strokeWidth={2.5} />
                </div>
              </div>
              <h3 className="font-black text-xl md:text-2xl mb-2 text-slate-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors uppercase tracking-tight">{t('Enterprise Grade')}</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">{t('Built for institutional use with advanced security and compliance features.')}</p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Home;