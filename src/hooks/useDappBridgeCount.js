import { useState, useEffect, useRef } from 'react';

// Cache key for localStorage
const CACHE_KEY = 'dapp_bridge_count';
const CACHE_DURATION = 2 * 60 * 1000; // 2 minutes (lighter than transaction count)
const TRANSACTIONS_KEY = 'myTransactions';

// Calculate percentage change
const calculatePercentageChange = (current, previous) => {
  if (!previous || previous === 0) return null;
  const change = ((current - previous) / previous) * 100;
  return parseFloat(change.toFixed(1));
};

// Count bridge transactions from localStorage
const countBridgeTransactions = () => {
  try {
    const saved = localStorage.getItem(TRANSACTIONS_KEY);
    if (!saved) return 0;
    
    const transactions = JSON.parse(saved);
    // Filter for Bridge type transactions
    const bridgeTransactions = transactions.filter(tx => 
      tx.type === 'Bridge' && tx.status === 'success'
    );
    
    return bridgeTransactions.length;
  } catch (err) {
    console.error('Error counting bridge transactions:', err);
    return 0;
  }
};

// Lightweight hook to track dapp-specific bridge transaction count
export function useDappBridgeCount() {
  const [bridgeCount, setBridgeCount] = useState(null);
  const [change, setChange] = useState(null);
  const [trend, setTrend] = useState('stable');
  const [loading, setLoading] = useState(true);
  const intervalRef = useRef(null);

  useEffect(() => {
    const updateBridgeCount = () => {
      try {
        // Count current bridge transactions
        const currentCount = countBridgeTransactions();
        
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

        setBridgeCount(currentCount);
        setLoading(false);
      } catch (err) {
        console.error('Error updating bridge count:', err);
        setLoading(false);
      }
    };

    // Initial count
    updateBridgeCount();

    // Poll periodically (every 2 minutes) to catch changes
    intervalRef.current = setInterval(() => {
      updateBridgeCount();
    }, CACHE_DURATION);

    // Also listen for custom events when bridge transactions are saved
    const handleBridgeTransactionSaved = () => {
      setTimeout(updateBridgeCount, 100);
    };
    window.addEventListener('bridgeTransactionSaved', handleBridgeTransactionSaved);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      window.removeEventListener('bridgeTransactionSaved', handleBridgeTransactionSaved);
    };
  }, []);

  return { bridgeCount, change, trend, loading };
}
