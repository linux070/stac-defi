import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { getItem } from '../utils/indexedDB';

export function useTotalBridgeVolume(walletAddress = null) {
    const queryClient = useQueryClient();
    const GLOBAL_BRIDGE_BASELINE = 5200;

    const { data, isLoading } = useQuery({
        queryKey: ['totalBridgeVolume', walletAddress],
        queryFn: async () => {
            const [personalTxs, globalTxs] = await Promise.all([
                getItem('myTransactions'),
                getItem('globalTransactions')
            ]);

            const allTransactions = [...(Array.isArray(personalTxs) ? personalTxs : []), ...(Array.isArray(globalTxs) ? globalTxs : [])];
            let volumeUSD = 0;
            const processedHashes = new Set();

            allTransactions.forEach(tx => {
                if (!tx.hash || processedHashes.has(tx.hash)) return;
                processedHashes.add(tx.hash);

                if (tx.type !== 'Bridge' || tx.status !== 'success' || !tx.amount) return;

                if (walletAddress) {
                    const walletLower = walletAddress.toLowerCase();
                    if (tx.address?.toLowerCase() !== walletLower) return;
                }

                const amount = parseFloat(tx.amount);
                if (!isNaN(amount) && amount > 0) volumeUSD += amount;
            });

            const finalTotal = walletAddress ? volumeUSD : (GLOBAL_BRIDGE_BASELINE + volumeUSD);
            return Math.round(finalTotal);
        },
        staleTime: 60000,
        refetchInterval: 30000,
    });

    useEffect(() => {
        const invalidate = () => queryClient.invalidateQueries({ queryKey: ['totalBridgeVolume', walletAddress] });
        window.addEventListener('transactionSaved', invalidate);
        window.addEventListener('bridgeTransactionSaved', invalidate);
        window.addEventListener('globalStatsUpdated', invalidate);
        return () => {
            window.removeEventListener('transactionSaved', invalidate);
            window.removeEventListener('bridgeTransactionSaved', invalidate);
            window.removeEventListener('globalStatsUpdated', invalidate);
        };
    }, [walletAddress, queryClient]);

    return { totalVolume: data ?? 0, loading: isLoading };
}
