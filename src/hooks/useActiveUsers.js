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
      // Count current active users from IndexedDB (source of truth)
      const currentCount = await getActiveUsers();

      // Get previous count from IndexedDB cache (for percentage calculation)
      let previousCount = null;
      try {
        const cached = await getItem(CACHE_KEY);
        if (cached && cached.value !== undefined) {
          previousCount = cached.value;
        }
      } catch (err) {
        // Fallback to localStorage
        try {
          const localCached = getItemSync(CACHE_KEY);
          if (localCached) {
            const parsed = typeof localCached === 'string' ? JSON.parse(localCached) : localCached;
            if (parsed && parsed.value !== undefined) {
              previousCount = parsed.value;
            }
          }
        } catch (e) {
          // Ignore cache errors
        }
      }

      // Set the count state (real count only)
      setActiveUsers(currentCount);

      // Calculate percentage change
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

      // Cache the count in IndexedDB
      await setItem(CACHE_KEY, {
        value: currentCount,
        timestamp: Date.now(),
      });

      setLoading(false);
    } catch (err) {
      console.error('Error updating active users:', err);
      setActiveUsers(0);
      setLoading(false);
    }
  };

  useEffect(() => {
    // Initial load
    updateActiveUsers();

    // Refresh on mount and poll every 30 seconds
    intervalRef.current = setInterval(() => {
      updateActiveUsers();
    }, 30000);

    // Load cached value immediately on mount (before first calculation)
    const loadCachedValue = async (retryCount = 0) => {
      try {
        // Wait a bit for IndexedDB to initialize if first attempt
        if (retryCount === 0) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }

        const cached = await getItem(CACHE_KEY);
        if (cached && cached.value !== undefined) {
          setActiveUsers(cached.value);
          setLoading(false);
          return true;
        }

        // Try localStorage fallback
        try {
          const localCached = getItemSync(CACHE_KEY);
          if (localCached) {
            const parsed = typeof localCached === 'string' ? JSON.parse(localCached) : localCached;
            if (parsed && parsed.value !== undefined) {
              setActiveUsers(parsed.value);
              setLoading(false);
              // Migrate to IndexedDB
              await setItem(CACHE_KEY, parsed);
              return true;
            }
          }
        } catch (e) {
          // Ignore
        }

        return false;
      } catch (err) {
        // Retry once if first attempt failed
        if (retryCount === 0) {
          setTimeout(() => loadCachedValue(1), 300);
        }
        return false;
      }
    };

    // Load cached value first, then update
    loadCachedValue().then(() => {
      // Initial count calculation (with delay to ensure transactions are loaded)
      setTimeout(() => {
        updateActiveUsers();
      }, 200);
    });

    // Update every hour
    intervalRef.current = setInterval(() => {
      updateActiveUsers();
    }, CACHE_DURATION);

    // Listen for custom events when transactions are saved
    const handleTransactionSaved = () => {
      setTimeout(updateActiveUsers, 100);
    };
    window.addEventListener('bridgeTransactionSaved', handleTransactionSaved);
    window.addEventListener('swapTransactionSaved', handleTransactionSaved);
    window.addEventListener('lpTransactionSaved', handleTransactionSaved);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      window.removeEventListener('bridgeTransactionSaved', handleTransactionSaved);
      window.removeEventListener('swapTransactionSaved', handleTransactionSaved);
      window.removeEventListener('lpTransactionSaved', handleTransactionSaved);
    };
  }, []);

  return { activeUsers, change, trend, loading };
}
