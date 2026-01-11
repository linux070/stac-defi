import { useState, useEffect } from 'react';
import { getItem } from '../utils/indexedDB';
import { TOKEN_PRICES } from '../config/networks';

/**
 * Hook to calculate total value processed across all dApp activities
 * Includes: Swaps, Bridges, and future Liquidity operations
 * Converts all amounts to USD using TOKEN_PRICES
 */
export function useTotalValueProcessed() {
    const [totalValue, setTotalValue] = useState(0);
    const [loading, setLoading] = useState(true);

    const calculateTotalValue = async () => {
        try {
            setLoading(true);

            // Get all transactions from IndexedDB
            const transactions = await getItem('myTransactions');

            // Calculate total volume in USD from real transactions
            let totalUSD = 0;

            if (transactions && Array.isArray(transactions)) {
                transactions.forEach(tx => {
                    if (!tx.amount || tx.status !== 'success') return;

                    let amount = 0;
                    let tokenSymbol = '';

                    const amountStr = String(tx.amount);

                    // Handle different transaction types
                    if (tx.type === 'Swap') {
                        if (amountStr.includes('→')) {
                            const parts = amountStr.split('→');
                            const firstPart = parts[0].trim();
                            const numberMatch = firstPart.match(/^([\d.]+)/);
                            if (numberMatch && numberMatch[1]) amount = parseFloat(numberMatch[1]);
                            const tokenMatch = firstPart.match(/[\d.]+\s+([A-Z]+)/);
                            if (tokenMatch && tokenMatch[1]) tokenSymbol = tokenMatch[1];
                        }
                    } else if (tx.type === 'Bridge') {
                        amount = parseFloat(amountStr);
                        tokenSymbol = 'USDC';
                    } else if (tx.type === 'Liquidity' || tx.type === 'LP') {
                        amount = parseFloat(amountStr);
                        tokenSymbol = tx.token || 'USDC';
                    }

                    // Convert to USD using TOKEN_PRICES
                    if (!isNaN(amount) && amount > 0 && tokenSymbol) {
                        const tokenPrice = TOKEN_PRICES[tokenSymbol];
                        if (tokenPrice) {
                            totalUSD += amount * tokenPrice;
                        } else if (tokenSymbol === 'USDC') {
                            totalUSD += amount;
                        }
                    }
                });
            }

            setTotalValue(Math.round(totalUSD));
            setLoading(false);
        } catch (error) {
            console.error('Error calculating total volume:', error);
            setTotalValue(0);
            setLoading(false);
        }
    };

    useEffect(() => {
        // Initial calculation on mount
        calculateTotalValue();

        // Polling interval (every 30 seconds) to ensure stats stay live
        // and refresh when users navigate back to the home page
        const interval = setInterval(() => {
            calculateTotalValue();
        }, 30000);

        // Recalculate when transactions might have changed
        const handleTransactionSaved = () => {
            calculateTotalValue();
        };

        window.addEventListener('transactionSaved', handleTransactionSaved);
        window.addEventListener('bridgeTransactionSaved', handleTransactionSaved);
        window.addEventListener('swapTransactionSaved', handleTransactionSaved);

        return () => {
            clearInterval(interval);
            window.removeEventListener('transactionSaved', handleTransactionSaved);
            window.removeEventListener('bridgeTransactionSaved', handleTransactionSaved);
            window.removeEventListener('swapTransactionSaved', handleTransactionSaved);
        };
    }, []);

    return { totalValue, loading };
}
