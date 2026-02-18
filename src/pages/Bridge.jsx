import { useState, useRef, useEffect, useCallback, memo } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { useWallet } from '../contexts/WalletContext';
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


const ChainSelector = ({ isOpen, onClose, selectedChain, onSelect, exclude }) => {
  const { t } = useTranslation();
  const selectorRef = useRef(null);
  const inputRef = useRef(null);
  const chains = useChains();
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Reset search and focus input when modal opens
  useEffect(() => {
    if (isOpen) {
      setSearchQuery('');
      setDebouncedSearch('');
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Handle ESC key press to close modal
  useEffect(() => {
    const handleEsc = (event) => {
      if (event && event.key === 'Escape') {
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

  const chainList = ['Arc Testnet', 'Sepolia', 'Base Sepolia'];

  const filteredChains = chainList.filter(chain =>
    chain.toLowerCase().includes(debouncedSearch.toLowerCase())
  );

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="bridge-selector-modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          style={{ zIndex: 100000 }}
        >
          <motion.div
            ref={selectorRef}
            className="bridge-selector-modal border border-slate-200/50 dark:border-white/10"
            initial={{ scale: 0.95, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 10 }}
            transition={{ type: "spring", damping: 25, stiffness: 400 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bridge-selector-header">
              <h3 className="bridge-selector-title">{t('Select Network')}</h3>
              <button
                onClick={onClose}
                className="bridge-selector-close-button transition-all hover:rotate-90"
              >
                <X size={18} />
              </button>
            </div>

            {/* Premium Search Bar - Modern DeFi Style */}
            <div className="px-5 py-4">
              <div className="relative group">
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors duration-200">
                  <Search size={16} />
                </div>
                <input
                  ref={inputRef}
                  type="text"
                  placeholder={t('Search network name or paste address')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 rounded-2xl pl-11 pr-4 py-3 text-[14px] outline-none group-hover:bg-white dark:group-hover:bg-white/[0.06] focus:bg-white dark:focus:bg-white/[0.08] focus:border-blue-500/40 focus:ring-4 focus:ring-blue-500/5 transition-all duration-300 placeholder:text-slate-400 dark:placeholder:text-slate-600 shadow-sm"
                />
              </div>
            </div>

            <div className="bridge-selector-list overflow-y-auto" style={{ maxHeight: '42vh' }}>
              <div className="space-y-1">
                {filteredChains.map((chainName) => {
                  const isExcluded = chainName === exclude;
                  const isSelected = chainName === selectedChain;

                  const chainObj = chains.find(c => {
                    if (chainName === 'Arc Testnet') return c.id === 5042002;
                    if (chainName === 'Sepolia') return c.id === 11155111;
                    if (chainName === 'Base Sepolia') return c.id === 84532;
                    return false;
                  });

                  // Get icon from NETWORKS config if available, otherwise use chainObj
                  let iconUrl = chainObj?.iconUrl;
                  if (chainName === 'Arc Testnet') iconUrl = NETWORKS.ARC_TESTNET.iconUrl;
                  else if (chainName === 'Sepolia') iconUrl = NETWORKS.ETHEREUM_SEPOLIA.iconUrl;
                  else if (chainName === 'Base Sepolia') iconUrl = NETWORKS.BASE_SEPOLIA.iconUrl;

                  return (
                    <button
                      key={chainName}
                      disabled={isExcluded}
                      onClick={() => {
                        if (!isExcluded) {
                          onSelect(chainName);
                          onClose();
                        }
                      }}
                      className={`bridge-selector-item ${isSelected ? 'selected' : ''} ${isExcluded ? 'disabled' : ''}`}
                    >
                      <div className="bridge-selector-item-content">
                        <div className="bridge-selector-item-icon" style={{ background: chainName.includes('Arc') ? '#000' : '#fff' }}>
                          {iconUrl ? (
                            <img
                              src={iconUrl}
                              alt={chainName}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-sm font-medium text-gray-600">{chainName.substring(0, 1)}</span>
                          )}
                        </div>
                        <div className="bridge-selector-item-info text-left">
                          <p>{chainName}</p>
                          <p className="text-left w-full text-[11px] opacity-60">Testnet</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                      </div>
                    </button>
                  );
                })}
                {filteredChains.length === 0 && (
                  <div className="py-10 text-center text-gray-400 text-sm italic">
                    {t('No networks found')}
                  </div>
                )}
              </div>

              {/* Minimal Note with accent bar */}
              <div className="mt-5 pt-4 border-t border-gray-100 dark:border-white/5 mx-1">
                <div className="flex items-center gap-3">
                  <div className="w-0.5 h-6 rounded-full bg-amber-500 flex-shrink-0 opacity-80 shadow-[0_0_8px_rgba(245,158,11,0.3)]"></div>
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



const Bridge = () => {
  const { t } = useTranslation();
  const { isConnected, walletAddress, chainId } = useWallet();
  const { setIsFocusedModalOpen } = useModal();
  const { switchChainAsync } = useSwitchChain();
  const [fromChain, setFromChain] = useState('Sepolia');
  const [toChain, setToChain] = useState('Arc Testnet');
  const [amount, setAmount] = useState('');
  const [bridgeLoading, setBridgeLoading] = useState(false);
  const [showChainSelector, setShowChainSelector] = useState(null);
  const [showBridgingModal, setShowBridgingModal] = useState(false);
  const [showBridgeFailedModal, setShowBridgeFailedModal] = useState(false);
  const [bridgeStartTime, setBridgeStartTime] = useState(null);
  const [bridgeError, setBridgeError] = useState({ title: 'Error Details', message: '' });
  const [bridgeButtonText, setBridgeButtonText] = useState('Bridge');
  const [stopTimer, setStopTimer] = useState(false);
  const [showNetworkSuccess, setShowNetworkSuccess] = useState(false);
  const [showBridgeSuccessModal, setShowBridgeSuccessModal] = useState(false);
  const [showBridgeRejectedModal, setShowBridgeRejectedModal] = useState(false);
  const [showBridgeCancelledModal, setShowBridgeCancelledModal] = useState(false);
  const [bridgeFinalTime, setBridgeFinalTime] = useState(null);
  const [sourceTxHash, setSourceTxHash] = useState(null);

  // Sync focused modal state with layout
  useEffect(() => {
    const isAnyFocusedModalOpen =
      showChainSelector !== null ||
      showBridgingModal ||
      showBridgeFailedModal ||
      showBridgeSuccessModal ||
      showBridgeRejectedModal ||
      showBridgeCancelledModal;

    setIsFocusedModalOpen(isAnyFocusedModalOpen);

    // Reset focused state on unmount
    return () => setIsFocusedModalOpen(false);
  }, [
    showChainSelector,
    showBridgingModal,
    showBridgeFailedModal,
    showBridgeSuccessModal,
    showBridgeRejectedModal,
    showBridgeCancelledModal,
    setIsFocusedModalOpen
  ]);

  // Initialize the useBridge hook
  const { bridge, state, reset, fetchTokenBalance, tokenBalance, isLoadingBalance, balanceError, clearBalance } = useBridge();

  // Ref for timeout ID
  const timeoutIdRef = useRef(null);
  // Ref for balance interval to ensure proper cleanup
  const balanceIntervalRef = useRef(null);
  // Ref to track if bridge has been initiated - chains should remain fixed during and after bridge
  const bridgeInitiatedRef = useRef(false);
  // Refs to store the initial chains when bridge starts - these remain fixed throughout the transaction
  const initialFromChainRef = useRef(null);
  const initialToChainRef = useRef(null);

  // Real-time token balance for USDC - now using bridge kit
  // const { balance, loading, refetch, error } = useTokenBalance

  // Format balance to 2 decimal places
  const formatBalance = (value) => {
    const n = typeof value === 'number' ? value : Number(value);
    if (!Number.isFinite(n)) return '0.00';
    return n.toFixed(2);
  };

  // Refs for trigger buttons
  const fromChainTriggerRef = useRef(null);
  const toChainTriggerRef = useRef(null);


  // Cleanup effect to clear balance interval on component unmount
  useEffect(() => {
    return () => {
      if (balanceIntervalRef.current) {
        clearInterval(balanceIntervalRef.current);
        balanceIntervalRef.current = null;
      }
    };
  }, []);

  // Effect to listen for wallet events during bridging
  // Note: Network changes are allowed during bridging (needs confirmation on destination chain)
  useEffect(() => {
    if (!window || !window.ethereum) return;

    const handleTransactionRejection = () => {
      if (showBridgingModal || bridgeLoading || state.step === 'approving') {
        // Stop the timer
        setStopTimer(true);

        // Clear timeout if exists
        if (timeoutIdRef.current) {
          clearTimeout(timeoutIdRef.current);
          timeoutIdRef.current = null;
        }

        setShowBridgingModal(false);
        setShowBridgeRejectedModal(true);
        setShowBridgeFailedModal(false); // Ensure failure modal is hidden
        setBridgeButtonText('Bridge'); // Don't show "Bridge Failed" on button immediately
        setBridgeLoading(false);
        reset();
      }
    };

    const handleAccountsChanged = (accounts) => {
      if (accounts.length === 0) {
        // User disconnected - close any open modals and show failure
        if (showBridgingModal || state.step === 'approving' || bridgeLoading) {
          // Stop the timer
          setStopTimer(true);

          // Clear timeout if exists
          if (timeoutIdRef.current) {
            clearTimeout(timeoutIdRef.current);
            timeoutIdRef.current = null;
          }

          setShowBridgingModal(false);
          setBridgeError({
            title: 'Error Details',
            message: 'Transaction cancelled: Wallet disconnected during bridging.'
          });
          setShowBridgeFailedModal(true);
          setShowBridgeRejectedModal(false); // Ensure rejected modal is hidden
          setBridgeButtonText('Bridge Failed');
          setBridgeLoading(false);
          reset();
        }
      }
    };

    const handleDisconnect = () => {
      if (showBridgingModal || state.step === 'approving' || bridgeLoading) {
        // Stop the timer
        setStopTimer(true);

        // Clear timeout if exists
        if (timeoutIdRef.current) {
          clearTimeout(timeoutIdRef.current);
          timeoutIdRef.current = null;
        }

        setShowBridgingModal(false);
        setBridgeError({
          title: 'Error Details',
          message: 'Transaction cancelled: Wallet disconnected.'
        });
        setShowBridgeFailedModal(true);
        setBridgeButtonText('Bridge Failed');
        setBridgeLoading(false);
        reset();
      }
    };

    // Listen for wallet rejection events
    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('disconnect', handleDisconnect);

    // Listen for message events that might indicate rejection
    const handleMessage = (event) => {
      if (event.data && typeof event.data === 'object') {
        // Check for rejection patterns in message data
        const messageStr = JSON.stringify(event.data).toLowerCase();
        if (messageStr.includes('reject') || messageStr.includes('cancel') || messageStr.includes('deny')) {
          handleTransactionRejection();
        }
      }
    };

    window.addEventListener('message', handleMessage);

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('disconnect', handleDisconnect);
      }
      window.removeEventListener('message', handleMessage);
    };
  }, [state.step, showBridgingModal, bridgeLoading, reset]);

  // Effect to handle wallet disconnect (clear balance) and reconnect (refresh balance)
  useEffect(() => {
    // Clear any existing interval first to prevent duplicates
    if (balanceIntervalRef.current) {
      clearInterval(balanceIntervalRef.current);
      balanceIntervalRef.current = null;
    }

    if (!isConnected) {
      // Wallet disconnected - clear balance
      clearBalance();
    } else if (isConnected && chainId) {
      // Wallet connected/reconnected - refresh balance immediately
      const chainIdDecimal = typeof chainId === 'string' ? parseInt(chainId, 16) : chainId;
      fetchTokenBalance('USDC', chainIdDecimal);

      // Background refresh every 30 seconds (no longer 4s to reduce RPC spam)
      balanceIntervalRef.current = setInterval(() => {
        try {
          if (isConnected && chainId && document.visibilityState === 'visible') {
            const chainIdDecimal = typeof chainId === 'string' ? parseInt(chainId, 16) : chainId;
            fetchTokenBalance('USDC', chainIdDecimal);
          }
        } catch {
          // ignore
        }
      }, 30000);

      return () => {
        if (balanceIntervalRef.current) {
          clearInterval(balanceIntervalRef.current);
          balanceIntervalRef.current = null;
        }
      };
    }
  }, [isConnected, chainId, clearBalance, fetchTokenBalance]);

  // Effect to sync the Bridge networks with the global wallet network and fetch balance
  // Note: We only include chainId and isConnected as dependencies to avoid loops
  // when fromChain/toChain are updated inside this effect
  // IMPORTANT: During and after bridge transactions, we don't update UI chains even if wallet switches
  // The wallet may switch chains for approvals, but UI should remain stable showing the original selection
  useEffect(() => {
    if (!chainId) return;

    // Skip UI chain updates during bridge transactions or after bridge has been initiated
    // Check if bridge is in progress (loading, approving, switching-network, or any active state)
    const isBridgeInProgress = bridgeLoading ||
      state.isLoading ||
      (state.step !== 'idle' && state.step !== 'success' && state.step !== 'error');

    // If bridge was initiated, keep chains fixed (even after completion)
    // This ensures the UI always shows the original source->destination selection
    if (isBridgeInProgress || bridgeInitiatedRef.current) {
      // During bridge or after bridge, only fetch balance but don't update UI chains
      // This allows wallet to switch chains for approvals without affecting UI
      try {
        const chainIdDecimal = typeof chainId === 'string' ? parseInt(chainId, 16) : chainId;
        if (isConnected) {
          fetchTokenBalance('USDC', chainIdDecimal);
        }
      } catch (error) {
        console.error('Error fetching balance during bridge:', error);
      }
      return; // Exit early - don't update UI chains
    }

    try {
      // Convert chainId to decimal if it's a hex string
      const chainIdDecimal = typeof chainId === 'string' ? parseInt(chainId, 16) : chainId;
      const arcChainId = parseInt(NETWORKS.ARC_TESTNET.chainId, 16);
      const sepoliaChainId = parseInt(NETWORKS.ETHEREUM_SEPOLIA.chainId, 16);
      const baseSepoliaChainId = parseInt(NETWORKS.BASE_SEPOLIA.chainId, 16);

      if (chainIdDecimal === arcChainId) {
        // If wallet is on Arc Testnet, set it as the 'from' chain
        setFromChain(prevFromChain => {
          if (prevFromChain !== 'Arc Testnet') {
            return 'Arc Testnet';
          }
          return prevFromChain;
        });
        // Ensure 'to' chain is different (only if currently the same)
        setToChain(prevToChain => {
          if (prevToChain === 'Arc Testnet') {
            return 'Sepolia';
          }
          return prevToChain;
        });
      } else if (chainIdDecimal === sepoliaChainId) {
        // If wallet is on Sepolia, set it as the 'from' chain
        setFromChain(prevFromChain => {
          if (prevFromChain !== 'Sepolia') {
            return 'Sepolia';
          }
          return prevFromChain;
        });
        // Ensure 'to' chain is different (only if currently the same)
        setToChain(prevToChain => {
          if (prevToChain === 'Sepolia') {
            return 'Arc Testnet';
          }
          return prevToChain;
        });
      } else if (chainIdDecimal === baseSepoliaChainId) {
        // If wallet is on Base Sepolia, set it as the 'from' chain
        setFromChain(prevFromChain => {
          if (prevFromChain !== 'Base Sepolia') {
            return 'Base Sepolia';
          }
          return prevFromChain;
        });
        // Ensure 'to' chain is different (only if currently the same)
        setToChain(prevToChain => {
          if (prevToChain === 'Base Sepolia') {
            return 'Sepolia';
          }
          return prevToChain;
        });
      }

      // Fetch balance when chain changes
      if (isConnected) {
        fetchTokenBalance('USDC', chainIdDecimal);
      }
    } catch {
      // console.error('Error processing chainId');
    }
  }, [chainId, isConnected, fetchTokenBalance, bridgeLoading, state.isLoading, state.step]);

  // Helper function to map chain names to chain IDs
  const getChainIdByName = useCallback((chainName) => {
    switch (chainName) {
      case 'Arc Testnet':
        return parseInt(NETWORKS.ARC_TESTNET.chainId, 16);
      case 'Sepolia':
      case 'Sepolia Testnet':
      case 'Ethereum Sepolia':
      case 'Sepolia Testnet (ETH)':
        return parseInt(NETWORKS.ETHEREUM_SEPOLIA.chainId, 16);
      case 'Base Sepolia':
        return parseInt(NETWORKS.BASE_SEPOLIA.chainId, 16);
      default:
        return null;
    }
  }, []);

  // Reusable function to save bridge transaction (success or failure)
  const saveBridgeTransaction = useCallback(async (txHash, txStatus = 'success') => {
    try {
      const saved = await getItem('myTransactions');
      const existing = saved && Array.isArray(saved) ? saved : [];

      // Check if transaction already exists
      const exists = existing.some(tx => tx.hash === txHash);

      if (!exists && txHash) {
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
          initiatedBy: 'StacDApp', // Mark as dApp-initiated for filtering
        };

        existing.unshift(bridgeTx);
        // Keep only last 100 transactions
        const trimmed = existing.slice(0, 100);
        await setItem('myTransactions', trimmed);

        // Also backup to sessionStorage for recovery after site clear
        try {
          if (walletAddress) {
            const key = `stac_tx_backup_${walletAddress.toLowerCase()}`;
            const walletTxs = trimmed.filter(tx =>
              tx.address?.toLowerCase() === walletAddress.toLowerCase()
            );
            sessionStorage.setItem(key, JSON.stringify(walletTxs));
          }
        } catch {
          // Silently fail sessionStorage backup
        }

        // Dispatch custom event to notify Transactions page
        window.dispatchEvent(new CustomEvent('bridgeTransactionSaved'));
      }
    } catch {
      // console.error('Error saving bridge transaction:', err);
    }
  }, [fromChain, toChain, amount, walletAddress, getChainIdByName]);

  // Effect to refresh balances after successful bridge transaction and save transaction
  useEffect(() => {
    if (state.step === 'success' && state.sourceTxHash) {
      setSourceTxHash(state.sourceTxHash);
      if (bridgeStartTime) {
        const time = (Date.now() - bridgeStartTime) / 1000;
        const mins = Math.floor(time / 60);
        const secs = Math.floor(time % 60);
        setBridgeFinalTime(mins > 0 ? `${mins}m ${secs}s` : `${secs}s`);
      }
      setShowBridgingModal(false);
      setShowBridgeSuccessModal(true);
      saveBridgeTransaction(state.sourceTxHash || state.receiveTxHash, 'success');

      if (chainId && isConnected) {
        const chainIdDecimal = typeof chainId === 'string' ? parseInt(chainId, 16) : chainId;
        fetchTokenBalance('USDC', chainIdDecimal);
        const timer1 = setTimeout(() => fetchTokenBalance('USDC', chainIdDecimal), 3000);
        const timer2 = setTimeout(() => fetchTokenBalance('USDC', chainIdDecimal), 8000);
        return () => {
          clearTimeout(timer1);
          clearTimeout(timer2);
        };
      }
    }
  }, [state.step, state.sourceTxHash, state.receiveTxHash, chainId, fetchTokenBalance, isConnected, bridgeStartTime, saveBridgeTransaction]);

  // Effect to refresh balance after bridge error/cancellation
  useEffect(() => {
    if (state.step === 'error' && isConnected && chainId) {
      // Refresh balance immediately after error/cancellation to ensure it's up to date
      const chainIdDecimal = typeof chainId === 'string' ? parseInt(chainId, 16) : chainId;
      fetchTokenBalance('USDC', chainIdDecimal);

      // Also refresh after a short delay to ensure we get the latest balance
      const timer = setTimeout(() => {
        fetchTokenBalance('USDC', chainIdDecimal);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [state.step, chainId, fetchTokenBalance, isConnected]);

  // Effect to reset timer when bridge completes or errors
  useEffect(() => {
    if (state.step === 'success' || state.step === 'error') {
      // Reset timer when bridge completes or errors
      setBridgeStartTime(null);
    }
  }, [state.step]);


  const addArcNetwork = useCallback(async () => {
    const ARC_TESTNET_CONFIG = {
      chainId: '0x4cef52', // Hex for 5042002
      chainName: 'Arc Testnet',
      rpcUrls: ['https://rpc.testnet.arc.network'],
      nativeCurrency: {
        name: 'USDC',
        symbol: 'USDC',
        decimals: 18
      },
      blockExplorerUrls: ['https://testnet.arcscan.app']
    };
    if (!window || !window.ethereum) return;

    try {
      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [ARC_TESTNET_CONFIG]
      });
      setShowNetworkSuccess(true);
      setTimeout(() => setShowNetworkSuccess(false), 3000);
    } catch (error) {
      if (error && error.code !== 4001) {
        console.error('Error adding Arc Testnet:', error);
      }
    }
  }, []);

  // Handle network changes with auto-switch
  const handleNetworkChange = useCallback(async (newChain) => {
    const isBridgeInProgress = bridgeLoading ||
      state.isLoading ||
      (state.step !== 'idle' && state.step !== 'success' && state.step !== 'error');

    if (isBridgeInProgress) return;

    bridgeInitiatedRef.current = false;
    initialFromChainRef.current = null;
    initialToChainRef.current = null;

    if (!isConnected) {
      setFromChain(newChain);
      return;
    }

    try {
      const chainId = getChainIdByName(newChain);
      if (chainId) {
        await switchChainAsync({ chainId });
        setFromChain(newChain);
        fetchTokenBalance('USDC', chainId);
      }
    } catch (error) {
      if ((error?.code === 4902 || error?.message?.includes('wallet_addEthereumChain')) && window?.ethereum) {
        try {
          const network = newChain === 'Arc Testnet' ? NETWORKS.ARC_TESTNET :
            (newChain === 'Sepolia') ? NETWORKS.ETHEREUM_SEPOLIA :
              NETWORKS.BASE_SEPOLIA;

          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: network.chainId,
              chainName: network.chainName,
              nativeCurrency: network.nativeCurrency,
              rpcUrls: network.rpcUrls,
              blockExplorerUrls: network.blockExplorerUrls,
            }],
          });
          const chainId = getChainIdByName(newChain);
          if (chainId) {
            await switchChainAsync({ chainId });
            setFromChain(newChain);
            fetchTokenBalance('USDC', chainId);
          }
        } catch { /* ignore */ }
      }
      setFromChain(newChain);
    }
  }, [bridgeLoading, state.isLoading, state.step, isConnected, getChainIdByName, switchChainAsync, fetchTokenBalance]);
  // New function to handle 'To' network changes with auto-switch
  const handleToNetworkChange = useCallback((newChain) => {
    const isBridgeInProgress = bridgeLoading ||
      state.isLoading ||
      (state.step !== 'idle' && state.step !== 'success' && state.step !== 'error');

    if (isBridgeInProgress) return;

    bridgeInitiatedRef.current = false;
    initialFromChainRef.current = null;
    initialToChainRef.current = null;
    setToChain(newChain);
  }, [bridgeLoading, state.isLoading, state.step]);

  const handleBridge = useCallback(async () => {
    if (!isConnected) {
      setBridgeError({ title: 'Error Details', message: 'Please connect your wallet first.' });
      setShowBridgeFailedModal(true); return;
    }
    const amountFloat = parseFloat(amount);
    if (!amount || isNaN(amountFloat) || amountFloat < 1) {
      setBridgeError({ title: 'Error Details', message: amountFloat < 1 ? 'Minimum bridge amount is 1 USDC.' : 'Invalid amount.' });
      setShowBridgeFailedModal(true); return;
    }
    if (amountFloat > parseFloat(tokenBalance || '0')) {
      setBridgeError({ title: 'Error Details', message: `Insufficient balance.` });
      setShowBridgeFailedModal(true); return;
    }
    setStopTimer(false);
    initialFromChainRef.current = fromChain;
    initialToChainRef.current = toChain;
    bridgeInitiatedRef.current = true;
    setBridgeStartTime(Date.now());
    setShowBridgingModal(true);
    setBridgeLoading(true);
    setBridgeButtonText('Bridging...');

    timeoutIdRef.current = setTimeout(() => {
      if (state.step === 'approving') {
        setStopTimer(true); setShowBridgingModal(false);
        setBridgeError({ title: 'Error Details', message: 'Transaction timeout.' });
        setShowBridgeFailedModal(true); setBridgeButtonText('Bridge Failed');
        setBridgeLoading(false); reset();
      }
    }, 120000);

    try {
      let direction;
      if (fromChain === 'Sepolia') {
        direction = toChain === 'Arc Testnet' ? 'sepolia-to-arc' : 'sepolia-to-base';
      } else if (fromChain === 'Arc Testnet') {
        direction = toChain === 'Sepolia' ? 'arc-to-sepolia' : 'arc-to-base';
      } else if (fromChain === 'Base Sepolia') {
        direction = toChain === 'Sepolia' ? 'base-to-sepolia' : 'base-to-arc';
      }

      const result = await bridge('USDC', amount, direction);
      if (timeoutIdRef.current) { clearTimeout(timeoutIdRef.current); timeoutIdRef.current = null; }
      if (result.step === 'error') {
        setStopTimer(true);
        let failedTxHash = result.sourceTxHash || result.receiveTxHash || result.transaction?.hash || result.hash;
        if (failedTxHash) saveBridgeTransaction(failedTxHash, 'failed');
        setShowBridgingModal(false); setBridgeLoading(false);
        setBridgeError({ title: 'Error Details', message: result.error || 'Transaction failed.' });
        setShowBridgeFailedModal(true); setBridgeButtonText('Bridge Failed'); reset();
      }
    } catch (err) {
      setStopTimer(true);
      if (timeoutIdRef.current) { clearTimeout(timeoutIdRef.current); timeoutIdRef.current = null; }
      setShowBridgingModal(false);
      setBridgeError({ title: 'Error Details', message: err.message || 'An unexpected error occurred.' });
      setShowBridgeFailedModal(true); setBridgeButtonText('Bridge Failed');
    } finally { setBridgeLoading(false); }
  }, [isConnected, amount, tokenBalance, fromChain, toChain, state.step, bridge, reset, saveBridgeTransaction]);

  const closeBridgingModal = useCallback(() => {
    if (state.step !== 'success' && bridgeLoading) {
      setStopTimer(true);
      if (timeoutIdRef.current) { clearTimeout(timeoutIdRef.current); timeoutIdRef.current = null; }
      setShowBridgingModal(false);
      setBridgeError({ title: 'Error Details', message: 'Transaction cancelled.' });
      setShowBridgeFailedModal(true); setBridgeLoading(false); reset();
      bridgeInitiatedRef.current = false;
      return;
    }
    setShowBridgingModal(false); setAmount(''); setBridgeButtonText('Bridge'); setBridgeLoading(false); reset();
  }, [state.step, bridgeLoading, reset]);

  const closeBridgeFailedModal = useCallback(() => {
    setShowBridgeFailedModal(false); setAmount(''); setBridgeButtonText('Bridge'); reset();
    bridgeInitiatedRef.current = false;
  }, [reset]);

  // Effect to show bridge failed modal when state indicates an error
  useEffect(() => {
    if (state.step === 'error' && state.error) {
      console.log('useEffect detected state.step === error, showing Bridge Failed modal:', state.error);

      // Save failed transaction if we have a transaction hash
      if (state.sourceTxHash || state.receiveTxHash) {
        saveBridgeTransaction(state.sourceTxHash || state.receiveTxHash, 'failed');
      }

      // Close the in-progress modal first
      setShowBridgingModal(false);

      setBridgeError({
        title: 'Error Details',
        message: state.error
      });
      setShowBridgeFailedModal(true);
      setBridgeButtonText('Bridge'); // Reset to default
      setBridgeLoading(false);

      console.log('Bridge Failed modal should now be visible');
    }
  }, [state, saveBridgeTransaction]);




  return (
    <div className="max-w-[540px] mx-auto w-full">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bridge-container group"
      >
        {/* 4-Corner Grey Glow System - Desktop Only */}
        <div className="hidden md:block absolute -top-20 -left-20 w-48 h-48 bg-gradient-to-br from-slate-300 to-slate-400 opacity-[0.1] blur-[60px] rounded-full"></div>
        <div className="hidden md:block absolute -top-20 -right-20 w-48 h-48 bg-gradient-to-bl from-slate-300 to-slate-400 opacity-[0.1] blur-[60px] rounded-full"></div>
        <div className="hidden md:block absolute -bottom-20 -left-20 w-48 h-48 bg-gradient-to-tr from-slate-300 to-slate-400 opacity-[0.1] blur-[60px] rounded-full"></div>
        <div className="hidden md:block absolute -bottom-20 -right-20 w-48 h-48 bg-gradient-to-tl from-slate-300 to-slate-400 opacity-[0.1] blur-[60px] rounded-full"></div>

        {/* Header - Refined */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="bridge-title">{t('Bridge Assets')}</h1>
          </div>
          <button
            onClick={addArcNetwork}
            className="add-arc-button group relative flex items-center gap-2"
            aria-label="Add Arc Testnet to Wallet"
          >
            <Wallet size={14} className="text-indigo-500 group-hover:text-blue-500 transition-colors" />
            <span>{t('Add Arc')}</span>
            <AnimatePresence>
              {showNetworkSuccess && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, x: 10 }}
                  animate={{ opacity: 1, scale: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.9, x: 10 }}
                  className="absolute top-1/2 -translate-y-1/2 right-[calc(100%+12px)] sm:top-[-8px] sm:translate-y-0 sm:left-[calc(100%+12px)] sm:right-auto bg-indigo-600 dark:bg-indigo-500 px-3 py-2 rounded-xl shadow-[0_8px_20px_rgba(79,70,229,0.4)] flex items-center gap-2.5 z-50 border border-white/10 min-w-max"
                >
                  <div className="flex-shrink-0 w-5 h-5 rounded-full bg-emerald-400 flex items-center justify-center shadow-sm">
                    <Check size={12} className="text-indigo-900 stroke-[3.5]" />
                  </div>
                  <span className="text-[12px] font-bold text-white tracking-tight leading-none whitespace-nowrap">
                    {t('Network added successfully')}
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </button>
        </div>

        {/* Network Selection Section - Blended Style */}
        <div className="w-full mb-6 relative z-10">
          <div className="p-0 bg-transparent border-none shadow-none">
            <div className="flex items-center gap-2 sm:gap-3 w-full">

              {/* FROM Selector */}
              <div className="flex-1 min-w-0">
                <button
                  ref={fromChainTriggerRef}
                  onClick={() => {
                    const isBridgeInProgress = bridgeLoading ||
                      state.isLoading ||
                      (state.step !== 'idle' && state.step !== 'success' && state.step !== 'error');
                    if (!isBridgeInProgress) {
                      setShowChainSelector('from');
                    }
                  }}
                  disabled={bridgeLoading || state.isLoading || (state.step !== 'idle' && state.step !== 'success' && state.step !== 'error')}
                  className="w-full h-12 md:h-14 px-2 sm:px-4 rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 flex items-center justify-between gap-2 transition-all hover:bg-slate-100 dark:hover:bg-white/[0.08] disabled:opacity-50 min-w-0 active:scale-[0.98] shadow-sm"
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <div className="h-6 w-6 shrink-0 rounded-full overflow-hidden bg-white dark:bg-white/10 shadow-sm border border-slate-200/50 dark:border-white/10">
                      {(() => {
                        const displayFromChain = bridgeInitiatedRef.current && initialFromChainRef.current ? initialFromChainRef.current : fromChain;
                        const chainKey = displayFromChain.toLowerCase();
                        if (chainKey.includes('arc')) return <img src="/icons/Arc.png" alt="Arc" className="w-full h-full object-cover bg-black" />;
                        if (chainKey.includes('base')) return <img src="/icons/base.png" alt="Base" className="w-full h-full object-cover bg-white" />;
                        if (chainKey.includes('sepolia')) return <img src="/icons/eth.png" alt="ETH" className="w-full h-full object-cover bg-white" />;
                        return null;
                      })()}
                    </div>
                    <span className="truncate text-xs sm:text-sm font-bold text-slate-800 dark:text-white">
                      <span className="sm:hidden">
                        {(() => {
                          const name = bridgeInitiatedRef.current && initialFromChainRef.current ? initialFromChainRef.current : fromChain;
                          if (name === 'Ethereum Sepolia') return 'Sepolia';
                          if (name === 'Base Sepolia') return 'Base Sep..';
                          if (name === 'Arc Testnet') return 'Arc Testnet';
                          return name;
                        })()}
                      </span>
                      <span className="hidden sm:inline">
                        {bridgeInitiatedRef.current && initialFromChainRef.current ? initialFromChainRef.current : fromChain}
                      </span>
                    </span>
                  </div>
                  <ChevronDown className="h-4 w-4 shrink-0 text-slate-400 dark:text-slate-500" />
                </button>
              </div>

              {/* ARROW - SWAP BUTTON */}
              <div className="flex-shrink-0">
                <button
                  onClick={() => {
                    const isBridgeInProgress = bridgeLoading ||
                      state.isLoading ||
                      (state.step !== 'idle' && state.step !== 'success' && state.step !== 'error');

                    if (isBridgeInProgress) return;

                    try {
                      const tempFromChain = fromChain;
                      const tempToChain = toChain;

                      bridgeInitiatedRef.current = false;
                      initialFromChainRef.current = null;
                      initialToChainRef.current = null;

                      setFromChain(tempToChain);
                      setToChain(tempFromChain);

                      if (isConnected) {
                        const newFromChainId = getChainIdByName(tempToChain);
                        if (newFromChainId) {
                          switchChainAsync({ chainId: newFromChainId }).catch(err => {
                            console.warn('Failed to switch network in wallet:', err);
                          });
                          fetchTokenBalance('USDC', newFromChainId);
                        }
                      }
                    } catch (error) {
                      console.error('Error swapping chains:', error);
                    }
                  }}
                  disabled={bridgeLoading || state.isLoading || (state.step !== 'idle' && state.step !== 'success' && state.step !== 'error')}
                  aria-label="Switch Networks"
                  className="
                    h-9 w-9 sm:h-10 sm:w-10
                    flex-shrink-0
                    flex items-center justify-center
                    bg-slate-100 dark:bg-white/[0.04]
                    border border-slate-200 dark:border-white/10
                    rounded-xl
                    text-slate-600 dark:text-slate-400
                    transition-all hover:scale-110 hover:bg-slate-200 dark:hover:bg-white/10 active:scale-90
                    disabled:opacity-50 disabled:cursor-not-allowed
                    shadow-sm
                  "
                >
                  <ArrowRight size={18} />
                </button>
              </div>

              {/* TO Selector */}
              <div className="flex-1 min-w-0">
                <button
                  ref={toChainTriggerRef}
                  onClick={() => {
                    const isBridgeInProgress = bridgeLoading ||
                      state.isLoading ||
                      (state.step !== 'idle' && state.step !== 'success' && state.step !== 'error');
                    if (!isBridgeInProgress) {
                      setShowChainSelector('to');
                    }
                  }}
                  disabled={bridgeLoading || state.isLoading || (state.step !== 'idle' && state.step !== 'success' && state.step !== 'error')}
                  className="w-full h-12 md:h-14 px-2 sm:px-4 rounded-xl bg-slate-50 dark:bg-white/[0.04] border border-slate-200 dark:border-white/10 flex items-center justify-between gap-2 transition-all hover:bg-slate-100 dark:hover:bg-white/[0.08] disabled:opacity-50 min-w-0 active:scale-[0.98] shadow-sm"
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <div className="h-6 w-6 shrink-0 rounded-full overflow-hidden bg-white dark:bg-white/10 shadow-sm border border-slate-200/50 dark:border-white/10">
                      {(() => {
                        const displayToChain = bridgeInitiatedRef.current && initialToChainRef.current ? initialToChainRef.current : toChain;
                        const chainKey = displayToChain.toLowerCase();
                        if (chainKey.includes('arc')) return <img src="/icons/Arc.png" alt="Arc" className="w-full h-full object-cover bg-black" />;
                        if (chainKey.includes('base')) return <img src="/icons/base.png" alt="Base" className="w-full h-full object-cover bg-white" />;
                        if (chainKey.includes('sepolia')) return <img src="/icons/eth.png" alt="ETH" className="w-full h-full object-cover bg-white" />;
                        return null;
                      })()}
                    </div>
                    <span className="truncate text-xs sm:text-sm font-bold text-slate-800 dark:text-white">
                      <span className="sm:hidden">
                        {(() => {
                          const name = bridgeInitiatedRef.current && initialToChainRef.current ? initialToChainRef.current : toChain;
                          if (name === 'Ethereum Sepolia') return 'Sepolia';
                          if (name === 'Base Sepolia') return 'Base Sep..';
                          if (name === 'Arc Testnet') return 'Arc Testnet';
                          return name;
                        })()}
                      </span>
                      <span className="hidden sm:inline">
                        {bridgeInitiatedRef.current && initialToChainRef.current ? initialToChainRef.current : toChain}
                      </span>
                    </span>
                  </div>
                  <ChevronDown className="h-4 w-4 shrink-0 text-slate-400 dark:text-slate-500" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Asset Input Section */}
        <div className="input-group">
          <div className="input-header">
            <p className="input-label">{t('You send')}</p>
          </div>
          {/* Mobile Spacer */}
          <div className="block sm:hidden h-2"></div>
          <div className="input-row">
            <input
              type="text"
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(sanitizeInput(e.target.value))}
              placeholder="0.0"
              className="amount-input"
              style={{ WebkitAppearance: 'none', touchAction: 'manipulation', minWidth: 0 }}
            />
            {/* Token Pill - Static, no dropdown */}
            <div className="token-selector">
              <div className="token-icon">
                <img src="/icons/usdc.png" alt="USDC" className="w-full h-full object-contain" />
              </div>
              <span className="token-symbol">USDC</span>
            </div>
          </div>
          {isConnected && (
            <div className="input-footer">
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
              <button
                onClick={() => {
                  if (tokenBalance && parseFloat(tokenBalance) > 0) {
                    setAmount(tokenBalance);
                  }
                }}
                className="max-button"
              >
                {t('Max')}
              </button>
            </div>
          )}
        </div>


        {isConnected && amount && parseFloat(amount) > parseFloat(tokenBalance) && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 flex items-center gap-3"
          >
            <div className="w-0.5 h-6 rounded-full bg-amber-500 flex-shrink-0 opacity-80 shadow-[0_0_8px_rgba(245,158,11,0.3)]"></div>
            <p className="text-[12px] text-slate-600 dark:text-gray-400 leading-tight">
              <span className="font-bold text-amber-600 dark:text-amber-400">{t('Error')}:</span> {t('Insufficient USDC balance to complete this bridge')}
            </p>
          </motion.div>
        )}

        <div className="mt-4 mb-4 pt-4 border-t border-slate-200 dark:border-white/[0.06]">
          <div className="flex items-center gap-3">
            <div className="w-0.5 h-6 rounded-full bg-amber-500 flex-shrink-0 opacity-80 shadow-[0_0_8px_rgba(245,158,11,0.3)]"></div>
            <p className="text-[12px] text-slate-600 dark:text-gray-400 font-medium leading-tight">
              <span className="font-medium text-slate-800 dark:text-gray-200">{t('Note')}:</span> {t('Cross chain transfers are irreversible. Please verify all details before confirming the transaction.')}
            </p>
          </div>
        </div>

        {/* Bridge Button - Premium Call to Action */}
        <button
          onClick={handleBridge}
          disabled={!amount || bridgeLoading || !isConnected || state.isLoading || bridgeButtonText === 'Bridge Failed' || (isConnected && amount && parseFloat(amount) > parseFloat(tokenBalance || '0'))}
          className={`
            bridge-button
            ${(bridgeButtonText === 'Bridge Failed' || (isConnected && amount && parseFloat(amount) > parseFloat(tokenBalance || '0'))) ? 'bridge-button-failed' : ''}
            flex items-center justify-center gap-2
          `}
        >
          {bridgeLoading || state.isLoading ? (
            <>
              <Loader className="animate-spin" size={20} />
              <span>{t('Bridging')}...</span>
            </>
          ) : !isConnected ? (
            <>
              <Wallet size={20} />
              <span>{t('Connect Wallet')}</span>
            </>
          ) : (
            <span>{t(bridgeButtonText)}</span>
          )}
        </button>

        {/* Powered by Circle CCTP Badge */}
        <div className="powered-by-badge-bottom">
          <span>{t('Powered by Circle CCTP')}</span>
        </div>
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

      {/* Bridging Modal */}
      <BridgingModal
        isOpen={showBridgingModal}
        onClose={closeBridgingModal}
        fromChain={bridgeInitiatedRef.current && initialFromChainRef.current ? initialFromChainRef.current : fromChain}
        toChain={bridgeInitiatedRef.current && initialToChainRef.current ? initialToChainRef.current : toChain}
        amount={amount}
        startTime={bridgeStartTime}
        state={state}
        stopTimer={stopTimer}
      />

      <BridgeFailedModal
        isOpen={showBridgeFailedModal}
        onClose={closeBridgeFailedModal}
        fromChain={fromChain}
        toChain={toChain}
        errorTitle={bridgeError.title}
        errorMessage={bridgeError.message}
      />

      <BridgeSuccessModal
        isOpen={showBridgeSuccessModal}
        onClose={() => setShowBridgeSuccessModal(false)}
        fromChain={fromChain}
        toChain={toChain}
        amount={amount}
        timeTaken={bridgeFinalTime}
        txHash={sourceTxHash}
      />

      <BridgeRejectedModal
        isOpen={showBridgeRejectedModal}
        onClose={() => {
          setShowBridgeRejectedModal(false);
          setBridgeButtonText('Bridge');
        }}
        fromChain={fromChain}
        toChain={toChain}
      />

      <BridgeCancelledModal
        isOpen={showBridgeCancelledModal}
        onClose={() => setShowBridgeCancelledModal(false)}
        fromChain={fromChain}
        toChain={toChain}
      />

    </div >
  );
};

export default memo(Bridge);