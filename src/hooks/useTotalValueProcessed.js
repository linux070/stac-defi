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

    useEffect(() => {
        const calculateTotalValue = async () => {
            try {
                setLoading(true);

                // Get all transactions from IndexedDB
                const transactions = await getItem('myTransactions');

                if (!transactions || !Array.isArray(transactions)) {
                    setTotalValue(0);
                    setLoading(false);
                    return;
                }

                // Calculate total value processed in USD
                let totalUSD = 0;

                transactions.forEach(tx => {
                    if (!tx.amount) return;

                    let amount = 0;
                    let tokenSymbol = '';

                    const amountStr = String(tx.amount);

                    // Handle different transaction types
                    if (tx.type === 'Swap') {
                        // Format: "1 EURC → 1.096700 USDC" - extract first amount and token
                        if (amountStr.includes('→')) {
                            const parts = amountStr.split('→');
                            const firstPart = parts[0].trim();

                            // Extract number
                            const numberMatch = firstPart.match(/^([\d.]+)/);
                            if (numberMatch && numberMatch[1]) {
                                amount = parseFloat(numberMatch[1]);
                            }

                            // Extract token symbol
                            const tokenMatch = firstPart.match(/[\d.]+\s+([A-Z]+)/);
                            if (tokenMatch && tokenMatch[1]) {
                                tokenSymbol = tokenMatch[1];
                            }
                        }
                    } else if (tx.type === 'Bridge') {
                        // For bridges, amount is usually a direct number
                        amount = parseFloat(amountStr);

                        // Try to get token symbol from tx data
                        // Bridges typically use USDC
                        tokenSymbol = 'USDC';
                    } else if (tx.type === 'Liquidity') {
                        // Future: Handle liquidity operations
                        amount = parseFloat(amountStr);
                        // Extract token from tx data when liquidity is implemented
                    }

                    // Convert to USD using TOKEN_PRICES
                    if (!isNaN(amount) && amount > 0 && tokenSymbol) {
                        const tokenPrice = TOKEN_PRICES[tokenSymbol];
                        if (tokenPrice) {
                            const usdValue = amount * tokenPrice;
                            totalUSD += usdValue;
                        } else if (tokenSymbol === 'USDC') {
                            // USDC is always $1
                            totalUSD += amount;
                        }
                    }
                });

                setTotalValue(Math.round(totalUSD));
                setLoading(false);
            } catch (error) {
                console.error('Error calculating total value processed:', error);
                setTotalValue(0);
                setLoading(false);
            }
        };

        calculateTotalValue();

        // Recalculate when transactions might have changed
        const handleTransactionSaved = () => {
            calculateTotalValue();
        };

        window.addEventListener('transactionSaved', handleTransactionSaved);

        return () => {
            window.removeEventListener('transactionSaved', handleTransactionSaved);
        };
    }, []);

    return { totalValue, loading };
}
