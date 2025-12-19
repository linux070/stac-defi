import { useState, useEffect, useRef } from 'react';

// Cache key for localStorage
const CACHE_KEY = 'dapp_transaction_count';
const CACHE_DURATION = 2 * 60 * 1000; // 2 minutes (lightweight)
const TRANSACTIONS_KEY = 'myTransactions';

// Calculate percentage change
const calculatePercentageChange = (current, previous) => {
  if (!previous || previous === 0) return null;
  const change = ((current - previous) / previous) * 100;
  return parseFloat(change.toFixed(1));
};

// Count all dapp transactions from localStorage (Bridge, Swap, LP)
const countDappTransactions = () => {
  try {
    const saved = localStorage.getItem(TRANSACTIONS_KEY);
    if (!saved) return 0;
    
    const transactions = JSON.parse(saved);
    // Filter for all successful transactions (Bridge, Swap, LP)
    const dappTransactions = transactions.filter(tx => 
      (tx.type === 'Bridge' || tx.type === 'Swap' || tx.type === 'LP') && 
      tx.status === 'success'
    );
    
    return dappTransactions.length;
  } catch (err) {
    console.error('Error counting dapp transactions:', err);
    return 0;
  }
};

// Lightweight hook to track dapp-specific total transaction count
export function useDappTransactionCount() {
  const [transactionCount, setTransactionCount] = useState(null);
  const [change, setChange] = useState(null);
  const [trend, setTrend] = useState('stable');
  const [loading, setLoading] = useState(true);
  const intervalRef = useRef(null);

  useEffect(() => {
    const updateTransactionCount = () => {
      try {
        // Count current dapp transactions
        const currentCount = countDappTransactions();
        
        // Get previous count from cache
        let previousCount = null;
        try {
          const cached = localStorage.getItem(CACHE_KEY);
          if (cached) {
            const { value } = JSON.parse(cached);
            previousCount = value;
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

        setTransactionCount(currentCount);
        setLoading(false);
      } catch (err) {
        console.error('Error updating transaction count:', err);
        setLoading(false);
      }
    };

    // Initial count
    updateTransactionCount();

    // Poll periodically (every 2 minutes) to catch changes
    intervalRef.current = setInterval(() => {
      updateTransactionCount();
    }, CACHE_DURATION);

    // Listen for custom events when transactions are saved
    const handleTransactionSaved = () => {
      setTimeout(updateTransactionCount, 100);
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

  return { transactionCount, change, trend, loading };
}
