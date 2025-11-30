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

  // Transaction data - stored in localStorage for persistence
  const [myTransactions, setMyTransactions] = useState(() => {
    const saved = localStorage.getItem('myTransactions');
    return saved ? JSON.parse(saved) : [];
  });

  const [allTransactions] = useState([]);

  // Persist my transactions
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

  const getTypeColor = (type) => {
    switch (type) {
      case 'Swap':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400';
      case 'Bridge':
        return 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400';
      case 'Add LP':
        return 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400';
      case 'Remove LP':
        return 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400';
      default:
        return 'bg-gray-100 dark:bg-gray-900/30 text-gray-600 dark:text-gray-400';
    }
  };

  const currentTransactions = activeTab === 'my' ? myTransactions : allTransactions;
  const filteredTransactions = currentTransactions;

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header with Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-3xl font-bold mb-2">{t('transactions')}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {activeTab === 'my' ? t('myTransactions') : t('allTransactions')}
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex space-x-2 bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('my')}
              className={`px-6 py-3 rounded-lg font-semibold transition-all duration-200
                ${activeTab === 'my' ? 'bg-gradient-arc text-white shadow-lg' : 'border-2 border-blue-400 text-blue-500 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20'}`}
            >
              {t('myTransactions')}
            </button>
            <button
              onClick={() => setActiveTab('all')}
              className={`px-6 py-3 rounded-lg font-semibold transition-all duration-200
                ${activeTab === 'all' ? 'bg-gradient-arc text-white shadow-lg' : 'border-2 border-blue-400 text-blue-500 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20'}`}
            >
              {t('allTransactions')}
            </button>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="card overflow-x-auto">
        {filteredTransactions.length > 0 ? (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-4">{t('type')}</th>
                <th className="text-left py-4">{t('from')}</th>
                <th className="text-left py-4">{t('to')}</th>
                <th className="text-left py-4">{t('amount')}</th>
                <th className="text-left py-4">{t('time')}</th>
                <th className="text-left py-4">{t('status')}</th>
                <th className="text-left py-4">{t('transactionHash')}</th>
                {activeTab === 'all' && <th className="text-left py-4">{t('address')}</th>}
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.map((tx, index) => (
                <motion.tr
                  key={tx.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                >
                  <td className="py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getTypeColor(tx.type)}`}>
                      {tx.type}
                    </span>
                  </td>
                  <td className="py-4 font-medium">{tx.from}</td>
                  <td className="py-4 font-medium">{tx.to}</td>
                  <td className="py-4 font-semibold">{tx.amount}</td>
                  <td className="py-4 text-sm text-gray-500">{timeAgo(tx.timestamp)}</td>
                  <td className="py-4">
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(tx.status)}
                      <span className="capitalize text-sm">{tx.status}</span>
                    </div>
                  </td>
                  <td className="py-4">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleCopyHash(tx.hash)}
                        className="font-mono text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center space-x-1"
                        title={t('copy')}
                      >
                        <span>{formatAddress(tx.hash)}</span>
                        {copiedHash === tx.hash ? (
                          <CheckCircle size={14} className="text-green-600" />
                        ) : (
                          <Copy size={14} />
                        )}
                      </button>
                      <a
                        href={getExplorerUrl(tx.hash, chainId || '0xaa36a7')}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-500 hover:text-blue-600"
                        title={t('viewOnExplorer')}
                      >
                        <ExternalLink size={14} />
                      </a>
                    </div>
                  </td>
                  {activeTab === 'all' && (
                    <td className="py-4 font-mono text-sm">{formatAddress(tx.address)}</td>
                  )}
                </motion.tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-2">{t('noTransactionsFound')}</p>
            <p className="text-sm text-gray-400">
              {activeTab === 'my' && !isConnected
                ? t('connectWalletFirst')
                : t('transactionsWillAppear')}
            </p>
          </div>
        )}
      </div>

      {/* Info Banner */}
      {activeTab === 'all' && (
        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <p className="text-sm text-blue-600 dark:text-blue-400">
            <strong>{t('liveFeed')}:</strong> {t('displayingRealTime')}
          </p>
        </div>
      )}
    </div>
  );
};

export default Transactions;