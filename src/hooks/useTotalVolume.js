import { useState, useEffect } from 'react';
import { getItem } from '../utils/indexedDB';
import { TOKEN_PRICES } from '../config/networks';

/**
 * Hook to calculate total swap volume in USD from all transactions stored in IndexedDB
 * Only counts swap transactions and converts amounts to USD using TOKEN_PRICES
 */
export function useTotalVolume() {
    const [totalVolume, setTotalVolume] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const calculateTotalVolume = async () => {
            try {
                setLoading(true);

                // Get all transactions from IndexedDB
                const transactions = await getItem('myTransactions');

                if (!transactions || !Array.isArray(transactions)) {
                    setTotalVolume(0);
                    setLoading(false);
                    return;
                }

                // Calculate total swap volume in USD
                let volumeUSD = 0;

                transactions.forEach(tx => {
                    // Only count Swap transactions
                    if (tx.type !== 'Swap') return;
                    if (!tx.amount) return;

                    // Extract numeric amount and token symbol from transaction
                    let amount = 0;
                    let tokenSymbol = '';

                    const amountStr = String(tx.amount);

                    if (amountStr.includes('→')) {
                        // Format: "1 EURC → 1.096700 USDC" - extract first amount and token
                        const parts = amountStr.split('→');
                        const firstPart = parts[0].trim();

                        // Extract number
                        const numberMatch = firstPart.match(/^([\d.]+)/);
                        if (numberMatch && numberMatch[1]) {
                            amount = parseFloat(numberMatch[1]);
                        }

                        // Extract token symbol (word after the number)
                        const tokenMatch = firstPart.match(/[\d.]+\s+([A-Z]+)/);
                        if (tokenMatch && tokenMatch[1]) {
                            tokenSymbol = tokenMatch[1];
                        }
                    } else {
                        // Try to extract from tx.from field if available
                        if (tx.from) {
                            const fromStr = String(tx.from);
                            const numberMatch = fromStr.match(/^([\d.]+)/);
                            if (numberMatch && numberMatch[1]) {
                                amount = parseFloat(numberMatch[1]);
                            }

                            const tokenMatch = fromStr.match(/[\d.]+\s+([A-Z]+)/);
                            if (tokenMatch && tokenMatch[1]) {
                                tokenSymbol = tokenMatch[1];
                            }
                        }
                    }

                    // Convert to USD using TOKEN_PRICES
                    if (!isNaN(amount) && amount > 0 && tokenSymbol) {
                        const tokenPrice = TOKEN_PRICES[tokenSymbol];
                        if (tokenPrice) {
                            const usdValue = amount * tokenPrice;
                            volumeUSD += usdValue;
                        } else if (tokenSymbol === 'USDC') {
                            // USDC is always $1
                            volumeUSD += amount;
                        }
                    }
                });

                setTotalVolume(Math.round(volumeUSD));
                setLoading(false);
            } catch (error) {
                console.error('Error calculating total volume:', error);
                setTotalVolume(0);
                setLoading(false);
            }
        };

        calculateTotalVolume();

        // Recalculate when transactions might have changed
        const handleTransactionSaved = () => {
            calculateTotalVolume();
        };

        window.addEventListener('transactionSaved', handleTransactionSaved);

        return () => {
            window.removeEventListener('transactionSaved', handleTransactionSaved);
        };
    }, []);

    return { totalVolume, loading };
}
