import { BridgeKit } from '@circle-fin/bridge-kit';
import { createAdapterFromProvider } from '@circle-fin/adapter-viem-v2';
// import { useConnectorClient } from 'wagmi';
// import { BridgeKit } from '@circle-fin/bridge-kit';
// import { createAdapterFromProvider } from '@circle-fin/adapter-viem-v2';
// Function now returns both the Kit and the Adapter
export const initializeBridge = (walletClient: any) => {
  if (!walletClient) throw new Error("Wallet Client is required");

  // Fix: Pass walletClient directly, not inside an object
  const adapter = createAdapterFromProvider(walletClient);
  const kit = new BridgeKit();

  return { kit, adapter };
};

// Testnet chains supported
export const TESTNET_CHAINS = [
  'Arc_Testnet',
  'Ethereum_Sepolia',
  'Base_Sepolia',
  'Arbitrum_Sepolia',
  'Avalanche_Fuji',
  'Polygon_Amoy'
];