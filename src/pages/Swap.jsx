import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { useWallet } from '../contexts/WalletContext';
import { useAccount } from 'wagmi';
import { ethers } from 'ethers';
import { ArrowDownUp, Settings, Info, Loader, Wallet, AlertTriangle, X, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { TOKENS, TOKEN_PRICES, NETWORKS } from '../config/networks';
import { sanitizeInput, calculateSwapQuote, validateAmount, validateSlippage, getFilteredTokens } from '../utils/blockchain';
import useTokenBalance from '../hooks/useTokenBalance';
import useMultiChainBalances from '../hooks/useMultiChainBalances';
import Toast from '../components/Toast';
import { DEX_ADDRESS, USDC_ADDRESS as CONSTANT_USDC_ADDRESS } from '../config/constants';
import { useSwap } from '../hooks/useSwap';
import SwapModal from '../components/SwapModal';
import FaucetModal from '../components/FaucetModal';
import '../styles/swap-styles.css';

const USDC_ADDRESS = CONSTANT_USDC_ADDRESS;

const getTokenIcon = (symbol) => {
  const iconMap = {
    'USDC': '/icons/usdc.png',
    'STCK': '/icons/stac.png',
    'BALL': '/icons/ball.jpg',
    'MTB': '/icons/mtb.png',
    'ECR': '/icons/ecr.png'
  };
  return iconMap[symbol] || null;
};

const Swap = () => {
  const { t } = useTranslation();
  const { isConnected, balance, chainId } = useWallet();
  const { address } = useAccount();
  const [fromToken, setFromToken] = useState('USDC');
  const [toToken, setToToken] = useState('STCK');
  const [fromAmount, setFromAmount] = useState('');
  const [toAmount, setToAmount] = useState('');
  const [slippage, setSlippage] = useState(0.5);
  const [customSlippage, setCustomSlippage] = useState('');
  const [showFromSelector, setShowFromSelector] = useState(false);
  const [showToSelector, setShowToSelector] = useState(false);
  const [showSwapDetails, setShowSwapDetails] = useState(false);
  const [swapQuote, setSwapQuote] = useState(null);
  const [swapLoading, setSwapLoading] = useState(false);
  const [validationError, setValidationError] = useState('');
  const [slippageWarning, setSlippageWarning] = useState('');
  const [toast, setToast] = useState({ visible: false, type: 'info', message: '' });
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [liquidityWarning, setLiquidityWarning] = useState('');

  // Modal states
  const [isSwapModalOpen, setIsSwapModalOpen] = useState(false);
  const [isFaucetModalOpen, setIsFaucetModalOpen] = useState(false);


  // Wagmi-based Swap Hook
  const swapState = useSwap(fromToken, toToken, fromAmount, slippage);

  // Helper function to normalize chain ID for comparison
  const normalizeChainId = (chainId) => {
    if (!chainId) return null;

    // If it's a number, convert to lowercase hex string
    if (typeof chainId === 'number') {
      return '0x' + chainId.toString(16).toLowerCase();
    }

    // If it's already a string, ensure it's lowercase
    if (typeof chainId === 'string') {
      // If it's a decimal string, convert to number first
      if (!chainId.startsWith('0x')) {
        const num = parseInt(chainId, 10);
        if (!isNaN(num)) {
          return '0x' + num.toString(16).toLowerCase();
        }
      }
      // If it's a hex string, just lowercase it
      return chainId.toLowerCase();
    }

    return null;
  };

  // Helper function to get token address for current chain
  const getTokenAddress = (tokenSymbol) => {
    if (tokenSymbol === 'USDC') return USDC_ADDRESS;
    if (!chainId || !tokenSymbol) return null;

    // Normalize the current chain ID for comparison
    const normalizedChainId = normalizeChainId(chainId);
    const normalizedArcChainId = normalizeChainId(NETWORKS.ARC_TESTNET.chainId);
    const normalizedSepoliaChainId = normalizeChainId(NETWORKS.ETHEREUM_SEPOLIA.chainId);

    // Strategy 1: Try structured format first (TOKENS.ARC_TESTNET.USDC)
    if (normalizedChainId === normalizedArcChainId) {
      const arcToken = TOKENS.ARC_TESTNET?.[tokenSymbol];
      if (arcToken?.address) {
        const addr = arcToken.address;
        if (addr && addr !== '0x' && addr !== '0x0000000000000000000000000000000000000000') {
          return addr;
        }
      }
    } else if (normalizedChainId === normalizedSepoliaChainId) {
      const sepoliaToken = TOKENS.ETHEREUM_SEPOLIA?.[tokenSymbol];
      if (sepoliaToken?.address) {
        const addr = sepoliaToken.address;
        if (addr && addr !== '0x' && addr !== '0x0000000000000000000000000000000000000000') {
          return addr;
        }
      }
    }

    // Strategy 2: Try generic format (TOKENS.USDC.address[chainId])
    const token = TOKENS[tokenSymbol];
    if (!token) return null;

    // If token has an address object (multi-chain format)
    if (token.address && typeof token.address === 'object') {
      // Try to find address using normalized chain ID
      for (const [key, value] of Object.entries(token.address)) {
        const normalizedKey = normalizeChainId(key);
        if (normalizedKey === normalizedChainId) {
          if (value && value !== '0x' && value !== '0x0000000000000000000000000000000000000000') {
            return value;
          }
        }
      }
      return null;
    }

    // Strategy 3: Direct address (single-chain token)
    if (token.address && typeof token.address === 'string') {
      const addr = token.address;
      if (addr && addr !== '0x' && addr !== '0x0000000000000000000000000000000000000000') {
        return addr;
      }
    }

    return null;
  };

  // Helper function to get token decimals
  const getTokenDecimals = (tokenSymbol) => {
    if (!TOKENS[tokenSymbol]) return 18;
    return TOKENS[tokenSymbol].decimals || 18;
  };

  // Refs for trigger buttons
  const fromTokenTriggerRef = useRef(null);
  const toTokenTriggerRef = useRef(null);

  // Multi-chain balances for USDC (fetches both chains simultaneously)
  const { balances: multiChainBalances } = useMultiChainBalances(address, isConnected);

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

  // For USDC, use multi-chain balances; for other tokens, use regular balance hook
  const { balance: fromBalanceRegular, loading: fromLoadingRegular, refetch: refetchFrom } = useTokenBalance((fromToken === 'USDC') ? null : fromToken);
  const { balance: toBalanceRegular, loading: toLoadingRegular, refetch: refetchTo } = useTokenBalance((toToken === 'USDC') ? null : toToken);

  const getFromBalance = () => {
    if (fromToken === 'USDC') {
      // Use current chain's balance from multi-chain hook
      const chainIdNum = chainId ? parseInt(chainId, 16) : null;
      const tokenKey = fromToken.toLowerCase(); // 'usdc'

      if (chainIdNum === 5042002) { // Arc Testnet
        const balance = multiChainBalances?.arcTestnet?.[tokenKey] || '0.00';

        return {
          balance,
          loading: multiChainBalances?.arcTestnet?.loading || false,
        };
      } else if (chainIdNum === 11155111) { // Sepolia
        const balance = multiChainBalances?.sepolia?.[tokenKey] || '0.00';

        return {
          balance,
          loading: multiChainBalances?.sepolia?.loading || false,
        };
      } else if (chainIdNum === 84532) { // Base Sepolia
        const balance = multiChainBalances?.baseSepolia?.[tokenKey] || '0.00';

        return {
          balance,
          loading: multiChainBalances?.baseSepolia?.loading || false,
        };
      }
      return { balance: '0.00', loading: false };
    }
    return {
      balance: fromBalanceRegular || '0.00',
      loading: fromLoadingRegular || false,
    };
  };

  const getToBalance = () => {
    if (toToken === 'USDC') {
      // Use current chain's balance from multi-chain hook
      const chainIdNum = chainId ? parseInt(chainId, 16) : null;
      const tokenKey = toToken.toLowerCase(); // 'usdc'

      if (chainIdNum === 5042002) { // Arc Testnet
        return {
          balance: multiChainBalances?.arcTestnet?.[tokenKey] || '0.00',
          loading: multiChainBalances?.arcTestnet?.loading || false,
        };
      } else if (chainIdNum === 11155111) { // Sepolia
        return {
          balance: multiChainBalances?.sepolia?.[tokenKey] || '0.00',
          loading: multiChainBalances?.sepolia?.loading || false,
        };
      } else if (chainIdNum === 84532) { // Base Sepolia
        return {
          balance: multiChainBalances?.baseSepolia?.[tokenKey] || '0.00',
          loading: multiChainBalances?.baseSepolia?.loading || false,
        };
      }
      return { balance: '0.00', loading: false };
    }
    return {
      balance: toBalanceRegular || '0.00',
      loading: toLoadingRegular || false,
    };
  };

  const fromBalanceData = getFromBalance();
  const toBalanceData = getToBalance();
  const fromBalance = fromBalanceData.balance;
  const fromLoading = fromBalanceData.loading;
  const toBalance = toBalanceData.balance;
  const toLoading = toBalanceData.loading;

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

  // Calculate swap quote using the useSwap hook
  useEffect(() => {
    if (fromAmount && parseFloat(fromAmount) > 0) {
      if (swapState.expectedOut && swapState.expectedOut !== "0") {
        setToAmount(swapState.expectedOut);

        // Update the swapQuote object for detail display
        setSwapQuote({
          expectedOutput: swapState.expectedOut,
          price: swapState.price,
          minReceived: (parseFloat(swapState.expectedOut) * 0.995).toFixed(6),
          priceImpact: '0.00',
          networkFee: '0.00'
        });
        setShowSwapDetails(true);
      }
    } else {
      setToAmount('');
      setSwapQuote(null);
      setShowSwapDetails(false);
    }
  }, [fromAmount, swapState.expectedOut, swapState.price]);

  // Handle swap success/error notifications
  useEffect(() => {
    if (swapState.isSuccess) {
      setToast({ visible: true, type: 'success', message: t('Swap Successful!') });
      setFromAmount('');
      refetchFrom();
      refetchTo();

      const timer = setTimeout(() => {
        setToast({ visible: false, type: 'info', message: '' });
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [swapState.isSuccess, t, refetchFrom, refetchTo]);

  useEffect(() => {
    if (swapState.error) {
      const errorMessage = swapState.error.shortMessage || swapState.error.message || 'Transaction failed';
      setToast({ visible: true, type: 'error', message: errorMessage });

      const timer = setTimeout(() => {
        setToast({ visible: false, type: 'info', message: '' });
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [swapState.error]);

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

  const handleFaucetClick = (e) => {
    e.preventDefault();
    setIsFaucetModalOpen(true);
  };

  const handleSwapClick = () => {
    if (!isConnected) {
      setToast({ visible: true, type: 'error', message: t('connectWalletFirst') });
      return;
    }
    if (!fromAmount || parseFloat(fromAmount) <= 0) {
      setToast({ visible: true, type: 'error', message: t('Please enter a valid amount') });
      return;
    }
    setIsSwapModalOpen(true);
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
        ['USDC', 'STCK', 'BALL', 'MTB', 'ECR'].includes(token.symbol)
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

    const TokenRow = ({ token, selectedToken, exclude, onSelect, onClose, t }) => {
      const { balance: tokenBalance, loading: tokenLoading } = useTokenBalance(token.symbol);
      const isSelected = token.symbol === selectedToken;
      const isExcluded = token.symbol === exclude;

      return (
        <button
          key={token.symbol}
          onClick={() => {
            onSelect(token.symbol);
            onClose();
          }}
          disabled={isExcluded}
          className={`swap-token-selector-list-item ${isSelected ? 'selected' : ''} ${isExcluded ? 'disabled' : ''}`}
        >
          <div className="swap-token-selector-list-item-content">
            <div className="swap-token-selector-list-icon">
              {getTokenIcon(token.symbol) ? (
                <img src={getTokenIcon(token.symbol)} alt={token.symbol} />
              ) : (
                <span className="flex items-center justify-center w-full h-full text-lg font-bold">
                  {token.symbol?.charAt(0)}
                </span>
              )}
            </div>
            <div className="swap-token-selector-list-info">
              <p className="swap-token-selector-list-symbol">{token.symbol || 'Unknown'}</p>
              <p className="swap-token-selector-list-name">{token.name || 'Token'}</p>
            </div>
          </div>
          {isConnected && (
            <div className="swap-token-selector-list-balance">
              <p className="swap-token-selector-list-balance-amount">
                {tokenLoading ? <Loader size={12} className="animate-spin" /> : tokenBalance || '0.00'}
              </p>
              <p className="swap-token-selector-list-balance-label">{t('balance')}</p>
            </div>
          )}
        </button>
      );
    };

    if (!isOpen) return null;

    return (
      <div
        className="fixed inset-0 z-[1000] flex items-start justify-center p-4 pt-24 swap-token-selector-modal-backdrop"
        onClick={onClose}
      >
        <div
          ref={selectorRef}
          className="swap-token-selector-modal"
          onClick={(e) => e.stopPropagation()}
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
                      onSelect(token.symbol);
                      onClose();
                    }}
                    className={`swap-token-selector-popular-button ${isSelected ? 'active' : ''} ${isExcluded ? 'disabled' : ''}`}
                  >
                    {getTokenIcon(token.symbol) ? (
                      <img
                        src={getTokenIcon(token.symbol)}
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
            {filteredTokens.map((token) => (
              <TokenRow
                key={token.symbol}
                token={token}
                selectedToken={selectedToken}
                exclude={exclude}
                onSelect={onSelect}
                onClose={onClose}
                t={t}
              />
            ))}

            {filteredTokens.length === 0 && searchQuery && (
              <div className="swap-token-selector-empty">
                <p>{t('noTokensFound')}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-2xl mx-auto w-full">
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
            <button
              onClick={handleFaucetClick}
              className="swap-faucet-button-compact"
            >
              <span>Faucet</span>
            </button>

          </div>
        </div>





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

        {/* Liquidity Warning */}
        {liquidityWarning && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg"
          >
            <div className="flex items-start gap-3">
              <AlertTriangle size={18} className="text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm text-yellow-800 dark:text-yellow-200 whitespace-pre-line">
                  {liquidityWarning}
                </p>
              </div>
            </div>
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



        {/* Direct Slippage Toolbar - One-Tap Control */}
        <div className="flex items-center justify-between mb-5 px-1">
          <div className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-[0.15em]">
            Slippage
          </div>
          <div className="flex items-center gap-1 p-1 bg-blue-50/50 dark:bg-[#131720]/40 border border-blue-100/50 dark:border-white/5 rounded-2xl shadow-sm backdrop-blur-sm">
            {[0.1, 0.5, 1.0].map((value) => (
              <button
                key={value}
                onClick={() => {
                  setSlippage(value);
                  setCustomSlippage('');
                }}
                className={`px-3 py-1.5 rounded-xl text-[12px] font-bold transition-all duration-300 active:scale-95 ${slippage === value && !customSlippage
                  ? 'bg-white dark:bg-blue-600 text-blue-600 dark:text-white shadow-md ring-1 ring-blue-100/50 dark:ring-blue-500/50'
                  : 'text-gray-500 dark:text-gray-400 hover:text-blue-500'
                  }`}
              >
                {value}%
              </button>
            ))}
            {/* Direct Editable Input */}
            <div className="relative flex items-center ml-1">
              <input
                type="text"
                placeholder="Custom"
                value={customSlippage}
                onChange={(e) => {
                  const val = sanitizeInput(e.target.value);
                  setCustomSlippage(val);
                  if (val && !isNaN(parseFloat(val))) {
                    setSlippage(parseFloat(val));
                  }
                }}
                className={`w-[94px] pl-2 pr-7 py-1.5 rounded-xl text-[12px] font-bold text-center transition-all duration-300 focus:outline-none ${customSlippage
                  ? 'bg-white dark:bg-blue-600 text-blue-600 dark:text-white shadow-md ring-1 ring-blue-100 dark:ring-blue-500'
                  : 'bg-transparent text-gray-500 dark:text-gray-400 placeholder-gray-400 dark:placeholder-gray-500'
                  }`}
              />
              <span className={`absolute right-3 text-[11px] font-bold pointer-events-none ${customSlippage ? 'text-blue-300 dark:text-blue-200' : 'text-gray-400/80'
                }`}>%</span>
            </div>
          </div>
        </div>

        {slippageWarning && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-2.5 bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200/50 dark:border-yellow-700/30 rounded-xl flex items-center gap-2"
          >
            <AlertTriangle size={14} className="text-yellow-600 dark:text-yellow-400 shrink-0" />
            <p className="text-[11px] font-medium text-yellow-800 dark:text-yellow-200 leading-tight">
              {slippageWarning}
            </p>
          </motion.div>
        )}

        {/* Swap Button */}
        <button
          onClick={handleSwapClick}
          className={`swap-button ${(parseFloat(fromAmount) > parseFloat(fromBalance)) ? 'swap-button-failed' : ''}`}
          disabled={!isConnected || !fromAmount || parseFloat(fromAmount) <= 0 || parseFloat(fromAmount) > parseFloat(fromBalance)}
        >
          {!isConnected ? (
            <>
              <Wallet size={18} className="inline mr-2" />
              <span>{t('Connect Wallet')}</span>
            </>
          ) : parseFloat(fromAmount) > parseFloat(fromBalance) ? (
            <span>{t('Insufficient Balance')}</span>
          ) : (
            <span>{t('Swap')}</span>
          )}
        </button>

        {/* Modals */}
        <SwapModal
          isOpen={isSwapModalOpen}
          onClose={() => setIsSwapModalOpen(false)}
          fromToken={TOKENS[fromToken]}
          toToken={TOKENS[toToken]}
          fromAmount={fromAmount}
          toAmount={toAmount}
          swapState={swapState}
        />

        <FaucetModal
          isOpen={isFaucetModalOpen}
          onClose={() => setIsFaucetModalOpen(false)}
        />


      </motion.div>

      {/* Token Selectors */}
      <TokenSelector
        isOpen={showFromSelector}
        onClose={() => setShowFromSelector(false)}
        selectedToken={fromToken}
        onSelect={(token) => {
          if (token === toToken) {
            handleSwitch();
          } else {
            setFromToken(token);
          }
        }}
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
        onSelect={(token) => {
          if (token === fromToken) {
            handleSwitch();
          } else {
            setToToken(token);
          }
        }}
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