import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useWallet } from '../contexts/WalletContext';
import { ArrowLeftRight, ChevronDown, Loader, AlertCircle, Info, Wallet, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { NETWORKS, TOKENS } from '../config/networks';
import { sanitizeInput } from '../utils/blockchain';


const Bridge = () => {
  const { t } = useTranslation();
  const { isConnected, chainId } = useWallet();
  const [fromChain, setFromChain] = useState('Sepolia');
  const [toChain, setToChain] = useState('Arc Testnet');
  const [selectedToken, setSelectedToken] = useState('ETH');
  const [amount, setAmount] = useState('');
  const [bridgeLoading, setBridgeLoading] = useState(false);
  const [showChainSelector, setShowChainSelector] = useState(null);
  const [showTokenSelector, setShowTokenSelector] = useState(false);
  
  // Refs for trigger buttons
  const fromChainTriggerRef = useRef(null);
  const toChainTriggerRef = useRef(null);
  const tokenSelectorTriggerRef = useRef(null);
  
  // Effect to handle body overflow when modals are open
  useEffect(() => {
    const isModalOpen = showChainSelector || showTokenSelector;
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
  }, [showChainSelector, showTokenSelector]);

  const chains = ['Sepolia', 'Arc Testnet'];
  const bridgeTokens = ['ETH', 'USDC', 'EURC'];

  const handleSwitchChains = () => {
    setFromChain(toChain);
    setToChain(fromChain);
  };

  const handleBridge = async () => {
    if (!isConnected) {
      alert(t('connectWalletFirst'));
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    setBridgeLoading(true);
    // Simulate bridge transaction
    setTimeout(() => {
      setBridgeLoading(false);
      alert(t('transactionSubmitted') + '\nEstimated arrival: 2-5 minutes');
      setAmount('');
    }, 2000);
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
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50"
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
              className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 w-full max-w-md flex flex-col max-h-[80vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside modal
            >
              <div className="flex justify-between items-center mb-4 flex-shrink-0">
                <h3 className="text-xl font-bold">{t('selectNetwork')}</h3>
                <button 
                  onClick={onClose}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto -mx-6 px-6">
                {/* Chain List */}
                <div className="space-y-2">
                  {chainList.map((chain) => (
                    <button
                      key={chain}
                      onClick={() => {
                        if (chain !== exclude) {
                          onSelect(chain);
                          onClose();
                        }
                      }}
                      disabled={chain === exclude}
                      className={`w-full p-4 rounded-lg flex items-center justify-between transition-all duration-200
                        ${chain === selectedChain ? 'bg-primary-50 dark:bg-primary-900/20 border-2 border-primary-500' : 'border-2 border-transparent hover:bg-gray-100 dark:hover:bg-gray-700'}
                        ${chain === exclude ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center">
                          {chain.includes('Arc') ? (
                            <img 
                              src="/icons/Arc.png" 
                              alt="Arc Testnet" 
                              className="w-10 h-10 rounded-full object-contain"
                            />
                          ) : (
                            <img 
                              src="/icons/eth.png" 
                              alt="Sepolia" 
                              className="w-10 h-10 rounded-full object-contain"
                            />
                          )}
                        </div>
                        <div className="text-left">
                          <p className="font-semibold">{chain}</p>
                          <p className="text-xs text-gray-500">Testnet</p>
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

  const TokenSelector = ({ isOpen, onClose, selectedToken, onSelect, triggerRef }) => {
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

    return (
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50"
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
              className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 w-full max-w-md flex flex-col max-h-[80vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside modal
            >
              <div className="flex justify-between items-center mb-4 flex-shrink-0">
                <h3 className="text-xl font-bold">{t('selectToken')}</h3>
                <button 
                  onClick={onClose}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto -mx-6 px-6">
                {/* Token List */}
                <div className="space-y-2">
                  {bridgeTokens.map((token) => (
                    <button
                      key={token}
                      onClick={() => {
                        onSelect(token);
                        onClose();
                      }}
                      className={`w-full p-4 rounded-lg flex items-center justify-between transition-all duration-200
                        ${token === selectedToken ? 'bg-primary-50 dark:bg-primary-900/20 border-2 border-primary-500' : 'border-2 border-transparent hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center">
                          {token === 'ETH' ? (
                            <img 
                              src="/icons/eth.png" 
                              alt="ETH" 
                              className="w-10 h-10 rounded-full object-contain"
                            />
                          ) : token === 'USDC' ? (
                            <img 
                              src="/icons/usdc.png" 
                              alt="USDC" 
                              className="w-10 h-10 rounded-full object-contain"
                            />
                          ) : token === 'EURC' ? (
                            <img 
                              src="/icons/eurc.png" 
                              alt="EURC" 
                              className="w-10 h-10 rounded-full object-contain"
                            />
                          ) : (
                            <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                              <span className="text-xl">{token.charAt(0)}</span>
                            </div>
                          )}
                        </div>
                        <div className="text-left">
                          <p className="font-semibold">{token}</p>
                          <p className="text-xs text-gray-500">{TOKENS[token]?.name || token}</p>
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
  <div className="max-w-lg mx-auto">
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="card"
    >
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold">{t('bridgeAssets')}</h2>
        </div>
      

      {/* Info Banner */}
      <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg flex items-start space-x-3">
        <Info className="text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" size={20} />
        <div className="text-sm text-blue-600 dark:text-blue-400">
          <p className="font-semibold mb-1">{t('crossChainBridging')}</p>
          <p>{t('bridgeInfoDescription')}</p>
        </div>
      </div>

      {/* From Chain */}
      <div className="mb-2">
        <label className="block text-sm font-medium mb-2">From</label>
        <button
          ref={fromChainTriggerRef}
          onClick={() => setShowChainSelector('from')}
          className="w-full p-4 bg-white dark:bg-gray-800 rounded-2xl flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 shadow-sm hover:shadow-md border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center">
              {fromChain.includes('Arc') ? (
                <img 
                  src="/icons/Arc.png" 
                  alt="Arc Testnet" 
                  className="w-10 h-10 rounded-full object-contain"
                />
              ) : (
                <img 
                  src="/icons/eth.png" 
                  alt={fromChain} 
                  className="w-10 h-10 rounded-full object-contain"
                />
              )}
            </div>
            <div className="text-left">
              <p className="font-bold text-base">{fromChain}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{t('sourceNetwork')}</p>
            </div>
          </div>
          <ChevronDown size={16} />
        </button>
      </div>

      {/* Switch Button */}
      <div className="flex justify-center my-6 relative z-10">
        <button
          onClick={handleSwitchChains}
          className="switch-button p-4 bg-white dark:bg-gray-800 border-4 border-gray-100 dark:border-gray-900 rounded-2xl hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:border-primary-200 dark:hover:border-primary-800 transition-all duration-200 shadow-xl hover:shadow-2xl hover:scale-110 group"
          title={t('switchChains')}
        >
          <ArrowLeftRight size={24} className="group-hover:rotate-180 transition-transform duration-300" />
        </button>
      </div>

      {/* To Chain */}
      <div className="mb-6">
        <label className="block text-sm font-medium mb-2">To</label>
        <button
          ref={toChainTriggerRef}
          onClick={() => setShowChainSelector('to')}
          className="w-full p-4 bg-white dark:bg-gray-800 rounded-2xl flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 shadow-sm hover:shadow-md border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full flex items-center justify-center">
              {toChain.includes('Arc') ? (
                <img 
                  src="/icons/Arc.png" 
                  alt="Arc Testnet" 
                  className="w-10 h-10 rounded-full object-contain"
                />
              ) : (
                <img 
                  src="/icons/eth.png" 
                  alt={toChain} 
                  className="w-10 h-10 rounded-full object-contain"
                />
              )}
            </div>
            <div className="text-left">
              <p className="font-bold text-base">{toChain}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{t('destinationNetwork')}</p>
            </div>
          </div>
          <ChevronDown size={16} />
        </button>
      </div>

      {/* Token Selection */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">Asset</label>
        <div className="p-4 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm transition-all duration-200 flex flex-col relative">
          <div className="flex items-center justify-between gap-2 w-full">
            <div className="relative flex-1">
              <input
                type="text"
                value={amount}
                onChange={(e) => setAmount(sanitizeInput(e.target.value))}
                placeholder="0.0"
                className="text-3xl font-semibold bg-transparent outline-none placeholder-gray-400 dark:placeholder-gray-500 text-gray-900 dark:text-white w-full pr-16"
              />

            </div>
            <button
              ref={tokenSelectorTriggerRef}
              onClick={() => setShowTokenSelector(true)}
              className="flex items-center space-x-2 px-3 py-2 bg-white dark:bg-gray-800 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 shadow-sm hover:shadow-md self-end min-w-[120px] w-auto flex-shrink-0"
            >
              <div className="w-10 h-10 rounded-full flex items-center justify-center">
                {selectedToken === 'ETH' ? (
                  <img 
                    src="/icons/eth.png" 
                    alt={selectedToken} 
                    className="w-10 h-10 rounded-full object-contain"
                  />
                ) : selectedToken === 'USDC' ? (
                  <img 
                    src="/icons/usdc.png" 
                    alt={selectedToken} 
                    className="w-10 h-10 rounded-full object-contain"
                  />
                ) : selectedToken === 'EURC' ? (
                  <img 
                    src="/icons/eurc.png" 
                    alt={selectedToken} 
                    className="w-10 h-10 rounded-full object-contain"
                  />
                ) : (
                  <div className="w-10 h-10 bg-white dark:bg-gray-700 rounded-full flex items-center justify-center text-xl">
                    {selectedToken}
                  </div>
                )}
              </div>
              <div className="text-left min-w-0">
                <p className="font-bold text-base truncate">{selectedToken}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{TOKENS[selectedToken]?.name || selectedToken}</p>
              </div>
              <ChevronDown size={16} />
            </button>
          </div>
          {isConnected && (
            <div className="flex items-center justify-end mt-2">
              <div className="flex items-center space-x-2">
                <span className="text-xs text-gray-500 dark:text-gray-400">Bal:</span>
                <span className="text-sm font-semibold">{selectedToken}</span>
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
          className="mb-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg space-y-2 text-sm"
        >
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">{t('estimatedTime')}</span>
            <span className="font-semibold">2-5 minutes</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">{t('bridgeFee')}</span>
            <span className="font-semibold">0.1% ({(parseFloat(amount) * 0.001).toFixed(4)} {selectedToken})</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600 dark:text-gray-400">{t('gasFee')}</span>
            <span className="font-semibold">~$0.50 USDC</span>
          </div>
          <div className="flex justify-between pt-2 border-t border-gray-300 dark:border-gray-600">
            <span className="text-gray-600 dark:text-gray-400">{t('youWillReceive')}</span>
            <span className="font-bold">{(parseFloat(amount) * 0.999).toFixed(4)} {selectedToken}</span>
          </div>
        </motion.div>
      )}

      {/* Security Notice */}
      <div className="mb-6 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg flex items-start space-x-2">
        <AlertCircle className="text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" size={16} />
        <p className="text-xs text-yellow-700 dark:text-yellow-300">
          {t('securityNotice')}
        </p>
      </div>

      {/* Bridge Button */}
      <button
        onClick={handleBridge}
        disabled={!amount || bridgeLoading || !isConnected}
        className="w-full btn-primary py-5 text-xl font-bold flex items-center justify-center space-x-2 rounded-2xl shadow-xl hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-xl"
      >
        {bridgeLoading ? (
          <>
            <Loader className="animate-spin" size={24} />
            <span>{t('bridging')}</span>
          </>
        ) : !isConnected ? (
          <>
            <Wallet size={24} />
            <span>{t('connectWallet')}</span>
          </>
        ) : (
          <>
            <span> {t('bridge')}</span>
          </>
        )}
      </button>
    </motion.div>

    {/* Chain Selectors */}
    <ChainSelector
      isOpen={showChainSelector === 'from'}
      onClose={() => setShowChainSelector(null)}
      selectedChain={fromChain}
      onSelect={setFromChain}
      exclude={toChain}
      triggerRef={showChainSelector === 'from' ? fromChainTriggerRef : toChainTriggerRef}
    />
    <ChainSelector
      isOpen={showChainSelector === 'to'}
      onClose={() => setShowChainSelector(null)}
      selectedChain={toChain}
      onSelect={setToChain}
      exclude={fromChain}
      triggerRef={showChainSelector === 'to' ? toChainTriggerRef : fromChainTriggerRef}
    />
    <TokenSelector
      isOpen={showTokenSelector}
      onClose={() => setShowTokenSelector(false)}
      selectedToken={selectedToken}
      onSelect={setSelectedToken}
      triggerRef={tokenSelectorTriggerRef}
    />
  </div>
);
};

export default Bridge;