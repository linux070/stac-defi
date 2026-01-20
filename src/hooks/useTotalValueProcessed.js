import { useState, useEffect } from 'react';
import { getItem, setItem } from '../utils/indexedDB';
import { TOKEN_PRICES } from '../config/networks';

// Cache key for IndexedDB
const CACHE_KEY = 'dapp_total_value_processed';

/**
 * Hook to calculate total value processed across all dApp activities
 * Includes: Swaps, Bridges, and future Liquidity operations
 */
export function useTotalValueProcessed() {
    const [totalValue, setTotalValue] = useState(0);
    const [loading, setLoading] = useState(true);

    const calculateTotalValue = async () => {
        try {
            setLoading(true);

            // Get personal and global transactions
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
                    if (tokenPrice) {
                        totalUSD += amount * tokenPrice;
                    } else if (tokenSymbol === 'USDC' || !tokenSymbol) {
                        totalUSD += amount;
                    }
                }
            });

            const finalValue = Math.round(totalUSD);
            setTotalValue(finalValue);
            await setItem(CACHE_KEY, { value: finalValue, timestamp: Date.now() });
            setLoading(false);
        } catch (error) {
            console.error('Error calculating total volume:', error);
            setLoading(false);
        }
    };

    useEffect(() => {
        calculateTotalValue();

        const interval = setInterval(calculateTotalValue, 30000);

        const handleRefresh = () => {
            calculateTotalValue();
        };

        window.addEventListener('transactionSaved', handleRefresh);
        window.addEventListener('bridgeTransactionSaved', handleRefresh);
        window.addEventListener('swapTransactionSaved', handleRefresh);
        window.addEventListener('globalStatsUpdated', handleRefresh);

        return () => {
            clearInterval(interval);
            window.removeEventListener('transactionSaved', handleRefresh);
            window.removeEventListener('bridgeTransactionSaved', handleRefresh);
            window.removeEventListener('swapTransactionSaved', handleRefresh);
            window.removeEventListener('globalStatsUpdated', handleRefresh);
        };
    }, []);

    return { totalValue, loading };
}
