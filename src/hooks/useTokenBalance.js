import { useState, useEffect, useRef, useMemo } from 'react';
import { useAccount, useBalance, useChainId } from 'wagmi';
import { NETWORKS, TOKENS } from '../config/networks';

// Official Circle USDC Contract on Sepolia Testnet - using the same addresses from config
// Safety check: ensure TOKENS structure exists before accessing
const USDC_SEPOLIA_ADDRESS = TOKENS?.ETHEREUM_SEPOLIA?.USDC?.address || '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238';
const USDC_ARC_ADDRESS = TOKENS?.ARC_TESTNET?.USDC?.address || '0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d';

// Parse Chain IDs from config (which are in Hex strings) to Numbers - do this once outside the hook
const ARC_CHAIN_ID = NETWORKS?.ARC_TESTNET ? parseInt(NETWORKS.ARC_TESTNET.chainId, 16) : 5042002;
const SEPOLIA_CHAIN_ID = NETWORKS?.ETHEREUM_SEPOLIA ? parseInt(NETWORKS.ETHEREUM_SEPOLIA.chainId, 16) : 11155111;

// Timeout duration in milliseconds (10 seconds)
const BALANCE_FETCH_TIMEOUT = 10000;

const useTokenBalance = (tokenSymbol) => {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();

  const [loadingTimeout, setLoadingTimeout] = useState(false);
  const timeoutRef = useRef(null);

  const chainIdNumber = typeof chainId === 'string' ? parseInt(chainId, 16) : chainId;

  // Resolve token address from config
  const tokenAddress = useMemo(() => {
    if (!tokenSymbol || !TOKENS[tokenSymbol]) return undefined;

    const tokenConfig = TOKENS[tokenSymbol];
    if (tokenConfig.address && typeof tokenConfig.address === 'object') {
      // Try both hex string (e.g., '0xCF4B1') and decimal number (e.g., 5042002)
      const chainIdHex = typeof chainId === 'string' ? chainId : '0x' + chainId.toString(16).toLowerCase();

      const addr = tokenConfig.address[chainIdHex] ||
        tokenConfig.address[chainIdNumber] ||
        tokenConfig.address[chainId];

      if (addr && addr !== '0x0000000000000000000000000000000000000000') {
        return addr;
      }
    }

    // Direct string address (legacy or single-chain)
    if (typeof tokenConfig.address === 'string' && tokenConfig.address !== '0x0000000000000000000000000000000000000000') {
      return tokenConfig.address;
    }

    return undefined;
  }, [tokenSymbol, chainIdNumber, chainId]);

  const shouldFetch = isConnected && !!address && !!tokenSymbol && !!tokenAddress;

  const fetchConfig = {
    address: address || undefined,
    token: tokenAddress,
    enabled: shouldFetch,
  };

  // Wagmi hook - MUST be called unconditionally (no early returns before this)
  const { data, isLoading, refetch, error } = useBalance(fetchConfig);

  // Timeout mechanism to prevent infinite loading
  useEffect(() => {
    // Clear any existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    // Set timeout if loading starts
    if (isLoading && shouldFetch && isConnected && address) {
      setLoadingTimeout(false);
      timeoutRef.current = setTimeout(() => {
        console.warn(`Balance fetch timeout for ${tokenSymbol} on chain ${chainIdNumber}`);
        setLoadingTimeout(true);
      }, BALANCE_FETCH_TIMEOUT);
    } else {
      setLoadingTimeout(false);
    }

    // Cleanup timeout on unmount or when loading completes
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [isLoading, shouldFetch, isConnected, address, tokenSymbol, chainIdNumber]);

  // Now we can return based on conditions
  if (!isConnected || !address) {
    return {
      balance: '0.00',
      symbol: tokenSymbol,
      loading: false,
      refetch: refetch || (() => { }),
      error: null
    };
  }

  if (!shouldFetch) {
    return {
      balance: '0.00',
      symbol: tokenSymbol,
      loading: false,
      refetch: refetch || (() => { }),
      error: null
    };
  }

  // Stop loading if timeout occurred or if there's an error
  const isActuallyLoading = isLoading && !loadingTimeout && !error;

  // Format balance to 2 decimal places
  const formatBalance = (balanceStr) => {
    if (!balanceStr || balanceStr === '0.00') return '0.00';
    const num = parseFloat(balanceStr);
    if (!Number.isFinite(num)) return '0.00';
    return num.toFixed(2);
  };

  return {
    balance: formatBalance(data?.formatted) || '0.00',
    symbol: data?.symbol || tokenSymbol,
    loading: isActuallyLoading,
    refetch: refetch || (() => { }),
    error: error?.message || (loadingTimeout ? 'Balance fetch timeout' : null)
  };
};

export default useTokenBalance;