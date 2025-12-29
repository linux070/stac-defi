import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useWallet } from '../contexts/WalletContext';
import { useAccount } from 'wagmi';
import { ethers } from 'ethers';
import { ArrowDownUp, Settings, Info, Loader, Wallet, AlertTriangle, X, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { TOKENS, TOKEN_PRICES, NETWORKS } from '../config/networks';
import { sanitizeInput, calculateSwapQuote, validateAmount, validateSlippage, getFilteredTokens } from '../utils/blockchain';
import { getContractAddresses } from '../config/contracts';
import {
  getEthersProvider,
  getSwapRouterContract,
  getERC20Contract,
  formatTokenAmount,
  parseTokenAmount,
  getSwapQuote,
  checkApproval,
  approveToken,
  executeSwap,
  getDeadline,
  calculateMinReceived,
  createSwapPath,
  checkPoolLiquidity,
} from '../utils/swapContract';
import useTokenBalance from '../hooks/useTokenBalance';
import useMultiChainBalances from '../hooks/useMultiChainBalances';
import Toast from '../components/Toast';
import { getItem, setItem } from '../utils/indexedDB';
import '../styles/swap-styles.css';

const FACTORY_ADDRESS = "0x34A0b64a88BBd4Bf6Acba8a0Ff8F27c8aDD67E9C";
const ROUTER_ADDRESS = "0x284C5Afc100ad14a458255075324fA0A9dfd66b1";
const USDC_ADDRESS = "0x3600000000000000000000000000000000000000";

const Swap = () => {
  const { t } = useTranslation();
  const { isConnected, balance, chainId } = useWallet();
  const { address } = useAccount();
  const [fromToken, setFromToken] = useState('USDC');
  const [toToken, setToToken] = useState('EURC');
  const [fromAmount, setFromAmount] = useState('');
  const [toAmount, setToAmount] = useState('');
  const [slippage, setSlippage] = useState(0.5);
  const [customSlippage, setCustomSlippage] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [showFromSelector, setShowFromSelector] = useState(false);
  const [showToSelector, setShowToSelector] = useState(false);
  const [showSwapDetails, setShowSwapDetails] = useState(false);
  const [swapQuote, setSwapQuote] = useState(null);
  const [swapLoading, setSwapLoading] = useState(false);
  const [validationError, setValidationError] = useState('');
  const [slippageWarning, setSlippageWarning] = useState('');
  const [toast, setToast] = useState({ visible: false, type: 'info', message: '' });
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [liquidityWarning, setLiquidityWarning] = useState('');

  // Helper function to normalize chain ID for comparison
  const normalizeChainId = (chainId) => {
    if (!chainId) return null;

    // If it's a number, convert to lowercase hex string
    if (typeof chainId === 'number') {
      return '0x' + chainId.toString(16).toLowerCase();
    }

    // If it's already a string, ensure it's lowercase
    if (typeof chainId === 'string') {
      // If it's a decimal string, convert to number first
      if (!chainId.startsWith('0x')) {
        const num = parseInt(chainId, 10);
        if (!isNaN(num)) {
          return '0x' + num.toString(16).toLowerCase();
        }
      }
      // If it's a hex string, just lowercase it
      return chainId.toLowerCase();
    }

    return null;
  };

  // Helper function to get token address for current chain
  const getTokenAddress = (tokenSymbol) => {
    if (tokenSymbol === 'USDC') return USDC_ADDRESS;
    if (!chainId || !tokenSymbol) return null;

    // Normalize the current chain ID for comparison
    const normalizedChainId = normalizeChainId(chainId);
    const normalizedArcChainId = normalizeChainId(NETWORKS.ARC_TESTNET.chainId);
    const normalizedSepoliaChainId = normalizeChainId(NETWORKS.ETHEREUM_SEPOLIA.chainId);

    // Strategy 1: Try structured format first (TOKENS.ARC_TESTNET.USDC)
    if (normalizedChainId === normalizedArcChainId) {
      const arcToken = TOKENS.ARC_TESTNET?.[tokenSymbol];
      if (arcToken?.address) {
        const addr = arcToken.address;
        if (addr && addr !== '0x' && addr !== '0x0000000000000000000000000000000000000000') {
          return addr;
        }
      }
    } else if (normalizedChainId === normalizedSepoliaChainId) {
      const sepoliaToken = TOKENS.ETHEREUM_SEPOLIA?.[tokenSymbol];
      if (sepoliaToken?.address) {
        const addr = sepoliaToken.address;
        if (addr && addr !== '0x' && addr !== '0x0000000000000000000000000000000000000000') {
          return addr;
        }
      }
    }

    // Strategy 2: Try generic format (TOKENS.USDC.address[chainId])
    const token = TOKENS[tokenSymbol];
    if (!token) return null;

    // If token has an address object (multi-chain format)
    if (token.address && typeof token.address === 'object') {
      // Try to find address using normalized chain ID
      for (const [key, value] of Object.entries(token.address)) {
        const normalizedKey = normalizeChainId(key);
        if (normalizedKey === normalizedChainId) {
          if (value && value !== '0x' && value !== '0x0000000000000000000000000000000000000000') {
            return value;
          }
        }
      }
      return null;
    }

    // Strategy 3: Direct address (single-chain token)
    if (token.address && typeof token.address === 'string') {
      const addr = token.address;
      if (addr && addr !== '0x' && addr !== '0x0000000000000000000000000000000000000000') {
        return addr;
      }
    }

    return null;
  };

  // Helper function to get token decimals
  const getTokenDecimals = (tokenSymbol) => {
    if (!TOKENS[tokenSymbol]) return 18;
    return TOKENS[tokenSymbol].decimals || 18;
  };

  // Refs for trigger buttons
  const fromTokenTriggerRef = useRef(null);
  const toTokenTriggerRef = useRef(null);

  // Multi-chain balances for USDC (fetches both chains simultaneously)
  const { balances: multiChainBalances } = useMultiChainBalances(address, isConnected);

  // Effect to handle body overflow when modals are open
  useEffect(() => {
    const isModalOpen = showFromSelector || showToSelector;
    if (isModalOpen) {
      // Prevent background scrolling when modal is open
      document.body.style.overflow = 'hidden';
    } else {
      // Restore normal scrolling when modal is closed
      document.body.style.overflow = 'visible';
    }

    // Cleanup function to restore overflow when component unmounts
    return () => {
      document.body.style.overflow = 'visible';
    };
  }, [showFromSelector, showToSelector]);

  // Real-time token balances
  // For USDC and EURC, use multi-chain balances; for other tokens, use regular balance hook
  const { balance: fromBalanceRegular, loading: fromLoadingRegular, refetch: refetchFrom } = useTokenBalance((fromToken === 'USDC' || fromToken === 'EURC') ? null : fromToken);
  const { balance: toBalanceRegular, loading: toLoadingRegular, refetch: refetchTo } = useTokenBalance((toToken === 'USDC' || toToken === 'EURC') ? null : toToken);

  // Get balance based on token type and current chain
  const getFromBalance = () => {
    if (fromToken === 'USDC' || fromToken === 'EURC') {
      // Use current chain's balance from multi-chain hook
      const chainIdNum = chainId ? parseInt(chainId, 16) : null;
      const tokenKey = fromToken.toLowerCase(); // 'usdc' or 'eurc'



      if (chainIdNum === 5042002) { // Arc Testnet
        const balance = multiChainBalances?.arcTestnet?.[tokenKey] || '0.00';

        return {
          balance,
          loading: multiChainBalances?.arcTestnet?.loading || false,
        };
      } else if (chainIdNum === 11155111) { // Sepolia
        const balance = multiChainBalances?.sepolia?.[tokenKey] || '0.00';

        return {
          balance,
          loading: multiChainBalances?.sepolia?.loading || false,
        };
      }
      return { balance: '0.00', loading: false };
    }
    return {
      balance: fromBalanceRegular || '0.00',
      loading: fromLoadingRegular || false,
    };
  };

  const getToBalance = () => {
    if (toToken === 'USDC' || toToken === 'EURC') {
      // Use current chain's balance from multi-chain hook
      const chainIdNum = chainId ? parseInt(chainId, 16) : null;
      const tokenKey = toToken.toLowerCase(); // 'usdc' or 'eurc'

      if (chainIdNum === 5042002) { // Arc Testnet
        return {
          balance: multiChainBalances?.arcTestnet?.[tokenKey] || '0.00',
          loading: multiChainBalances?.arcTestnet?.loading || false,
        };
      } else if (chainIdNum === 11155111) { // Sepolia
        return {
          balance: multiChainBalances?.sepolia?.[tokenKey] || '0.00',
          loading: multiChainBalances?.sepolia?.loading || false,
        };
      }
      return { balance: '0.00', loading: false };
    }
    return {
      balance: toBalanceRegular || '0.00',
      loading: toLoadingRegular || false,
    };
  };

  const fromBalanceData = getFromBalance();
  const toBalanceData = getToBalance();
  const fromBalance = fromBalanceData.balance;
  const fromLoading = fromBalanceData.loading;
  const toBalance = toBalanceData.balance;
  const toLoading = toBalanceData.loading;

  const tokenList = useMemo(() => {
    try {
      const allTokens = Object.values(TOKENS);
      const filtered = getFilteredTokens(allTokens, chainId);
      // Filter out any invalid tokens that don't have a symbol
      return Array.isArray(filtered) ? filtered.filter(token =>
        token &&
        typeof token === 'object' &&
        token.symbol &&
        typeof token.symbol === 'string' &&
        token.symbol.length > 0
      ) : [];
    } catch (error) {
      console.error('Error building token list:', error);
      return [];
    }
  }, [chainId]);

  // Reset selected tokens when network changes to ARC or Sepolia and ETH was selected
  useEffect(() => {
    const networksExcludingETH = [
      '0xCF4B1', // ARC Testnet
      '0xaa36a7' // Sepolia
    ];

    if (networksExcludingETH.includes(chainId)) {
      // Reset fromToken if it's ETH
      if (fromToken === 'ETH') {
        setFromToken('USDC');
      }

      // Reset toToken if it's ETH
      if (toToken === 'ETH') {
        setToToken('USDC');
      }
    }
  }, [chainId, fromToken, toToken]);

  // Validate slippage when it changes
  useEffect(() => {
    try {
      const result = validateSlippage(slippage);
      setSlippageWarning(result.warning || '');
    } catch (err) {
      setSlippageWarning(err.message);
    }
  }, [slippage]);

  // Calculate swap quote when amount changes - fetch from contract if connected
  useEffect(() => {
    setValidationError('');
    setQuoteLoading(false);

    if (fromAmount && parseFloat(fromAmount) > 0) {
      try {
        // Validate amount
        validateAmount(fromAmount, fromBalance);

        // Try to fetch real quote from contract if connected and on supported network
        if (isConnected && chainId && window.ethereum) {
          const contractAddresses = getContractAddresses(chainId);
          const routerAddress = ROUTER_ADDRESS;
          const fromTokenAddr = getTokenAddress(fromToken);
          const toTokenAddr = getTokenAddress(toToken);



          // Only fetch from contract if we have all required addresses
          if (routerAddress && fromTokenAddr && toTokenAddr) {
            setQuoteLoading(true);
            fetchContractQuote(fromAmount, fromToken, toToken, routerAddress, fromTokenAddr, toTokenAddr)
              .then(quote => {
                if (quote) {
                  setSwapQuote(quote);
                  setToAmount(quote.expectedOutput);
                  setShowSwapDetails(true);
                }
              })
              .catch(err => {
                console.warn('Failed to fetch contract quote, using fallback:', err);
                // Fallback to mock quote
                const fallbackQuote = calculateSwapQuote(fromToken, toToken, fromAmount, slippage);
                if (fallbackQuote) {
                  // Ensure quote has required fields for swap details
                  const formattedQuote = {
                    ...fallbackQuote,
                    priceImpact: fallbackQuote.priceImpact || '0.00',
                    networkFee: fallbackQuote.gasFee || '0.00',
                  };
                  setSwapQuote(formattedQuote);
                  setToAmount(formattedQuote.expectedOutput);
                  setShowSwapDetails(true);
                }
              })
              .finally(() => {
                setQuoteLoading(false);
              });
          } else {
            // Fallback to mock quote if contract not available
            const quote = calculateSwapQuote(fromToken, toToken, fromAmount, slippage);
            if (quote) {
              // Ensure quote has required fields for swap details
              const formattedQuote = {
                ...quote,
                priceImpact: quote.priceImpact || '0.00',
                networkFee: quote.gasFee || '0.00',
              };
              setSwapQuote(formattedQuote);
              setToAmount(formattedQuote.expectedOutput);
              setShowSwapDetails(true);
            }
          }
        } else {
          // Not connected or no provider, use mock quote
          const quote = calculateSwapQuote(fromToken, toToken, fromAmount, slippage);
          if (quote) {
            // Ensure quote has required fields for swap details
            const formattedQuote = {
              ...quote,
              priceImpact: quote.priceImpact || '0.00',
              networkFee: quote.gasFee || '0.00',
            };
            setSwapQuote(formattedQuote);
            setToAmount(formattedQuote.expectedOutput);
            setShowSwapDetails(true);
          }
        }
      } catch (err) {
        setValidationError(err.message);
        setSwapQuote(null);
        setToAmount('');
        setShowSwapDetails(false);
        setQuoteLoading(false);
      }
    } else {
      setSwapQuote(null);
      setToAmount('');
      setShowSwapDetails(false);
      setQuoteLoading(false);
    }
  }, [fromAmount, fromToken, toToken, slippage, fromBalance, isConnected, chainId]);

  // Check liquidity when tokens or amount changes
  useEffect(() => {
    setLiquidityWarning('');

    if (fromAmount && parseFloat(fromAmount) > 0 && isConnected && chainId && window.ethereum) {
      const contractAddresses = getContractAddresses(chainId);
      const routerAddress = ROUTER_ADDRESS;
      const fromTokenAddr = getTokenAddress(fromToken);
      const toTokenAddr = getTokenAddress(toToken);

      if (routerAddress && fromTokenAddr && toTokenAddr) {
        const checkLiquidity = async () => {
          try {
            const { provider } = await getEthersProvider();

            // Use Factory/Pair approach for liquidity check (standard V2)
            const liquidityCheck = await checkPoolLiquidity(FACTORY_ADDRESS, provider, fromTokenAddr, toTokenAddr);

            if (!liquidityCheck.hasLiquidity) {
              const fromDecimals = getTokenDecimals(fromToken);
              const toDecimals = getTokenDecimals(toToken);
              const reserveInFormatted = parseTokenAmount(liquidityCheck.reserveIn, fromDecimals);
              const reserveOutFormatted = parseTokenAmount(liquidityCheck.reserveOut, toDecimals);

              setLiquidityWarning(
                `⚠️ Insufficient liquidity in ${fromToken}/${toToken} pool. ` +
                `Current reserves: ${fromToken}: ${reserveInFormatted}, ${toToken}: ${reserveOutFormatted}. ` +
                `The pool needs liquidity before swaps can be executed.`
              );
            }
          } catch (error) {
            // Silently fail - we'll show error on swap attempt
            console.warn('Could not check liquidity:', error);
          }
        };

        checkLiquidity();
      }
    }
  }, [fromAmount, fromToken, toToken, isConnected, chainId]);

  // Helper function to fetch quote from contract
  const fetchContractQuote = async (amount, fromTokenSymbol, toTokenSymbol, routerAddress, fromTokenAddr, toTokenAddr) => {
    try {
      const { provider } = await getEthersProvider();
      const routerContract = getSwapRouterContract(routerAddress, provider);
      const fromDecimals = getTokenDecimals(fromTokenSymbol);
      const toDecimals = getTokenDecimals(toTokenSymbol);

      // Format input amount
      const amountIn = formatTokenAmount(amount, fromDecimals);

      // Create swap path
      const path = createSwapPath(fromTokenAddr, toTokenAddr);

      // Get quote from contract
      const amounts = await getSwapQuote(routerContract, amountIn, path);

      // Parse output amount
      const amountOut = amounts[amounts.length - 1]; // Last element is the output
      const expectedOutput = parseTokenAmount(amountOut, toDecimals);

      // Calculate min received with slippage
      const slippageBps = slippage * 100; // Convert percentage to basis points
      const minReceived = calculateMinReceived(expectedOutput, slippageBps);

      // Calculate network fee estimate (gas fee in USDC equivalent)
      // Rough estimate: ~150k gas * gas price
      const estimatedGas = 150000n;
      const feeData = await provider.getFeeData();
      const gasCost = estimatedGas * (feeData.gasPrice || 0n);
      // Convert to USDC (assuming 1 ETH = 2000 USDC for estimation, adjust as needed)
      const networkFeeEstimate = Number(gasCost) / 1e18 * 2000; // Rough USDC estimate

      return {
        expectedOutput,
        minReceived,
        priceImpact: '0.00', // Could calculate from reserves if needed
        networkFee: networkFeeEstimate.toFixed(6),
      };
    } catch (error) {
      console.error('Error fetching contract quote:', error);
      throw error;
    }
  };

  const handleSwitch = () => {
    // Add animation class for smooth transition
    const switchButton = document.querySelector('.switch-button');
    if (switchButton) {
      switchButton.classList.add('rotate-180');
      setTimeout(() => {
        switchButton.classList.remove('rotate-180');
      }, 300);
    }

    // Swap tokens
    setFromToken(toToken);
    setToToken(fromToken);

    // Preserve amounts if possible
    setFromAmount(toAmount);
    setToAmount(fromAmount);
  };

  const handleMaxClick = () => {
    if (!fromBalance || parseFloat(fromBalance) === 0) {
      setToast({ visible: true, type: 'warning', message: 'No balance available' });
      setTimeout(() => setToast({ visible: false, type: 'info', message: '' }), 3000);
      return;
    }

    // For all tokens (including ETH when available), use full balance
    setFromAmount(fromBalance);
  };

  const handleSwap = async () => {
    if (!isConnected) {
      setToast({ visible: true, type: 'error', message: t('connectWalletFirst') });
      setTimeout(() => setToast({ visible: false, type: 'info', message: '' }), 3000);
      return;
    }

    if (validationError) {
      setToast({ visible: true, type: 'error', message: validationError });
      setTimeout(() => setToast({ visible: false, type: 'info', message: '' }), 3000);
      return;
    }

    if (!window.ethereum) {
      setToast({ visible: true, type: 'error', message: 'No Web3 wallet found. Please install MetaMask.' });
      setTimeout(() => setToast({ visible: false, type: 'info', message: '' }), 5000);
      return;
    }

    // Get contract addresses for current network
    const contractAddresses = getContractAddresses(chainId);
    const routerAddress = ROUTER_ADDRESS;
    const fromTokenAddr = getTokenAddress(fromToken);
    const toTokenAddr = getTokenAddress(toToken);

    // Check for missing addresses and provide specific error messages
    if (!routerAddress) {
      setToast({ visible: true, type: 'error', message: 'Swap router not available on this network. Please switch to Arc Testnet.' });
      setTimeout(() => setToast({ visible: false, type: 'info', message: '' }), 5000);
      return;
    }

    if (!fromTokenAddr) {
      setToast({ visible: true, type: 'error', message: `${fromToken} token address not configured on this network.` });
      setTimeout(() => setToast({ visible: false, type: 'info', message: '' }), 5000);
      return;
    }

    if (!toTokenAddr) {
      setToast({ visible: true, type: 'error', message: `${toToken} token address not configured on this network.` });
      setTimeout(() => setToast({ visible: false, type: 'info', message: '' }), 5000);
      return;
    }

    setSwapLoading(true);

    try {
      // Get provider and signer
      const { provider, signer } = await getEthersProvider();
      const routerContract = getSwapRouterContract(routerAddress, provider);
      const tokenContract = getERC20Contract(fromTokenAddr, provider);

      const fromDecimals = getTokenDecimals(fromToken);
      const toDecimals = getTokenDecimals(toToken);

      // Format amounts
      const amountIn = formatTokenAmount(fromAmount, fromDecimals);
      const slippageBps = slippage * 100; // Convert percentage to basis points
      const minAmountOut = formatTokenAmount(swapQuote?.minReceived || calculateMinReceived(toAmount, slippageBps), toDecimals);

      // Validate amounts before proceeding
      if (amountIn <= 0n) {
        throw new Error('Invalid input amount');
      }

      if (minAmountOut <= 0n) {
        throw new Error('Invalid minimum output amount');
      }

      // Create swap path
      const path = createSwapPath(fromTokenAddr, toTokenAddr);
      const deadline = getDeadline();

      // Check liquidity before attempting swap
      const liquidityCheck = await checkPoolLiquidity(FACTORY_ADDRESS, provider, fromTokenAddr, toTokenAddr);
      if (!liquidityCheck.hasLiquidity) {
        const reserveInFormatted = parseTokenAmount(liquidityCheck.reserveIn, fromDecimals);
        const reserveOutFormatted = parseTokenAmount(liquidityCheck.reserveOut, toDecimals);
        throw new Error(
          `Insufficient liquidity in ${fromToken}/${toToken} pool.\n\n` +
          `Current reserves:\n` +
          `${fromToken}: ${reserveInFormatted}\n` +
          `${toToken}: ${reserveOutFormatted}\n\n` +
          `Please add liquidity to the pool first, or try a different token pair.`
        );
      }

      // Check if approval is needed - use actual amount for better wallet display
      const needsApproval = await checkApproval(tokenContract, address, routerAddress, amountIn);

      if (needsApproval) {
        // Request approval with actual amount (wallet will show the real amount)
        const approveTx = await approveToken(tokenContract, routerAddress, amountIn, signer);

        // Wait for approval transaction (wallet shows progress)
        await approveTx.wait();
      }

      // Execute swap (wallet will show the transaction)
      const swapTx = await executeSwap(
        routerContract,
        amountIn,
        minAmountOut,
        path,
        address,
        deadline,
        signer
      );

      // Wait for transaction confirmation (wallet shows progress)
      const receipt = await swapTx.wait();

      // Save swap transaction to IndexedDB (success case)
      const saveSwapTransaction = async (txHash, txStatus = 'success', receiptData = null) => {
        try {
          const saved = await getItem('myTransactions');
          const existing = saved && Array.isArray(saved) ? saved : [];

          // Check if transaction already exists
          const exists = existing.some(tx => tx.hash === txHash);

          if (!exists && txHash) {
            // Get network name from chainId
            const chainIdNum = chainId ? parseInt(chainId, 16) : null;

            const swapTxData = {
              id: txHash,
              type: 'Swap',
              from: fromToken, // Just the token symbol
              to: toToken, // Just the token symbol
              amount: fromAmount, // Just the number
              timestamp: Date.now(),
              status: txStatus,
              hash: txHash,
              chainId: chainIdNum || chainId,
              address: address?.toLowerCase(),
            };

            existing.unshift(swapTxData);
            // Keep only last 100 transactions
            const trimmed = existing.slice(0, 100);
            await setItem('myTransactions', trimmed);
            // Dispatch custom event to notify Transactions page
            window.dispatchEvent(new CustomEvent('swapTransactionSaved'));
          }
        } catch (err) {
          console.error('Error saving swap transaction:', err);
        }
      };

      // Save successful transaction
      const txHash = receipt.hash || swapTx.hash;
      const txStatus = receipt.status === 1 ? 'success' : receipt.status === 0 ? 'failed' : 'pending';
      await saveSwapTransaction(txHash, txStatus, receipt);

      // Reset form after successful swap
      setFromAmount('');
      setToAmount('');
      setSwapQuote(null);
      setShowSwapDetails(false);

      // Refresh balances
      refetchFrom();
      refetchTo();
    } catch (err) {
      console.error('Swap error:', err);
      let errorMessage = 'Swap failed. Please try again.';

      // Extract more specific error information
      const errorStr = err.message || err.reason || err.data?.message || '';
      const errorStrLower = errorStr.toLowerCase();

      if (errorStrLower.includes('insufficient funds')) {
        errorMessage = 'Insufficient funds for gas fees. Please add more ETH to your wallet.';
      } else if (errorStrLower.includes('insufficient liquidity') || errorStrLower.includes('insufficientliquidity')) {
        errorMessage = `❌ Insufficient Liquidity Error\n\n` +
          `The ${fromToken}/${toToken} liquidity pool doesn't have enough liquidity to complete this swap.\n\n` +
          `🔧 Solutions:\n` +
          `1. Wait for liquidity providers to add funds to the pool\n` +
          `2. Try swapping a smaller amount\n` +
          `3. Try a different token pair that has liquidity\n` +
          `4. If you're a liquidity provider, add liquidity to the pool first\n\n` +
          `Note: The Liquidity page is currently under development. For now, liquidity must be added directly through the smart contracts.`;
      } else if (errorStrLower.includes('insufficient_output_amount') || errorStrLower.includes('insufficientoutputamount')) {
        errorMessage = 'Slippage too high. Please increase slippage tolerance and try again.';
      } else if (errorStrLower.includes('expired')) {
        errorMessage = 'Transaction expired. Please try again.';
      } else if (errorStrLower.includes('transfer_from_failed') || errorStrLower.includes('transferfromfailed')) {
        errorMessage = 'Token transfer failed. Check your token allowance and balance.';
      } else if (err.message) {
        errorMessage = err.message;
      } else if (err.reason) {
        errorMessage = err.reason;
      } else if (err.data?.message) {
        errorMessage = err.data.message;
      }

      // Try to extract transaction hash from error for failed transactions
      // Check if swapTx was created before the error (transaction was submitted)
      let failedTxHash = null;
      if (swapTx?.hash) {
        failedTxHash = swapTx.hash;
      } else if (err.transaction?.hash) {
        failedTxHash = err.transaction.hash;
      } else if (err.receipt?.hash) {
        failedTxHash = err.receipt.hash;
      } else if (err.hash) {
        failedTxHash = err.hash;
      } else if (err.transactionHash) {
        failedTxHash = err.transactionHash;
      }

      // Save failed transaction if we have a hash
      if (failedTxHash) {
        const saveSwapTransaction = async (txHash, txStatus = 'failed') => {
          try {
            const saved = await getItem('myTransactions');
            const existing = saved && Array.isArray(saved) ? saved : [];

            // Check if transaction already exists
            const exists = existing.some(tx => tx.hash === txHash);

            if (!exists && txHash) {
              // Get network name from chainId
              const chainIdNum = chainId ? parseInt(chainId, 16) : null;

              const swapTxData = {
                id: txHash,
                type: 'Swap',
                from: fromToken, // Just the token symbol
                to: toToken, // Just the token symbol
                amount: fromAmount, // Just the number
                timestamp: Date.now(),
                status: txStatus,
                hash: txHash,
                chainId: chainIdNum || chainId,
                address: address?.toLowerCase(),
              };

              existing.unshift(swapTxData);
              // Keep only last 100 transactions
              const trimmed = existing.slice(0, 100);
              await setItem('myTransactions', trimmed);
              // Dispatch custom event to notify Transactions page
              window.dispatchEvent(new CustomEvent('swapTransactionSaved'));
            }
          } catch (saveErr) {
            console.error('Error saving failed swap transaction:', saveErr);
          }
        };

        await saveSwapTransaction(failedTxHash, 'failed');
      }

      // Handle user rejection - only show error if not user cancellation
      if (!errorMessage.includes('user rejected') && !errorMessage.includes('User denied') && !errorMessage.includes('User rejected')) {
        setToast({ visible: true, type: 'error', message: errorMessage });
        setTimeout(() => setToast({ visible: false, type: 'info', message: '' }), 5000);
      }
    } finally {
      setSwapLoading(false);
    }
  };

  const SlippageTolerance = () => {
    const [isCustomFocused, setIsCustomFocused] = useState(false);

    // Determine the text color based on slippage value for validation feedback
    const getSlippageTextColor = () => {
      if (slippage > 5) return 'danger';
      if (slippage > 1) return 'warning';
      return '';
    };

    return (
      <div className="swap-slippage-container">
        <label className="swap-slippage-label">{t('Slippage')}</label>
        <div className="swap-slippage-content">
          <div className="swap-slippage-buttons">
            {[0.1, 0.5, 1.0].map((value) => (
              <button
                key={value}
                onClick={() => {
                  setSlippage(value);
                  setCustomSlippage('');
                }}
                className={`swap-slippage-button ${slippage === value ? 'active' : ''}`}
              >
                {value}%
              </button>
            ))}
            <div className="swap-slippage-input-wrapper">
              <input
                type="text"
                placeholder="0.0"
                value={customSlippage}
                onChange={(e) => {
                  const val = sanitizeInput(e.target.value);
                  setCustomSlippage(val);
                  if (val && !isNaN(parseFloat(val))) {
                    setSlippage(parseFloat(val));
                  }
                }}
                onFocus={() => setIsCustomFocused(true)}
                onBlur={() => setIsCustomFocused(false)}
                className={`swap-slippage-input ${getSlippageTextColor()}`}
              />
              <span className="swap-slippage-percent">%</span>
            </div>
          </div>
          {slippageWarning && (
            <div className="swap-slippage-warning">
              <AlertTriangle size={14} className="swap-slippage-warning-icon" />
              <p className="swap-slippage-warning-text">{slippageWarning}</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  const TokenSelector = ({ isOpen, onClose, selectedToken, onSelect, exclude, triggerRef, fromToken, toToken, fromBalance, toBalance }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const selectorRef = useRef(null);

    // Filter tokens based on search query
    const filteredTokens = useMemo(() => {
      if (!searchQuery) return tokenList;

      const query = searchQuery.toLowerCase();
      return tokenList.filter(token =>
        token &&
        token.symbol &&
        typeof token.symbol === 'string' &&
        (token.symbol.toLowerCase().includes(query) ||
          (token.name && typeof token.name === 'string' && token.name.toLowerCase().includes(query)) ||
          (token.address && typeof token.address === 'string' && token.address.toLowerCase().includes(query)) ||
          (token.address && typeof token.address === 'object' &&
            Object.values(token.address).some(addr => typeof addr === 'string' && addr.toLowerCase().includes(query))))
      );
    }, [searchQuery, tokenList]);

    // Popular tokens for quick selection.
    const popularTokens = useMemo(() => {
      return tokenList.filter(token =>
        token &&
        token.symbol &&
        typeof token.symbol === 'string' &&
        ['USDC', 'EURC'].includes(token.symbol)
      );
    }, [tokenList]);

    // Handle ESC key press to close modal
    useEffect(() => {
      const handleEsc = (event) => {
        if (event.keyCode === 27) {
          onClose();
        }
      };

      if (isOpen) {
        document.addEventListener('keydown', handleEsc);
      }

      return () => {
        document.removeEventListener('keydown', handleEsc);
      };
    }, [isOpen, onClose]);

    return (
      <AnimatePresence mode="wait">
        {isOpen && (
          <motion.div
            key="token-selector-modal"
            className="fixed inset-0 z-50 flex items-center justify-center p-4 swap-token-selector-modal-backdrop"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <motion.div
              ref={selectorRef}
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
              className="swap-token-selector-modal"
              onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside modal
            >
              <div className="swap-token-selector-header">
                <h3 className="swap-token-selector-title">{t('Select Token')}</h3>
                <button
                  onClick={onClose}
                  className="swap-token-selector-close-button"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Search Bar */}
              <div className="swap-token-selector-search">
                <input
                  type="text"
                  placeholder={t('Search Tokens')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="swap-token-selector-search-input"
                />
              </div>

              {/* Popular Tokens */}
              <div className="swap-token-selector-popular-section">
                <h4 className="swap-token-selector-popular-label">{t('Your Tokens')}</h4>
                <div className="swap-token-selector-popular-tokens">
                  {popularTokens.map((token) => {
                    // Safety check: skip invalid tokens
                    if (!token || !token.symbol || typeof token.symbol !== 'string') {
                      return null;
                    }

                    const isExcluded = token.symbol === exclude;
                    const isSelected = token.symbol === selectedToken;

                    return (
                      <button
                        key={`popular-${token.symbol}`}
                        onClick={() => {
                          if (!isExcluded) {
                            onSelect(token.symbol);
                            onClose();
                          }
                        }}
                        disabled={isExcluded}
                        className={`swap-token-selector-popular-button ${isSelected ? 'active' : ''} ${isExcluded ? 'disabled' : ''}`}
                      >
                        {token.symbol === 'USDC' ? (
                          <img
                            src="/icons/usdc.png"
                            alt={token.symbol}
                            className="swap-token-selector-popular-icon"
                          />
                        ) : token.symbol === 'EURC' ? (
                          <img
                            src="/icons/eurc.png"
                            alt={token.symbol}
                            className="swap-token-selector-popular-icon"
                          />
                        ) : (
                          <div className="swap-token-selector-popular-icon" style={{ background: 'var(--swap-surface-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <span style={{ fontSize: '12px', fontWeight: 600 }}>
                              {token.symbol && token.symbol.length > 0 ? token.symbol.charAt(0) : '?'}
                            </span>
                          </div>
                        )}
                        <span className="swap-token-selector-popular-symbol">{token.symbol}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Token List */}
              <div className="swap-token-selector-list">
                {filteredTokens.map((token) => {
                  // Safety check: skip invalid tokens
                  if (!token || !token.symbol || typeof token.symbol !== 'string') {
                    return null;
                  }

                  return (
                    <button
                      key={token.symbol}
                      onClick={() => {
                        if (token.symbol !== exclude) {
                          onSelect(token.symbol);
                          onClose();
                        }
                      }}
                      className={`swap-token-selector-list-item ${token.symbol === selectedToken ? 'selected' : ''}`}
                    >
                      <div className="swap-token-selector-list-item-content">
                        <div className="swap-token-selector-list-icon">
                          {token.symbol === 'USDC' ? (
                            <img
                              src="/icons/usdc.png"
                              alt={token.symbol}
                            />
                          ) : token.symbol === 'EURC' ? (
                            <img
                              src="/icons/eurc.png"
                              alt={token.symbol}
                            />
                          ) : (
                            <span style={{ fontSize: '18px', fontWeight: 600, color: 'var(--swap-text-primary)' }}>
                              {token.symbol && token.symbol.length > 0 ? token.symbol.charAt(0) : '?'}
                            </span>
                          )}
                        </div>
                        <div className="swap-token-selector-list-info">
                          <p className="swap-token-selector-list-symbol">{token.symbol || 'Unknown'}</p>
                          <p className="swap-token-selector-list-name">{token.name || 'Token'}</p>
                        </div>
                      </div>
                      {/* Token Balance */}
                      {isConnected && (
                        <div className="swap-token-selector-list-balance">
                          <p className="swap-token-selector-list-balance-amount">
                            {token.symbol === fromToken ? fromBalance : token.symbol === toToken ? toBalance : '0.00'}
                          </p>
                          <p className="swap-token-selector-list-balance-label">{t('balance')}</p>
                        </div>
                      )}
                    </button>
                  );
                })}

                {filteredTokens.length === 0 && searchQuery && (
                  <div className="swap-token-selector-empty">
                    <p>{t('noTokensFound')}</p>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  };

  return (
    <div className="max-w-2xl mx-auto w-full">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="swap-container"
      >
        {/* Header */}
        <div className="swap-header">
          <div>
            <h2 className="swap-header-title">{t('Swap Tokens')}</h2>
            <p className="swap-header-subtitle">{t('swap.tradeTokensTitle')}</p>
          </div>
          <div className="swap-header-actions">
            <a
              href="https://faucet.circle.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="swap-faucet-button-compact"
            >

              <span>Faucet</span>
            </a>
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="swap-settings-button"
              title="Settings"
            >
              <Settings size={18} />
            </button>
          </div>
        </div>

        {/* Settings Panel - Desktop: Inline Expandable */}
        <AnimatePresence>
          {showSettings && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mb-4 md:mb-6 hidden md:block"
            >
              <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg space-y-6">
                {/* Slippage Tolerance */}
                <SlippageTolerance />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Settings Bottom Sheet Modal - Mobile Only */}
        <AnimatePresence>
          {showSettings && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-40 bg-black bg-opacity-50 md:hidden"
                onClick={() => setShowSettings(false)}
              />

              {/* Bottom Sheet - Mobile Only */}
              <motion.div
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-800 rounded-t-3xl shadow-2xl md:hidden"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Drag Handle for Mobile */}
                <div className="flex justify-center pt-3 pb-2">
                  <div className="w-12 h-1.5 bg-gray-300 dark:bg-gray-600 rounded-full" />
                </div>

                {/* Header */}
                <div className="flex items-center justify-between px-4 sm:px-6 pb-4 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">Settings</h3>
                  <button
                    onClick={() => setShowSettings(false)}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors touch-manipulation"
                  >
                    <X size={20} className="text-gray-500 dark:text-gray-400" />
                  </button>
                </div>

                {/* Content */}
                <div className="p-4 sm:p-6 space-y-6 max-h-[70vh] overflow-y-auto">
                  {/* Slippage Tolerance */}
                  <SlippageTolerance />
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Validation Error */}
        {validationError && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="swap-validation-error"
          >
            <AlertTriangle size={16} className="swap-validation-error-icon" />
            <p className="swap-validation-error-text">{validationError}</p>
          </motion.div>
        )}

        {/* Liquidity Warning */}
        {liquidityWarning && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg"
          >
            <div className="flex items-start gap-3">
              <AlertTriangle size={18} className="text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm text-yellow-800 dark:text-yellow-200 whitespace-pre-line">
                  {liquidityWarning}
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* From Token */}
        <div className="swap-input-group">
          <div className="swap-input-header">
            <div className="swap-input-label">{t('From')}</div>
            {isConnected && (
              <div className="swap-balance-text">
                Balance: <span>
                  {fromLoading ? (
                    <Loader className="animate-spin" size={12} />
                  ) : (
                    fromBalance || '0.00'
                  )}
                </span>
              </div>
            )}
          </div>
          <div className="swap-input-row">
            <input
              type="text"
              inputMode="decimal"
              value={fromAmount}
              onChange={(e) => setFromAmount(sanitizeInput(e.target.value))}
              placeholder="0.0"
              className="swap-amount-input"
            />
            <button
              ref={fromTokenTriggerRef}
              onClick={() => setShowFromSelector(true)}
              className="swap-token-selector"
            >
              <div className="swap-token-icon">
                {fromToken === 'USDC' ? (
                  <img
                    src="/icons/usdc.png"
                    alt={fromToken}
                    className="w-6 h-6 rounded-full object-contain"
                  />
                ) : fromToken === 'EURC' ? (
                  <img
                    src="/icons/eurc.png"
                    alt={fromToken}
                    className="w-6 h-6 rounded-full object-contain"
                  />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                    <span className="text-xs font-bold">{fromToken}</span>
                  </div>
                )}
              </div>
              <span className="swap-token-symbol">{fromToken}</span>
              <ChevronDown size={16} className="swap-token-chevron" />
            </button>
          </div>
          {isConnected && (
            <div className="flex items-center justify-end mt-2">
              <button
                onClick={handleMaxClick}
                className="max-button"
              >
                {t('Max')}
              </button>
            </div>
          )}
        </div>

        {/* Switch Button */}
        <div className="swap-direction-container">
          <button
            onClick={handleSwitch}
            className="swap-direction-button"
            title={t('Switch Tokens')}
          >
            <ArrowDownUp size={18} />
          </button>
        </div>

        {/* To Token */}
        <div className="swap-input-group">
          <div className="swap-input-header">
            <div className="swap-input-label">{t('To')}</div>
            {isConnected && (
              <div className="swap-balance-text">
                Balance: <span>
                  {toLoading ? (
                    <Loader className="animate-spin" size={12} />
                  ) : (
                    toBalance || '0.00'
                  )}
                </span>
              </div>
            )}
          </div>
          <div className="swap-input-row">
            <input
              type="text"
              value={toAmount}
              readOnly
              placeholder="0.0"
              className="swap-amount-input"
            />
            <button
              ref={toTokenTriggerRef}
              onClick={() => setShowToSelector(true)}
              className="swap-token-selector"
            >
              <div className="swap-token-icon">
                {toToken === 'USDC' ? (
                  <img
                    src="/icons/usdc.png"
                    alt={toToken}
                    className="w-6 h-6 rounded-full object-contain"
                  />
                ) : toToken === 'EURC' ? (
                  <img
                    src="/icons/eurc.png"
                    alt={toToken}
                    className="w-6 h-6 rounded-full object-contain"
                  />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                    <span className="text-xs font-bold">{toToken}</span>
                  </div>
                )}
              </div>
              <span className="swap-token-symbol">{toToken}</span>
              <ChevronDown size={16} className="swap-token-chevron" />
            </button>
          </div>
          {isConnected && (
            <div className="flex items-center justify-end mt-2">
              <button
                onClick={() => {
                  if (!toBalance || parseFloat(toBalance) === 0) {
                    setToast({ visible: true, type: 'warning', message: 'No balance available' });
                    setTimeout(() => setToast({ visible: false, type: 'info', message: '' }), 3000);
                    return;
                  }
                  // Set the "To" amount to maximum balance
                  // Note: This will trigger the swap calculation in reverse
                  setToAmount(toBalance);
                  // Calculate the required "From" amount based on the "To" amount
                  try {
                    const reverseQuote = calculateSwapQuote(toToken, fromToken, toBalance, slippage);
                    if (reverseQuote) {
                      setFromAmount(reverseQuote.expectedOutput);
                    }
                  } catch (err) {
                    console.error('Error calculating reverse quote:', err);
                  }
                }}
                className="max-button"
              >
                {t('Max')}
              </button>
            </div>
          )}
        </div>

        {/* Swap Details */}
        <AnimatePresence>
          {showSwapDetails && swapQuote && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mb-4 md:mb-6"
            >
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg space-y-3 text-xs md:text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Expected Output</span>
                  <span className="font-semibold">{swapQuote.expectedOutput} {toToken}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Min Received</span>
                  <span className="font-semibold">{swapQuote.minReceived} {toToken}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Price Impact</span>
                  <span className={`font-semibold ${parseFloat(swapQuote.priceImpact || '0') > 1 ? 'text-red-600' : 'text-green-600'}`}>
                    {swapQuote.priceImpact || '0.00'}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Network Fee</span>
                  <span className="font-semibold">~{swapQuote.networkFee || swapQuote.gasFee || '0.00'} USDC</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Swap Button */}
        <button
          onClick={handleSwap}
          disabled={!fromAmount || !toAmount || swapLoading || !isConnected}
          className="swap-button"
        >
          {swapLoading ? (
            <div className="swap-loading">
              <div className="swap-spinner"></div>
              <span className="swap-loading-text">{t('processing')}...</span>
            </div>
          ) : !isConnected ? (
            <>
              <Wallet size={18} />
              <span>{t('connectWallet')}</span>
            </>
          ) : !fromAmount || !toAmount ? (
            <span>{t('Swap')}</span>
          ) : (
            <span>{t('swap')}</span>
          )}
        </button>

        {/* Helper Text */}
        {isConnected && swapQuote && (
          <p className="swap-helper-text">
            {t('bySwappingAgree')}
          </p>
        )}
      </motion.div>

      {/* Token Selectors */}
      <TokenSelector
        isOpen={showFromSelector}
        onClose={() => setShowFromSelector(false)}
        selectedToken={fromToken}
        onSelect={setFromToken}
        exclude={toToken}
        triggerRef={fromTokenTriggerRef}
        fromToken={fromToken}
        toToken={toToken}
        fromBalance={fromBalance}
        toBalance={toBalance}
      />
      <TokenSelector
        isOpen={showToSelector}
        onClose={() => setShowToSelector(false)}
        selectedToken={toToken}
        onSelect={setToToken}
        exclude={fromToken}
        triggerRef={toTokenTriggerRef}
        fromToken={fromToken}
        toToken={toToken}
        fromBalance={fromBalance}
        toBalance={toBalance}
      />

      {/* Toast Notifications */}
      <Toast
        type={toast.type}
        message={toast.message}
        visible={toast.visible}
        onClose={() => setToast({ ...toast, visible: false })}
      />
    </div>
  );
};

export default Swap;