import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { getItem, setItem } from '../utils/indexedDB';
import { SUBGRAPH_URL } from '../config/constants';

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
 */
export function useDappTransactionCount() {
    const queryClient = useQueryClient();

    const { data, isLoading } = useQuery({
        queryKey: ['dappTransactionCount'],
        queryFn: async () => {
            
            const query = `
                query {
                    globalStat(id: "1") {
                        totalTransactions
                    }
                }
            `;

            try {
                const response = await fetch(SUBGRAPH_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ query })
                });
                const result = await response.json();
                const count = parseInt(result?.data?.globalStat?.totalTransactions || '0');
                
                // Fallback to local IndexDB discovery if subgraph is syncing or empty
                if (count === 0) {
                    const globalTxs = await getItem('globalTransactions');
                    const allTxs = Array.isArray(globalTxs) ? globalTxs : [];
                    return { transactionCount: allTxs.length, change: 0, trend: 'stable' };
                }

                return { transactionCount: count, change: null, trend: 'stable' };
            } catch (err) {
                console.error('[Subgraph Error]:', err);
                const globalTxs = await getItem('globalTransactions');
                return { transactionCount: Array.isArray(globalTxs) ? globalTxs.length : 0, change: null, trend: 'stable' };
            }
        },
        staleTime: 10000, 
        refetchInterval: 30000,
    });

    useEffect(() => {
        const invalidate = () => queryClient.invalidateQueries({ queryKey: ['dappTransactionCount'] });
        
        window.addEventListener('transactionSaved', invalidate);
        window.addEventListener('bridgeTransactionSaved', invalidate);
        window.addEventListener('swapTransactionSaved', invalidate);
        window.addEventListener('globalTransactionsSaved', invalidate);

        return () => {
            window.removeEventListener('transactionSaved', invalidate);
            window.removeEventListener('bridgeTransactionSaved', invalidate);
            window.removeEventListener('swapTransactionSaved', invalidate);
            window.removeEventListener('globalTransactionsSaved', invalidate);
        };
    }, [queryClient]);

    return {
        transactionCount: data?.transactionCount ?? 0,
        change: data?.change ?? null,
        trend: data?.trend ?? 'stable',
        loading: isLoading
    };
}
