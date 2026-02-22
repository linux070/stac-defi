import { useAccount, useSwitchChain, useDisconnect } from 'wagmi';
import { useTranslation } from 'react-i18next';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import Jazzicon, { jsNumberForAddress } from 'react-jazzicon';
import { Loader, Copy, LogOut, X } from 'lucide-react';
import useMultiChainBalances from '../hooks/useMultiChainBalances';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

const CustomConnectButton = ({ connectText, isMobile }) => {
    const { t } = useTranslation();
    const { address, isConnected } = useAccount();
    const { switchChain } = useSwitchChain();
    const { disconnect } = useDisconnect();

    // Use the new multi-chain balance hook
    const { balances } = useMultiChainBalances(address, isConnected);

    const [showDropdown, setShowDropdown] = useState(false);
    const [copied, setCopied] = useState(false);

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
                            {...(!mounted && {
                                'aria-hidden': true,
                                'style': {
                                    opacity: 0,
                                    pointerEvents: 'none',
                                    userSelect: 'none',
                                },
                            })}
                        >
                            {(() => {
                                if (!mounted || !account || !chain) {
                                    return (
                                        <button
                                            onClick={openConnectModal}
                                            className="h-[44px] px-6 rounded-xl bg-blue-500 text-white hover:bg-blue-600 active:scale-95 transition-all duration-300 font-bold text-[13px] whitespace-nowrap flex items-center justify-center tracking-tight shadow-lg shadow-blue-500/20 group relative overflow-hidden"
                                        >
                                            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
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
                                                    className="relative flex items-center justify-center active:scale-95 transition-all duration-300 p-1 rounded-full border border-slate-200/60 dark:border-white/20 bg-white/80 dark:bg-white/10 backdrop-blur-sm shadow-md shadow-black/5 dark:shadow-blue-500/10"
                                                >
                                                    <div className="relative flex items-center justify-center">
                                                        <Jazzicon diameter={32} seed={jsNumberForAddress(account.address)} />
                                                        <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full shadow-sm"></div>
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
                                                                    className="w-full max-w-[480px] bg-white/95 dark:bg-[#0c0c0c]/98 backdrop-blur-2xl rounded-t-[32px] shadow-[0_-10px_40px_rgba(0,0,0,0.1)] dark:shadow-[0_-15px_50px_rgba(0,0,0,0.4)] border-t border-x border-slate-200/60 dark:border-white/10 overflow-hidden touch-none"
                                                                >
                                                                    {/* Drag Handle */}
                                                                    <div className="flex justify-center pt-4 pb-2 active:opacity-50 transition-opacity">
                                                                        <div className="w-12 h-1.5 rounded-full bg-slate-200 dark:bg-white/20"></div>
                                                                    </div>

                                                                    {/* Account Header */}
                                                                    <div className="px-6 pt-4 pb-4 border-b border-gray-100/50 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.02]">
                                                                        <div className="flex items-center justify-between mb-4">
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

                                                                        <div className="flex items-center space-x-3 p-3 bg-white dark:bg-white/5 rounded-2xl border border-gray-200 dark:border-white/10 shadow-sm">
                                                                            <div className="relative">
                                                                                <Jazzicon diameter={40} seed={jsNumberForAddress(account.address)} />
                                                                                <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full"></div>
                                                                            </div>
                                                                            <div className="flex-1 overflow-hidden">
                                                                                <div className="text-[18px] font-bold text-slate-900 dark:text-white truncate font-['Satoshi','Inter',sans-serif] tracking-tight">
                                                                                    {shortenAddress(account.address)}
                                                                                </div>
                                                                                <div className="text-[10px] text-slate-900 dark:text-white font-medium uppercase tracking-widest">
                                                                                    {t('Connected')}
                                                                                </div>
                                                                            </div>

                                                                            <div className="flex items-center space-x-1.5">
                                                                                <button
                                                                                    onClick={handleCopyAddress}
                                                                                    className="p-2.5 rounded-xl bg-slate-50 dark:bg-white/5 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-all duration-200 text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 relative border border-transparent hover:border-blue-200 dark:hover:border-blue-500/20 active:scale-90"
                                                                                >
                                                                                    <Copy size={16} />
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
                                                                                    onClick={() => { disconnect(); setShowDropdown(false); }}
                                                                                    className="p-2.5 rounded-xl bg-slate-50 dark:bg-white/5 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all duration-200 text-slate-500 dark:text-slate-400 hover:text-red-500 border border-transparent hover:border-red-200 dark:hover:border-red-500/20 active:scale-90"
                                                                                >
                                                                                    <LogOut size={16} />
                                                                                </button>
                                                                            </div>
                                                                        </div>
                                                                    </div>

                                                                    {/* Networks */}
                                                                    <div className="p-2 bg-white dark:bg-[#0c0c0c]">
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
                                                                                ${isActive ? 'scale-110 shadow-lg shadow-blue-500/20' : ''}
                                                                                ${network.isBase ? 'p-0.5 bg-white' : 'bg-white dark:bg-black p-0'}`}>
                                                                                        <img src={network.icon} alt={network.name} className="w-full h-full object-cover" />
                                                                                    </div>
                                                                                    <div className={`flex-1 text-left ${isActive ? 'pl-0.5' : ''}`}>
                                                                                        <div className={`text-[15px] font-bold tracking-tight transition-colors ${isActive ? 'text-slate-900 dark:text-white' : 'text-slate-900 dark:text-white'}`}>
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
                                                                                        <div className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-500 dark:bg-emerald-600 shadow-lg shadow-emerald-500/30 ring-2 ring-white dark:ring-slate-900">
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
                                                                    <div className="h-8 bg-white dark:bg-[#0c0c0c]"></div>
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
                                                className="h-[44px] flex items-center space-x-3 pl-2.5 pr-4 rounded-2xl border border-slate-200/60 dark:border-white/10 bg-slate-50/50 dark:bg-white/5 backdrop-blur-xl hover:bg-white dark:hover:bg-white/10 hover:border-blue-500/30 dark:hover:border-blue-400/30 transition-all duration-300 shadow-sm active:scale-95 group relative overflow-hidden"
                                            >
                                                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-blue-500/5 to-blue-500/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>

                                                <div className="relative flex items-center justify-center transition-transform duration-500 group-hover:scale-105">
                                                    <Jazzicon diameter={30} seed={jsNumberForAddress(account.address)} />
                                                    <div className="absolute inset-0 rounded-full border border-black/5 dark:border-white/5 pointer-events-none"></div>
                                                </div>

                                                <div className="flex flex-col justify-center items-start relative z-10 pl-1">
                                                    <div className="flex items-center">
                                                        <span className="text-[14px] text-slate-700 dark:text-slate-200 font-bold tracking-tight transition-colors group-hover:text-slate-900 dark:group-hover:text-white">
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
                                                        className="absolute top-full right-0 mt-8 w-80 bg-white dark:bg-slate-950 rounded-3xl shadow-2xl border border-gray-200 dark:border-white/10 p-0 z-[60] overflow-hidden backdrop-blur-xl dark:bg-slate-950/90"
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
                                                                    <div className="text-[14px] font-bold text-slate-900 dark:text-white truncate font-['Satoshi','Inter',sans-serif] tracking-tight">
                                                                        {shortenAddress(account.address)}
                                                                    </div>
                                                                    <div className="text-[10px] text-slate-900 dark:text-white font-medium uppercase tracking-widest">
                                                                        {t('Connected')}
                                                                    </div>
                                                                </div>

                                                                <div className="flex items-center space-x-1.5">
                                                                    <button
                                                                        onClick={handleCopyAddress}
                                                                        className="p-2 rounded-xl bg-slate-50 dark:bg-white/5 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-all duration-200 text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 relative group/copy border border-transparent hover:border-blue-200 dark:hover:border-blue-500/20"
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
                                                                        onClick={() => { disconnect(); setShowDropdown(false); }}
                                                                        className="p-2 rounded-xl bg-slate-50 dark:bg-white/5 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all duration-200 text-slate-500 dark:text-slate-400 hover:text-red-500 border border-transparent hover:border-red-200 dark:hover:border-red-500/20"
                                                                    >
                                                                        <LogOut size={14} />
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="p-2 space-y-0.5 bg-white dark:bg-slate-950 border-b border-gray-100 dark:border-white/10">
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
                                                                                ${isActive ? 'scale-110 shadow-lg shadow-blue-500/20' : ''}
                                                                                ${network.isBase ? 'p-0.5 bg-white' : 'bg-white dark:bg-black p-0'}`}>
                                                                            <img src={network.icon} alt={network.name} className="w-full h-full object-cover" />
                                                                        </div>
                                                                        <div className={`flex-1 text-left ${isActive ? 'pl-0.5' : ''}`}>
                                                                            <div className={`text-[15px] font-bold tracking-tight transition-colors ${isActive ? 'text-slate-900 dark:text-white' : 'text-slate-900 dark:text-white'}`}>
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
                                                                            <div className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-500 dark:bg-emerald-600 shadow-lg shadow-emerald-500/30 ring-2 ring-white dark:ring-slate-900 transition-all duration-500 animate-in zoom-in">
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
