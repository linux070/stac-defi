import { useQuery, useQueryClient } from '@tanstack/react-query';
import { createPublicClient, http, fallback, formatUnits } from 'viem';
import { sepolia } from 'viem/chains';
import { useEffect } from 'react';

// Chain IDs
const ARC_CHAIN_ID = 5042002;
const SEPOLIA_CHAIN_ID = 11155111;
const BASE_SEPOLIA_CHAIN_ID = 84532;

// Token contract addresses
const TOKEN_CONTRACTS = {
  USDC: {
    [SEPOLIA_CHAIN_ID]: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238', // Official Circle USDC on Sepolia
    [BASE_SEPOLIA_CHAIN_ID]: '0x036CbD53842c5426634e7929541eC2318f3dCF7e', // Official Circle USDC on Base Sepolia
  }
};

// RPC URLs with reliable fallbacks
const SEPOLIA_RPC_URLS = [
  import.meta.env.VITE_ALCHEMY_SEPOLIA_URL,
  import.meta.env.VITE_SEPOLIA_RPC_URL,
  'https://ethereum-sepolia-rpc.publicnode.com',
  'https://rpc.ankr.com/eth_sepolia',
  'https://rpc2.sepolia.org',
].filter(Boolean);

const ARC_RPC_URLS = [
  import.meta.env.VITE_QUICKNODE_ARC_URL,
  import.meta.env.VITE_ARC_RPC_URL,
  'https://rpc.testnet.arc.network',
].filter(Boolean);

const BASE_SEPOLIA_RPC_URLS = [
  import.meta.env.VITE_QUICKNODE_BASE_URL,
  import.meta.env.VITE_BASE_SEPOLIA_RPC_URL,
  'https://sepolia.base.org',
  'https://base-sepolia-rpc.publicnode.com',
].filter(Boolean);

// Shared transport configuration helper
const createFallbackTransport = (urls) => {
  if (!urls || urls.length === 0) {
    throw new Error('No RPC URLs available');
  }
  return fallback(
    urls.map(url => http(url, {
      timeout: 15000,
      retryCount: 2,
    })),
    {
      rank: true,
      retryCount: 2,
      retryDelay: 500,
    }
  );
};

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

const useMultiChainBalances = (address, isConnected) => {
  const queryClient = useQueryClient();

  const fetchChainBalance = async (chainId) => {
    if (!address) return '0.00';

    let rpcUrls;
    let chainConfig;
    let decimals = 6;
    let isNativeUsdc = false;

    if (chainId === SEPOLIA_CHAIN_ID) {
      rpcUrls = SEPOLIA_RPC_URLS;
      chainConfig = sepolia;
      decimals = 6;
    } else if (chainId === ARC_CHAIN_ID) {
      rpcUrls = ARC_RPC_URLS;
      chainConfig = {
        id: ARC_CHAIN_ID,
        name: 'Arc Testnet',
        network: 'arc-testnet',
        nativeCurrency: { decimals: 18, name: 'USDC', symbol: 'USDC' },
        testnet: true,
        rpcUrls: { default: { http: rpcUrls } }
      };
      decimals = 18;
      isNativeUsdc = true;
    } else {
      rpcUrls = BASE_SEPOLIA_RPC_URLS;
      chainConfig = {
        id: BASE_SEPOLIA_CHAIN_ID,
        name: 'Base Sepolia',
        network: 'base-sepolia',
        nativeCurrency: { decimals: 18, name: 'ETH', symbol: 'ETH' },
        testnet: true,
        rpcUrls: { default: { http: rpcUrls } }
      };
      decimals = 6;
    }

    const publicClient = createPublicClient({
      chain: chainConfig,
      transport: createFallbackTransport(rpcUrls),
    });

    if (isNativeUsdc) {
      const balance = await publicClient.getBalance({ address });
      return parseFloat(formatUnits(balance, decimals)).toFixed(2);
    } else {
      const usdcAddress = TOKEN_CONTRACTS.USDC[chainId];
      const balance = await publicClient.readContract({
        address: usdcAddress,
        abi: ERC20_ABI,
        functionName: 'balanceOf',
        args: [address],
      });
      return parseFloat(formatUnits(balance, decimals)).toFixed(2);
    }
  };

  const arcQuery = useQuery({
    queryKey: ['balance', address, ARC_CHAIN_ID],
    queryFn: () => fetchChainBalance(ARC_CHAIN_ID),
    enabled: !!address && isConnected,
    staleTime: 30000,
    gcTime: 1000 * 60 * 10,
    refetchInterval: 60000,
    placeholderData: '0.00'
  });

  const sepoliaQuery = useQuery({
    queryKey: ['balance', address, SEPOLIA_CHAIN_ID],
    queryFn: () => fetchChainBalance(SEPOLIA_CHAIN_ID),
    enabled: !!address && isConnected,
    staleTime: 30000,
    refetchInterval: 60000,
    placeholderData: '0.00'
  });

  const baseQuery = useQuery({
    queryKey: ['balance', address, BASE_SEPOLIA_CHAIN_ID],
    queryFn: () => fetchChainBalance(BASE_SEPOLIA_CHAIN_ID),
    enabled: !!address && isConnected,
    staleTime: 30000,
    refetchInterval: 60000,
    placeholderData: '0.00'
  });

  // Listen for global events to invalidate cache
  useEffect(() => {
    const invalidate = () => {
      queryClient.invalidateQueries({ queryKey: ['balance', address] });
    };

    window.addEventListener('faucetClaimed', invalidate);
    window.addEventListener('swapTransactionSaved', invalidate);
    window.addEventListener('retriggerMultiChainFetch', invalidate);

    return () => {
      window.removeEventListener('faucetClaimed', invalidate);
      window.removeEventListener('swapTransactionSaved', invalidate);
      window.removeEventListener('retriggerMultiChainFetch', invalidate);
    };
  }, [address, queryClient]);

  const balances = {
    arcTestnet: { usdc: arcQuery.data || '0.00', loading: arcQuery.isLoading && arcQuery.isFetching },
    sepolia: { usdc: sepoliaQuery.data || '0.00', loading: sepoliaQuery.isLoading && sepoliaQuery.isFetching },
    baseSepolia: { usdc: baseQuery.data || '0.00', loading: baseQuery.isLoading && baseQuery.isFetching },
  };

  return { balances };
};

export default useMultiChainBalances;
