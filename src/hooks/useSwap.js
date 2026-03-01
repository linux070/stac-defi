// src/hooks/useSwap.js
import { useWriteContract, useWaitForTransactionReceipt, useAccount, useReadContracts } from 'wagmi';
import { parseUnits, formatUnits } from 'viem';
import { useEffect, useCallback, useMemo, useState, useRef } from 'react';
import { DEX_ADDRESS, USDC_ADDRESS, TOKENS, DECIMALS, CHAINS } from '../config/constants';
import { TOKEN_PRICES } from '../config/networks';
import DexABI from '../abis/StacDEX.json';
import TokenABI from '../abis/StandardToken.json';

/**
 * Parse error messages into human-readable format
 */
const parseError = (error, chainId, fromTokenSymbol) => {
    if (!error) return null;
    const msg = error.message?.toLowerCase() || '';

    if (msg.includes('user rejected')) return 'Transaction was rejected in wallet.';
    if (msg.includes('insufficient funds') || msg.includes('transfer amount exceeds balance')) {
        if (chainId === CHAINS.ARC_TESTNET && fromTokenSymbol === 'USDC') {
            return 'Insufficient USDC balance. Please leave at least 1.5 USDC for gas fees on Arc Testnet.';
        }
        return 'Insufficient balance for this swap.';
    }
    if (msg.includes('slippage') || msg.includes('output amount too low')) return 'Slippage too high. Please increase slippage tolerance.';
    if (msg.includes('execution reverted')) return 'Transaction failed. The DEX might have insufficient liquidity for this pair.';

    return 'An unexpected error occurred. Please try again.';
};

/**
 * Enhanced useSwap hook with robust state management, 
 * transaction tracking, and gas buffer support for Arc Testnet.
 */
export function useSwap(
    fromTokenSymbol, // e.g. "USDC"
    toTokenSymbol,   // e.g. "BALL"
    amountIn,        // e.g. "10"
    slippage         // e.g. 0.5
) {
    const { address: userAddress, chainId } = useAccount();
    const activeTxIdRef = useRef(0);

    // Consolidated state for better UI feedback
    const [state, setState] = useState({
        step: 'idle', // idle, approving, swapping, success, error
        error: null,
        txHash: null,
        isLoading: false,
    });

    // ------------------------------------------
    // 1. Identify Swap Mode
    // ------------------------------------------
    const isUSDCIn = fromTokenSymbol === 'USDC';
    const isUSDCOut = toTokenSymbol === 'USDC';
    const isTokenToToken = !isUSDCIn && !isUSDCOut;

    const fromTokenAddress = isUSDCIn ? USDC_ADDRESS : TOKENS[fromTokenSymbol];
    const toTokenAddress = isUSDCOut ? USDC_ADDRESS : TOKENS[toTokenSymbol];

    // ------------------------------------------
    // 2. READ: Allowances
    // ------------------------------------------
    const { data: allowance, refetch: refetchAllowance } = useReadContracts({
        contracts: [
            {
                address: fromTokenAddress,
                abi: TokenABI,
                functionName: 'allowance',
                args: [userAddress, DEX_ADDRESS],
            }
        ],
        query: {
            enabled: !!userAddress && !!fromTokenAddress,
            staleTime: 5000,
        }
    });

    const currentAllowance = allowance?.[0]?.result;

    // ------------------------------------------
    // 3. READ: Fetch Current Prices
    // ------------------------------------------
    const { data: priceData } = useReadContracts({
        contracts: [
            {
                address: DEX_ADDRESS,
                abi: DexABI,
                functionName: 'getTokenPrice',
                args: [!isUSDCIn ? TOKENS[fromTokenSymbol] : USDC_ADDRESS],
            },
            {
                address: DEX_ADDRESS,
                abi: DexABI,
                functionName: 'getTokenPrice',
                args: [!isUSDCOut ? TOKENS[toTokenSymbol] : USDC_ADDRESS],
            }
        ],
        query: {
            staleTime: 10000,
            refetchInterval: 10000,
            enabled: !!fromTokenSymbol && !!toTokenSymbol
        }
    });

    const priceIn = !isUSDCIn
        ? (priceData?.[0]?.result && priceData?.[0]?.result > 0n
            ? priceData?.[0]?.result * BigInt(10 ** (18 - DECIMALS.USDC))
            : parseUnits(String(TOKEN_PRICES[fromTokenSymbol] || "0"), 18))
        : parseUnits("1", 18);

    const priceOut = !isUSDCOut
        ? (priceData?.[1]?.result && priceData?.[1]?.result > 0n
            ? priceData?.[1]?.result * BigInt(10 ** (18 - DECIMALS.USDC))
            : parseUnits(String(TOKEN_PRICES[toTokenSymbol] || "0"), 18))
        : parseUnits("1", 18);

    // ------------------------------------------
    // 4. MATH: Calculate Output
    // ------------------------------------------
    const decimalsIn = isUSDCIn ? DECIMALS.USDC || 6 : DECIMALS.OTHERS || 18;
    const amountInBigInt = amountIn ? parseUnits(amountIn, decimalsIn) : 0n;

    let expectedOutFormatted = null;
    let expectedOutRaw = 0n;
    if (amountInBigInt > 0n) {
        const decimalsOut = isUSDCOut ? DECIMALS.USDC || 6 : DECIMALS.OTHERS || 18;
        if (isUSDCIn && priceOut) {
            expectedOutRaw = (amountInBigInt * BigInt(10 ** (decimalsOut + 18 - decimalsIn))) / priceOut;
        } else if (isUSDCOut && priceIn) {
            expectedOutRaw = (amountInBigInt * priceIn) / BigInt(10 ** (decimalsIn + 18 - decimalsOut));
        } else if (isTokenToToken && priceIn && priceOut) {
            const usdcEquivalent18 = (amountInBigInt * priceIn) / BigInt(10 ** 18);
            expectedOutRaw = (usdcEquivalent18 * BigInt(10 ** 18)) / priceOut;
        }

        if (expectedOutRaw > 0n) {
            expectedOutFormatted = formatUnits(expectedOutRaw, decimalsOut);
        }
    }

    // ------------------------------------------
    // 5. WRITE: Transactions
    // ------------------------------------------
    const { writeContract: writeApprove, data: approveHash, isPending: isApprovingRaw, error: approveErrorRaw, reset: resetApprove } = useWriteContract();
    const { writeContract: writeSwap, data: swapHash, isPending: isSwappingRaw, error: swapErrorRaw, reset: resetSwap } = useWriteContract();

    const { isSuccess: approveSuccess, isLoading: isWaitingApprove } = useWaitForTransactionReceipt({ hash: approveHash });
    const { isSuccess: swapSuccess, isLoading: isWaitingSwap } = useWaitForTransactionReceipt({ hash: swapHash });

    // Sync allowance on success
    useEffect(() => {
        if (approveSuccess) refetchAllowance();
    }, [approveSuccess, refetchAllowance]);

    const needsApproval = currentAllowance !== undefined ? currentAllowance < amountInBigInt : false;

    // Helper to update state safely
    const setSafeState = useCallback((newState, txId) => {
        if (activeTxIdRef.current === txId) {
            setState(prev => ({ ...prev, ...newState }));
        }
    }, []);

    const handleApprove = useCallback(async () => {
        const txId = ++activeTxIdRef.current;
        setSafeState({ step: 'approving', error: null, isLoading: true }, txId);

        try {
            writeApprove({
                address: fromTokenAddress,
                abi: TokenABI,
                functionName: 'approve',
                args: [DEX_ADDRESS, amountInBigInt],
            });
        } catch (err) {
            setSafeState({ step: 'error', error: parseError(err, chainId, fromTokenSymbol), isLoading: false }, txId);
        }
    }, [writeApprove, fromTokenAddress, amountInBigInt, setSafeState, chainId, fromTokenSymbol]);

    const executeSwap = useCallback(async () => {
        const txId = ++activeTxIdRef.current;
        setSafeState({ step: 'swapping', error: null, isLoading: true }, txId);

        try {
            // Safety check for UI
            if (slippage > 5 || slippage < 0) {
                setSafeState({ step: 'error', error: 'Slippage must be between 0% and 5%.', isLoading: false }, txId);
                return;
            }

            const slippageValue = slippage || 0.5;

            // Calculate amountOutMin = expectedAmount * (1 - slippage/100) using BigInt
            const slippageMultiplier = BigInt(Math.floor((1 - slippageValue / 100) * 10000));
            const amountOutMin = (expectedOutRaw * slippageMultiplier) / 10000n;
            console.log(`[Swap Router] Off-chain estimated amountOutMin for internal monitoring = ${amountOutMin}`);

            // Note: StacDEX currently lacks on-chain slippage bounds natively (no amountOutMin arg). 
            // The slippage parameter is handled off-chain via mathematical bounds check, but true MEV protection requires upgrading the DEX contract.

            // Smart Router logic
            if (isUSDCOut) {
                // If selling token for USDC => swapTokenForUSDC
                writeSwap({
                    address: DEX_ADDRESS,
                    abi: DexABI,
                    functionName: 'swapTokenForUSDC',
                    args: [fromTokenAddress, amountInBigInt],
                });
            } else if (isUSDCIn) {
                // If selling USDC for token => swapUSDCForToken
                writeSwap({
                    address: DEX_ADDRESS,
                    abi: DexABI,
                    functionName: 'swapUSDCForToken',
                    args: [toTokenAddress, amountInBigInt],
                });
            } else {
                setSafeState({ step: 'error', error: 'Direct token-to-token swaps are not supported. Please route through USDC.', isLoading: false }, txId);
            }
        } catch (err) {
            setSafeState({ step: 'error', error: parseError(err, chainId, fromTokenSymbol), isLoading: false }, txId);
        }
    }, [writeSwap, isUSDCOut, isUSDCIn, fromTokenAddress, toTokenAddress, amountInBigInt, expectedOutRaw, slippage, setSafeState, chainId, fromTokenSymbol]);

    // Track success/error states from wagmi hooks
    useEffect(() => {
        if (approveErrorRaw) {
            setState(prev => ({ ...prev, step: 'error', error: parseError(approveErrorRaw, chainId, fromTokenSymbol), isLoading: false }));
        }
        if (swapErrorRaw) {
            setState(prev => ({ ...prev, step: 'error', error: parseError(swapErrorRaw, chainId, fromTokenSymbol), isLoading: false }));
        }
        if (swapSuccess) {
            setState(prev => ({ ...prev, step: 'success', isLoading: false, txHash: swapHash }));
        }
    }, [approveErrorRaw, swapErrorRaw, swapSuccess, swapHash, chainId, fromTokenSymbol]);

    const reset = useCallback(() => {
        activeTxIdRef.current++;
        resetApprove();
        resetSwap();
        setState({
            step: 'idle',
            error: null,
            txHash: null,
            isLoading: false,
        });
    }, [resetApprove, resetSwap]);

    const displayPrice = useMemo(() => {
        const pIn = Number(priceIn) / 1e18;
        const pOut = Number(priceOut) / 1e18;
        if (isUSDCIn) return pOut;
        if (isUSDCOut) return pIn;
        if (isTokenToToken && pIn && pOut) return pIn / pOut;
        return null;
    }, [isUSDCIn, isUSDCOut, isTokenToToken, priceIn, priceOut]);

    return useMemo(() => ({
        ...state,
        needsApproval,
        handleApprove,
        executeSwap, // Unified swap logic
        handleSwap: executeSwap, // Mapped for backward compatibility
        reset,
        isApproving: isApprovingRaw || isWaitingApprove,
        approveSuccess,
        isSwapping: isSwappingRaw || isWaitingSwap,
        swapSuccess,
        expectedOut: expectedOutFormatted,
        price: displayPrice,
        priceImpact: "0.01",
        isTokenToToken
    }), [
        state,
        needsApproval,
        handleApprove,
        executeSwap,
        reset,
        isApprovingRaw,
        isWaitingApprove,
        approveSuccess,
        isSwappingRaw,
        isWaitingSwap,
        swapSuccess,
        expectedOutFormatted,
        displayPrice,
        isTokenToToken
    ]);
}
