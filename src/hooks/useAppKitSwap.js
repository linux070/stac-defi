/**
 * useAppKitSwap — Circle App Kit Swap Integration
 * 
 * This hook wraps the Circle App Kit's `kit.swap()` method to provide
 * a swap pathway that competes alongside existing DEX aggregator routes.
 * 
 * Currently supported on Arc Testnet for USDC ↔ EURC pairs.
 * The kit key is fetched securely at runtime (never bundled).
 * 
 * Architecture:
 *  - estimateSwap()    → Returns an estimated quote for the UI using SDK
 *  - executeSwap()     → Executes the actual swap via App Kit SDK with slippage/fees
 *  - Both use the secure kitKey provider (src/utils/kitKey.js)
 */

import { useState, useCallback, useRef } from 'react';
import { useAccount } from 'wagmi';
import { createPublicClient, http, fallback } from 'viem';
import { AppKit } from '@circle-fin/app-kit';
import { createViemAdapterFromProvider } from '@circle-fin/adapter-viem-v2';
import { getKitKey } from '../utils/kitKey';
import { CHAINS } from '../config/constants';
import { logger } from '../utils/logger';

// --- Constants ---
const ARC_CHAIN_ID = CHAINS.ARC_TESTNET; // 5042002

// RPC fallback for Arc
const ARC_RPC_URLS = [
  import.meta.env.VITE_ARC_RPC_URL,
  'https://rpc.testnet.arc.network',
].filter(Boolean);

const createFallbackTransport = (urls) =>
  fallback(
    urls.map((url) => http(url, { timeout: 30000 })),
    { rank: true, retryCount: 3, retryDelay: 2000 }
  );

/**
 * Pairs supported by Circle App Kit Swap on Arc Testnet.
 */
const APPKIT_SUPPORTED_PAIRS = [
  ['USDC', 'EURC'],
  ['EURC', 'USDC'],
];

/**
 * Checks whether a token pair is supported by the App Kit swap.
 */
export function isAppKitSwapSupported(fromToken, toToken, chainId) {
  if (chainId !== ARC_CHAIN_ID) return false;
  return APPKIT_SUPPORTED_PAIRS.some(
    ([a, b]) => a === fromToken && b === toToken
  );
}

/**
 * Creates a viem adapter from the current wallet connector.
 */
async function createAdapter(connector) {
  const provider = await connector.getProvider();
  return createViemAdapterFromProvider({
    provider,
    getPublicClient: ({ chain }) =>
      createPublicClient({
        chain,
        transport: createFallbackTransport(ARC_RPC_URLS),
      }),
  });
}

/**
 * Main hook for App Kit swap integration.
 */
export function useAppKitSwap() {
  const { isConnected, connector, chainId } = useAccount();
  const activeTxRef = useRef(0);

  const [state, setState] = useState({
    step: 'idle',       // idle | approving | swapping | success | error
    error: null,
    txHash: null,
    isLoading: false,
    expectedOut: null,
  });

  /**
   * Fetches an estimate (quote) for a swap.
   * 
   * @param {string} fromToken - Token symbol to sell
   * @param {string} toToken   - Token symbol to buy
   * @param {string} amountIn  - Amount to swap
   * @returns {Promise<{amountOut: string, priceImpact: string}>}
   */
  const estimateSwap = useCallback(async (fromToken, toToken, amountIn) => {
    if (!amountIn || parseFloat(amountIn) <= 0) return null;
    
    try {
      if (!isAppKitSwapSupported(fromToken, toToken, chainId)) return null;

      const kitKey = await getKitKey();
      const adapter = await createAdapter(connector);
      const kit = new AppKit();

      const estimation = await kit.estimateSwap({
        from: { adapter, chain: 'Arc_Testnet' },
        tokenIn: fromToken,
        tokenOut: toToken,
        amountIn: String(amountIn),
        config: { kitKey },
      });

      return {
        amountOut: estimation?.amountOut || '0',
        priceImpact: estimation?.priceImpact || '0',
      };
    } catch (err) {
      logger.error('[AppKit Estimate] Error:', err);
      return null;
    }
  }, [chainId, connector]);

  /**
   * Execute the App Kit swap.
   * 
   * @param {string} fromToken - Token symbol to sell
   * @param {string} toToken   - Token symbol to buy
   * @param {string} amountIn  - Amount to swap
   * @param {number} slippage  - Max slippage percentage (e.g. 0.5)
   */
  const executeSwap = useCallback(
    async (fromToken, toToken, amountIn, slippage = 0.5) => {
      const txId = ++activeTxRef.current;

      const setSafe = (ns) => {
        if (activeTxRef.current === txId) {
          setState((prev) => ({ ...prev, ...ns }));
        }
      };

      try {
        if (!isConnected || !connector) {
          throw new Error('Wallet not connected');
        }

        if (!isAppKitSwapSupported(fromToken, toToken, chainId)) {
          throw new Error(
            `App Kit swap does not support ${fromToken} → ${toToken} on this chain`
          );
        }

        setSafe({ step: 'swapping', error: null, isLoading: true, txHash: null });

        const kitKey = await getKitKey();
        const adapter = await createAdapter(connector);
        const kit = new AppKit();

        // Register event handlers
        kit.on('swap.approve', () => setSafe({ step: 'approving' }));
        kit.on('swap.execute', () => setSafe({ step: 'swapping' }));

        logger.log(`[AppKit Swap] Executing: ${amountIn} ${fromToken} → ${toToken} (Slippage: ${slippage}%)`);

        const result = await kit.swap({
          from: { adapter, chain: 'Arc_Testnet' },
          tokenIn: fromToken,
          tokenOut: toToken,
          amountIn: String(amountIn),
          config: {
            kitKey,
            maxSlippage: Number(slippage)
            // No customFee applied (0.00% recipient fee). Developer requested a completely free platform transaction.
          },
        });

        const hash = result?.hash || result?.txHash || result?.steps?.find(s => s.txHash)?.txHash;

        if (hash) {
          setSafe({
            step: 'success',
            isLoading: false,
            txHash: hash,
            expectedOut: result?.amountOut || result?.toAmount || amountIn || null,
          });
          return { txHash: hash, amountOut: result?.amountOut };
        } else {
          throw new Error('Swap completed but no transaction hash was returned');
        }
      } catch (err) {
        logger.error('[AppKit Swap] Error:', err);
        const errorMsg = err?.message || String(err);
        const lower = errorMsg.toLowerCase();
        const isRejection = lower.includes('user rejected') || lower.includes('user denied') || err?.code === 4001;

        setSafe({
          step: 'error',
          error: isRejection ? 'Transaction was rejected in wallet.' : errorMsg,
          isLoading: false,
        });

        throw err;
      }
    },
    [isConnected, connector, chainId]
  );

  const reset = useCallback(() => {
    activeTxRef.current++;
    setState({
      step: 'idle',
      error: null,
      txHash: null,
      isLoading: false,
      expectedOut: null,
    });
  }, []);

  return {
    ...state,
    executeSwap,
    estimateSwap,
    reset,
    isAppKitRoute: true,
  };
}
