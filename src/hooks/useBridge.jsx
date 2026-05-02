import { useState, useCallback, useEffect, useRef } from 'react';
import { useAccount, useSwitchChain, useConfig } from 'wagmi';
import { getWalletClient } from '@wagmi/core';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { createPublicClient, http, fallback, formatUnits, encodeFunctionData } from 'viem';
import { sepolia as sepoliaChain, baseSepolia as baseSepoliaChain, arcTestnet as arcChain } from 'viem/chains';
import { getItem, setItem, removeItem } from '../utils/indexedDB';
import { AppKit } from "@circle-fin/app-kit";
import { createViemAdapterFromProvider } from "@circle-fin/adapter-viem-v2";
import { getKitKey } from '../utils/kitKey';
import { isAllowedApiUrl } from '../utils/security';
import { logger } from '../utils/logger';
import { DEVELOPER_FEE_RECIPIENT } from '../config/constants';

// --- Configuration & Constants ---

const BRIDGE_STATE_KEY = 'activeBridgeState';
const IRIS_API_BASE = 'https://iris-api-sandbox.circle.com';

// Chain IDs
export const SEPOLIA_CHAIN_ID = 11155111;
export const ARC_CHAIN_ID = 5042002;
export const BASE_SEPOLIA_CHAIN_ID = 84532;

// MessageTransmitter addresses for manual claim fallback (testnet)
const MESSAGE_TRANSMITTER = {
  [SEPOLIA_CHAIN_ID]: '0x7865fAFc2db2093669d92c0F33AeEF291086BEFD',
  [BASE_SEPOLIA_CHAIN_ID]: '0x7865fAFc2db2093669d92c0F33AeEF291086BEFD',
  [ARC_CHAIN_ID]: '0xE737e5cEBEEBa77EFE34D4aa090756590b1CE275',
};

// --- Web3 Chain Definitions ---
export const arcTestnet = arcChain;
export const sepolia = sepoliaChain;
export const baseSepolia = baseSepoliaChain;

const CHAIN_DEFINITIONS = {
  [SEPOLIA_CHAIN_ID]: sepolia,
  [ARC_CHAIN_ID]: arcTestnet,
  [BASE_SEPOLIA_CHAIN_ID]: baseSepolia,
};

// --- RPC Optimization ---
const safeRpcFetch = async (url, options) => {
  const response = await fetch(url, options);
  const clone = response.clone();
  try {
    const text = await clone.text();
    JSON.parse(text);
    return response;
  } catch {
    throw new Error(`Malformed JSON response from RPC`);
  }
};

const createFallbackTransport = (urls) => {
  return fallback(urls.map(url => http(url, { fetch: safeRpcFetch, timeout: 30000 })), { rank: true, retryCount: 5, retryDelay: 2000 });
};

// --- Public Client Cache ---
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

const RPC_URLS_BY_CHAIN = {
  [SEPOLIA_CHAIN_ID]: [import.meta.env.VITE_SEPOLIA_RPC_URL, 'https://ethereum-sepolia-rpc.publicnode.com', 'https://rpc.ankr.com/eth_sepolia'].filter(Boolean),
  [ARC_CHAIN_ID]: [import.meta.env.VITE_ARC_RPC_URL, 'https://rpc.testnet.arc.network'].filter(Boolean),
  [BASE_SEPOLIA_CHAIN_ID]: [import.meta.env.VITE_BASE_SEPOLIA_RPC_URL, 'https://base-sepolia-rpc.publicnode.com'].filter(Boolean),
};

const BALANCE_OF_ABI = [{ inputs: [{ name: 'owner', type: 'address' }], name: 'balanceOf', outputs: [{ name: '', type: 'uint256' }], type: 'function', stateMutability: 'view' }];

export function useBridge() {
  const { address, isConnected, chainId, connector } = useAccount();
  const { switchChainAsync } = useSwitchChain();
  const wagmiConfig = useConfig();
  const queryClient = useQueryClient();

  const [state, setState] = useState({
    step: 'idle',
    error: null,
    result: null,
    isLoading: false,
    sourceTxHash: undefined,
    receiveTxHash: undefined,
    direction: undefined,
    messageHash: undefined,
    rawMessage: undefined,
    attestation: undefined,
  });

  const activeTxIdRef = useRef(0);
  const setBridgeStateTop = useCallback((ns) => setState(p => ({ ...p, ...ns })), []);

  useEffect(() => {
    const hydrate = async () => {
      const saved = await getItem(BRIDGE_STATE_KEY);
      if (saved && saved.step !== 'success') setBridgeStateTop({ ...saved, isLoading: false });
    };
    hydrate();
  }, [setBridgeStateTop]);

  useEffect(() => {
    if (state.isLoading || (state.step !== 'idle' && state.step !== 'success')) {
      setItem(BRIDGE_STATE_KEY, state).catch(() => {});
    }
  }, [state]);

  const { data: tokenBalance, isLoading: isLoadingBalance } = useQuery({
    queryKey: ['bridge-usdc-balance', address, chainId],
    queryFn: async () => {
      if (!address || !chainId || !CHAIN_DEFINITIONS[chainId]) return null;
      const client = getClient(chainId, RPC_URLS_BY_CHAIN[chainId], CHAIN_DEFINITIONS[chainId]);
      if (chainId === ARC_CHAIN_ID) return formatUnits(await client.getBalance({ address }), 18);
      
      const usdcAddrs = {
        [SEPOLIA_CHAIN_ID]: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238',
        [BASE_SEPOLIA_CHAIN_ID]: '0x036CbD53842c5426634e7929541eC2318f3dCF7e',
      };

      const usdc = usdcAddrs[chainId];
      if (!usdc) return null;
      const bal = await client.readContract({ address: usdc, abi: BALANCE_OF_ABI, functionName: 'balanceOf', args: [address] });
      return formatUnits(bal, 6);
    },
    enabled: !!address && !!chainId,
    refetchInterval: 15000,
  });

  const bridge = useCallback(async (token, amount, direction) => {
    const txId = ++activeTxIdRef.current;
    if (state.isLoading) return;

    const setBridgeState = (ns) => { if (activeTxIdRef.current === txId) setBridgeStateTop(ns); };

    try {
      if (!isConnected || !address || !connector) throw new Error('Connect your wallet first');
      
      logger.log(`[AppKit] Initiating: ${direction}, Amount: ${amount}`);
      setBridgeState({ step: 'idle', error: null, result: null, isLoading: true, direction });

      const kit = new AppKit();

      // Fetch kit key securely (runtime, never bundled)
      const kitKey = await getKitKey();

      let sourceChain = "Ethereum_Sepolia";
      let destChain = "Arc_Testnet";
      let sourceId = SEPOLIA_CHAIN_ID;

      switch (direction) {
        case 'sepolia-to-arc': sourceChain = "Ethereum_Sepolia"; destChain = "Arc_Testnet"; sourceId = SEPOLIA_CHAIN_ID; break;
        case 'sepolia-to-base': sourceChain = "Ethereum_Sepolia"; destChain = "Base_Sepolia"; sourceId = SEPOLIA_CHAIN_ID; break;
        case 'arc-to-sepolia': sourceChain = "Arc_Testnet"; destChain = "Ethereum_Sepolia"; sourceId = ARC_CHAIN_ID; break;
        case 'arc-to-base': sourceChain = "Arc_Testnet"; destChain = "Base_Sepolia"; sourceId = ARC_CHAIN_ID; break;
        case 'base-to-sepolia': sourceChain = "Base_Sepolia"; destChain = "Ethereum_Sepolia"; sourceId = BASE_SEPOLIA_CHAIN_ID; break;
        case 'base-to-arc': sourceChain = "Base_Sepolia"; destChain = "Arc_Testnet"; sourceId = BASE_SEPOLIA_CHAIN_ID; break;
        default: throw new Error(`Invalid direction: ${direction}`);
      }

      if (chainId !== sourceId) {
        setBridgeState({ step: 'switching-network' });
        await switchChainAsync({ chainId: sourceId });
        await new Promise(r => setTimeout(r, 4500));
      }

      const provider = await connector.getProvider();
      const adapter = await createViemAdapterFromProvider({ 
        provider,
        getPublicClient: ({ chain }) => {
          const chainId = chain.id;
          const rpcUrls = RPC_URLS_BY_CHAIN[chainId] || [];
          return createPublicClient({
            chain,
            transport: createFallbackTransport(rpcUrls),
          });
        }
      });

      // Arc Docs Event Handlers
      kit.on("bridge.approve", () => setBridgeState({ step: 'approving' }));
      kit.on("bridge.burn", (p) => setBridgeState({ step: 'burning', sourceTxHash: p.values.txHash, messageHash: p.values.messageHash, rawMessage: p.values.message }));
      kit.on("bridge.fetchAttestation", (p) => setBridgeState({ step: 'forwarding', attestation: p.values.attestation, messageHash: p.values.messageHash }));
      kit.on("bridge.mint", (p) => setBridgeState({ step: 'minting', receiveTxHash: p.values.txHash }));

      const result = await kit.bridge({
        from: { adapter, chain: sourceChain },
        to: { adapter, chain: destChain },
        amount: String(amount),
        token: 'USDC',
        config: { 
          transferSpeed: 'FAST', 
          kitKey,
          developerFee: {
            recipient: DEVELOPER_FEE_RECIPIENT,
            percentage: 0.01
          }
        }
      });

      if (result.state === 'success' || result.hash) {
        // Find the mint step to get the correct FINAL transaction hash
        const mintStep = result.steps?.find(s => s.name === 'mint');
        const finalHash = mintStep?.txHash || result.hash;
        
        setBridgeState({ 
          step: 'success', 
          isLoading: false, 
          receiveTxHash: finalHash 
        });
        await removeItem(BRIDGE_STATE_KEY);
      } else {
        throw new Error('Transfer failed to reach success state');
      }

    } catch (err) {
      logger.error('[AppKit] Error:', err);
      setBridgeState({ step: 'error', error: err.message, isLoading: false, direction });
    }
  }, [address, isConnected, chainId, connector, switchChainAsync, setBridgeStateTop, state.isLoading]);

  const claim = useCallback(async () => {
    if (!state.messageHash || !state.rawMessage || !state.direction) throw new Error('No claimable message');
    setBridgeStateTop({ isLoading: true, step: 'fetching-attestation' });
    
    try {
      const destId = state.direction.endsWith('to-arc') ? ARC_CHAIN_ID : (state.direction.endsWith('to-base') ? BASE_SEPOLIA_CHAIN_ID : SEPOLIA_CHAIN_ID);
      const url = `${IRIS_API_BASE}/v2/messages/0?messageHash=${state.messageHash}`;
      if (!isAllowedApiUrl(url)) throw new Error('Security check failed: Unauthorized API URL');
      const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(url)}`;
      const res = await fetch(proxyUrl);
      const data = await res.json();
      const att = data.messages?.[0]?.attestation;

      if (!att) throw new Error('Attestation not ready');

      if (chainId !== destId) {
        setBridgeStateTop({ step: 'switching-network' });
        await switchChainAsync({ chainId: destId });
        await new Promise(r => setTimeout(r, 4000));
      }

      setBridgeStateTop({ step: 'minting' });
      const wallet = await getWalletClient(wagmiConfig, { chainId: destId });
      const tx = await wallet.sendTransaction({
        to: MESSAGE_TRANSMITTER[destId],
        data: encodeFunctionData({
          abi: [{ type: 'function', name: 'receiveMessage', inputs: [{ name: 'message', type: 'bytes' }, { name: 'attestation', type: 'bytes' }], outputs: [{ name: '', type: 'bool' }] }],
          functionName: 'receiveMessage',
          args: [state.rawMessage, att],
        }),
      });
      setBridgeStateTop({ step: 'success', isLoading: false, receiveTxHash: tx });
      await removeItem(BRIDGE_STATE_KEY);
    } catch (err) {
      setBridgeStateTop({ step: 'error', error: err.message, isLoading: false });
    }
  }, [state, chainId, switchChainAsync, wagmiConfig, setBridgeStateTop]);

  const reset = useCallback(() => { activeTxIdRef.current++; setState({ step: 'idle', error: null, result: null, isLoading: false }); removeItem(BRIDGE_STATE_KEY).catch(() => {}); }, []);

  const refreshBalances = useCallback(() => queryClient.invalidateQueries(['bridge-usdc-balance']), [queryClient]);
  const fetchTokenBalance = useCallback(() => queryClient.invalidateQueries(['bridge-usdc-balance']), [queryClient]);

  return { 
    state, 
    tokenBalance, 
    isLoadingBalance, 
    bridge, 
    claim, 
    reset, 
    fetchTokenBalance, 
    clearBalance: () => {}, 
    refreshBalances 
  };
}
