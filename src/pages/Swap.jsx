// =============================================================================
// SWAP PAGE
// This is the main swap screen where users trade one token for another.
// For example: swap USDC → STC, or STC → BALL, etc.
// =============================================================================

import { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { useWallet } from '../hooks/useWallet';
import { useAccount } from 'wagmi';
import { ArrowDownUp, Loader, Wallet, X, ChevronDown, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { TOKENS } from '../config/networks';
import { sanitizeInput, getFilteredTokens } from '../utils/blockchain';
import { CHAINS } from '../config/constants';
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


// =============================================================================
// FAUCET ICON
// A small water-drop icon used on the "Get tokens from faucet" button.
// =============================================================================
const FaucetIcon = ({ size = 16, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    {/* Water droplet shape */}
    <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
  </svg>
);


// =============================================================================
// GET TOKEN ICON
// Returns the image path for a token's logo based on its symbol.
// If no image is found, we'll fall back to showing the first letter of the token.
// =============================================================================
const getTokenIcon = (symbol) => {
  if (!symbol) return null;

  const s = String(symbol).toUpperCase();

  // Icon file paths for each supported token
  const iconMap = {
    USDC: '/icons/usdc.png',
    STC: '/icons/stc.png',
    STAC: '/icons/stc.png',
    BALL: '/icons/ball.png',
    MTB: '/icons/mtb.png',
    ECR: '/icons/ecr.png',
    EURC: '/icons/eurc.png',
    ETH: '/icons/eth.png',
  };

  // Special handling for tokens that share an icon
  if (s.includes('MTB')) return '/icons/mtb.png';
  if (s.includes('STC') || s.includes('STAC')) return '/icons/stc.png';

  return iconMap[s] || null;
};


// =============================================================================
// TOKEN ROW
// A single row in the token selection list (inside the token picker modal).
// Shows the token's icon, name, symbol, and the user's current balance.
// =============================================================================
const TokenRow = ({ token, selectedToken, exclude, onSelect, onClose, isConnected, t }) => {
  // Fetch the user's balance for this token
  const { balance: tokenBalance, loading: tokenLoading } = useTokenBalance(token.symbol);

  const isSelected = token.symbol === selectedToken; // Highlight if this is already chosen
  const isExcluded = token.symbol === exclude;       // Dim if already used on the other side

  return (
    <button
      disabled={isExcluded}
      onClick={() => {
        onSelect(token.symbol);
        onClose();
      }}
      className={`swap-token-selector-list-item ${isSelected ? 'selected' : ''} ${isExcluded ? 'disabled' : ''}`}
    >
      {/* Left side: icon + name */}
      <div className="swap-token-selector-list-item-content">
        <div className="swap-token-selector-list-icon">
          {getTokenIcon(token.symbol) ? (
            <img src={getTokenIcon(token.symbol)} alt={token.symbol} className="w-full h-full object-cover" />
          ) : (
            // Fallback: show first letter of token symbol
            <span className="flex items-center justify-center w-full h-full text-sm font-medium uppercase">
              {token.symbol?.charAt(0)}
            </span>
          )}
        </div>
        <div className="swap-token-selector-list-info">
          <p className="swap-token-selector-list-symbol">{token.symbol || t('Unknown')}</p>
          <p className="swap-token-selector-list-name">{token.name || t('Token')}</p>
        </div>
      </div>

      {/* Right side: user's balance (only shown if wallet is connected) */}
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
            <p className="swap-token-selector-list-balance-label">{t('Balance')}</p>
          </div>
        )}
      </div>
    </button>
  );
};


// =============================================================================
// TOKEN SELECTOR MODAL
// The popup panel that lets users search and pick a token.
// Renders as a portal (floating above everything) using React's createPortal.
// =============================================================================
const TokenSelector = ({ isOpen, onClose, selectedToken, onSelect, exclude, tokenList, t, isConnected }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const selectorRef = useRef(null);

  // Wait 400ms after the user stops typing before filtering results.
  // This prevents flickering with every keystroke.
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Filter the full token list based on what the user typed.
  // Matches on symbol, name, or contract address.
  const filteredTokens = useMemo(() => {
    if (!debouncedSearch) return tokenList;

    const query = debouncedSearch.toLowerCase();
    return tokenList.filter(token =>
      token?.symbol &&
      typeof token.symbol === 'string' &&
      (
        token.symbol.toLowerCase().includes(query) ||
        (token.name && typeof token.name === 'string' && token.name.toLowerCase().includes(query)) ||
        (token.address && typeof token.address === 'string' && token.address.toLowerCase().includes(query)) ||
        (token.address && typeof token.address === 'object' &&
          Object.values(token.address).some(addr => typeof addr === 'string' && addr.toLowerCase().includes(query)))
      )
    );
  }, [debouncedSearch, tokenList]);

  // These are the "pinned" tokens shown at the top for quick access.
  const popularTokens = useMemo(() =>
    tokenList.filter(token =>
      token?.symbol &&
      typeof token.symbol === 'string' &&
      ['USDC', 'STC', 'BALL', 'MTB', 'ECR'].includes(token.symbol)
    ),
    [tokenList]
  );

  // Close the modal when the user presses the Escape key
  useEffect(() => {
    const handleEsc = (e) => { if (e.keyCode === 27) onClose(); };
    if (isOpen) document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  // Render the modal into the <body> element so it floats above all other content
  return createPortal(
    <AnimatePresence>
      {isOpen && (
        // Backdrop (dimmed background overlay)
        <motion.div
          className="swap-token-selector-modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
          style={{ zIndex: 100000 }}
        >
          {/* Modal card — stop click from bubbling to backdrop */}
          <motion.div
            ref={selectorRef}
            className="swap-token-selector-modal"
            initial={{ scale: 0.9, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 10 }}
            transition={{ type: 'spring', damping: 25, stiffness: 400 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="swap-token-selector-header">
              <h3 className="swap-token-selector-title">{t('Select Token')}</h3>
              <button onClick={onClose} className="swap-token-selector-close-button">
                <X size={18} />
              </button>
            </div>

            {/* Search bar */}
            <div className="px-5 py-4">
              <div className="relative group">
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-slate-800 dark:group-focus-within:text-white transition-colors duration-200">
                  <Search size={16} />
                </div>
                <input
                  type="text"
                  placeholder={t('Search name or paste address')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-50/50 dark:bg-white/[0.02] border border-slate-200/60 dark:border-white/5 rounded-2xl pl-11 pr-4 py-3 text-[14px] outline-none group-hover:bg-white dark:group-hover:bg-white/[0.04] focus:bg-white dark:focus:bg-white/[0.06] focus:border-black/20 dark:focus:border-white/20 focus:ring-4 focus:ring-black/5 dark:focus:ring-white/5 transition-all duration-300 placeholder:text-slate-400 dark:placeholder:text-slate-600 shadow-sm"
                />
              </div>
            </div>

            {/* Quick-pick / popular tokens row */}
            <div className="swap-token-selector-popular-section">
              <h4 className="swap-token-selector-popular-label">{t('Your Tokens')}</h4>
              <div className="swap-token-selector-popular-tokens">
                {popularTokens.map((token) => {
                  if (!token?.symbol || typeof token.symbol !== 'string') return null;

                  const isExcluded = token.symbol === exclude;
                  const isSelected = token.symbol === selectedToken;

                  return (
                    <button
                      key={`popular-${token.symbol}`}
                      onClick={() => { onSelect(token.symbol); onClose(); }}
                      className={`swap-token-selector-popular-button ${isSelected ? 'active' : ''} ${isExcluded ? 'disabled' : ''}`}
                    >
                      {getTokenIcon(token.symbol) ? (
                        <img
                          src={getTokenIcon(token.symbol)}
                          alt={token.symbol}
                          loading="lazy"
                          decoding="async"
                          className="swap-token-selector-popular-icon"
                        />
                      ) : (
                        <div className="swap-token-selector-popular-icon" style={{ background: 'var(--swap-surface-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <span style={{ fontSize: '12px', fontWeight: 500 }}>
                            {token.symbol?.length > 0 ? token.symbol.charAt(0) : '?'}
                          </span>
                        </div>
                      )}
                      <span className="swap-token-selector-popular-symbol">{token.symbol}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Full scrollable token list */}
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

              {/* "No results" message when search has no matches */}
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


// =============================================================================
// SWAP PAGE — MAIN COMPONENT
// This is the heart of the swap feature. It manages all state for the swap
// interface: which tokens are selected, how much to swap, and what modals
// are open. It calls the useSwap hook to get price quotes and execute trades.
// =============================================================================
const Swap = () => {
  const { t } = useTranslation();
  const { isConnected, chainId, status } = useWallet();
  const { address } = useAccount();
  const { setIsFocusedModalOpen } = useModal();

  // ─── Ghost-state protection ───────────────────────────────────────────────
  // On page refresh, wagmi briefly reports "disconnected" before it finishes
  // reconnecting. We capture the true connected-state on first load (from
  // localStorage) so the UI never flashes "Connect Wallet" for returning users.
  const wasConnectedRef = useRef(
    typeof window !== 'undefined' ? localStorage.getItem('walletConnected') === 'true' : false
  );
  const wasConnected = wasConnectedRef.current;


  // ─── Which tokens the user has selected ───────────────────────────────────
  const [fromToken, setFromToken] = useState('USDC'); // Token the user is swapping FROM
  const [toToken, setToToken] = useState('STC');  // Token the user is swapping TO


  // ─── Amount fields ─────────────────────────────────────────────────────────
  const [fromAmount, setFromAmount] = useState('');
  const [toAmount, setToAmount] = useState('');
  const [lastEditedField, setLastEditedField] = useState('from'); // which input the user last typed in
  const [debouncedFromAmount, setDebouncedFromAmount] = useState('');  // delayed fromAmount (avoids too many RPC calls)

  // Wait 500ms after the user stops typing before recalculating the swap quote.
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedFromAmount(fromAmount), 500);
    return () => clearTimeout(timer);
  }, [fromAmount]);


  // ─── Slippage ──────────────────────────────────────────────────────────────
  // Slippage is the max % price movement the user will accept during the swap.
  // E.g. 0.5 means they'll accept a price up to 0.5% worse than the quoted price.
  const [slippage, setSlippage] = useState(0.5);


  // ─── Token Selector modals ─────────────────────────────────────────────────
  const [showFromSelector, setShowFromSelector] = useState(false); // "pick token to send"
  const [showToSelector, setShowToSelector] = useState(false); // "pick token to receive"


  // ─── Transaction modal states ──────────────────────────────────────────────
  // These control which confirmation/result popup is currently visible.
  const [isSwapModalOpen, setIsSwapModalOpen] = useState(false); // Swap confirmation
  const [showSwapSuccessModal, setShowSwapSuccessModal] = useState(false); // ✅ Success
  const [showSwapFailedModal, setShowSwapFailedModal] = useState(false); // ❌ Failed
  const [showSwapRejectedModal, setShowSwapRejectedModal] = useState(false); // 🚫 User rejected
  const [lastSwapTxHash, setLastSwapTxHash] = useState(null);  // transaction hash to show in success modal
  const [swapError, setSwapError] = useState(null);  // error message to show in failed modal
  const [frozenSwapData, setFrozenSwapData] = useState(null);  // snapshot of swap details at the moment of success


  // ─── Toast notifications ───────────────────────────────────────────────────
  // A small banner that pops up at the bottom for warnings/errors.
  const [toast, setToast] = useState({ visible: false, type: 'info', message: '' });

  // Helper to show a toast and auto-dismiss it after 3 seconds
  const showToast = (type, message, duration = 3000) => {
    setToast({ visible: true, type, message });
    setTimeout(() => setToast({ visible: false, type: 'info', message: '' }), duration);
  };


  // ─── Tell the layout when a focused modal is open ─────────────────────────
  // The layout uses this to hide/show certain elements while modals are active.
  useEffect(() => {
    const anyModalOpen =
      isSwapModalOpen ||
      showFromSelector ||
      showToSelector ||
      showSwapSuccessModal ||
      showSwapFailedModal ||
      showSwapRejectedModal;

    setIsFocusedModalOpen(anyModalOpen);

    // Always clean up when this component unmounts
    return () => setIsFocusedModalOpen(false);
  }, [
    isSwapModalOpen,
    showFromSelector,
    showToSelector,
    showSwapSuccessModal,
    showSwapFailedModal,
    showSwapRejectedModal,
    setIsFocusedModalOpen,
  ]);


  // ─── Token objects ─────────────────────────────────────────────────────────
  // Convert the selected symbol strings ("USDC", "STC"…) into full token data objects.
  const fromTokenObj = useMemo(() => TOKENS[fromToken], [fromToken]);
  const toTokenObj = useMemo(() => TOKENS[toToken], [toToken]);


  // ─── Swap hook ─────────────────────────────────────────────────────────────
  // This hook does all the heavy lifting: getting price quotes from the DEX
  // contract, handling approvals, and executing the actual swap transaction.
  const swapState = useSwap(fromToken, toToken, debouncedFromAmount, slippage);


  // ─── Button refs ───────────────────────────────────────────────────────────
  // Used internally to attach the token selector popup to the right button.
  const fromTokenTriggerRef = useRef(null);
  const toTokenTriggerRef = useRef(null);


  // ─── Balances ──────────────────────────────────────────────────────────────
  // USDC is a special case: its balance is fetched per-chain (Arc / Sepolia / Base Sepolia).
  // All other tokens use a simpler single-chain balance hook.
  const { balances: multiChainBalances } = useMultiChainBalances(address, isConnected);
  const { balance: fromBalanceRegular, loading: fromLoadingRegular } = useTokenBalance(fromToken === 'USDC' ? null : fromToken);
  const { balance: toBalanceRegular, loading: toLoadingRegular } = useTokenBalance(toToken === 'USDC' ? null : toToken);

  // Returns the balance + loading state for the "From" token on the correct chain
  const getFromBalance = () => {
    if (fromToken === 'USDC') {
      const chainIdNum = chainId ? parseInt(chainId, 16) : null;
      const key = 'usdc';
      if (chainIdNum === 5042002) return { balance: multiChainBalances?.arcTestnet?.[key] || '0.00', loading: multiChainBalances?.arcTestnet?.loading || false };
      if (chainIdNum === 11155111) return { balance: multiChainBalances?.sepolia?.[key] || '0.00', loading: multiChainBalances?.sepolia?.loading || false };
      if (chainIdNum === 84532) return { balance: multiChainBalances?.baseSepolia?.[key] || '0.00', loading: multiChainBalances?.baseSepolia?.loading || false };
      return { balance: '0.00', loading: false };
    }
    return { balance: fromBalanceRegular || '0.00', loading: fromLoadingRegular || false };
  };

  // Returns the balance + loading state for the "To" token on the correct chain
  const getToBalance = () => {
    if (toToken === 'USDC') {
      const chainIdNum = chainId ? parseInt(chainId, 16) : null;
      const key = 'usdc';
      if (chainIdNum === 5042002) return { balance: multiChainBalances?.arcTestnet?.[key] || '0.00', loading: multiChainBalances?.arcTestnet?.loading || false };
      if (chainIdNum === 11155111) return { balance: multiChainBalances?.sepolia?.[key] || '0.00', loading: multiChainBalances?.sepolia?.loading || false };
      if (chainIdNum === 84532) return { balance: multiChainBalances?.baseSepolia?.[key] || '0.00', loading: multiChainBalances?.baseSepolia?.loading || false };
      return { balance: '0.00', loading: false };
    }
    return { balance: toBalanceRegular || '0.00', loading: toLoadingRegular || false };
  };

  const { balance: fromBalance, loading: fromLoading } = getFromBalance();
  const { balance: toBalance, loading: toLoading } = getToBalance();


  // ─── Available token list ──────────────────────────────────────────────────
  // Filters the full token registry down to only the tokens supported on the
  // user's current chain, and removes any tokens with missing data.
  const tokenList = useMemo(() => {
    try {
      const allTokens = Object.values(TOKENS);
      const filtered = getFilteredTokens(allTokens, chainId);
      return Array.isArray(filtered)
        ? filtered.filter(t => t && typeof t === 'object' && t.symbol && typeof t.symbol === 'string' && t.symbol.length > 0)
        : [];
    } catch (err) {
      console.error('Error building token list:', err);
      return [];
    }
  }, [chainId]);


  // ─── Reset tokens when switching chains ───────────────────────────────────
  // ETH is not available on Arc Testnet or Sepolia — reset to USDC if selected.
  useEffect(() => {
    const networksWithoutETH = [
      '0x4cef52', // Arc Testnet (chain ID 5042002)
      '0xaa36a7', // Sepolia     (chain ID 11155111)
    ];
    if (networksWithoutETH.includes(chainId)) {
      if (fromToken === 'ETH') setFromToken('USDC');
      if (toToken === 'ETH') setToToken('USDC');
    }
  }, [chainId, fromToken, toToken]);


  // ─── Sync "To" amount when swap quote updates ─────────────────────────────
  // When the user types a "From" amount and the DEX hook returns a quote,
  // automatically fill in the estimated "To" amount.
  useEffect(() => {
    if (fromAmount && parseFloat(fromAmount) > 0) {
      if (swapState.expectedOut && swapState.expectedOut !== '0' && lastEditedField === 'from') {
        setToAmount(parseFloat(swapState.expectedOut).toFixed(2));
      }
    }
  }, [fromAmount, toAmount, swapState.expectedOut, swapState.price, lastEditedField]);


  // =============================================================================
  // EVENT HANDLERS
  // =============================================================================

  // Called every time the user types in the "From" input
  const handleFromAmountChange = (val) => {
    setLastEditedField('from');
    setFromAmount(val);
    if (!val || parseFloat(val) <= 0) setToAmount('');
  };

  // Called every time the user types in the "To" input.
  // We reverse-calculate what the "From" amount should be based on current price.
  const handleToAmountChange = (val) => {
    const sanitized = sanitizeInput(val);
    setLastEditedField('to');
    setToAmount(sanitized);

    if (sanitized && parseFloat(sanitized) > 0 && swapState.price && parseFloat(swapState.price) > 0) {
      const price = parseFloat(swapState.price);
      const isBuying = fromToken === 'USDC'; // buying means paying USDC to get another token
      const calcFrom = isBuying
        ? (parseFloat(sanitized) * price).toFixed(2)   // how much USDC to spend
        : (parseFloat(sanitized) / price).toFixed(2);  // how much token to spend
      setFromAmount(calcFrom);
    } else {
      setFromAmount('');
    }
  };

  // Swap the two tokens (flip "From" ↔ "To") and also flip their amounts
  const handleSwitch = () => {
    // Animate the switch button with a quick CSS rotation
    const btn = document.querySelector('.switch-button');
    if (btn) {
      btn.classList.add('rotate-180');
      setTimeout(() => btn.classList.remove('rotate-180'), 300);
    }
    setFromToken(toToken);
    setToToken(fromToken);
    setFromAmount(toAmount);
    setToAmount(fromAmount);
  };

  // Fill the "From" field with the user's entire balance (minus a gas buffer on Arc)
  const handleMaxClick = () => {
    if (!fromBalance || parseFloat(fromBalance) === 0) {
      showToast('warning', t('No balance available'));
      return;
    }

    // Arc Testnet uses USDC for gas fees. If the user is swapping USDC on Arc,
    // we automatically reserve 1.5 USDC so the transaction doesn't fail.
    const chainIdNum = chainId ? (typeof chainId === 'string' ? parseInt(chainId, 16) : chainId) : null;
    if (chainIdNum === CHAINS.ARC_TESTNET && fromToken === 'USDC') {
      const balance = parseFloat(fromBalance);
      const buffer = 1.5; // USDC reserved for gas

      if (balance <= buffer) {
        showToast('error', `Insufficient balance for gas. Keep at least ${buffer} USDC for Arc fees.`);
        return;
      }
      // Set the max amount with the gas buffer already deducted (no notification needed)
      setFromAmount((balance - buffer).toFixed(2));
    } else {
      // On all other chains/tokens, use the full balance
      setFromAmount(fromBalance);
    }
  };

  // Open Circle's faucet in a new tab so the user can get testnet tokens
  const handleFaucetClick = (e) => {
    e.preventDefault();
    window.open('https://faucet.circle.com/', '_blank');
  };

  // Called when the user clicks the main "Swap" button
  const handleSwapClick = () => {
    if (!isConnected) {
      showToast('error', t('connectWalletFirst'));
      return;
    }
    if (!fromAmount || parseFloat(fromAmount) <= 0) {
      showToast('error', t('Please enter a valid amount'));
      return;
    }
    // Open the confirmation modal — it handles approvals + execution
    setIsSwapModalOpen(true);
  };

  // Called when the swap confirmation modal reports an error
  const handleSwapError = (error) => {
    const errorMsg = swapState.error || error?.message || error?.toString() || '';
    const lower = errorMsg.toLowerCase();

    // Detect if the user deliberately rejected the wallet prompt
    const isRejection =
      lower.includes('user rejected') ||
      lower.includes('user denied') ||
      lower.includes('action_rejected') ||
      lower.includes('request rejected') ||
      lower.includes('rejected by user') ||
      error?.name === 'UserRejectedRequestError' ||
      error?.code === 4001;

    setSwapError(errorMsg);
    setIsSwapModalOpen(false);

    if (isRejection) {
      setShowSwapRejectedModal(true); // Show "you cancelled" modal
    } else {
      setShowSwapFailedModal(true);   // Show "something went wrong" modal
    }

    if (swapState.reset) swapState.reset();
  };

  // Called when the swap confirmation modal reports a successful transaction
  const handleSwapSuccess = (txHash) => {
    // Snapshot the swap details so the success modal shows correct info
    // even after the user clears the fields
    const frozen = {
      fromToken: fromTokenObj,
      toToken: toTokenObj,
      fromAmount,
      toAmount: swapState.expectedOut || toAmount,
    };

    setLastSwapTxHash(txHash);
    setFrozenSwapData(frozen);
    setIsSwapModalOpen(false);
    setShowSwapSuccessModal(true);

    // Clear the swap inputs for the next trade
    setFromAmount('');
    setToAmount('');

    // Save this transaction to the local history (stored in IndexedDB)
    if (txHash && address) {
      const logTransaction = async () => {
        try {
          const history = await getItem('myTransactions') || [];
          const alreadySaved = history.some(tx => tx.hash === txHash);

          if (!alreadySaved) {
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
              chainId,
            };
            // Keep only the last 100 transactions
            await setItem('myTransactions', [newTx, ...history].slice(0, 100));
            // Notify the Transactions page that new data is available
            window.dispatchEvent(new CustomEvent('swapTransactionSaved'));
          }
        } catch (err) {
          console.error('Failed to save swap transaction to history:', err);
        }
      };
      logTransaction();
    }

    if (swapState.reset) swapState.reset();
  };


  // =============================================================================
  // RENDER
  // =============================================================================
  return (
    <div className="max-w-2xl mx-auto w-full">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="swap-container group"
      >
        {/* Subtle corner glow effect — desktop only, invisible in light mode */}
        <div className="hidden md:block absolute -top-20    -left-20  w-48 h-48 bg-gradient-to-br from-slate-300 to-slate-400 opacity-0 dark:opacity-[0.1] blur-[60px] rounded-full" />
        <div className="hidden md:block absolute -top-20    -right-20 w-48 h-48 bg-gradient-to-bl from-slate-300 to-slate-400 opacity-0 dark:opacity-[0.1] blur-[60px] rounded-full" />
        <div className="hidden md:block absolute -bottom-20 -left-20  w-48 h-48 bg-gradient-to-tr from-slate-300 to-slate-400 opacity-0 dark:opacity-[0.1] blur-[60px] rounded-full" />
        <div className="hidden md:block absolute -bottom-20 -right-20 w-48 h-48 bg-gradient-to-tl from-slate-300 to-slate-400 opacity-0 dark:opacity-[0.1] blur-[60px] rounded-full" />

        <div className="relative z-10">

          {/* ── Header ─────────────────────────────────────────────────────── */}
          <div className="swap-header">
            <h2 className="swap-header-title">{t('Swap Tokens')}</h2>
            <div className="swap-header-actions">
              {/* Link to Circle's testnet faucet for getting test tokens */}
              <button onClick={handleFaucetClick} className="swap-faucet-button-premium group/faucet">
                <FaucetIcon size={14} className="text-black dark:text-white transition-colors" />
                <span>{t('Faucet')}</span>
              </button>
            </div>
          </div>

          {/* ── "From" Token Input ─────────────────────────────────────────── */}
          <div className="swap-input-group">
            <div className="swap-input-header">
              <div className="swap-input-label">{t('From')}</div>
              {/* Show the user's balance of the "from" token */}
              {isConnected && (
                <div className="swap-balance-text">
                  {fromLoading
                    ? <div className="skeleton w-16 h-4 rounded-md" />
                    : <span><span className="font-medium">{fromBalance || '0.00'}</span></span>
                  }
                </div>
              )}
            </div>

            <div className="swap-input-row">
              {/* Amount the user wants to send */}
              <input
                type="text"
                inputMode="decimal"
                value={fromAmount}
                onChange={(e) => handleFromAmountChange(sanitizeInput(e.target.value))}
                placeholder="0.0"
                className="swap-amount-input"
              />
              {/* Token picker button */}
              <button
                ref={fromTokenTriggerRef}
                onClick={() => setShowFromSelector(true)}
                className="swap-token-selector"
              >
                <div className="swap-token-icon">
                  {getTokenIcon(fromToken) ? (
                    <img src={getTokenIcon(fromToken)} alt={fromToken} className="w-full h-full rounded-full" />
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

            {/* "Max" button — fills in the user's full sendable balance */}
            {isConnected && (
              <div className="flex items-center justify-end mt-2">
                <button onClick={handleMaxClick} className="max-button">{t('Max')}</button>
              </div>
            )}
          </div>

          {/* ── Switch Button (flip From ↔ To) ─────────────────────────────── */}
          <div className="swap-direction-container">
            <button onClick={handleSwitch} className="swap-direction-button">
              <ArrowDownUp size={18} />
            </button>
          </div>

          {/* ── "To" Token Input ───────────────────────────────────────────── */}
          <div className="swap-input-group">
            <div className="swap-input-header">
              <div className="swap-input-label">{t('To')}</div>
              {/* Show the user's balance of the "to" token */}
              {isConnected && (
                <div className="swap-balance-text">
                  {toLoading
                    ? <div className="skeleton w-16 h-4 rounded-md" />
                    : <span><span className="font-medium">{toBalance || '0.00'}</span></span>
                  }
                </div>
              )}
            </div>

            <div className="swap-input-row">
              {/* Estimated amount the user will receive */}
              <input
                type="text"
                inputMode="decimal"
                value={toAmount}
                onChange={(e) => handleToAmountChange(e.target.value)}
                placeholder="0.0"
                className="swap-amount-input"
              />
              {/* Token picker button */}
              <button
                ref={toTokenTriggerRef}
                onClick={() => setShowToSelector(true)}
                className="swap-token-selector"
              >
                <div className="swap-token-icon">
                  {getTokenIcon(toToken) ? (
                    <img src={getTokenIcon(toToken)} alt={toToken} className="w-full h-full rounded-full" />
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

            {/* "Max" button for the "To" field — reverse-calculates the required "From" amount */}
            {isConnected && (
              <div className="flex items-center justify-end mt-2">
                <button
                  className="max-button"
                  onClick={() => {
                    if (!toBalance || parseFloat(toBalance) === 0) {
                      showToast('warning', t('No balance available'));
                      return;
                    }
                    setToAmount(toBalance);

                    // Calculate how much "From" token is needed to receive the full "To" balance
                    if (swapState.price && parseFloat(swapState.price) > 0) {
                      const price = parseFloat(swapState.price);
                      const isBuying = fromToken === 'USDC';
                      const calcFrom = isBuying
                        ? (parseFloat(toBalance) * price).toFixed(6)
                        : (parseFloat(toBalance) / price).toFixed(6);
                      setFromAmount(calcFrom);
                    }
                  }}
                >
                  {t('Max')}
                </button>
              </div>
            )}
          </div>


          {/* ── Main Swap / Connect Button ─────────────────────────────────── */}
          {/*
            Button states (in priority order):
            1. Reconnecting to wallet → show "Swap" (disabled, waiting)
            2. Wallet not connected   → show "Connect Wallet"
            3. Insufficient balance   → show "Insufficient Balance" in red
            4. Swap is executing      → show spinner + "Swapping..." or "Approving..."
            5. Token approval needed  → show "Approve [token]"
            6. Ready to swap          → show "Swap"
          */}
          <button
            onClick={handleSwapClick}
            className={`swap-button ${(isConnected && parseFloat(fromAmount) > parseFloat(fromBalance)) ? 'swap-button-failed' : ''}`}
            disabled={
              (status === 'disconnected' && !wasConnected) ||
              !fromAmount ||
              parseFloat(fromAmount) <= 0 ||
              parseFloat(fromAmount) > parseFloat(fromBalance) ||
              swapState.isLoading ||
              status === 'reconnecting' ||
              status === 'connecting'
            }
          >
            {(status === 'reconnecting' || status === 'connecting' || wasConnected) && !isConnected ? (
              // Wallet is in the process of reconnecting (e.g. after page refresh)
              <div className="flex items-center justify-center"><span>{t('Swap')}</span></div>
            ) : status === 'disconnected' ? (
              // No wallet connected at all
              <><Wallet size={18} className="inline mr-2" /><span>{t('Connect Wallet')}</span></>
            ) : parseFloat(fromAmount) > parseFloat(fromBalance) ? (
              // User typed more than they have
              <span>{t('Insufficient Balance')}</span>
            ) : swapState.isLoading ? (
              // Swap transaction is in flight
              <div className="flex items-center justify-center gap-2">
                <Loader className="animate-spin" size={18} />
                <span>{swapState.isApproving ? t('Approving...') : t('Swapping...')}</span>
              </div>
            ) : swapState.needsApproval ? (
              // Token allowance must be set before swapping
              <span>{t('Approve')} {fromToken}</span>
            ) : (
              // All good — ready to swap
              <span>{t('Swap')}</span>
            )}
          </button>


          {/* ── Modals ─────────────────────────────────────────────────────── */}

          {/* Swap confirmation + execution modal */}
          <SwapModal
            isOpen={isSwapModalOpen}
            onClose={() => {
              setIsSwapModalOpen(false);
              if (swapState.isSuccess) { setFromAmount(''); setToAmount(''); }
            }}
            onError={handleSwapError}
            onSuccess={handleSwapSuccess}
            fromToken={TOKENS[fromToken]}
            toToken={TOKENS[toToken]}
            fromAmount={fromAmount}
            toAmount={toAmount}
            swapState={swapState}
            slippage={slippage}
            setSlippage={setSlippage}
          />

          {/* ✅ Success modal */}
          <SwapSuccessModal
            isOpen={showSwapSuccessModal}
            onClose={() => setShowSwapSuccessModal(false)}
            fromToken={frozenSwapData?.fromToken}
            toToken={frozenSwapData?.toToken}
            fromAmount={frozenSwapData?.fromAmount}
            toAmount={frozenSwapData?.toAmount}
            txHash={lastSwapTxHash}
          />

          {/* ❌ Failed modal */}
          <SwapFailedModal
            isOpen={showSwapFailedModal}
            onClose={() => setShowSwapFailedModal(false)}
            error={swapError}
            fromToken={fromTokenObj}
            toToken={toTokenObj}
          />
        </div>
      </motion.div>


      {/* ── Token Selector Popups ───────────────────────────────────────────── */}

      {/* "From" token picker */}
      <TokenSelector
        isOpen={showFromSelector}
        onClose={() => setShowFromSelector(false)}
        selectedToken={fromToken}
        onSelect={(token) => {
          // If the user picks the same token as "To", just swap them
          if (token === toToken) handleSwitch();
          else setFromToken(token);
        }}
        exclude={toToken}
        tokenList={tokenList}
        t={t}
        isConnected={isConnected}
      />

      {/* "To" token picker */}
      <TokenSelector
        isOpen={showToSelector}
        onClose={() => setShowToSelector(false)}
        selectedToken={toToken}
        onSelect={(token) => {
          if (token === fromToken) handleSwitch();
          else setToToken(token);
        }}
        exclude={fromToken}
        tokenList={tokenList}
        t={t}
        isConnected={isConnected}
      />


      {/* ── Toast Notifications ─────────────────────────────────────────────── */}
      <Toast
        type={toast.type}
        message={toast.message}
        visible={toast.visible}
        onClose={() => setToast({ ...toast, visible: false })}
      />

      {/* 🚫 User rejected modal */}
      <SwapRejectedModal
        isOpen={showSwapRejectedModal}
        onClose={() => setShowSwapRejectedModal(false)}
        fromToken={frozenSwapData?.fromToken || fromTokenObj}
        toToken={frozenSwapData?.toToken || toTokenObj}
      />
    </div>
  );
};

export default Swap;