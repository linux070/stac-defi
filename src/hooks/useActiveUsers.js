import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { getItem, setItem } from '../utils/indexedDB';
import { SUBGRAPH_URL } from '../config/constants';

const CACHE_KEY = 'dapp_active_users';

const calculatePercentageChange = (current, previous) => {
  if (!previous || previous === 0) return null;
  const change = ((current - previous) / previous) * 100;
  return parseFloat(change.toFixed(1));
};

export function useActiveUsers() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['activeUsers'],
    queryFn: async () => {
      
      const query = `
        query {
          globalStat(id: "1") {
            activeUsersCount
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
        const count = parseInt(result?.data?.globalStat?.activeUsersCount || '0');

        if (count === 0) {
           const globalTxs = await getItem('globalTransactions');
           const unique = new Set((globalTxs || []).map(t => t.from?.toLowerCase()).filter(Boolean));
           return { activeUsers: unique.size, change: 0, trend: 'stable' };
        }

        return { activeUsers: count, change: null, trend: 'stable' };
      } catch (err) {
        console.error('[Subgraph Error]:', err);
        return { activeUsers: 0, change: null, trend: 'stable' };
      }
    },
    staleTime: 60000,
    refetchInterval: 30000,
  });

  useEffect(() => {
    const invalidate = () => queryClient.invalidateQueries({ queryKey: ['activeUsers'] });
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
    activeUsers: data?.activeUsers ?? 0,
    change: data?.change ?? null,
    trend: data?.trend ?? 'stable',
    loading: isLoading
  };
}
