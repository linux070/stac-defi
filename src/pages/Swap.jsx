import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useWallet } from '../contexts/WalletContext';
import { ArrowDownUp, Settings, ChevronDown, ChevronUp, Info, Loader, Wallet, AlertTriangle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { TOKENS, TOKEN_PRICES } from '../config/networks';
import { sanitizeInput, calculateSwapQuote, validateAmount, validateSlippage, getFilteredTokens } from '../utils/blockchain';
import useTokenBalance from '../hooks/useTokenBalance';
import Toast from '../components/Toast';

const Swap = () => {
  const { t } = useTranslation();
  const { isConnected, balance, chainId } = useWallet();
  const [fromToken, setFromToken] = useState('USDC');
  const [toToken, setToToken] = useState('EURC');
  const [fromAmount, setFromAmount] = useState('');
  const [toAmount, setToAmount] = useState('');
  const [slippage, setSlippage] = useState(0.5);
  const [customSlippage, setCustomSlippage] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [showFromSelector, setShowFromSelector] = useState(false);
  const [showToSelector, setShowToSelector] = useState(false);
  const [showSwapDetails, setShowSwapDetails] = useState(false);
  const [swapQuote, setSwapQuote] = useState(null);
  const [swapLoading, setSwapLoading] = useState(false);
  const [validationError, setValidationError] = useState('');
  const [slippageWarning, setSlippageWarning] = useState('');
  const [toast, setToast] = useState({ visible: false, type: 'info', message: '' });

  // Refs for trigger buttons
  const fromTokenTriggerRef = useRef(null);
  const toTokenTriggerRef = useRef(null);
  
  // Effect to handle body overflow when modals are open
  useEffect(() => {
    const isModalOpen = showFromSelector || showToSelector;
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
  }, [showFromSelector, showToSelector]);

  // Real-time token balances
  const { balance: fromBalance, loading: fromLoading, refetch: refetchFrom } = useTokenBalance(fromToken);
  const { balance: toBalance, loading: toLoading, refetch: refetchTo } = useTokenBalance(toToken);

  const tokenList = useMemo(() => {
    const allTokens = Object.values(TOKENS);
    return getFilteredTokens(allTokens, chainId);
  }, [chainId]);

  // Reset selected tokens when network changes to ARC or Sepolia and ETH was selected
  useEffect(() => {
    const networksExcludingETH = [
      '0xCF4B1', // ARC Testnet
      '0xaa36a7' // Sepolia
    ];
    
    if (networksExcludingETH.includes(chainId)) {
      // Reset fromToken if it's ETH
      if (fromToken === 'ETH') {
        setFromToken('USDC');
      }
      
      // Reset toToken if it's ETH
      if (toToken === 'ETH') {
        setToToken('USDC');
      }
    }
  }, [chainId, fromToken, toToken]);

  // Validate slippage when it changes
  useEffect(() => {
    try {
      const result = validateSlippage(slippage);
      setSlippageWarning(result.warning || '');
    } catch (err) {
      setSlippageWarning(err.message);
    }
  }, [slippage]);

  // Calculate swap quote when amount changes
  useEffect(() => {
    setValidationError('');
    
    if (fromAmount && parseFloat(fromAmount) > 0) {
      try {
        // Validate amount
        validateAmount(fromAmount, fromBalance);
        
        const quote = calculateSwapQuote(fromToken, toToken, fromAmount, slippage);
        setSwapQuote(quote);
        if (quote) {
          setToAmount(quote.expectedOutput);
          setShowSwapDetails(true);
        }
      } catch (err) {
        setValidationError(err.message);
        setSwapQuote(null);
        setToAmount('');
        setShowSwapDetails(false);
      }
    } else {
      setSwapQuote(null);
      setToAmount('');
      setShowSwapDetails(false);
    }
  }, [fromAmount, fromToken, toToken, slippage, fromBalance]);

  const handleSwitch = () => {
    // Add animation class for smooth transition
    const switchButton = document.querySelector('.switch-button');
    if (switchButton) {
      switchButton.classList.add('rotate-180');
      setTimeout(() => {
        switchButton.classList.remove('rotate-180');
      }, 300);
    }
    
    // Swap tokens
    setFromToken(toToken);
    setToToken(fromToken);
    
    // Preserve amounts if possible
    setFromAmount(toAmount);
    setToAmount(fromAmount);
  };

  const handleMaxClick = () => {
    if (!fromBalance || parseFloat(fromBalance) === 0) {
      setToast({ visible: true, type: 'warning', message: 'No balance available' });
      setTimeout(() => setToast({ visible: false, type: 'info', message: '' }), 3000);
      return;
    }
    
    // For all tokens (including ETH when available), use full balance
    setFromAmount(fromBalance);
  };

  const handleSwap = async () => {
    if (!isConnected) {
      setToast({ visible: true, type: 'error', message: t('connectWalletFirst') });
      setTimeout(() => setToast({ visible: false, type: 'info', message: '' }), 3000);
      return;
    }

    if (validationError) {
      setToast({ visible: true, type: 'error', message: validationError });
      setTimeout(() => setToast({ visible: false, type: 'info', message: '' }), 3000);
      return;
    }

    // Check if token approval is needed
    setSwapLoading(true);
    try {
      // In a real implementation, you would get the provider and signer from the wallet context
      // const provider = new ethers.providers.Web3Provider(window.ethereum);
      // const signer = provider.getSigner();
      
      // For demo purposes, we'll simulate the approval process
      setToast({ visible: true, type: 'info', message: t('approvalRequired') });
      setTimeout(() => setToast({ visible: false, type: 'info', message: '' }), 3000);
      
      // Simulate approval process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setToast({ visible: true, type: 'success', message: t('approvalCompleted') });
      setTimeout(() => setToast({ visible: false, type: 'info', message: '' }), 3000);
    } catch (err) {
      setToast({ visible: true, type: 'error', message: err.message });
      setTimeout(() => setToast({ visible: false, type: 'info', message: '' }), 5000);
      setSwapLoading(false);
      return;
    }

    setSwapLoading(true);
    try {
      // In a real implementation, you would execute the swap using our contract functions
      // const provider = new ethers.providers.Web3Provider(window.ethereum);
      // const signer = provider.getSigner();
      // 
      // const amounts = await getAmountsOut(
      //   SWAP_CONTRACT_ADDRESS,
      //   ethers.utils.parseUnits(fromAmount, TOKENS[fromToken].decimals),
      //   [TOKENS[fromToken].address, TOKENS[toToken].address],
      //   provider
      // );
      // 
      // const tx = await swapExactTokensForTokens(
      //   SWAP_CONTRACT_ADDRESS,
      //   ethers.utils.parseUnits(fromAmount, TOKENS[fromToken].decimals),
      //   amounts[1].mul(100 - slippage).div(100), // minAmountOut with slippage
      //   [TOKENS[fromToken].address, TOKENS[toToken].address],
      //   signer.getAddress(),
      //   Math.floor(Date.now() / 1000) + 60 * 10, // 10 minutes deadline
      //   provider,
      //   signer
      // );
      
      // Simulate swap transaction
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setToast({ visible: true, type: 'success', message: t('transactionSubmitted') });
      setTimeout(() => setToast({ visible: false, type: 'info', message: '' }), 5000);
      
      // Reset form after successful swap
      setFromAmount('');
      setToAmount('');
      setSwapQuote(null);
      setShowSwapDetails(false);
      
      // Refresh balances
      refetchFrom();
      refetchTo();
    } catch (err) {
      setToast({ visible: true, type: 'error', message: err.message });
      setTimeout(() => setToast({ visible: false, type: 'info', message: '' }), 5000);
    } finally {
      setSwapLoading(false);
    }
  };

  const SlippageTolerance = () => {
    const [isCustomFocused, setIsCustomFocused] = useState(false);
    
    // Determine the text color based on slippage value for validation feedback
    const getSlippageTextColor = () => {
      if (slippage > 5) return 'text-red-500';
      if (slippage > 1) return 'text-yellow-500';
      return 'text-gray-900 dark:text-white';
    };
    
    return (
      <div>
        <label className="block text-sm font-medium mb-2">{t('Slippage Tolerance')}</label>
        <div className="grid grid-cols-4 gap-2">
          {[0.1, 0.5, 1.0].map((value) => (
            <button
              key={value}
              onClick={() => {
                setSlippage(value);
                setCustomSlippage('');
              }}
              className={`py-3 rounded-lg font-medium transition-all duration-200 flex items-center justify-center
                ${slippage === value 
                  ? 'bg-blue-500 text-white shadow-md' 
                  : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'}`}
            >
              {value}%
            </button>
          ))}
          <div className="relative">
            <input
              type="text"
              placeholder="0.0"
              value={customSlippage}
              onChange={(e) => {
                const val = sanitizeInput(e.target.value);
                setCustomSlippage(val);
                if (val && !isNaN(parseFloat(val))) {
                  setSlippage(parseFloat(val));
                }
              }}
              onFocus={() => setIsCustomFocused(true)}
              onBlur={() => setIsCustomFocused(false)}
              className={`w-full h-full py-3 pl-3 pr-8 rounded-lg font-medium bg-gray-100 dark:bg-gray-800 focus:outline-none ${
                isCustomFocused ? 'ring-2 ring-blue-500' : ''
              } ${getSlippageTextColor()}`}
            />
            <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 pointer-events-none">%</span>
          </div>
        </div>
        {slippageWarning && (
          <div className="mt-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded flex items-start space-x-2">
            <AlertTriangle size={16} className="text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-yellow-700 dark:text-yellow-300">{slippageWarning}</p>
          </div>
        )}
      </div>
    );
  };

  const TokenSelector = ({ isOpen, onClose, selectedToken, onSelect, exclude, triggerRef }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const selectorRef = useRef(null);
    
    // Filter tokens based on search query
    const filteredTokens = useMemo(() => {
      if (!searchQuery) return tokenList;
      
      const query = searchQuery.toLowerCase();
      return tokenList.filter(token => 
        token.symbol.toLowerCase().includes(query) || 
        token.name.toLowerCase().includes(query) ||
        (token.address && typeof token.address === 'string' && token.address.toLowerCase().includes(query)) ||
        (token.address && typeof token.address === 'object' && 
          Object.values(token.address).some(addr => addr.toLowerCase().includes(query)))
      );
    }, [searchQuery, tokenList]);
    
    // Popular tokens for quick selection.
    const popularTokens = useMemo(() => {
      return tokenList.filter(token => ['USDC', 'EURC'].includes(token.symbol));
    }, [tokenList]);
    
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
                <h3 className="text-xl font-bold">{t('Select Token')}</h3>
                <button 
                  onClick={onClose}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              
              {/* Search Bar - add flex-shrink-0 */}
              <div className="mb-4 flex-shrink-0">
                <input
                  type="text"
                  placeholder={t('Search Tokens')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:text-white"
                />
              </div>
              
              {/* Popular Tokens - add flex-shrink-0 */}
              <div className="mb-4 flex-shrink-0">
                <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">{t('Your Tokens')}</h4>
                <div className="flex flex-wrap gap-2">
                  {popularTokens.map((token) => (
                    <button
                      key={`popular-${token.symbol}`}
                      onClick={() => {
                        if (token.symbol !== exclude) {
                          onSelect(token.symbol);
                          onClose();
                        }
                      }}
                      disabled={token.symbol === exclude}
                      className={`px-3 py-2 rounded-lg flex items-center space-x-2 transition-all duration-200
                        ${token.symbol === selectedToken ? 'bg-primary-500 text-white' : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'}
                        ${token.symbol === exclude ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {token.symbol === 'USDC' ? (
                        <img 
                          src="/icons/usdc.png" 
                          alt={token.symbol} 
                          className="w-10 h-10 rounded-full object-contain"
                        />
                      ) : token.symbol === 'EURC' ? (
                        <img 
                          src="/icons/eurc.png" 
                          alt={token.symbol} 
                          className="w-10 h-10 rounded-full object-contain"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-gray-200 dark:bg-gray-600 rounded-full flex items-center justify-center">
                          <span className="text-lg font-bold">
                            {token.symbol.charAt(0)}
                          </span>
                        </div>
                      )}
                      <span className="font-medium">{token.symbol}</span>
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Wrap token list with scrollable container */}
              <div className="flex-1 overflow-y-auto -mx-6 px-6">
                {/* Token List */}
                <div className="space-y-2">
                  {filteredTokens.map((token) => (
                    <button
                      key={token.symbol}
                      onClick={() => {
                        if (token.symbol !== exclude) {
                          onSelect(token.symbol);
                          onClose();
                        }
                      }}
                      disabled={token.symbol === exclude}
                      className={`w-full p-4 rounded-lg flex items-center justify-between transition-all duration-200
                        ${token.symbol === selectedToken ? 'bg-primary-50 dark:bg-primary-900/20 border-2 border-primary-500' : 'border-2 border-transparent hover:bg-gray-100 dark:hover:bg-gray-700'}
                        ${token.symbol === exclude ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center text-2xl">
                          {token.symbol === 'USDC' ? (
                            <img 
                              src="/icons/usdc.png" 
                              alt={token.symbol} 
                              className="w-10 h-10 rounded-full object-contain"
                            />
                          ) : token.symbol === 'EURC' ? (
                            <img 
                              src="/icons/eurc.png" 
                              alt={token.symbol} 
                              className="w-10 h-10 rounded-full object-contain"
                            />
                          ) : (
                            <span className="text-xl">
                              {token.symbol.charAt(0)}
                            </span>
                          )}
                        </div>
                        <div className="text-left">
                          <p className="font-semibold">{token.symbol}</p>
                          <p className="text-xs text-gray-500">{token.name}</p>
                        </div>
                      </div>
                      {/* Token Balance */}
                      {isConnected && (
                        <div className="text-right">
                          <p className="text-sm font-medium">
                            {token.symbol === fromToken ? fromBalance : token.symbol === toToken ? toBalance : '0.00'}
                          </p>
                          <p className="text-xs text-gray-500">{t('balance')}</p>
                        </div>
                      )}
                    </button>
                  ))}
                  
                  {filteredTokens.length === 0 && searchQuery && (
                    <div className="text-center py-8 text-gray-500">
                      <p>{t('noTokensFound')}</p>
                    </div>
                  )}
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
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold mb-1">{t('Swap Tokens')}</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">{t('Trade Tokens Instantly and Easily')}</p>
          </div>
          <div className="flex items-center space-x-2">
            <a 
              href="https://faucet.circle.com/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="px-3 py-2 text-sm border-2 border-blue-400 text-blue-500 dark:text-blue-400 rounded-lg transition-all duration-200 hover:bg-blue-50 dark:hover:bg-blue-900/20 flex items-center space-x-1"
            >
              <span>Faucet</span>
            </a>
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all duration-200 hover:scale-110"
              title="Settings"
            >
              <Settings size={20} />
            </button>
          </div>
        </div>

        {/* Settings Panel */}
        <AnimatePresence>
          {showSettings && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mb-6"
            >
              <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg space-y-6">
                {/* Slippage Tolerance */}
                <SlippageTolerance />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Validation Error */}
        {validationError && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start space-x-2"
          >
            <AlertTriangle size={16} className="text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-600 dark:text-red-400">{validationError}</p>
          </motion.div>
        )}

        {/* From Token */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">{t('From')}</label>
          <div className="p-4 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm transition-all duration-200 flex flex-col relative">
            <div className="flex items-center justify-between gap-2 w-full">
              <div className="relative flex-1">
                <input
                  type="text"
                  inputMode="decimal"
                  value={fromAmount}
                  onChange={(e) => setFromAmount(sanitizeInput(e.target.value))}
                  placeholder="0.0"
                  className="text-3xl font-semibold bg-transparent outline-none placeholder-gray-400 dark:placeholder-gray-500 text-gray-900 dark:text-white w-full pr-16"
                />
              </div>
              <button
                ref={fromTokenTriggerRef}
                onClick={() => setShowFromSelector(true)}
                className="flex items-center space-x-2 px-3 py-2 bg-white dark:bg-gray-800 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 shadow-sm hover:shadow-md self-end min-w-[120px] w-auto flex-shrink-0"
              >
                <div className="w-10 h-10 bg-white dark:bg-gray-700 rounded-full flex items-center justify-center text-2xl">
                  {fromToken === 'USDC' ? (
                    <img 
                      src="/icons/usdc.png" 
                      alt={fromToken} 
                      className="w-10 h-10 rounded-full object-contain"
                    />
                  ) : fromToken === 'EURC' ? (
                    <img 
                      src="/icons/eurc.png" 
                      alt={fromToken} 
                      className="w-10 h-10 rounded-full object-contain"
                    />
                  ) : (
                    <span className="text-xl">
                      {fromToken}
                    </span>
                  )}
                </div>
                <div className="text-left min-w-0">
                  <p className="font-bold text-base truncate">{fromToken}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{TOKENS[fromToken].name}</p>
                </div>
                <ChevronDown size={16} />
              </button>
            </div>
            {isConnected && (
              <div className="flex items-center justify-end mt-2">
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-gray-500 dark:text-gray-400">Bal:</span>
                  <span className="text-sm font-semibold">
                    {fromLoading ? (
                      <Loader className="animate-spin" size={14} />
                    ) : (
                      `${fromBalance || '0.00'} ${fromToken}`
                    )}
                  </span>
                </div>
                <button
                  onClick={handleMaxClick}
                  className="text-xs font-semibold text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors ml-2"
                >
                  {t('Max')}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Switch Button */}
        <div className="flex justify-center my-6 relative z-10">
          <button
            onClick={handleSwitch}
            className="switch-button p-4 bg-white dark:bg-gray-800 border-4 border-gray-100 dark:border-gray-900 rounded-2xl hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:border-primary-200 dark:hover:border-primary-800 transition-all duration-200 shadow-xl hover:shadow-2xl hover:scale-110 group"
            title={t('switchTokens')}
          >
            <ArrowDownUp size={24} className="group-hover:rotate-180 transition-transform duration-300" />
          </button>
        </div>

        {/* To Token */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">{t('To')}</label>
          <div className="p-4 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm transition-all duration-200 flex flex-col relative">
            <div className="flex items-center justify-between gap-2 w-full">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={toAmount}
                  readOnly
                  placeholder="0.0"
                  className="text-3xl font-semibold bg-transparent outline-none placeholder-gray-400 dark:placeholder-gray-500 text-gray-900 dark:text-white w-full pr-16"
                />
              </div>
              <button
                ref={toTokenTriggerRef}
                onClick={() => setShowToSelector(true)}
                className="flex items-center space-x-2 px-3 py-2 bg-white dark:bg-gray-800 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 shadow-sm hover:shadow-md self-end min-w-[120px] w-auto flex-shrink-0"
              >
                <div className="w-10 h-10 bg-white dark:bg-gray-700 rounded-full flex items-center justify-center text-2xl">
                  {toToken === 'USDC' ? (
                    <img 
                      src="/icons/usdc.png" 
                      alt={toToken} 
                      className="w-10 h-10 rounded-full object-contain"
                    />
                  ) : toToken === 'EURC' ? (
                    <img 
                      src="/icons/eurc.png" 
                      alt={toToken} 
                      className="w-10 h-10 rounded-full object-contain"
                  />
                ) : (
                  <span className="text-xl">
                    {toToken}
                  </span>
                )}
              </div>
                <div className="text-left min-w-0">
                  <p className="font-bold text-base truncate">{toToken}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{TOKENS[toToken].name}</p>
                </div>
                <ChevronDown size={16} />
              </button>
            </div>
            {isConnected && (
              <div className="flex items-center justify-end mt-2">
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-gray-500 dark:text-gray-400">Bal:</span>
                  <span className="text-sm font-semibold">
                    {toLoading ? (
                      <Loader className="animate-spin" size={14} />
                    ) : (
                      `${toBalance || '0.00'} ${toToken}`
                    )}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Swap Details */}
        <AnimatePresence>
          {showSwapDetails && swapQuote && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mb-6"
            >
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">{t('Expected Output')}</span>
                  <span className="font-semibold">{swapQuote.expectedOutput} {toToken}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">{t('Min Received')}</span>
                  <span className="font-semibold">{swapQuote.minReceived} {toToken}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">{t('Price Impact')}</span>
                  <span className={`font-semibold ${parseFloat(swapQuote.priceImpact) > 1 ? 'text-red-600' : 'text-green-600'}`}>
                    {swapQuote.priceImpact}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">{t('liquidityProviderFee')}</span>
                  <span className="font-semibold">${swapQuote.tradingFee}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">{t('route')}</span>
                  <span className="font-semibold">{swapQuote.route.join(' → ')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">{t('exchangeRate')}</span>
                  <span className="font-semibold">1 {fromToken} = {swapQuote.exchangeRate} {toToken}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">{t('networkFee')}</span>
                  <span className="font-semibold">${swapQuote.gasFee} USDC</span>
                </div>
                <div className="pt-2 border-t border-gray-300 dark:border-gray-600 text-xs text-gray-500 dark:text-gray-400">
                  {t('outputEstimatedInfo')}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Swap Button */}
        <button
          onClick={handleSwap}
          disabled={!fromAmount || !toAmount || swapLoading || !isConnected}
          className="w-full btn-primary py-5 text-xl font-bold flex items-center justify-center space-x-2 rounded-2xl shadow-xl hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-xl"
        >
          {swapLoading ? (
            <>
              <Loader className="animate-spin" size={24} />
              <span>{t('processing')}...</span>
            </>
          ) : !isConnected ? (
            <>
              <Wallet size={24} />
              <span>{t('connectWallet')}</span>
            </>
          ) : !fromAmount || !toAmount ? (
            <span>{t('Swap')}</span>
          ) : (
            <>
              <span> {t('swap')}</span>
            </>
          )}
        </button>

        {/* Helper Text */}
        {isConnected && swapQuote && (
          <p className="text-center text-xs text-gray-500 dark:text-gray-400 mt-3">
            {t('bySwappingAgree')}
          </p>
        )}
      </motion.div>

      {/* Token Selectors */}
      <TokenSelector
        isOpen={showFromSelector}
        onClose={() => setShowFromSelector(false)}
        selectedToken={fromToken}
        onSelect={setFromToken}
        exclude={toToken}
        triggerRef={fromTokenTriggerRef}
      />
      <TokenSelector
        isOpen={showToSelector}
        onClose={() => setShowToSelector(false)}
        selectedToken={toToken}
        onSelect={setToToken}
        exclude={fromToken}
        triggerRef={toTokenTriggerRef}
      />

      {/* Toast Notifications */}
      <Toast
        type={toast.type}
        message={toast.message}
        visible={toast.visible}
        onClose={() => setToast({ ...toast, visible: false })}
      />
    </div>
  );
};

export default Swap;