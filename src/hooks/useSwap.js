// src/hooks/useSwap.js
import { useReadContract, useWriteContract, useWaitForTransactionReceipt, useAccount } from 'wagmi';
import { parseUnits } from 'viem';
import { useEffect } from 'react';
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
    const { writeContract: writeApprove, data: approveHash, isPending: isApproving, error: st_error } = useWriteContract();
    const { writeContract: writeSwap, data: swapHash, isPending: isSwapping, error: sw_error } = useWriteContract();

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

    const handleApprove = () => {
        writeApprove({
            address: isBuying ? USDC_ADDRESS : targetTokenAddress,
            abi: TokenABI,
            functionName: 'approve',
            args: [DEX_ADDRESS, BigInt("115792089237316195423570985008687907853269984665640564039457584007913129639935")], // Max Uint256
        });
    };

    const handleSwap = () => {
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
    };

    // ------------------------------------------
    // DISPLAY VALUES
    // ------------------------------------------
    let expectedOutFormatted = "0";
    if (amountInBigInt > 0n && priceBigInt) {
        const decimalsOut = isBuying ? DECIMALS.OTHERS : DECIMALS.USDC;
        // Calculation logic is already done in minOut part above, let's just format the expectedOut
        let expectedOut = 0n;
        if (isBuying) {
            expectedOut = (amountInBigInt * BigInt(10 ** 18)) / priceBigInt;
        } else {
            expectedOut = (amountInBigInt * priceBigInt) / BigInt(10 ** 18);
        }

        // Manual formatting to avoid complex imports for this tiny task
        const divisor = BigInt(10 ** decimalsOut);
        const whole = expectedOut / divisor;
        const fraction = expectedOut % divisor;
        const fractionStr = fraction.toString().padStart(decimalsOut, '0').slice(0, 3);
        expectedOutFormatted = `${whole}.${fractionStr}`;
    }

    return {
        needsApproval,
        handleApprove,
        handleSwap,
        isApproving,
        approveSuccess,
        isSwapping,
        swapSuccess,
        isLoading: isApproving || isSwapping,
        isSuccess: swapSuccess,
        txHash: swapHash,
        error: st_error || sw_error,
        expectedOut: expectedOutFormatted,
        price: priceBigInt ? (Number(priceBigInt) / 1e18).toFixed(6) : "0"
    };
}