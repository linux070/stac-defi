import { supabase } from './supabase'
import { transactionStore } from '../utils/transactionStore'
import { logger } from '../utils/logger'

/**
 * Transaction Service
 * 
 * High-level service to manage cross-persistence between LocalStorage (IndexedDB)
 * and Supabase. This ensures "Optimistic UI" updates (local) while maintaining
 * a permanent, cross-device historical record (Supabase).
 */
export const txService = {
  /**
   * Save a transaction to both local and remote storage
   */
  async saveTransaction(txData) {
    const { 
      id, sender, tokenIn, tokenOut, amountIn, amountOut, 
      amount, type, chain, status, timestamp,
      sourceChain, destinationChain, receiveTxHash 
    } = txData;
    
    if (!sender) return;
    const safeSender = sender.toLowerCase();

    // 1. Save to LocalStorage (Optimistic/Immediate)
    try {
      transactionStore.addTransaction({
        id,
        type,
        status: status || 'success',
        sender: safeSender,
        tokenIn,
        tokenOut,
        amountIn,
        amountOut,
        amount,
        chain: chain || 'Arc Testnet',
        sourceChain,
        destinationChain,
        receiveTxHash,
        timestamp: timestamp || Date.now()
      });
    } catch (err) {
      logger.error('[txService] Local save error:', err);
    }

    // 2. Save to Supabase (Persistent/Background)
    try {
      const { error } = await supabase
        .from('transactions')
        .upsert({
          id, 
          sender: safeSender,
          token_in: tokenIn,
          token_out: tokenOut,
          amount_in: amountIn,
          amount_out: amountOut,
          amount,
          type,
          status: status || 'success',
          chain: chain || 'Arc Testnet',
          source_chain: sourceChain,
          destination_chain: destinationChain,
          receive_tx_hash: receiveTxHash,
          timestamp: timestamp || (new Date().toISOString())
        });

      if (error) throw error;
      logger.info(`[txService] Remote sync successful for ${id}`);
    } catch (err) {
      logger.error('[txService] Remote sync failed:', err.message);
    }
  },

  /**
   * Fetch ALL confirmed transactions from Supabase (Global)
   */
  async getConfirmedTransactions() {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .order('timestamp', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (err) {
      logger.error('[txService] Remote fetch failed:', err.message);
      return [];
    }
  },

  /**
   * Subscribe to ALL real-time transaction updates (Global)
   */
  subscribeToUpdates(callback) {
    const channel = supabase.channel('global_tx_updates');
    
    return channel
      .on(
        'postgres_changes',
        {
          event: '*', 
          schema: 'public',
          table: 'transactions'
        },
        (payload) => {
          logger.info('[txService] Global real-time change detected:', payload.eventType);
          if (payload.new) callback(payload.new);
        }
      )
      .subscribe((status, err) => {
        logger.info(`[txService] Global subscription status:`, status);
        if (err) logger.error('[txService] Global subscription error:', err);
      });
  }
};
