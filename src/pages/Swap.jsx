import { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { useWallet } from '../contexts/WalletContext';
import { useAccount } from 'wagmi';
import { ArrowDownUp, Loader, Wallet, X, ChevronDown, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { TOKENS } from '../config/networks';
import { sanitizeInput, getFilteredTokens } from '../utils/blockchain';
import useTokenBalance from '../hooks/useTokenBalance';
import useMultiChainBalances from '../hooks/useMultiChainBalances';
import Toast from '../components/Toast';
import { useSwap } from '../hooks/useSwap';
import { getItem, setItem } from '../utils/indexedDB';
import SwapModal from '../components/SwapModal';
import SwapSuccessModal from '../components/SwapSuccessModal';
import SwapFailedModal from '../components/SwapFailedModal';
import SwapRejectedModal from '../components/SwapRejectedModal';
import '../styles/swap-styles.css';
import { useModal } from '../contexts/ModalContext';


const getTokenIcon = (symbol) => {
  const iconMap = {
    'USDC': '/icons/usdc.png',
    'STC': '/icons/stc.png',
    'BALL': '/icons/ball.png',
    'MTB': '/icons/mtb.png',
    'ECR': '/icons/ecr.png',
    'EURC': '/icons/eurc.png'
  };
  if (symbol && typeof symbol === 'string' && symbol.toLowerCase().includes('mtb')) {
    return '/icons/mtb.png';
  }
  return iconMap[symbol] || null;
};

const TokenRow = ({ token, selectedToken, exclude, onSelect, onClose, isConnected, t }) => {
  const { balance: tokenBalance, loading: tokenLoading } = useTokenBalance(token.symbol);
  const isSelected = token.symbol === selectedToken;
  const isExcluded = token.symbol === exclude;

  return (
    <button
      disabled={isExcluded}
      onClick={() => {
        onSelect(token.symbol);
        onClose();
      }}
      className={`swap-token-selector-list-item ${isSelected ? 'selected' : ''} ${isExcluded ? 'disabled' : ''}`}
    >
      <div className="swap-token-selector-list-item-content">
        <div className="swap-token-selector-list-icon">
          {getTokenIcon(token.symbol) ? (
            <img src={getTokenIcon(token.symbol)} alt={token.symbol} className="w-full h-full object-cover" />
          ) : (
            <span className="flex items-center justify-center w-full h-full text-sm font-medium uppercase">
              {token.symbol?.charAt(0)}
            </span>
          )}
        </div>
        <div className="swap-token-selector-list-info">
          <p className="swap-token-selector-list-symbol">
            {token.symbol || 'Unknown'}
          </p>
          <p className="swap-token-selector-list-name">
            {token.name || 'Token'}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {isConnected && (
          <div className="swap-token-selector-list-balance">
            <p className="swap-token-selector-list-balance-amount">
              {tokenLoading ? (
                <div className="skeleton w-12 h-4 rounded-md mb-1" />
              ) : (
                tokenBalance || '0.00'
              )}
            </p>
            <p className="swap-token-selector-list-balance-label">{t('balance')}</p>
          </div>
        )}
      </div>
    </button>
  );
};

const TokenSelector = ({ isOpen, onClose, selectedToken, onSelect, exclude, tokenList, t, isConnected }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const selectorRef = useRef(null);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Filter tokens based on search query
  const filteredTokens = useMemo(() => {
    if (!debouncedSearch) return tokenList;

    const query = debouncedSearch.toLowerCase();
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
  }, [debouncedSearch, tokenList]);

  // Popular tokens for quick selection.
  const popularTokens = useMemo(() => {
    return tokenList.filter(token =>
      token &&
      token.symbol &&
      typeof token.symbol === 'string' &&
      ['USDC', 'STC', 'BALL', 'MTB', 'ECR'].includes(token.symbol)
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

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="swap-token-selector-modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
          style={{
            alignItems: 'flex-start',
            paddingTop: '110px', // Extra padding to avoid header clash
            zIndex: 100000
          }}
        >
          <motion.div
            ref={selectorRef}
            className="swap-token-selector-modal"
            initial={{ scale: 0.9, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 10 }}
            transition={{ type: "spring", damping: 25, stiffness: 400 }}
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

            {/* Premium Search Bar - Token Selector */}
            <div className="px-5 py-4">
              <div className="relative group">
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors duration-200">
                  <Search size={16} />
                </div>
                <input
                  type="text"
                  placeholder={t('Search name or paste address')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 rounded-2xl pl-11 pr-4 py-3 text-[14px] outline-none group-hover:bg-white dark:group-hover:bg-white/[0.06] focus:bg-white dark:focus:bg-white/[0.08] focus:border-blue-500/40 focus:ring-4 focus:ring-blue-500/5 transition-all duration-300 placeholder:text-slate-400 dark:placeholder:text-slate-600 shadow-sm"
                />
              </div>
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
                          <span style={{ fontSize: '12px', fontWeight: 500 }}>
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
                  isConnected={isConnected}
                  t={t}
                />
              ))}

              {filteredTokens.length === 0 && searchQuery && (
                <div className="swap-token-selector-empty">
                  <p>{t('noTokensFound')}</p>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
};


const Swap = () => {
  const { t } = useTranslation();
  const { isConnected, chainId } = useWallet();
  const { setIsFocusedModalOpen } = useModal();
  const { address } = useAccount();
  const [fromToken, setFromToken] = useState('USDC');
  const [toToken, setToToken] = useState('STC');
  const [fromAmount, setFromAmount] = useState('');
  const [toAmount, setToAmount] = useState('');
  const [slippage, setSlippage] = useState(0.5);
  const [showFromSelector, setShowFromSelector] = useState(false);
  const [showToSelector, setShowToSelector] = useState(false);
  const [toast, setToast] = useState({ visible: false, type: 'info', message: '' });
  const [lastEditedField, setLastEditedField] = useState('from'); // 'from' or 'to'
  const [debouncedFromAmount, setDebouncedFromAmount] = useState('');

  // Debounce fromAmount change to avoid rapid-fire calculations/RPC
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedFromAmount(fromAmount);
    }, 500);
    return () => clearTimeout(timer);
  }, [fromAmount]);

  // Modal states
  const [isSwapModalOpen, setIsSwapModalOpen] = useState(false);
  const [showSwapSuccessModal, setShowSwapSuccessModal] = useState(false);
  const [showSwapFailedModal, setShowSwapFailedModal] = useState(false);
  const [showSwapRejectedModal, setShowSwapRejectedModal] = useState(false);
  const [lastSwapTxHash, setLastSwapTxHash] = useState(null);
  const [swapError, setSwapError] = useState(null);
  const [frozenSwapData, setFrozenSwapData] = useState(null);

  // Sync focused modal state with layout
  useEffect(() => {
    const isAnyFocusedModalOpen =
      isSwapModalOpen ||
      showFromSelector ||
      showToSelector ||
      showSwapSuccessModal ||
      showSwapFailedModal ||
      showSwapRejectedModal;

    setIsFocusedModalOpen(isAnyFocusedModalOpen);

    // Reset focused state on unmount
    return () => setIsFocusedModalOpen(false);
  }, [
    isSwapModalOpen,
    showFromSelector,
    showToSelector,
    showSwapSuccessModal,
    showSwapFailedModal,
    showSwapRejectedModal,
    setIsFocusedModalOpen
  ]);

  // Token objects based on current selection
  const fromTokenObj = useMemo(() => TOKENS[fromToken], [fromToken]);
  const toTokenObj = useMemo(() => TOKENS[toToken], [toToken]);


  // Wagmi-based Swap Hook - now using debounced amount
  const swapState = useSwap(fromToken, toToken, debouncedFromAmount, slippage);


  // Helper function to get token address for current chain

  // Refs for trigger buttons
  const fromTokenTriggerRef = useRef(null);
  const toTokenTriggerRef = useRef(null);

  // Multi-chain balances for USDC (fetches both chains simultaneously)
  const { balances: multiChainBalances } = useMultiChainBalances(address, isConnected);


  // For USDC, use multi-chain balances; for other tokens, use regular balance hook
  const { balance: fromBalanceRegular, loading: fromLoadingRegular } = useTokenBalance((fromToken === 'USDC') ? null : fromToken);
  const { balance: toBalanceRegular, loading: toLoadingRegular } = useTokenBalance((toToken === 'USDC') ? null : toToken);

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
  }, [chainId]); // Removed tokenList dependency

  // Reset selected tokens when network changes to ARC or Sepolia and ETH was selected
  useEffect(() => {
    const networksExcludingETH = [
      '0x4cef52', // ARC Testnet (5042002)
      '0xaa36a7' // Sepolia (11155111)
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
    // Slippage validation is now handled inside the SwapModal
  }, [slippage]);

  // Sync ToAmount when FromAmount changes (and it was the one edited)
  useEffect(() => {
    if (fromAmount && parseFloat(fromAmount) > 0) {
      if (swapState.expectedOut && swapState.expectedOut !== "0" && lastEditedField === 'from') {
        // Round to 2 decimal places for display
        const roundedAmount = parseFloat(swapState.expectedOut).toFixed(2);
        setToAmount(roundedAmount);
      }
    } else if (!fromAmount && !toAmount) {
      // Clear amounts if both are empty
    }
  }, [fromAmount, toAmount, swapState.expectedOut, swapState.price, lastEditedField]);

  // Handle bidirectional input
  const handleFromAmountChange = (val) => {
    setLastEditedField('from');
    setFromAmount(val);
    if (!val || parseFloat(val) <= 0) {
      setToAmount('');
    }
  };

  const handleToAmountChange = (val) => {
    const sanitized = sanitizeInput(val);
    setLastEditedField('to');
    setToAmount(sanitized);

    if (sanitized && parseFloat(sanitized) > 0) {
      // Calculate inverse amount based on current price
      if (swapState.price && parseFloat(swapState.price) > 0) {
        const price = parseFloat(swapState.price);
        const isBuying = fromToken === 'USDC';

        const calculatedFrom = isBuying
          ? (parseFloat(sanitized) * price).toFixed(2)
          : (parseFloat(sanitized) / price).toFixed(2);

        setFromAmount(calculatedFrom);
      }
    } else {
      setFromAmount('');
    }
  };

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
    window.open('https://faucet.circle.com/', '_blank');
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

    // Always open the confirmation modal, it will handle approval if needed
    setIsSwapModalOpen(true);
  };






  return (
    <div className="max-w-2xl mx-auto w-full">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="swap-container group"
      >
        {/* 4-Corner Splitted Glow System */}
        <div className={`absolute -top-20 -left-20 w-48 h-48 bg-gradient-to-br from-blue-500 to-blue-600 opacity-[0.04] dark:opacity-[0.1] group-hover:opacity-20 blur-[60px] transition-all duration-700 rounded-full`}></div>
        <div className={`absolute -top-20 -right-20 w-48 h-48 bg-gradient-to-bl from-blue-500 to-blue-600 opacity-[0.04] dark:opacity-[0.1] group-hover:opacity-20 blur-[60px] transition-all duration-700 rounded-full`}></div>
        <div className={`absolute -bottom-20 -left-20 w-48 h-48 bg-gradient-to-tr from-blue-500 to-blue-600 opacity-[0.04] dark:opacity-[0.1] group-hover:opacity-20 blur-[60px] transition-all duration-700 rounded-full`}></div>
        <div className={`absolute -bottom-20 -right-20 w-48 h-48 bg-gradient-to-tl from-blue-500 to-blue-600 opacity-[0.04] dark:opacity-[0.1] group-hover:opacity-20 blur-[60px] transition-all duration-700 rounded-full`}></div>

        <div className="relative z-10">
          {/* Header */}
          <div className="swap-header">
            <h2 className="swap-header-title">{t('Swap Tokens')}</h2>
            <div className="swap-header-actions">
              <button
                onClick={handleFaucetClick}
                className="swap-faucet-button-compact"
              >
                <span>Faucet</span>
              </button>

            </div>
          </div>

          {/* From Token */}
          <div className="swap-input-group">
            <div className="swap-input-header">
              <div className="swap-input-label">{t('From')}</div>
              {isConnected && (
                <div className="swap-balance-text">
                  {fromLoading ? (
                    <div className="skeleton w-16 h-4 rounded-md" />
                  ) : (
                    <span>
                      <span className="font-medium">{fromBalance || '0.00'}</span>
                    </span>
                  )}
                </div>
              )}
            </div>
            <div className="swap-input-row">
              <input
                type="text"
                inputMode="decimal"
                value={fromAmount}
                onChange={(e) => handleFromAmountChange(sanitizeInput(e.target.value))}
                placeholder="0.0"
                className="swap-amount-input"
              />
              <button
                ref={fromTokenTriggerRef}
                onClick={() => setShowFromSelector(true)}
                className="swap-token-selector"
              >
                <div className="swap-token-icon">
                  {getTokenIcon(fromToken) ? (
                    <img
                      src={getTokenIcon(fromToken)}
                      alt={fromToken}
                      className="w-full h-full rounded-full"
                    />
                  ) : (
                    <div className="w-full h-full rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                      <span className="text-[10px] font-bold">{fromToken}</span>
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
                  {toLoading ? (
                    <div className="skeleton w-16 h-4 rounded-md" />
                  ) : (
                    <span>
                      <span className="font-medium">{toBalance || '0.00'}</span>
                    </span>
                  )}
                </div>
              )}
            </div>
            <div className="swap-input-row">
              <input
                type="text"
                inputMode="decimal"
                value={toAmount}
                onChange={(e) => handleToAmountChange(e.target.value)}
                placeholder="0.0"
                className="swap-amount-input"
              />
              <button
                ref={toTokenTriggerRef}
                onClick={() => setShowToSelector(true)}
                className="swap-token-selector"
              >
                <div className="swap-token-icon">
                  {getTokenIcon(toToken) ? (
                    <img
                      src={getTokenIcon(toToken)}
                      alt={toToken}
                      className="w-full h-full rounded-full"
                    />
                  ) : (
                    <div className="w-full h-full rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                      <span className="text-[10px] font-bold">{toToken}</span>
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
                      setToast({ visible: true, type: 'warning', message: t('No balance available') });
                      setTimeout(() => setToast({ visible: false, type: 'info', message: '' }), 3000);
                      return;
                    }
                    // Set the "To" amount to maximum balance
                    // Note: This will trigger the swap calculation in reverse
                    setToAmount(toBalance);

                    // Calculate the required "From" amount based on the "To" amount
                    if (swapState.price && parseFloat(swapState.price) > 0) {
                      const price = parseFloat(swapState.price);
                      const isBuying = fromToken === 'USDC';

                      const calculatedFrom = isBuying
                        ? (parseFloat(toBalance) * price).toFixed(6)
                        : (parseFloat(toBalance) / price).toFixed(6);

                      setFromAmount(calculatedFrom);
                    }
                  }}
                  className="max-button"
                >
                  {t('Max')}
                </button>
              </div>
            )}
          </div>








          {/* Swap Button */}
          <button
            onClick={handleSwapClick}
            className={`swap-button ${(isConnected && parseFloat(fromAmount) > parseFloat(fromBalance)) ? 'swap-button-failed' : ''}`}
            disabled={!isConnected || !fromAmount || parseFloat(fromAmount) <= 0 || parseFloat(fromAmount) > parseFloat(fromBalance) || swapState.isLoading}
          >
            {!isConnected ? (
              <>
                <Wallet size={18} className="inline mr-2" />
                <span>{t('Connect Wallet')}</span>
              </>
            ) : parseFloat(fromAmount) > parseFloat(fromBalance) ? (
              <span>{t('Insufficient Balance')}</span>
            ) : swapState.isLoading ? (
              <div className="flex items-center justify-center gap-2">
                <Loader className="animate-spin" size={18} />
                <span>{swapState.isApproving ? 'Approving...' : 'Swapping...'}</span>
              </div>
            ) : swapState.needsApproval ? (
              <span>Approve {fromToken}</span>
            ) : (
              <span>Swap</span>
            )}
          </button>

          {/* Modals */}
          <SwapModal
            isOpen={isSwapModalOpen}
            onClose={() => {
              setIsSwapModalOpen(false);
              if (swapState.isSuccess) {
                setFromAmount('');
                setToAmount('');
              }
            }}
            onError={(error) => {
              const errorMsg = error?.message || error?.toString() || "";
              const isRejection =
                errorMsg.toLowerCase().includes('user rejected') ||
                errorMsg.toLowerCase().includes('user denied') ||
                errorMsg.toLowerCase().includes('action_rejected') ||
                errorMsg.toLowerCase().includes('request rejected') ||
                errorMsg.toLowerCase().includes('rejected by user') ||
                error?.name === 'UserRejectedRequestError' ||
                error?.code === 4001;

              setSwapError(error);
              setIsSwapModalOpen(false);

              if (isRejection) {
                setShowSwapRejectedModal(true);
              } else {
                setShowSwapFailedModal(true);
              }

              // Reset swap state after handling error
              if (swapState.reset) swapState.reset();
            }}
            onSuccess={(txHash) => {
              // Close swap modal and show success modal
              setLastSwapTxHash(txHash);
              const frozen = {
                fromToken: fromTokenObj,
                toToken: toTokenObj,
                fromAmount,
                toAmount: swapState.expectedOut || toAmount
              };
              setFrozenSwapData(frozen);
              setIsSwapModalOpen(false);
              setShowSwapSuccessModal(true);

              // Clear amounts
              setFromAmount('');
              setToAmount('');

              // Log transaction to history
              if (txHash && address) {
                const logTransaction = async () => {
                  try {
                    const history = await getItem('myTransactions') || [];
                    const exists = history.some(tx => tx.hash === txHash);
                    if (!exists) {
                      const newTx = {
                        id: txHash,
                        hash: txHash,
                        type: 'Swap',
                        from: `${frozen.fromAmount} ${frozen.fromToken?.symbol}`,
                        to: `${frozen.toAmount} ${frozen.toToken?.symbol}`,
                        amount: `${frozen.fromAmount} ${frozen.fromToken?.symbol} → ${frozen.toAmount} ${frozen.toToken?.symbol}`,
                        timestamp: Date.now(),
                        status: 'success',
                        address: address.toLowerCase(),
                        chainId: chainId
                      };
                      await setItem('myTransactions', [newTx, ...history].slice(0, 100));
                      window.dispatchEvent(new CustomEvent('swapTransactionSaved'));
                    }
                  } catch (err) {
                    console.error('Failed to log swap transaction:', err);
                  }
                };
                logTransaction();
              }

              // Reset swap state
              if (swapState.reset) swapState.reset();
            }}
            fromToken={TOKENS[fromToken]}
            toToken={TOKENS[toToken]}
            fromAmount={fromAmount}
            toAmount={toAmount}
            swapState={swapState}
            slippage={slippage}
            setSlippage={setSlippage}
          />

          {/* Swap Success Modal */}
          <SwapSuccessModal
            isOpen={showSwapSuccessModal}
            onClose={() => setShowSwapSuccessModal(false)}
            fromToken={frozenSwapData?.fromToken}
            toToken={frozenSwapData?.toToken}
            fromAmount={frozenSwapData?.fromAmount}
            toAmount={frozenSwapData?.toAmount}
            txHash={lastSwapTxHash}
          />

          {/* Swap Failed Modal */}
          <SwapFailedModal
            isOpen={showSwapFailedModal}
            onClose={() => setShowSwapFailedModal(false)}
            error={swapError}
            fromToken={fromTokenObj}
            toToken={toTokenObj}
          />
        </div>
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
        tokenList={tokenList}
        t={t}
        isConnected={isConnected}
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
        tokenList={tokenList}
        t={t}
        isConnected={isConnected}
      />

      {/* Toast Notifications */}
      <Toast
        type={toast.type}
        message={toast.message}
        visible={toast.visible}
        onClose={() => setToast({ ...toast, visible: false })}
      />

      {/* Swap Rejected Modal */}
      <SwapRejectedModal
        isOpen={showSwapRejectedModal}
        onClose={() => setShowSwapRejectedModal(false)}
        fromToken={frozenSwapData?.fromToken || fromTokenObj}
        toToken={frozenSwapData?.toToken || toTokenObj}
      />

    </div >
  );
};

export default Swap;