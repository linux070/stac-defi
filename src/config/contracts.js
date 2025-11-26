// Contract addresses for different networks
export const CONTRACT_ADDRESSES = {
  // Sepolia testnet
  sepolia: {
    swap: "0x1234567890123456789012345678901234567890", // Replace with actual deployed address
    router: "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D", // Uniswap V2 Router
    factory: "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f", // Uniswap V2 Factory
  },
  
  // Arc Testnet (placeholder - update with actual addresses)
  arc_testnet: {
    swap: "0x0000000000000000000000000000000000000000", // Replace with actual deployed address
    router: "0x0000000000000000000000000000000000000000", // Replace with actual router address
    factory: "0x0000000000000000000000000000000000000000", // Replace with actual factory address
  },
  
  // Local development
  localhost: {
    swap: "0x5FbDB2315678afecb367f032d93F642f64180aa3", // Default Hardhat deployment address
    router: "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D", // Uniswap V2 Router
    factory: "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f", // Uniswap V2 Factory
  }
};

// Export default addresses for current network
// In a real implementation, this would be determined by the current network
export const SWAP_CONTRACT_ADDRESS = CONTRACT_ADDRESSES.localhost.swap;
export const ROUTER_ADDRESS = CONTRACT_ADDRESSES.localhost.router;
export const FACTORY_ADDRESS = CONTRACT_ADDRESSES.localhost.factory;