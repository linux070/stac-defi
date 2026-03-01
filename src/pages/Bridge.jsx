// =============================================================================
// BRIDGE PAGE
// This page lets users move USDC from one blockchain network to another.
// For example: from Sepolia (Ethereum testnet) → Arc Testnet, or vice versa.
// It uses Circle's CCTP (Cross-Chain Transfer Protocol) under the hood.
// =============================================================================

import { useState, useRef, useEffect, useCallback, memo } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { useWallet } from '../hooks/useWallet';
import { useSwitchChain, useChains } from 'wagmi';
import { ArrowRight, Loader, Wallet, X, ChevronDown, Search, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { NETWORKS } from '../config/networks';
import { sanitizeInput } from '../utils/blockchain';
import { useBridge } from '../hooks/useBridge';
import { getItem, setItem } from '../utils/indexedDB';
import BridgingModal from '../components/BridgingModal';
import BridgeFailedModal from '../components/BridgeFailedModal';
import BridgeSuccessModal from '../components/BridgeSuccessModal';
import BridgeRejectedModal from '../components/BridgeRejectedModal';
import BridgeCancelledModal from '../components/BridgeCancelledModal';
import '../styles/bridge-styles.css';
import { useModal } from '../contexts/ModalContext';


// =============================================================================
// CHAIN SELECTOR MODAL
// The popup that lets users pick a source or destination blockchain network.
// Supports search so users can quickly find a specific chain by name.
// =============================================================================
const ChainSelector = ({ isOpen, onClose, selectedChain, onSelect, exclude }) => {
  const { t } = useTranslation();
  const selectorRef = useRef(null);
  const inputRef = useRef(null);
  const chains = useChains(); // All chains registered in wagmi config
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Wait 400ms after typing before filtering — avoids flicker on every keystroke
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // When the modal opens, clear the search field and auto-focus the input
  useEffect(() => {
    if (isOpen) {
      setSearchQuery('');
      setDebouncedSearch('');
      const timer = setTimeout(() => inputRef.current?.focus(), 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Close the modal when the user presses the Escape key
  useEffect(() => {
    const handleEsc = (e) => { if (e?.key === 'Escape') onClose(); };
    if (isOpen) document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  // The three supported networks for bridging
  const chainList = ['Arc Testnet', 'Sepolia', 'Base Sepolia'];

  // Filter by what the user typed in the search box
  const filteredChains = chainList.filter(chain =>
    chain.toLowerCase().includes(debouncedSearch.toLowerCase())
  );

  // Render the modal into <body> so it floats above all other content
  return createPortal(
    <AnimatePresence>
      {isOpen && (
        // Backdrop
        <motion.div
          className="bridge-selector-modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          style={{ zIndex: 100000 }}
        >
          {/* Modal card */}
          <motion.div
            ref={selectorRef}
            className="bridge-selector-modal border border-slate-200/50 dark:border-white/10"
            initial={{ scale: 0.95, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 10 }}
            transition={{ type: 'spring', damping: 25, stiffness: 400 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="bridge-selector-header">
              <h3 className="bridge-selector-title">{t('Select Network')}</h3>
              <button onClick={onClose} className="bridge-selector-close-button transition-all hover:rotate-90">
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
                  ref={inputRef}
                  type="text"
                  placeholder={t('Search network name or paste address')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-50/50 dark:bg-white/[0.02] border border-slate-200/60 dark:border-white/5 rounded-2xl pl-11 pr-4 py-3 text-[14px] outline-none group-hover:bg-white dark:group-hover:bg-white/[0.04] focus:bg-white dark:focus:bg-white/[0.06] focus:border-black/20 dark:focus:border-white/20 focus:ring-4 focus:ring-black/5 dark:focus:ring-white/5 transition-all duration-300 placeholder:text-slate-400 dark:placeholder:text-slate-600 shadow-sm"
                />
              </div>
            </div>

            {/* Scrollable list of networks */}
            <div className="bridge-selector-list overflow-y-auto" style={{ maxHeight: '42vh' }}>
              <div className="space-y-1">
                {filteredChains.map((chainName) => {
                  const isExcluded = chainName === exclude;   // Can't pick the same chain as the other side
                  const isSelected = chainName === selectedChain;

                  // Try to find a matching chain from wagmi's registered list to get its icon
                  const chainObj = chains.find(c => {
                    const name = (c.name || '').toLowerCase();
                    if (chainName === 'Arc Testnet') return c.id === 5042002 || name.includes('arc');
                    if (chainName === 'Sepolia') return c.id === 11155111 || (name.includes('sepolia') && !name.includes('base'));
                    if (chainName === 'Base Sepolia') return c.id === 84532 || (name.includes('base') && name.includes('sepolia'));
                    return false;
                  });

                  // Prefer icon from our NETWORKS config (more reliable than wagmi's)
                  let iconUrl = chainObj?.iconUrl;
                  if (chainName === 'Arc Testnet') iconUrl = NETWORKS.ARC_TESTNET.iconUrl;
                  if (chainName === 'Sepolia') iconUrl = NETWORKS.ETHEREUM_SEPOLIA.iconUrl;
                  if (chainName === 'Base Sepolia') iconUrl = NETWORKS.BASE_SEPOLIA.iconUrl;

                  return (
                    <button
                      key={chainName}
                      disabled={isExcluded}
                      onClick={() => { if (!isExcluded) { onSelect(chainName); onClose(); } }}
                      className={`bridge-selector-item ${isSelected ? 'selected' : ''} ${isExcluded ? 'disabled' : ''}`}
                    >
                      <div className="bridge-selector-item-content">
                        {/* Chain icon */}
                        <div className="bridge-selector-item-icon" style={{ background: chainName.includes('Arc') ? '#000' : '#fff' }}>
                          {iconUrl ? (
                            <img src={iconUrl} alt={chainName} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-sm font-medium text-gray-600">{chainName.substring(0, 1)}</span>
                          )}
                        </div>
                        {/* Chain name */}
                        <div className="bridge-selector-item-info text-left">
                          <p>{chainName}</p>
                          <p className="text-left w-full text-[11px] opacity-60">Testnet</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2" />
                    </button>
                  );
                })}

                {/* "No results" message */}
                {filteredChains.length === 0 && (
                  <div className="py-10 text-center text-gray-400 text-sm italic">
                    {t('No networks found')}
                  </div>
                )}
              </div>

              {/* Small note reminding users that source and destination must differ */}
              <div className="mt-5 pt-4 border-t border-gray-100 dark:border-white/5 mx-1">
                <div className="flex items-center gap-3">
                  <div className="w-0.5 h-6 rounded-full bg-amber-500 flex-shrink-0 opacity-80 shadow-[0_0_8px_rgba(245,158,11,0.3)]" />
                  <p className="text-[12px] text-gray-500 dark:text-gray-400 leading-tight">
                    <span className="font-medium text-gray-800 dark:text-gray-200">{t('Note')}:</span> Source and destination networks must be different.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
};


// =============================================================================
// BRIDGE PAGE — MAIN COMPONENT
// This component manages everything related to a bridge transaction:
// - Picking source and destination chains
// - Entering the USDC amount
// - Switching the user's wallet to the correct network
// - Starting the bridge via the useBridge hook
// - Handling success, failure, rejection, and cancellation states
// =============================================================================
const Bridge = () => {
  const { t } = useTranslation();
  const { isConnected, walletAddress, chainId, status } = useWallet();
  const { setIsFocusedModalOpen } = useModal();
  const { switchChainAsync } = useSwitchChain();

  // ─── Ghost-state protection ───────────────────────────────────────────────
  // On page refresh, wagmi briefly reports "disconnected" before it reconnects.
  // We snapshot the true connection state from localStorage so the button never
  // briefly flashes "Connect Wallet" for a returning connected user.
  const wasConnectedRef = useRef(
    typeof window !== 'undefined' ? localStorage.getItem('walletConnected') === 'true' : false
  );
  const wasConnected = wasConnectedRef.current;


  // ─── Chain selection ───────────────────────────────────────────────────────
  const [fromChain, setFromChain] = useState('Sepolia');     // Where the USDC is coming from
  const [toChain, setToChain] = useState('Arc Testnet'); // Where the USDC is going to


  // ─── Amount ────────────────────────────────────────────────────────────────
  const [amount, setAmount] = useState(''); // How many USDC to bridge (minimum 1)


  // ─── UI state ──────────────────────────────────────────────────────────────
  const [bridgeLoading, setBridgeLoading] = useState(false);
  const [showChainSelector, setShowChainSelector] = useState(null);   // 'from' | 'to' | null
  const [bridgeButtonText, setBridgeButtonText] = useState('Bridge');
  const [showNetworkSuccess, setShowNetworkSuccess] = useState(false);  // "Arc added ✓" tooltip


  // ─── Modal visibility ──────────────────────────────────────────────────────
  const [showBridgingModal, setShowBridgingModal] = useState(false);
  const [showBridgeFailedModal, setShowBridgeFailedModal] = useState(false);
  const [showBridgeSuccessModal, setShowBridgeSuccessModal] = useState(false);
  const [showBridgeRejectedModal, setShowBridgeRejectedModal] = useState(false);
  const [showBridgeCancelledModal, setShowBridgeCancelledModal] = useState(false);


  // ─── Bridge result data ────────────────────────────────────────────────────
  const [bridgeError, setBridgeError] = useState({ title: 'Error Details', message: '' });
  const [bridgeFinalTime, setBridgeFinalTime] = useState(null); // How long the bridge took (e.g. "45s")
  const [sourceTxHash, setSourceTxHash] = useState(null);  // Transaction hash shown on success


  // ─── Timer ─────────────────────────────────────────────────────────────────
  const [bridgeStartTime, setBridgeStartTime] = useState(null); // Timestamp when bridge started
  const [stopTimer, setStopTimer] = useState(false); // Signal to stop the progress timer


  // ─── Refs for internal tracking ────────────────────────────────────────────
  const timeoutIdRef = useRef(null);  // Global timeout (6-min guard for the full bridge flow)
  const balanceIntervalRef = useRef(null);  // Interval for periodic balance refresh (every 30s)
  const bridgeInitiatedRef = useRef(false); // Prevent chain UI updates once bridge starts
  const initialFromChainRef = useRef(null);  // Snapshot of fromChain when bridge started
  const initialToChainRef = useRef(null);  // Snapshot of toChain when bridge started

  // Trigger button refs (used for positioning the chain selector popup)
  const fromChainTriggerRef = useRef(null);
  const toChainTriggerRef = useRef(null);


  // ─── Bridge hook ───────────────────────────────────────────────────────────
  // This hook handles: approval, burn on source chain, waiting for Circle's attestation,
  // and minting on the destination chain.
  const { bridge, state, reset, fetchTokenBalance, tokenBalance, isLoadingBalance, balanceError, clearBalance } = useBridge();


  // ─── Tell the layout when a focused modal is open ─────────────────────────
  useEffect(() => {
    const anyModalOpen =
      showChainSelector !== null ||
      showBridgingModal ||
      showBridgeFailedModal ||
      showBridgeSuccessModal ||
      showBridgeRejectedModal ||
      showBridgeCancelledModal;

    setIsFocusedModalOpen(anyModalOpen);
    return () => setIsFocusedModalOpen(false);
  }, [
    showChainSelector, showBridgingModal, showBridgeFailedModal,
    showBridgeSuccessModal, showBridgeRejectedModal, showBridgeCancelledModal,
    setIsFocusedModalOpen,
  ]);


  // ─── Format balance for display ───────────────────────────────────────────
  // Always shows two decimal places (e.g. "10.50" instead of "10.5")
  const formatBalance = (value) => {
    const n = typeof value === 'number' ? value : Number(value);
    return Number.isFinite(n) ? n.toFixed(2) : '0.00';
  };


  // ─── Clean up balance interval when component unmounts ────────────────────
  useEffect(() => {
    return () => {
      if (balanceIntervalRef.current) {
        clearInterval(balanceIntervalRef.current);
        balanceIntervalRef.current = null;
      }
    };
  }, []);


  // ─── Listen for wallet rejection or disconnect events mid-bridge ──────────
  // If the user rejects in MetaMask or disconnects their wallet while bridging,
  // we catch it here and show the appropriate modal.
  useEffect(() => {
    if (!window?.ethereum) return;

    const stopBridgeWithRejection = () => {
      if (showBridgingModal || bridgeLoading || state.step === 'approving') {
        setStopTimer(true);
        if (timeoutIdRef.current) { clearTimeout(timeoutIdRef.current); timeoutIdRef.current = null; }
        setShowBridgingModal(false);
        setShowBridgeRejectedModal(true);
        setShowBridgeFailedModal(false);
        setBridgeButtonText('Bridge');
        setBridgeLoading(false);
        reset();
      }
    };

    const handleAccountsChanged = (accounts) => {
      // User removed their wallet account (disconnected)
      if (accounts.length === 0 && (showBridgingModal || state.step === 'approving' || bridgeLoading)) {
        setStopTimer(true);
        if (timeoutIdRef.current) { clearTimeout(timeoutIdRef.current); timeoutIdRef.current = null; }
        setShowBridgingModal(false);
        setBridgeError({ title: 'Error Details', message: 'Transaction cancelled: Wallet disconnected during bridging.' });
        setShowBridgeFailedModal(true);
        setShowBridgeRejectedModal(false);
        setBridgeButtonText('Bridge Failed');
        setBridgeLoading(false);
        reset();
      }
    };

    const handleDisconnect = () => {
      if (showBridgingModal || state.step === 'approving' || bridgeLoading) {
        setStopTimer(true);
        if (timeoutIdRef.current) { clearTimeout(timeoutIdRef.current); timeoutIdRef.current = null; }
        setShowBridgingModal(false);
        setBridgeError({ title: 'Error Details', message: 'Transaction cancelled: Wallet disconnected.' });
        setShowBridgeFailedModal(true);
        setBridgeButtonText('Bridge Failed');
        setBridgeLoading(false);
        reset();
      }
    };

    // Also watch for postMessage events indicating rejection (some wallets use this)
    const handleMessage = (event) => {
      if (event.data && typeof event.data === 'object') {
        const msg = JSON.stringify(event.data).toLowerCase();
        if (msg.includes('reject') || msg.includes('cancel') || msg.includes('deny')) {
          stopBridgeWithRejection();
        }
      }
    };

    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('disconnect', handleDisconnect);
    window.addEventListener('message', handleMessage);

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('disconnect', handleDisconnect);
      }
      window.removeEventListener('message', handleMessage);
    };
  }, [state.step, showBridgingModal, bridgeLoading, reset]);


  // ─── Fetch USDC balance when wallet connects or chain changes ──────────────
  useEffect(() => {
    // Clear any existing polling interval first (prevents duplicates)
    if (balanceIntervalRef.current) {
      clearInterval(balanceIntervalRef.current);
      balanceIntervalRef.current = null;
    }

    if (!isConnected) {
      // Wallet disconnected — wipe displayed balance
      clearBalance();
    } else if (isConnected && chainId) {
      const chainIdDecimal = typeof chainId === 'string' ? parseInt(chainId, 16) : chainId;

      // Fetch immediately on connect / chain switch
      fetchTokenBalance('USDC', chainIdDecimal);

      // Then keep refreshing in the background every 30 seconds (only if tab is visible)
      balanceIntervalRef.current = setInterval(() => {
        try {
          if (isConnected && chainId && document.visibilityState === 'visible') {
            fetchTokenBalance('USDC', typeof chainId === 'string' ? parseInt(chainId, 16) : chainId);
          }
        } catch { /* ignore polling errors */ }
      }, 30000);

      return () => {
        if (balanceIntervalRef.current) {
          clearInterval(balanceIntervalRef.current);
          balanceIntervalRef.current = null;
        }
      };
    }
  }, [isConnected, chainId, clearBalance, fetchTokenBalance]);


  // ─── Auto-sync chain selectors with the user's current wallet network ─────
  // When the user's wallet is on Arc → set "From" to Arc.
  // When on Sepolia → set "From" to Sepolia. Etc.
  // This is DISABLED while a bridge is in progress to keep the UI stable.
  useEffect(() => {
    if (!chainId) return;

    const isBridgeInProgress = bridgeLoading || state.isLoading ||
      (state.step !== 'idle' && state.step !== 'success' && state.step !== 'error');

    // During a bridge, only refresh the balance — don't touch the chain dropdowns
    if (isBridgeInProgress || bridgeInitiatedRef.current) {
      try {
        const chainIdDecimal = typeof chainId === 'string' ? parseInt(chainId, 16) : chainId;
        if (isConnected) fetchTokenBalance('USDC', chainIdDecimal);
      } catch { /* ignore */ }
      return;
    }

    try {
      const chainIdDecimal = typeof chainId === 'string' ? parseInt(chainId, 16) : chainId;
      const arcId = parseInt(NETWORKS.ARC_TESTNET.chainId, 16);
      const sepoliaId = parseInt(NETWORKS.ETHEREUM_SEPOLIA.chainId, 16);
      const baseSepoliaId = parseInt(NETWORKS.BASE_SEPOLIA.chainId, 16);

      // Match the wallet's current chain to the "From" selector
      if (chainIdDecimal === arcId) {
        setFromChain(prev => prev !== 'Arc Testnet' ? 'Arc Testnet' : prev);
        setToChain(prev => prev === 'Arc Testnet' ? 'Sepolia' : prev);
      } else if (chainIdDecimal === sepoliaId) {
        setFromChain(prev => prev !== 'Sepolia' ? 'Sepolia' : prev);
        setToChain(prev => prev === 'Sepolia' ? 'Arc Testnet' : prev);
      } else if (chainIdDecimal === baseSepoliaId) {
        setFromChain(prev => prev !== 'Base Sepolia' ? 'Base Sepolia' : prev);
        setToChain(prev => prev === 'Base Sepolia' ? 'Sepolia' : prev);
      }

      if (isConnected) fetchTokenBalance('USDC', chainIdDecimal);
    } catch { /* ignore */ }
  }, [chainId, isConnected, fetchTokenBalance, bridgeLoading, state.isLoading, state.step]);


  // ─── On bridge success: update UI, save transaction, refresh balance ───────
  useEffect(() => {
    if (state.step === 'success' && state.sourceTxHash) {
      setSourceTxHash(state.sourceTxHash);

      // Calculate total time the bridge took
      if (bridgeStartTime) {
        const secs = (Date.now() - bridgeStartTime) / 1000;
        const mins = Math.floor(secs / 60);
        setBridgeFinalTime(mins > 0 ? `${mins}m ${Math.floor(secs % 60)}s` : `${Math.floor(secs)}s`);
      }

      setShowBridgingModal(false);
      setShowBridgeSuccessModal(true);
      saveBridgeTransaction(state.sourceTxHash || state.receiveTxHash, 'success');

      // Refresh balance immediately, and again a few seconds later (Circle takes a moment to mint)
      if (chainId && isConnected) {
        const dec = typeof chainId === 'string' ? parseInt(chainId, 16) : chainId;
        fetchTokenBalance('USDC', dec);
        const t1 = setTimeout(() => fetchTokenBalance('USDC', dec), 3000);
        const t2 = setTimeout(() => fetchTokenBalance('USDC', dec), 8000);
        return () => { clearTimeout(t1); clearTimeout(t2); };
      }
    }
  }, [state.step, state.sourceTxHash, state.receiveTxHash, chainId, fetchTokenBalance, isConnected, bridgeStartTime]); // eslint-disable-line

  // ─── On bridge error: refresh balance to show the un-spent amount ──────────
  useEffect(() => {
    if (state.step === 'error' && isConnected && chainId) {
      const dec = typeof chainId === 'string' ? parseInt(chainId, 16) : chainId;
      fetchTokenBalance('USDC', dec);
      const timer = setTimeout(() => fetchTokenBalance('USDC', dec), 2000);
      return () => clearTimeout(timer);
    }
  }, [state.step, chainId, fetchTokenBalance, isConnected]);

  // Reset timer tracking when bridge finishes (success or error)
  useEffect(() => {
    if (state.step === 'success' || state.step === 'error') setBridgeStartTime(null);
  }, [state.step]);

  // ─── Detect when useBridge hook reports an error ───────────────────────────
  useEffect(() => {
    if (state.step === 'error' && state.error) {
      if (state.sourceTxHash || state.receiveTxHash) {
        saveBridgeTransaction(state.sourceTxHash || state.receiveTxHash, 'failed');
      }
      setShowBridgingModal(false);
      setBridgeError({ title: 'Error Details', message: state.error });
      setShowBridgeFailedModal(true);
      setBridgeButtonText('Bridge Failed');
      setBridgeLoading(false);
    }
  }, [state]); // eslint-disable-line


  // =============================================================================
  // HELPERS
  // =============================================================================

  // Converts a chain name ("Arc Testnet") to its numeric chain ID (5042002)
  const getChainIdByName = useCallback((chainName) => {
    switch (chainName) {
      case 'Arc Testnet': return parseInt(NETWORKS.ARC_TESTNET.chainId, 16);
      case 'Sepolia':
      case 'Sepolia Testnet':
      case 'Ethereum Sepolia':
      case 'Sepolia Testnet (ETH)': return parseInt(NETWORKS.ETHEREUM_SEPOLIA.chainId, 16);
      case 'Base Sepolia': return parseInt(NETWORKS.BASE_SEPOLIA.chainId, 16);
      default: return null;
    }
  }, []);

  // Saves a bridge transaction record to IndexedDB (local browser storage)
  // so it shows up in the Transactions history page.
  const saveBridgeTransaction = useCallback(async (txHash, txStatus = 'success') => {
    try {
      const saved = await getItem('myTransactions');
      const existing = saved && Array.isArray(saved) ? saved : [];

      if (!existing.some(tx => tx.hash === txHash) && txHash) {
        const bridgeTx = {
          id: txHash || `bridge-${Date.now()}`,
          type: 'Bridge',
          from: fromChain,
          to: toChain,
          amount: amount || '0.00',
          timestamp: Date.now(),
          status: txStatus,
          hash: txHash,
          chainId: getChainIdByName(fromChain),
          address: walletAddress?.toLowerCase(),
          initiatedBy: 'StacDApp',
        };

        const trimmed = [bridgeTx, ...existing].slice(0, 100); // Keep last 100
        await setItem('myTransactions', trimmed);

        // Also back up to sessionStorage per wallet address
        try {
          if (walletAddress) {
            const key = `stac_tx_backup_${walletAddress.toLowerCase()}`;
            sessionStorage.setItem(key, JSON.stringify(
              trimmed.filter(tx => tx.address?.toLowerCase() === walletAddress.toLowerCase())
            ));
          }
        } catch { /* sessionStorage backup is optional — ignore errors */ }

        // Notify the Transactions page that new data is available
        window.dispatchEvent(new CustomEvent('bridgeTransactionSaved'));
      }
    } catch { /* ignore save errors */ }
  }, [fromChain, toChain, amount, walletAddress, getChainIdByName]);


  // =============================================================================
  // EVENT HANDLERS
  // =============================================================================

  // One-click button to add the Arc Testnet to the user's MetaMask
  const addArcNetwork = useCallback(async () => {
    if (!window?.ethereum) return;
    try {
      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [{
          chainId: '0x4cef52',
          chainName: 'Arc Testnet',
          rpcUrls: ['https://rpc.testnet.arc.network'],
          nativeCurrency: { name: 'USDC', symbol: 'USDC', decimals: 18 },
          blockExplorerUrls: ['https://testnet.arcscan.app'],
        }],
      });
      // Show a brief "Added ✓" tooltip
      setShowNetworkSuccess(true);
      setTimeout(() => setShowNetworkSuccess(false), 3000);
    } catch (err) {
      if (err?.code !== 4001) console.error('Error adding Arc Testnet:', err);
    }
  }, []);

  // Called when the user picks a new "From" chain.
  // Also switches the wallet to that chain if one is connected.
  const handleNetworkChange = useCallback(async (newChain) => {
    const isBridgeInProgress = bridgeLoading || state.isLoading ||
      (state.step !== 'idle' && state.step !== 'success' && state.step !== 'error');
    if (isBridgeInProgress) return;

    // Reset bridge-lock so chain selectors are interactive again
    bridgeInitiatedRef.current = false;
    initialFromChainRef.current = null;
    initialToChainRef.current = null;

    if (!isConnected) { setFromChain(newChain); return; }

    try {
      const newChainId = getChainIdByName(newChain);
      if (newChainId) {
        await switchChainAsync({ chainId: newChainId });
        setFromChain(newChain);
        fetchTokenBalance('USDC', newChainId);
      }
    } catch (err) {
      // If the network doesn't exist in the wallet yet, try to add it first
      if ((err?.code === 4902 || err?.message?.includes('wallet_addEthereumChain')) && window?.ethereum) {
        try {
          const network = newChain === 'Arc Testnet' ? NETWORKS.ARC_TESTNET :
            newChain === 'Sepolia' ? NETWORKS.ETHEREUM_SEPOLIA :
              NETWORKS.BASE_SEPOLIA;
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{ chainId: network.chainId, chainName: network.chainName, nativeCurrency: network.nativeCurrency, rpcUrls: network.rpcUrls, blockExplorerUrls: network.blockExplorerUrls }],
          });
          const newChainId = getChainIdByName(newChain);
          if (newChainId) {
            await switchChainAsync({ chainId: newChainId });
            setFromChain(newChain);
            fetchTokenBalance('USDC', newChainId);
          }
        } catch { /* ignore */ }
      }
      setFromChain(newChain);
    }
  }, [bridgeLoading, state.isLoading, state.step, isConnected, getChainIdByName, switchChainAsync, fetchTokenBalance]);

  // Called when the user picks a new "To" chain — doesn't switch the wallet network
  const handleToNetworkChange = useCallback((newChain) => {
    const isBridgeInProgress = bridgeLoading || state.isLoading ||
      (state.step !== 'idle' && state.step !== 'success' && state.step !== 'error');
    if (isBridgeInProgress) return;

    bridgeInitiatedRef.current = false;
    initialFromChainRef.current = null;
    initialToChainRef.current = null;
    setToChain(newChain);
  }, [bridgeLoading, state.isLoading, state.step]);

  // Called when the user clicks the main "Bridge" button
  const handleBridge = useCallback(async () => {
    // Validation checks before starting
    if (!isConnected) {
      setBridgeError({ title: 'Error Details', message: 'Please connect your wallet first.' });
      setShowBridgeFailedModal(true);
      return;
    }
    const amountFloat = parseFloat(amount);
    if (!amount || isNaN(amountFloat) || amountFloat < 1) {
      setBridgeError({ title: 'Error Details', message: amountFloat < 1 ? 'Minimum bridge amount is 1 USDC.' : 'Invalid amount.' });
      setShowBridgeFailedModal(true);
      return;
    }
    if (amountFloat > parseFloat(tokenBalance || '0')) {
      setBridgeError({ title: 'Error Details', message: 'Insufficient balance.' });
      setShowBridgeFailedModal(true);
      return;
    }

    // Lock in the chain selection so UI stays stable during the transaction
    setStopTimer(false);
    initialFromChainRef.current = fromChain;
    initialToChainRef.current = toChain;
    bridgeInitiatedRef.current = true;

    // Show the progress modal and start the timer
    setBridgeStartTime(Date.now());
    setShowBridgingModal(true);
    setBridgeLoading(true);
    setBridgeButtonText('Bridging...');

    // Safety timeout: if the bridge takes longer than 6 minutes, show an error.
    // (The burn may have still succeeded — Circle auto-mints when ready.)
    timeoutIdRef.current = setTimeout(() => {
      if (state.step !== 'success' && state.step !== 'error' && state.step !== 'idle') {
        setStopTimer(true);
        setShowBridgingModal(false);
        setBridgeError({ title: 'Error Details', message: 'Bridge transaction timeout. The burn may still have succeeded — Circle will auto-mint when ready.' });
        setShowBridgeFailedModal(true);
        setBridgeButtonText('Bridge Failed');
        setBridgeLoading(false);
        reset();
      }
    }, 360000); // 6 minutes

    try {
      // Determine the direction string expected by the useBridge hook
      let direction;
      if (fromChain === 'Sepolia') direction = toChain === 'Arc Testnet' ? 'sepolia-to-arc' : 'sepolia-to-base';
      else if (fromChain === 'Arc Testnet') direction = toChain === 'Sepolia' ? 'arc-to-sepolia' : 'arc-to-base';
      else if (fromChain === 'Base Sepolia') direction = toChain === 'Sepolia' ? 'base-to-sepolia' : 'base-to-arc';

      const result = await bridge('USDC', amount, direction);
      if (timeoutIdRef.current) { clearTimeout(timeoutIdRef.current); timeoutIdRef.current = null; }

      if (result.step === 'error') {
        setStopTimer(true);
        const failedHash = result.sourceTxHash || result.receiveTxHash || result.transaction?.hash || result.hash;
        if (failedHash) saveBridgeTransaction(failedHash, 'failed');
        setShowBridgingModal(false);
        setBridgeLoading(false);
        setBridgeError({ title: 'Error Details', message: result.error || 'Transaction failed.' });
        setShowBridgeFailedModal(true);
        setBridgeButtonText('Bridge Failed');
        reset();
      }
    } catch (err) {
      setStopTimer(true);
      if (timeoutIdRef.current) { clearTimeout(timeoutIdRef.current); timeoutIdRef.current = null; }
      setShowBridgingModal(false);
      setBridgeError({ title: 'Error Details', message: err.message || 'An unexpected error occurred.' });
      setShowBridgeFailedModal(true);
      setBridgeButtonText('Bridge Failed');
    } finally {
      setBridgeLoading(false);
    }
  }, [isConnected, amount, tokenBalance, fromChain, toChain, state.step, bridge, reset, saveBridgeTransaction]);

  // Resets all bridge state back to zero — called after any modal closes
  const handleReset = useCallback(() => {
    setShowBridgingModal(false);
    setShowBridgeSuccessModal(false);
    setShowBridgeFailedModal(false);
    setShowBridgeRejectedModal(false);
    setShowBridgeCancelledModal(false);
    setAmount('');
    setBridgeButtonText('Bridge');
    setBridgeLoading(false);
    setBridgeStartTime(null);
    setStopTimer(true);
    reset();
    bridgeInitiatedRef.current = false;
    initialFromChainRef.current = null;
    initialToChainRef.current = null;
    if (timeoutIdRef.current) { clearTimeout(timeoutIdRef.current); timeoutIdRef.current = null; }
  }, [reset]);

  // Handles the user closing the "Bridging in progress" modal early (= cancellation)
  const closeBridgingModal = useCallback(() => {
    if (state.step !== 'success' && bridgeLoading) {
      handleReset();
      setShowBridgeCancelledModal(true);
      return;
    }
    handleReset();
  }, [state.step, bridgeLoading, handleReset]);

  const closeBridgeFailedModal = useCallback(() => handleReset(), [handleReset]);

  // Helper: true if a bridge transaction is actively in progress
  const isBridgeInProgress = bridgeLoading || state.isLoading ||
    (state.step !== 'idle' && state.step !== 'success' && state.step !== 'error');

  // The chain names to display (locked to initial values once bridge starts)
  const displayFromChain = bridgeInitiatedRef.current && initialFromChainRef.current ? initialFromChainRef.current : fromChain;
  const displayToChain = bridgeInitiatedRef.current && initialToChainRef.current ? initialToChainRef.current : toChain;


  // =============================================================================
  // RENDER
  // =============================================================================
  return (
    <div className="max-w-2xl mx-auto w-full">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bridge-container group"
      >
        {/* Subtle corner glow — desktop only, invisible in light mode */}
        <div className="hidden md:block absolute -top-20    -left-20  w-48 h-48 bg-gradient-to-br from-slate-300 to-slate-400 opacity-0 dark:opacity-[0.1] blur-[60px] rounded-full" />
        <div className="hidden md:block absolute -top-20    -right-20 w-48 h-48 bg-gradient-to-bl from-slate-300 to-slate-400 opacity-0 dark:opacity-[0.1] blur-[60px] rounded-full" />
        <div className="hidden md:block absolute -bottom-20 -left-20  w-48 h-48 bg-gradient-to-tr from-slate-300 to-slate-400 opacity-0 dark:opacity-[0.1] blur-[60px] rounded-full" />
        <div className="hidden md:block absolute -bottom-20 -right-20 w-48 h-48 bg-gradient-to-tl from-slate-300 to-slate-400 opacity-0 dark:opacity-[0.1] blur-[60px] rounded-full" />

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="bridge-title">{t('Bridge Assets')}</h1>

          {/* "Add Arc" button — adds Arc Testnet to the user's MetaMask */}
          <button
            onClick={addArcNetwork}
            className="add-arc-button group relative flex items-center gap-2"
            aria-label={t('Add Arc Testnet to Wallet')}
          >
            <Wallet size={14} className="text-black dark:text-white transition-colors" />
            <span>{t('Add Arc')}</span>

            {/* Success tooltip: "Network added successfully ✓" */}
            <AnimatePresence>
              {showNetworkSuccess && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute bottom-[calc(100%+14px)] right-0 bg-slate-50 dark:bg-black px-3.5 py-2.5 rounded-xl shadow-[0_12px_28px_rgba(0,0,0,0.15)] dark:shadow-[0_12px_28px_rgba(255,255,255,0.08)] flex items-center gap-2.5 z-50 border border-slate-200 dark:border-white/10 min-w-max backdrop-blur-md"
                >
                  <div className="flex-shrink-0 w-5 h-5 rounded-lg bg-emerald-500 flex items-center justify-center shadow-[0_2px_8px_rgba(16,185,129,0.3)] border border-emerald-400/20">
                    <Check size={13} className="text-white stroke-[4]" />
                  </div>
                  <span className="text-[12px] font-bold text-black dark:text-white tracking-tight leading-none whitespace-nowrap">
                    {t('Network added successfully')}
                  </span>
                  {/* Tooltip arrow (border layer) */}
                  <div className="absolute top-full right-4 w-0 h-0 border-l-[7px] border-l-transparent border-r-[7px] border-r-transparent border-t-[7px] border-t-slate-200 dark:border-t-white/10" />
                  <div className="absolute top-[calc(100%-1.5px)] right-4 w-0 h-0 border-l-[7px] border-l-transparent border-r-[7px] border-r-transparent border-t-[7px] border-t-slate-50 dark:border-t-black" />
                </motion.div>
              )}
            </AnimatePresence>
          </button>
        </div>

        {/* ── Chain Selection Row ─────────────────────────────────────────── */}
        {/* FROM chain → arrow → TO chain */}
        <div className="w-full mb-6 relative z-10">
          <div className="flex items-center gap-2 sm:gap-3 w-full">

            {/* FROM selector */}
            <div className="flex-1 min-w-0">
              <button
                ref={fromChainTriggerRef}
                onClick={() => { if (!isBridgeInProgress) setShowChainSelector('from'); }}
                disabled={isBridgeInProgress}
                className="w-full h-12 md:h-14 px-2 sm:px-4 rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 flex items-center justify-between gap-2 transition-all hover:bg-slate-100 dark:hover:bg-white/[0.08] disabled:opacity-50 min-w-0 active:scale-[0.98] shadow-sm"
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <div className="h-6 w-6 shrink-0 rounded-full overflow-hidden bg-white dark:bg-white/10 shadow-sm border border-slate-200/50 dark:border-white/10">
                    {/* Chain icon */}
                    {displayFromChain.toLowerCase().includes('arc') && <img src="/icons/arc.png" alt={t('Arc')} className="w-full h-full object-cover bg-black" />}
                    {displayFromChain.toLowerCase().includes('base') && <img src="/icons/base.png" alt={t('Base')} className="w-full h-full object-cover bg-white" />}
                    {displayFromChain.toLowerCase().includes('sepolia') && !displayFromChain.toLowerCase().includes('base') && <img src="/icons/eth.png" alt={t('ETH')} className="w-full h-full object-cover bg-white" />}
                  </div>
                  <span className="truncate text-xs sm:text-sm font-bold text-slate-800 dark:text-white">
                    {/* On small screens, abbreviate "Base Sepolia" → "Base Sep.." */}
                    <span className="sm:hidden">
                      {displayFromChain === 'Base Sepolia' ? t('Base Sep..') : displayFromChain}
                    </span>
                    <span className="hidden sm:inline">{displayFromChain}</span>
                  </span>
                </div>
                <ChevronDown className="h-4 w-4 shrink-0 text-slate-400 dark:text-slate-500" />
              </button>
            </div>

            {/* ↔ Swap chains button */}
            <div className="flex-shrink-0">
              <button
                onClick={() => {
                  if (isBridgeInProgress) return;
                  const tempFrom = fromChain;
                  const tempTo = toChain;
                  bridgeInitiatedRef.current = false;
                  initialFromChainRef.current = null;
                  initialToChainRef.current = null;
                  setFromChain(tempTo);
                  setToChain(tempFrom);

                  if (isConnected) {
                    const newFromChainId = getChainIdByName(tempTo);
                    if (newFromChainId) {
                      switchChainAsync({ chainId: newFromChainId }).catch(err => console.warn('Network switch failed:', err));
                      fetchTokenBalance('USDC', newFromChainId);
                    }
                  }
                }}
                disabled={isBridgeInProgress}
                aria-label={t('Switch Networks')}
                className="h-9 w-9 sm:h-10 sm:w-10 flex-shrink-0 flex items-center justify-center bg-slate-100 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 rounded-xl text-slate-600 dark:text-slate-400 transition-all hover:scale-110 hover:bg-slate-200 dark:hover:bg-white/10 active:scale-90 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              >
                <ArrowRight size={18} />
              </button>
            </div>

            {/* TO selector */}
            <div className="flex-1 min-w-0">
              <button
                ref={toChainTriggerRef}
                onClick={() => { if (!isBridgeInProgress) setShowChainSelector('to'); }}
                disabled={isBridgeInProgress}
                className="w-full h-12 md:h-14 px-2 sm:px-4 rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 flex items-center justify-between gap-2 transition-all hover:bg-slate-100 dark:hover:bg-white/[0.08] disabled:opacity-50 min-w-0 active:scale-[0.98] shadow-sm"
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <div className="h-6 w-6 shrink-0 rounded-full overflow-hidden bg-white dark:bg-white/10 shadow-sm border border-slate-200/50 dark:border-white/10">
                    {displayToChain.toLowerCase().includes('arc') && <img src="/icons/arc.png" alt={t('Arc')} className="w-full h-full object-cover bg-black" />}
                    {displayToChain.toLowerCase().includes('base') && <img src="/icons/base.png" alt={t('Base')} className="w-full h-full object-cover bg-white" />}
                    {displayToChain.toLowerCase().includes('sepolia') && !displayToChain.toLowerCase().includes('base') && <img src="/icons/eth.png" alt={t('ETH')} className="w-full h-full object-cover bg-white" />}
                  </div>
                  <span className="truncate text-xs sm:text-sm font-bold text-slate-800 dark:text-white">
                    <span className="sm:hidden">
                      {displayToChain === 'Base Sepolia' ? t('Base Sep..') : displayToChain}
                    </span>
                    <span className="hidden sm:inline">{displayToChain}</span>
                  </span>
                </div>
                <ChevronDown className="h-4 w-4 shrink-0 text-slate-400 dark:text-slate-500" />
              </button>
            </div>
          </div>
        </div>

        {/* ── USDC Amount Input ───────────────────────────────────────────── */}
        <div className="input-group">
          <div className="input-header">
            <p className="input-label">{t('You send')}</p>
            {/* Show the user's current USDC balance on the selected source chain */}
            <div className="flex items-center text-[12px] font-medium text-slate-500 dark:text-slate-400">
              <span className="mr-1 opacity-60">Bal:</span>
              <span className="text-slate-700 dark:text-slate-200 font-medium tabular-nums">
                {isLoadingBalance ? (
                  <div className="skeleton w-16 h-4 rounded-md ml-1" />
                ) : balanceError ? (
                  <span className="text-red-400">{t('Error')}</span>
                ) : (
                  formatBalance(tokenBalance || 0)
                )}
              </span>
            </div>
          </div>

          <div className="input-row">
            <input
              type="text"
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(sanitizeInput(e.target.value))}
              placeholder="0.0"
              className="amount-input"
              style={{ WebkitAppearance: 'none', touchAction: 'manipulation' }}
            />
            {/* Token pill — always USDC for bridging */}
            <div className="token-selector">
              <div className="token-icon">
                <img src="/icons/usdc.png" alt="USDC" className="w-full h-full object-contain" />
              </div>
              <span className="token-symbol">USDC</span>
            </div>
          </div>

          <div className="input-footer">
            <div />
            {/* "Max" button — fills in the user's full balance */}
            <button
              onClick={() => { if (tokenBalance && parseFloat(tokenBalance) > 0) setAmount(tokenBalance); }}
              className="max-button"
            >
              {t('Max')}
            </button>
          </div>
        </div>

        {/* ── Insufficient balance warning ────────────────────────────────── */}
        {isConnected && amount && parseFloat(amount) > parseFloat(tokenBalance) && (
          <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="mt-4 flex items-center gap-3">
            <div className="w-0.5 h-6 rounded-full bg-amber-500 flex-shrink-0 opacity-80 shadow-[0_0_8px_rgba(245,158,11,0.3)]" />
            <p className="text-[12px] text-slate-600 dark:text-gray-400 leading-tight">
              <span className="font-bold text-amber-600 dark:text-amber-400">{t('Error')}:</span> {t('Insufficient USDC balance to complete this bridge')}
            </p>
          </motion.div>
        )}

        {/* ── Irreversible transfer warning ───────────────────────────────── */}
        <div className="mt-4 mb-4 pt-4 border-t border-slate-200 dark:border-white/[0.06]">
          <div className="flex items-center gap-3">
            <div className="w-0.5 h-6 rounded-full bg-orange-500 flex-shrink-0 opacity-80 shadow-[0_0_8px_rgba(249,115,22,0.3)]" />
            <p className="text-[12px] text-slate-600 dark:text-gray-400 font-medium leading-tight">
              <span className="font-bold text-slate-800 dark:text-slate-200">{t('Note')}:</span> {t('Note: Cross chain transfers are irreversible. Please verify all details before confirming the transaction.')}
            </p>
          </div>
        </div>

        {/* ── Main Bridge Button ──────────────────────────────────────────── */}
        {/*
          Button states (in priority order):
          1. Bridge is executing           → spinner + "Bridging..."
          2. Reconnecting to wallet        → show "Bridge" (disabled, waiting)
          3. Wallet not connected          → show "Connect Wallet"
          4. Ready to bridge               → show current button text ("Bridge" or "Bridge Failed")
        */}
        <button
          onClick={handleBridge}
          disabled={
            !amount ||
            bridgeLoading ||
            (status === 'disconnected' && !wasConnected) ||
            state.isLoading ||
            bridgeButtonText === 'Bridge Failed' ||
            (isConnected && amount && parseFloat(amount) > parseFloat(tokenBalance || '0')) ||
            status === 'reconnecting' ||
            status === 'connecting'
          }
          className={`bridge-button ${(bridgeButtonText === 'Bridge Failed' || (isConnected && amount && parseFloat(amount) > parseFloat(tokenBalance || '0'))) ? 'bridge-button-failed' : ''} flex items-center justify-center gap-2`}
        >
          {bridgeLoading || state.isLoading ? (
            <><Loader className="animate-spin" size={20} /><span>{t('Bridging')}...</span></>
          ) : (status === 'reconnecting' || status === 'connecting' || wasConnected) && !isConnected ? (
            <span>{t('Bridge')}</span>
          ) : status === 'disconnected' ? (
            <><Wallet size={20} /><span>{t('Connect Wallet')}</span></>
          ) : (
            <span>{t(bridgeButtonText)}</span>
          )}
        </button>

        {/* "Powered by Circle CCTP" attribution */}
        <div className="powered-by-badge-bottom">
          <span>{t('Powered by Circle CCTP')}</span>
        </div>
      </motion.div>


      {/* ── Chain Selector Popups ────────────────────────────────────────────── */}
      <ChainSelector
        isOpen={showChainSelector === 'from'}
        onClose={() => setShowChainSelector(null)}
        selectedChain={fromChain}
        onSelect={handleNetworkChange}
        exclude={toChain}
      />
      <ChainSelector
        isOpen={showChainSelector === 'to'}
        onClose={() => setShowChainSelector(null)}
        selectedChain={toChain}
        onSelect={handleToNetworkChange}
        exclude={fromChain}
      />


      {/* ── Result Modals ──────────────────────────────────────────────────────
          Only one of these is visible at a time, controlled by the show* states. */}

      {/* In-progress / loading modal */}
      <BridgingModal
        isOpen={showBridgingModal}
        onClose={closeBridgingModal}
        fromChain={displayFromChain}
        toChain={displayToChain}
        amount={amount}
        startTime={bridgeStartTime}
        state={state}
        stopTimer={stopTimer}
      />

      {/* ❌ Failed */}
      <BridgeFailedModal
        isOpen={showBridgeFailedModal}
        onClose={closeBridgeFailedModal}
        fromChain={fromChain}
        toChain={toChain}
        errorTitle={bridgeError.title}
        errorMessage={bridgeError.message}
      />

      {/* ✅ Success */}
      <BridgeSuccessModal
        isOpen={showBridgeSuccessModal}
        onClose={handleReset}
        fromChain={fromChain}
        toChain={toChain}
        amount={state.result?.amount || amount}
        timeTaken={bridgeFinalTime}
        txHash={sourceTxHash}
      />

      {/* 🚫 User rejected in wallet */}
      <BridgeRejectedModal
        isOpen={showBridgeRejectedModal}
        onClose={handleReset}
        fromChain={fromChain}
        toChain={toChain}
      />

      {/* 🛑 User cancelled mid-bridge */}
      <BridgeCancelledModal
        isOpen={showBridgeCancelledModal}
        onClose={handleReset}
        fromChain={fromChain}
        toChain={toChain}
      />
    </div>
  );
};

// memo() prevents unnecessary re-renders when parent components re-render
// but Bridge's own props haven't changed.
export default memo(Bridge);