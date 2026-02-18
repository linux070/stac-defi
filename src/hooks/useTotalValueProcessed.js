import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { getItem, setItem } from '../utils/indexedDB';
import { TOKEN_PRICES } from '../config/networks';

const CACHE_KEY = 'dapp_total_value_processed';

export function useTotalValueProcessed() {
    const queryClient = useQueryClient();

    const { data, isLoading } = useQuery({
        queryKey: ['totalValueProcessed'],
        queryFn: async () => {
            const [personalTxs, globalTxs] = await Promise.all([
                getItem('myTransactions'),
                getItem('globalTransactions')
            ]);

            const allTransactions = [...(Array.isArray(personalTxs) ? personalTxs : []), ...(Array.isArray(globalTxs) ? globalTxs : [])];
            let totalUSD = 0;
            const processedHashes = new Set();

            allTransactions.forEach(tx => {
                if (!tx.hash || processedHashes.has(tx.hash) || tx.status !== 'success' || !tx.amount) return;
                processedHashes.add(tx.hash);

                let amount = 0;
                let tokenSymbol = 'USDC';
                const amountStr = String(tx.amount);

                if (tx.type === 'Swap') {
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
                } else if (tx.type === 'Bridge') {
                    amount = parseFloat(amountStr);
                    tokenSymbol = 'USDC';
                } else if (tx.type === 'Liquidity' || tx.type === 'LP') {
                    amount = parseFloat(amountStr);
                    tokenSymbol = tx.token || 'USDC';
                } else if (tx.isGlobal) {
                    amount = parseFloat(amountStr);
                    tokenSymbol = 'USDC';
                }

                if (!isNaN(amount) && amount > 0) {
                    const tokenPrice = TOKEN_PRICES[tokenSymbol];
                    if (tokenPrice) totalUSD += amount * tokenPrice;
                    else if (tokenSymbol === 'USDC' || !tokenSymbol) totalUSD += amount;
                }
            });

            const finalValue = Math.round(totalUSD);
            await setItem(CACHE_KEY, { value: finalValue, timestamp: Date.now() });
            return finalValue;
        },
        staleTime: 60000,
        refetchInterval: 30000,
    });

    useEffect(() => {
        const invalidate = () => queryClient.invalidateQueries({ queryKey: ['totalValueProcessed'] });
        window.addEventListener('transactionSaved', invalidate);
        window.addEventListener('bridgeTransactionSaved', invalidate);
        window.addEventListener('swapTransactionSaved', invalidate);
        window.addEventListener('globalStatsUpdated', invalidate);
        return () => {
            window.removeEventListener('transactionSaved', invalidate);
            window.removeEventListener('bridgeTransactionSaved', invalidate);
            window.removeEventListener('swapTransactionSaved', invalidate);
            window.removeEventListener('globalStatsUpdated', invalidate);
        };
    }, [queryClient]);

    return { totalValue: data ?? 0, loading: isLoading };
}
