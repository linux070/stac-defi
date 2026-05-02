import { getItem, setItem } from './indexedDB';
import { logger } from './logger';

const STORE_KEY = 'stac_optimistic_transactions_v1';

/**
 * Transaction Store
 * Centralized utility to manage "In-Flight" and "Recently Confirmed" transactions.
 * This ensures "Immediate" visibility in the UI before blockchain indexing.
 */
export const transactionStore = {
  /**
   * Get all locally stored transactions
   */
  async getTransactions() {
    try {
      const txs = await getItem(STORE_KEY);
      return Array.isArray(txs) ? txs : [];
    } catch (err) {
      logger.error('[TransactionStore] Get Error:', err);
      return [];
    }
  },

  /**
   * Add a new transaction (Optimistic)
   */
  async addTransaction(tx) {
    try {
      const txs = await this.getTransactions();
      
      // Prevent duplicates
      if (txs.some(existing => existing.id === tx.id)) return;

      const newTx = {
        ...tx,
        status: tx.status || 'pending',
        timestamp: tx.timestamp || Date.now(),
      };

      const updated = [newTx, ...txs].slice(0, 50); // Keep last 50 local txs
      await setItem(STORE_KEY, updated);
      
      this._notify();
      return newTx;
    } catch (err) {
      logger.error('[TransactionStore] Add Error:', err);
    }
  },

  /**
   * Update an existing transaction (e.g. status change or adding DST hash)
   */
  async updateTransaction(id, updates) {
    try {
      const txs = await this.getTransactions();
      const index = txs.findIndex(tx => tx.id === id);
      
      if (index === -1) return;

      txs[index] = { ...txs[index], ...updates };
      await setItem(STORE_KEY, txs);
      
      this._notify();
    } catch (err) {
      logger.error('[TransactionStore] Update Error:', err);
    }
  },

  /**
   * Remove a transaction from the local store (e.g. when it fails or is fully reconciled)
   */
  async removeTransaction(id) {
    try {
      const txs = await this.getTransactions();
      const updated = txs.filter(tx => tx.id !== id);
      await setItem(STORE_KEY, updated);
      this._notify();
    } catch (err) {
      logger.error('[TransactionStore] Remove Error:', err);
    }
  },

  /**
   * Notify the UI that transactions have changed
   */
  _notify() {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('stac_transactions_updated'));
    }
  }
};
