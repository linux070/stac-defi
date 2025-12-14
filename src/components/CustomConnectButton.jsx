import React, { useState, useEffect } from 'react';
import { useAccount, useBalance, useSwitchChain } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Loader } from 'lucide-react';
import useTokenBalance from '../hooks/useTokenBalance';
import useMultiChainBalances from '../hooks/useMultiChainBalances';

const CustomConnectButton = () => {
  const { address, isConnected, chain } = useAccount();
  const { data: ethBalance } = useBalance({ address });
  const { balance: usdcBalance, loading: usdcLoading } = useTokenBalance('USDC');
  const { chains, switchChain } = useSwitchChain();
  
  // Use the new multi-chain balance hook
  const { balances } = useMultiChainBalances(address, isConnected);
  
  const [showBalance, setShowBalance] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  
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

                return (
                  <div className="wallet-container">
                    {/* Main wallet button with current chain balance */}
                    <button
                      onClick={() => setShowDropdown(!showDropdown)}
                      className="flex items-center space-x-2 px-3 py-2 bg-white dark:bg-gray-800 rounded-full border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      <div className="flex flex-col items-end">
                        {showBalance && (
                          <div className="flex items-center space-x-1">
                            {chain.name.includes('Arc') ? (
                              balances.arcTestnet.loading ? (
                                <Loader className="animate-spin" size={12} />
                              ) : (
                                <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                                  {balances.arcTestnet.usdc || '0.00'} USDC
                                </span>
                              )
                            ) : chain.name.includes('Sepolia') ? (
                              balances.sepolia.loading ? (
                                <Loader className="animate-spin" size={12} />
                              ) : (
                                <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                                  {balances.sepolia.usdc || '0.00'} USDC
                                </span>
                              )
                            ) : (
                              <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                                0.00 USDC
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
                        <div 
                          className="chain-option flex items-center space-x-3 px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                          onClick={() => {
                            const arcChain = chains.find(c => c.name.includes('Arc'));
                            if (arcChain) handleSwitchChain(arcChain.id);
                          }}
                        >
                          <div className="w-6 h-6 rounded-full flex items-center justify-center">
                            <img 
                              src="/icons/Arc.png" 
                              alt="Arc Testnet" 
                              className="w-6 h-6 rounded-full object-contain"
                            />
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

                        {/* Sepolia Option */}
                        <div 
                          className="chain-option flex items-center space-x-3 px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                          onClick={() => {
                            const sepoliaChain = chains.find(c => c.name.includes('Sepolia'));
                            if (sepoliaChain) handleSwitchChain(sepoliaChain.id);
                          }}
                        >
                          <div className="w-6 h-6 rounded-full flex items-center justify-center">
                            <img 
                              src="/icons/eth.png" 
                              alt="Sepolia" 
                              className="w-6 h-6 rounded-full object-contain"
                            />
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

                        <div className="border-t border-gray-200 dark:border-gray-700 my-2"></div>

                        {/* Account info */}
                        <div className="px-4 py-2">
                          <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {shortenAddress(account.address)}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {account.displayBalance}
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
                              className="block w-full text-left px-4 py-2 text-sm text-blue-600 dark:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
                            >
                              <span>Get Testnet USDC</span>
                            </a>
                            <div className="border-t border-gray-200 dark:border-gray-700 my-2"></div>
                          </>
                        )}

                        {/* Disconnect option */}
                        <button
                          onClick={() => {
                            openAccountModal();
                            setShowDropdown(false);
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center"
                        >
                          <span>Disconnect</span>
                        </button>
                      </div>
                    )}
                  </div>
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