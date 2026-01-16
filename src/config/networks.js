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

  STC: {
    symbol: 'STC',
    name: 'Stack Token',
    decimals: 18,
    address: {
      [NETWORKS.ARC_TESTNET.chainId]: '0x1116a7f6424350691D427fE8eF686550889947D1',
    },
    logo: 'coins',
  },
  BALL: {
    symbol: 'BALL',
    name: 'Ball Token',
    decimals: 18,
    address: {
      [NETWORKS.ARC_TESTNET.chainId]: '0x779665f58a31faD7D7E3700700026053Aea7276C',
    },
    logo: 'circle',
  },
  MTB: {
    symbol: 'MTB',
    name: 'MTB Token',
    decimals: 18,
    address: {
      [NETWORKS.ARC_TESTNET.chainId]: '0x138f4ffa41dADB7860f429c1d1c2FF04736665e9',
    },
    logo: 'mountain',
  },
  ECR: {
    symbol: 'ECR',
    name: 'ECR Token',
    decimals: 18,
    address: {
      [NETWORKS.ARC_TESTNET.chainId]: '0x39a319F0B9D122ad4F4B714A2e1ebc204AB3Bc43',
    },
    logo: 'landmark',
  },
};

// Mock token prices (would be fetched from oracles in production)
export const TOKEN_PRICES = {
  USDC: 1,
  // EUR: 1.1,
  STC: 0.72,
  BALL: 0.22,
  MTB: 0.17,
  ECR: 0.0778,
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
      await provider.request({
        method: 'wallet_addEthereumChain',
        params: [networkConfig],
      });
    } else {
      throw switchError;
    }
  }
};