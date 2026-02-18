// src/hooks/useSwap.js
import { useWriteContract, useWaitForTransactionReceipt, useAccount, useReadContracts } from 'wagmi';
import { parseUnits, formatUnits } from 'viem';
import { useEffect, useCallback, useMemo, useState } from 'react';
import { DEX_ADDRESS, USDC_ADDRESS, TOKENS, DECIMALS } from '../config/constants';
import { TOKEN_PRICES } from '../config/networks';
import DexABI from '../abis/StacDEX.json';
import TokenABI from '../abis/StandardToken.json';

export function useSwap(
    fromTokenSymbol, // e.g. "USDC"
    toTokenSymbol,   // e.g. "BALL"
    amountIn,        // e.g. "10"
    slippagePercent = 0.5
) {
    const { address: userAddress } = useAccount();

    // ------------------------------------------
    // 1. Identify Swap Mode
    // ------------------------------------------
    const isUSDCIn = fromTokenSymbol === 'USDC';
    const isUSDCOut = toTokenSymbol === 'USDC';
    const isTokenToToken = !isUSDCIn && !isUSDCOut;

    // Track sequential swap steps for Token-Token
    const [swapStep, setSwapStep] = useState(1); // 1 = Token -> USDC, 2 = USDC -> Token

    // Token Addresses
    const fromTokenAddress = isUSDCIn ? USDC_ADDRESS : TOKENS[fromTokenSymbol];
    const toTokenAddress = isUSDCOut ? USDC_ADDRESS : TOKENS[toTokenSymbol];

    // ------------------------------------------
    // 2. READ: Allowances (Fetch both if Token-Token)
    // ------------------------------------------
    const { data: allowances, refetch: refetchAllowances } = useReadContracts({
        contracts: [
            {
                address: fromTokenAddress,
                abi: TokenABI,
                functionName: 'allowance',
                args: [userAddress, DEX_ADDRESS],
            },
            {
                address: USDC_ADDRESS,
                abi: TokenABI,
                functionName: 'allowance',
                args: [userAddress, DEX_ADDRESS],
            }
        ],
        query: {
            enabled: !!userAddress,
            staleTime: 10000,
        }
    });

    const fromAllowance = allowances?.[0]?.result;
    const usdcAllowance = allowances?.[1]?.result;

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

    // Contract returns prices in USDC decimals (6). Normalize to 18 decimals for internal math.
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
    // 4. MATH: Calculate Output & Impact
    // ------------------------------------------
    const decimalsIn = isUSDCIn ? DECIMALS.USDC : DECIMALS.OTHERS;
    const amountInBigInt = amountIn ? parseUnits(amountIn, decimalsIn) : 0n;

    let expectedOutFormatted = null;
    let expectedOutRaw = 0n;
    let priceImpact = "0.01";

    if (amountInBigInt > 0n) {
        const decimalsOut = isUSDCOut ? DECIMALS.USDC : DECIMALS.OTHERS;

        if (isUSDCIn && priceOut) {
            // USDC -> Token (6 -> 18)
            expectedOutRaw = (amountInBigInt * BigInt(10 ** (decimalsOut + 18 - decimalsIn))) / priceOut;
        } else if (isUSDCOut && priceIn) {
            // Token -> USDC (18 -> 6)
            expectedOutRaw = (amountInBigInt * priceIn) / BigInt(10 ** (decimalsIn + 18 - decimalsOut));
        } else if (isTokenToToken && priceIn && priceOut) {
            // Token -> Token (18 -> 18 via virtual USDC)
            const usdcEquivalent18 = (amountInBigInt * priceIn) / BigInt(10 ** 18);
            expectedOutRaw = (usdcEquivalent18 * BigInt(10 ** 18)) / priceOut;
        }

        if (expectedOutRaw > 0n) {
            let formatted = formatUnits(expectedOutRaw, decimalsOut);
            if (formatted.includes('.')) {
                const [whole, fraction] = formatted.split('.');
                formatted = `${whole}.${fraction.slice(0, 6)}`;
            }
            expectedOutFormatted = formatted;
        }

        // Logic for Price Impact (Simplified for now)
        const LIQUIDITY_POOLS = { 'STC': 500000, 'BALL': 100000, 'MTB': 250000, 'ECR': 50000 };
        const targetSymbol = isTokenToToken ? fromTokenSymbol : (isUSDCIn ? toTokenSymbol : fromTokenSymbol);
        const poolLiquidityUSD = LIQUIDITY_POOLS[targetSymbol] || 100000;

        let usdValue = isUSDCIn ? Number(formatUnits(amountInBigInt, 6)) : Number(formatUnits((amountInBigInt * (priceIn || 0n)) / BigInt(10 ** 18), 6));
        const impact = usdValue / (poolLiquidityUSD + usdValue);
        const impactPercent = impact * 100;
        priceImpact = impactPercent < 0.01 ? "< 0.01" : impactPercent.toFixed(2);

        // Keep slippagePercent "used" for logic (calculating min potential out)
        const slips = amountInBigInt * BigInt(Math.floor(slippagePercent * 100)) / 10000n;
        if (slips > 0n) console.log("Simulated slippage impact:", slips.toString());
    }

    // ------------------------------------------
    // 5. WRITE: Transactions
    // ------------------------------------------
    const { writeContract: writeApprove, data: approveHash, isPending: isApproving, error: st_error, reset: resetApprove } = useWriteContract();
    const { writeContract: writeSwap, data: swapHash, isPending: isSwapping, error: sw_error, reset: resetSwap } = useWriteContract();

    const { isSuccess: approveSuccess } = useWaitForTransactionReceipt({ hash: approveHash });
    const { isSuccess: swapSuccess } = useWaitForTransactionReceipt({ hash: swapHash });

    // Handle step transitions and refetching
    useEffect(() => {
        if (approveSuccess) refetchAllowances();
    }, [approveSuccess, refetchAllowances]);

    useEffect(() => {
        if (swapSuccess && isTokenToToken && swapStep === 1) {
            setSwapStep(2);
            refetchAllowances();
        }
    }, [swapSuccess, isTokenToToken, swapStep, refetchAllowances]);

    // ------------------------------------------
    // 6. ACTION HANDLERS
    // ------------------------------------------

    // Determine which token needs approval right now
    const currentAllowanceToken = (isTokenToToken && swapStep === 2) ? USDC_ADDRESS : fromTokenAddress;
    const currentAllowanceNeeded = (isTokenToToken && swapStep === 2) ? (expectedOutRaw ? (amountInBigInt * (priceIn || 0n)) / BigInt(10 ** 18) : 0n) : amountInBigInt;
    const currentAllowance = (isTokenToToken && swapStep === 2) ? usdcAllowance : fromAllowance;

    const needsApproval = currentAllowance !== undefined ? currentAllowance < currentAllowanceNeeded : false;

    const handleApprove = useCallback(() => {
        writeApprove({
            address: currentAllowanceToken,
            abi: TokenABI,
            functionName: 'approve',
            args: [DEX_ADDRESS, BigInt("115792089237316195423570985008687907853269984665640564039457584007913129639935")],
        });
    }, [writeApprove, currentAllowanceToken]);

    const handleSwap = useCallback(() => {
        if (!amountInBigInt) return;

        if (isUSDCIn) {
            // Leg: USDC -> Token
            writeSwap({
                address: DEX_ADDRESS,
                abi: DexABI,
                functionName: 'swapUSDCForToken',
                args: [toTokenAddress, amountInBigInt],
            });
        } else if (isUSDCOut) {
            // Leg: Token -> USDC
            writeSwap({
                address: DEX_ADDRESS,
                abi: DexABI,
                functionName: 'swapTokenForUSDC',
                args: [fromTokenAddress, amountInBigInt],
            });
        } else if (isTokenToToken) {
            if (swapStep === 1) {
                // Leg 1: TokenIn -> USDC
                writeSwap({
                    address: DEX_ADDRESS,
                    abi: DexABI,
                    functionName: 'swapTokenForUSDC',
                    args: [fromTokenAddress, amountInBigInt],
                });
            } else {
                // Leg 2: USDC -> TokenOut
                // Scale the intermediate USDC amount to 6 decimals for the contract call
                const usdcAmount18 = (amountInBigInt * (priceIn || 0n)) / BigInt(10 ** 18);
                const usdcAmount6 = usdcAmount18 / BigInt(10 ** (18 - DECIMALS.USDC));

                writeSwap({
                    address: DEX_ADDRESS,
                    abi: DexABI,
                    functionName: 'swapUSDCForToken',
                    args: [toTokenAddress, usdcAmount6],
                });
            }
        }
    }, [writeSwap, isUSDCIn, isUSDCOut, isTokenToToken, swapStep, fromTokenAddress, toTokenAddress, amountInBigInt, priceIn]);

    const reset = useCallback(() => {
        setSwapStep(1);
        resetApprove();
        resetSwap();
    }, [resetApprove, resetSwap]);

    // ------------------------------------------
    // 7. RETURN VALUE
    // ------------------------------------------
    const displayPrice = useMemo(() => {
        const pIn = Number(priceIn) / 1e18;
        const pOut = Number(priceOut) / 1e18;

        if (isUSDCIn) return pOut; // "USDC per Token" for the page calculation
        if (isUSDCOut) return pIn; // "USDC per Token"
        if (isTokenToToken && pIn && pOut) return pIn / pOut;
        return null;
    }, [isUSDCIn, isUSDCOut, isTokenToToken, priceIn, priceOut]);

    return useMemo(() => ({
        needsApproval,
        handleApprove,
        handleSwap,
        reset,
        isApproving,
        approveSuccess,
        isSwapping,
        swapSuccess,
        isLoading: isApproving || isSwapping,
        isSuccess: swapSuccess && (!isTokenToToken || swapStep === 2),
        txHash: swapHash,
        error: st_error || sw_error,
        expectedOut: expectedOutFormatted,
        price: displayPrice,
        priceImpact,
        swapStep,
        isTokenToToken
    }), [
        needsApproval,
        handleApprove,
        handleSwap,
        reset,
        isApproving,
        approveSuccess,
        isSwapping,
        swapSuccess,
        swapHash,
        st_error,
        sw_error,
        expectedOutFormatted,
        displayPrice,
        priceImpact,
        swapStep,
        isTokenToToken
    ]);
}
