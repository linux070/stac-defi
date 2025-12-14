// Network configurations for Arc Testnet and Sepolia

export const NETWORKS = {
  ARC_TESTNET: {
    chainId: '0x4cef52', // 5042002 in decimal - Arc Testnet
    chainName: 'Arc Testnet',
    nativeCurrency: {
      name: 'ETH',
      symbol: 'ETH',
      decimals: 18,
    },
    rpcUrls: ['https://rpc-testnet.arc.network'],
    blockExplorerUrls: ['https://testnet.arcscan.app/'],
    gasToken: 'USDC', // Arc uses USDC for gas
  },
  ETHEREUM_SEPOLIA: {
    chainId: '0xaa36a7', // 11155111 in hex
    chainName: 'Sepolia Testnet',
    nativeCurrency: {
      name: 'SepoliaETH',
      symbol: 'ETH',
      decimals: 18,
    },
    rpcUrls: ['https://sepolia.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161'],
    blockExplorerUrls: ['https://sepolia.etherscan.io/'],
  },
};export const SUPPORTED_CHAINS = [
  NETWORKS.ARC_TESTNET.chainId,
  NETWORKS.ETHEREUM_SEPOLIA.chainId,
];

export const DEFAULT_CHAIN = NETWORKS.ARC_TESTNET;

// Token configuration - Updated with official Circle USDC addresses
export const TOKENS = {
  USDC: {
    symbol: 'USDC',
    name: 'USD Coin',
    decimals: 6,
    address: {
      [NETWORKS.ARC_TESTNET.chainId]: '0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d', // Official Circle USDC on Arc Testnet
      [NETWORKS.ETHEREUM_SEPOLIA.chainId]: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238', // Official Circle USDC on Sepolia
    },
    logo: 'usd-circle', // FAIcon name (Circle USDC)
  },
  // NEW: Added structured format for Bridge component
  ETHEREUM_SEPOLIA: {
    USDC: {
      address: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238', // Official Circle USDC on Sepolia
      decimals: 6,
      symbol: 'USDC',
    },
  },
  ARC_TESTNET: {
    USDC: {
      address: '0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d', // Official Circle USDC on Arc Testnet
      decimals: 6,
      symbol: 'USDC',
    },
  },
  EURC: {
    symbol: 'EURC',
    name: 'Euro Coin',
    decimals: 6,
    address: {
      [NETWORKS.ARC_TESTNET.chainId]: '0x', // Placeholder
      [NETWORKS.ETHEREUM_SEPOLIA.chainId]: '0x', // Placeholder
    },
    logo: 'euro-sign', // FAIcon name
  },
};

// Mock token prices (would be fetched from oracles in production)
export const TOKEN_PRICES = {
  USDC: 1,
  EUR: 1.1,
};

// Contract addresses (placeholders - to be replaced with actual deployed contracts)
export const CONTRACTS = {
  [NETWORKS.ARC_TESTNET.chainId]: {
    SWAP_ROUTER: '0x',
    SWAP_FACTORY: '0x',
    BRIDGE: '0x',
    LP_MANAGER: '0x',
  },
  [NETWORKS.ETHEREUM_SEPOLIA.chainId]: {
    BRIDGE: '0x',
  },
};

// Helper functions
export const getNetworkByChainId = (chainId) => {
  return Object.values(NETWORKS).find(network => network.chainId === chainId);
};

export const isNetworkSupported = (chainId) => {
  return SUPPORTED_CHAINS.includes(chainId);
};

export const switchNetwork = async (provider, networkConfig) => {
  try {
    await provider.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: networkConfig.chainId }],
    });
  } catch (switchError) {
    // This error code indicates that the chain has not been added to MetaMask
    if (switchError.code === 4902) {
      try {
        await provider.request({
          method: 'wallet_addEthereumChain',
          params: [networkConfig],
        });
      } catch (addError) {
        throw addError;
      }
    } else {
      throw switchError;
    }
  }
};