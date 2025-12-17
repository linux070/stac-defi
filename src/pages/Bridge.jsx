import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useWallet } from '../contexts/WalletContext';
import { useSwitchChain } from 'wagmi';
import { ArrowLeftRight, Loader, AlertCircle, Info, Wallet, X, Settings } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { NETWORKS, TOKENS } from '../config/networks';
import { sanitizeInput } from '../utils/blockchain';
import { useBridge } from '../hooks/useBridge';
import BridgingModal from '../components/BridgingModal';
import BridgeFailedModal from '../components/BridgeFailedModal';

const Bridge = () => {
  const { t } = useTranslation();
  const { isConnected, address, chainId } = useWallet();
  const { switchChain } = useSwitchChain();
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
  const formatWholeAmount = (value) => {
    const n = typeof value === 'number' ? value : Number(value);
    if (!Number.isFinite(n)) return '0';
    return new Intl.NumberFormat(undefined, { maximumFractionDigits: 0 }).format(Math.round(n));
  };

  // Format balance to 2 decimal places
  const formatBalance = (value) => {
    const n = typeof value === 'number' ? value : Number(value);
    if (!Number.isFinite(n)) return '0.00';
    return n.toFixed(2);
  };

  // Refs for trigger buttons
  const fromChainTriggerRef = useRef(null);
  const toChainTriggerRef = useRef(null);
  
  // Effect to handle body overflow when modals are open
  useEffect(() => {
    const isModalOpen = showChainSelector || showBridgingModal || showBridgeFailedModal;
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
  }, [showChainSelector, showBridgingModal, showBridgeFailedModal]);

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
        setBridgeError({
          title: 'Transaction Rejected',
          message: 'Transaction cancelled: User rejected the transaction in wallet.'
        });
        setShowBridgeFailedModal(true);
        setBridgeButtonText('Bridge Failed');
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
  }, [state.step, reset, showBridgingModal, bridgeLoading]);

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
      
      // Set up periodic balance refresh to keep it updated (every 4 seconds)
      balanceIntervalRef.current = setInterval(() => {
        try {
          if (isConnected && chainId) {
            const chainIdDecimal = typeof chainId === 'string' ? parseInt(chainId, 16) : chainId;
            // Wrap in try-catch to prevent crashes if fetchTokenBalance fails
            fetchTokenBalance('USDC', chainIdDecimal).catch(err => {
              console.error('Error in balance refresh interval:', err);
              // Don't throw - just log the error to prevent crashes
            });
          }
        } catch (error) {
          console.error('Error in balance interval callback:', error);
          // Prevent crashes by catching any errors
        }
      }, 4000); // Refresh every 4 seconds (within 3-5 second range)
      
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
      }
      
      // Fetch balance when chain changes
      if (isConnected) {
        fetchTokenBalance('USDC', chainIdDecimal);
        
        // Note: Balance refresh is already handled by the wallet connection useEffect above
        // No need to create another interval here to avoid duplicates
      }
    } catch (error) {
      console.error('Error processing chainId:', error);
    }
  }, [chainId, isConnected, fetchTokenBalance, bridgeLoading, state.isLoading, state.step]);

  // Effect to refresh balances after successful bridge transaction
  useEffect(() => {
    if (state.step === 'success') {
      // Refresh balance immediately, then again after delay to ensure blockchain has updated
      if (chainId && isConnected) {
        const chainIdDecimal = typeof chainId === 'string' ? parseInt(chainId, 16) : chainId;
        fetchTokenBalance('USDC', chainIdDecimal);
        
        // Also refresh after a delay to catch blockchain updates
        const timer1 = setTimeout(() => {
          fetchTokenBalance('USDC', chainIdDecimal);
        }, 3000);
        
        // One more refresh after longer delay
        const timer2 = setTimeout(() => {
          fetchTokenBalance('USDC', chainIdDecimal);
        }, 8000);
        
        return () => {
          clearTimeout(timer1);
          clearTimeout(timer2);
        };
      }
    }
  }, [state.step, chainId, fetchTokenBalance, isConnected]);
  
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

  // Helper function to map chain names to chain IDs
  const getChainIdByName = (chainName) => {
    switch (chainName) {
      case 'Arc Testnet':
        return parseInt(NETWORKS.ARC_TESTNET.chainId, 16);
      case 'Sepolia':
      case 'Sepolia Testnet':
      case 'Ethereum Sepolia':
      case 'Sepolia Testnet (ETH)':
        return parseInt(NETWORKS.ETHEREUM_SEPOLIA.chainId, 16);
      default:
        return null;
    }
  };

  // Handle network changes with auto-switch
  const handleNetworkChange = async (newChain) => {
    // Prevent chain switching during bridge transactions
    const isBridgeInProgress = bridgeLoading || 
                               state.isLoading || 
                               (state.step !== 'idle' && state.step !== 'success' && state.step !== 'error');
    
    if (isBridgeInProgress) {
      return; // Don't allow chain switching during bridge
    }
    
    // Reset bridge initiated flag and initial chains when user manually changes chains
    // This allows chain syncing to resume
    bridgeInitiatedRef.current = false;
    initialFromChainRef.current = null;
    initialToChainRef.current = null;
    
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
        
        // Fetch balance for the new chain
        fetchTokenBalance('USDC', chainId);
      }
    } catch (error) {
      console.error('Failed to switch network:', error);
      
      // Handle the case where the chain needs to be added to the wallet (Error 4902)
      if ((error?.code === 4902 || error?.message?.includes('wallet_addEthereumChain')) && window && window.ethereum) {
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
              fetchTokenBalance('USDC', chainId);
            }
          } else if (newChain === 'Sepolia' || newChain === 'Sepolia Testnet' || newChain === 'Ethereum Sepolia' || newChain === 'Sepolia Testnet (ETH)') {
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
              fetchTokenBalance('USDC', chainId);
            }
          }
        } catch (addError) {
          console.error('Failed to add network:', addError);
        }
      }
      
      // Even if switching fails, update the local state for UI consistency
      setFromChain(newChain);
    }
  };  // New function to handle 'To' network changes with auto-switch
  const handleToNetworkChange = async (newChain) => {
    // Prevent chain switching during bridge transactions
    const isBridgeInProgress = bridgeLoading || 
                               state.isLoading || 
                               (state.step !== 'idle' && state.step !== 'success' && state.step !== 'error');
    
    if (isBridgeInProgress) {
      return; // Don't allow chain switching during bridge
    }
    
    // Reset bridge initiated flag and initial chains when user manually changes chains
    // This allows chain syncing to resume
    bridgeInitiatedRef.current = false;
    initialFromChainRef.current = null;
    initialToChainRef.current = null;
    
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
        
        // Note: We don't fetch balance here since the 'from' chain determines the balance display
      }
    } catch (error) {
      console.error('Failed to switch network:', error);
      
      // Handle the case where the chain needs to be added to the wallet (Error 4902)
      if ((error?.code === 4902 || error?.message?.includes('wallet_addEthereumChain')) && window && window.ethereum) {
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
          } else if (newChain === 'Sepolia' || newChain === 'Sepolia Testnet' || newChain === 'Ethereum Sepolia' || newChain === 'Sepolia Testnet (ETH)') {
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
    // Validation checks
    if (!isConnected) {
      setBridgeError({
        title: 'Error Details',
        message: 'Please connect your wallet first.'
      });
      setShowBridgeFailedModal(true);
      return;
    }
    
    const amountFloat = parseFloat(amount);
    if (!amount || isNaN(amountFloat) || amountFloat <= 0) {
      setBridgeError({
        title: 'Error Details',
        message: `Invalid amount '${amount}': Amount must be a valid number string.`
      });
      setShowBridgeFailedModal(true);
      return;
    }
    
    // Minimum amount check - below 0.1 USDC shows Bridge Failed
    if (amountFloat < 0.1) {
      setBridgeError({
        title: 'Error Details',
        message: 'Minimum bridge amount is 0.1 USDC. Please enter a higher amount.'
      });
      setShowBridgeFailedModal(true);
      return;
    }
    
    // Check if amount exceeds balance - show Bridge Failed with insufficient balance error
    if (amountFloat > parseFloat(tokenBalance || '0')) {
      setBridgeError({
        title: 'Error Details',
        message: `Insufficient balance: You have ${tokenBalance || '0'} USDC but trying to bridge ${amount} USDC.`
      });
      setShowBridgeFailedModal(true);
      return;
    }
    
    // Prevent transaction if Bridge Failed is displayed
    if (bridgeButtonText === 'Bridge Failed') {
      return;
    }
    
    // Reset timer stop flag
    setStopTimer(false);
    
    // Store the initial chains when bridge starts - these will remain fixed throughout
    // This ensures UI always shows the original source->destination, even when wallet switches
    initialFromChainRef.current = fromChain;
    initialToChainRef.current = toChain;
    
    // Mark bridge as initiated - this will keep chains fixed during and after bridge
    bridgeInitiatedRef.current = true;
    
    // Show bridging modal
    setBridgeStartTime(Date.now());
    setShowBridgingModal(true);
    setBridgeLoading(true);
    setBridgeButtonText('Bridging...');
    
    // Set up timeout detection
    const BRIDGE_TIMEOUT = 120000; // 2 minutes
    timeoutIdRef.current = setTimeout(() => {
      if (state.step === 'approving') {
        setStopTimer(true);
        setShowBridgingModal(false);
        setBridgeError({
          title: 'Error Details',
          message: 'Transaction timeout: Please try again and confirm the transaction promptly.'
        });
        setShowBridgeFailedModal(true);
        setBridgeButtonText('Bridge Failed');
        setBridgeLoading(false);
        reset();
      }
    }, BRIDGE_TIMEOUT);
    
    try {
      // Determine direction based on fromChain and toChain
      let direction;
      if (fromChain === 'Sepolia' || fromChain === 'Sepolia Testnet' || fromChain === 'Ethereum Sepolia' || fromChain === 'Sepolia Testnet (ETH)') {
        direction = 'sepolia-to-arc';
      } else if (fromChain === 'Arc Testnet') {
        direction = 'arc-to-sepolia';
      } else {
        throw new Error('Invalid source chain configuration');
      }
      
      const result = await bridge('USDC', amount, direction);
      
      // Clear timeout since transaction completed
      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current);
        timeoutIdRef.current = null;
      }
      
      // Handle the result
      if (result.step === 'success') {
        // Keep button as "Bridge" - success is shown in the modal
        // The modal will show the completed state via the state prop
        // User can close it manually using the close button
      } else if (result.step === 'error') {
        // Stop the timer
        setStopTimer(true);
        
        // Handle error result directly - show Bridge Failed modal immediately
        setShowBridgingModal(false);
        setBridgeLoading(false);
        
        // Set the error and show the failed modal immediately
        setBridgeError({
          title: 'Error Details',
          message: result.error || 'Transaction failed. Please try again.'
        });
        setShowBridgeFailedModal(true);
        setBridgeButtonText('Bridge Failed');
        
        // Also reset the bridge state
        reset();
        return; // Exit early, don't throw
      }
    } catch (error) {
      console.error('Bridge error:', error);
      console.log('Error details:', {
        code: error.code,
        message: error.message,
        name: error.name,
        stack: error.stack
      });
      
      // Stop the timer
      setStopTimer(true);
      
      // Clear timeout since we're handling the error
      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current);
        timeoutIdRef.current = null;
      }
      
      // Close the in-progress modal before showing the failure modal
      setShowBridgingModal(false);
      
      // Detect user cancellation/rejection from wallet
      // Check for various rejection patterns from different wallets/SDKs
      const isUserRejection = 
        error.code === 4001 || 
        error.code === 'ACTION_REJECTED' ||
        (error.message && (
          error.message.toLowerCase().includes('user rejected') ||
          error.message.toLowerCase().includes('user denied') ||
          error.message.toLowerCase().includes('transaction rejected') ||
          error.message.toLowerCase().includes('cancelled') ||
          error.message.toLowerCase().includes('canceled') ||
          error.message.toLowerCase().includes('rejected the request') ||
          error.message.toLowerCase().includes('user refused') ||
          error.message.toLowerCase().includes('user declined')
        ));
      
      if (isUserRejection) {
        setBridgeError({
          title: 'Error Details',
          message: 'Transaction rejected: User denied transaction signature.'
        });
      }
      // User closed wallet without action
      else if (error.message && (
        error.message.includes('User closed modal') ||
        error.message.includes('closed the modal') ||
        error.message.includes('popup closed')
      )) {
        setBridgeError({
          title: 'Error Details',
          message: 'Transaction cancelled: User closed wallet modal.'
        });
      }
      // Insufficient funds error
      else if (error.code === -32000 || (error.message && error.message.includes('insufficient funds'))) {
        setBridgeError({
          title: 'Error Details',
          message: 'Insufficient funds: Not enough balance to complete the bridge transaction including gas fees.'
        });
      }
      // Network/RPC errors
      else if (error.code === -32603 || (error.message && error.message.includes('network'))) {
        setBridgeError({
          title: 'Error Details',
          message: 'Network error: Unable to connect to blockchain. Please check your connection and try again.'
        });
      }
      // Gas estimation failed
      else if (error.message && error.message.includes('gas')) {
        setBridgeError({
          title: 'Error Details',
          message: 'Gas estimation failed: Transaction may fail or gas price too low.'
        });
      }
      // Generic fallback error - show modal for ANY error
      else {
        setBridgeError({
          title: 'Error Details',
          message: error.message || 'An unexpected error occurred during the bridge transaction.'
        });
      }
      
      // ALWAYS show the failed modal for any error in catch block
      // Set button to Bridge Failed state
      setBridgeButtonText('Bridge Failed');
      setShowBridgeFailedModal(true);
      
      // Log that we're showing the modal
      console.log('Showing Bridge Failed modal - Error caught:', error.message || error);
    } finally {
      setBridgeLoading(false);
      // Don't close the modal automatically, let user close it manually
    }
  };

  const closeBridgingModal = () => {
    // If transaction is still in progress (not completed), show Bridge Failed
    if (state.step !== 'success' && bridgeLoading) {
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
        message: 'Transaction cancelled: User closed the bridging modal.'
      });
      setShowBridgeFailedModal(true);
      setBridgeButtonText('Bridge Failed');
      setBridgeLoading(false);
      reset();
      // Reset bridge initiated flag and initial chains to allow chain syncing again
      bridgeInitiatedRef.current = false;
      initialFromChainRef.current = null;
      initialToChainRef.current = null;
      return;
    }
    
    // Transaction completed successfully, just close
    // Note: bridgeInitiatedRef remains true to keep chains fixed after completion
    setShowBridgingModal(false);
    setAmount('');
    setBridgeButtonText('Bridge'); // Always reset to default
    setBridgeLoading(false);
    reset(); // Reset the bridge state
  };

  const closeBridgeFailedModal = () => {
    setShowBridgeFailedModal(false);
    setAmount('');
    setBridgeButtonText('Bridge');
    reset(); // Reset the bridge state
    // Reset bridge initiated flag to allow chain syncing again
    bridgeInitiatedRef.current = false;
  };

  // Effect to show bridge failed modal when state indicates an error
  useEffect(() => {
    if (state.step === 'error' && state.error) {
      console.log('useEffect detected state.step === error, showing Bridge Failed modal:', state.error);
      
      // Close the in-progress modal first
      setShowBridgingModal(false);
      
      // Check if this is a wallet rejection (the error message will contain our formatted message)
      const isWalletRejection = state.error.toLowerCase().includes('transaction rejected') ||
                                state.error.toLowerCase().includes('user denied') ||
                                state.error.toLowerCase().includes('user rejected');
      
      setBridgeError({
        title: 'Error Details',
        message: state.error
      });
      setShowBridgeFailedModal(true);
      setBridgeButtonText('Bridge'); // Reset to default
      setBridgeLoading(false);
      
      console.log('Bridge Failed modal should now be visible');
    }
  }, [state]);


  const ChainSelector = ({ isOpen, onClose, selectedChain, onSelect, exclude, triggerRef }) => {
    const selectorRef = useRef(null);
    
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
    if (!isOpen) return null;

    const chainList = ['Arc Testnet', 'Sepolia'];

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
                <h3 className="text-xl font-bold">{t('Select Network')}</h3>
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
                        onSelect(chain);
                        onClose();
                      }}
                      className={`w-full p-4 rounded-lg flex items-center justify-between transition-all duration-200
                        ${chain === selectedChain ? 'bg-primary-50 dark:bg-primary-900/20 border-2 border-primary-500' : 'border-2 border-transparent hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center">
                          {chain.includes('Arc') ? (
                            <img 
                              src="/icons/Arc.png" 
                              alt="Arc Testnet" 
                              className="w-10 h-10 rounded-full object-contain"
                            />
                          ) : chain.includes('Sepolia') ? (
                            <img 
                              src="/icons/eth.png" 
                              alt="Sepolia" 
                              className="w-10 h-10 rounded-full object-contain"
                            />
                          ) : null}
                        </div>
                        <div className="text-left">
                          <p className="font-semibold">{chain}</p>
                          <p className="text-xs text-gray-500">{t('Testnet')}</p>
                        </div>
                      </div>
                      {chain === exclude && (
                        <div className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-xs text-gray-500 dark:text-gray-400 rounded">
                          {t('Selected')}
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Info Box */}
              <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg flex items-start space-x-2 flex-shrink-0">
                <Info className="text-blue-500 dark:text-blue-400 flex-shrink-0 mt-0.5" size={16} />
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  {t('Select a different network for your destination chain. The same network cannot be used for both source and destination.')}
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  };

  return (
    <div className="max-w-lg mx-auto w-full px-2 sm:px-0">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/80 dark:bg-gray-900/70 backdrop-blur rounded-2xl border border-gray-200 dark:border-white/10 shadow-lg dark:shadow-black/30 p-4 sm:p-6 space-y-4 sm:space-y-6 relative"
      >
        {/* Powered by Circle CCTP Badge - Top Right */}
        <div className="absolute top-4 right-4 flex items-center space-x-1 px-3 py-2 text-xs md:text-sm border-2 border-blue-400 text-blue-500 dark:text-blue-400 rounded-lg z-10">
          <span>Powered by Circle CCTP</span>
        </div>

        {/* Header */}
        <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-3 sm:mb-4 text-gray-900 dark:text-white">Bridge Assets</h2>

        {/* Info Banner */}
        <div className="bg-blue-50/80 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 border border-blue-100 dark:border-blue-800 rounded-xl p-3 sm:p-4 mb-4 sm:mb-6 shadow-sm">
          <div className="flex items-start">
            <Info className="flex-shrink-0 mt-0.5 mr-2" size={16} />
            <p className="text-xs sm:text-sm">
              {t("Cross-Chain Bridging: Transfer assets securely between Sepolia and Arc Testnet.")}
            </p>
          </div>
        </div>

        {/* Network Selection Section */}
        <div className="space-y-4 sm:space-y-6">
          {/* From Network */}
          {/* Use initial chains if bridge was initiated, otherwise use current chains */}
          <div>
            <label className="block text-xs sm:text-sm font-medium mb-2 text-gray-900 dark:text-white">From</label>
            <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-3 sm:p-4 bg-white/80 dark:bg-gray-900/60 shadow-sm transition-all duration-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center">
                    {(() => {
                      const displayFromChain = bridgeInitiatedRef.current && initialFromChainRef.current ? initialFromChainRef.current : fromChain;
                      return displayFromChain.includes('Arc') ? (
                        <img 
                          src="/icons/Arc.png" 
                          alt="Arc Testnet" 
                          className="w-10 h-10 rounded-full object-contain"
                        />
                      ) : displayFromChain.includes('Sepolia') ? (
                        <img 
                          src="/icons/eth.png" 
                          alt="Sepolia" 
                          className="w-10 h-10 rounded-full object-contain"
                        />
                      ) : null;
                    })()}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {bridgeInitiatedRef.current && initialFromChainRef.current ? initialFromChainRef.current : fromChain}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Source Network</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Switch Button */}
          <div className="flex justify-center relative -my-2 sm:-my-3 z-10">
            <button
              onClick={() => {
                // Prevent chain switching during bridge transactions
                const isBridgeInProgress = bridgeLoading || 
                                         state.isLoading || 
                                         (state.step !== 'idle' && state.step !== 'success' && state.step !== 'error');
                
                if (isBridgeInProgress) {
                  return; // Don't allow chain switching during bridge
                }
                
                try {
                  // Store current values temporarily
                  const tempFromChain = fromChain;
                  const tempToChain = toChain;
                  
                  // Reset bridge initiated flag and initial chains when user manually switches chains
                  // This allows chain syncing to resume
                  bridgeInitiatedRef.current = false;
                  initialFromChainRef.current = null;
                  initialToChainRef.current = null;
                  
                  // Swap the chains in UI first
                  setFromChain(tempToChain);
                  setToChain(tempFromChain);
                  
                  // Add animation class for smooth transition
                  const switchButton = document.querySelector('.switch-button');
                  if (switchButton) {
                    switchButton.classList.add('rotate-180');
                    setTimeout(() => {
                      switchButton.classList.remove('rotate-180');
                    }, 300);
                  }
                  
                  // Also swap in wallet if connected
                  if (isConnected) {
                    // Get the chain ID for the new 'from' chain (which was previously the 'to' chain)
                    const newFromChainId = getChainIdByName(tempToChain);
                    if (newFromChainId) {
                      switchChain({ chainId: newFromChainId }).catch(err => {
                        console.warn('Failed to switch network in wallet:', err);
                        // Even if wallet switch fails, UI has already been updated
                      });
                    } else {
                      console.warn('Could not get chain ID for:', tempToChain);
                    }
                  }
                  
                  // Refresh balance for the new 'from' chain
                  if (isConnected) {
                    const newFromChainId = getChainIdByName(tempToChain);
                    if (newFromChainId) {
                      fetchTokenBalance('USDC', newFromChainId);
                    }
                  }
                } catch (error) {
                  console.error('Error swapping chains:', error);
                }
              }}
              disabled={bridgeLoading || state.isLoading || (state.step !== 'idle' && state.step !== 'success' && state.step !== 'error')}
              aria-label="Switch Networks"
              className="switch-button p-2 sm:p-3 bg-white dark:bg-gray-800 border-4 border-gray-100 dark:border-gray-900 rounded-2xl hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:border-primary-200 dark:hover:border-primary-800 transition-all duration-200 shadow-xl hover:shadow-2xl hover:scale-110 group hover:ring-2 ring-primary-300/60 dark:ring-primary-500/40 touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              <ArrowLeftRight size={18} className="sm:w-5 sm:h-5 text-gray-600 dark:text-gray-300 group-hover:rotate-180 transition-transform duration-300" />
            </button>
          </div>

          {/* To Network */}
          {/* Use initial chains if bridge was initiated, otherwise use current chains */}
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-900 dark:text-white">To</label>
            <div className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 bg-white/80 dark:bg-gray-900/60 shadow-sm transition-all duration-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center">
                    {(() => {
                      const displayToChain = bridgeInitiatedRef.current && initialToChainRef.current ? initialToChainRef.current : toChain;
                      return displayToChain.includes('Arc') ? (
                        <img 
                          src="/icons/Arc.png" 
                          alt="Arc Testnet" 
                          className="w-10 h-10 rounded-full object-contain"
                        />
                      ) : displayToChain.includes('Sepolia') ? (
                        <img 
                          src="/icons/eth.png" 
                          alt="Sepolia" 
                          className="w-10 h-10 rounded-full object-contain"
                        />
                      ) : null;
                    })()}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {bridgeInitiatedRef.current && initialToChainRef.current ? initialToChainRef.current : toChain}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Destination Network</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Asset Input Section */}
        <div className="mt-4 sm:mt-6">
          <label className="block text-xs sm:text-sm font-medium mb-2 text-gray-900 dark:text-white">Asset</label>
          <div className="p-3 sm:p-4 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm transition-all duration-200 flex flex-col relative overflow-hidden">
            <div className="flex items-center justify-between gap-2 w-full">
              <div className="relative flex-1 min-w-0 z-10">
                <input
                  type="text"
                  inputMode="decimal"
                  value={amount}
                  onChange={(e) => setAmount(sanitizeInput(e.target.value))}
                  placeholder="0.0"
                  className="text-2xl md:text-3xl font-semibold bg-transparent outline-none placeholder-gray-400 dark:placeholder-gray-500 text-gray-900 dark:text-white w-full pr-16 focus:ring-0 touch-manipulation"
                  style={{ WebkitAppearance: 'none', touchAction: 'manipulation', minWidth: 0 }}
                />
              </div>
              {/* Token Pill - Static, no dropdown */}
              <div className="flex items-center space-x-2 bg-gray-100 dark:bg-gray-700 rounded-full py-2 px-3 border border-gray-200 dark:border-gray-600 flex-shrink-0">
                <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0">
                  <img 
                    src="/icons/usdc.png" 
                    alt="USDC" 
                    className="w-6 h-6 rounded-full object-contain"
                  />
                </div>
                <span className="font-medium text-gray-900 dark:text-white whitespace-nowrap">USDC</span>
              </div>
            </div>
            {/* Balance and Max - Below input */}
            {isConnected && (
              <div className="flex items-center justify-end mt-2 flex-wrap gap-2">
                <div className="flex items-center space-x-2">
                  <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Bal:</span>
                  <span className="text-xs sm:text-sm font-semibold text-gray-900 dark:text-white">
                    {isLoadingBalance ? (
                      <Loader className="animate-spin" size={14} />
                    ) : balanceError ? (
                      <span className="text-red-500">Error</span>
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
                  className="text-xs sm:text-sm font-semibold text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors px-2 py-1 rounded touch-manipulation"
                >
                  Max
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Security Notice */}
        <div className="mt-6 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-100 dark:border-yellow-800 rounded-lg flex items-start space-x-2">
          <AlertCircle size={16} className="text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-yellow-700 dark:text-yellow-300">
            {t('Cross-chain transfers are irreversible. Please verify all details before confirming the transaction.')}
          </p>
        </div>


        {/* Bridge Button */}
        <button
          onClick={handleBridge}
          disabled={!amount || bridgeLoading || !isConnected || state.isLoading || bridgeButtonText === 'Bridge Failed'}
          className={`w-full mt-4 sm:mt-6 font-bold py-3 sm:py-4 text-sm sm:text-base rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation ${
            bridgeButtonText === 'Bridge Failed' 
              ? 'bg-red-500 hover:bg-red-600 text-white' 
              : 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white'
          }`}
        >
          {bridgeLoading || state.isLoading ? (
            <>
              <Loader className="animate-spin inline mr-2" size={18} />
              <span>{t('Bridging')}...</span>
            </>
          ) : !isConnected ? (
            <>
              <Wallet size={18} className="inline mr-2" />
              <span>{t('Connect Wallet')}</span>
            </>
          ) : (
            <span>{bridgeButtonText}</span>
          )}
        </button>
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
      {/* Use initial chains if bridge was initiated, otherwise use current chains */}
      <BridgingModal 
        isOpen={showBridgingModal}
        onClose={closeBridgingModal}
        fromChain={bridgeInitiatedRef.current && initialFromChainRef.current ? initialFromChainRef.current : fromChain}
        toChain={bridgeInitiatedRef.current && initialToChainRef.current ? initialToChainRef.current : toChain}
        startTime={bridgeStartTime}
        state={state}
        stopTimer={stopTimer}
      />
      
      {/* Bridge Failed Modal */}
      <BridgeFailedModal
        isOpen={showBridgeFailedModal}
        onClose={closeBridgeFailedModal}
        fromChain={fromChain}
        toChain={toChain}
        errorTitle={bridgeError.title}
        errorMessage={bridgeError.message}
      />
    </div>
  );
};

export default Bridge;