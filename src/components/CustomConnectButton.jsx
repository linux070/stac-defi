import { useAccount, useSwitchChain } from 'wagmi';
import { useTranslation } from 'react-i18next';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import Jazzicon, { jsNumberForAddress } from 'react-jazzicon';
import { Loader, Copy, LogOut, X } from 'lucide-react';
import useMultiChainBalances from '../hooks/useMultiChainBalances';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

import { useWallet } from '../hooks/useWallet';

const CustomConnectButton = ({ connectText, isMobile }) => {
    const { t } = useTranslation();
    const { address, isConnected, status } = useAccount();
    const { switchChain } = useSwitchChain();
    const { disconnect } = useWallet();

    // Use the new multi-chain balance hook
    const { balances } = useMultiChainBalances(address, isConnected);

    const [showDropdown, setShowDropdown] = useState(false);
    const [copied, setCopied] = useState(false);

    // Capture initial localStorage values in refs on mount.
    // Refs survive re-renders and prevent the ghost state from breaking
    // if WalletProvider's useEffect clears localStorage during wagmi's
    // transient 'disconnected' status on page refresh.
    const wasConnectedRef = useRef(
        typeof window !== 'undefined' ? localStorage.getItem('walletConnected') === 'true' : false
    );
    const lastAddressRef = useRef(
        typeof window !== 'undefined' ? localStorage.getItem('lastAddress') : null
    );

    // Keep refs in sync: update when wallet connects/disconnects
    useEffect(() => {
        if (isConnected && address) {
            wasConnectedRef.current = true;
            lastAddressRef.current = address;
        } else if (status === 'disconnected' && !wasConnectedRef.current) {
            // Only reset if we never had a connection (fresh visitor)
            lastAddressRef.current = null;
        }
    }, [isConnected, address, status]);

    // Expose as a readable constant for backward compatibility in the render
    const wasConnected = wasConnectedRef.current;

    const buttonText = connectText || t('Connect Wallet');

    // Close dropdown when clicking outside
    useEffect(() => {
        if (isMobile) return;
        const handleClickOutside = (event) => {
            if (showDropdown && !event.target.closest('.wallet-container')) {
                setShowDropdown(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showDropdown, isMobile]);

    // Function to switch chains
    const handleSwitchChain = (chainId) => {
        try {
            switchChain({ chainId });
            setShowDropdown(false);
        } catch (error) {
            console.error('Error switching chain:', error);
        }
    };

    // Disconnect and reset refs so ghost state doesn't persist
    const handleDisconnect = () => {
        wasConnectedRef.current = false;
        lastAddressRef.current = null;
        disconnect();
        setShowDropdown(false);
    };

    // Get shortened wallet address
    const shortenAddress = (addr) => {
        if (!addr) return '';
        return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
    };

    // Copy address to clipboard
    const handleCopyAddress = async () => {
        if (!address) return;
        try {
            await navigator.clipboard.writeText(address);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy address:', err);
        }
    };

    return (
        <div className="relative">
            <ConnectButton.Custom>
                {({ account, chain, openChainModal, openConnectModal, mounted }) => {
                    return (
                        <div
                            {...((!mounted && wasConnected) ? {
                                'aria-hidden': true,
                                'style': {
                                    opacity: 0,
                                    pointerEvents: 'none',
                                    userSelect: 'none',
                                },
                            } : {})}
                        >
                            {(() => {
                                const isReconnecting = status === 'reconnecting' || (status === 'connecting' && mounted);
                                const lastAddress = lastAddressRef.current;

                                // Hydration/Reconnection state: Show ghost avatar if we have a real session to restore
                                // Covers: unmounted, reconnecting, AND the gap where mounted=true but account/chain aren't populated yet
                                // Also covers the transient 'disconnected' status wagmi fires on page refresh before reconnection starts
                                const isWaitingForAccount = mounted && wasConnected && lastAddress && (!account || !chain);
                                const isTransientDisconnect = mounted && wasConnected && lastAddress && status === 'disconnected' && !account;
                                if (wasConnected && lastAddress && (!mounted || isReconnecting || isWaitingForAccount || isTransientDisconnect)) {
                                    if (isMobile) {
                                        return (
                                            <div className="relative flex items-center justify-center p-1 rounded-full border border-slate-200/60 dark:border-white/20 bg-white dark:bg-white/10 backdrop-blur-sm animate-pulse opacity-80 shadow-md shadow-black/5 dark:shadow-black dark:shadow-white">
                                                <div className="relative flex items-center justify-center">
                                                    {lastAddress ? (
                                                        <Jazzicon diameter={32} seed={jsNumberForAddress(lastAddress)} />
                                                    ) : (
                                                        <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-white/20" />
                                                    )}
                                                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-white dark:border-black rounded-full shadow-sm"></div>
                                                </div>
                                            </div>
                                        );
                                    }
                                    return (
                                        <div className="h-[44px] flex items-center space-x-3 pl-2.5 pr-4 rounded-2xl border border-slate-200/60 dark:border-white/10 bg-slate-50/50 dark:bg-white/5 backdrop-blur-xl shadow-sm relative overflow-hidden animate-pulse opacity-80">
                                            <div className="relative flex items-center justify-center">
                                                {lastAddress ? (
                                                    <Jazzicon diameter={30} seed={jsNumberForAddress(lastAddress)} />
                                                ) : (
                                                    <div className="w-[30px] h-[30px] rounded-full bg-slate-200 dark:bg-white/10" />
                                                )}
                                                <div className="absolute inset-0 rounded-full border border-black/5 dark:border-white/5 pointer-events-none"></div>
                                            </div>
                                            <div className="flex flex-col justify-center items-start pl-1 hidden sm:flex">
                                                <div className="flex items-center">
                                                    <span className="text-[14px] text-slate-700 dark:text-slate-200 font-bold tracking-tight">
                                                        {shortenAddress(lastAddress)}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                }

                                if (!account || !chain) {
                                    return (
                                        <button
                                            onClick={openConnectModal}
                                            className="h-[44px] px-6 rounded-xl bg-black dark:bg-white text-white dark:text-black hover:bg-black/90 dark:hover:bg-white/90 active:scale-95 transition-all duration-300 font-bold text-[13px] whitespace-nowrap flex items-center justify-center tracking-tight group relative overflow-hidden"
                                        >
                                            <span className="relative z-10">{buttonText}</span>
                                        </button>
                                    );
                                }

                                if (chain.unsupported) {
                                    return (
                                        <button
                                            onClick={openChainModal}
                                            className="h-[44px] px-6 rounded-2xl bg-red-500/10 dark:bg-red-400/10 text-red-600 dark:text-red-400 hover:bg-red-500/20 dark:hover:bg-red-400/20 transition-all duration-300 active:scale-95 font-bold text-[13px] whitespace-nowrap flex items-center justify-center tracking-tight"
                                        >
                                            {t('Wrong network')}
                                        </button>
                                    );
                                }

                                if (isMobile) {
                                    return (
                                        <>
                                            <div className="wallet-container">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setShowDropdown(!showDropdown);
                                                    }}
                                                    className="relative flex items-center justify-center active:scale-95 transition-all duration-300 p-1 rounded-full border border-slate-200/60 dark:border-white/20 bg-white dark:bg-white/10 backdrop-blur-sm"
                                                >
                                                    <div className="relative flex items-center justify-center">
                                                        <Jazzicon diameter={32} seed={jsNumberForAddress(account.address)} />
                                                        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-white dark:border-black rounded-full shadow-sm"></div>
                                                    </div>
                                                </button>

                                                {createPortal(
                                                    <AnimatePresence>
                                                        {showDropdown && (
                                                            <motion.div
                                                                initial={{ opacity: 0 }}
                                                                animate={{ opacity: 1 }}
                                                                exit={{ opacity: 0 }}
                                                                transition={{ duration: 0.2 }}
                                                                onClick={() => setShowDropdown(false)}
                                                                style={{ zIndex: 100000 }}
                                                                className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end justify-center overflow-hidden"
                                                            >
                                                                <motion.div
                                                                    drag="y"
                                                                    dragConstraints={{ top: 0 }}
                                                                    dragElastic={0.15}
                                                                    onDragEnd={(_, info) => {
                                                                        if (info.offset.y > 100) setShowDropdown(false);
                                                                    }}
                                                                    initial={{ y: '100%' }}
                                                                    animate={{ y: 0 }}
                                                                    exit={{ y: '100%' }}
                                                                    transition={{ type: 'spring', damping: 28, stiffness: 300, mass: 0.8 }}
                                                                    onClick={(e) => e.stopPropagation()}
                                                                    className="w-full max-w-[480px] bg-white dark:bg-[#0a0a0a] backdrop-blur-2xl rounded-t-[32px] shadow-[0_-10px_40px_rgba(0,0,0,0.1)] dark:shadow-[0_-20px_60px_rgba(0,0,0,0.5)] border-t border-x border-slate-200/60 dark:border-white/10 overflow-hidden touch-none"
                                                                >
                                                                    {/* Drag Handle */}
                                                                    <div className="flex justify-center pt-4 pb-2 active:opacity-50 transition-opacity">
                                                                        <div className="w-12 h-1.5 rounded-full bg-slate-200 dark:bg-white/20"></div>
                                                                    </div>

                                                                    {/* Account Header - RESTORED SPLIT BACKGROUND COLOR (Light/Dark style) */}
                                                                    <div className="px-6 pt-5 pb-5 border-b border-gray-100/50 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.02]">
                                                                        <div className="flex items-center justify-between mb-5">
                                                                            <span className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">
                                                                                {t('Account details')}
                                                                            </span>
                                                                            <button
                                                                                onClick={() => setShowDropdown(false)}
                                                                                className="p-2 -mr-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors bg-transparent border-none outline-none active:scale-75"
                                                                            >
                                                                                <X size={22} strokeWidth={2.5} />
                                                                            </button>
                                                                        </div>

                                                                        <div className="flex items-center space-x-3 p-4 bg-white dark:bg-white/5 rounded-2xl border border-gray-200/60 dark:border-white/10 shadow-sm">
                                                                            <div className="relative">
                                                                                <Jazzicon diameter={44} seed={jsNumberForAddress(account.address)} />
                                                                                <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-emerald-500 border-[3px] border-white dark:border-[#0a0a0a] rounded-full"></div>
                                                                            </div>
                                                                            <div className="flex-1 overflow-hidden">
                                                                                <div className="text-[19px] font-bold text-black dark:text-white truncate font-['Satoshi','Inter',sans-serif] tracking-tight">
                                                                                    {shortenAddress(account.address)}
                                                                                </div>
                                                                                <div className="text-[10px] text-black/60 dark:text-white/40 font-bold uppercase tracking-widest mt-0.5">
                                                                                    {t('Connected')}
                                                                                </div>
                                                                            </div>

                                                                            <div className="flex items-center space-x-2">
                                                                                <button
                                                                                    onClick={handleCopyAddress}
                                                                                    className="p-3 rounded-xl bg-slate-50 dark:bg-white/5 hover:bg-slate-200/60 dark:hover:bg-white/10 transition-all duration-200 text-slate-500 dark:text-slate-400 hover:text-black dark:hover:text-white relative border border-transparent active:scale-90"
                                                                                >
                                                                                    <Copy size={18} />
                                                                                    <AnimatePresence>
                                                                                        {copied && (
                                                                                            <motion.span
                                                                                                initial={{ opacity: 0, y: 5, scale: 0.9 }}
                                                                                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                                                                                exit={{ opacity: 0, y: 5, scale: 0.9 }}
                                                                                                className="absolute -top-11 left-1/2 -translate-x-1/2 bg-slate-950 text-white text-[10px] px-2.5 py-1.5 rounded-lg font-bold shadow-xl border border-white/10 whitespace-nowrap z-50 capitalize"
                                                                                                style={{ transition: 'none' }}
                                                                                            >
                                                                                                {t('copied')}
                                                                                            </motion.span>
                                                                                        )}
                                                                                    </AnimatePresence>
                                                                                </button>
                                                                                <button
                                                                                    onClick={handleDisconnect}
                                                                                    className="p-3 rounded-xl bg-slate-50 dark:bg-white/5 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all duration-200 text-slate-500 dark:text-slate-400 hover:text-red-500 border border-transparent hover:border-red-200 dark:hover:border-red-500/20 active:scale-90"
                                                                                >
                                                                                    <LogOut size={18} />
                                                                                </button>
                                                                            </div>
                                                                        </div>
                                                                    </div>

                                                                    {/* Networks - Cleaned area */}
                                                                    <div className="p-2 bg-transparent">
                                                                        <div className="px-6 py-4">
                                                                            <span className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">
                                                                                {t('Select Network')}
                                                                            </span>
                                                                        </div>
                                                                        {[
                                                                            { id: 5042002, name: t('Arc Testnet'), icon: '/icons/arc.png', balance: balances.arcTestnet },
                                                                            { id: 11155111, name: t('Sepolia'), icon: '/icons/eth.png', balance: balances.sepolia },
                                                                            { id: 84532, name: t('Base Sepolia'), icon: '/icons/base.png', balance: balances.baseSepolia, isBase: true }
                                                                        ].map((network) => {
                                                                            const isActive = chain.id === network.id;
                                                                            return (
                                                                                <div
                                                                                    key={network.id}
                                                                                    className={`flex items-center space-x-4 px-6 py-4 cursor-pointer transition-all duration-300 group touch-manipulation
                                                                                ${isActive ? 'cursor-default transition-none' : 'hover:bg-slate-50 dark:hover:bg-white/5 active:bg-slate-100 dark:active:bg-white/10 active:scale-[0.97]'}`}
                                                                                    onClick={() => !isActive && handleSwitchChain(network.id)}
                                                                                >
                                                                                    <div className={`w-9 h-9 rounded-full flex items-center justify-center overflow-hidden transition-all duration-300 shadow-sm
                                                                                ${isActive ? 'scale-110 shadow-lg shadow-black dark:shadow-white' : ''}
                                                                                ${network.isBase ? 'p-0.5 bg-white' : 'bg-white dark:bg-black p-0'}`}>
                                                                                        <img src={network.icon} alt={network.name} className="w-full h-full object-cover" />
                                                                                    </div>
                                                                                    <div className={`flex-1 text-left ${isActive ? 'pl-0.5' : ''}`}>
                                                                                        <div className={`text-[15px] font-bold tracking-tight transition-colors ${isActive ? 'text-black dark:text-white' : 'text-black dark:text-white'}`}>
                                                                                            {network.name}
                                                                                        </div>
                                                                                        <div className={`text-[12px] font-medium font-['Satoshi','Inter',sans-serif] ${isActive ? 'text-slate-500 dark:text-slate-400' : 'text-slate-500 dark:text-slate-400'}`}>
                                                                                            {network.balance.loading ? (
                                                                                                <Loader className="animate-spin" size={12} />
                                                                                            ) : (
                                                                                                <span>{network.balance.usdc} <span className="text-[9px] opacity-70">USDC</span></span>
                                                                                            )}
                                                                                        </div>
                                                                                    </div>
                                                                                    {isActive && (
                                                                                        <div className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-500 dark:bg-emerald-500 shadow-lg shadow-emerald-500/30 ring-2 ring-white dark:ring-[#0a0a0a]">
                                                                                            <motion.svg
                                                                                                initial={{ pathLength: 0, opacity: 0 }}
                                                                                                animate={{ pathLength: 1, opacity: 1 }}
                                                                                                width="10" height="8" viewBox="0 0 10 8" fill="none"
                                                                                            >
                                                                                                <motion.path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                                                            </motion.svg>
                                                                                        </div>
                                                                                    )}
                                                                                </div>
                                                                            );
                                                                        })}
                                                                    </div>

                                                                    {/* Safe bottom padding for phones with home bar */}
                                                                    <div className="h-8 bg-transparent"></div>
                                                                </motion.div>
                                                            </motion.div>
                                                        )}
                                                    </AnimatePresence>,
                                                    document.body
                                                )}
                                            </div>
                                        </>
                                    );
                                }

                                return (
                                    <>
                                        <div className="wallet-container">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setShowDropdown(!showDropdown);
                                                }}
                                                className="h-[44px] flex items-center space-x-3 pl-2.5 pr-4 rounded-2xl border border-slate-200/60 dark:border-white/10 bg-slate-50/50 dark:bg-white/5 backdrop-blur-xl hover:bg-white dark:hover:bg-white/10 hover:border-black/20 dark:hover:border-white/20 transition-all duration-300 active:scale-95 group relative overflow-hidden"
                                            >

                                                <div className="relative flex items-center justify-center transition-transform duration-500 group-hover:scale-105">
                                                    <Jazzicon diameter={30} seed={jsNumberForAddress(account.address)} />
                                                    <div className="absolute inset-0 rounded-full border border-black/5 dark:border-white/5 pointer-events-none"></div>
                                                </div>

                                                <div className="flex flex-col justify-center items-start relative z-10 pl-1">
                                                    <div className="flex items-center">
                                                        <span className="text-[14px] text-slate-700 dark:text-slate-200 font-bold tracking-tight transition-colors group-hover:text-black dark:group-hover:text-white">
                                                            {shortenAddress(account.address)}
                                                        </span>
                                                    </div>
                                                </div>
                                            </button>

                                            <AnimatePresence>
                                                {showDropdown && (
                                                    <motion.div
                                                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                                        exit={{ opacity: 0, y: 15, scale: 0.95 }}
                                                        className="absolute top-full right-0 mt-8 w-80 bg-white dark:bg-[#0a0a0a] rounded-3xl shadow-2xl border border-gray-200 dark:border-white/10 p-0 z-[60] overflow-hidden backdrop-blur-xl"
                                                    >
                                                        <div className="p-5 border-b border-gray-100 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02]">
                                                            <div className="flex items-center justify-between mb-4">
                                                                <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                                                                    {t('Account details')}
                                                                </span>
                                                            </div>

                                                            <div className="flex items-center space-x-3 p-3 bg-white dark:bg-white/5 rounded-2xl border border-gray-200 dark:border-white/10 shadow-sm group transition-all duration-300">
                                                                <div className="relative">
                                                                    <Jazzicon diameter={34} seed={jsNumberForAddress(account.address)} />
                                                                </div>
                                                                <div className="flex-1 overflow-hidden">
                                                                    <div className="text-[14px] font-bold text-black dark:text-white truncate font-['Satoshi','Inter',sans-serif] tracking-tight">
                                                                        {shortenAddress(account.address)}
                                                                    </div>
                                                                    <div className="text-[10px] text-black dark:text-white font-medium uppercase tracking-widest">
                                                                        {t('Connected')}
                                                                    </div>
                                                                </div>

                                                                <div className="flex items-center space-x-1.5">
                                                                    <button
                                                                        onClick={handleCopyAddress}
                                                                        className="p-2 rounded-xl bg-slate-50 dark:bg-white/5 hover:bg-slate-200/60 dark:hover:bg-white/10 transition-all duration-200 text-slate-500 dark:text-slate-400 hover:text-black dark:hover:text-white relative group/copy border border-transparent"
                                                                    >
                                                                        <Copy size={14} />
                                                                        <AnimatePresence>
                                                                            {copied && (
                                                                                <motion.span
                                                                                    initial={{ opacity: 0, y: 5, scale: 0.9 }}
                                                                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                                                                    exit={{ opacity: 0, y: 5, scale: 0.9 }}
                                                                                    className="absolute -top-11 left-1/2 -translate-x-1/2 bg-slate-950 text-white text-[10px] px-2.5 py-1.5 rounded-lg font-bold shadow-xl border border-white/10 whitespace-nowrap z-50 capitalize"
                                                                                >
                                                                                    {t('copied')}
                                                                                </motion.span>
                                                                            )}
                                                                        </AnimatePresence>
                                                                    </button>
                                                                    <button
                                                                        onClick={handleDisconnect}
                                                                        className="p-2 rounded-xl bg-slate-50 dark:bg-white/5 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all duration-200 text-slate-500 dark:text-slate-400 hover:text-red-500 border border-transparent hover:border-red-200 dark:hover:border-red-500/20"
                                                                    >
                                                                        <LogOut size={14} />
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="p-2 space-y-0.5 bg-white dark:bg-[#0a0a0a] border-b border-gray-100 dark:border-white/10">
                                                            {[
                                                                { id: 5042002, name: t('Arc Testnet'), icon: '/icons/arc.png', balance: balances.arcTestnet },
                                                                { id: 11155111, name: t('Sepolia'), icon: '/icons/eth.png', balance: balances.sepolia },
                                                                { id: 84532, name: t('Base Sepolia'), icon: '/icons/base.png', balance: balances.baseSepolia, isBase: true }
                                                            ].map((network) => {
                                                                const isActive = chain.id === network.id;
                                                                return (
                                                                    <div
                                                                        key={network.id}
                                                                        className={`flex items-center space-x-3 px-3 py-3 rounded-2xl cursor-pointer transition-all duration-300 group
                                                                                ${isActive
                                                                                ? 'cursor-default transition-none'
                                                                                : 'hover:bg-slate-50 dark:hover:bg-white/5 border border-transparent'
                                                                            }`}
                                                                        onClick={() => !isActive && handleSwitchChain(network.id)}
                                                                    >
                                                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center overflow-hidden transition-all duration-300 shadow-sm
                                                                                ${isActive ? 'scale-110 shadow-lg shadow-black dark:shadow-white' : ''}
                                                                                ${network.isBase ? 'p-0.5 bg-white' : 'bg-white dark:bg-black p-0'}`}>
                                                                            <img src={network.icon} alt={network.name} className="w-full h-full object-cover" />
                                                                        </div>
                                                                        <div className={`flex-1 text-left ${isActive ? 'pl-0.5' : ''}`}>
                                                                            <div className={`text-[15px] font-bold tracking-tight transition-colors ${isActive ? 'text-black dark:text-white' : 'text-black dark:text-white'}`}>
                                                                                {network.name}
                                                                            </div>
                                                                            <div className={`text-[12px] font-medium font-['Satoshi','Inter',sans-serif] ${isActive ? 'text-slate-500 dark:text-slate-400' : 'text-slate-500 dark:text-slate-500'}`}>
                                                                                {network.balance.loading ? (
                                                                                    <Loader className="animate-spin" size={12} />
                                                                                ) : (
                                                                                    <span>{network.balance.usdc} <span className="text-[9px] opacity-70">USDC</span></span>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                        {isActive && (
                                                                            <div className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-500 dark:bg-emerald-500 shadow-lg shadow-emerald-500/30 ring-2 ring-white dark:ring-[#0a0a0a] transition-all duration-500 animate-in zoom-in">
                                                                                <motion.svg
                                                                                    initial={{ pathLength: 0, opacity: 0 }}
                                                                                    animate={{ pathLength: 1, opacity: 1 }}
                                                                                    width="10" height="8" viewBox="0 0 10 8" fill="none"
                                                                                >
                                                                                    <motion.path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                                                </motion.svg>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    </>
                                );
                            })()}
                        </div>
                    );
                }}
            </ConnectButton.Custom>
        </div>
    );
};

export default CustomConnectButton;
