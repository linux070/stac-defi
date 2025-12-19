import { useState, useEffect, useRef } from 'react';
import { getItem, setItem, getItemSync } from '../utils/indexedDB';

// Cache key for IndexedDB
const CACHE_KEY = 'dapp_transaction_count';
const CACHE_DURATION = 2 * 60 * 1000; // 2 minutes (lightweight)
const TRANSACTIONS_KEY = 'myTransactions';

// Calculate percentage change
const calculatePercentageChange = (current, previous) => {
  if (!previous || previous === 0) return null;
  const change = ((current - previous) / previous) * 100;
  return parseFloat(change.toFixed(1));
};

// Count all dapp transactions from IndexedDB (Bridge, Swap, LP)
const countDappTransactions = async () => {
  try {
    const transactions = await getItem(TRANSACTIONS_KEY);
    if (!transactions || !Array.isArray(transactions)) return 0;
    
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
    const updateTransactionCount = async () => {
      try {
        // Count current dapp transactions from IndexedDB (source of truth)
        const currentCount = await countDappTransactions();
        
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

        // Determine the count to display
        // Always use actual count from transactions (source of truth)
        // If count is 0 but we have cached value > 0, check if transactions exist
        let finalCount = currentCount;
        if (currentCount === 0 && previousCount !== null && previousCount > 0) {
          // Check if transactions array exists and has items (might be loading)
          const transactions = await getItem(TRANSACTIONS_KEY);
          if (transactions && Array.isArray(transactions) && transactions.length > 0) {
            // Transactions exist, so count should be > 0 if there are matching transactions
            // Double-check by counting again (in case of timing issue)
            const doubleCheckCount = await countDappTransactions();
            if (doubleCheckCount > 0) {
              finalCount = doubleCheckCount;
            } else {
              // Transactions exist but none match filter - use cached value for persistence
              finalCount = previousCount;
            }
          } else {
            // No transactions in IndexedDB - might be cleared or not loaded yet
            // Use cached value to maintain persistence
            finalCount = previousCount;
          }
        }

        // Set the count state
        setTransactionCount(finalCount);

        // Calculate percentage change (use previousCount vs finalCount)
        if (previousCount !== null && previousCount !== finalCount && finalCount > 0) {
          const percentageChange = calculatePercentageChange(finalCount, previousCount);
          if (percentageChange !== null) {
            setChange(Math.abs(percentageChange));
            setTrend(percentageChange > 0 ? 'up' : 'down');
          }
        } else {
          setChange(null);
          setTrend('stable');
        }

        // Always cache the count we're displaying in IndexedDB (persistent storage)
        await setItem(CACHE_KEY, {
          value: finalCount,
          timestamp: Date.now(),
        });

        setLoading(false);
      } catch (err) {
        console.error('Error updating transaction count:', err);
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
          setTransactionCount(cached.value);
          setLoading(false);
          return true;
        }
        
        // Try localStorage fallback
        try {
          const localCached = getItemSync(CACHE_KEY);
          if (localCached) {
            const parsed = typeof localCached === 'string' ? JSON.parse(localCached) : localCached;
            if (parsed && parsed.value !== undefined) {
              setTransactionCount(parsed.value);
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
        updateTransactionCount();
      }, 200);
    });

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
