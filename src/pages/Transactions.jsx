import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useWallet } from '../contexts/WalletContext';
import { Copy, ExternalLink, CheckCircle, Clock, XCircle, Filter } from 'lucide-react';
import { motion } from 'framer-motion';
import { timeAgo, formatAddress, copyToClipboard, getExplorerUrl } from '../utils/blockchain';

const Transactions = () => {
  const { t } = useTranslation();
  const { isConnected, walletAddress, chainId } = useWallet();
  const [activeTab, setActiveTab] = useState('my');
  const [copiedHash, setCopiedHash] = useState('');

  // Activity data - stored in localStorage for persistence
  const [myTransactions, setMyTransactions] = useState(() => {
    const saved = localStorage.getItem('myTransactions');
    return saved ? JSON.parse(saved) : [];
  });

  const [allTransactions] = useState([]);

  // Persist my activity
  useEffect(() => {
    localStorage.setItem('myTransactions', JSON.stringify(myTransactions));
  }, [myTransactions]);

  const handleCopyHash = async (hash) => {
    const success = await copyToClipboard(hash);
    if (success) {
      setCopiedHash(hash);
      setTimeout(() => setCopiedHash(''), 2000);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="text-green-600" size={20} />;
      case 'pending':
        return <Clock className="text-yellow-600 animate-pulse" size={20} />;
      case 'failed':
        return <XCircle className="text-red-600" size={20} />;
      default:
        return null;
    }
  };

  // const getTypeColor = (type) => {
  //   switch (type) {
  //     case 'Swap':
  //       return 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400';
  //     case 'Bridge':
  //       return 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400';
  //     case 'Add LP':
  //       return 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400';
  //     case 'Remove LP':
  //       return 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400';
  //     default:
  //       return 'bg-gray-100 dark:bg-gray-900/30 text-gray-600 dark:text-gray-400';
  //   }
  // };

  const currentActivity = activeTab === 'my' ? myTransactions : allTransactions;
  const filteredActivity = currentActivity;

  return (
    <div className="max-w-6xl mx-auto w-full">
      {/* Header with Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold mb-2">{t('Transactions')}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {activeTab === 'my' ? t('My Transactions') : t('All Transactions')}
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex gap-4 md:gap-8 bg-transparent">
            <button
              onClick={() => setActiveTab('my')}
              className={`pb-3 text-sm font-medium ${activeTab === 'my' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700 dark:hover:text-white'}`}
            >
              {t('My Transactions')}
            </button>
            <button
              onClick={() => setActiveTab('all')}
              className={`pb-3 text-sm font-medium ${activeTab === 'all' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700 dark:hover:text-white'}`}
            >
              {t('All Transactions')}
            </button>
          </div>
        </div>
      </div>

      {/* Activity Table */}
      <div className="card overflow-x-auto">
        {filteredActivity.length > 0 ? (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-3 md:py-4 text-xs md:text-sm">Type</th>
                <th className="text-left py-3 md:py-4 text-xs md:text-sm">From</th>
                <th className="text-left py-3 md:py-4 text-xs md:text-sm">To</th>
                <th className="text-left py-3 md:py-4 text-xs md:text-sm">Amount</th>
                <th className="text-left py-3 md:py-4 text-xs md:text-sm">Time</th>
                <th className="text-left py-3 md:py-4 text-xs md:text-sm">Status</th>
                <th className="text-left py-3 md:py-4 text-xs md:text-sm">Transaction Hash</th>
                {activeTab === 'all' && <th className="text-left py-3 md:py-4 text-xs md:text-sm">Address</th>}
              </tr>
            </thead>
            <tbody>
              {filteredActivity.map((tx, index) => (
                <motion.tr
                  key={tx.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                >
                  <td className="py-3 md:py-4">
                    <span className={`px-2 py-1 md:px-3 md:py-1 rounded-full text-xs font-semibold ${getTypeColor(tx.type)}`}>
                      {tx.type}
                    </span>
                  </td>
                  <td className="py-3 md:py-4 text-xs md:text-sm font-medium">{tx.from}</td>
                  <td className="py-3 md:py-4 text-xs md:text-sm font-medium">{tx.to}</td>
                  <td className="py-3 md:py-4 text-xs md:text-sm font-semibold">{tx.amount}</td>
                  <td className="py-3 md:py-4 text-xs md:text-sm text-gray-500">{timeAgo(tx.timestamp)}</td>
                  <td className="py-3 md:py-4">
                    <div className="flex items-center space-x-1 md:space-x-2">
                      {getStatusIcon(tx.status)}
                      <span className="capitalize text-xs md:text-sm">{tx.status}</span>
                    </div>
                  </td>
                  <td className="py-3 md:py-4">
                    <div className="flex items-center space-x-1 md:space-x-2">
                      <button
                        onClick={() => handleCopyHash(tx.hash)}
                        className="font-mono text-xs md:text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center space-x-1"
                        title="Copy"
                      >
                        <span>{formatAddress(tx.hash)}</span>
                        {copiedHash === tx.hash ? (
                          <CheckCircle size={12} className="text-green-600" />
                        ) : (
                          <Copy size={12} />
                        )}
                      </button>
                      {/* <a
                        href={getExplorerUrl(tx.hash, chainId || '0xaa36a7')}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-500 hover:text-blue-600"
                        title="View on Explorer"
                      >
                        <ExternalLink size={12} />
                      </a> */}
                    </div>
                  </td>
                  {activeTab === 'all' && (
                    <td className="py-3 md:py-4 font-mono text-xs md:text-sm">{formatAddress(tx.address)}</td>
                  )}
                </motion.tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="text-center py-8 md:py-12">
            <p className="text-gray-500 mb-2">{t('activity.noActivityFound')}</p>
            <p className="text-sm text-gray-400">
              {activeTab === 'my' && !isConnected
                ? t('Please connect your wallet first')
                : t('Transactions will appear here')}
            </p>
          </div>
        )}
      </div>

      {/* Info Banner */}
      {activeTab === 'all' && (
        <div className="mt-4 md:mt-6 p-3 md:p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <p className="text-xs md:text-sm text-blue-600 dark:text-blue-400">
            <strong>{t('Live Feed')}:</strong> {t('activity.liveFeed')}
          </p>
        </div>
      )}
    </div>
  );
};

export default Transactions;