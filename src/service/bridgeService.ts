import { BridgeKit } from "@circle-fin/bridge-kit";

// Singleton instance
let bridgeKitInstance: BridgeKit | null = null;

export const getBridgeKit = () => {
  if (!bridgeKitInstance) {
    bridgeKitInstance = new BridgeKit();
  }
  return bridgeKitInstance;
};

// Supported chains
export const SUPPORTED_CHAINS = {
  ETHEREUM: "Ethereum",
  BASE: "Base",
  ARBITRUM: "Arbitrum",
  POLYGON: "Polygon",
  AVALANCHE: "Avalanche",
  OPTIMISM: "Optimism",
  SOLANA: "Solana",
  // Add more as needed
} as const;

export type SupportedChain = typeof SUPPORTED_CHAINS[keyof typeof SUPPORTED_CHAINS];
