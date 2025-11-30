import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useWallet } from '../contexts/WalletContext';
import { Plus, Minus, TrendingUp, DollarSign, PieChart, Activity, Filter, Search, ChevronDown, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { TOKENS } from '../config/networks';
import { formatCurrency } from '../utils/blockchain';

const Liquidity = () => {
  const { t } = useTranslation();
  const { isConnected } = useWallet();
  const [activeTab, setActiveTab] = useState('positions');
  const [showAddLiquidity, setShowAddLiquidity] = useState(false);
  const [filterType, setFilterType] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Enhanced positions data with pool types and fee tiers
  const positions = [
    {
      id: 1,
      pair: 'ETH/USDC',
      poolType: 'Standard',
      liquidity: 5000,
      share: 0.12,
      feesEarned: 45.30,
      apr: 24.5,
      feeTier: 0.3,
      priceRange: null,
      token1: 'ETH',
      token2: 'USDC',
      amount1: '2.5',
      amount2: '5000',
      status: 'Active',
      unclaimedFees: 12.50
    },
    {
      id: 2,
      pair: 'USDC/USDT',
      poolType: 'Stable',
      liquidity: 10000,
      share: 0.08,
      feesEarned: 12.50,
      apr: 8.2,
      feeTier: 0.05,
      priceRange: null,
      token1: 'USDC',
      token2: 'USDT',
      amount1: '5000',
      amount2: '5000',
      status: 'Active',
      unclaimedFees: 3.20
    },
    {
      id: 3,
      pair: 'ETH/DAI',
      poolType: 'Concentrated',
      liquidity: 7500,
      share: 0.15,
      feesEarned: 68.40,
      apr: 32.1,
      feeTier: 0.3,
      priceRange: { min: 2500, max: 3000 },
      token1: 'ETH',
      token2: 'DAI',
      amount1: '1.8',
      amount2: '5200',
      status: 'Out of Range',
      unclaimedFees: 22.75
    },
  ];

  // Mock portfolio data
  const portfolio = {
    totalValue: 15000,
    assets: [
      { token: 'ETH', balance: '5.234', value: 10468, change: 2.3 },
      { token: 'USDC', balance: '2500', value: 2500, change: 0.0 },
      { token: 'USDT', balance: '1500', value: 1500, change: -0.1 },
      { token: 'DAI', balance: '532', value: 532, change: 0.2 },
    ],
  };

  // Filter positions based on type and search term
  const filteredPositions = positions.filter(position => {
    const matchesType = filterType === 'all' || position.poolType === filterType;
    const matchesSearch = position.pair.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         position.token1.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         position.token2.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesType && matchesSearch;
  });

  // Get status badge class
  const getStatusClass = (status) => {
    switch (status) {
      case 'Active':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'Out of Range':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'Inactive':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  // Get pool type badge class
  const getPoolTypeClass = (type) => {
    switch (type) {
      case 'Standard':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case 'Concentrated':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400';
      case 'Stable':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  return (
    <div className="max-w-6xl mx-auto flex items-center justify-center h-full">
      <div className="text-center py-20">
        <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-4">
          {t('comingSoon')}
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          {t('liquidityFeatureComingSoon')}
        </p>
      </div>
    </div>
  );
};

export default Liquidity;