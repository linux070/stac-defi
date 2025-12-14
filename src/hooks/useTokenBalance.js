import { useAccount, useBalance, useChainId } from 'wagmi';
import { NETWORKS, TOKENS } from '../config/networks';

// Official Circle USDC Contract on Sepolia Testnet - using the same addresses from config
// Safety check: ensure TOKENS structure exists before accessing
const USDC_SEPOLIA_ADDRESS = TOKENS?.ETHEREUM_SEPOLIA?.USDC?.address || '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238';
const USDC_ARC_ADDRESS = TOKENS?.ARC_TESTNET?.USDC?.address || '0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d';

// Parse Chain IDs from config (which are in Hex strings) to Numbers - do this once outside the hook
const ARC_CHAIN_ID = NETWORKS?.ARC_TESTNET ? parseInt(NETWORKS.ARC_TESTNET.chainId, 16) : 5042002;
const SEPOLIA_CHAIN_ID = NETWORKS?.ETHEREUM_SEPOLIA ? parseInt(NETWORKS.ETHEREUM_SEPOLIA.chainId, 16) : 11155111;

const useTokenBalance = (tokenSymbol) => {
  // IMPORTANT: All hooks must be called unconditionally at the top level
  const { address, isConnected } = useAccount();
  const chainId = useChainId(); // Returns a number (e.g. 11155111)
  
  // Convert chainId to number if it's a hex string
  const chainIdNumber = typeof chainId === 'string' ? parseInt(chainId, 16) : chainId;

  // Determine token address based on chain and token symbol
  let tokenAddress = undefined;
  let shouldFetch = false;

  if (isConnected && address && tokenSymbol) {
    // For Arc Testnet, USDC is fetched using ERC-20 contract
    if (chainIdNumber === ARC_CHAIN_ID && tokenSymbol === 'USDC') {
      tokenAddress = USDC_ARC_ADDRESS;
      shouldFetch = true;
    } 
    // For Sepolia, USDC is an ERC-20 token
    else if (chainIdNumber === SEPOLIA_CHAIN_ID && tokenSymbol === 'USDC') {
      tokenAddress = USDC_SEPOLIA_ADDRESS;
      shouldFetch = true;
    }
  }

  // Build fetch config - useBalance must be called unconditionally
  const fetchConfig = {
    address: address || undefined,
    token: tokenAddress,
    enabled: shouldFetch && !!address,
  };

  // Wagmi hook - MUST be called unconditionally (no early returns before this)
  const { data, isLoading, refetch, error } = useBalance(fetchConfig);

  // Now we can return based on conditions
  if (!isConnected || !address) {
    return {
      balance: '0.00',
      symbol: tokenSymbol,
      loading: false,
      refetch: refetch || (() => {}),
      error: null
    };
  }

  if (!shouldFetch) {
    return {
      balance: '0.00',
      symbol: tokenSymbol,
      loading: false,
      refetch: refetch || (() => {}),
      error: null
    };
  }

  return {
    balance: data?.formatted || '0.00',
    symbol: data?.symbol || tokenSymbol,
    loading: isLoading,
    refetch: refetch || (() => {}),
    error: error?.message || null
  };
};

export default useTokenBalance;