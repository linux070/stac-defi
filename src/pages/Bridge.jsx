import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useWallet } from '../contexts/WalletContext';
import { useSwitchChain } from 'wagmi';
import { ArrowLeftRight, ChevronDown, Loader, AlertCircle, Info, Wallet, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { NETWORKS, TOKENS } from '../config/networks';
import { sanitizeInput } from '../utils/blockchain';
import useTokenBalance from '../hooks/useTokenBalance';
import useBridge from '../hooks/useBridge';

const Bridge = () => {
  const { t } = useTranslation();
  const { isConnected, chainId } = useWallet();
  const { switchChain } = useSwitchChain(); // Add this hook
  const [fromChain, setFromChain] = useState('Sepolia');
  const [toChain, setToChain] = useState('Arc Testnet');
  const [amount, setAmount] = useState('');
  const [bridgeLoading, setBridgeLoading] = useState(false);
  const [showChainSelector, setShowChainSelector] = useState(null);
  
  // Initialize the useBridge hook
  const { bridgeUSDC, status, logs } = useBridge();
  
  // Real-time token balance for USDC
  const { balance, loading, refetch } = useTokenBalance('USDC');

  // Refs for trigger buttons
  const fromChainTriggerRef = useRef(null);
  const toChainTriggerRef = useRef(null);
  
  
  // Effect to handle body overflow when modals are open
  useEffect(() => {
    const isModalOpen = showChainSelector;
    if (isModalOpen) {
      // Prevent background scrolling when modal is open
      document.body.style.overflow = 'hidden';
    } else {
      // Restore normal scrolling when modal is closed
      document.body.style.overflow = 'visible';
    }
    
    // Cleanup function to restore overflow when component unmounts
    return () => {
      document.body.style.overflow = 'visible';
    };
  }, [showChainSelector]);

  const chains = ['Sepolia', 'Arc Testnet'];

  // Helper function to map chain names to chain IDs
  const getChainIdByName = (chainName) => {
    switch (chainName) {
      case 'Arc Testnet':
        return parseInt(NETWORKS.ARC_TESTNET.chainId, 16);
      case 'Sepolia':
        return parseInt(NETWORKS.ETHEREUM_SEPOLIA.chainId, 16);
      default:
        return null;
    }
  };

  // Effect to sync the Bridge networks with the global wallet network
  // This ensures that when the user switches networks in their wallet directly,
  // the Bridge component updates to reflect the current network
  useEffect(() => {
    if (chainId) {
      // Map the hex chainId to a network name
      const arcChainId = NETWORKS.ARC_TESTNET.chainId;
      const sepoliaChainId = NETWORKS.ETHEREUM_SEPOLIA.chainId;
      
      if (chainId === arcChainId) {
        setFromChain('Arc Testnet');
        // If the 'From' chain is Arc Testnet, the 'To' chain should be Sepolia
        setToChain('Sepolia');
      } else if (chainId === sepoliaChainId) {
        setFromChain('Sepolia');
        // If the 'From' chain is Sepolia, the 'To' chain should be Arc Testnet
        setToChain('Arc Testnet');
      }
    }
  }, [chainId]);

  const handleSwitchChains = async () => {
    // When switching chains, we need to update both the 'from' and 'to' chains
    // We'll switch the wallet network to match the new 'from' chain
    
    // Swap the local states first
    const newFromChain = toChain;
    const newToChain = fromChain;
    
    // Update both local states
    setFromChain(newFromChain);
    setToChain(newToChain);
    
    // If connected, trigger wallet network switch to match the new 'from' chain
    if (isConnected) {
      try {
        // Get the chain ID for the new 'from' chain
        const chainId = getChainIdByName(newFromChain);
        
        if (chainId) {
          // Trigger wallet network switch
          await switchChain({ chainId });
        }
      } catch (error) {
        console.error('Failed to switch network:', error);
        
        // Handle the case where the chain needs to be added to the wallet (Error 4902)
        if ((error?.code === 4902 || error?.message?.includes('wallet_addEthereumChain')) && window.ethereum) {
          try {
            // Add Arc Testnet to the wallet
            if (newFromChain === 'Arc Testnet') {
              await window.ethereum.request({
                method: 'wallet_addEthereumChain',
                params: [{
                  chainId: NETWORKS.ARC_TESTNET.chainId,
                  chainName: NETWORKS.ARC_TESTNET.chainName,
                  nativeCurrency: NETWORKS.ARC_TESTNET.nativeCurrency,
                  rpcUrls: NETWORKS.ARC_TESTNET.rpcUrls,
                  blockExplorerUrls: NETWORKS.ARC_TESTNET.blockExplorerUrls,
                }],
              });
              
              // After adding, try to switch again
              const chainId = getChainIdByName(newFromChain);
              if (chainId) {
                await switchChain({ chainId });
                setFromChain(newFromChain);
              }
            } else if (newFromChain === 'Sepolia') {
              // For Sepolia, just try to add it
              await window.ethereum.request({
                method: 'wallet_addEthereumChain',
                params: [{
                  chainId: NETWORKS.ETHEREUM_SEPOLIA.chainId,
                  chainName: NETWORKS.ETHEREUM_SEPOLIA.chainName,
                  nativeCurrency: NETWORKS.ETHEREUM_SEPOLIA.nativeCurrency,
                  rpcUrls: NETWORKS.ETHEREUM_SEPOLIA.rpcUrls,
                  blockExplorerUrls: NETWORKS.ETHEREUM_SEPOLIA.blockExplorerUrls,
                }],
              });
              
              // After adding, try to switch again
              const chainId = getChainIdByName(newFromChain);
              if (chainId) {
                await switchChain({ chainId });
                setFromChain(newFromChain);
              }
            }
          } catch (addError) {
            console.error('Failed to add network:', addError);
          }
        }
        // The local state is already updated, so we don't need to revert it
      }
    }
  };

  // Updated function to handle network selection with auto-switch
  const handleNetworkChange = async (newChain) => {
    if (!isConnected) {
      // If not connected, just update the local state
      setFromChain(newChain);
      return;
    }

    try {
      // Get the chain ID for the new chain
      const chainId = getChainIdByName(newChain);
      
      if (chainId) {
        // Trigger wallet network switch
        await switchChain({ chainId });
        
        // Update local state (will be confirmed by the useEffect above)
        setFromChain(newChain);
      }
    } catch (error) {
      console.error('Failed to switch network:', error);
      
      // Handle the case where the chain needs to be added to the wallet (Error 4902)
      if ((error?.code === 4902 || error?.message?.includes('wallet_addEthereumChain')) && window.ethereum) {
        try {
          // Add Arc Testnet to the wallet
          if (newChain === 'Arc Testnet') {
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [{
                chainId: NETWORKS.ARC_TESTNET.chainId,
                chainName: NETWORKS.ARC_TESTNET.chainName,
                nativeCurrency: NETWORKS.ARC_TESTNET.nativeCurrency,
                rpcUrls: NETWORKS.ARC_TESTNET.rpcUrls,
                blockExplorerUrls: NETWORKS.ARC_TESTNET.blockExplorerUrls,
              }],
            });
            
            // After adding, try to switch again
            const chainId = getChainIdByName(newChain);
            if (chainId) {
              await switchChain({ chainId });
              setFromChain(newChain);
            }
          } else if (newChain === 'Sepolia') {
            // For Sepolia, just try to add it
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [{
                chainId: NETWORKS.ETHEREUM_SEPOLIA.chainId,
                chainName: NETWORKS.ETHEREUM_SEPOLIA.chainName,
                nativeCurrency: NETWORKS.ETHEREUM_SEPOLIA.nativeCurrency,
                rpcUrls: NETWORKS.ETHEREUM_SEPOLIA.rpcUrls,
                blockExplorerUrls: NETWORKS.ETHEREUM_SEPOLIA.blockExplorerUrls,
              }],
            });
            
            // After adding, try to switch again
            const chainId = getChainIdByName(newChain);
            if (chainId) {
              await switchChain({ chainId });
              setFromChain(newChain);
            }
          }
        } catch (addError) {
          console.error('Failed to add network:', addError);
        }
      }
      
      // Even if switching fails, update the local state for UI consistency
      setFromChain(newChain);
    }
  };

  // New function to handle 'To' network changes with auto-switch
  const handleToNetworkChange = async (newChain) => {
    if (!isConnected) {
      // If not connected, just update the local state
      setToChain(newChain);
      return;
    }

    try {
      // Get the chain ID for the new chain
      const chainId = getChainIdByName(newChain);
      
      if (chainId) {
        // Trigger wallet network switch
        await switchChain({ chainId });
        
        // Update local state (will be confirmed by the useEffect above)
        setToChain(newChain);
      }
    } catch (error) {
      console.error('Failed to switch network:', error);
      
      // Handle the case where the chain needs to be added to the wallet (Error 4902)
      if ((error?.code === 4902 || error?.message?.includes('wallet_addEthereumChain')) && window.ethereum) {
        try {
          // Add Arc Testnet to the wallet
          if (newChain === 'Arc Testnet') {
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [{
                chainId: NETWORKS.ARC_TESTNET.chainId,
                chainName: NETWORKS.ARC_TESTNET.chainName,
                nativeCurrency: NETWORKS.ARC_TESTNET.nativeCurrency,
                rpcUrls: NETWORKS.ARC_TESTNET.rpcUrls,
                blockExplorerUrls: NETWORKS.ARC_TESTNET.blockExplorerUrls,
              }],
            });
            
            // After adding, try to switch again
            const chainId = getChainIdByName(newChain);
            if (chainId) {
              await switchChain({ chainId });
              setToChain(newChain);
            }
          } else if (newChain === 'Sepolia') {
            // For Sepolia, just try to add it
            await window.ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [{
                chainId: NETWORKS.ETHEREUM_SEPOLIA.chainId,
                chainName: NETWORKS.ETHEREUM_SEPOLIA.chainName,
                nativeCurrency: NETWORKS.ETHEREUM_SEPOLIA.nativeCurrency,
                rpcUrls: NETWORKS.ETHEREUM_SEPOLIA.rpcUrls,
                blockExplorerUrls: NETWORKS.ETHEREUM_SEPOLIA.blockExplorerUrls,
              }],
            });
            
            // After adding, try to switch again
            const chainId = getChainIdByName(newChain);
            if (chainId) {
              await switchChain({ chainId });
              setToChain(newChain);
            }
          }
        } catch (addError) {
          console.error('Failed to add network:', addError);
        }
      }
      
      // Even if switching fails, update the local state for UI consistency
      setToChain(newChain);
    }
  };

  const handleBridge = async () => {
    if (!isConnected) {
      alert('Please connect your wallet first');
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    setBridgeLoading(true);
    // Call the bridgeUSDC function from the hook with the specified amount
    await bridgeUSDC(amount);
    setBridgeLoading(false);
    // alert('Transaction submitted' + '\nEstimated arrival: 2-5 minutes');
    setAmount('');
  };

  const ChainSelector = ({ isOpen, onClose, selectedChain, onSelect, exclude, triggerRef }) => {
    const selectorRef = useRef(null);
    
    // Handle ESC key press to close modal
    useEffect(() => {
      const handleEsc = (event) => {
        if (event.keyCode === 27) {
          onClose();
        }
      };
      
      if (isOpen) {
        document.addEventListener('keydown', handleEsc);
      }
      
      return () => {
        document.removeEventListener('keydown', handleEsc);
      };
    }, [isOpen, onClose]);
    
    if (!isOpen) return null;

    const chainList = ['Arc Testnet', 'Sepolia'];

    return (
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            className="fixed inset-0 z-50 flex items-center justify-center p-2 md:p-4 bg-black bg-opacity-50"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              ref={selectorRef}
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-4 md:p-6 w-full max-w-md flex flex-col max-h-[80vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside modal
            >
              <div className="flex justify-between items-center mb-3 md:mb-4 flex-shrink-0">
                <h3 className="text-lg md:text-xl font-bold">{t('Select Network')}</h3>
                <button 
                  onClick={onClose}
                  className="p-1 md:p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto -mx-2 md:-mx-6 px-2 md:px-6">
                {/* Chain List */}
                <div className="space-y-1 md:space-y-2">
                  {chainList.map((chain) => (
                    <button
                      key={chain}
                      onClick={() => {
                        onSelect(chain);
                        onClose();
                      }}
                      className={`w-full p-2 md:p-4 rounded-lg flex items-center justify-between transition-all duration-200
                        ${chain === selectedChain ? 'bg-primary-50 dark:bg-primary-900/20 border-2 border-primary-500' : 'border-2 border-transparent hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                    >
                      <div className="flex items-center space-x-2 md:space-x-3">
                        <div className="w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center">
                          {chain.includes('Arc') ? (
                            <img 
                              src="/icons/Arc.png" 
                              alt="Arc Testnet" 
                              className="w-8 h-8 md:w-10 md:h-10 rounded-full object-contain"
                            />
                          ) : (
                            <img 
                              src="/icons/eth.png" 
                              alt="Sepolia" 
                              className="w-8 h-8 md:w-10 md:h-10 rounded-full object-contain"
                            />
                          )}
                        </div>
                        <div className="text-left">
                          <p className="font-semibold text-sm md:text-base">{chain}</p>
                          <p className="text-xs text-gray-500">{t('Testnet')}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  };

  return (
    <div className="max-w-lg mx-auto w-full">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card p-4 md:p-8"
      >
        <div className="flex items-center justify-between mb-4 md:mb-6">
          <h2 className="text-xl md:text-2xl font-bold">{t('Bridge Assets')}</h2>
        </div>
      
        {/* Info Banner */}
        <div className="mb-4 md:mb-6 p-3 md:p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg flex items-start space-x-2 md:space-x-3">
          <Info className="text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" size={16} />
          <div className="text-[10px] md:text-sm text-blue-600 dark:text-blue-400">
            <p className="font-semibold mb-1">{t('Cross-Chain Bridging')}</p>
            <p>{t('Transfer assets securely between Sepolia and Arc Testnet. Estimated time: 2-5 minutes.')}</p>
          </div>
        </div>

        {/* From Chain */}
        <div className="mb-2 md:mb-2">
          <label className="block text-sm font-medium mb-1 md:mb-2">{t('From')}</label>
          <button
            ref={fromChainTriggerRef}
            onClick={() => setShowChainSelector('from')}
            className="w-full p-3 md:p-4 bg-white dark:bg-gray-800 rounded-2xl flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 shadow-sm hover:shadow-md border border-gray-200 dark:border-gray-700"
          >
            <div className="flex items-center space-x-2 md:space-x-3">
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center">
                {fromChain.includes('Arc') ? (
                  <img 
                    src="/icons/Arc.png" 
                    alt="Arc Testnet" 
                    className="w-8 h-8 md:w-10 md:h-10 rounded-full object-contain"
                  />
                ) : (
                  <img 
                    src="/icons/eth.png" 
                    alt={fromChain} 
                    className="w-8 h-8 md:w-10 md:h-10 rounded-full object-contain"
                  />
                )}
              </div>
              <div className="text-left">
                <p className="font-bold text-sm md:text-base">{fromChain}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{t('Source Network')}</p>
              </div>
            </div>
            <ChevronDown size={16} />
          </button>
        </div>

        {/* Switch Button */}
        <div className="flex justify-center my-4 md:my-6 relative z-10">
          <button
            onClick={handleSwitchChains}
            className="switch-button p-3 md:p-4 bg-white dark:bg-gray-800 border-4 border-gray-100 dark:border-gray-900 rounded-2xl hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:border-primary-200 dark:hover:border-primary-800 transition-all duration-200 shadow-xl hover:shadow-2xl hover:scale-110 group"
            title="Switch Chains"
          >
            <ArrowLeftRight size={20} className="group-hover:rotate-180 transition-transform duration-300" />
          </button>
        </div>

        {/* To Chain */}
        <div className="mb-4 md:mb-6">
          <label className="block text-sm font-medium mb-1 md:mb-2">{t('To')}</label>
          <button
            ref={toChainTriggerRef}
            onClick={() => setShowChainSelector('to')}
            className="w-full p-3 md:p-4 bg-white dark:bg-gray-800 rounded-2xl flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 shadow-sm hover:shadow-md border border-gray-200 dark:border-gray-700"
          >
            <div className="flex items-center space-x-2 md:space-x-3">
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center">
                {toChain.includes('Arc') ? (
                  <img 
                    src="/icons/Arc.png" 
                    alt="Arc Testnet" 
                    className="w-8 h-8 md:w-10 md:h-10 rounded-full object-contain"
                  />
                ) : (
                  <img 
                    src="/icons/eth.png" 
                    alt={toChain} 
                    className="w-8 h-8 md:w-10 md:h-10 rounded-full object-contain"
                  />
                )}
              </div>
              <div className="text-left">
                <p className="font-bold text-sm md:text-base">{toChain}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{t('Destination Network')}</p>
              </div>
            </div>
            <ChevronDown size={16} />
          </button>
        </div>

        {/* Token Selection */}
        <div className="mb-3 md:mb-4">
          <label className="block text-sm font-medium mb-1 md:mb-2">{t('Asset')}</label>
          <div className="p-3 md:p-4 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm transition-all duration-200 flex flex-col relative">
            <div className="flex items-center justify-between gap-2 w-full">
              <div className="relative flex-1">
                <input
                  type="text"
                  inputMode="decimal"
                  value={amount}
                  onChange={(e) => setAmount(sanitizeInput(e.target.value))}
                  placeholder="0.0"
                  className="text-2xl md:text-3xl font-semibold bg-transparent outline-none placeholder-gray-400 dark:placeholder-gray-500 text-gray-900 dark:text-white w-full pr-16"
                />

              </div>
              {/* Static USDC Token Display - Removed dropdown functionality */}
              <div className="flex items-center space-x-2 px-2 py-1 md:px-3 md:py-2 bg-white dark:bg-gray-800 rounded-xl shadow-sm self-end min-w-[100px] md:min-w-[120px] w-auto flex-shrink-0">
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center">
                  <img 
                    src="/icons/usdc.png" 
                    alt="USDC" 
                    className="w-8 h-8 md:w-10 md:h-10 rounded-full object-contain"
                  />
                </div>
                <div className="text-left min-w-0">
                  <p className="font-bold text-sm md:text-base truncate">USDC</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{t('USD Coin')}</p>
                </div>
              </div>
            </div>
            {isConnected && (
              <div className="flex items-center justify-end mt-1 md:mt-2">
                <div className="flex items-center space-x-1 md:space-x-2">
                  <span className="text-xs text-gray-500 dark:text-gray-400">{t('Balance')}:</span>
                  <span className="text-xs md:text-sm font-semibold">
                    {loading ? (
                      <Loader className="animate-spin" size={12} />
                    ) : (
                      `${balance || '0.00'} USDC`
                    )}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Bridge Details */}
        {amount && parseFloat(amount) > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            className="mb-4 md:mb-6 p-3 md:p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg space-y-1 md:space-y-2 text-xs md:text-sm"
          >
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">{t('Estimated Time')}</span>
              <span className="font-semibold">2-5 minutes</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">{t('Bridge Fee')}</span>
              <span className="font-semibold">0.1% ({(parseFloat(amount) * 0.001).toFixed(4)} USDC)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">{t('Gas Fee')}</span>
              <span className="font-semibold">~$0.50 USDC</span>
            </div>
            <div className="flex justify-between pt-1 md:pt-2 border-t border-gray-300 dark:border-gray-600">
              <span className="text-gray-600 dark:text-gray-400">{t('You Will Receive')}</span>
              <span className="font-bold">{(parseFloat(amount) * 0.999).toFixed(4)} USDC</span>
            </div>
          </motion.div>
        )}

        {/* Security Notice */}
        <div className="mb-4 md:mb-6 p-2 md:p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg flex items-start space-x-1 md:space-x-2">
          <AlertCircle className="text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" size={14} />
          <p className="text-[10px] md:text-xs text-yellow-700 dark:text-yellow-300">
            {t('Cross-chain transfers are irreversible. Please verify all details before confirming the transaction.')}
          </p>
        </div>

        {/* Bridge Button */}
        <button
          onClick={handleBridge}
          disabled={!amount || bridgeLoading || !isConnected || status === 'loading'}
          className="w-full btn-primary py-3 md:py-5 text-base md:text-xl font-bold flex items-center justify-center space-x-2 rounded-2xl shadow-xl hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-xl"
        >
          {bridgeLoading || status === 'loading' ? (
            <>
              <Loader className="animate-spin" size={20} />
              <span className="text-sm md:text-base">Bridging</span>
            </>
          ) : !isConnected ? (
            <>
              <Wallet size={20} />
              <span className="text-sm md:text-base">{t('Connect Wallet')}</span>
            </>
          ) : (
            <>
              <span className="text-sm md:text-base">{t('Bridge')}</span>
            </>
          )}
        </button>
        
        {/* Logs Display - Unobtrusive debugging information */}
        {logs.length > 0 && (
          <div className="mt-3 md:mt-4 p-2 md:p-3 bg-gray-100 dark:bg-gray-700 rounded-lg text-[10px] md:text-xs text-gray-700 dark:text-gray-300 max-h-24 md:max-h-32 overflow-y-auto">
            <h4 className="font-semibold mb-1">Bridge Logs:</h4>
            {logs.map((log, index) => (
              <div key={index} className="mb-1 last:mb-0">{log}</div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Chain Selectors */}
      <ChainSelector
        isOpen={showChainSelector === 'from'}
        onClose={() => setShowChainSelector(null)}
        selectedChain={fromChain}
        onSelect={handleNetworkChange}
        exclude={toChain}
        triggerRef={showChainSelector === 'from' ? fromChainTriggerRef : toChainTriggerRef}
      />
      <ChainSelector
        isOpen={showChainSelector === 'to'}
        onClose={() => setShowChainSelector(null)}
        selectedChain={toChain}
        onSelect={handleToNetworkChange}
        exclude={fromChain}
        triggerRef={showChainSelector === 'to' ? toChainTriggerRef : fromChainTriggerRef}
      />
    </div>
  );
};

export default Bridge;