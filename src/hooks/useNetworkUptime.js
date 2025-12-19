import { useState, useEffect, useRef } from 'react';
import { getItem, setItem, getItemSync } from '../utils/indexedDB';

// Cache key for IndexedDB
const CACHE_KEY = 'dapp_network_uptime';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const TRANSACTIONS_KEY = 'myTransactions';

// Calculate percentage change
const calculatePercentageChange = (current, previous) => {
  if (!previous || previous === 0) return null;
  const change = ((current - previous) / previous) * 100;
  return parseFloat(change.toFixed(1));
};

// Calculate network uptime percentage (0-100%)
// Based on transaction activity and success rate
const calculateUptime = async () => {
  try {
    const transactions = await getItem(TRANSACTIONS_KEY);
    if (!transactions || !Array.isArray(transactions) || transactions.length === 0) {
      return 0;
    }

    const now = Date.now();
    const sevenDaysAgo = now - (7 * 24 * 60 * 60 * 1000); // 7 days window
    
    // Filter transactions from last 7 days
    const recentTransactions = transactions.filter(tx => 
      tx.timestamp && tx.timestamp >= sevenDaysAgo
    );

    if (recentTransactions.length === 0) {
      return 0;
    }

    // Calculate uptime based on:
    // 1. Success rate (weighted 60%) - successful transactions indicate network is operational
    // 2. Activity consistency (weighted 40%) - regular transactions indicate sustained uptime
    
    // Component 1: Success Rate (0-60 points)
    const totalRecent = recentTransactions.length;
    const successfulRecent = recentTransactions.filter(tx => tx.status === 'success').length;
    const successRate = totalRecent > 0 ? (successfulRecent / totalRecent) * 100 : 0;
    const successScore = (successRate / 100) * 60; // Max 60 points

    // Component 2: Activity Consistency (0-40 points)
    // Check if there's consistent activity across the 7-day period
    const daysWithActivity = new Set();
    recentTransactions.forEach(tx => {
      if (tx.timestamp) {
        const txDate = new Date(tx.timestamp);
        const dayKey = `${txDate.getFullYear()}-${txDate.getMonth()}-${txDate.getDate()}`;
        daysWithActivity.add(dayKey);
      }
    });

    const activeDays = daysWithActivity.size;
    const maxDays = 7;
    // More days with activity = higher consistency score
    const consistencyScore = (activeDays / maxDays) * 40; // Max 40 points

    // Total Uptime Percentage (0-100%)
    const totalUptime = Math.round(successScore + consistencyScore);
    
    return Math.min(100, Math.max(0, totalUptime));
  } catch (err) {
    console.error('Error calculating network uptime:', err);
    return 0;
  }
};

// Lightweight hook to track network uptime
export function useNetworkUptime() {
  const [uptime, setUptime] = useState(null);
  const [change, setChange] = useState(null);
  const [trend, setTrend] = useState('stable');
  const [loading, setLoading] = useState(true);
  const intervalRef = useRef(null);

  useEffect(() => {
    const updateUptime = async () => {
      try {
        // Calculate current uptime from IndexedDB (source of truth)
        const currentUptime = await calculateUptime();
        
        // Get previous uptime from IndexedDB cache (for percentage calculation)
        let previousUptime = null;
        try {
          const cached = await getItem(CACHE_KEY);
          if (cached && cached.value !== undefined) {
            previousUptime = cached.value;
          }
        } catch (err) {
          // Fallback to localStorage
          try {
            const localCached = getItemSync(CACHE_KEY);
            if (localCached) {
              const parsed = typeof localCached === 'string' ? JSON.parse(localCached) : localCached;
              if (parsed && parsed.value !== undefined) {
                previousUptime = parsed.value;
              }
            }
          } catch (e) {
            // Ignore cache errors
          }
        }

        // Determine the uptime to display
        let finalUptime = currentUptime;
        if (currentUptime === 0 && previousUptime !== null && previousUptime > 0) {
          // Check if transactions array exists and has items (might be loading)
          const transactions = await getItem(TRANSACTIONS_KEY);
          if (transactions && Array.isArray(transactions) && transactions.length > 0) {
            // Transactions exist, so uptime should be > 0 if there are matching transactions
            // Double-check by calculating again (in case of timing issue)
            const doubleCheckUptime = await calculateUptime();
            if (doubleCheckUptime > 0) {
              finalUptime = doubleCheckUptime;
            } else {
              // Transactions exist but uptime is 0 - use cached value for persistence
              finalUptime = previousUptime;
            }
          } else {
            // No transactions in IndexedDB - might be cleared or not loaded yet
            // Use cached value to maintain persistence
            finalUptime = previousUptime;
          }
        }

        // Set the uptime state
        setUptime(finalUptime);

        // Calculate percentage change (use previousUptime vs finalUptime)
        if (previousUptime !== null && previousUptime !== finalUptime && finalUptime > 0) {
          const percentageChange = calculatePercentageChange(finalUptime, previousUptime);
          if (percentageChange !== null) {
            setChange(Math.abs(percentageChange));
            setTrend(percentageChange > 0 ? 'up' : 'down');
          }
        } else {
          setChange(null);
          setTrend('stable');
        }

        // Always cache the uptime we're displaying in IndexedDB (persistent storage)
        await setItem(CACHE_KEY, {
          value: finalUptime,
          timestamp: Date.now(),
        });

        setLoading(false);
      } catch (err) {
        console.error('Error updating network uptime:', err);
        setLoading(false);
      }
    };

    // Load cached value immediately on mount (before first calculation)
    const loadCachedValue = async (retryCount = 0) => {
      try {
        // Wait a bit for IndexedDB to initialize if first attempt
        if (retryCount === 0) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        const cached = await getItem(CACHE_KEY);
        if (cached && cached.value !== undefined) {
          setUptime(cached.value);
          setLoading(false);
          return true;
        }
        
        // Try localStorage fallback
        try {
          const localCached = getItemSync(CACHE_KEY);
          if (localCached) {
            const parsed = typeof localCached === 'string' ? JSON.parse(localCached) : localCached;
            if (parsed && parsed.value !== undefined) {
              setUptime(parsed.value);
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
      // Initial uptime calculation (with delay to ensure transactions are loaded)
      setTimeout(() => {
        updateUptime();
      }, 200);
    });

    // Poll periodically (every 5 minutes) to catch changes
    intervalRef.current = setInterval(() => {
      updateUptime();
    }, CACHE_DURATION);

    // Listen for custom events when transactions are saved
    const handleTransactionSaved = () => {
      setTimeout(updateUptime, 100);
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

  return { uptime, change, trend, loading };
}
