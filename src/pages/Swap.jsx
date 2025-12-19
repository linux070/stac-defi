import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useWallet } from '../contexts/WalletContext';
import { ArrowDownUp, Settings, Info, Loader, Wallet, AlertTriangle, X, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { TOKENS, TOKEN_PRICES } from '../config/networks';
import { sanitizeInput, calculateSwapQuote, validateAmount, validateSlippage, getFilteredTokens } from '../utils/blockchain';
import useTokenBalance from '../hooks/useTokenBalance';
import Toast from '../components/Toast';
import '../styles/swap-styles.css';

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
    try {
      const allTokens = Object.values(TOKENS);
      const filtered = getFilteredTokens(allTokens, chainId);
      // Filter out any invalid tokens that don't have a symbol
      return Array.isArray(filtered) ? filtered.filter(token => 
        token && 
        typeof token === 'object' && 
        token.symbol && 
        typeof token.symbol === 'string' &&
        token.symbol.length > 0
      ) : [];
    } catch (error) {
      console.error('Error building token list:', error);
      return [];
    }
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
      if (slippage > 5) return 'danger';
      if (slippage > 1) return 'warning';
      return '';
    };
    
    return (
      <div className="swap-slippage-container">
        <label className="swap-slippage-label">{t('Slippage')}</label>
        <div className="swap-slippage-content">
          <div className="swap-slippage-buttons">
            {[0.1, 0.5, 1.0].map((value) => (
              <button
                key={value}
                onClick={() => {
                  setSlippage(value);
                  setCustomSlippage('');
                }}
                className={`swap-slippage-button ${slippage === value ? 'active' : ''}`}
              >
                {value}%
              </button>
            ))}
            <div className="swap-slippage-input-wrapper">
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
                className={`swap-slippage-input ${getSlippageTextColor()}`}
              />
              <span className="swap-slippage-percent">%</span>
            </div>
          </div>
          {slippageWarning && (
            <div className="swap-slippage-warning">
              <AlertTriangle size={14} className="swap-slippage-warning-icon" />
              <p className="swap-slippage-warning-text">{slippageWarning}</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  const TokenSelector = ({ isOpen, onClose, selectedToken, onSelect, exclude, triggerRef, fromToken, toToken, fromBalance, toBalance }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const selectorRef = useRef(null);
    
    // Filter tokens based on search query
    const filteredTokens = useMemo(() => {
      if (!searchQuery) return tokenList;
      
      const query = searchQuery.toLowerCase();
      return tokenList.filter(token => 
        token && 
        token.symbol && 
        typeof token.symbol === 'string' &&
        (token.symbol.toLowerCase().includes(query) || 
        (token.name && typeof token.name === 'string' && token.name.toLowerCase().includes(query)) ||
        (token.address && typeof token.address === 'string' && token.address.toLowerCase().includes(query)) ||
        (token.address && typeof token.address === 'object' && 
          Object.values(token.address).some(addr => typeof addr === 'string' && addr.toLowerCase().includes(query))))
      );
    }, [searchQuery, tokenList]);
    
    // Popular tokens for quick selection.
    const popularTokens = useMemo(() => {
      return tokenList.filter(token => 
        token && 
        token.symbol && 
        typeof token.symbol === 'string' &&
        ['USDC', 'EURC'].includes(token.symbol)
      );
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

    return (
      <AnimatePresence mode="wait">
        {isOpen && (
        <motion.div 
          key="token-selector-modal"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 swap-token-selector-modal-backdrop"
          onClick={onClose}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <motion.div
            ref={selectorRef}
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
            className="swap-token-selector-modal"
            onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside modal
          >
              <div className="swap-token-selector-header">
                <h3 className="swap-token-selector-title">{t('Select Token')}</h3>
                <button 
                  onClick={onClose}
                  className="swap-token-selector-close-button"
                >
                  <X size={18} />
                </button>
              </div>
              
              {/* Search Bar */}
              <div className="swap-token-selector-search">
                <input
                  type="text"
                  placeholder={t('Search Tokens')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="swap-token-selector-search-input"
                />
              </div>
              
              {/* Popular Tokens */}
              <div className="swap-token-selector-popular-section">
                <h4 className="swap-token-selector-popular-label">{t('Your Tokens')}</h4>
                <div className="swap-token-selector-popular-tokens">
                  {popularTokens.map((token) => {
                    // Safety check: skip invalid tokens
                    if (!token || !token.symbol || typeof token.symbol !== 'string') {
                      return null;
                    }
                    
                    const isExcluded = token.symbol === exclude;
                    const isSelected = token.symbol === selectedToken;
                    
                    return (
                      <button
                        key={`popular-${token.symbol}`}
                        onClick={() => {
                          if (!isExcluded) {
                            onSelect(token.symbol);
                            onClose();
                          }
                        }}
                        disabled={isExcluded}
                        className={`swap-token-selector-popular-button ${isSelected ? 'active' : ''} ${isExcluded ? 'disabled' : ''}`}
                      >
                        {token.symbol === 'USDC' ? (
                          <img 
                            src="/icons/usdc.png" 
                            alt={token.symbol} 
                            className="swap-token-selector-popular-icon"
                          />
                        ) : token.symbol === 'EURC' ? (
                          <img 
                            src="/icons/eurc.png" 
                            alt={token.symbol} 
                            className="swap-token-selector-popular-icon"
                          />
                        ) : (
                          <div className="swap-token-selector-popular-icon" style={{ background: 'var(--swap-surface-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <span style={{ fontSize: '12px', fontWeight: 600 }}>
                              {token.symbol && token.symbol.length > 0 ? token.symbol.charAt(0) : '?'}
                            </span>
                          </div>
                        )}
                        <span className="swap-token-selector-popular-symbol">{token.symbol}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
              
              {/* Token List */}
              <div className="swap-token-selector-list">
                {filteredTokens.map((token) => {
                  // Safety check: skip invalid tokens
                  if (!token || !token.symbol || typeof token.symbol !== 'string') {
                    return null;
                  }
                  
                  return (
                    <button
                      key={token.symbol}
                      onClick={() => {
                        if (token.symbol !== exclude) {
                          onSelect(token.symbol);
                          onClose();
                        }
                      }}
                      className={`swap-token-selector-list-item ${token.symbol === selectedToken ? 'selected' : ''}`}
                    >
                      <div className="swap-token-selector-list-item-content">
                        <div className="swap-token-selector-list-icon">
                          {token.symbol === 'USDC' ? (
                            <img 
                              src="/icons/usdc.png" 
                              alt={token.symbol}
                            />
                          ) : token.symbol === 'EURC' ? (
                            <img 
                              src="/icons/eurc.png" 
                              alt={token.symbol}
                            />
                          ) : (
                            <span style={{ fontSize: '18px', fontWeight: 600, color: 'var(--swap-text-primary)' }}>
                              {token.symbol && token.symbol.length > 0 ? token.symbol.charAt(0) : '?'}
                            </span>
                          )}
                        </div>
                        <div className="swap-token-selector-list-info">
                          <p className="swap-token-selector-list-symbol">{token.symbol || 'Unknown'}</p>
                          <p className="swap-token-selector-list-name">{token.name || 'Token'}</p>
                        </div>
                      </div>
                      {/* Token Balance */}
                      {isConnected && (
                        <div className="swap-token-selector-list-balance">
                          <p className="swap-token-selector-list-balance-amount">
                            {token.symbol === fromToken ? fromBalance : token.symbol === toToken ? toBalance : '0.00'}
                          </p>
                          <p className="swap-token-selector-list-balance-label">{t('balance')}</p>
                        </div>
                      )}
                    </button>
                  );
                })}
                
                {filteredTokens.length === 0 && searchQuery && (
                  <div className="swap-token-selector-empty">
                    <p>{t('noTokensFound')}</p>
                  </div>
                )}
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
        className="swap-container"
      >
        {/* Header */}
        <div className="swap-header">
          <div>
            <h2 className="swap-header-title">{t('Swap Tokens')}</h2>
            <p className="swap-header-subtitle">{t('swap.tradeTokensTitle')}</p>
          </div>
          <div className="swap-header-actions">
            <a 
              href="https://faucet.circle.com/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="swap-faucet-button"
            >
              <span>Faucet</span>
            </a>
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="swap-settings-button"
              title="Settings"
            >
              <Settings size={18} />
            </button>
          </div>
        </div>

        {/* Settings Panel - Desktop: Inline Expandable */}
        <AnimatePresence>
          {showSettings && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mb-4 md:mb-6 hidden md:block"
            >
              <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg space-y-6">
                {/* Slippage Tolerance */}
                <SlippageTolerance />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Settings Bottom Sheet Modal - Mobile Only */}
        <AnimatePresence>
          {showSettings && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-40 bg-black bg-opacity-50 md:hidden"
                onClick={() => setShowSettings(false)}
              />
              
              {/* Bottom Sheet - Mobile Only */}
              <motion.div
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-800 rounded-t-3xl shadow-2xl md:hidden"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Drag Handle for Mobile */}
                <div className="flex justify-center pt-3 pb-2">
                  <div className="w-12 h-1.5 bg-gray-300 dark:bg-gray-600 rounded-full" />
                </div>
                
                {/* Header */}
                <div className="flex items-center justify-between px-4 sm:px-6 pb-4 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">Settings</h3>
                  <button
                    onClick={() => setShowSettings(false)}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors touch-manipulation"
                  >
                    <X size={20} className="text-gray-500 dark:text-gray-400" />
                  </button>
                </div>
                
                {/* Content */}
                <div className="p-4 sm:p-6 space-y-6 max-h-[70vh] overflow-y-auto">
                  {/* Slippage Tolerance */}
                  <SlippageTolerance />
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Validation Error */}
        {validationError && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="swap-validation-error"
          >
            <AlertTriangle size={16} className="swap-validation-error-icon" />
            <p className="swap-validation-error-text">{validationError}</p>
          </motion.div>
        )}

        {/* From Token */}
        <div className="swap-input-group">
          <div className="swap-input-header">
            <div className="swap-input-label">{t('From')}</div>
            {isConnected && (
              <div className="swap-balance-text">
                Balance: <span>
                  {fromLoading ? (
                    <Loader className="animate-spin" size={12} />
                  ) : (
                    fromBalance || '0.00'
                  )}
                </span>
              </div>
            )}
          </div>
          <div className="swap-input-row">
            <input
              type="text"
              inputMode="decimal"
              value={fromAmount}
              onChange={(e) => setFromAmount(sanitizeInput(e.target.value))}
              placeholder="0.0"
              className="swap-amount-input"
            />
            <button
              ref={fromTokenTriggerRef}
              onClick={() => setShowFromSelector(true)}
              className="swap-token-selector"
            >
              <div className="swap-token-icon">
                {fromToken === 'USDC' ? (
                  <img 
                    src="/icons/usdc.png" 
                    alt={fromToken} 
                    className="w-6 h-6 rounded-full object-contain"
                  />
                ) : fromToken === 'EURC' ? (
                  <img 
                    src="/icons/eurc.png" 
                    alt={fromToken} 
                    className="w-6 h-6 rounded-full object-contain"
                  />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                    <span className="text-xs font-bold">{fromToken}</span>
                  </div>
                )}
              </div>
              <span className="swap-token-symbol">{fromToken}</span>
              <ChevronDown size={16} className="swap-token-chevron" />
            </button>
          </div>
          {isConnected && (
            <div className="flex items-center justify-end mt-2">
              <button
                onClick={handleMaxClick}
                className="max-button"
              >
                {t('Max')}
              </button>
            </div>
          )}
        </div>

        {/* Switch Button */}
        <div className="swap-direction-container">
          <button
            onClick={handleSwitch}
            className="swap-direction-button"
            title={t('Switch Tokens')}
          >
            <ArrowDownUp size={18} />
          </button>
        </div>

        {/* To Token */}
        <div className="swap-input-group">
          <div className="swap-input-header">
            <div className="swap-input-label">{t('To')}</div>
            {isConnected && (
              <div className="swap-balance-text">
                Balance: <span>
                  {toLoading ? (
                    <Loader className="animate-spin" size={12} />
                  ) : (
                    toBalance || '0.00'
                  )}
                </span>
              </div>
            )}
          </div>
          <div className="swap-input-row">
            <input
              type="text"
              value={toAmount}
              readOnly
              placeholder="0.0"
              className="swap-amount-input"
            />
            <button
              ref={toTokenTriggerRef}
              onClick={() => setShowToSelector(true)}
              className="swap-token-selector"
            >
              <div className="swap-token-icon">
                {toToken === 'USDC' ? (
                  <img 
                    src="/icons/usdc.png" 
                    alt={toToken} 
                    className="w-6 h-6 rounded-full object-contain"
                  />
                ) : toToken === 'EURC' ? (
                  <img 
                    src="/icons/eurc.png" 
                    alt={toToken} 
                    className="w-6 h-6 rounded-full object-contain"
                  />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                    <span className="text-xs font-bold">{toToken}</span>
                  </div>
                )}
              </div>
              <span className="swap-token-symbol">{toToken}</span>
              <ChevronDown size={16} className="swap-token-chevron" />
            </button>
          </div>
          {isConnected && (
            <div className="flex items-center justify-end mt-2">
              <button
                onClick={() => {
                  if (!toBalance || parseFloat(toBalance) === 0) {
                    setToast({ visible: true, type: 'warning', message: 'No balance available' });
                    setTimeout(() => setToast({ visible: false, type: 'info', message: '' }), 3000);
                    return;
                  }
                  // Set the "To" amount to maximum balance
                  // Note: This will trigger the swap calculation in reverse
                  setToAmount(toBalance);
                  // Calculate the required "From" amount based on the "To" amount
                  try {
                    const reverseQuote = calculateSwapQuote(toToken, fromToken, toBalance, slippage);
                    if (reverseQuote) {
                      setFromAmount(reverseQuote.expectedOutput);
                    }
                  } catch (err) {
                    console.error('Error calculating reverse quote:', err);
                  }
                }}
                className="max-button"
              >
                {t('Max')}
              </button>
            </div>
          )}
        </div>

        {/* Swap Details */}
        <AnimatePresence>
          {showSwapDetails && swapQuote && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mb-4 md:mb-6"
            >
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg space-y-3 text-xs md:text-sm">
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
          className="swap-button"
        >
          {swapLoading ? (
            <div className="swap-loading">
              <div className="swap-spinner"></div>
              <span className="swap-loading-text">{t('processing')}...</span>
            </div>
          ) : !isConnected ? (
            <>
              <Wallet size={18} />
              <span>{t('connectWallet')}</span>
            </>
          ) : !fromAmount || !toAmount ? (
            <span>{t('Swap')}</span>
          ) : (
            <span>{t('swap')}</span>
          )}
        </button>

        {/* Helper Text */}
        {isConnected && swapQuote && (
          <p className="swap-helper-text">
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
        fromToken={fromToken}
        toToken={toToken}
        fromBalance={fromBalance}
        toBalance={toBalance}
      />
      <TokenSelector
        isOpen={showToSelector}
        onClose={() => setShowToSelector(false)}
        selectedToken={toToken}
        onSelect={setToToken}
        exclude={fromToken}
        triggerRef={toTokenTriggerRef}
        fromToken={fromToken}
        toToken={toToken}
        fromBalance={fromBalance}
        toBalance={toBalance}
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