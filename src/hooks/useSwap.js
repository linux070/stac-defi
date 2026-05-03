import { useWriteContract, useWaitForTransactionReceipt, useAccount, useReadContracts } from 'wagmi';
import { parseUnits, formatUnits } from 'viem';
import { useEffect, useCallback, useMemo, useState, useRef } from 'react';
import { USDC_ADDRESS, DECIMALS, CHAINS } from '../config/constants';
import { TOKENS } from '../config/networks';

import { useAppKitSwap, isAppKitSwapSupported } from './useAppKitSwap';
import { logger } from '../utils/logger';
import { txService } from '../lib/txService';

const AGGREGATOR_SOURCES = [
    {
        id: 'circle-appkit',
        name: 'Circle',
        type: 'appkit-swap',
        poolAddress: null,
        routerAddress: null,
        supportedPairs: [['USDC', 'EURC'], ['EURC', 'USDC']],
        fee: 0.002,
        logo: '/icons/usdc.png',
        config: { chain: 'Arc_Testnet' }
    },
];

// Minimal Standard ERC20 ABI for allowance and approve
const TokenABI = [
    { name: 'approve', type: 'function', stateMutability: 'nonpayable', inputs: [{ name: 'spender', type: 'address' }, { name: 'amount', type: 'uint256' }], outputs: [{ name: '', type: 'bool' }] },
    { name: 'allowance', type: 'function', stateMutability: 'view', inputs: [{ name: 'owner', type: 'address' }, { name: 'spender', type: 'address' }], outputs: [{ name: '', type: 'uint256' }] },
    { name: 'balanceOf', type: 'function', stateMutability: 'view', inputs: [{ name: 'account', type: 'address' }], outputs: [{ name: '', type: 'uint256' }] }
];

// Minimal StacDEX ABI for price queries (legacy)
const StacDexABI = [
    { name: 'getTokenPrice', type: 'function', stateMutability: 'view', inputs: [{ name: 'token', type: 'address' }], outputs: [{ name: '', type: 'uint256' }] }
];

import CurveStableSwapABI from '../abis/CurveStableSwap.json';
import UniswapV2RouterABI from '../abis/UniswapV2Router.json';


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
 * Unified useSwap hook that handles both On-Chain and App Kit swaps.
 */
export function useSwap(
    fromTokenSymbol,
    toTokenSymbol,
    amountIn,
    slippage
) {
    const { address: userAddress, chainId } = useAccount();
    const activeTxIdRef = useRef(0);
    const appKitSwap = useAppKitSwap();

    const [state, setState] = useState({
        step: 'idle',
        error: null,
        txHash: null,
        isLoading: false,
        actualAmountOut: null,
    });

    const decimalsIn = DECIMALS[fromTokenSymbol] || DECIMALS.OTHERS;
    const decimalsOut = DECIMALS[toTokenSymbol] || DECIMALS.OTHERS;
    const amountInBigInt = amountIn ? parseUnits(amountIn, decimalsIn) : 0n;

    // ------------------------------------------
    // 1. QUOTING LOGIC (Internal Aggregator)
    // ------------------------------------------
    const [appKitQuoteResult, setAppKitQuoteResult] = useState(null);
    const [isAppKitEstimating, setIsAppKitEstimating] = useState(false);

    // Fetch real-time estimates from Circle App Kit
    useEffect(() => {
        let isMounted = true;
        
        const fetchAppKitEstimate = async () => {
            if (!amountIn || parseFloat(amountIn) <= 0 || !isAppKitSwapSupported(fromTokenSymbol, toTokenSymbol, chainId)) {
                if (isMounted) setAppKitQuoteResult(null);
                return;
            }

            if (isMounted) setIsAppKitEstimating(true);
            try {
                const result = await appKitSwap.estimateSwap(fromTokenSymbol, toTokenSymbol, amountIn);
                if (isMounted) {
                    setAppKitQuoteResult({ ...result, requestedAmount: amountIn });
                }
            } catch (err) {
                logger.error('[useSwap] AppKit Estimate Error:', err);
                if (isMounted) setAppKitQuoteResult(null);
            } finally {
                if (isMounted) setIsAppKitEstimating(false);
            }
        };

        fetchAppKitEstimate();
        return () => { isMounted = false; };
    }, [fromTokenSymbol, toTokenSymbol, amountIn, chainId, appKitSwap]);

    const possiblePaths = useMemo(() => {
        if (!fromTokenSymbol || !toTokenSymbol || chainId !== CHAINS.ARC_TESTNET) return [];
        const paths = [];

        AGGREGATOR_SOURCES.forEach(source => {
            if (source.type === 'appkit-swap') {
                if (isAppKitSwapSupported(fromTokenSymbol, toTokenSymbol, chainId)) {
                    paths.push({ source, path: [fromTokenSymbol, toTokenSymbol] });
                }
                return;
            }

            const hasDirect = source.supportedPairs.some(pair => (pair[0] === fromTokenSymbol && pair[1] === toTokenSymbol));
            if (hasDirect) paths.push({ source, path: [fromTokenSymbol, toTokenSymbol] });

            if (!hasDirect && fromTokenSymbol !== 'USDC' && toTokenSymbol !== 'USDC') {
                const hasFromToUSDC = source.supportedPairs.some(pair => (pair[0] === fromTokenSymbol && pair[1] === 'USDC'));
                const hasUSDCToTo = source.supportedPairs.some(pair => (pair[0] === 'USDC' && pair[1] === toTokenSymbol));
                if (hasFromToUSDC && hasUSDCToTo) paths.push({ source, path: [fromTokenSymbol, 'USDC', toTokenSymbol] });
            }
        });
        return paths;
    }, [fromTokenSymbol, toTokenSymbol, chainId]);

    const { onChainPaths, appKitPaths } = useMemo(() => {
        const onChain = [];
        const appKit = [];
        possiblePaths.forEach((entry) => {
            if (entry.source.type === 'appkit-swap') appKit.push(entry);
            else onChain.push(entry);
        });
        return { onChainPaths: onChain, appKitPaths: appKit };
    }, [possiblePaths]);

    const contractCalls = useMemo(() => {
        if (amountInBigInt === 0n) return [];
        return onChainPaths.map(({ source, path }) => {
            const fromAddr = path[0] === 'USDC' ? USDC_ADDRESS : TOKENS[path[0]]?.address?.[chainId];
            const toAddr = path[path.length - 1] === 'USDC' ? USDC_ADDRESS : TOKENS[path[path.length - 1]]?.address?.[chainId];

            if (source.type === 'curve-stable-ng') {
                return { address: source.poolAddress, abi: CurveStableSwapABI, functionName: 'get_dy', args: [BigInt(source.config.tokens[path[0]]), BigInt(source.config.tokens[path[1]]), amountInBigInt], sourceId: source.id, path };
            }
            if (source.type === 'uniswap-v2') {
                const fullPath = path.map(symbol => symbol === 'USDC' ? USDC_ADDRESS : TOKENS[symbol]?.address?.[chainId]);
                return { address: source.routerAddress, abi: UniswapV2RouterABI, functionName: 'getAmountsOut', args: [amountInBigInt, fullPath], sourceId: source.id, path };
            }
            if (source.type === 'stac-dex') {
                return { address: source.poolAddress, abi: StacDexABI, functionName: 'getTokenPrice', args: [path[0] !== 'USDC' ? fromAddr : toAddr], sourceId: source.id, path };
            }
            return null;
        }).filter(Boolean);
    }, [onChainPaths, amountInBigInt, chainId]);

    const { data: results, isLoading: isOnChainQuoting } = useReadContracts({
        contracts: contractCalls.map(({ address, abi, functionName, args }) => ({ address, abi, functionName, args })),
        query: { enabled: contractCalls.length > 0 && amountInBigInt > 0n, staleTime: 10000 }
    });

    const quotes = useMemo(() => {
        const onChainQuotes = (results || []).map((result, index) => {
            const sourceInfo = contractCalls[index];
            const source = AGGREGATOR_SOURCES.find(s => s.id === sourceInfo.sourceId);
            let amountOutRaw = 0n;
            
            if (result.status === 'success') {
                if (source.type === 'curve-stable-ng') amountOutRaw = result.result;
                else if (source.type === 'uniswap-v2') amountOutRaw = result.result[result.result.length - 1];
                else if (source.type === 'stac-dex') {
                    const priceRel = result.result;
                    if (sourceInfo.path.length === 2 && priceRel > 0n) {
                        if (fromTokenSymbol === 'USDC') amountOutRaw = (amountInBigInt * BigInt(10 ** (decimalsOut + 18 - decimalsIn))) / priceRel;
                        else amountOutRaw = (amountInBigInt * priceRel) / BigInt(10 ** (decimalsIn + 18 - decimalsOut));
                    }
                }
            }
            return { ...source, path: sourceInfo.path, amountOutRaw, amountOutFormatted: amountOutRaw > 0n ? formatUnits(amountOutRaw, decimalsOut) : null };
        });

        const appKitQuotes = appKitPaths.map(({ source, path }) => {
            // Using real estimate if available and matching current amount, otherwise fallback to 1:1 math minus 0.02% provider fee
            const estimateIsMatching = appKitQuoteResult?.requestedAmount === amountIn;
            const estimateOut = estimateIsMatching ? appKitQuoteResult?.amountOut : null;
            const fallbackOutRaw = (amountInBigInt * 9998n) / 10000n; // 0.02% fee
            
            const finalOutRaw = estimateOut ? parseUnits(estimateOut, decimalsOut) : fallbackOutRaw;
            
            return {
                ...source, 
                path, 
                amountOutRaw: finalOutRaw, 
                priceImpact: appKitQuoteResult?.priceImpact || '0',
                // Always round to 4 decimals for high-precision visibility on small micro-swaps
                amountOutFormatted: finalOutRaw > 0n ? parseFloat(formatUnits(finalOutRaw, decimalsOut)).toFixed(4) : null, 
                status: (amountInBigInt > 0n && (estimateOut || !isAppKitEstimating)) ? 'success' : 'idle'
            };
        });

        return [...onChainQuotes, ...appKitQuotes].sort((a, b) => Number(b.amountOutRaw - a.amountOutRaw));
    }, [results, contractCalls, appKitPaths, fromTokenSymbol, amountInBigInt, decimalsIn, decimalsOut, appKitQuoteResult, isAppKitEstimating, amountIn]);

    const bestQuote = useMemo(() => quotes.length > 0 ? quotes[0] : null, [quotes]);

    // ------------------------------------------
    // 2. APPROVAL & EXECUTION LOGIC
    // ------------------------------------------
    const routerAddress = useMemo(() => {
        if (!bestQuote) return null;
        return bestQuote.routerAddress || bestQuote.poolAddress;
    }, [bestQuote]);

    const fromTokenAddress = fromTokenSymbol === 'USDC' ? USDC_ADDRESS : TOKENS[fromTokenSymbol]?.address?.[chainId];
    const toTokenAddress = toTokenSymbol === 'USDC' ? USDC_ADDRESS : TOKENS[toTokenSymbol]?.address?.[chainId];

    const { data: allowance, refetch: refetchAllowance } = useReadContracts({
        contracts: [{ address: fromTokenAddress, abi: TokenABI, functionName: 'allowance', args: [userAddress, routerAddress] }],
        query: { enabled: !!userAddress && !!fromTokenAddress && !!routerAddress, staleTime: 5000 }
    });

    const isAppKitRoute = useMemo(() => bestQuote?.type === 'appkit-swap', [bestQuote]);
    const currentAllowance = allowance?.[0]?.result;
    const needsApproval = isAppKitRoute ? false : (currentAllowance !== undefined ? currentAllowance < amountInBigInt : false);

    const { writeContract: writeApprove, data: approveHash, isPending: isApprovingRaw } = useWriteContract();
    const { writeContract: writeSwap, data: swapHash, isPending: isSwappingRaw } = useWriteContract();
    const { isSuccess: approveSuccess, isLoading: isWaitingApprove } = useWaitForTransactionReceipt({ hash: approveHash });
    const { isSuccess: onChainSwapSuccess, isLoading: isWaitingSwap, data: receipt } = useWaitForTransactionReceipt({ hash: swapHash });

    useEffect(() => {
        if (onChainSwapSuccess && receipt && !isAppKitRoute) {
            // Find the Transfer event for the toToken received by the user
            const transferTopic = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';
            const userTopic = userAddress?.toLowerCase().replace('0x', '0x000000000000000000000000');
            
            const log = receipt.logs?.find(l => 
                l.address.toLowerCase() === toTokenAddress?.toLowerCase() &&
                l.topics?.[0]?.toLowerCase() === transferTopic &&
                l.topics?.[2]?.toLowerCase() === userTopic
            );

            if (log && log.data) {
                try {
                    const val = BigInt(log.data);
                    const formatted = formatUnits(val, decimalsOut);
                    setState(prev => ({ ...prev, actualAmountOut: parseFloat(formatted).toFixed(4) }));
                } catch (err) {
                    logger.error('[useSwap] Failed to parse log data:', err);
                }
            }
        }
    }, [onChainSwapSuccess, receipt, isAppKitRoute, userAddress, toTokenAddress, decimalsOut]);

    // Add transaction to store immediately when hash is available (On-Chain)
    useEffect(() => {
        if (swapHash && !isAppKitRoute) {
            txService.saveTransaction({
                id: swapHash,
                type: 'Swap',
                status: 'pending',
                sender: userAddress,
                tokenIn: fromTokenSymbol,
                tokenOut: toTokenSymbol,
                amountIn: amountIn,
                amountOut: bestQuote?.amountOutFormatted,
                chain: 'Arc Testnet',
                timestamp: Date.now()
            });
        }
    }, [swapHash, isAppKitRoute, userAddress, fromTokenSymbol, toTokenSymbol, amountIn, bestQuote]);

    useEffect(() => { if (approveSuccess) refetchAllowance(); }, [approveSuccess, refetchAllowance]);

    const isSwapping = isAppKitRoute ? (state.step === 'swapping' || state.isLoading) : (isSwappingRaw || isWaitingSwap);
    const swapSuccess = isAppKitRoute ? (state.step === 'success') : onChainSwapSuccess;

    const setSafeState = useCallback((newState, txId) => {
        if (activeTxIdRef.current === txId) setState(prev => ({ ...prev, ...newState }));
    }, []);

    const handleApprove = useCallback(async () => {
        const txId = ++activeTxIdRef.current;
        setSafeState({ step: 'approving', error: null, isLoading: true }, txId);
        try {
            writeApprove({ address: fromTokenAddress, abi: TokenABI, functionName: 'approve', args: [routerAddress, amountInBigInt] });
        } catch (err) {
            setSafeState({ step: 'error', error: parseError(err, chainId, fromTokenSymbol), isLoading: false }, txId);
        }
    }, [writeApprove, fromTokenAddress, routerAddress, amountInBigInt, setSafeState, chainId, fromTokenSymbol]);

    const executeSwap = useCallback(async () => {
        const txId = ++activeTxIdRef.current;
        setSafeState({ step: 'swapping', error: null, isLoading: true }, txId);
        try {
            if (!bestQuote) throw new Error('No swap source selected.');

            if (isAppKitRoute) {
                const result = await appKitSwap.executeSwap(fromTokenSymbol, toTokenSymbol, amountIn, slippage);
                if (result?.txHash) {
                    setSafeState({ 
                        step: 'success', 
                        isLoading: false, 
                        txHash: result.txHash,
                        actualAmountOut: result.amountOut || null
                    }, txId);

                    // Add to store immediately via txService
                    txService.saveTransaction({
                        id: result.txHash,
                        type: 'Swap',
                        status: 'success',
                        sender: userAddress,
                        tokenIn: fromTokenSymbol,
                        tokenOut: toTokenSymbol,
                        amountIn: amountIn,
                        amountOut: result.amountOut || bestQuote?.amountOutFormatted,
                        chain: 'Arc Testnet',
                        timestamp: Date.now()
                    });
                }
                return;
            }

            const slippageValue = slippage || 0.5;
            const amountOutMin = (bestQuote.amountOutRaw * BigInt(Math.floor((1 - slippageValue / 100) * 10000))) / 10000n;
            const deadline = BigInt(Math.floor(Date.now() / 1000) + 60 * 20);

            if (bestQuote.type === 'curve-stable-ng') {
                writeSwap({ address: bestQuote.poolAddress, abi: CurveStableSwapABI, functionName: 'exchange', args: [BigInt(bestQuote.config.tokens[fromTokenSymbol]), BigInt(bestQuote.config.tokens[toTokenSymbol]), amountInBigInt, amountOutMin] });
            } else if (bestQuote.type === 'uniswap-v2') {
                const path = bestQuote.path.map(s => s === 'USDC' ? USDC_ADDRESS : TOKENS[s]?.address?.[chainId]);
                writeSwap({ address: bestQuote.routerAddress, abi: UniswapV2RouterABI, functionName: 'swapExactTokensForTokens', args: [amountInBigInt, amountOutMin, path, userAddress, deadline] });
            }
        } catch (err) {
            setSafeState({ step: 'error', error: parseError(err, chainId, fromTokenSymbol), isLoading: false }, txId);
        }
    }, [bestQuote, fromTokenSymbol, toTokenSymbol, amountIn, slippage, isAppKitRoute, appKitSwap, amountInBigInt, userAddress, writeSwap, setSafeState, chainId]);

    const priceImpact = useMemo(() => {
        if (!amountIn || !bestQuote || bestQuote.amountOutRaw === 0n) return '0.00';
        const expected = parseFloat(amountIn); 
        const out = parseFloat(formatUnits(bestQuote.amountOutRaw, decimalsOut));
        const impact = ((expected - out) / expected) * 100;
        return Math.max(0, impact).toFixed(2);
    }, [amountIn, bestQuote, decimalsOut]);

    const reset = useCallback(() => {
        activeTxIdRef.current++;
        setState({ step: 'idle', error: null, txHash: null, isLoading: false });
    }, []);

    return useMemo(() => ({
        ...state,
        needsApproval,
        handleApprove,
        handleSwap: executeSwap,
        reset,
        isApproving: isApprovingRaw || isWaitingApprove,
        approveSuccess,
        isSwapping,
        swapSuccess,
        expectedOut: state.expectedOut || bestQuote?.amountOutFormatted || null,
        actualAmountOut: state.actualAmountOut || null,
        priceImpact,
        isAppKitRoute,
        bestQuote,
        quotes,
        isQuoting: isOnChainQuoting || isAppKitEstimating
    }), [state, needsApproval, handleApprove, executeSwap, reset, isApprovingRaw, isWaitingApprove, approveSuccess, isSwapping, swapSuccess, bestQuote, priceImpact, isAppKitRoute, quotes, isOnChainQuoting, isAppKitEstimating]);
}
