/**
 * @fileoverview Swap Contract Integration Utilities
 * @description Helper functions for interacting with the SwapRouter contract (ethers v6)
 */

import { ethers } from 'ethers';
import { SWAP_ROUTER_ABI, ERC20_ABI } from '../contracts/abis';

/**
 * @notice Creates a deadline timestamp (20 minutes from now)
 * @returns {number} Unix timestamp
 */
export const getDeadline = () => {
  return Math.floor(Date.now() / 1000) + 1200; // 20 minutes
};

/**
 * @notice Validates deadline is within acceptable range
 * @param {number} deadline Unix timestamp
 * @returns {boolean} True if valid
 */
export const validateDeadline = (deadline) => {
  const now = Math.floor(Date.now() / 1000);
  const minDeadline = now + 300; // 5 minutes minimum
  const maxDeadline = now + 3600; // 1 hour maximum
  return deadline >= minDeadline && deadline <= maxDeadline;
};

/**
 * @notice Calculates minimum received amount based on slippage
 * @param {string} expectedAmount Expected output amount
 * @param {number} slippageBps Slippage in basis points (0.5% = 50, 1% = 100)
 * @returns {string} Minimum received amount
 */
export const calculateMinReceived = (expectedAmount, slippageBps) => {
  const slippageMultiplier = (10000 - slippageBps) / 10000;
  const minAmount = parseFloat(expectedAmount) * slippageMultiplier;
  return minAmount.toFixed(6);
};

/**
 * @notice Gets swap quote from contract
 * @param {ethers.Contract} routerContract SwapRouter contract instance
 * @param {bigint} amountIn Input amount (in token decimals)
 * @param {string[]} path Array of token addresses
 * @returns {Promise<bigint[]>} Array of amounts for each step
 */
export const getSwapQuote = async (routerContract, amountIn, path) => {
  try {
    const amounts = await routerContract.getAmountsOut(amountIn, path);
    return amounts;
  } catch (error) {
    console.error('Error getting swap quote:', error);
    throw new Error('Failed to get swap quote. Check liquidity and try again.');
  }
};

/**
 * @notice Executes a token swap
 * @param {ethers.Contract} routerContract SwapRouter contract instance
 * @param {bigint} amountIn Input amount (in token decimals)
 * @param {bigint} amountOutMin Minimum output amount (in token decimals)
 * @param {string[]} path Array of token addresses
 * @param {string} recipient Address to receive output tokens
 * @param {number} deadline Unix timestamp deadline
 * @param {ethers.Signer} signer Transaction signer
 * @returns {Promise<ethers.ContractTransactionResponse>} Transaction object
 */
export const executeSwap = async (
  routerContract,
  amountIn,
  amountOutMin,
  path,
  recipient,
  deadline,
  signer
) => {
  try {
    // Validate inputs
    if (!path || path.length < 2) {
      throw new Error('Invalid swap path');
    }
    if (path[0] === path[path.length - 1]) {
      throw new Error('Cannot swap identical tokens');
    }
    if (!validateDeadline(deadline)) {
      throw new Error('Invalid deadline');
    }

    // Execute swap
    // Estimate gas limit for better transaction reliability
    let gasLimit = 500000n;
    try {
      gasLimit = await routerContract.swapExactTokensForTokens.estimateGas(
        amountIn,
        amountOutMin,
        path,
        recipient,
        deadline,
        { from: await signer.getAddress() }
      );
      // Add 20% buffer to estimated gas
      gasLimit = (gasLimit * 120n) / 100n;
    } catch (gasError) {
      console.warn('Could not estimate gas, using default:', gasError);
    }

    const tx = await routerContract
      .connect(signer)
      .swapExactTokensForTokens(
        amountIn,
        amountOutMin,
        path,
        recipient,
        deadline,
        {
          gasLimit: gasLimit,
        }
      );

    return tx;
  } catch (error) {
    console.error('Error executing swap:', error);
    if (error.reason) {
      throw new Error(error.reason);
    }
    throw new Error('Swap transaction failed. Please try again.');
  }
};

/**
 * @notice Checks if token approval is needed
 * @param {ethers.Contract} tokenContract ERC20 token contract
 * @param {string} owner Token owner address
 * @param {string} spender Spender address (router)
 * @param {bigint} amount Required amount
 * @returns {Promise<boolean>} True if approval needed
 */
export const checkApproval = async (tokenContract, owner, spender, amount) => {
  try {
    const allowance = await tokenContract.allowance(owner, spender);
    // In ethers v6, BigNumber is replaced with native bigint
    return allowance < amount;
  } catch (error) {
    console.error('Error checking approval:', error);
    return true; // Assume approval needed on error
  }
};

/**
 * @notice Approves token spending
 * @param {ethers.Contract} tokenContract ERC20 token contract
 * @param {string} spender Spender address (router)
 * @param {bigint} amount Amount to approve (use MaxUint256 for infinite)
 * @param {ethers.Signer} signer Transaction signer
 * @returns {Promise<ethers.ContractTransactionResponse>} Transaction object
 */
export const approveToken = async (tokenContract, spender, amount, signer) => {
  try {
    // Use MaxUint256 for infinite approval to avoid multiple approvals
    const maxAmount = ethers.MaxUint256;
    const tx = await tokenContract.connect(signer).approve(spender, maxAmount);
    return tx;
  } catch (error) {
    console.error('Error approving token:', error);
    throw new Error('Token approval failed. Please try again.');
  }
};

/**
 * @notice Formats token amount to contract decimals
 * @param {string} amount Human-readable amount
 * @param {number} decimals Token decimals
 * @returns {bigint} Formatted amount
 */
export const formatTokenAmount = (amount, decimals) => {
  if (!amount || isNaN(parseFloat(amount))) {
    return 0n;
  }
  try {
    return ethers.parseUnits(amount, decimals);
  } catch (error) {
    console.error('Error formatting token amount:', error);
    return 0n;
  }
};

/**
 * @notice Formats token amount from contract decimals
 * @param {bigint} amount Contract amount
 * @param {number} decimals Token decimals
 * @returns {string} Human-readable amount
 */
export const parseTokenAmount = (amount, decimals) => {
  if (!amount) {
    return '0.00';
  }
  try {
    return ethers.formatUnits(amount, decimals);
  } catch (error) {
    console.error('Error parsing token amount:', error);
    return '0.00';
  }
};

/**
 * @notice Creates a swap path array
 * @param {string} tokenIn Input token address
 * @param {string} tokenOut Output token address
 * @param {string} intermediateToken Optional intermediate token for multi-hop
 * @returns {string[]} Swap path array
 */
export const createSwapPath = (tokenIn, tokenOut, intermediateToken = null) => {
  if (intermediateToken) {
    return [tokenIn, intermediateToken, tokenOut];
  }
  return [tokenIn, tokenOut];
};

/**
 * @notice Estimates gas for swap transaction
 * @param {ethers.Contract} routerContract SwapRouter contract
 * @param {bigint} amountIn Input amount
 * @param {bigint} amountOutMin Minimum output
 * @param {string[]} path Swap path
 * @param {string} recipient Recipient address
 * @param {number} deadline Deadline timestamp
 * @param {string} from Sender address
 * @returns {Promise<bigint>} Estimated gas
 */
export const estimateSwapGas = async (
  routerContract,
  amountIn,
  amountOutMin,
  path,
  recipient,
  deadline,
  from
) => {
  try {
    const gasEstimate = await routerContract.swapExactTokensForTokens.estimateGas(
      amountIn,
      amountOutMin,
      path,
      recipient,
      deadline,
      { from }
    );
    return gasEstimate;
  } catch (error) {
    console.error('Error estimating gas:', error);
    // Return a safe default (v6 uses bigint)
    return 500000n;
  }
};

/**
 * @notice Gets contract instance
 * @param {string} address Contract address
 * @param {ethers.Provider} provider Ethers provider
 * @returns {ethers.Contract} Contract instance
 */
export const getSwapRouterContract = (address, provider) => {
  return new ethers.Contract(address, SWAP_ROUTER_ABI, provider);
};

/**
 * @notice Gets ERC20 token contract instance
 * @param {string} address Token address
 * @param {ethers.Provider} provider Ethers provider
 * @returns {ethers.Contract} Token contract instance
 */
export const getERC20Contract = (address, provider) => {
  return new ethers.Contract(address, ERC20_ABI, provider);
};

/**
 * @notice Validates swap parameters before execution
 * @param {bigint} amountIn Input amount
 * @param {bigint} amountOutMin Minimum output
 * @param {string[]} path Swap path
 * @param {string} recipient Recipient address
 * @param {number} deadline Deadline timestamp
 * @returns {Object} Validation result
 */
export const validateSwapParams = (amountIn, amountOutMin, path, recipient, deadline) => {
  const errors = [];

  if (!amountIn || amountIn <= 0n) {
    errors.push('Invalid input amount');
  }

  if (!amountOutMin || amountOutMin <= 0n) {
    errors.push('Invalid minimum output amount');
  }

  if (!path || path.length < 2) {
    errors.push('Invalid swap path');
  }

  if (path && path[0] === path[path.length - 1]) {
    errors.push('Cannot swap identical tokens');
  }

  if (!recipient || !ethers.isAddress(recipient)) {
    errors.push('Invalid recipient address');
  }

  if (!validateDeadline(deadline)) {
    errors.push('Invalid deadline');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * @notice Gets ethers provider and signer from window.ethereum
 * @returns {Promise<{provider: ethers.BrowserProvider, signer: ethers.JsonRpcSigner}>}
 */
export const getEthersProvider = async () => {
  if (!window.ethereum) {
    throw new Error('No ethereum provider found. Please install MetaMask or another Web3 wallet.');
  }

  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();

  return { provider, signer };
};

/**
 * @notice Checks if pool has sufficient liquidity for swap
 * @param {ethers.Contract} routerContract SwapRouter contract instance
 * @param {string} tokenIn Input token address
 * @param {string} tokenOut Output token address
 * @returns {Promise<{hasLiquidity: boolean, reserveIn: bigint, reserveOut: bigint}>}
 */
export const checkPoolLiquidity = async (routerContract, tokenIn, tokenOut) => {
  try {
    const [reserveIn, reserveOut] = await routerContract.getReserves(tokenIn, tokenOut);
    return {
      hasLiquidity: reserveIn > 0n && reserveOut > 0n,
      reserveIn,
      reserveOut,
    };
  } catch (error) {
    console.error('Error checking pool liquidity:', error);
    // If getReserves fails, pool likely doesn't exist
    return {
      hasLiquidity: false,
      reserveIn: 0n,
      reserveOut: 0n,
    };
  }
};

export default {
  getDeadline,
  validateDeadline,
  calculateMinReceived,
  getSwapQuote,
  executeSwap,
  checkApproval,
  approveToken,
  formatTokenAmount,
  parseTokenAmount,
  createSwapPath,
  estimateSwapGas,
  getSwapRouterContract,
  getERC20Contract,
  validateSwapParams,
  getEthersProvider,
};
