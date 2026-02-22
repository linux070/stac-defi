import { useState, useCallback, useEffect } from 'react';
import { useAccount, useSwitchChain } from 'wagmi';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { createPublicClient, createWalletClient, custom, http, fallback, formatUnits, parseUnits, defineChain, encodeFunctionData, pad } from 'viem';
import { sepolia as sepoliaChain } from 'viem/chains';

// Explicitly define ARC Testnet and Sepolia for high reliability
export const arcTestnet = defineChain({
  id: 5042002,
  name: 'Arc Testnet',
  nativeCurrency: { name: 'USDC', symbol: 'USDC', decimals: 18 },
  rpcUrls: {
    default: { http: [import.meta.env.VITE_ARC_RPC_URL] },
  },
  blockExplorers: {
    default: { name: 'ArcScan', url: 'https://testnet.arcscan.app' },
  },
});

export const sepolia = defineChain({
  ...sepoliaChain,
  rpcUrls: {
    ...sepoliaChain.rpcUrls,
    default: { http: [import.meta.env.VITE_SEPOLIA_RPC_URL] },
  },
});

/**
 * Custom fetch handler to intercept malformed/truncated JSON responses
 * Forces viem fallback to switch providers when a SyntaxError is detected.
 */
const safeRpcFetch = async (url, options) => {
  try {
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
        throw new Error(`Malformed JSON response from RPC: ${err.message}`);
      }
      return response;
    }
  } catch (err) {
    console.error(`[SuperBridge] Network error on RPC ${url}:`, err.message);
    throw err;
  }
};

// --- Configuration & Constants ---

// CCTP v2 Iris API base URL (Sandbox for testnets)
const IRIS_API_BASE = 'https://iris-api-sandbox.circle.com';

// CCTP Domain identifiers (from Circle docs)
const CCTP_DOMAINS = {
  11155111: 0,  // Ethereum Sepolia
  84532: 6,     // Base Sepolia
  5042002: 26,  // Arc Testnet
};

// TokenMessengerV2 contract address (same on all testnets)
const TOKEN_MESSENGER_V2 = '0x8FE6B999Dc680CcFDD5Bf7EB0974218be2542DAA';

// Forwarding Service hook data: magic bytes ("cctp-forward") + version (0) + empty data length (0)
const FORWARDING_SERVICE_HOOK_DATA = '0x636374702d666f72776172640000000000000000000000000000000000000000';

// RPC URLs for all chains including partner providers
const SEPOLIA_RPC_URLS = [
  import.meta.env.VITE_ALCHEMY_SEPOLIA_URL,
  import.meta.env.VITE_SEPOLIA_RPC_URL,
  import.meta.env.VITE_SEPOLIA_RPC_URL_ALT,
  'https://ethereum-sepolia-rpc.publicnode.com',
  'https://rpc2.sepolia.org',
  'https://1rpc.io/sepolia',
  'https://eth-sepolia.public.blastapi.io',
].filter(Boolean);

const ARC_RPC_URLS = [
  import.meta.env.VITE_ALCHEMY_ARC_URL,
  import.meta.env.VITE_QUICKNODE_ARC_URL,
  import.meta.env.VITE_ARC_RPC_URL,
  'https://rpc.testnet.arc.network',
  'https://rpc-testnet.arc.network',
].filter(Boolean);

const BASE_SEPOLIA_RPC_URLS = [
  import.meta.env.VITE_QUICKNODE_BASE_URL,
  import.meta.env.VITE_BASE_SEPOLIA_RPC_URL,
  import.meta.env.VITE_BASE_SEPOLIA_RPC_URL_ALT,
  'https://sepolia.base.org',
  'https://base-sepolia-rpc.publicnode.com',
  'https://1rpc.io/base-sepolia',
  'https://base-sepolia.gateway.tenderly.co',
].filter(Boolean);

// Shared transport configuration for all chains
const createFallbackTransport = (urls, timeout = 15000, retryCount = 5) => {
  return fallback(
    urls.map(url => http(url, {
      fetch: safeRpcFetch,
      timeout
    })),
    {
      rank: true,
      retryCount,
      retryDelay: 1000,
    }
  );
};

export const publicClient = createPublicClient({
  chain: sepolia,
  transport: createFallbackTransport(SEPOLIA_RPC_URLS),
  batch: { multicall: true },
  pollingInterval: 12_000,
});

// Token configurations for all supported chains
export const CHAIN_TOKENS = {
  [11155111]: { // Sepolia
    USDC: {
      symbol: 'USDC',
      name: 'USD Coin',
      decimals: 6,
      contractAddress: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238',
    },
  },
  [5042002]: { // Arc Testnet
    USDC: {
      symbol: 'USDC',
      name: 'USD Coin',
      decimals: 18,
      contractAddress: '0x3600000000000000000000000000000000000000',
    },
  },
  [84532]: { // Base Sepolia
    USDC: {
      symbol: 'USDC',
      name: 'USD Coin',
      decimals: 6,
      contractAddress: '0x036CbD53842c5426634e7929541eC2318f3dCF7e',
    },
  },
};

// Legacy export for backward compatibility
export const SEPOLIA_TOKENS = CHAIN_TOKENS[11155111];

// Chain IDs
export const SEPOLIA_CHAIN_ID = 11155111;
export const ARC_CHAIN_ID = 5042002;
export const BASE_SEPOLIA_CHAIN_ID = 84532;

// --- Chain Definitions for viem ---
const CHAIN_DEFINITIONS = {
  [SEPOLIA_CHAIN_ID]: sepolia,
  [ARC_CHAIN_ID]: arcTestnet,
  [BASE_SEPOLIA_CHAIN_ID]: defineChain({
    id: BASE_SEPOLIA_CHAIN_ID,
    name: 'Base Sepolia',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
    rpcUrls: { default: { http: BASE_SEPOLIA_RPC_URLS } },
    blockExplorers: { default: { name: 'BaseScan', url: 'https://sepolia.basescan.org' } },
  }),
};

const RPC_URLS_BY_CHAIN = {
  [SEPOLIA_CHAIN_ID]: SEPOLIA_RPC_URLS,
  [ARC_CHAIN_ID]: ARC_RPC_URLS,
  [BASE_SEPOLIA_CHAIN_ID]: BASE_SEPOLIA_RPC_URLS,
};

// --- ABIs ---
const ERC20_APPROVE_ABI = [
  {
    type: 'function',
    name: 'approve',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
];

const DEPOSIT_FOR_BURN_WITH_HOOK_ABI = [
  {
    type: 'function',
    name: 'depositForBurnWithHook',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'amount', type: 'uint256' },
      { name: 'destinationDomain', type: 'uint32' },
      { name: 'mintRecipient', type: 'bytes32' },
      { name: 'burnToken', type: 'address' },
      { name: 'destinationCaller', type: 'bytes32' },
      { name: 'maxFee', type: 'uint256' },
      { name: 'minFinalityThreshold', type: 'uint32' },
      { name: 'hookData', type: 'bytes' },
    ],
    outputs: [],
  },
];

// --- Persistent Clients ---
const clients = {};
const getClient = (chainId, rpcUrls, chain) => {
  if (!clients[chainId]) {
    clients[chainId] = createPublicClient({
      chain,
      transport: createFallbackTransport(rpcUrls),
      batch: { multicall: true }
    });
  }
  return clients[chainId];
};

// --- Main Hook ---
export function useBridge() {
  const { address, isConnected, chainId } = useAccount();
  const { switchChain } = useSwitchChain();
  const queryClient = useQueryClient();

  const [state, setState] = useState({
    step: 'idle',
    error: null,
    result: null,
    isLoading: false,
    sourceTxHash: undefined,
    receiveTxHash: undefined,
    direction: undefined,
  });

  const [selectedTokenKey, setSelectedTokenKey] = useState('USDC');
  const [selectedChainId, setSelectedChainId] = useState(chainId || SEPOLIA_CHAIN_ID);

  // Sync selected chain with wagmi chainId
  useEffect(() => {
    if (chainId) setSelectedChainId(chainId);
  }, [chainId]);

  const balanceQuery = useQuery({
    queryKey: ['balance', address, selectedChainId, selectedTokenKey],
    queryFn: async () => {
      const chainTokens = CHAIN_TOKENS[selectedChainId];
      const tokenInfo = chainTokens[selectedTokenKey];

      let client;
      if (selectedChainId === SEPOLIA_CHAIN_ID) client = getClient(SEPOLIA_CHAIN_ID, SEPOLIA_RPC_URLS, sepolia);
      else if (selectedChainId === ARC_CHAIN_ID) client = getClient(ARC_CHAIN_ID, ARC_RPC_URLS, arcTestnet);
      else if (selectedChainId === BASE_SEPOLIA_CHAIN_ID) client = getClient(BASE_SEPOLIA_CHAIN_ID, BASE_SEPOLIA_RPC_URLS, CHAIN_DEFINITIONS[BASE_SEPOLIA_CHAIN_ID]);

      if (!client) throw new Error('Client not found');

      let balance;
      let decimals = tokenInfo.decimals;

      if (selectedChainId === ARC_CHAIN_ID) {
        balance = await client.getBalance({ address });
        decimals = 18;
      } else {
        balance = await client.readContract({
          address: tokenInfo.contractAddress,
          abi: [{ constant: true, inputs: [{ name: '_owner', type: 'address' }], name: 'balanceOf', outputs: [{ name: 'balance', type: 'uint256' }], type: 'function' }],
          functionName: 'balanceOf',
          args: [address],
        });
      }

      return parseFloat(formatUnits(balance, decimals)).toFixed(2);
    },
    enabled: !!address && isConnected && !!CHAIN_TOKENS[selectedChainId],
    staleTime: 15000,
    refetchInterval: 30000,
  });

  // Listener to invalidate balance on transaction save/faucet claim
  useEffect(() => {
    const invalidate = () => queryClient.invalidateQueries({ queryKey: ['balance', address] });
    window.addEventListener('faucetClaimed', invalidate);
    window.addEventListener('swapTransactionSaved', invalidate);
    return () => {
      window.removeEventListener('faucetClaimed', invalidate);
      window.removeEventListener('swapTransactionSaved', invalidate);
    };
  }, [address, queryClient]);

  const tokenBalance = balanceQuery.data || '0';
  const isLoadingBalance = balanceQuery.isLoading || balanceQuery.isFetching;
  const balanceError = balanceQuery.error?.message || '';

  const fetchTokenBalance = useCallback(async (token, sourceChainId) => {
    setSelectedTokenKey(token);
    setSelectedChainId(sourceChainId);
  }, []);

  // --- Forwarding Service: Fetch fees from Iris API (with browser fallback) ---
  const fetchForwardingFees = useCallback(async (sourceChainId, destChainId) => {
    const sourceDomain = CCTP_DOMAINS[sourceChainId];
    const destDomain = CCTP_DOMAINS[destChainId];

    if (sourceDomain === undefined || destDomain === undefined) {
      throw new Error(`Unsupported chain for CCTP. Source: ${sourceChainId}, Dest: ${destChainId}`);
    }

    const url = `${IRIS_API_BASE}/v2/burn/USDC/fees/${sourceDomain}/${destDomain}?forward=true`;
    console.log('[Forwarding] Fetching fees from:', url);

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const fees = await response.json();
      console.log('[Forwarding] Fee data from API:', fees);
      return fees;
    } catch (err) {
      // The Iris API does not support browser CORS — falls back to safe defaults.
      // Circle's Forwarding Service refunds unused fee, so a generous default is safe.
      console.warn('[Forwarding] Iris API unreachable from browser (likely CORS):', err.message);
      console.log('[Forwarding] Using safe fallback fee defaults');

      const decimals = CHAIN_TOKENS[sourceChainId]?.USDC?.decimals ?? 6;

      // Conservative fallback: 0.10 USDC forward fee + 0 bps protocol fee
      // Circle refunds any unused portion of maxFee to the recipient
      const fallbackForwardFee = decimals === 18
        ? '100000000000000000'   // 0.1 USDC (18 decimals)
        : '100000';              // 0.1 USDC (6 decimals)

      return [{
        finalityThreshold: 2000,
        forwardFee: {
          low: fallbackForwardFee,
          med: fallbackForwardFee,
          high: fallbackForwardFee,
        },
        minimumFee: 0,
        _fallback: true,
      }];
    }
  }, []);

  // --- Forwarding Service: Poll for mint confirmation ---
  const pollForMint = useCallback(async (sourceDomain, burnTxHash, maxAttempts = 120) => {
    console.log(`[Forwarding] Polling for mint confirmation. Domain: ${sourceDomain}, TxHash: ${burnTxHash}`);

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        const url = `${IRIS_API_BASE}/v2/messages/${sourceDomain}?transactionHash=${burnTxHash}`;
        const response = await fetch(url);
        const data = await response.json();

        if (data.messages?.[0]?.forwardTxHash) {
          const mintTxHash = data.messages[0].forwardTxHash;
          console.log('[Forwarding] ✅ Mint confirmed:', mintTxHash);
          return mintTxHash;
        }

        // Check attestation status for progress updates
        if (data.messages?.[0]?.status) {
          console.log(`[Forwarding] Attestation status: ${data.messages[0].status} (attempt ${attempt + 1})`);
        }
      } catch (err) {
        console.warn(`[Forwarding] Poll attempt ${attempt + 1} failed:`, err.message);
      }

      // Wait 3 seconds between polls
      await new Promise(resolve => setTimeout(resolve, 3000));
    }

    // If we reach here, we exceeded max attempts but the burn was successful
    // The mint will still happen via Circle's infrastructure
    console.warn('[Forwarding] Max poll attempts reached. Mint may still be processing.');
    return null;
  }, []);

  // --- Execute bridge transaction using Forwarding Service ---
  const bridge = useCallback(async (token, amount, direction) => {
    let sourceChainId = null;
    let destinationChainId = null;
    let currentBridgeStep = 'init'; // Track which step fails for debugging

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

      // Get the provider from wallet
      if (!window?.ethereum) {
        throw new Error('Browser wallet not found. Please install a browser wallet like MetaMask.');
      }

      const provider = window.ethereum;
      if (!provider?.request) {
        throw new Error('Wallet provider is not properly configured. Please ensure your wallet is connected.');
      }

      // Determine source and destination chains
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

      const sourceDomain = CCTP_DOMAINS[sourceChainId];
      const destDomain = CCTP_DOMAINS[destinationChainId];
      const sourceToken = CHAIN_TOKENS[sourceChainId]?.USDC;

      if (!sourceToken) {
        throw new Error(`USDC not configured for chain ${sourceChainId}`);
      }

      // Switch to source chain if needed
      if (chainId !== sourceChainId) {
        currentBridgeStep = 'switch-network';
        setState(prev => ({ ...prev, step: 'switching-network' }));
        await switchChain({ chainId: sourceChainId });
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

      // --- Step 1: Fetch forwarding fees ---
      currentBridgeStep = 'fetch-fees';
      setState(prev => ({ ...prev, step: 'fetching-fees' }));
      console.log('--- FORWARDING BRIDGE INITIATED ---');
      console.log('Direction:', direction);
      console.log('Amount:', amount, 'USDC');

      const fees = await fetchForwardingFees(sourceChainId, destinationChainId);

      // Use standard transfer fees (finalityThreshold: 2000) — no protocol fee
      const feeData = fees.find(f => f.finalityThreshold === 2000) || fees[fees.length - 1];
      const forwardFee = BigInt(feeData.forwardFee.high); // Use high to ensure enough gas coverage
      const minimumFeeBps = feeData.minimumFee || 0;

      // Calculate amounts in source chain decimals
      const decimals = sourceToken.decimals;
      const transferAmount = parseUnits(String(amount).trim(), decimals);
      const protocolFee = minimumFeeBps > 0
        ? (transferAmount * BigInt(Math.round(minimumFeeBps * 100))) / 1_000_000n
        : 0n;
      const maxFee = forwardFee + protocolFee;
      let totalAmount = transferAmount + maxFee;

      // --- Pre-flight balance check ---
      // Read actual on-chain balance to prevent "transfer amount exceeds balance" revert
      const sourceChainDef = CHAIN_DEFINITIONS[sourceChainId];
      const sourcePublicClient = getClient(sourceChainId, RPC_URLS_BY_CHAIN[sourceChainId], sourceChainDef);

      let onChainBalance;
      if (sourceChainId === ARC_CHAIN_ID) {
        // Arc Testnet: USDC is the native gas token
        onChainBalance = await sourcePublicClient.getBalance({ address });
      } else {
        onChainBalance = await sourcePublicClient.readContract({
          address: sourceToken.contractAddress,
          abi: [{ constant: true, inputs: [{ name: '_owner', type: 'address' }], name: 'balanceOf', outputs: [{ name: 'balance', type: 'uint256' }], type: 'function' }],
          functionName: 'balanceOf',
          args: [address],
        });
      }

      console.log('[Forwarding] On-chain balance:', formatUnits(onChainBalance, decimals), 'USDC');

      // If totalAmount exceeds balance, auto-adjust transferAmount down
      if (totalAmount > onChainBalance) {
        const adjustedTransfer = onChainBalance - maxFee;
        const minTransfer = parseUnits('0.01', decimals); // Minimum 0.01 USDC

        if (adjustedTransfer < minTransfer) {
          throw new Error(
            `Insufficient balance. You need at least ${formatUnits(maxFee + minTransfer, decimals)} USDC ` +
            `(${formatUnits(minTransfer, decimals)} transfer + ${formatUnits(maxFee, decimals)} fee) ` +
            `but only have ${formatUnits(onChainBalance, decimals)} USDC.`
          );
        }

        console.log(`[Forwarding] Adjusted transfer: ${formatUnits(transferAmount, decimals)} → ${formatUnits(adjustedTransfer, decimals)} USDC (fee deducted)`);
        totalAmount = onChainBalance; // Use full balance
      }

      console.log('[Forwarding] Fee breakdown:', {
        transferAmount: formatUnits(totalAmount - maxFee, decimals),
        forwardFee: formatUnits(forwardFee, decimals),
        protocolFee: formatUnits(protocolFee, decimals),
        maxFee: formatUnits(maxFee, decimals),
        totalToBurn: formatUnits(totalAmount, decimals),
        onChainBalance: formatUnits(onChainBalance, decimals),
        finalityThreshold: feeData.finalityThreshold,
        usingFallback: !!feeData._fallback,
      });

      // Create wallet client from browser provider
      const walletClient = createWalletClient({
        account: address,
        chain: sourceChainDef,
        transport: custom(provider),
      });

      // --- Step 2: Approve USDC spend on TokenMessengerV2 ---
      currentBridgeStep = 'approve';
      setState(prev => ({ ...prev, step: 'approving' }));
      console.log('[Forwarding] Approving USDC spend...');

      const approveData = encodeFunctionData({
        abi: ERC20_APPROVE_ABI,
        functionName: 'approve',
        args: [TOKEN_MESSENGER_V2, totalAmount],
      });

      const approveTxHash = await walletClient.sendTransaction({
        to: sourceToken.contractAddress,
        data: approveData,
      });

      console.log('[Forwarding] ✅ Approval tx:', approveTxHash);

      // Wait for approval confirmation
      await sourcePublicClient.waitForTransactionReceipt({ hash: approveTxHash, confirmations: 1 });
      console.log('[Forwarding] ✅ Approval confirmed');

      // --- Step 3: depositForBurnWithHook (Burn + Forwarding Hook) ---
      currentBridgeStep = 'burn';
      setState(prev => ({ ...prev, step: 'burning' }));
      console.log('[Forwarding] Executing depositForBurnWithHook...');

      const mintRecipientBytes32 = pad(address, { size: 32 });
      const destinationCallerEmpty = pad('0x', { size: 32 });

      const burnData = encodeFunctionData({
        abi: DEPOSIT_FOR_BURN_WITH_HOOK_ABI,
        functionName: 'depositForBurnWithHook',
        args: [
          totalAmount,                    // amount: total to burn (recipient gets transferAmount after fees)
          destDomain,                     // destinationDomain
          mintRecipientBytes32,           // mintRecipient (user's own address)
          sourceToken.contractAddress,    // burnToken (USDC on source chain)
          destinationCallerEmpty,         // destinationCaller (empty = any relay can execute)
          maxFee,                         // maxFee (forwarding gas + protocol fee)
          2000,                           // minFinalityThreshold (Standard = 2000)
          FORWARDING_SERVICE_HOOK_DATA,   // hookData (magic "cctp-forward" bytes)
        ],
      });

      const burnTxHash = await walletClient.sendTransaction({
        to: TOKEN_MESSENGER_V2,
        data: burnData,
      });

      console.log('[Forwarding] ✅ Burn tx submitted:', burnTxHash);

      // Wait for burn confirmation
      await sourcePublicClient.waitForTransactionReceipt({ hash: burnTxHash, confirmations: 1 });
      console.log('[Forwarding] ✅ Burn confirmed on source chain');

      // --- Step 4: Poll for automatic mint (Circle's relayer handles this) ---
      currentBridgeStep = 'forwarding';
      setState(prev => ({ ...prev, step: 'forwarding', sourceTxHash: burnTxHash }));
      console.log('[Forwarding] Waiting for Circle to auto-mint on destination chain...');

      const mintTxHash = await pollForMint(sourceDomain, burnTxHash);

      // --- Success ---
      const receivedAmount = formatUnits(totalAmount - maxFee, decimals);
      console.log('[Forwarding] Bridge completed!', {
        sourceTxHash: burnTxHash,
        receiveTxHash: mintTxHash,
        receivedAmount,
      });

      const finalState = {
        step: 'success',
        error: null,
        result: { burnTxHash, mintTxHash, amount: receivedAmount, direction },
        isLoading: false,
        sourceTxHash: burnTxHash,
        receiveTxHash: mintTxHash,
        direction,
      };

      setState(finalState);
      return finalState;

    } catch (err) {
      console.error(`🔴 Bridge error at step [${currentBridgeStep}]:`, err);
      console.error('🔴 Raw error:', { code: err.code, message: err.message, name: err.name, cause: err.cause });

      let errorMessage = err.message || 'Bridge transaction failed';
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
      // Network / RPC errors
      else if (errorMsg.includes('failed to fetch') || errorMsg.includes('network') || errorMsg.includes('connection')) {
        errorMessage = `Network error during ${currentBridgeStep} step: Unable to reach the blockchain RPC. Please check your internet connection and try again.`;
      }
      // Timeout errors
      else if (errorMsg.includes('timeout') || errorMsg.includes('timed out')) {
        errorMessage = `Timeout during ${currentBridgeStep} step. Please try again.`;
      }
      // Gas estimation / revert errors
      else if (errorMsg.includes('gas') || errorMsg.includes('execution reverted')) {
        errorMessage = `Transaction reverted during ${currentBridgeStep} step. Please ensure you have enough USDC (amount + forwarding fee) and that the bridge route is supported.`;
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
        error: errorState.error.substring(0, 100),
      });

      setState(errorState);
      return errorState;
    }
  }, [address, isConnected, chainId, switchChain, fetchForwardingFees, pollForMint]);

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
    if (address && chainId) {
      const chainIdDecimal = typeof chainId === 'string' ? parseInt(chainId, 16) : chainId;
      fetchTokenBalance('USDC', chainIdDecimal);
    }
  }, [address, chainId, fetchTokenBalance]);

  // Clear only balance (for disconnect scenarios)
  const clearBalance = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['balance', address] });
  }, [address, queryClient]);

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