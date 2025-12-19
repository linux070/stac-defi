import { useState, useEffect, useRef } from 'react';

// Cache key for localStorage
const CACHE_KEY = 'dapp_active_users';
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour (update hourly for 24h window)
const TRANSACTIONS_KEY = 'myTransactions';

// Calculate percentage change
const calculatePercentageChange = (current, previous) => {
  if (!previous || previous === 0) return null;
  const change = ((current - previous) / previous) * 100;
  return parseFloat(change.toFixed(1));
};

// Get unique active users from last 24 hours
const getActiveUsers = () => {
  try {
    const saved = localStorage.getItem(TRANSACTIONS_KEY);
    if (!saved) return 0;
    
    const transactions = JSON.parse(saved);
    const now = Date.now();
    const twentyFourHoursAgo = now - (24 * 60 * 60 * 1000);
    
    // Filter for successful transactions in last 24 hours
    const recentTransactions = transactions.filter(tx => 
      tx.status === 'success' &&
      tx.timestamp &&
      tx.timestamp >= twentyFourHoursAgo &&
      tx.address // Must have an address
    );
    
    // Extract unique wallet addresses (case-insensitive)
    const uniqueAddresses = new Set();
    recentTransactions.forEach(tx => {
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

// Lightweight hook to track active users (unique wallet addresses in 24h)
export function useActiveUsers() {
  const [activeUsers, setActiveUsers] = useState(null);
  const [change, setChange] = useState(null);
  const [trend, setTrend] = useState('stable');
  const [loading, setLoading] = useState(true);
  const intervalRef = useRef(null);

  useEffect(() => {
    const updateActiveUsers = () => {
      try {
        // Count current active users
        const currentCount = getActiveUsers();
        
        // Get previous count from cache
        let previousCount = null;
        try {
          const cached = localStorage.getItem(CACHE_KEY);
          if (cached) {
            const { value, timestamp } = JSON.parse(cached);
            // Only use cached value if it's less than 1 hour old
            const age = Date.now() - timestamp;
            if (age < CACHE_DURATION) {
              previousCount = value;
            }
          }
        } catch (err) {
          // Ignore cache errors
        }

        // Calculate percentage change
        if (previousCount !== null && previousCount !== currentCount) {
          const percentageChange = calculatePercentageChange(currentCount, previousCount);
          if (percentageChange !== null) {
            setChange(Math.abs(percentageChange));
            setTrend(percentageChange > 0 ? 'up' : 'down');
          }
        } else {
          setChange(null);
          setTrend('stable');
        }

        // Cache the new count
        localStorage.setItem(CACHE_KEY, JSON.stringify({
          value: currentCount,
          timestamp: Date.now(),
        }));

        setActiveUsers(currentCount);
        setLoading(false);
      } catch (err) {
        console.error('Error updating active users:', err);
        setLoading(false);
      }
    };

    // Initial count
    updateActiveUsers();

    // Update every hour (since we're tracking 24h window)
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
