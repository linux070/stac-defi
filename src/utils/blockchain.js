import { ethers } from 'ethers';
import { TOKENS, TOKEN_PRICES } from '../config/networks';

// Sanitize numeric input with comprehensive validation
export const sanitizeInput = (value) => {
  if (typeof value !== 'string') return '';

  // Replace commas with dots to support different keyboard layouts
  let sanitized = value.replace(/,/g, '.');

  // Check if the value matches the required pattern ^[0-9]*[.,]?[0-9]*$
  const validPattern = /^[0-9]*\.?[0-9]*$/;
  if (!validPattern.test(sanitized) && sanitized !== '') {
    return ''; // Return empty string if pattern doesn't match
  }

  // Prevent multiple decimal points
  const parts = sanitized.split('.');
  if (parts.length > 2) {
    sanitized = parts[0] + '.' + parts.slice(1).join('');
  }

  // Limit decimal places to 18 (max for most tokens)
  if (parts[1] && parts[1].length > 18) {
    sanitized = parts[0] + '.' + parts[1].slice(0, 18);
  }

  // Prevent leading zeros (except for decimals like 0.5)
  if (sanitized.length > 1 && sanitized[0] === '0' && sanitized[1] !== '.') {
    sanitized = sanitized.replace(/^0+/, '');
  }

  return sanitized;
};

// Validate amount with comprehensive checks
export const validateAmount = (amount, balance = null, minAmount = 0.000001) => {
  // Check if amount is a valid number
  const num = parseFloat(amount);

  if (isNaN(num)) {
    throw new Error('Please enter a valid amount');
  }

  if (num <= 0) {
    throw new Error('Amount must be greater than zero');
  }

  if (num < minAmount) {
    throw new Error(`Amount must be at least ${minAmount}`);
  }

  // Check if user has sufficient balance
  if (balance !== null) {
    const bal = parseFloat(balance);
    if (num > bal) {
      throw new Error('Insufficient balance');
    }
  }

  return true;
};

// Format currency with dollar sign
export const formatCurrency = (value, decimals = 2) => {
  if (value === null || value === undefined) return '$0.00';

  const num = parseFloat(value);
  if (isNaN(num)) return '$0.00';

  return '$' + num.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
};

// Format token amounts with appropriate decimals
export const formatTokenAmount = (amount, decimals = 6) => {
  if (!amount) return '0.00';

  const num = parseFloat(amount);
  if (isNaN(num)) return '0.00';

  // For very small amounts, show scientific notation
  if (num > 0 && num < 0.000001) {
    return num.toExponential(6);
  }

  return num.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: decimals
  });
};



// Get filtered token list based on network
export const getFilteredTokens = (tokenList, chainId) => {
  // Since ETH is no longer in the TOKENS list, we don't need to filter it out
  // Return all tokens as they are already filtered
  return tokenList;
};

// Validate Ethereum address with checksum
export const validateAddress = (address) => {
  if (!address || typeof address !== 'string') {
    throw new Error('Invalid address format');
  }

  if (!ethers.isAddress(address)) {
    throw new Error('Invalid Ethereum address');
  }

  return true;
};

// Validate slippage tolerance
export const validateSlippage = (slippage) => {
  const num = parseFloat(slippage);

  if (isNaN(num)) {
    throw new Error('Invalid slippage value');
  }

  if (num < 0.01) {
    throw new Error('Slippage must be at least 0.01%');
  }

  if (num > 50) {
    throw new Error('Slippage cannot exceed 50%');
  }

  if (num > 5) {
    return {
      isValid: true,
      warning: 'High slippage! You may receive significantly less tokens.'
    };
  }

  return { isValid: true, warning: null };
};

// Calculate swap quote
export const calculateSwapQuote = (fromToken, toToken, amount, slippage = 0.5) => {
  if (!amount || parseFloat(amount) <= 0) {
    return null;
  }

  const inputAmount = parseFloat(amount);
  const fromPrice = TOKEN_PRICES[fromToken];
  const toPrice = TOKEN_PRICES[toToken];

  // Determine route
  const route = fromToken === toToken ? [fromToken] :
    fromToken === 'ETH' && toToken === 'USDC' ? ['ETH', 'WETH', 'USDC'] :
      fromToken === 'USDC' && toToken === 'ETH' ? ['USDC', 'WETH', 'ETH'] :
        [fromToken, 'ETH', toToken];

  // Calculate output
  const valueInUSD = inputAmount * fromPrice;
  const expectedOutput = valueInUSD / toPrice;

  // Apply fees (0.3% trading fee)
  const outputWithFees = expectedOutput * 0.997;

  // Calculate price impact (simplified)
  const priceImpact = inputAmount > 100 ? 0.5 : inputAmount > 10 ? 0.2 : 0.1;

  // Calculate minimum received based on slippage
  const minReceived = outputWithFees * (1 - slippage / 100);

  return {
    expectedOutput: outputWithFees.toFixed(6),
    minReceived: minReceived.toFixed(6),
    priceImpact: priceImpact.toFixed(2),
    route: route,
    exchangeRate: (outputWithFees / inputAmount).toFixed(6),
    tradingFee: (inputAmount * fromPrice * 0.003).toFixed(2),
    gasFee: '0.50', // Mock gas fee in USDC
  };
};

// Format address
export const formatAddress = (address) => {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

// Format number with commas
export const formatNumber = (num) => {
  return new Intl.NumberFormat('en-US').format(num);
};

// Copy to clipboard
export const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    console.error('Failed to copy:', err);
    return false;
  }
};

// Get token balance
export const getTokenBalance = async (provider, tokenAddress, walletAddress) => {
  try {
    if (tokenAddress === '0x0000000000000000000000000000000000000000') {
      // Native token (ETH)
      const balance = await provider.getBalance(walletAddress);
      return ethers.formatEther(balance);
    } else {
      // ERC-20 token
      const tokenContract = new ethers.Contract(
        tokenAddress,
        ['function balanceOf(address) view returns (uint256)'],
        provider
      );
      const balance = await tokenContract.balanceOf(walletAddress);

      // Look up decimals from config
      let decimals = 18;
      const foundToken = Object.values(TOKENS).find(t =>
        (t.address && typeof t.address === 'string' && t.address.toLowerCase() === tokenAddress.toLowerCase()) ||
        (t.address && typeof t.address === 'object' && Object.values(t.address).some(addr => String(addr).toLowerCase() === tokenAddress.toLowerCase()))
      );

      if (foundToken) {
        decimals = foundToken.decimals || 18;
      }

      return ethers.formatUnits(balance, decimals);
    }
  } catch (err) {
    console.error('Error fetching token balance:', err);
    return '0';
  }
};

// Approve token spending
export const approveToken = async (signer, tokenAddress, spenderAddress, amount) => {
  try {
    const tokenContract = new ethers.Contract(
      tokenAddress,
      ['function approve(address spender, uint256 amount) returns (bool)'],
      signer
    );

    // Look up decimals appropriately
    let decimals = 18;
    const foundToken = Object.values(TOKENS).find(t =>
      (t.address && typeof t.address === 'string' && t.address.toLowerCase() === tokenAddress.toLowerCase()) ||
      (t.address && typeof t.address === 'object' && Object.values(t.address).some(addr => String(addr).toLowerCase() === tokenAddress.toLowerCase()))
    );

    if (foundToken) {
      decimals = foundToken.decimals || 18;
    }

    const tx = await tokenContract.approve(spenderAddress, ethers.parseUnits(amount, decimals));
    await tx.wait();
    return tx.hash;
  } catch (err) {
    console.error('Error approving token:', err);
    throw err;
  }
};

// Get transaction status
export const getTransactionStatus = (receipt) => {
  if (!receipt) return 'pending';
  return receipt.status === 1 ? 'success' : 'failed';
};

// Calculate time ago
export const timeAgo = (timestamp) => {
  const now = Date.now();
  const diff = now - new Date(timestamp).getTime();

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  if (minutes > 0) return `${minutes}m ago`;
  return `${seconds}s ago`;
};

// Validate Ethereum address
export const isValidAddress = (address) => {
  return ethers.isAddress(address);
};

// Get explorer URL
export const getExplorerUrl = (hash, chainId, type = 'tx') => {
  // Normalize chainId to hex string with 0x prefix
  let chainIdHex = chainId;
  if (typeof chainId === 'number') {
    chainIdHex = '0x' + chainId.toString(16);
  } else if (typeof chainId === 'string' && !chainId.startsWith('0x')) {
    // Check if it's a decimal string
    const decimal = parseInt(chainId, 10);
    if (!isNaN(decimal)) {
      chainIdHex = '0x' + decimal.toString(16);
    }
  }

  // Normalize to lowercase for comparison
  const normalizedChainId = chainIdHex?.toLowerCase();

  const explorers = {
    '0x4cef52': 'https://testnet.arcscan.app', // Arc Testnet (5042002)
    '0xaa36a7': 'https://sepolia.etherscan.io', // Sepolia (11155111)
    '0x14a34': 'https://sepolia.basescan.org', // Base Sepolia (84532)
  };

  const baseUrl = explorers[normalizedChainId] || explorers['0xaa36a7'];
  return `${baseUrl}/${type}/${hash}`;
};