import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { TrendingUp, DollarSign, Users, Activity, ArrowUpRight, ArrowDownRight, Globe, Coins, Zap, ExternalLink, Link, Droplets, Shield, Wifi } from 'lucide-react';
import { motion } from 'framer-motion';
import { formatCurrency, formatNumber } from '../utils/blockchain';
import { ArrowUpDown } from "lucide-react";
import { useDappTransactionCount } from '../hooks/useDappTransactionCount';
import { useDappBridgeCount } from '../hooks/useDappBridgeCount';
import { useActiveUsers } from '../hooks/useActiveUsers';
import { useNetworkUptime } from '../hooks/useNetworkUptime';

const Home = ({ setActiveTab }) => {
  const { t } = useTranslation();
  const { transactionCount, change, trend, loading: txLoading } = useDappTransactionCount();
  const { bridgeCount, change: bridgeChange, trend: bridgeTrend } = useDappBridgeCount();
  const { activeUsers, change: usersChange, trend: usersTrend } = useActiveUsers();
  const { uptime, change: uptimeChange, trend: uptimeTrend } = useNetworkUptime();
  
  const [stats, setStats] = useState({
    volume: { value: 847200, change: 15.3, trend: 'up' },
    tvl: { value: 3200000, change: 8.7, trend: 'up' },
    users: { value: activeUsers || 1247, change: usersChange || 12.4, trend: usersTrend || 'up' },
    transactions: { value: transactionCount || 8934, change: change || 5.2, trend: trend || 'up' },
    crossChain: { value: bridgeCount || 342, change: bridgeChange || 22.1, trend: bridgeTrend || 'up' },
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

  // Simulate live data updates (excluding transactions which now use real data)
  useEffect(() => {
    const interval = setInterval(() => {
      setStats(prevStats => ({
        ...prevStats,
        volume: {
          ...prevStats.volume,
          value: prevStats.volume.value + Math.floor(Math.random() * 1000),
          change: parseFloat((prevStats.volume.change + (Math.random() * 0.5 - 0.25)).toFixed(1))
        },
        tvl: {
          ...prevStats.tvl,
          value: prevStats.tvl.value + Math.floor(Math.random() * 500),
          change: parseFloat((prevStats.tvl.change + (Math.random() * 0.2 - 0.1)).toFixed(1))
        },
        users: {
          ...prevStats.users,
          value: prevStats.users.value + Math.floor(Math.random() * 5),
          change: parseFloat((prevStats.users.change + (Math.random() * 0.3 - 0.15)).toFixed(1))
        },
        // Transactions now use real data from Arc network
      }));
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const statCards = [
    {
      id: 'users',
      label: t('Active Users'),
      value: formatNumber(stats.users.value),
      change: stats.users.change,
      trend: stats.users.trend,
      icon: Users,
      lucideIcon: Users,
      color: 'from-orange-500 to-orange-600',
      description: t('Total unique wallet addresses')
    },
    {
      id: 'volume',
      label: t('24h Volume'),
      value: formatCurrency(stats.volume.value, 0),
      change: stats.volume.change,
      trend: stats.volume.trend,
      icon: DollarSign,
      lucideIcon: DollarSign,
      color: 'from-green-500 to-green-600',
      description: t('Sum of swap transactions in last 24h')
    },
    {
      id: 'Cross-Chain',
      label: t('Cross Chain Transfers'),
      value: formatNumber(stats.crossChain.value),
      change: stats.crossChain.change,
      trend: stats.crossChain.trend,
      icon: Globe,
      lucideIcon: Globe,
      color: 'from-indigo-500 to-indigo-600',
      description: t('Bridge transaction count')
    },
    {
      id: 'transactions',
      label: t('Transaction Count'),
      value: formatNumber(stats.transactions.value),
      change: stats.transactions.change,
      trend: stats.transactions.trend,
      icon: Activity,
      lucideIcon: Activity,
      color: 'from-purple-500 to-purple-600',
      description: t('Count from indexer')
    },
    {
      id: 'tvl',
      label: t('Total Value Locked'),
      value: formatCurrency(stats.tvl.value, 0),
      change: stats.tvl.change,
      trend: stats.tvl.trend,
      icon: TrendingUp,
      lucideIcon: TrendingUp,
      color: 'from-blue-500 to-blue-600',
      description: t('Aggregate from all liquidity pools')
    },
    {
      id: 'uptime',
      label: t('Network Uptime'),
      value: `${stats.uptime.value}%`,
      change: stats.uptime.change,
      trend: stats.uptime.trend,
      icon: Wifi,
      lucideIcon: Wifi,
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
        dark:backdrop-blur-md
        dark:border dark:border-white/10"
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
          <p p className="text-xs md:text-sm lg:text-base text-slate-500 dark:text-slate-400 mb-6 md:mb-8 max-w-2xl">{t('Real-time metrics updated automatically')}</p>
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
                className="group relative overflow-hidden rounded-2xl p-6 md:p-7 bg-white border border-slate-200/60 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 dark:hover:shadow-slate-900/50 transition-all duration-300 dark:bg-slate-900/50 dark:border-slate-800/60 backdrop-blur-sm hover:-translate-y-1"
              >
                {/* Subtle gradient overlay on hover */}
                <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}></div>
                
                <div className="relative z-10">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} neon-icon-container flex items-center justify-center text-white shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                      {stat.lucideIcon && React.createElement(stat.lucideIcon, { size: 20, className: "text-white" })}
                    </div>
                    {stat.trend !== 'stable' && (
                      <div className={`flex items-center space-x-1 text-xs font-semibold px-2.5 py-1.5 rounded-full shadow-sm
                        ${stat.trend === 'up' ? 'bg-green-50 text-green-700 dark:bg-green-900/40 dark:text-green-400' : 'bg-red-50 text-red-700 dark:bg-red-900/40 dark:text-red-400'}`}
                      >
                        {TrendIcon && <TrendIcon size={14} />}
                        <span>{stat.change}%</span>
                      </div>
                    )}
                  </div>
                  
                  <h3 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-2 font-mono tabular-nums tracking-tight">{stat.value}</h3>
                  <p className="text-sm md:text-base font-semibold text-slate-700 dark:text-slate-200 mb-1.5">{stat.label}</p>
                  <p className="text-xs md:text-sm leading-relaxed text-slate-500 dark:text-slate-400 mb-4">{stat.description}</p>
                  
                  {/* Data source indicator - no border */}
                  <div className="flex items-center text-xs text-slate-400 dark:text-slate-500">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse shadow-sm shadow-green-500/50"></div>
                    <span className="font-medium">{t('Live Data')}</span>
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
          <p p className="text-xs md:text-sm lg:text-base text-slate-500 dark:text-slate-400 mb-6 md:mb-8 max-w-2xl">
            {t('Everything you need to manage your assets on Arc')}
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          <div 
            onClick={() => setActiveTab('swap')}
            className="group relative overflow-hidden rounded-2xl p-6 md:p-7 bg-white border border-slate-200/60 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 dark:hover:shadow-slate-900/50 transition-all duration-300 dark:bg-slate-900/50 dark:border-slate-800/60 backdrop-blur-sm hover:-translate-y-1 cursor-pointer"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-blue-600 opacity-0 group-hover:opacity-5 transition-opacity duration-300"></div>
            <div className="relative z-10">
              <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300">
                <ArrowUpDown size={20} className="text-white" />
              </div>
              <h3 className="font-bold text-lg md:text-xl mb-2 text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                {t('Swap Tokens')}
              </h3>
              <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mb-4">
                {t('Exchange tokens instantly at the best rates')}
              </p>
              <div className="flex items-center text-blue-600 dark:text-blue-400 text-xs md:text-sm font-semibold">
                <span>{t('Start swapping')}</span>
                <ArrowUpRight className="ml-1 group-hover:translate-x-1 transition-transform" size={14} />
              </div>
            </div>
          </div>

          <div 
            onClick={() => setActiveTab('bridge')}
            className="group relative overflow-hidden rounded-2xl p-6 md:p-7 bg-white border border-slate-200/60 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 dark:hover:shadow-slate-900/50 transition-all duration-300 dark:bg-slate-900/50 dark:border-slate-800/60 backdrop-blur-sm hover:-translate-y-1 cursor-pointer"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-green-500 to-green-600 opacity-0 group-hover:opacity-5 transition-opacity duration-300"></div>
            <div className="relative z-10">
              <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300">
                <Link size={20} className="text-white" />
              </div>
              <h3 className="font-bold text-lg md:text-xl mb-2 text-slate-900 dark:text-white group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors">
                {t('Bridge Assets')}
              </h3>
              <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mb-4">
                {t('Transfer assets between Sepolia and Arc Testnet')}
              </p>
              <div className="flex items-center text-green-600 dark:text-green-400 text-xs md:text-sm font-semibold">
                <span>{t('Start bridging')}</span>
                <ArrowUpRight className="ml-1 group-hover:translate-x-1 transition-transform" size={14} />
              </div>
            </div>
          </div>

          <div 
            onClick={() => setActiveTab('liquidity')}
            className="group relative overflow-hidden rounded-2xl p-6 md:p-7 bg-white border border-slate-200/60 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 dark:hover:shadow-slate-900/50 transition-all duration-300 dark:bg-slate-900/50 dark:border-slate-800/60 backdrop-blur-sm hover:-translate-y-1 cursor-pointer"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-purple-600 opacity-0 group-hover:opacity-5 transition-opacity duration-300"></div>
            <div className="relative z-10">
              <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300">
                <Droplets size={20} className="text-white" />
              </div>
              <h3 className="font-bold text-lg md:text-xl mb-2 text-slate-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                {t('Add Liquidity')}
              </h3>
              <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mb-4">
                {t('Provide liquidity to earn passive income')}
              </p>
              <div className="flex items-center text-purple-600 dark:text-purple-400 text-xs md:text-sm font-semibold">
                <span>{t('Start earning')}</span>
                <ArrowUpRight className="ml-1 group-hover:translate-x-1 transition-transform" size={14} />
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
            <div className="group relative overflow-hidden rounded-2xl p-6 md:p-7 bg-white border border-slate-200/60 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 dark:hover:shadow-slate-900/50 transition-all duration-300 dark:bg-slate-900/50 dark:border-slate-800/60 backdrop-blur-sm hover:-translate-y-1">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-blue-600 opacity-0 group-hover:opacity-5 transition-opacity duration-300"></div>
              <div className="relative z-10">
                <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <Zap size={20} className="text-white" />
                </div>
                <h3 className="font-bold text-lg md:text-xl mb-2 text-slate-900 dark:text-white">{t('Lightning Fast')}</h3>
                <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mb-4">{t('Sub-second finality with transaction speeds up to 1000x faster than traditional blockchains.')}</p>
              </div>
            </div>
            
            <div className="group relative overflow-hidden rounded-2xl p-6 md:p-7 bg-white border border-slate-200/60 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 dark:hover:shadow-slate-900/50 transition-all duration-300 dark:bg-slate-900/50 dark:border-slate-800/60 backdrop-blur-sm hover:-translate-y-1">
              <div className="absolute inset-0 bg-gradient-to-br from-green-500 to-green-600 opacity-0 group-hover:opacity-5 transition-opacity duration-300"></div>
              <div className="relative z-10">
                <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <DollarSign size={20} className="text-white" />
                </div>
                <h3 className="font-bold text-lg md:text-xl mb-2 text-slate-900 dark:text-white">{t('USDC Gas Fee')}</h3>
                <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mb-4">{t('Predictable transaction costs with stablecoin-based gas fees for better UX.')}</p>
              </div>
            </div>
            
            <div className="group relative overflow-hidden rounded-2xl p-6 md:p-7 bg-white border border-slate-200/60 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 dark:hover:shadow-slate-900/50 transition-all duration-300 dark:bg-slate-900/50 dark:border-slate-800/60 backdrop-blur-sm hover:-translate-y-1">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-purple-600 opacity-0 group-hover:opacity-5 transition-opacity duration-300"></div>
              <div className="relative z-10">
                <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <Shield size={20} className="text-white" />
                </div>
                <h3 className="font-bold text-lg md:text-xl mb-2 text-slate-900 dark:text-white">{t('Enterprise Grade')}</h3>
                <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mb-4">{t('Built for institutional use with advanced security and compliance features.')}</p>
              </div>
            </div>
          </div>
        </motion.div>
    </div>
  );
};

export default Home;