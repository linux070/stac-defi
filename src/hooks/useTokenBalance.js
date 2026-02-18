import { useMemo, useEffect } from 'react';
import { useAccount, useBalance, useChainId } from 'wagmi';
import { useQueryClient } from '@tanstack/react-query';
import { TOKENS } from '../config/networks';

const useTokenBalance = (tokenSymbol) => {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const queryClient = useQueryClient();

  const chainIdNumber = typeof chainId === 'string' ? parseInt(chainId, 16) : chainId;

  // Resolve token address from config
  const tokenAddress = useMemo(() => {
    if (!tokenSymbol || !TOKENS[tokenSymbol]) return undefined;

    const tokenConfig = TOKENS[tokenSymbol];
    if (tokenConfig.address && typeof tokenConfig.address === 'object') {
      const chainIdHex = typeof chainId === 'string' ? chainId : '0x' + chainId.toString(16).toLowerCase();
      const addr = tokenConfig.address[chainIdHex] ||
        tokenConfig.address[chainIdNumber] ||
        tokenConfig.address[chainId];

      if (addr && addr !== '0x0000000000000000000000000000000000000000') {
        return addr;
      }
    }

    if (typeof tokenConfig.address === 'string' && tokenConfig.address !== '0x0000000000000000000000000000000000000000') {
      return tokenConfig.address;
    }

    return undefined;
  }, [tokenSymbol, chainIdNumber, chainId]);

  const shouldFetch = isConnected && !!address && !!tokenSymbol;

  // Wagmi hook with TanStack Query integration
  const { data, isLoading, isFetching, refetch, error } = useBalance({
    address: address || undefined,
    token: tokenAddress,
    query: {
      enabled: shouldFetch,
      staleTime: 30000,
      gcTime: 1000 * 60 * 60, // 1 hour garbage collection
      refetchInterval: 60000,
      // Automatic background sync on focus and reconnect is handled by TanStack Query defaults
    }
  });

  // Global event listener for balance refresh (e.g., after faucet claim)
  useEffect(() => {
    const invalidate = () => {
      // Invalidate all balance queries for this address
      queryClient.invalidateQueries({ queryKey: ['balance', address] });
      // Also invalidate this specific wagmi balance query
      refetch();
    };

    window.addEventListener('faucetClaimed', invalidate);
    window.addEventListener('swapTransactionSaved', invalidate);

    return () => {
      window.removeEventListener('faucetClaimed', invalidate);
      window.removeEventListener('swapTransactionSaved', invalidate);
    };
  }, [address, queryClient, refetch]);

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
    loading: isLoading && isFetching,
    refetch,
    error: error?.message || null
  };
};

export default useTokenBalance;