import { useState, useCallback } from 'react';
import { useAccount, useSwitchChain } from 'wagmi';
import { createAdapterFromProvider } from '@circle-fin/adapter-viem-v2';
import { BridgeKit } from '@circle-fin/bridge-kit';
import { createPublicClient, http, formatUnits } from 'viem';
import { sepolia } from 'viem/chains';
import { NETWORKS, TOKENS } from '../config/networks'; // Import the same config

// --- Configuration & Constants ---

// Chain IDs - Make sure these match the hex values in networks.js
export const SEPOLIA_CHAIN_ID = 11155111; // 0xaa36a7
export const ARC_CHAIN_ID = 5042002; // 0x4cef52

console.log('Chain IDs:', {
  SEPOLIA_CHAIN_ID,
  ARC_CHAIN_ID,
  sepoliaHex: '0xaa36a7',
  arcHex: '0x4cef52',
  sepoliaParsed: parseInt('0xaa36a7', 16),
  arcParsed: parseInt('0x4cef52', 16)
});

// Token configurations for both chains
// Using the same contract addresses as defined in networks.js for consistency
export const CHAIN_TOKENS = {
  [SEPOLIA_CHAIN_ID]: { // Sepolia
    USDC: {
      symbol: 'USDC',
      name: 'USD Coin',
      decimals: 6,
      contractAddress: TOKENS.ETHEREUM_SEPOLIA.USDC.address, // Use the same address from config
    },
  },
  [ARC_CHAIN_ID]: { // Arc Testnet
    USDC: {
      symbol: 'USDC',
      name: 'USD Coin',
      decimals: 6,
      contractAddress: TOKENS.ARC_TESTNET.USDC.address, // Use the same address from config
    },
  },
};

console.log('CHAIN_TOKENS:', CHAIN_TOKENS);

// Legacy export for backward compatibility
export const SEPOLIA_TOKENS = CHAIN_TOKENS[SEPOLIA_CHAIN_ID];

// RPC URLs for balance fetching
const ARC_RPC_URLS = [
  'https://rpc.testnet.arc.network/',
  'https://rpc.testnet.arc.network',
];

// --- Main Hook ---

export function useBridge() {
  const { address, isConnected, chainId } = useAccount();
  const { switchChain } = useSwitchChain();
  
  const [state, setState] = useState({
    step: 'idle',
    error: null,
    result: null,
    isLoading: false,
    sourceTxHash: undefined,
    receiveTxHash: undefined,
    direction: undefined,
  });

  const [tokenBalance, setTokenBalance] = useState('0');
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);
  const [balanceError, setBalanceError] = useState('');

  // Fetch token balance on a specific chain
  const fetchTokenBalance = useCallback(async (token, sourceChainId) => {
    try {
      if (!address) return;
      
      setIsLoadingBalance(true);
      setBalanceError('');
      
      const chainTokens = CHAIN_TOKENS[sourceChainId];
      if (!chainTokens) {
        throw new Error(`Chain ${sourceChainId} not supported for token balance fetching`);
      }

      const tokenInfo = chainTokens[token];
      
      // ERC20 ABI for balanceOf and decimals
      const erc20Abi = [
        {
          constant: true,
          inputs: [{ name: '_owner', type: 'address' }],
          name: 'balanceOf',
          outputs: [{ name: 'balance', type: 'uint256' }],
          type: 'function',
        },
        {
          constant: true,
          inputs: [],
          name: 'decimals',
          outputs: [{ name: '', type: 'uint8' }],
          type: 'function',
        },
      ];

      let publicClient;
      let lastError;

      if (sourceChainId === SEPOLIA_CHAIN_ID) {
        // Try multiple Sepolia RPC endpoints for reliability
        const sepoliaRpcUrls = [
          'https://ethereum-sepolia-rpc.publicnode.com',
          'https://rpc.sepolia.org',
          'https://sepolia.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161',
        ];
        
        for (const rpcUrl of sepoliaRpcUrls) {
          try {
            publicClient = createPublicClient({
              chain: sepolia,
              transport: http(rpcUrl, {
                retryCount: 2,
                timeout: 8000,
              }),
            });
            
            await publicClient.getBlockNumber();
            console.log(`✅ Connected to Sepolia via: ${rpcUrl}`);
            break;
          } catch (err) {
            lastError = err;
            continue;
          }
        }
      } else if (sourceChainId === ARC_CHAIN_ID) {
        // Try Arc Testnet RPC endpoints
        for (const rpcUrl of ARC_RPC_URLS) {
          try {
            publicClient = createPublicClient({
              chain: {
                id: ARC_CHAIN_ID,
                name: 'Arc Testnet',
                network: 'arc-testnet',
                nativeCurrency: {
                  decimals: 18, // Changed from 6 to 18 to match ETH
                  name: 'ETH',
                  symbol: 'ETH',
                },
                rpcUrls: {
                  default: { http: [rpcUrl] },
                  public: { http: [rpcUrl] },
                },
                blockExplorers: {
                  default: { name: 'Arc Explorer', url: 'https://testnet.arcscan.app' },
                },
                testnet: true, // Added testnet flag
              },
              transport: http(rpcUrl, {
                retryCount: 2,
                timeout: 8000,
              }),
            });
            
            await publicClient.getBlockNumber();
            console.log(`✅ Connected to Arc Testnet via: ${rpcUrl}`);
            break;
          } catch (err) {
            lastError = err;
            continue;
          }
        }
      }
      
      if (!publicClient) {
        throw new Error(`Failed to connect to RPC for chain ${sourceChainId}: ${lastError?.message || ''}`);
      }

      const balance = await publicClient.readContract({
        address: tokenInfo.contractAddress,
        abi: erc20Abi,
        functionName: 'balanceOf',
        args: [address],
      });

      const formattedBalance = formatUnits(balance, tokenInfo.decimals);
      setTokenBalance(formattedBalance);
    } catch (err) {
      console.error(`❌ Error fetching balance for chain ${sourceChainId}:`, err);
      setTokenBalance('0');
      
      if (err.message && (err.message.includes('timeout') || err.message.includes('took too long'))) {
        setBalanceError('RPC timeout - balance may not be accurate.');
      } else {
        setBalanceError('Unable to fetch balance.');
      }
    } finally {
      setIsLoadingBalance(false);
    }
  }, [address]);  // Execute bridge transaction (bidirectional)
  const bridge = useCallback(async (token, amount, direction) => {
    try {
      if (!isConnected || !address) {
        setState({
          step: 'error',
          error: 'Please connect your wallet first',
          result: null,
          isLoading: false,
        });
        return;
      }

      if (!amount || parseFloat(amount) <= 0) {
        setState({
          step: 'error',
          error: `Please enter a valid ${token} amount`,
          result: null,
          isLoading: false,
        });
        return;
      }

      setState(prev => ({ ...prev, step: 'idle', error: null, isLoading: true }));

      // Get the provider from window.ethereum (MetaMask)
      if (!window || !window.ethereum) {
        throw new Error('Browser wallet not found. Please install a browser wallet like MetaMask.');
      }

      // Create adapter from browser wallet provider
      const adapter = await createAdapterFromProvider({
        provider: window.ethereum,
      });

      // Initialize Bridge Kit
      const kit = new BridgeKit();
      const supportedChains = kit.getSupportedChains();
      
      // Determine source and destination chains based on direction
      const isSepoliaToArc = direction === 'sepolia-to-arc';
      const sourceChainId = isSepoliaToArc ? SEPOLIA_CHAIN_ID : ARC_CHAIN_ID;
      const destinationChainId = isSepoliaToArc ? ARC_CHAIN_ID : SEPOLIA_CHAIN_ID;

      // Find source chain
      let sourceChain = supportedChains.find(c => {
        const isEVM = 'chainId' in c;
        if (!isEVM) return false;
        return c.chainId === sourceChainId;
      });
      
      if (!sourceChain && sourceChainId === SEPOLIA_CHAIN_ID) {
        // Try alternative search for Sepolia
        sourceChain = supportedChains.find(c => {
          const isEVM = 'chainId' in c;
          if (!isEVM) return false;
          const chainId = c.chainId;
          if (chainId === 84532 || chainId === 421614) return false; // Exclude Base/Arbitrum Sepolia
          const name = c.name.toLowerCase();
          return (name.includes('ethereum') && name.includes('sepolia')) || 
                 (name.includes('sepolia') && !name.includes('base') && !name.includes('arbitrum'));
        });
      }
      
      if (!sourceChain && sourceChainId === ARC_CHAIN_ID) {
        // Try alternative search for Arc
        sourceChain = supportedChains.find(c => {
          const isEVM = 'chainId' in c;
          if (!isEVM) return false;
          return c.name.toLowerCase().includes('arc');
        });
      }
      
      // Find destination chain
      let destinationChain = supportedChains.find(c => {
        const isEVM = 'chainId' in c;
        if (!isEVM) return false;
        return c.chainId === destinationChainId;
      });
      
      if (!destinationChain && destinationChainId === SEPOLIA_CHAIN_ID) {
        destinationChain = supportedChains.find(c => {
          const isEVM = 'chainId' in c;
          if (!isEVM) return false;
          const chainId = c.chainId;
          if (chainId === 84532 || chainId === 421614) return false;
          const name = c.name.toLowerCase();
          return (name.includes('ethereum') && name.includes('sepolia')) || 
                 (name.includes('sepolia') && !name.includes('base') && !name.includes('arbitrum'));
        });
      }
      
      if (!destinationChain && destinationChainId === ARC_CHAIN_ID) {
        destinationChain = supportedChains.find(c => {
          const isEVM = 'chainId' in c;
          if (!isEVM) return false;
          return c.name.toLowerCase().includes('arc');
        });
      }
      
      if (!sourceChain) {
        const chainName = sourceChainId === SEPOLIA_CHAIN_ID ? 'Ethereum Sepolia' : 'Arc Testnet';
        throw new Error(`${chainName} (chain ID ${sourceChainId}) is not supported by Bridge Kit.`);
      }
      
      if (!destinationChain) {
        const chainName = destinationChainId === SEPOLIA_CHAIN_ID ? 'Ethereum Sepolia' : 'Arc Testnet';
        throw new Error(`${chainName} (chain ID ${destinationChainId}) is not supported by Bridge Kit.`);
      }

      // Verify source chain ID
      const actualSourceChainId = sourceChain.chainId;
      if (actualSourceChainId !== sourceChainId) {
        throw new Error(`Incorrect source chain selected! Expected chain ID ${sourceChainId}, but got ${sourceChain.name} (${actualSourceChainId}).`);
      }

      console.log('Selected chains:', {
        from: sourceChain.name,
        fromChainId: actualSourceChainId,
        to: destinationChain.name,
        toChainId: destinationChain.chainId,
        token,
        amount,
        direction,
      });

      // Switch to source chain if not already on it
      const isOnSourceChain = chainId === sourceChainId;
      if (!isOnSourceChain) {
        setState(prev => ({ ...prev, step: 'switching-network' }));
        await switchChain({ chainId: sourceChainId });
        // Wait for chain switch
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

      // Step 2: Approving token (if needed)
      setState(prev => ({ ...prev, step: 'approving' }));

      // Execute the bridge
      const result = await kit.bridge({
        from: {
          adapter: adapter,
          chain: sourceChain.chain,
        },
        to: {
          adapter: adapter,
          chain: destinationChain.chain,
        },
        amount: amount,
      });
      // Helper function to safely stringify BigInt values
      const safeStringify = (obj) => {
        return JSON.stringify(obj, (key, value) => {
          if (typeof value === 'bigint') {
            return value.toString();
          }
          return value;
        }, 2);
      };
      
      console.log('Bridge result:', result);
      try {
        console.log('Bridge result (stringified):', safeStringify(result));
      } catch (err) {
        console.log('Could not stringify result (contains non-serializable values)');
      }

      // Extract transaction hashes from result
      let sourceTxHash;
      let receiveTxHash;

      // Log the entire result for debugging
      console.log('Bridge Kit result:', result);

      if (result && typeof result === 'object') {
        // Try to extract from steps array first
        if (result.steps && Array.isArray(result.steps)) {
          console.log('Found steps array with', result.steps.length, 'steps');
          
          // Loop through steps to find transaction hashes
          result.steps.forEach((step, index) => {
            console.log(`Step ${index}: ${step.name} - ${step.state}`, step);
            
            if (step.name === 'burn' && step.txHash) {
              // Burn/transfer transaction on source chain
              sourceTxHash = step.txHash;
              console.log('Found sourceTxHash from burn step:', sourceTxHash);
            } else if (step.name === 'mint' && step.txHash) {
              // Mint/receive transaction on destination chain
              receiveTxHash = step.txHash;
              console.log('Found receiveTxHash from mint step:', receiveTxHash);
            } else if (step.name === 'approve' && step.txHash) {
              // Approval transaction - we could use this as fallback for source
              if (!sourceTxHash) {
                sourceTxHash = step.txHash;
                console.log('Using approval txHash as sourceTxHash fallback:', sourceTxHash);
              }
            }
          });
        }
        
        // Try to extract directly from result object
        if (!sourceTxHash && (result.txHash || result.sourceTxHash || result.sourceTransactionHash || result.fromTxHash)) {
          sourceTxHash = result.txHash || result.sourceTxHash || result.sourceTransactionHash || result.fromTxHash;
          console.log('Found sourceTxHash from result object:', sourceTxHash);
        }
        
        if (!receiveTxHash && (result.receiveTxHash || result.receiveTransactionHash || result.toTxHash || result.destinationTxHash)) {
          receiveTxHash = result.receiveTxHash || result.receiveTransactionHash || result.toTxHash || result.destinationTxHash;
          console.log('Found receiveTxHash from result object:', receiveTxHash);
        }
        
        // Try to extract from receipt if available
        if (!sourceTxHash && result.receipt && result.receipt.transactionHash) {
          sourceTxHash = result.receipt.transactionHash;
          console.log('Found sourceTxHash from receipt:', sourceTxHash);
        }
        
        if (!receiveTxHash && result.destinationReceipt && result.destinationReceipt.transactionHash) {
          receiveTxHash = result.destinationReceipt.transactionHash;
          console.log('Found receiveTxHash from destinationReceipt:', receiveTxHash);
        }
        
        // Additional extraction attempts for nested structures
        if (!sourceTxHash && result.source && result.source.transactionHash) {
          sourceTxHash = result.source.transactionHash;
          console.log('Found sourceTxHash from source.transactionHash:', sourceTxHash);
        }
        
        if (!receiveTxHash && result.destination && result.destination.transactionHash) {
          receiveTxHash = result.destination.transactionHash;
          console.log('Found receiveTxHash from destination.transactionHash:', receiveTxHash);
        }
      }

      console.log('Final extracted transaction hashes:', { sourceTxHash, receiveTxHash });
      
      // Validate transaction hashes
      if (sourceTxHash && typeof sourceTxHash === 'string' && sourceTxHash.startsWith('0x') && sourceTxHash.length === 66) {
        console.log('Valid source transaction hash:', sourceTxHash);
      } else {
        console.warn('Invalid or missing source transaction hash:', sourceTxHash);
        sourceTxHash = undefined;
      }
      
      if (receiveTxHash && typeof receiveTxHash === 'string' && receiveTxHash.startsWith('0x') && receiveTxHash.length === 66) {
        console.log('Valid destination transaction hash:', receiveTxHash);
      } else {
        console.warn('Invalid or missing destination transaction hash:', receiveTxHash);
        receiveTxHash = undefined;
      }

      // Bridge Kit's bridge() method only resolves after ALL transactions complete
      const finalState = {
        step: 'success',
        error: null,
        result,
        isLoading: false,
        sourceTxHash,
        receiveTxHash,
        direction,
      };
      
      setState(finalState);
      return finalState;

    } catch (err) {
      console.error('Bridge error:', err);
      console.log('Bridge error details:', {
        code: err.code,
        message: err.message,
        name: err.name,
        reason: err.reason,
        data: err.data,
        stack: err.stack?.substring(0, 200)
      });
      
      let errorMessage = err.message || 'Bridge transaction failed';
      
      if (err.message && err.message.includes('Insufficient funds')) {
        // Determine which chain the error occurred on based on direction
        const isSepoliaToArc = direction === 'sepolia-to-arc';
        const sourceChainId = isSepoliaToArc ? SEPOLIA_CHAIN_ID : ARC_CHAIN_ID;
        const sourceChainName = isSepoliaToArc ? 'Sepolia' : 'Arc Testnet';
        
        // Get the correct token info based on the source chain
        const chainTokens = CHAIN_TOKENS[sourceChainId];
        const tokenInfo = chainTokens ? chainTokens[token] : null;
        
        if (tokenInfo) {
          errorMessage = `❌ Wrong ${token} Contract Address!\n\n` +
            `Bridge Kit requires ${token} on ${sourceChainName} at:\n` +
            `📌 ${tokenInfo.contractAddress}\n\n` +
            `⚠️ Your ${token} is at a different contract address\n\n` +
            `💡 Solution:\n` +
            `1. Get ${token} from the official Circle/Bridge Kit contract\n` +
            `2. Or swap your current ${token} to the correct contract\n` +
            `3. Use ${sourceChainName} ${token} Faucet that provides the correct contract\n\n` +
            `Your current ${token} contract won't work with Bridge Kit.`;
        } else {
          errorMessage = `Insufficient funds: Not enough ${token} balance on ${sourceChainName} to complete the bridge.`;
        }
      }
      
      // Handle user rejection/cancellation - check multiple patterns
      // Also check nested error objects (some SDKs wrap errors)
      const originalError = err.error || err.cause || err;
      const errorMsg = (err.message || originalError?.message || '').toLowerCase();
      const errorCode = err.code || originalError?.code;
      
      const isUserRejection = 
        errorCode === 4001 || 
        errorCode === 'ACTION_REJECTED' ||
        (errorCode === -32603 && errorMsg.includes('user rejected')) ||
        errorMsg.includes('user rejected') ||
        errorMsg.includes('user denied') ||
        errorMsg.includes('transaction rejected') ||
        errorMsg.includes('user cancelled') ||
        errorMsg.includes('user canceled') ||
        errorMsg.includes('rejected the request') ||
        errorMsg.includes('user refused') ||
        errorMsg.includes('user declined') ||
        errorMsg.includes('rejected') ||
        errorMsg.includes('denied') ||
        errorMsg.includes('cancelled') ||
        errorMsg.includes('canceled');
      
      if (isUserRejection) {
        errorMessage = 'Transaction rejected: User denied transaction signature.';
      }
      
      // Handle insufficient funds
      if (err.code === 'INSUFFICIENT_FUNDS' || (err.message && err.message.includes('insufficient funds'))) {
        errorMessage = 'Insufficient funds: Not enough balance to complete the bridge.';
      }
      
      // Handle network errors
      if (err.code === 'NETWORK_ERROR' || (err.message && (err.message.includes('network') || err.message.includes('timeout')))) {
        errorMessage = 'Network error: Unable to connect to blockchain. Please check your connection.';
      }
      
      // Handle network switch errors
      if (err.message && (err.message.includes('network') || err.message.includes('chain'))) {
        errorMessage = 'Network switch failed. Please manually switch to the correct network in your wallet.';
      }
      
      const errorState = {
        step: 'error',
        error: errorMessage,
        result: null,
        isLoading: false,
        sourceTxHash: undefined,
        receiveTxHash: undefined,
        direction: undefined,
      };
      
      setState(errorState);
      return errorState;
    }  }, [address, isConnected, chainId, switchChain]);

  // Reset bridge state
  const reset = useCallback(() => {
    setState({
      step: 'idle',
      error: null,
      result: null,
      isLoading: false,
      sourceTxHash: undefined,
      receiveTxHash: undefined,
      direction: undefined,
    });
    setTokenBalance('0');
    setBalanceError('');
  }, []);

  // Clear only balance (for disconnect scenarios)
  const clearBalance = useCallback(() => {
    setTokenBalance('0');
    setBalanceError('');
  }, []);

  return {
    state,
    tokenBalance,
    isLoadingBalance,
    balanceError,
    fetchTokenBalance,
    bridge,
    reset,
    clearBalance,
    isOnSepolia: chainId === SEPOLIA_CHAIN_ID,
    isOnArc: chainId === ARC_CHAIN_ID,
    currentChainId: chainId,
  };
}