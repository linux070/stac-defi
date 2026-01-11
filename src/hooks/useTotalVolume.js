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

            // Get all transactions from IndexedDB
            const transactions = await getItem('myTransactions');

            // Calculate swap volume in USD from real transactions
            let volumeUSD = 0;

            if (transactions && Array.isArray(transactions)) {
                transactions.forEach(tx => {
                    // Only count Swap transactions
                    if (tx.type !== 'Swap' || tx.status !== 'success') return;
                    if (!tx.amount) return;

                    // If wallet address is provided, only count transactions for that wallet
                    if (walletAddress) {
                        const walletLower = walletAddress.toLowerCase();
                        if (tx.address?.toLowerCase() !== walletLower) return;
                    }

                    let amount = 0;
                    let tokenSymbol = '';

                    const amountStr = String(tx.amount);

                    if (amountStr.includes('→')) {
                        const parts = amountStr.split('→');
                        const firstPart = parts[0].trim();
                        const numberMatch = firstPart.match(/^([\d.]+)/);
                        if (numberMatch && numberMatch[1]) amount = parseFloat(numberMatch[1]);
                        const tokenMatch = firstPart.match(/[\d.]+\s+([A-Z]+)/);
                        if (tokenMatch && tokenMatch[1]) tokenSymbol = tokenMatch[1];
                    } else if (tx.from) {
                        const fromStr = String(tx.from);
                        const numberMatch = fromStr.match(/^([\d.]+)/);
                        if (numberMatch && numberMatch[1]) amount = parseFloat(numberMatch[1]);
                        const tokenMatch = fromStr.match(/[\d.]+\s+([A-Z]+)/);
                        if (tokenMatch && tokenMatch[1]) tokenSymbol = tokenMatch[1];
                    }

                    // Convert to USD using TOKEN_PRICES
                    if (!isNaN(amount) && amount > 0 && tokenSymbol) {
                        const tokenPrice = TOKEN_PRICES[tokenSymbol];
                        if (tokenPrice) {
                            volumeUSD += amount * tokenPrice;
                        } else if (tokenSymbol === 'USDC') {
                            volumeUSD += amount;
                        }
                    }
                });
            }

            setTotalVolume(Math.round(volumeUSD));
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
        // This ensures stats are updated when users come back to the homepage
        const interval = setInterval(() => {
            calculateTotalVolume();
        }, 30000);

        // Recalculate when transactions might have changed
        const handleTransactionSaved = () => {
            calculateTotalVolume();
        };

        window.addEventListener('transactionSaved', handleTransactionSaved);
        window.addEventListener('swapTransactionSaved', handleTransactionSaved);

        return () => {
            clearInterval(interval);
            window.removeEventListener('transactionSaved', handleTransactionSaved);
            window.removeEventListener('swapTransactionSaved', handleTransactionSaved);
        };
    }, [walletAddress]); // Re-run when wallet address changes

    return { totalVolume, loading };
}
