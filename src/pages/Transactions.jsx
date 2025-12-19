import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useWallet } from '../contexts/WalletContext';
import { Copy, ExternalLink, CheckCircle, Clock, XCircle, ArrowLeftRight, RefreshCw, Layers } from 'lucide-react';
import { motion } from 'framer-motion';
import { timeAgo, formatAddress, copyToClipboard, getExplorerUrl } from '../utils/blockchain';
import { useTransactionHistory } from '../hooks/useTransactionHistory';

const Transactions = () => {
  const { t } = useTranslation();
  const { isConnected, walletAddress, chainId } = useWallet();
  const [copiedHash, setCopiedHash] = useState('');

  // Fetch real-time transactions from blockchain (auto-updates every 30 seconds)
  const { transactions: blockchainTransactions, loading: transactionsLoading } = useTransactionHistory();

  // Activity data - stored in localStorage for persistence (legacy)
  const [myTransactions, setMyTransactions] = useState(() => {
    const saved = localStorage.getItem('myTransactions');
    return saved ? JSON.parse(saved) : [];
  });

  // Merge blockchain transactions with localStorage transactions
  const mergedTransactions = useMemo(() => {
    const blockchainSet = new Set(blockchainTransactions.map(tx => tx.hash));
    const localOnly = myTransactions.filter(tx => !blockchainSet.has(tx.hash));
    return [...blockchainTransactions, ...localOnly].sort((a, b) => {
      const timeA = a.timestamp || 0;
      const timeB = b.timestamp || 0;
      return timeB - timeA;
    });
  }, [blockchainTransactions, myTransactions]);

  // Persist my activity (for legacy transactions)
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
        return <CheckCircle className="text-green-600 dark:text-green-400" size={20} />;
      case 'pending':
        return <Clock className="text-yellow-600 dark:text-yellow-400 animate-pulse" size={20} />;
      case 'failed':
        return <XCircle className="text-red-600 dark:text-red-400" size={20} />;
      default:
        return null;
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'Bridge':
        return <ArrowLeftRight size={16} className="mr-1.5" />;
      case 'Swap':
        return <RefreshCw size={16} className="mr-1.5" />;
      case 'Add LP':
      case 'Remove LP':
        return <Layers size={16} className="mr-1.5" />;
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

  return (
    <div className="max-w-6xl mx-auto w-full px-3 sm:px-4 md:px-0">
      {/* Header */}
      <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold mb-2">{t('Transactions')}</h1>
      </div>

      {/* Activity Table - Desktop */}
      <div className="card overflow-x-auto hidden md:block">
        {mergedTransactions.length > 0 ? (
          <table className="w-full min-w-[800px]">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-3 md:py-4 text-xs md:text-sm">Type</th>
                <th className="text-left py-3 md:py-4 text-xs md:text-sm">From</th>
                <th className="text-left py-3 md:py-4 text-xs md:text-sm">To</th>
                <th className="text-left py-3 md:py-4 text-xs md:text-sm">Amount</th>
                <th className="text-left py-3 md:py-4 text-xs md:text-sm">Time</th>
                <th className="text-left py-3 md:py-4 text-xs md:text-sm">Status</th>
                <th className="text-left py-3 md:py-4 text-xs md:text-sm">Transaction Hash</th>
              </tr>
            </thead>
            <tbody>
              {mergedTransactions.map((tx, index) => (
                <motion.tr
                  key={tx.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                >
                  <td className="py-3 md:py-4">
                    {tx.type === 'Bridge' ? (
                      <span className="text-xs md:text-sm font-medium">{tx.type}</span>
                    ) : (
                      <span className={`inline-flex items-center px-2 py-1 md:px-3 md:py-1 rounded-full text-xs font-semibold ${getTypeColor(tx.type)}`}>
                        {getTypeIcon(tx.type)}
                      {tx.type}
                    </span>
                    )}
                  </td>
                  <td className="py-3 md:py-4 text-xs md:text-sm font-medium">{tx.from}</td>
                  <td className="py-3 md:py-4 text-xs md:text-sm font-medium">{tx.to}</td>
                  <td className="py-3 md:py-4 text-xs md:text-sm font-semibold">{tx.amount}</td>
                  <td className="py-3 md:py-4 text-xs md:text-sm text-gray-500">{timeAgo(tx.timestamp)}</td>
                  <td className="py-3 md:py-4">
                    {tx.status === 'success' ? (
                      <span className="inline-flex items-center px-3 py-1.5" style={{ 
                        backgroundColor: '#E0F2F1', 
                        border: '1px solid #80CBC4',
                        borderRadius: '8px'
                      }}>
                        <span className="flex items-center justify-center w-5 h-5 rounded-full mr-2 flex-shrink-0" style={{ 
                          backgroundColor: '#00897B'
                        }}>
                          <i className="fa fa-check-circle text-white" style={{ fontSize: '12px', lineHeight: '1' }}></i>
                        </span>
                        <span className="text-xs font-semibold" style={{ color: '#00695C' }}>Success</span>
                      </span>
                    ) : (
                    <div className="flex items-center space-x-1 md:space-x-2">
                      {getStatusIcon(tx.status)}
                      <span className="capitalize text-xs md:text-sm">{tx.status}</span>
                    </div>
                    )}
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
                      <a
                        href={getExplorerUrl(tx.hash, tx.chainId || chainId || 11155111)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-500 hover:text-blue-600 dark:hover:text-blue-400"
                        title="View on Explorer"
                      >
                        <ExternalLink size={12} />
                      </a>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="text-center py-8 md:py-12">
            {transactionsLoading ? (
              <div className="flex flex-col items-center gap-2">
                <RefreshCw className="animate-spin text-blue-600 dark:text-blue-400" size={24} />
                <p className="text-gray-500 dark:text-gray-400">Loading transactions...</p>
              </div>
            ) : (
              <>
                <p className="text-gray-500 dark:text-gray-400 mb-2">{t('activity.noActivityFound')}</p>
            <p className="text-sm text-gray-400">
                  {!isConnected
                ? t('Please connect your wallet first')
                : t('Transactions will appear here')}
            </p>
              </>
            )}
          </div>
        )}
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-3 px-2">
        {mergedTransactions.length > 0 ? (
          mergedTransactions.map((tx, index) => (
            <motion.div
              key={tx.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="card p-4 space-y-3 touch-manipulation"
            >
              {/* Header Row */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {tx.type === 'Bridge' ? (
                    <span className="text-sm font-medium">{tx.type}</span>
                  ) : (
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${getTypeColor(tx.type)}`}>
                      {getTypeIcon(tx.type)}
                      {tx.type}
                    </span>
                  )}
                  {tx.status === 'success' ? (
                    <span className="inline-flex items-center px-2.5 py-1" style={{ 
                      backgroundColor: '#E0F2F1', 
                      border: '1px solid #80CBC4',
                      borderRadius: '8px'
                    }}>
                      <span className="flex items-center justify-center w-4 h-4 rounded-full mr-1.5 flex-shrink-0" style={{ 
                        backgroundColor: '#00897B'
                      }}>
                        <i className="fa fa-check-circle text-white" style={{ fontSize: '10px', lineHeight: '1' }}></i>
                      </span>
                      <span className="text-xs font-semibold" style={{ color: '#00695C' }}>Success</span>
                    </span>
                  ) : (
                    <div className="flex items-center space-x-1">
                      {getStatusIcon(tx.status)}
                      <span className="capitalize text-xs">{tx.status}</span>
                    </div>
                  )}
                </div>
                <span className="text-xs text-gray-500">{timeAgo(tx.timestamp)}</span>
              </div>

              {/* From/To Row */}
              <div className="flex items-center justify-between text-sm">
                <div className="flex-1">
                  <span className="text-gray-500 dark:text-gray-400 text-xs">From:</span>
                  <span className="ml-1 font-medium">{tx.from}</span>
                </div>
                <ArrowLeftRight size={16} className="mx-2 text-gray-400" />
                <div className="flex-1 text-right">
                  <span className="text-gray-500 dark:text-gray-400 text-xs">To:</span>
                  <span className="ml-1 font-medium">{tx.to}</span>
                </div>
              </div>

              {/* Amount */}
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500 dark:text-gray-400">Amount:</span>
                <span className="text-sm font-semibold">{tx.amount}</span>
              </div>

              {/* Transaction Hash */}
              <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500 dark:text-gray-400">Hash:</span>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleCopyHash(tx.hash)}
                      className="font-mono text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center space-x-1.5 touch-manipulation min-h-[44px] px-2"
                      title="Copy"
                    >
                      <span className="break-all">{formatAddress(tx.hash)}</span>
                      {copiedHash === tx.hash ? (
                        <CheckCircle size={14} className="text-green-600 flex-shrink-0" />
                      ) : (
                        <Copy size={14} className="flex-shrink-0" />
                      )}
                    </button>
                    <a
                      href={getExplorerUrl(tx.hash, tx.chainId || chainId || 11155111)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 touch-manipulation min-h-[44px] min-w-[44px] flex items-center justify-center"
                      title="View on Explorer"
                    >
                      <ExternalLink size={16} />
                    </a>
                  </div>
                </div>
              </div>
            </motion.div>
          ))
        ) : (
          <div className="text-center py-8">
            {transactionsLoading ? (
              <div className="flex flex-col items-center gap-2">
                <RefreshCw className="animate-spin text-blue-600 dark:text-blue-400" size={24} />
                <p className="text-gray-500 dark:text-gray-400 text-sm">Loading transactions...</p>
              </div>
            ) : (
              <>
                <p className="text-gray-500 dark:text-gray-400 mb-2 text-sm">{t('activity.noActivityFound')}</p>
                <p className="text-xs text-gray-400">
                  {!isConnected
                    ? t('Please connect your wallet first')
                    : t('Transactions will appear here')}
          </p>
              </>
            )}
        </div>
      )}
      </div>
    </div>
  );
};

export default Transactions;
