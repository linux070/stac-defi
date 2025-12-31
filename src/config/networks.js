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
    rpcUrls: ['https://eth-sepolia.g.alchemy.com/v2/w5SlKrdofEKjcKadoa6KQ'],
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
    EURC: {
      address: '0x08210F9170F89Ab7658F0B5E3fF39b0E03C594D4', // Official Circle EURC on Sepolia
      decimals: 6,
      symbol: 'EURC',
    },
  },
  ARC_TESTNET: {
    USDC: {
      address: '0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d', // Official Circle USDC on Arc Testnet
      decimals: 6,
      symbol: 'USDC',
    },
    EURC: {
      address: '0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a', // Official Circle EURC on Arc Testnet
      decimals: 6,
      symbol: 'EURC',
    },
  },
  BASE_SEPOLIA: {
    USDC: {
      address: '0x036CbD53842c5426634e7929541eC2318f3dCF7e', // Official Circle USDC on Base Sepolia
      decimals: 6,
      symbol: 'USDC',
    },
    EURC: {
      address: '0x808456652fdb597867f38412077A9182bf77359F', // Official Circle EURC on Base Sepolia
      decimals: 6,
      symbol: 'EURC',
    },
  },
  EURC: {
    symbol: 'EURC',
    name: 'Euro Coin',
    decimals: 6,
    address: {
      [NETWORKS.ARC_TESTNET.chainId]: '0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a',
      [NETWORKS.ETHEREUM_SEPOLIA.chainId]: '0x08210F9170F89Ab7658F0B5E3fF39b0E03C594D4',
      [NETWORKS.BASE_SEPOLIA.chainId]: '0x808456652fdb597867f38412077A9182bf77359F', // Official Circle EURC on Base Sepolia
    },
    logo: 'euro-sign', // FAIcon name
  },
};

// Mock token prices (would be fetched from oracles in production)
export const TOKEN_PRICES = {
  USDC: 1,
  EURC: 1.1,
  EUR: 1.1,
};

// Contract addresses - Updated with deployed contracts
export const CONTRACTS = {
  [NETWORKS.ARC_TESTNET.chainId]: {
    SWAP_ROUTER: '0x94d3398e7Eba1B4486B6e80138E820abFcF3Fef8', // Deployed SwapRouter
    SWAP_FACTORY: '0x2ab5A54A25AD34Aaefb8038A1832fAd639d911A5', // Deployed SwapFactory
    BRIDGE: '0x', // Bridge contract (not deployed yet)
    LP_MANAGER: '0x', // LP Manager (not deployed yet)
  },
  [NETWORKS.ETHEREUM_SEPOLIA.chainId]: {
    SWAP_ROUTER: '0x94d3398e7Eba1B4486B6e80138E820abFcF3Fef8', // Deployed SwapRouter
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