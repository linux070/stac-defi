// Network configurations for Arc Testnet and Sepolia

export const NETWORKS = {
  ARC_TESTNET: {
    chainId: '0xCF4B1', // 848689 in decimal - Arc Testnet
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
};

export const SUPPORTED_CHAINS = [
  NETWORKS.ARC_TESTNET.chainId,
  NETWORKS.ETHEREUM_SEPOLIA.chainId,
];

export const DEFAULT_CHAIN = NETWORKS.ARC_TESTNET;

// Token configurations
export const TOKENS = {
  ETH: {
    symbol: 'ETH',
    name: 'Ethereum',
    decimals: 18,
    address: '0x0000000000000000000000000000000000000000', // Native token
    logo: 'ethereum', // FAIcon name
  },
  USDC: {
    symbol: 'USDC',
    name: 'USD Coin',
    decimals: 6,
    address: {
      [NETWORKS.ARC_TESTNET.chainId]: '0x036CbD53842c5426634e7929541eC2318f3dCF7e', // USDC on Arc Testnet
      [NETWORKS.ETHEREUM_SEPOLIA.chainId]: '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238', // USDC on Sepolia
    },
    logo: 'usd-circle', // FAIcon name (Circle USDC)
  },
  EUR: {
    symbol: 'EUR',
    name: 'Euro',
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
  ETH: 2700,
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
