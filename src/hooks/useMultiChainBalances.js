import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { NETWORKS, TOKENS } from '../config/networks';

// USDC contract addresses - using the same addresses from config
const USDC_ADDRESSES = {
  arcTestnet: TOKENS.ARC_TESTNET.USDC.address, // Arc Testnet USDC
  sepolia: TOKENS.ETHEREUM_SEPOLIA.USDC.address    // Sepolia USDC
};

// RPC URLs
const RPC_URLS = {
  arcTestnet: NETWORKS.ARC_TESTNET.rpcUrls[0],
  sepolia: NETWORKS.ETHEREUM_SEPOLIA.rpcUrls[0]
};

// ERC-20 ABI for reading balances (minimal but complete)
const ERC20_ABI = [
  {
    "constant": true,
    "inputs": [{"name": "_owner", "type": "address"}],
    "name": "balanceOf",
    "outputs": [{"name": "balance", "type": "uint256"}],
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [],
    "name": "decimals",
    "outputs": [{"name": "", "type": "uint8"}],
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [],
    "name": "symbol",
    "outputs": [{"name": "", "type": "string"}],
    "type": "function"
  }
];

const useMultiChainBalances = (walletAddress, isConnected) => {
  const [balances, setBalances] = useState({
    arcTestnet: {
      usdc: '0.00',
      loading: false
    },
    sepolia: {
      usdc: '0.00',
      loading: false
    }
  });

  const fetchArcUSDCBalance = useCallback(async (address) => {
    if (!address) return '0.00';
    
    try {
      // Don't update loading state here to avoid flickering
      const provider = new ethers.providers.JsonRpcProvider(RPC_URLS.arcTestnet);
      const usdcContract = new ethers.Contract(
        USDC_ADDRESSES.arcTestnet,
        ERC20_ABI,
        provider
      );

      const balance = await usdcContract.balanceOf(address);
      const formattedBalance = ethers.utils.formatUnits(balance, 6); // USDC has 6 decimals

      return formattedBalance;
    } catch (error) {
      console.error('Error fetching Arc USDC balance:', error);
      return '0.00';
    }
  }, []);

  const fetchSepoliaUSDCBalance = useCallback(async (address) => {
    if (!address) return '0.00';
    
    try {
      // Don't update loading state here to avoid flickering
      const provider = new ethers.providers.JsonRpcProvider(RPC_URLS.sepolia);
      const usdcContract = new ethers.Contract(
        USDC_ADDRESSES.sepolia,
        ERC20_ABI,
        provider
      );

      const balance = await usdcContract.balanceOf(address);
      const formattedBalance = ethers.utils.formatUnits(balance, 6); // USDC has 6 decimals

      return formattedBalance;
    } catch (error) {
      console.error('Error fetching Sepolia USDC balance:', error);
      return '0.00';
    }
  }, []);

  const fetchAllBalances = useCallback(async () => {
    if (!walletAddress || !isConnected) {
      setBalances({
        arcTestnet: { usdc: '0.00', loading: false },
        sepolia: { usdc: '0.00', loading: false }
      });
      return;
    }

    try {
      // Set loading states
      setBalances(prev => ({
        ...prev,
        arcTestnet: { ...prev.arcTestnet, loading: true },
        sepolia: { ...prev.sepolia, loading: true }
      }));

      // Fetch both balances concurrently
      const [arcUSDCBalance, sepoliaUSDCBalance] = await Promise.all([
        fetchArcUSDCBalance(walletAddress),
        fetchSepoliaUSDCBalance(walletAddress)
      ]);

      setBalances({
        arcTestnet: { usdc: arcUSDCBalance, loading: false },
        sepolia: { usdc: sepoliaUSDCBalance, loading: false }
      });
    } catch (error) {
      console.error('Error fetching all balances:', error);
      setBalances({
        arcTestnet: { usdc: '0.00', loading: false },
        sepolia: { usdc: '0.00', loading: false }
      });
    }
  }, [walletAddress, isConnected, fetchArcUSDCBalance, fetchSepoliaUSDCBalance]);

  // Fetch balances on wallet connection and periodically refresh
  useEffect(() => {
    if (walletAddress && isConnected) {
      fetchAllBalances();

      // Set up polling to refresh balances every 15 seconds
      const interval = setInterval(() => {
        fetchAllBalances();
      }, 15000);

      return () => clearInterval(interval);
    } else {
      // Clear balances when disconnected
      setBalances({
        arcTestnet: { usdc: '0.00', loading: false },
        sepolia: { usdc: '0.00', loading: false }
      });
    }
  }, [walletAddress, isConnected, fetchAllBalances]);

  // Function to manually refresh balances
  const refreshBalances = useCallback(() => {
    fetchAllBalances();
  }, [fetchAllBalances]);

  return { balances, refreshBalances };
};

export default useMultiChainBalances;