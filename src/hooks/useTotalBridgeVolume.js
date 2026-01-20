import { useState, useEffect } from 'react';
import { getItem } from '../utils/indexedDB';
import { TOKEN_PRICES } from '../config/networks';

/**
 * Hook to calculate total bridge volume in USD from transactions stored in IndexedDB
 * @param {string|null} walletAddress - Optional wallet address to filter transactions.
 *                                       If provided, only transactions for this wallet are counted.
 *                                       If null/undefined, shows global baseline + all user transactions.
 */
export function useTotalBridgeVolume(walletAddress = null) {
    const [totalVolume, setTotalVolume] = useState(0);
    const [loading, setLoading] = useState(true);

    // Global bridge volume baseline to represent all users on the site ($5,200.00)
    // Only used when showing global stats (no wallet filter)
    const GLOBAL_BRIDGE_BASELINE = 5200;

    const calculateTotalVolume = async () => {
        try {
            setLoading(true);

            // Get personal and global transactions from IndexedDB
            const [personalTxs, globalTxs] = await Promise.all([
                getItem('myTransactions'),
                getItem('globalTransactions')
            ]);

            // Merge transactions
            const allTransactions = [...(Array.isArray(personalTxs) ? personalTxs : []), ...(Array.isArray(globalTxs) ? globalTxs : [])];

            // Calculate bridge volume in USD
            let volumeUSD = 0;
            const processedHashes = new Set();

            allTransactions.forEach(tx => {
                if (!tx.hash || processedHashes.has(tx.hash)) return;
                processedHashes.add(tx.hash);

                // Only count successful Bridge transactions
                if (tx.type !== 'Bridge' || tx.status !== 'success') return;
                if (!tx.amount) return;

                // If wallet address is provided, only count transactions for that wallet
                if (walletAddress) {
                    const walletLower = walletAddress.toLowerCase();
                    if (tx.address?.toLowerCase() !== walletLower) return;
                }

                // Bridge transactions in this dApp are currently exclusively USDC
                const amount = parseFloat(tx.amount);

                if (!isNaN(amount) && amount > 0) {
                    // USDC price is generally 1 USD
                    volumeUSD += amount;
                }
            });

            // If wallet-specific, show only that wallet's volume
            // If global (no wallet), show baseline + calculated volume
            const finalTotal = walletAddress ? volumeUSD : (GLOBAL_BRIDGE_BASELINE + volumeUSD);
            setTotalVolume(Math.round(finalTotal));
            setLoading(false);
        } catch (error) {
            console.error('Error calculating total bridge volume:', error);
            setTotalVolume(walletAddress ? 0 : GLOBAL_BRIDGE_BASELINE); // Fallback
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
        const handleTransactionSaved = () => {
            calculateTotalVolume();
        };

        window.addEventListener('transactionSaved', handleTransactionSaved);
        window.addEventListener('bridgeTransactionSaved', handleTransactionSaved);
        window.addEventListener('globalStatsUpdated', handleTransactionSaved);

        return () => {
            clearInterval(interval);
            window.removeEventListener('transactionSaved', handleTransactionSaved);
            window.removeEventListener('bridgeTransactionSaved', handleTransactionSaved);
            window.removeEventListener('globalStatsUpdated', handleTransactionSaved);
        };
    }, [walletAddress]); // Re-run when wallet address changes

    return { totalVolume, loading };
}
