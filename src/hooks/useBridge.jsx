import { useState, useCallback } from 'react';
import { useAccount, useSwitchChain } from 'wagmi';
import { createAdapterFromProvider } from '@circle-fin/adapter-viem-v2';
import { BridgeKit } from '@circle-fin/bridge-kit';
import { createPublicClient, http, fallback, formatUnits, defineChain } from 'viem';
import { sepolia as sepoliaChain } from 'viem/chains';
import { NETWORKS, TOKENS } from '../config/networks'; // Import the same config

// Explicitly define ARC Testnet and Sepolia for high reliability
export const arcTestnet = defineChain({
  id: 5042002,
  name: 'Arc Testnet',
  nativeCurrency: { name: 'USDC', symbol: 'USDC', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://rpc.testnet.arc.network'] },
  },
  blockExplorers: {
    default: { name: 'ArcScan', url: 'https://testnet.arcscan.app' },
  },
});

export const sepolia = defineChain({
  ...sepoliaChain,
  rpcUrls: {
    ...sepoliaChain.rpcUrls,
    default: { http: ['https://ethereum-sepolia-rpc.publicnode.com'] },
  },
});

/**
 * Custom fetch handler to intercept malformed/truncated JSON responses
 * Forces viem fallback to switch providers when a SyntaxError is detected.
 */
const safeRpcFetch = async (url, options) => {
  const response = await fetch(url, options);

  // Clone the response to read it as text first
  const clone = response.clone();
  try {
    const text = await clone.text();
    JSON.parse(text); // Validate JSON
    return response;
  } catch (err) {
    if (err instanceof SyntaxError) {
      console.warn(`[SuperBridge] Truncated JSON detected from ${url}. Switching providers...`);
      // Throwing here forces viem's fallback transport to try the next URL
      throw new Error(`Malformed JSON response from RPC: ${err.message}`);
    }
    return response;
  }
};

// --- Configuration & Constants ---
export const publicClient = createPublicClient({
  chain: sepolia,
  transport: fallback([
    // Dedicated High-Limit Providers
    http('https://ethereum-sepolia-rpc.publicnode.com', { fetch: safeRpcFetch }),
    http('https://rpc.sepolia.org', { fetch: safeRpcFetch }),
    http('https://rpc2.sepolia.org', { fetch: safeRpcFetch }),
  ], {
    rank: true,
    retryCount: 5,
    retryDelay: 500,
  }),
  batch: { multicall: true },
  pollingInterval: 12_000,
})
// Token configurations for all supported chains
export const CHAIN_TOKENS = {
  [11155111]: { // Sepolia
    USDC: {
      symbol: 'USDC',
      name: 'USD Coin',
      decimals: 6,
      contractAddress: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238', // Official Circle USDC on Sepolia
    },
  },
  [5042002]: { // Arc Testnet
    USDC: {
      symbol: 'USDC',
      name: 'USD Coin',
      decimals: 6,
      contractAddress: '0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d', // Official Circle USDC on Arc Testnet
    },
  },
  [84532]: { // Base Sepolia
    USDC: {
      symbol: 'USDC',
      name: 'USD Coin',
      decimals: 6,
      contractAddress: '0x036CbD53842c5426634e7929541eC2318f3dCF7e', // Official Circle USDC on Base Sepolia
    },
  },
};

// Legacy export for backward compatibility
export const SEPOLIA_TOKENS = CHAIN_TOKENS[11155111];

// Chain IDs
export const SEPOLIA_CHAIN_ID = 11155111;
export const ARC_CHAIN_ID = 5042002;
export const BASE_SEPOLIA_CHAIN_ID = 84532;

// RPC URLs for balance fetching
const ARC_RPC_URLS = [
  'https://rpc.testnet.arc.network',
];

const BASE_SEPOLIA_RPC_URLS = [
  'https://sepolia.base.org',
  'https://base-sepolia.blockpi.network/v1/rpc/public',
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
        ];

        for (const rpcUrl of sepoliaRpcUrls) {
          try {
            publicClient = createPublicClient({
              chain: sepolia,
              transport: http(rpcUrl, {
                retryCount: 5,
                timeout: 30000,
                fetch: safeRpcFetch
              }),
              batch: { multicall: true }
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
                  decimals: 18,
                  name: 'USDC',
                  symbol: 'USDC',
                },
                rpcUrls: {
                  default: { http: [rpcUrl] },
                  public: { http: [rpcUrl] },
                },
                blockExplorers: {
                  default: { name: 'Arc Explorer', url: 'https://testnet.arcscan.app' },
                },
                testnet: true,
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
      } else if (sourceChainId === BASE_SEPOLIA_CHAIN_ID) {
        // Try Base Sepolia RPC endpoints
        for (const rpcUrl of BASE_SEPOLIA_RPC_URLS) {
          try {
            publicClient = createPublicClient({
              chain: {
                id: BASE_SEPOLIA_CHAIN_ID,
                name: 'Base Sepolia',
                network: 'base-sepolia',
                nativeCurrency: {
                  decimals: 18,
                  name: 'ETH',
                  symbol: 'ETH',
                },
                rpcUrls: {
                  default: { http: [rpcUrl] },
                  public: { http: [rpcUrl] },
                },
                blockExplorers: {
                  default: { name: 'BaseScan', url: 'https://sepolia.basescan.org' },
                },
                testnet: true,
              },
              transport: http(rpcUrl, {
                retryCount: 2,
                timeout: 8000,
              }),
            });

            await publicClient.getBlockNumber();
            console.log(`✅ Connected to Base Sepolia via: ${rpcUrl}`);
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

      let balance;
      let decimalsToUse;

      // For Arc Testnet, USDC is the native currency, not an ERC20 token
      if (sourceChainId === ARC_CHAIN_ID) {
        // Use getBalance for native currency instead of ERC20 balanceOf
        balance = await publicClient.getBalance({
          address: address,
        });
        // Arc Testnet native currency uses 18 decimals (wei), not 6 decimals
        decimalsToUse = 18;
      } else {
        // For other chains, use ERC20 balanceOf
        balance = await publicClient.readContract({
          address: tokenInfo.contractAddress,
          abi: erc20Abi,
          functionName: 'balanceOf',
          args: [address],
        });
        // Use token decimals for ERC20 tokens
        decimalsToUse = tokenInfo.decimals;
      }

      const formattedBalance = formatUnits(balance, decimalsToUse);
      // Round to 2 decimal places
      const roundedBalance = parseFloat(formattedBalance).toFixed(2);
      setTokenBalance(roundedBalance);
      setBalanceError(''); // Clear error on successful fetch
    } catch (err) {
      console.error(`❌ Error fetching balance for chain ${sourceChainId}:`, err);
      // Don't reset balance to '0' on error - keep previous value to avoid showing zero
      // Only set to '0' if we don't have a previous balance value
      setTokenBalance(prevBalance => prevBalance || '0');

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
    // Declare variables at function scope for error handling
    let destinationChain = null;
    let destinationChainId = null;

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
      const provider = window.ethereum;

      if (!provider || !provider.request) {
        throw new Error('Wallet provider is not properly configured. Please ensure your wallet is connected.');
      }

      const adapter = await createAdapterFromProvider({
        provider: provider,
      });

      if (!adapter) {
        throw new Error('Failed to create adapter from provider');
      }

      console.log('Adapter created successfully:', adapter);

      // Initialize Bridge Kit
      const kit = new BridgeKit();
      const supportedChains = kit.getSupportedChains();

      // Determine source and destination chains based on direction
      let sourceChainId, destinationChainId;

      switch (direction) {
        case 'sepolia-to-arc':
          sourceChainId = SEPOLIA_CHAIN_ID;
          destinationChainId = ARC_CHAIN_ID;
          break;
        case 'sepolia-to-base':
          sourceChainId = SEPOLIA_CHAIN_ID;
          destinationChainId = BASE_SEPOLIA_CHAIN_ID;
          break;
        case 'arc-to-sepolia':
          sourceChainId = ARC_CHAIN_ID;
          destinationChainId = SEPOLIA_CHAIN_ID;
          break;
        case 'arc-to-base':
          sourceChainId = ARC_CHAIN_ID;
          destinationChainId = BASE_SEPOLIA_CHAIN_ID;
          break;
        case 'base-to-sepolia':
          sourceChainId = BASE_SEPOLIA_CHAIN_ID;
          destinationChainId = SEPOLIA_CHAIN_ID;
          break;
        case 'base-to-arc':
          sourceChainId = BASE_SEPOLIA_CHAIN_ID;
          destinationChainId = ARC_CHAIN_ID;
          break;
        default:
          throw new Error(`Invalid bridge direction: ${direction}`);
      }

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

      if (!sourceChain && sourceChainId === BASE_SEPOLIA_CHAIN_ID) {
        // Try alternative search for Base Sepolia
        sourceChain = supportedChains.find(c => {
          const isEVM = 'chainId' in c;
          if (!isEVM) return false;
          const name = c.name.toLowerCase();
          return name.includes('base') && name.includes('sepolia');
        });
      }

      // Find destination chain
      destinationChain = supportedChains.find(c => {
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

      if (!destinationChain && destinationChainId === BASE_SEPOLIA_CHAIN_ID) {
        // Try alternative search for Base Sepolia
        destinationChain = supportedChains.find(c => {
          const isEVM = 'chainId' in c;
          if (!isEVM) return false;
          const name = c.name.toLowerCase();
          return name.includes('base') && name.includes('sepolia');
        });
      }

      if (!sourceChain) {
        const chainName = sourceChainId === SEPOLIA_CHAIN_ID ? 'Ethereum Sepolia' :
          sourceChainId === ARC_CHAIN_ID ? 'Arc Testnet' :
            sourceChainId === BASE_SEPOLIA_CHAIN_ID ? 'Base Sepolia' : 'Unknown';
        throw new Error(`${chainName} (chain ID ${sourceChainId}) is not supported by Bridge Kit. Available chains: ${JSON.stringify(supportedChains.map(c => ({ name: c.name, chainId: c.chainId })))}`);
      }

      if (!destinationChain) {
        const chainName = destinationChainId === SEPOLIA_CHAIN_ID ? 'Ethereum Sepolia' :
          destinationChainId === ARC_CHAIN_ID ? 'Arc Testnet' :
            destinationChainId === BASE_SEPOLIA_CHAIN_ID ? 'Base Sepolia' : 'Unknown';
        throw new Error(`${chainName} (chain ID ${destinationChainId}) is not supported by Bridge Kit. Available chains: ${JSON.stringify(supportedChains.map(c => ({ name: c.name, chainId: c.chainId })))}`);
      }

      // Validate chain objects have the required properties
      if (!sourceChain.chain || !destinationChain.chain) {
        throw new Error('Chain objects are missing required properties. Source chain valid: ' + !!sourceChain.chain + ', Destination chain valid: ' + !!destinationChain.chain);
      }

      // Validate adapter
      if (!adapter) {
        throw new Error('Adapter is not properly configured');
      }

      // Store destinationChain name for error handling
      const destinationChainName = destinationChain.name;

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

      // Log chain objects for debugging
      console.log('Source chain object:', sourceChain);
      console.log('Destination chain object:', destinationChain);

      // Switch to source chain if not already on it
      const isOnSourceChain = chainId === sourceChainId;
      if (!isOnSourceChain) {
        setState(prev => ({ ...prev, step: 'switching-network' }));
        await switchChain({ chainId: sourceChainId });
        // Wait for chain switch
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

      // Ensure destination chain is added to wallet (but don't switch to it)
      // Bridge Kit will handle all chain switching automatically
      try {
        if (window.ethereum && destinationChainId) {
          // Try to add the destination chain to wallet (if not already added)
          // This ensures Bridge Kit can switch to it when needed for the mint transaction
          try {
            // Try to switch to check if chain exists (will fail with 4902 if not added)
            await window.ethereum.request({
              method: 'wallet_switchEthereumChain',
              params: [{ chainId: `0x${destinationChainId.toString(16)}` }],
            });
            // If successful, switch back to source chain
            await window.ethereum.request({
              method: 'wallet_switchEthereumChain',
              params: [{ chainId: `0x${sourceChainId.toString(16)}` }],
            });
          } catch (switchError) {
            // If switch fails (chain not added), add it
            if (switchError.code === 4902) {
              if (destinationChainId === ARC_CHAIN_ID) {
                await window.ethereum.request({
                  method: 'wallet_addEthereumChain',
                  params: [{
                    chainId: `0x${ARC_CHAIN_ID.toString(16)}`,
                    chainName: 'Arc Testnet',
                    nativeCurrency: {
                      name: 'USDC',
                      symbol: 'USDC',
                      decimals: 6,
                    },
                    rpcUrls: ['https://rpc.testnet.arc.network'],
                    blockExplorerUrls: ['https://testnet.arcscan.app'],
                  }],
                });
              } else if (destinationChainId === SEPOLIA_CHAIN_ID) {
                await window.ethereum.request({
                  method: 'wallet_addEthereumChain',
                  params: [{
                    chainId: `0x${SEPOLIA_CHAIN_ID.toString(16)}`,
                    chainName: 'Sepolia',
                    nativeCurrency: {
                      name: 'ETH',
                      symbol: 'ETH',
                      decimals: 18,
                    },
                    rpcUrls: ['https://ethereum-sepolia-rpc.publicnode.com', 'https://rpc.sepolia.org'],
                    blockExplorerUrls: ['https://sepolia.etherscan.io'],
                  }],
                });
              } else if (destinationChainId === BASE_SEPOLIA_CHAIN_ID) {
                await window.ethereum.request({
                  method: 'wallet_addEthereumChain',
                  params: [{
                    chainId: `0x${BASE_SEPOLIA_CHAIN_ID.toString(16)}`,
                    chainName: 'Base Sepolia',
                    nativeCurrency: {
                      name: 'ETH',
                      symbol: 'ETH',
                      decimals: 18,
                    },
                    rpcUrls: ['https://sepolia.base.org', 'https://base-sepolia.blockpi.network/v1/rpc/public'],
                    blockExplorerUrls: ['https://sepolia.basescan.org'],
                  }],
                });
              }
            }
          }
        }
      } catch (chainSetupError) {
        // Silently continue - Bridge Kit will handle chain switching
        console.debug('Chain setup skipped:', chainSetupError.message);
      }

      // Set up step tracking
      setState(prev => ({ ...prev, step: 'approving' }));

      // Execute the bridge - Bridge Kit will handle all three steps and chain switching automatically:
      // 1. Approval transaction on source chain
      // 2. Burn transaction on source chain
      // 3. Mint transaction on destination chain (Bridge Kit will switch chains automatically)
      console.log('Starting bridge execution - Bridge Kit will handle all three transactions and chain switching');

      // Update step to burning after a short delay (approval should be quick)
      // Set this up BEFORE starting the bridge so it fires during execution
      const burnStepTimeout = setTimeout(() => {
        setState(prev => {
          if (prev.step === 'approving') {
            return { ...prev, step: 'burning' };
          }
          return prev;
        });
      }, 5000);

      // Update step to minting after burn completes (estimated)
      // Set this up BEFORE starting the bridge so it fires during execution
      const mintStepTimeout = setTimeout(() => {
        setState(prev => {
          if (prev.step === 'burning') {
            return { ...prev, step: 'minting' };
          }
          return prev;
        });
      }, 15000);

      // Start the bridge promise
      // Bridge Kit handles chain switching internally, so we don't need to manually switch
      let result;
      try {
        result = await kit.bridge({
          from: {
            adapter: adapter,
            chain: sourceChain.chain,
          },
          to: {
            adapter: adapter,
            chain: destinationChain.chain,
          },
          amount: amount,
          token: 'USDC',
        });

        // Clear step timeouts on success
        clearTimeout(burnStepTimeout);
        clearTimeout(mintStepTimeout);
      } catch (err) {
        // Clear step timeouts on error
        clearTimeout(burnStepTimeout);
        clearTimeout(mintStepTimeout);

        // Global try-catch for "mint" step diagnostics
        if (state.step === 'minting' || err.message?.toLowerCase().includes('mint')) {
          console.error('CRITICAL: Failure during Bridge Mint step');
          if (err.message?.includes('Unterminated string') || err.message?.includes('JSON')) {
            console.error('RPC Error detected (JSON Truncation). Partial data:', err.data || 'unavailable');
            // Log full error for deeper inspection
            console.dir(err);
          }
        }
        throw err;
      }

      console.log('Bridge execution completed');

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

      // Log steps for debugging mint transaction issues
      if (result && result.steps && Array.isArray(result.steps)) {
        console.log('Bridge steps count:', result.steps.length);

        result.steps.forEach((step, index) => {
          console.log(`Step ${index}: ${step.name} (${step.state})`, step);
          if (step.error) {
            console.error(`Step ${index} error:`, step.error);
          }
        });
      }

      // Check if bridge completed successfully by verifying all steps
      const hasErrorStep = result?.steps?.some(step => step.state === 'error');
      if (hasErrorStep) {
        const errorStep = result.steps.find(step => step.state === 'error');
        const errorMessage = errorStep?.error?.message || errorStep?.error || 'Bridge step failed';
        throw new Error(`Bridge step '${errorStep?.name || 'unknown'}' failed: ${errorMessage}`);
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

          // Process the three main bridge transactions:
          // 1. Approval transaction on source chain
          // 2. Burn transaction on source chain
          // 3. Mint transaction on destination chain

          result.steps.forEach((step, index) => {
            console.log(`Step ${index}: ${step.name} (${step.state})`, step);

            // First transaction: Approval on source chain
            if (step.name === 'approve' && step.txHash) {
              sourceTxHash = step.txHash;
              console.log('✅ Found approval transaction hash:', sourceTxHash);
              // #region agent log
              fetch('http://127.0.0.1:7242/ingest/95889d98-976f-4fbf-8a15-0ac51541a353', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'useBridge.jsx:702', message: 'Approval tx hash extracted', data: { txHash: sourceTxHash }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId: 'E' }) }).catch(() => { });
              // #endregion
            }
            // Second transaction: Burn on source chain
            else if (step.name === 'burn' && step.txHash) {
              sourceTxHash = step.txHash;
              console.log('✅ Found burn transaction hash:', sourceTxHash);
              // #region agent log
              fetch('http://127.0.0.1:7242/ingest/95889d98-976f-4fbf-8a15-0ac51541a353', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'useBridge.jsx:709', message: 'Burn tx hash extracted', data: { txHash: sourceTxHash }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId: 'E' }) }).catch(() => { });
              // #endregion
            }
            // Third transaction: Mint on destination chain
            else if (step.name === 'mint' && step.txHash) {
              receiveTxHash = step.txHash;
              console.log('✅ Found mint transaction hash:', receiveTxHash);
              // #region agent log
              fetch('http://127.0.0.1:7242/ingest/95889d98-976f-4fbf-8a15-0ac51541a353', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'useBridge.jsx:716', message: 'Mint tx hash extracted', data: { txHash: receiveTxHash }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId: 'E' }) }).catch(() => { });
              // #endregion
            } else if (step.name === 'mint' && !step.txHash) {
              // #region agent log
              fetch('http://127.0.0.1:7242/ingest/95889d98-976f-4fbf-8a15-0ac51541a353', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ location: 'useBridge.jsx:720', message: 'Mint step found but no tx hash', data: { stepState: step.state, hasError: !!step.error }, timestamp: Date.now(), sessionId: 'debug-session', runId: 'run1', hypothesisId: 'D,E' }) }).catch(() => { });
              // #endregion
            }
            // Handle errors in any step
            else if (step.state === 'error') {
              console.error(`❌ Step ${index} (${step.name}) failed:`, step.error);
              throw new Error(`Bridge step '${step.name}' failed: ${step.error || 'Unknown error'}`);
            }
          });

          // Simple validation - just check if we have the required transaction hashes
          if (!sourceTxHash || !receiveTxHash) {
            console.warn('Missing transaction hashes - Source:', sourceTxHash, 'Destination:', receiveTxHash);
          }
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

      // Simple transaction hash validation
      if (sourceTxHash && typeof sourceTxHash === 'string' && sourceTxHash.startsWith('0x') && sourceTxHash.length === 66) {
        console.log('✅ Valid source transaction hash:', sourceTxHash);
      } else {
        console.warn('⚠️ Invalid or missing source transaction hash:', sourceTxHash);
        sourceTxHash = undefined;
      }

      if (receiveTxHash && typeof receiveTxHash === 'string' && receiveTxHash.startsWith('0x') && receiveTxHash.length === 66) {
        console.log('✅ Valid destination (mint) transaction hash:', receiveTxHash);
      } else {
        console.warn('⚠️ Invalid or missing destination (mint) transaction hash:', receiveTxHash);
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
      console.error('🔴 Bridge error caught:', err);

      // Enhanced error logging for debugging
      const errorDetails = {
        code: err.code,
        message: err.message,
        name: err.name,
        reason: err.reason,
        data: err.data,
        error: err.error,
        cause: err.cause,
        shortMessage: err.shortMessage,
        stack: err.stack?.substring(0, 200)
      };
      console.log('📋 Bridge error details:', errorDetails);

      let errorMessage = err.message || 'Bridge transaction failed';

      // Simplified error handling for the three main functions
      if (errorMessage.toLowerCase().includes('mint')) {
        const destChainName = destinationChain?.name || (destinationChainId === ARC_CHAIN_ID ? 'Arc Testnet' : destinationChainId === SEPOLIA_CHAIN_ID ? 'Sepolia' : 'destination chain');
        errorMessage = `Mint transaction failed on destination chain: ${errorMessage}. Please ensure you approve the network switch to ${destChainName} when prompted in your wallet.`;
      } else if (errorMessage.toLowerCase().includes('burn')) {
        errorMessage = `Burn transaction failed on source chain: ${errorMessage}`;
      } else if (errorMessage.toLowerCase().includes('approve')) {
        errorMessage = `Approval transaction failed on source chain: ${errorMessage}`;
      }

      // Handle common error types
      const errorMsg = (err.message || '').toLowerCase();
      const errorCode = err.code;

      // User rejection
      if (errorCode === 4001 || errorCode === 'ACTION_REJECTED' ||
        errorMsg.includes('user rejected') || errorMsg.includes('user denied')) {
        errorMessage = 'Transaction rejected: User denied transaction signature.';
      }
      // Insufficient funds
      else if (errorMsg.includes('insufficient funds') || errorCode === 'INSUFFICIENT_FUNDS') {
        errorMessage = 'Insufficient funds: Not enough balance to complete the bridge.';
      }
      // Network errors
      else if (errorMsg.includes('network') || errorMsg.includes('connection')) {
        errorMessage = 'Network error: Unable to connect to blockchain. Please check your connection.';
      }
      // Timeout errors
      else if (errorMsg.includes('timeout') || errorMsg.includes('timed out')) {
        errorMessage = 'Bridge transaction timeout. Please try again.';
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

      console.log('📤 Returning error state:', {
        step: errorState.step,
        error: errorState.error.substring(0, 100), // Log first 100 chars
      });

      setState(errorState);
      return errorState;
    }
  }, [address, isConnected, chainId, switchChain]);

  // Reset bridge state (but preserve balance - refresh it instead)
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
    // Don't clear balance - refresh it instead if we have address and chainId
    if (address && chainId) {
      const chainIdDecimal = typeof chainId === 'string' ? parseInt(chainId, 16) : chainId;
      fetchTokenBalance('USDC', chainIdDecimal).catch(err => {
        console.error('Error refreshing balance after reset:', err);
      });
    }
    setBalanceError('');
  }, [address, chainId, fetchTokenBalance]);

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