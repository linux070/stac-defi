import { useState, useEffect, useRef } from 'react';
import { ethers } from 'ethers';
import { isNetworkSupported } from '../config/networks';
import { useAccount, useDisconnect, useBalance, useSwitchChain, usePublicClient, useWalletClient } from 'wagmi';
import { WalletContext } from './wallet-context';

export const WalletProvider = ({ children }) => {
    const { address, isConnected, chainId: wagmiChainId, status } = useAccount();
    const { disconnect: wagmiDisconnect } = useDisconnect();
    const { data: balanceData } = useBalance({ address });
    const { switchChain } = useSwitchChain();
    const { data: walletClient } = useWalletClient();
    const publicClient = usePublicClient();

    const [isConnecting, setIsConnecting] = useState(false);
    const [error, setError] = useState('');

    // Track whether the wallet was ever connected in THIS browser session.
    // This prevents clearing localStorage on the transient 'disconnected' status
    // that wagmi fires during page refresh before reconnection completes.
    const hasBeenConnectedRef = useRef(false);

    useEffect(() => {
        if (isConnected && address) {
            hasBeenConnectedRef.current = true;
            localStorage.setItem('walletConnected', 'true');
            localStorage.setItem('lastAddress', address);
            // Cache a friendly display name (short address)
            localStorage.setItem('lastDisplayName', `${address.slice(0, 6)}...${address.slice(-4)}`);
            if (wagmiChainId) {
                localStorage.setItem('lastChainId', wagmiChainId.toString());
            }
        } else if (status === 'disconnected' && hasBeenConnectedRef.current) {
            // Only clear localStorage if the wallet was connected at least once
            // in this session — meaning this is a real disconnect, not a page-refresh
            // transient state where wagmi hasn't started reconnecting yet.
            localStorage.removeItem('walletConnected');
            localStorage.removeItem('lastAddress');
            localStorage.removeItem('lastDisplayName');
            localStorage.removeItem('lastChainId');
        }
    }, [isConnected, address, wagmiChainId, status]);

    const connectWallet = async () => {
        setIsConnecting(true);
        setError('');

        try {
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
        localStorage.removeItem('lastAddress');
        localStorage.removeItem('lastDisplayName');
        localStorage.removeItem('lastChainId');
    };

    const fetchBalance = async () => {
        // Balance is automatically fetched by wagmi
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
        status,
        isNetworkSupported: wagmiChainId ? isNetworkSupported(typeof wagmiChainId === 'number' ? '0x' + wagmiChainId.toString(16) : wagmiChainId) : false,
    };

    return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
};
