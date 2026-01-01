// Network configurations for Arc Testnet and Sepolia

export const NETWORKS = {
  ARC_TESTNET: {
    chainId: '0x4cef52', // 5042002 in decimal - Arc Testnet
    chainName: 'Arc Testnet',
    nativeCurrency: {
      name: 'USDC',
      symbol: 'USDC',
      decimals: 18,
    },
    rpcUrls: ['https://rpc.testnet.arc.network'],
    blockExplorerUrls: ['https://testnet.arcscan.app/'],
    gasToken: 'USDC', // Arc uses USDC for gas
    iconUrl: '/icons/Arc.png',
    iconBackground: '#131720',
  },
  ETHEREUM_SEPOLIA: {
    chainId: '0xaa36a7', // 11155111 in hex
    chainName: 'Sepolia Testnet',
    nativeCurrency: {
      name: 'SepoliaETH',
      symbol: 'ETH',
      decimals: 18,
    },
    rpcUrls: ['https://ethereum-sepolia-rpc.publicnode.com'],
    blockExplorerUrls: ['https://sepolia.etherscan.io/'],
  },
  BASE_SEPOLIA: {
    chainId: '0x14a34', // 84532 in decimal - Base Sepolia
    chainName: 'Base Sepolia',
    nativeCurrency: {
      name: 'ETH',
      symbol: 'ETH',
      decimals: 18,
    },
    rpcUrls: ['https://sepolia.base.org'],
    blockExplorerUrls: ['https://sepolia.basescan.org/'],
  },
}; export const SUPPORTED_CHAINS = [
  NETWORKS.ARC_TESTNET.chainId,
  NETWORKS.ETHEREUM_SEPOLIA.chainId,
  NETWORKS.BASE_SEPOLIA.chainId,
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
      [NETWORKS.BASE_SEPOLIA.chainId]: '0x036CbD53842c5426634e7929541eC2318f3dCF7e', // Official Circle USDC on Base Sepolia
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
      address: '0x3600000000000000000000000000000000000000', // Official Circle USDC on Arc Testnet
      decimals: 6,
      symbol: 'USDC',
    },
  },
  BASE_SEPOLIA: {
    USDC: {
      address: '0x036CbD53842c5426634e7929541eC2318f3dCF7e', // Official Circle USDC on Base Sepolia
      decimals: 6,
      symbol: 'USDC',
    },
  },

  STCK: {
    symbol: 'STCK',
    name: 'Stack Token',
    decimals: 18,
    address: {
      [NETWORKS.ARC_TESTNET.chainId]: '0x21AC76D470E301e2E8f0C1976E9a07f56B363341',
    },
    logo: 'coins',
  },
  BALL: {
    symbol: 'BALL',
    name: 'Ball Token',
    decimals: 18,
    address: {
      [NETWORKS.ARC_TESTNET.chainId]: '0xF2EdfA5fae558a05914dABE9Ba4854aa223D3085',
    },
    logo: 'circle',
  },
  MTB: {
    symbol: 'MTB',
    name: 'MTB Token',
    decimals: 18,
    address: {
      [NETWORKS.ARC_TESTNET.chainId]: '0xD666B6c8Cd8727407a52E69375Ae90009c4b4ce8',
    },
    logo: 'mountain',
  },
  ECR: {
    symbol: 'ECR',
    name: 'ECR Token',
    decimals: 18,
    address: {
      [NETWORKS.ARC_TESTNET.chainId]: '0x257E6639a9Aa53960a65e8552b30d8db01A557F4',
    },
    logo: 'landmark',
  },
};

// Mock token prices (would be fetched from oracles in production)
export const TOKEN_PRICES = {
  USDC: 1,
  // EUR: 1.1,
  STCK: 0.72,
  BALL: 0.22,
  MTB: 0.17,
  ECR: 0.0778,
};

// Contract addresses - Updated with deployed contracts
export const CONTRACTS = {
  [NETWORKS.ARC_TESTNET.chainId]: {
    SWAP_ROUTER: '0x38699BE95B5E73cd91Ec85Fc5482C9436CF996fA', // Custom DEX acts as Router
    SWAP_FACTORY: '0x2ab5A54A25AD34Aaefb8038A1832fAd639d911A5', // Deployed SwapFactory
    BRIDGE: '0x', // Bridge contract (not deployed yet)
    LP_MANAGER: '0x', // LP Manager (not deployed yet)
  },
  [NETWORKS.ETHEREUM_SEPOLIA.chainId]: {
    SWAP_ROUTER: '0x38699BE95B5E73cd91Ec85Fc5482C9436CF996fA', // Custom DEX acts as Router
    SWAP_FACTORY: '0x2ab5A54A25AD34Aaefb8038A1832fAd639d911A5', // Deployed SwapFactory
    BRIDGE: '0x', // Bridge contract (not deployed yet)
    LP_MANAGER: '0x', // LP Manager (not deployed yet)
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