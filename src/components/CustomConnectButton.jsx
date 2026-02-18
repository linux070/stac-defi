import { useAccount, useSwitchChain, useDisconnect } from 'wagmi';
import { useTranslation } from 'react-i18next';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import Jazzicon, { jsNumberForAddress } from 'react-jazzicon';
import { Loader, Copy, LogOut } from 'lucide-react';
import useMultiChainBalances from '../hooks/useMultiChainBalances';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';

const CustomConnectButton = () => {
  const { t } = useTranslation();
  const { address, isConnected } = useAccount();
  const { chains, switchChain } = useSwitchChain();
  const { disconnect } = useDisconnect();

  // Use the new multi-chain balance hook
  const { balances } = useMultiChainBalances(address, isConnected);

  const [showDropdown, setShowDropdown] = useState(false);
  const [copied, setCopied] = useState(false);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showDropdown && !event.target.closest('.wallet-container')) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showDropdown]);

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
                      className="h-[44px] px-6 rounded-2xl bg-blue-600 text-white hover:bg-blue-700 transition-all duration-300 shadow-lg shadow-blue-500/25 active:scale-95 font-bold text-[13px] whitespace-nowrap flex items-center justify-center tracking-tight"
                    >
                      {t('Connect Wallet')}
                    </button>
                  );
                }

                if (chain.unsupported) {
                  return (
                    <button
                      onClick={openChainModal}
                      className="h-[44px] px-6 rounded-2xl bg-red-500 text-white hover:bg-red-600 transition-all duration-300 shadow-lg shadow-red-500/25 active:scale-95 font-bold text-[13px] whitespace-nowrap flex items-center justify-center tracking-tight"
                    >
                      {t('Wrong network')}
                    </button>
                  );
                }



                return (
                  <>
                    <div className="wallet-container">
                      {/* Main wallet button with current chain balance - PREMIUM REDESIGN */}
                      <button
                        onClick={() => setShowDropdown(!showDropdown)}
                        className="h-[44px] flex items-center space-x-3 pl-2.5 pr-4 rounded-2xl border border-slate-200/60 dark:border-white/10 bg-slate-50/50 dark:bg-white/5 backdrop-blur-xl hover:bg-white dark:hover:bg-white/10 hover:border-blue-500/30 dark:hover:border-blue-400/30 transition-all duration-300 shadow-sm active:scale-95 group relative overflow-hidden"
                      >
                        {/* Subtle background glow effect on hover */}
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-blue-500/5 to-blue-500/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>

                        {/* Jazzicon with cleaner look - MOVED TO START */}
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

                      {/* Consolidated Wallet Dropdown */}
                      <AnimatePresence>
                        {showDropdown && (
                          <motion.div
                            initial={{ opacity: 0, y: 20, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 15, scale: 0.95 }}
                            className="absolute top-full right-0 mt-8 w-80 bg-white dark:bg-slate-950 rounded-3xl shadow-2xl border border-gray-200 dark:border-white/10 p-0 z-[60] overflow-hidden backdrop-blur-xl dark:bg-slate-950/90"
                          >
                            {/* USER-FOCUSED CONSOLIDATED HEADER */}
                            <div className="p-5 border-b border-gray-100 dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02]">
                              <div className="flex items-center justify-between mb-4">
                                <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                                  {t('Account details')}
                                </span>
                              </div>

                              {/* Wallet Identity Card */}
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

                            {/* Network Selection Section */}
                            <div className="p-2 space-y-0.5 bg-white dark:bg-slate-950 border-b border-gray-100 dark:border-white/10">
                              {/* Arc Testnet Option */}
                              {(() => {
                                const ARC_CHAIN_ID = 5042002;
                                const arcChain = chains.find(c => c.id === ARC_CHAIN_ID);
                                if (!arcChain) return null;
                                const isActive = chain.id === ARC_CHAIN_ID;
                                return (
                                  <div
                                    className={`flex items-center space-x-3 px-3 py-3 rounded-2xl cursor-pointer transition-all duration-300 group
                                      ${isActive
                                        ? 'cursor-default transition-none'
                                        : 'hover:bg-slate-50 dark:hover:bg-white/5 border border-transparent'
                                      }`}
                                    onClick={() => !isActive && handleSwitchChain(arcChain.id)}
                                  >
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center overflow-hidden transition-all duration-300 shadow-sm
                                      ${isActive ? 'scale-110 shadow-lg shadow-blue-500/20' : ''}
                                      bg-black p-0`}>
                                      <img src="/icons/Arc.png" alt="Arc" className="w-full h-full object-cover" />
                                    </div>
                                    <div className={`flex-1 text-left ${isActive ? 'pl-0.5' : ''}`}>
                                      <div className={`text-[15px] font-bold tracking-tight transition-colors ${isActive ? 'text-slate-900 dark:text-white' : 'text-slate-900 dark:text-white'}`}>
                                        Arc Testnet
                                      </div>
                                      <div className={`text-[12px] font-medium font-['Satoshi','Inter',sans-serif] ${isActive ? 'text-slate-500 dark:text-slate-400' : 'text-slate-500 dark:text-slate-500'}`}>
                                        {balances.arcTestnet.loading ? (
                                          <Loader className="animate-spin" size={12} />
                                        ) : (
                                          <span>{balances.arcTestnet.usdc} <span className="text-[9px] opacity-70">USDC</span></span>
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
                              })()}

                              {/* Sepolia Option */}
                              {(() => {
                                const SEPOLIA_CHAIN_ID = 11155111;
                                const sepoliaChain = chains.find(c => c.id === SEPOLIA_CHAIN_ID);
                                if (!sepoliaChain) return null;
                                const isActive = chain.id === SEPOLIA_CHAIN_ID;
                                return (
                                  <div
                                    className={`flex items-center space-x-3 px-3 py-3 rounded-2xl cursor-pointer transition-all duration-300 group
                                      ${isActive
                                        ? 'cursor-default transition-none'
                                        : 'hover:bg-slate-50 dark:hover:bg-white/5 border border-transparent'
                                      }`}
                                    onClick={() => !isActive && handleSwitchChain(sepoliaChain.id)}
                                  >
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center overflow-hidden transition-all duration-300 shadow-sm
                                      ${isActive ? 'scale-110 shadow-lg shadow-blue-500/20' : ''}
                                      bg-white p-0`}>
                                      <img src="/icons/eth.png" alt="Sepolia" className="w-full h-full object-cover" />
                                    </div>
                                    <div className="flex-1 text-left pl-0.5">
                                      <div className={`text-[15px] font-bold tracking-tight transition-colors ${isActive ? 'text-slate-900 dark:text-white' : 'text-slate-900 dark:text-white'}`}>
                                        Sepolia
                                      </div>
                                      <div className={`text-[12px] font-medium font-['Satoshi','Inter',sans-serif] ${isActive ? 'text-slate-500 dark:text-slate-400' : 'text-slate-500 dark:text-slate-500'}`}>
                                        {balances.sepolia.loading ? (
                                          <Loader className="animate-spin" size={12} />
                                        ) : (
                                          <span>{balances.sepolia.usdc} <span className="text-[9px] opacity-70">USDC</span></span>
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
                              })()}

                              {/* Base Sepolia Option */}
                              {(() => {
                                const BASE_SEPOLIA_CHAIN_ID = 84532;
                                const baseSepoliaChain = chains.find(c => c.id === BASE_SEPOLIA_CHAIN_ID);
                                if (!baseSepoliaChain) return null;
                                const isActive = chain.id === BASE_SEPOLIA_CHAIN_ID;
                                return (
                                  <div
                                    className={`flex items-center space-x-3 px-3 py-3 rounded-2xl cursor-pointer transition-all duration-300 group
                                      ${isActive
                                        ? 'cursor-default transition-none'
                                        : 'hover:bg-slate-50 dark:hover:bg-white/5 border border-transparent'
                                      }`}
                                    onClick={() => !isActive && handleSwitchChain(baseSepoliaChain.id)}
                                  >
                                    <div className={`w-8 h-8 ${isActive ? 'scale-110 shadow-lg shadow-blue-500/20' : ''} base-sepolia-icon-representation transition-all duration-300`}>
                                      <img src="/icons/base.png" alt="Base Sepolia" className="w-full h-full object-cover" />
                                    </div>
                                    <div className="flex-1 text-left pl-0.5">
                                      <div className={`text-[15px] font-bold tracking-tight transition-colors ${isActive ? 'text-slate-900 dark:text-white' : 'text-slate-900 dark:text-white'}`}>
                                        Base Sepolia
                                      </div>
                                      <div className={`text-[12px] font-medium font-['Satoshi','Inter',sans-serif] ${isActive ? 'text-slate-500 dark:text-slate-400' : 'text-slate-500 dark:text-slate-500'}`}>
                                        {balances.baseSepolia.loading ? (
                                          <Loader className="animate-spin" size={12} />
                                        ) : (
                                          <span>{balances.baseSepolia.usdc} <span className="text-[9px] opacity-70">USDC</span></span>
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
                              })()}
                            </div>

                            {/* RESOURCES & UPDATES SECTION - ISOLATED INTERACTION */}
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
