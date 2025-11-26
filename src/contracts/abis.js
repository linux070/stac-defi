// Secure Bridge Contract ABIs with Reentrancy Protection
// Based on OpenZeppelin ReentrancyGuard pattern

export const BRIDGE_ABI = [
  // Events
  'event BridgeInitiated(bytes32 indexed bridgeId, address indexed sender, address indexed recipient, address token, uint256 amount, uint256 sourceChain, uint256 destChain, uint256 timestamp)',
  'event BridgeCompleted(bytes32 indexed bridgeId, address indexed recipient, address token, uint256 amount, uint256 timestamp)',
  'event BridgeFailed(bytes32 indexed bridgeId, string reason, uint256 timestamp)',
  'event BridgeCancelled(bytes32 indexed bridgeId, address indexed sender, uint256 timestamp)',
  
  // Read functions
  'function getBridgeStatus(bytes32 bridgeId) view returns (uint8)', // 0: None, 1: Pending, 2: Completed, 3: Failed, 4: Cancelled
  'function getBridgeInfo(bytes32 bridgeId) view returns (address sender, address recipient, address token, uint256 amount, uint256 sourceChain, uint256 destChain, uint8 status, uint256 timestamp)',
  'function minBridgeAmount(address token) view returns (uint256)',
  'function maxBridgeAmount(address token) view returns (uint256)',
  'function bridgeFee() view returns (uint256)', // Fee in basis points (1% = 100)
  'function estimateBridgeFee(address token, uint256 amount) view returns (uint256)',
  
  // Write functions (protected by ReentrancyGuard)
  'function initiateBridge(address token, uint256 amount, uint256 destChain, address recipient) payable returns (bytes32 bridgeId)',
  'function completeBridge(bytes32 bridgeId, bytes memory proof, bytes[] memory signatures) returns (bool)',
  'function cancelBridge(bytes32 bridgeId) returns (bool)',
  
  // Admin functions
  'function pause() returns (bool)',
  'function unpause() returns (bool)',
  'function isPaused() view returns (bool)',
];

export const SWAP_ROUTER_ABI = [
  // Events
  'event Swap(address indexed sender, uint256 amountIn, uint256 amountOut, address[] path, address indexed to, uint256 timestamp)',
  
  // Read functions
  'function getAmountsOut(uint256 amountIn, address[] path) view returns (uint256[] amounts)',
  'function getAmountsIn(uint256 amountOut, address[] path) view returns (uint256[] amounts)',
  'function quote(uint256 amountA, uint256 reserveA, uint256 reserveB) pure returns (uint256 amountB)',
  
  // Write functions (protected by ReentrancyGuard)
  'function swapExactTokensForTokens(uint256 amountIn, uint256 amountOutMin, address[] path, address to, uint256 deadline) returns (uint256[] amounts)',
  'function swapTokensForExactTokens(uint256 amountOut, uint256 amountInMax, address[] path, address to, uint256 deadline) returns (uint256[] amounts)',
  'function swapExactETHForTokens(uint256 amountOutMin, address[] path, address to, uint256 deadline) payable returns (uint256[] amounts)',
  'function swapTokensForExactETH(uint256 amountOut, uint256 amountInMax, address[] path, address to, uint256 deadline) returns (uint256[] amounts)',
];

export const LP_MANAGER_ABI = [
  // Events
  'event LiquidityAdded(address indexed provider, address indexed tokenA, address indexed tokenB, uint256 amountA, uint256 amountB, uint256 liquidity, uint256 timestamp)',
  'event LiquidityRemoved(address indexed provider, address indexed tokenA, address indexed tokenB, uint256 amountA, uint256 amountB, uint256 liquidity, uint256 timestamp)',
  
  // Read functions
  'function getUserPositions(address user) view returns (tuple(address tokenA, address tokenB, uint256 liquidity, uint256 share)[] positions)',
  'function getPoolInfo(address tokenA, address tokenB) view returns (uint256 reserveA, uint256 reserveB, uint256 totalLiquidity)',
  
  // Write functions (protected by ReentrancyGuard)
  'function addLiquidity(address tokenA, address tokenB, uint256 amountADesired, uint256 amountBDesired, uint256 amountAMin, uint256 amountBMin, address to, uint256 deadline) returns (uint256 amountA, uint256 amountB, uint256 liquidity)',
  'function removeLiquidity(address tokenA, address tokenB, uint256 liquidity, uint256 amountAMin, uint256 amountBMin, address to, uint256 deadline) returns (uint256 amountA, uint256 amountB)',
];

// Security utilities
export const SECURITY_CHECKS = {
  // Validate transaction deadline (must be within 20 minutes)
  getDeadline: () => {
    return Math.floor(Date.now() / 1000) + 1200; // 20 minutes from now
  },
  
  // Validate amount is within safe limits
  validateBridgeAmount: (amount, minAmount, maxAmount) => {
    const amt = parseFloat(amount);
    if (amt < parseFloat(minAmount)) {
      throw new Error(`Amount below minimum bridge limit of ${minAmount}`);
    }
    if (amt > parseFloat(maxAmount)) {
      throw new Error(`Amount exceeds maximum bridge limit of ${maxAmount}`);
    }
    return true;
  },
  
  // Calculate safe slippage amount
  calculateMinReceived: (expectedAmount, slippageBps) => {
    // slippageBps in basis points (0.5% = 50, 1% = 100)
    const slippageMultiplier = (10000 - slippageBps) / 10000;
    return (parseFloat(expectedAmount) * slippageMultiplier).toFixed(6);
  },
};

export default {
  BRIDGE_ABI,
  SWAP_ROUTER_ABI,
  LP_MANAGER_ABI,
  SECURITY_CHECKS,
};
