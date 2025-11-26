import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { useWallet } from '../contexts/WalletContext';
import { TOKENS } from '../config/networks';

// ERC-20 ABI for balance and allowance
const ERC20_ABI = [
  'function balanceOf(address owner) view returns (uint256)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function approve(address spender, uint256 amount) returns (bool)',
];

export const useTokenBalance = (tokenSymbol) => {
  const { provider, walletAddress, chainId } = useWallet();
  const [balance, setBalance] = useState('0');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchBalance = useCallback(async () => {
    if (!provider || !walletAddress || !chainId) {
      setBalance('0');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const token = TOKENS[tokenSymbol];
      
      if (!token) {
        throw new Error(`Unknown token: ${tokenSymbol}`);
      }

      // Handle native ETH
      if (token.address === '0x0000000000000000000000000000000000000000') {
        const bal = await provider.getBalance(walletAddress);
        setBalance(ethers.formatEther(bal));
      } else {
        // Handle ERC-20 tokens
        const tokenAddress = typeof token.address === 'object' 
          ? token.address[chainId] 
          : token.address;

        if (!tokenAddress || tokenAddress === '0x') {
          console.warn(`Token ${tokenSymbol} not available on this network`);
          setBalance('0');
          return;
        }

        const tokenContract = new ethers.Contract(
          tokenAddress,
          ERC20_ABI,
          provider
        );

        const bal = await tokenContract.balanceOf(walletAddress);
        const decimals = token.decimals || 18;
        setBalance(ethers.formatUnits(bal, decimals));
      }
    } catch (err) {
      console.error('Error fetching token balance:', err);
      setError(err.message);
      setBalance('0');
    } finally {
      setLoading(false);
    }
  }, [provider, walletAddress, chainId, tokenSymbol]);

  // Fetch balance on mount and when dependencies change
  useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);

  // Refresh balance every 15 seconds
  useEffect(() => {
    if (!provider || !walletAddress) return;

    const interval = setInterval(() => {
      fetchBalance();
    }, 15000);

    return () => clearInterval(interval);
  }, [provider, walletAddress, fetchBalance]);

  return { balance, loading, error, refetch: fetchBalance };
};

export default useTokenBalance;
