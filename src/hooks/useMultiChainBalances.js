import { useState, useEffect, useRef } from 'react';
import { useAccount } from 'wagmi';
import { createPublicClient, http, formatUnits } from 'viem';
import { sepolia } from 'viem/chains';
import { NETWORKS, TOKENS } from '../config/networks';

// Chain IDs
const ARC_CHAIN_ID = 5042002;
const SEPOLIA_CHAIN_ID = 11155111;

// USDC contract addresses
// Note: Using Bridge Kit addresses for consistency with bridge functionality
const USDC_CONTRACTS = {
  [SEPOLIA_CHAIN_ID]: TOKENS?.ETHEREUM_SEPOLIA?.USDC?.address || '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238',
  [ARC_CHAIN_ID]: '0x3600000000000000000000000000000000000000', // Bridge Kit USDC on Arc Testnet
};

// USDC decimals (both are 6)
const USDC_DECIMALS = 6;

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

// Fetch balance for a specific chain
const fetchChainBalance = async (chainId, address, rpcUrls) => {
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
              retryCount: 1,
              timeout: 5000, // Shorter timeout for lightweight fetching
            }),
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
                name: 'ETH',
                symbol: 'ETH',
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
              retryCount: 1,
              timeout: 5000,
            }),
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

    const tokenAddress = USDC_CONTRACTS[chainId];
    if (!tokenAddress) {
      throw new Error(`USDC contract not found for chain ${chainId}`);
    }

    const balance = await publicClient.readContract({
      address: tokenAddress,
      abi: ERC20_ABI,
      functionName: 'balanceOf',
      args: [address],
    });

    const formattedBalance = formatUnits(balance, USDC_DECIMALS);
    const roundedBalance = parseFloat(formattedBalance).toFixed(2);
    
    return { balance: roundedBalance, error: null };
  } catch (err) {
    console.error(`Error fetching balance for chain ${chainId}:`, err);
    return { balance: '0.00', error: err.message };
  }
};

// Lightweight hook to fetch USDC balances for both chains simultaneously
const useMultiChainBalances = (address, isConnected) => {
  const [balances, setBalances] = useState({
    arcTestnet: { usdc: '0.00', loading: false },
    sepolia: { usdc: '0.00', loading: false },
  });

  const intervalRef = useRef(null);

  useEffect(() => {
    const fetchBalances = async () => {
      if (!isConnected || !address) {
        setBalances({
          arcTestnet: { usdc: '0.00', loading: false },
          sepolia: { usdc: '0.00', loading: false },
        });
        return;
      }

      // Set loading states
      setBalances(prev => ({
        arcTestnet: { ...prev.arcTestnet, loading: true },
        sepolia: { ...prev.sepolia, loading: true },
      }));

      try {
        // Fetch both balances in parallel for better performance
        const [arcResult, sepoliaResult] = await Promise.allSettled([
          fetchChainBalance(ARC_CHAIN_ID, address, ARC_RPC_URLS),
          fetchChainBalance(SEPOLIA_CHAIN_ID, address, SEPOLIA_RPC_URLS),
        ]);

        // Update Arc balance
        if (arcResult.status === 'fulfilled') {
          setBalances(prev => ({
            ...prev,
            arcTestnet: {
              usdc: arcResult.value.balance,
              loading: false,
            },
          }));
        } else {
          setBalances(prev => ({
            ...prev,
            arcTestnet: {
              usdc: prev.arcTestnet.usdc || '0.00', // Keep previous value on error
              loading: false,
            },
          }));
        }

        // Update Sepolia balance
        if (sepoliaResult.status === 'fulfilled') {
          setBalances(prev => ({
            ...prev,
            sepolia: {
              usdc: sepoliaResult.value.balance,
              loading: false,
            },
          }));
        } else {
          setBalances(prev => ({
            ...prev,
            sepolia: {
              usdc: prev.sepolia.usdc || '0.00', // Keep previous value on error
              loading: false,
            },
          }));
        }
      } catch (err) {
        console.error('Error fetching multi-chain balances:', err);
        setBalances(prev => ({
          arcTestnet: { ...prev.arcTestnet, loading: false },
          sepolia: { ...prev.sepolia, loading: false },
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
  }, [address, isConnected]);

  return { balances };
};

export default useMultiChainBalances;
