// src/hooks/useSwap.js
import { useReadContract, useWriteContract, useWaitForTransactionReceipt, useAccount } from 'wagmi';
import { parseUnits, formatUnits } from 'viem';
import { useEffect, useCallback, useMemo } from 'react';
import { DEX_ADDRESS, USDC_ADDRESS, TOKENS, DECIMALS } from '../config/constants';
import DexABI from '../abis/DexABI.json';
import TokenABI from '../abis/TokenABI.json';

export function useSwap(
    fromTokenSymbol, // e.g. "USDC"
    toTokenSymbol,   // e.g. "BALL"
    amountIn,        // e.g. "10"
    slippagePercent  // e.g. 0.5
) {
    const { address: userAddress } = useAccount();

    // 1. Identify Logic: Are we Buying (USDC -> Token) or Selling (Token -> USDC)?
    const isBuying = fromTokenSymbol === 'USDC';
    const targetTokenSymbol = isBuying ? toTokenSymbol : fromTokenSymbol;
    const targetTokenAddress = TOKENS[targetTokenSymbol];

    // 2. Resolve Decimals
    const decimalsIn = isBuying ? DECIMALS.USDC : DECIMALS.OTHERS;
    // Convert input string to BigInt (handle empty/invalid inputs safely)
    const amountInBigInt = amountIn ? parseUnits(amountIn, decimalsIn) : 0n;

    // ------------------------------------------
    // READ: Check Allowance
    // ------------------------------------------
    const { data: allowance, refetch: refetchAllowance } = useReadContract({
        address: isBuying ? USDC_ADDRESS : targetTokenAddress,
        abi: TokenABI,
        functionName: 'allowance',
        args: [userAddress, DEX_ADDRESS],
    });

    // ------------------------------------------
    // READ: Fetch Current Price
    // ------------------------------------------
    const { data: priceBigInt } = useReadContract({
        address: DEX_ADDRESS,
        abi: DexABI,
        functionName: 'getTokenPrice',
        args: [targetTokenAddress],
    });

    // ------------------------------------------
    // MATH: Calculate Min Output (Slippage)
    // ------------------------------------------
    let minOut = 0n;

    if (amountInBigInt > 0n && priceBigInt) {
        const price = priceBigInt; // In JS, this is already the value
        let expectedOut = 0n;

        if (isBuying) {
            // Buy Logic: (USDC * 1e18) / Price
            // We multiply by 1e18 first to keep precision
            expectedOut = (amountInBigInt * BigInt(10 ** 18)) / price;
        } else {
            // Sell Logic: (Token * Price) / 1e18
            expectedOut = (amountInBigInt * price) / BigInt(10 ** 18);
        }

        // Apply Slippage % (Basis Points: 0.5% = 995/1000)
        // Math.floor ensures we pass an integer to BigInt
        const slipFactor = BigInt(Math.floor((100 - slippagePercent) * 1000));
        minOut = (expectedOut * slipFactor) / 100000n;
    }

    // ------------------------------------------
    // WRITE: Transactions
    // ------------------------------------------
    const { writeContract: writeApprove, data: approveHash, isPending: isApproving, error: st_error, reset: resetApprove } = useWriteContract();
    const { writeContract: writeSwap, data: swapHash, isPending: isSwapping, error: sw_error, reset: resetSwap } = useWriteContract();

    const { isSuccess: approveSuccess } = useWaitForTransactionReceipt({ hash: approveHash });
    const { isSuccess: swapSuccess } = useWaitForTransactionReceipt({ hash: swapHash });

    // Refresh allowance after approval
    useEffect(() => {
        if (approveSuccess) refetchAllowance();
    }, [approveSuccess, refetchAllowance]);

    // ------------------------------------------
    // ACTIONS
    // ------------------------------------------
    // If allowance is undefined, assume we don't need approval yet to prevent UI flash
    const needsApproval = allowance !== undefined ? allowance < amountInBigInt : false;

    const handleApprove = useCallback(() => {
        writeApprove({
            address: isBuying ? USDC_ADDRESS : targetTokenAddress,
            abi: TokenABI,
            functionName: 'approve',
            args: [DEX_ADDRESS, BigInt("115792089237316195423570985008687907853269984665640564039457584007913129639935")], // Max Uint256
        });
    }, [writeApprove, isBuying, targetTokenAddress]);

    const handleSwap = useCallback(() => {
        if (!amountInBigInt || minOut === 0n) return;

        if (isBuying) {
            writeSwap({
                address: DEX_ADDRESS,
                abi: DexABI,
                functionName: 'swapUSDCForToken',
                args: [targetTokenAddress, amountInBigInt, minOut],
            });
        } else {
            writeSwap({
                address: DEX_ADDRESS,
                abi: DexABI,
                functionName: 'swapTokenForUSDC',
                args: [targetTokenAddress, amountInBigInt, minOut],
            });
        }
    }, [writeSwap, isBuying, targetTokenAddress, amountInBigInt, minOut]);

    const reset = useCallback(() => {
        resetApprove();
        resetSwap();
    }, [resetApprove, resetSwap]);

    // ------------------------------------------
    // DISPLAY VALUES
    // ------------------------------------------
    const expectedOutFormatted = useMemo(() => {
        if (amountInBigInt > 0n && priceBigInt) {
            const decimalsOut = isBuying ? DECIMALS.OTHERS : DECIMALS.USDC;
            let expectedOut = 0n;
            if (isBuying) {
                expectedOut = (amountInBigInt * BigInt(10 ** 18)) / priceBigInt;
            } else {
                expectedOut = (amountInBigInt * priceBigInt) / BigInt(10 ** 18);
            }

            // Use standard formatting to maintain precision
            let formatted = formatUnits(expectedOut, decimalsOut);

            // Trim to reasonable decimals for UI if it's too long, but keep it as string
            if (formatted.includes('.')) {
                const [whole, fraction] = formatted.split('.');
                formatted = `${whole}.${fraction.slice(0, 6)}`;
            }
            return formatted;
        }
        return "0";
    }, [amountInBigInt, priceBigInt, isBuying]);

    const displayPrice = useMemo(() => {
        return priceBigInt ? (Number(priceBigInt) / 1e18).toFixed(6) : "0";
    }, [priceBigInt]);

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
        isSuccess: swapSuccess,
        txHash: swapHash,
        error: st_error || sw_error,
        expectedOut: expectedOutFormatted,
        price: displayPrice
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
        displayPrice
    ]);
}
