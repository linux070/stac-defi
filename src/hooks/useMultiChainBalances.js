import { useState, useEffect, useRef } from 'react';
import { useAccount } from 'wagmi';
import { createPublicClient, http, formatUnits } from 'viem';
import { sepolia } from 'viem/chains';
import { NETWORKS, TOKENS } from '../config/networks';

// Chain IDs
const ARC_CHAIN_ID = 5042002;
const SEPOLIA_CHAIN_ID = 11155111;
const BASE_SEPOLIA_CHAIN_ID = 84532;

// Token contract addresses
// Note: Using Bridge Kit addresses for consistency with bridge functionality
const TOKEN_CONTRACTS = {
  USDC: {
    [SEPOLIA_CHAIN_ID]: TOKENS?.ETHEREUM_SEPOLIA?.USDC?.address || '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238',
    [ARC_CHAIN_ID]: '0x3600000000000000000000000000000000000000', // Bridge Kit USDC on Arc Testnet
    [BASE_SEPOLIA_CHAIN_ID]: TOKENS?.BASE_SEPOLIA?.USDC?.address || '0x036CbD53842c5426634e7929541eC2318f3dCF7e',
  },
};

// Token decimals (both USDC and EURC are 6)
const TOKEN_DECIMALS = {
  USDC: 6,
};

// RPC URLs
const ARC_RPC_URLS = [
  'https://rpc.testnet.arc.network/',
  'https://rpc.testnet.arc.network',
];

const SEPOLIA_RPC_URLS = [
  'https://ethereum-sepolia-rpc.publicnode.com',
  'https://rpc.sepolia.org',
  'https://sepolia.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161',
];

const BASE_SEPOLIA_RPC_URLS = [
  'https://sepolia.base.org',
  'https://base-sepolia.blockpi.network/v1/rpc/public',
];

// ERC20 ABI for balanceOf
const ERC20_ABI = [
  {
    constant: true,
    inputs: [{ name: '_owner', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: 'balance', type: 'uint256' }],
    type: 'function',
  },
];
// Custom fetch handler to intercept malformed/truncated JSON responses
const safeRpcFetch = async (url, options) => {
  const response = await fetch(url, options);
  const clone = response.clone();
  try {
    const text = await clone.text();
    JSON.parse(text);
    return response;
  } catch (err) {
    if (err instanceof SyntaxError) {
      console.warn(`[SuperBridge] Truncated JSON detected from ${url}. Switching providers...`);
      throw new Error(`Malformed JSON response from RPC: ${err.message}`);
    }
    return response;
  }
};

/**
 * Hook to fetch balances for multiple tokens across multiple chains
 */
// Fetch balance for a specific chain and token
const fetchChainBalance = async (chainId, address, rpcUrls, tokenSymbol = 'USDC') => {
  if (!address) return { balance: '0.00', error: null };

  let publicClient;
  let lastError;

  try {
    if (chainId === SEPOLIA_CHAIN_ID) {
      // Try Sepolia RPC endpoints
      for (const rpcUrl of SEPOLIA_RPC_URLS) {
        try {
          publicClient = createPublicClient({
            chain: sepolia,
            transport: http(rpcUrl, {
              retryCount: 5,
              timeout: 30000,
              fetch: safeRpcFetch,
            }),
            batch: { multicall: true },
          });

          await publicClient.getBlockNumber();
          break;
        } catch (err) {
          lastError = err;
          continue;
        }
      }
    } else if (chainId === ARC_CHAIN_ID) {
      // Try Arc RPC endpoints
      for (const rpcUrl of ARC_RPC_URLS) {
        try {
          publicClient = createPublicClient({
            chain: {
              id: ARC_CHAIN_ID,
              name: 'Arc Testnet',
              network: 'arc-testnet',
              nativeCurrency: {
                decimals: 18,
                name: 'USDC',
                symbol: 'USDC',
              },
              rpcUrls: {
                default: { http: [rpcUrl] },
                public: { http: [rpcUrl] },
              },
              blockExplorers: {
                default: { name: 'Arc Explorer', url: 'https://testnet.arcscan.app' },
              },
              testnet: true,
            },
            transport: http(rpcUrl, {
              retryCount: 5,
              timeout: 30000,
              fetch: safeRpcFetch,
            }),
            batch: { multicall: true },
          });

          await publicClient.getBlockNumber();
          break;
        } catch (err) {
          lastError = err;
          continue;
        }
      }
    } else if (chainId === BASE_SEPOLIA_CHAIN_ID) {
      // Try Base Sepolia RPC endpoints
      for (const rpcUrl of BASE_SEPOLIA_RPC_URLS) {
        try {
          publicClient = createPublicClient({
            chain: {
              id: BASE_SEPOLIA_CHAIN_ID,
              name: 'Base Sepolia',
              network: 'base-sepolia',
              nativeCurrency: {
                decimals: 18,
                name: 'ETH',
                symbol: 'ETH',
              },
              rpcUrls: {
                default: { http: [rpcUrl] },
                public: { http: [rpcUrl] },
              },
              blockExplorers: {
                default: { name: 'BaseScan', url: 'https://sepolia.basescan.org' },
              },
              testnet: true,
            },
            transport: http(rpcUrl, {
              retryCount: 5,
              timeout: 30000,
              fetch: safeRpcFetch,
            }),
            batch: { multicall: true },
          });

          await publicClient.getBlockNumber();
          break;
        } catch (err) {
          lastError = err;
          continue;
        }
      }
    }

    if (!publicClient) {
      throw new Error(`Failed to connect to RPC: ${lastError?.message || 'Unknown error'}`);
    }

    const tokenAddress = TOKEN_CONTRACTS[tokenSymbol]?.[chainId];
    if (!tokenAddress || tokenAddress === '0x') {
      // Return 0.00 if token address is not set (placeholder)
      return { balance: '0.00', error: null };
    }

    const balance = await publicClient.readContract({
      address: tokenAddress,
      abi: ERC20_ABI,
      functionName: 'balanceOf',
      args: [address],
    });

    const decimals = TOKEN_DECIMALS[tokenSymbol] || 6;
    const formattedBalance = formatUnits(balance, decimals);
    const roundedBalance = parseFloat(formattedBalance).toFixed(2);

    return { balance: roundedBalance, error: null };
  } catch (err) {
    console.error(`Error fetching ${tokenSymbol} balance for chain ${chainId}:`, err);
    return { balance: '0.00', error: err.message };
  }
};

// Lightweight hook to fetch USDC and EURC balances for all three chains simultaneously
const useMultiChainBalances = (address, isConnected) => {
  const [balances, setBalances] = useState({
    arcTestnet: { usdc: '0.00', loading: false },
    sepolia: { usdc: '0.00', loading: false },
    baseSepolia: { usdc: '0.00', loading: false },
  });

  const [refreshCounter, setRefreshCounter] = useState(0);
  const intervalRef = useRef(null);

  // Listen for global refresh events
  useEffect(() => {
    const handleRefresh = () => {
      console.log('[MultiChain] Refreshing balances due to global event');
      setRefreshCounter(prev => prev + 1);
    };

    window.addEventListener('faucetClaimed', handleRefresh);
    window.addEventListener('swapTransactionSaved', handleRefresh);
    window.addEventListener('retriggerMultiChainFetch', handleRefresh);

    return () => {
      window.removeEventListener('faucetClaimed', handleRefresh);
      window.removeEventListener('swapTransactionSaved', handleRefresh);
      window.removeEventListener('retriggerMultiChainFetch', handleRefresh);
    };
  }, []);

  useEffect(() => {
    const fetchBalances = async () => {
      if (!isConnected || !address) {
        setBalances({
          arcTestnet: { usdc: '0.00', loading: false },
          sepolia: { usdc: '0.00', loading: false },
          baseSepolia: { usdc: '0.00', loading: false },
        });
        return;
      }

      // Set loading states
      setBalances(prev => ({
        arcTestnet: { ...prev.arcTestnet, loading: true },
        sepolia: { ...prev.sepolia, loading: true },
        baseSepolia: { ...prev.baseSepolia, loading: true },
      }));

      try {
        // Fetch all balances in parallel for better performance
        const [
          arcUsdcResult,
          sepoliaUsdcResult,
          baseSepoliaUsdcResult
        ] = await Promise.allSettled([
          fetchChainBalance(ARC_CHAIN_ID, address, ARC_RPC_URLS, 'USDC'),
          fetchChainBalance(SEPOLIA_CHAIN_ID, address, SEPOLIA_RPC_URLS, 'USDC'),
          fetchChainBalance(BASE_SEPOLIA_CHAIN_ID, address, BASE_SEPOLIA_RPC_URLS, 'USDC'),
        ]);

        // Update balances
        setBalances(prev => ({
          arcTestnet: {
            usdc: arcUsdcResult.status === 'fulfilled' ? arcUsdcResult.value.balance : (prev.arcTestnet.usdc || '0.00'),
            loading: false,
          },
          sepolia: {
            usdc: sepoliaUsdcResult.status === 'fulfilled' ? sepoliaUsdcResult.value.balance : (prev.sepolia.usdc || '0.00'),
            loading: false,
          },
          baseSepolia: {
            usdc: baseSepoliaUsdcResult.status === 'fulfilled' ? baseSepoliaUsdcResult.value.balance : (prev.baseSepolia.usdc || '0.00'),
            loading: false,
          },
        }));
      } catch (err) {
        console.error('Error fetching multi-chain balances:', err);
        setBalances(prev => ({
          arcTestnet: { ...prev.arcTestnet, loading: false },
          sepolia: { ...prev.sepolia, loading: false },
          baseSepolia: { ...prev.baseSepolia, loading: false },
        }));
      }
    };

    // Initial fetch
    fetchBalances();

    // Refresh balances every 30 seconds (lightweight polling)
    intervalRef.current = setInterval(() => {
      fetchBalances();
    }, 30000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [address, isConnected, refreshCounter]);

  return { balances };
};

export default useMultiChainBalances;
