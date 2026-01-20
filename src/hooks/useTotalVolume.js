import { useState, useEffect } from 'react';
import { getItem } from '../utils/indexedDB';
import { TOKEN_PRICES } from '../config/networks';

/**
 * Hook to calculate total swap volume in USD from transactions stored in IndexedDB
 * @param {string|null} walletAddress - Optional wallet address to filter transactions.
 *                                       If provided, only transactions for this wallet are counted.
 *                                       If null/undefined, all transactions are counted.
 */
export function useTotalVolume(walletAddress = null) {
    const [totalVolume, setTotalVolume] = useState(0);
    const [loading, setLoading] = useState(true);

    const calculateTotalVolume = async () => {
        try {
            setLoading(true);

            // Get personal and global transactions from IndexedDB
            const [personalTxs, globalTxs] = await Promise.all([
                getItem('myTransactions'),
                getItem('globalTransactions')
            ]);

            // Merge transactions (prefer personal if duplicates occur, though global format differs)
            const allTransactions = [...(Array.isArray(personalTxs) ? personalTxs : []), ...(Array.isArray(globalTxs) ? globalTxs : [])];

            // Calculate swap volume in USD
            let volumeUSD = 0;
            const processedHashes = new Set();

            allTransactions.forEach(tx => {
                if (!tx.hash || processedHashes.has(tx.hash)) return;
                processedHashes.add(tx.hash);

                // Only count Swap transactions
                if (tx.type !== 'Swap' || tx.status !== 'success') return;
                if (!tx.amount) return;

                // If wallet address is provided, only count transactions for that wallet
                if (walletAddress) {
                    const walletLower = walletAddress.toLowerCase();
                    if (tx.address?.toLowerCase() !== walletLower) return;
                }

                let amount = 0;
                let tokenSymbol = 'USDC'; // Default for global

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

                // Convert to USD using TOKEN_PRICES
                if (!isNaN(amount) && amount > 0) {
                    const tokenPrice = TOKEN_PRICES[tokenSymbol];
                    if (tokenPrice) {
                        volumeUSD += amount * tokenPrice;
                    } else if (tokenSymbol === 'USDC' || !tokenSymbol) {
                        volumeUSD += amount;
                    }
                }
            });

            // Final calculated volume
            const finalVolume = Math.round(volumeUSD);
            setTotalVolume(finalVolume);
            setLoading(false);
        } catch (error) {
            console.error('Error calculating swap volume:', error);
            setTotalVolume(0);
            setLoading(false);
        }
    };

    useEffect(() => {
        // Initial calculation on mount
        calculateTotalVolume();

        // Polling interval to keep data fresh (every 30 seconds)
        const interval = setInterval(() => {
            calculateTotalVolume();
        }, 30000);

        // Recalculate when transactions might have changed
        const handleRefresh = () => {
            calculateTotalVolume();
        };

        window.addEventListener('transactionSaved', handleRefresh);
        window.addEventListener('swapTransactionSaved', handleRefresh);
        window.addEventListener('globalStatsUpdated', handleRefresh);

        return () => {
            clearInterval(interval);
            window.removeEventListener('transactionSaved', handleRefresh);
            window.removeEventListener('swapTransactionSaved', handleRefresh);
            window.removeEventListener('globalStatsUpdated', handleRefresh);
        };
    }, [walletAddress]); // Re-run when wallet address changes

    return { totalVolume, loading };
}
