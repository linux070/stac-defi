import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { getItem, setItem } from '../utils/indexedDB';

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
      // Strictly reading from local dApp records to ensure accuracy with user's activity
      const personalTxs = await getItem('myTransactions');
      const allTxs = Array.isArray(personalTxs) ? personalTxs : [];
      
      const uniqueAddresses = new Set();
      
      allTxs.forEach(tx => {
        if (!tx || typeof tx !== 'object') return;
        if (tx.status === 'success' && (tx.address || tx.from || tx.to)) {
          const addr = tx.address || tx.from || tx.to;
          if (addr && typeof addr === 'string') {
            uniqueAddresses.add(addr.toLowerCase());
          }
        }
      });

      const currentCount = uniqueAddresses.size;
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

      return { activeUsers: currentCount, change, trend };
    },
    staleTime: 60000,
    refetchInterval: 30000,
  });

  useEffect(() => {
    const invalidate = () => queryClient.invalidateQueries({ queryKey: ['activeUsers'] });
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
    activeUsers: data?.activeUsers ?? 0,
    change: data?.change ?? null,
    trend: data?.trend ?? 'stable',
    loading: isLoading
  };
}
