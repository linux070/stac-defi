import { useState, useEffect } from 'react';
import { getItem, setItem } from '../utils/indexedDB';

// Cache key for IndexedDB
const CACHE_KEY = 'dapp_bridge_count';

// Calculate percentage change
const calculatePercentageChange = (current, previous) => {
    if (!previous || previous === 0) return null;
    const change = ((current - previous) / previous) * 100;
    return parseFloat(change.toFixed(1));
};

// Lightweight hook to track dapp-specific bridge transaction count
export function useDappBridgeCount() {
    const [bridgeCount, setBridgeCount] = useState(null);
    const [change, setChange] = useState(null);
    const [trend, setTrend] = useState('stable');
    const [loading, setLoading] = useState(true);

    const updateBridgeCount = async () => {
        try {
            // Get personal and global transactions
            const [personalTxs, globalTxs] = await Promise.all([
                getItem('myTransactions'),
                getItem('globalTransactions')
            ]);

            const allTxs = [...(Array.isArray(personalTxs) ? personalTxs : []), ...(Array.isArray(globalTxs) ? globalTxs : [])];

            // Unique bridge hashes only
            const uniqueHashes = new Set();
            allTxs.forEach(tx => {
                if (tx.type === 'Bridge' && tx.hash && tx.status === 'success') {
                    uniqueHashes.add(tx.hash);
                }
            });

            const currentCount = uniqueHashes.size;

            // Get previous count from cache
            let previousCount = null;
            try {
                const cached = await getItem(CACHE_KEY);
                if (cached && cached.value !== undefined) {
                    previousCount = cached.value;
                }
            } catch (err) { /* ignore */ }

            setBridgeCount(currentCount);

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
            console.error('Error updating bridge count:', err);
            setLoading(false);
        }
    };

    useEffect(() => {
        updateBridgeCount();

        const interval = setInterval(updateBridgeCount, 30000);

        const handleRefresh = () => {
            updateBridgeCount();
        };

        window.addEventListener('transactionSaved', handleRefresh);
        window.addEventListener('bridgeTransactionSaved', handleRefresh);
        window.addEventListener('globalStatsUpdated', handleRefresh);

        return () => {
            clearInterval(interval);
            window.removeEventListener('transactionSaved', handleRefresh);
            window.removeEventListener('bridgeTransactionSaved', handleRefresh);
            window.removeEventListener('globalStatsUpdated', handleRefresh);
        };
    }, []);

    return { bridgeCount, change, trend, loading };
}
