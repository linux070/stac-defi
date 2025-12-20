// Contract addresses for different networks
export const CONTRACT_ADDRESSES = {
  // Sepolia testnet
  sepolia: {
    swap: "0x1234567890123456789012345678901234567890", // Replace with actual deployed address
    router: "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D", // Uniswap V2 Router
    factory: "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f", // Uniswap V2 Factory
  },
  
  // Arc Testnet - Deployed contracts
  arc_testnet: {
    swap: "0x0000000000000000000000000000000000000000", // Not used (router handles swaps)
    router: "0x94d3398e7Eba1B4486B6e80138E820abFcF3Fef8", // SwapRouter deployed address
    factory: "0x2ab5A54A25AD34Aaefb8038A1832fAd639d911A5", // SwapFactory deployed address
  },
  
  // Local development
  localhost: {
    swap: "0x5FbDB2315678afecb367f032d93F642f64180aa3", // Default Hardhat deployment address
    router: "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D", // Uniswap V2 Router
    factory: "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f", // Uniswap V2 Factory
  }
};

// Helper function to get addresses for current network
export const getContractAddresses = (chainId) => {
  const chainIdStr = typeof chainId === 'string' ? chainId : `0x${chainId.toString(16)}`;
  
  // Arc Testnet: 0x4cef52 (5042002)
  if (chainIdStr === '0x4cef52' || chainId === 5042002) {
    return CONTRACT_ADDRESSES.arc_testnet;
  }
  
  // Sepolia: 0xaa36a7 (11155111)
  if (chainIdStr === '0xaa36a7' || chainId === 11155111) {
    return CONTRACT_ADDRESSES.sepolia;
  }
  
  // Default to localhost
  return CONTRACT_ADDRESSES.localhost;
};

// Export default addresses for Arc Testnet (primary network)
export const SWAP_CONTRACT_ADDRESS = CONTRACT_ADDRESSES.arc_testnet.swap;
export const ROUTER_ADDRESS = CONTRACT_ADDRESSES.arc_testnet.router;
export const FACTORY_ADDRESS = CONTRACT_ADDRESSES.arc_testnet.factory;
