import { useState, useEffect, useRef } from 'react';
import { getItem, setItem, getItemSync } from '../utils/indexedDB';

// Cache key for IndexedDB
const CACHE_KEY = 'dapp_network_health_score';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const TRANSACTIONS_KEY = 'myTransactions';

// Calculate percentage change
const calculatePercentageChange = (current, previous) => {
  if (!previous || previous === 0) return null;
  const change = ((current - previous) / previous) * 100;
  return parseFloat(change.toFixed(1));
};

// Calculate network health score (0-100)
const calculateHealthScore = async () => {
  try {
    const transactions = await getItem(TRANSACTIONS_KEY);
    if (!transactions || !Array.isArray(transactions) || transactions.length === 0) {
      return 0;
    }

    // Component 1: Success Rate (0-30 points)
    const totalTransactions = transactions.length;
    const successfulTransactions = transactions.filter(tx => tx.status === 'success').length;
    const successRate = totalTransactions > 0 ? (successfulTransactions / totalTransactions) * 100 : 0;
    const successScore = Math.min(30, (successRate / 100) * 30); // Max 30 points

    // Component 2: Activity Score (0-25 points)
    // Based on transaction count (normalized)
    const transactionCount = successfulTransactions;
    // Scale: 0-100 transactions = 0-25 points (logarithmic scale for better distribution)
    const activityScore = Math.min(25, Math.log10(Math.max(1, transactionCount + 1)) * 8);

    // Component 3: Speed Score (0-25 points)
    // Based on transaction frequency and recency (faster network = more recent transactions)
    const now = Date.now();
    const oneHourAgo = now - (60 * 60 * 1000);
    const oneDayAgo = now - (24 * 60 * 60 * 1000);
    
    // Recent transactions (last hour) - shows current network speed
    const recentTransactions = transactions.filter(tx => 
      tx.timestamp && tx.timestamp >= oneHourAgo && tx.status === 'success'
    );
    const recentCount = recentTransactions.length;
    
    // Transactions in last 24 hours - shows sustained activity
    const dailyTransactions = transactions.filter(tx => 
      tx.timestamp && tx.timestamp >= oneDayAgo && tx.status === 'success'
    );
    const dailyCount = dailyTransactions.length;
    
    // Calculate average time between recent transactions (in seconds)
    let avgTimeBetweenTx = Infinity;
    if (recentCount > 1) {
      const sortedRecent = recentTransactions
        .filter(tx => tx.timestamp)
        .sort((a, b) => b.timestamp - a.timestamp);
      
      let totalTimeDiff = 0;
      for (let i = 0; i < sortedRecent.length - 1; i++) {
        totalTimeDiff += sortedRecent[i].timestamp - sortedRecent[i + 1].timestamp;
      }
      avgTimeBetweenTx = totalTimeDiff / (sortedRecent.length - 1) / 1000; // Convert to seconds
    }
    
    // Speed score calculation:
    // - Recent activity (0-15 points): More transactions in last hour = faster network
    //   Ideal: 10+ transactions/hour = 15 points, 0 transactions = 0 points
    const recentActivityScore = Math.min(15, (recentCount / 10) * 15);
    
    // - Transaction frequency (0-10 points): Lower time between transactions = faster
    //   Ideal: <5 seconds = 10 points, >60 seconds = 0 points
    let frequencyScore = 0;
    if (avgTimeBetweenTx < Infinity && avgTimeBetweenTx > 0) {
      if (avgTimeBetweenTx <= 5) {
        frequencyScore = 10; // Very fast (<5s between transactions)
      } else if (avgTimeBetweenTx <= 15) {
        frequencyScore = 8; // Fast (5-15s)
      } else if (avgTimeBetweenTx <= 30) {
        frequencyScore = 6; // Moderate (15-30s)
      } else if (avgTimeBetweenTx <= 60) {
        frequencyScore = 4; // Slow (30-60s)
      } else {
        frequencyScore = 2; // Very slow (>60s)
      }
    } else if (dailyCount > 0) {
      // If no recent transactions but has daily activity, give minimal score
      frequencyScore = 1;
    }
    
    const speedScore = recentActivityScore + frequencyScore;

    // Component 4: User Engagement (0-20 points)
    // Based on unique users and transaction diversity
    const uniqueUsers = new Set();
    const transactionTypes = new Set();
    
    transactions.forEach(tx => {
      if (tx.address) {
        uniqueUsers.add(tx.address.toLowerCase());
      }
      if (tx.type) {
        transactionTypes.add(tx.type);
      }
    });

    const userCount = uniqueUsers.size;
    const typeCount = transactionTypes.size;
    
    // User score: 0-12 points (based on unique users, max at 50+ users)
    const userScore = Math.min(12, (userCount / 50) * 12);
    
    // Diversity score: 0-8 points (based on transaction type diversity)
    const diversityScore = Math.min(8, typeCount * 2.67); // 3 types = 8 points
    
    const engagementScore = userScore + diversityScore;

    // Total Health Score (0-100)
    const totalScore = Math.round(successScore + activityScore + speedScore + engagementScore);
    
    return Math.min(100, Math.max(0, totalScore));
  } catch (err) {
    console.error('Error calculating network health score:', err);
    return 0;
  }
};

// Lightweight hook to track network health score
export function useNetworkHealthScore() {
  const [healthScore, setHealthScore] = useState(null);
  const [change, setChange] = useState(null);
  const [trend, setTrend] = useState('stable');
  const [loading, setLoading] = useState(true);
  const intervalRef = useRef(null);

  useEffect(() => {
    const updateHealthScore = async () => {
      try {
        // Calculate current health score from IndexedDB (source of truth)
        const currentScore = await calculateHealthScore();
        
        // Get previous score from IndexedDB cache (for percentage calculation)
        let previousScore = null;
        try {
          const cached = await getItem(CACHE_KEY);
          if (cached && cached.value !== undefined) {
            previousScore = cached.value;
          }
        } catch (err) {
          // Fallback to localStorage
          try {
            const localCached = getItemSync(CACHE_KEY);
            if (localCached) {
              const parsed = typeof localCached === 'string' ? JSON.parse(localCached) : localCached;
              if (parsed && parsed.value !== undefined) {
                previousScore = parsed.value;
              }
            }
          } catch (e) {
            // Ignore cache errors
          }
        }

        // Determine the score to display
        let finalScore = currentScore;
        if (currentScore === 0 && previousScore !== null && previousScore > 0) {
          // Check if transactions array exists and has items (might be loading)
          const transactions = await getItem(TRANSACTIONS_KEY);
          if (transactions && Array.isArray(transactions) && transactions.length > 0) {
            // Transactions exist, so score should be > 0 if there are matching transactions
            // Double-check by calculating again (in case of timing issue)
            const doubleCheckScore = await calculateHealthScore();
            if (doubleCheckScore > 0) {
              finalScore = doubleCheckScore;
            } else {
              // Transactions exist but score is 0 - use cached value for persistence
              finalScore = previousScore;
            }
          } else {
            // No transactions in IndexedDB - might be cleared or not loaded yet
            // Use cached value to maintain persistence
            finalScore = previousScore;
          }
        }

        // Set the score state
        setHealthScore(finalScore);

        // Calculate percentage change (use previousScore vs finalScore)
        if (previousScore !== null && previousScore !== finalScore && finalScore > 0) {
          const percentageChange = calculatePercentageChange(finalScore, previousScore);
          if (percentageChange !== null) {
            setChange(Math.abs(percentageChange));
            setTrend(percentageChange > 0 ? 'up' : 'down');
          }
        } else {
          setChange(null);
          setTrend('stable');
        }

        // Always cache the score we're displaying in IndexedDB (persistent storage)
        await setItem(CACHE_KEY, {
          value: finalScore,
          timestamp: Date.now(),
        });

        setLoading(false);
      } catch (err) {
        console.error('Error updating network health score:', err);
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
          setHealthScore(cached.value);
          setLoading(false);
          return true;
        }
        
        // Try localStorage fallback
        try {
          const localCached = getItemSync(CACHE_KEY);
          if (localCached) {
            const parsed = typeof localCached === 'string' ? JSON.parse(localCached) : localCached;
            if (parsed && parsed.value !== undefined) {
              setHealthScore(parsed.value);
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
      // Initial score calculation (with delay to ensure transactions are loaded)
      setTimeout(() => {
        updateHealthScore();
      }, 200);
    });

    // Poll periodically (every 5 minutes) to catch changes
    intervalRef.current = setInterval(() => {
      updateHealthScore();
    }, CACHE_DURATION);

    // Listen for custom events when transactions are saved
    const handleTransactionSaved = () => {
      setTimeout(updateHealthScore, 100);
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

  return { healthScore, change, trend, loading };
}
