import { useState, useEffect, useRef } from 'react';
import { getItem, setItem, getItemSync } from '../utils/indexedDB';

// Cache key for IndexedDB
const CACHE_KEY = 'dapp_active_users';
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour (update hourly)
const TRANSACTIONS_KEY = 'myTransactions';

// Calculate percentage change
const calculatePercentageChange = (current, previous) => {
  if (!previous || previous === 0) return null;
  const change = ((current - previous) / previous) * 100;
  return parseFloat(change.toFixed(1));
};

// Get unique active users (all time total)
const getActiveUsers = async () => {
  try {
    const transactions = await getItem(TRANSACTIONS_KEY);
    if (!transactions || !Array.isArray(transactions)) return 0;

    // Filter for successful transactions (all time, not just 24h)
    const successfulTransactions = transactions.filter(tx =>
      tx.status === 'success' &&
      tx.address // Must have an address
    );

    // Extract unique wallet addresses (case-insensitive)
    const uniqueAddresses = new Set();
    successfulTransactions.forEach(tx => {
      if (tx.address) {
        uniqueAddresses.add(tx.address.toLowerCase());
      }
    });

    return uniqueAddresses.size;
  } catch (err) {
    console.error('Error counting active users:', err);
    return 0;
  }
};

// Lightweight hook to track active users (total unique wallet addresses)
export function useActiveUsers() {
  const [activeUsers, setActiveUsers] = useState(null);
  const [change, setChange] = useState(null);
  const [trend, setTrend] = useState('stable');
  const [loading, setLoading] = useState(true);
  const intervalRef = useRef(null);

  const updateActiveUsers = async () => {
    try {
      // Get personal and global transactions
      const [personalTxs, globalTxs] = await Promise.all([
        getItem('myTransactions'),
        getItem('globalTransactions')
      ]);

      const allTxs = [...(Array.isArray(personalTxs) ? personalTxs : []), ...(Array.isArray(globalTxs) ? globalTxs : [])];

      // Extract unique wallet addresses
      const uniqueAddresses = new Set();
      allTxs.forEach(tx => {
        if (tx.status === 'success' && (tx.address || tx.from || tx.to)) {
          const addr = tx.address || tx.from || tx.to;
          if (addr && typeof addr === 'string') {
            uniqueAddresses.add(addr.toLowerCase());
          }
        }
      });

      const currentCount = uniqueAddresses.size;

      // Get previous count from cache
      let previousCount = null;
      try {
        const cached = await getItem(CACHE_KEY);
        if (cached && cached.value !== undefined) {
          previousCount = cached.value;
        }
      } catch (err) { /* ignore */ }

      setActiveUsers(currentCount);

      if (previousCount !== null && previousCount !== currentCount && currentCount > 0) {
        const percentageChange = calculatePercentageChange(currentCount, previousCount);
        if (percentageChange !== null) {
          setChange(Math.abs(percentageChange));
          setTrend(percentageChange > 0 ? 'up' : 'down');
        }
      } else {
        setChange(null);
        setTrend('stable');
      }

      await setItem(CACHE_KEY, { value: currentCount, timestamp: Date.now() });
      setLoading(false);
    } catch (err) {
      console.error('Error updating active users:', err);
      setLoading(false);
    }
  };

  useEffect(() => {
    updateActiveUsers();

    const interval = setInterval(updateActiveUsers, 30000);

    const handleRefresh = () => {
      updateActiveUsers();
    };

    window.addEventListener('transactionSaved', handleRefresh);
    window.addEventListener('globalStatsUpdated', handleRefresh);

    return () => {
      clearInterval(interval);
      window.removeEventListener('transactionSaved', handleRefresh);
      window.removeEventListener('globalStatsUpdated', handleRefresh);
    };
  }, []);

  return { activeUsers, change, trend, loading };
}
