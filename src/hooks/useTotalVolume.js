import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { getItem } from '../utils/indexedDB';
import { TOKEN_PRICES } from '../config/networks';

export function useTotalVolume(walletAddress = null) {
    const queryClient = useQueryClient();

    const { data, isLoading } = useQuery({
        queryKey: ['totalVolume', walletAddress],
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

                if (tx.type !== 'Swap' || tx.status !== 'success' || !tx.amount) return;

                if (walletAddress) {
                    const walletLower = walletAddress.toLowerCase();
                    if (tx.address?.toLowerCase() !== walletLower) return;
                }

                let amount = 0;
                let tokenSymbol = 'USDC';
                const amountStr = String(tx.amount);

                if (amountStr.includes('→')) {
                    const parts = amountStr.split('→');
                    const firstPart = parts[0].trim();
                    const numberMatch = firstPart.match(/^([\d.]+)/);
                    if (numberMatch && numberMatch[1]) amount = parseFloat(numberMatch[1]);
                    const tokenMatch = firstPart.match(/[\d.]+\s+([A-Z]+)/);
                    if (tokenMatch && tokenMatch[1]) tokenSymbol = tokenMatch[1];
                } else {
                    amount = parseFloat(amountStr);
                }

                if (!isNaN(amount) && amount > 0) {
                    const tokenPrice = TOKEN_PRICES[tokenSymbol];
                    if (tokenPrice) volumeUSD += amount * tokenPrice;
                    else if (tokenSymbol === 'USDC' || !tokenSymbol) volumeUSD += amount;
                }
            });

            return Math.round(volumeUSD);
        },
        staleTime: 60000,
        refetchInterval: 30000,
    });

    useEffect(() => {
        const invalidate = () => queryClient.invalidateQueries({ queryKey: ['totalVolume', walletAddress] });
        window.addEventListener('transactionSaved', invalidate);
        window.addEventListener('swapTransactionSaved', invalidate);
        window.addEventListener('globalStatsUpdated', invalidate);
        return () => {
            window.removeEventListener('transactionSaved', invalidate);
            window.removeEventListener('swapTransactionSaved', invalidate);
            window.removeEventListener('globalStatsUpdated', invalidate);
        };
    }, [walletAddress, queryClient]);

    return { totalVolume: data ?? 0, loading: isLoading };
}
