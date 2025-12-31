import React, { useState, useEffect } from 'react';
import { useAccount, useBalance, useSwitchChain, useDisconnect } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Loader, X, Copy, LogOut, Check } from 'lucide-react';
import useTokenBalance from '../hooks/useTokenBalance';
import useMultiChainBalances from '../hooks/useMultiChainBalances';
import { motion, AnimatePresence } from 'framer-motion';

const CustomConnectButton = () => {
  const { address, isConnected, chain } = useAccount();
  const { data: ethBalance } = useBalance({ address });
  const { balance: usdcBalance, loading: usdcLoading } = useTokenBalance('USDC');
  const { chains, switchChain } = useSwitchChain();
  const { disconnect } = useDisconnect();

  // Use the new multi-chain balance hook
  const { balances } = useMultiChainBalances(address, isConnected);

  const [showBalance, setShowBalance] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [copied, setCopied] = useState(false);

  // Show balance after a short delay to allow for initial load
  useEffect(() => {
    if (isConnected) {
      const timer = setTimeout(() => {
        setShowBalance(true);
      }, 500);
      return () => clearTimeout(timer);
    } else {
      setShowBalance(false);
    }
  }, [isConnected]);

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

  // Get current chain USDC balance
  const getCurrentChainBalance = () => {
    if (chain?.name?.includes('Arc')) {
      return {
        balance: balances.arcTestnet.usdc || '0.00',
        loading: balances.arcTestnet.loading,
      };
    } else if (chain?.name?.includes('Sepolia')) {
      return {
        balance: balances.sepolia.usdc || '0.00',
        loading: balances.sepolia.loading,
      };
    }
    return { balance: '0.00', loading: false };
  };

  return (
    <div className="relative">
      <ConnectButton.Custom>
        {({ account, chain, openAccountModal, openChainModal, openConnectModal, mounted }) => {
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
                      className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full font-medium hover:from-blue-600 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                    >
                      Connect Wallet
                    </button>
                  );
                }

                if (chain.unsupported) {
                  return (
                    <button
                      onClick={openChainModal}
                      className="px-4 py-2 bg-red-500 text-white rounded-full font-medium hover:bg-red-600 transition-all duration-200"
                    >
                      Wrong network
                    </button>
                  );
                }

                const currentBalance = getCurrentChainBalance();

                return (
                  <>
                    <div className="wallet-container">
                      {/* Main wallet button with current chain balance */}
                      <button
                        onClick={() => setShowDropdown(!showDropdown)}
                        className="flex items-center space-x-2 px-3 py-2 bg-white dark:bg-gray-800 rounded-full border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        <div className="flex flex-col items-end">
                          {showBalance && (
                            <div className="flex items-center space-x-1">
                              {currentBalance.loading ? (
                                <Loader className="animate-spin" size={12} />
                              ) : (
                                <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                                  {currentBalance.balance} USDC
                                </span>
                              )}
                            </div>
                          )}
                          <div className="flex items-center space-x-1">
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              {shortenAddress(account.address)}
                            </span>
                          </div>
                        </div>
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold">
                          {account.displayName?.charAt(0) || 'W'}
                        </div>
                      </button>

                      {/* Dropdown menu with both chain balances */}
                      {showDropdown && (
                        <div className="wallet-dropdown-menu absolute top-full right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-50">
                          {/* Arc Testnet Option */}
                          {(() => {
                            const arcChain = chains.find(c => c.name.includes('Arc'));
                            if (!arcChain) return null;
                            return (
                              <div
                                className="chain-option flex items-center space-x-3 px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                                onClick={() => handleSwitchChain(arcChain.id)}
                              >
                                <div
                                  className="w-6 h-6 rounded-full flex items-center justify-center overflow-hidden"
                                  style={{ background: arcChain.name.includes('Arc') ? '#131720' : (arcChain.iconBackground || '#000') }}
                                >
                                  {arcChain.iconUrl ? (
                                    <img
                                      src={arcChain.iconUrl}
                                      alt="Arc Testnet"
                                      className="w-full h-full object-contain"
                                    />
                                  ) : (
                                    <span className="text-[10px] font-bold">A</span>
                                  )}
                                </div>
                                <div className="flex-1 text-left">
                                  <div className="text-sm font-medium text-gray-900 dark:text-white">Arc Testnet</div>
                                  <div className="text-xs text-gray-500 dark:text-gray-400">
                                    {balances.arcTestnet.loading ? (
                                      <span className="flex items-center">
                                        <Loader className="animate-spin mr-1" size={10} />
                                        Loading...
                                      </span>
                                    ) : (
                                      `${balances.arcTestnet.usdc || '0.00'} USDC`
                                    )}
                                  </div>
                                </div>
                                {chain.name.includes('Arc') && (
                                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                )}
                              </div>
                            );
                          })()}

                          {/* Sepolia Option */}
                          {(() => {
                            const sepoliaChain = chains.find(c => c.name.includes('Sepolia') && !c.name.includes('Base'));
                            if (!sepoliaChain) return null;
                            return (
                              <div
                                className="chain-option flex items-center space-x-3 px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                                onClick={() => handleSwitchChain(sepoliaChain.id)}
                              >
                                <div
                                  className="w-6 h-6 rounded-full flex items-center justify-center overflow-hidden"
                                  style={{ background: sepoliaChain.iconBackground || '#484c50' }}
                                >
                                  {sepoliaChain.iconUrl ? (
                                    <img
                                      src={sepoliaChain.iconUrl}
                                      alt="Sepolia"
                                      className="w-full h-full object-contain"
                                    />
                                  ) : (
                                    <span className="text-[10px] font-bold">S</span>
                                  )}
                                </div>
                                <div className="flex-1 text-left">
                                  <div className="text-sm font-medium text-gray-900 dark:text-white">Sepolia</div>
                                  <div className="text-xs text-gray-500 dark:text-gray-400">
                                    {balances.sepolia.loading ? (
                                      <span className="flex items-center">
                                        <Loader className="animate-spin mr-1" size={10} />
                                        Loading...
                                      </span>
                                    ) : (
                                      `${balances.sepolia.usdc || '0.00'} USDC`
                                    )}
                                  </div>
                                </div>
                                {chain.name.includes('Sepolia') && (
                                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                )}
                              </div>
                            );
                          })()}

                          <div className="border-t border-gray-200 dark:border-gray-700 my-2"></div>

                          {/* Account info with USDC balance */}
                          <div className="px-4 py-3 space-y-1">
                            <div className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                              {shortenAddress(account.address)}
                            </div>
                            {/* USDC Balance for current chain */}
                            <div className="text-xs text-gray-600 dark:text-gray-400">
                              {currentBalance.loading ? (
                                <span className="flex items-center">
                                  <Loader className="animate-spin mr-1" size={10} />
                                  Loading...
                                </span>
                              ) : (
                                `${currentBalance.balance} USDC`
                              )}
                            </div>
                          </div>

                          <div className="border-t border-gray-200 dark:border-gray-700 my-2"></div>

                          {/* Faucet link for Sepolia USDC */}
                          {chain.name.includes('Sepolia') && (
                            <>
                              <a
                                href="https://faucet.circle.com/"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full text-left px-4 py-2 text-sm text-blue-600 dark:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
                              >
                                <span>Get Testnet USDC</span>
                              </a>
                              <div className="border-t border-gray-200 dark:border-gray-700 my-2"></div>
                            </>
                          )}

                          {/* Account details button */}
                          <button
                            onClick={() => {
                              setShowAccountModal(true);
                              setShowDropdown(false);
                            }}
                            className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
                          >
                            <span>Account Details</span>
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Custom Account Modal */}
                    <AnimatePresence>
                      {showAccountModal && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                            onClick={() => setShowAccountModal(false)}
                          />
                          <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="relative w-full max-w-sm bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 z-10"
                          >
                            {/* Close button */}
                            <button
                              onClick={() => setShowAccountModal(false)}
                              className="absolute top-4 right-4 p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                            >
                              <X size={20} className="text-gray-500 dark:text-gray-400" />
                            </button>

                            {/* Wallet Avatar */}
                            <div className="flex flex-col items-center mb-6">
                              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-2xl font-bold mb-3">
                                {account.displayName?.charAt(0) || 'W'}
                              </div>

                              {/* Wallet Address */}
                              <div className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                                {shortenAddress(account.address)}
                              </div>

                              {/* USDC Balance */}
                              <div className="text-sm text-gray-600 dark:text-gray-400">
                                {currentBalance.loading ? (
                                  <span className="flex items-center">
                                    <Loader className="animate-spin mr-2" size={14} />
                                    Loading balance...
                                  </span>
                                ) : (
                                  `${currentBalance.balance} USDC`
                                )}
                              </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="space-y-2">
                              {/* Copy Address Button */}
                              <button
                                onClick={handleCopyAddress}
                                className="w-full flex items-center justify-center space-x-2 px-4 py-3 rounded-xl border-2 border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-200"
                              >
                                {copied ? (
                                  <>
                                    <Check size={18} className="text-green-500" />
                                    <span className="font-medium text-green-500">Copied!</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy size={18} className="text-gray-600 dark:text-gray-400" />
                                    <span className="font-medium text-gray-700 dark:text-gray-300">Copy Address</span>
                                  </>
                                )}
                              </button>

                              {/* Disconnect Button */}
                              <button
                                onClick={() => {
                                  disconnect();
                                  setShowAccountModal(false);
                                  setShowDropdown(false);
                                }}
                                className="w-full flex items-center justify-center space-x-2 px-4 py-3 rounded-xl border-2 border-red-200 dark:border-red-800 hover:border-red-500 dark:hover:border-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200"
                              >
                                <LogOut size={18} className="text-red-600 dark:text-red-400" />
                                <span className="font-medium text-red-600 dark:text-red-400">Disconnect</span>
                              </button>
                            </div>
                          </motion.div>
                        </div>
                      )}
                    </AnimatePresence>
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