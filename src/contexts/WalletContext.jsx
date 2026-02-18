import { createContext, useContext, useState } from 'react';
import { ethers } from 'ethers';
import { isNetworkSupported } from '../config/networks';
import { useAccount, useDisconnect, useBalance, useSwitchChain, usePublicClient, useWalletClient } from 'wagmi';

const WalletContext = createContext();

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within WalletProvider');
  }
  return context;
};

export const WalletProvider = ({ children }) => {
  const { address, isConnected, chainId: wagmiChainId } = useAccount();
  const { disconnect: wagmiDisconnect } = useDisconnect();
  const { data: balanceData } = useBalance({ address });
  const { switchChain } = useSwitchChain();
  const { data: walletClient } = useWalletClient();
  const publicClient = usePublicClient();

  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState('');

  const connectWallet = async () => {
    // With RainbowKit, connection is handled by the ConnectButton
    // This function is kept for backward compatibility
    setIsConnecting(true);
    setError('');

    try {
      // In a real implementation, you would trigger RainbowKit's connect button
      // For now, we'll simulate a successful connection
      setTimeout(() => {
        setIsConnecting(false);
      }, 1000);
    } catch (err) {
      console.error('Error connecting wallet:', err);
      setError(err.message);
      setIsConnecting(false);
      throw err;
    }
  };

  const disconnect = () => {
    wagmiDisconnect();
    localStorage.removeItem('walletConnected');
    localStorage.removeItem('walletType');
  };

  const fetchBalance = async () => {
    // Balance is automatically fetched by wagmi
    // This function is kept for backward compatibility
  };

  const switchToNetwork = async (networkConfig) => {
    try {
      const chainIdDecimal = parseInt(networkConfig.chainId, 16);
      switchChain({ chainId: chainIdDecimal });
    } catch (err) {
      console.error('Error switching network:', err);
      throw err;
    }
  };

  const sendTransaction = async () => {
    // Transaction sending would be handled by wagmi hooks
    // This function is kept for backward compatibility
    console.warn('Use wagmi hooks for transaction sending in RainbowKit integration');
    return Promise.resolve();
  };

  const value = {
    walletAddress: address || '',
    chainId: wagmiChainId ? (typeof wagmiChainId === 'number' ? '0x' + wagmiChainId.toString(16) : wagmiChainId) : null,
    provider: publicClient,
    signer: walletClient,
    balance: balanceData ? ethers.formatEther(balanceData.value) : '0',
    isConnecting,
    error,
    connectWallet,
    disconnect,
    fetchBalance,
    switchToNetwork,
    sendTransaction,
    isConnected,
    isNetworkSupported: wagmiChainId ? isNetworkSupported(typeof wagmiChainId === 'number' ? '0x' + wagmiChainId.toString(16) : wagmiChainId) : false,
  };

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
};
