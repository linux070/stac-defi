import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { getItem, setItem } from '../utils/indexedDB';

const CACHE_KEY = 'dapp_transaction_count';
const VERSION_KEY = 'dapp_stat_version';
const CURRENT_VERSION = 'v1.3_strict_local';

const calculatePercentageChange = (current, previous) => {
    if (!previous || previous === 0) return null;
    const change = ((current - previous) / previous) * 100;
    return parseFloat(change.toFixed(1));
};

/**
 * useDappTransactionCount
 * Returns the total count of unique successful transactions performed through this dApp.
 * Strictly reads from the local 'myTransactions' ledger to ensure absolute accuracy 
 * with the user's recorded history, as requested.
 */
export function useDappTransactionCount() {
    const queryClient = useQueryClient();

    const { data, isLoading } = useQuery({
        queryKey: ['dappTransactionCount'],
        queryFn: async () => {
            // Self-healing: Reset if version changed
            const version = await getItem(VERSION_KEY);
            if (version !== CURRENT_VERSION) {
                await setItem(CACHE_KEY, { value: 0, timestamp: Date.now() });
                await setItem(VERSION_KEY, CURRENT_VERSION);
            }

            // Strictly reading 'myTransactions' as it is the source of truth for dApp-originated activity
            const personalTxs = await getItem('myTransactions');
            const allTxs = Array.isArray(personalTxs) ? personalTxs : [];
            
            const uniqueHashes = new Set();
            allTxs.forEach(tx => {
                if (!tx || typeof tx !== 'object') return;
                const txHash = tx.hash || tx.transactionHash || tx.id;
                const txStatus = tx.status || 'success';

                if (txHash && txStatus === 'success') {
                    uniqueHashes.add(txHash.toLowerCase());
                }
            });

            const currentCount = uniqueHashes.size;
            const cached = await getItem(CACHE_KEY);
            const previousCount = (cached && cached.value !== undefined) ? cached.value : 0;

            let change = null;
            let trend = 'stable';

            if (previousCount !== currentCount && currentCount > 0 && previousCount > 0) {
                const percentageChange = calculatePercentageChange(currentCount, previousCount);
                if (percentageChange !== null) {
                    change = Math.abs(percentageChange);
                    trend = percentageChange > 0 ? 'up' : 'down';
                }
            }

            await setItem(CACHE_KEY, { value: currentCount, timestamp: Date.now() });
            return { transactionCount: currentCount, change, trend };
        },
        staleTime: 10000, // Faster refresh for better UX feel during testing
        refetchInterval: 30000,
    });

    useEffect(() => {
        const invalidate = () => queryClient.invalidateQueries({ queryKey: ['dappTransactionCount'] });
        
        // Listen specifically to events that indicate a new transaction was stored
        window.addEventListener('transactionSaved', invalidate);
        window.addEventListener('bridgeTransactionSaved', invalidate);
        window.addEventListener('swapTransactionSaved', invalidate);

        return () => {
            window.removeEventListener('transactionSaved', invalidate);
            window.removeEventListener('bridgeTransactionSaved', invalidate);
            window.removeEventListener('swapTransactionSaved', invalidate);
        };
    }, [queryClient]);

    return {
        transactionCount: data?.transactionCount ?? 0,
        change: data?.change ?? null,
        trend: data?.trend ?? 'stable',
        loading: isLoading
    };
}
