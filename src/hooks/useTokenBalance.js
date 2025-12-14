import { useAccount, useBalance, useChainId } from 'wagmi';
import { NETWORKS, TOKENS } from '../config/networks';

// Official Circle USDC Contract on Sepolia Testnet - using the same addresses from config
const USDC_SEPOLIA_ADDRESS = TOKENS.ETHEREUM_SEPOLIA.USDC.address;
const USDC_ARC_ADDRESS = TOKENS.ARC_TESTNET.USDC.address;

const useTokenBalance = (tokenSymbol) => {
  try {
    const { address, isConnected } = useAccount();
    const chainId = useChainId(); // Returns a number (e.g. 11155111)
    
    // Convert chainId to number if it's a hex string
    const chainIdNumber = typeof chainId === 'string' ? parseInt(chainId, 16) : chainId;

    // Parse Chain IDs from our config (which are in Hex strings) to Numbers
    // Safety check: ensure NETWORKS properties exist before accessing chainId
    const ARC_CHAIN_ID = NETWORKS.ARC_TESTNET ? parseInt(NETWORKS.ARC_TESTNET.chainId, 16) : null;
    const SEPOLIA_CHAIN_ID = NETWORKS.ETHEREUM_SEPOLIA ? parseInt(NETWORKS.ETHEREUM_SEPOLIA.chainId, 16) : null;

    // Safety check: ensure chain IDs are valid
    if (!ARC_CHAIN_ID || !SEPOLIA_CHAIN_ID) {
      return {
        balance: '0.00',
        symbol: tokenSymbol,
        loading: false,
        refetch: () => {},
        error: 'Invalid chain configuration'
      };
    }

    // If not connected, return empty balance
    if (!isConnected || !address) {
      return {
        balance: '0.00',
        symbol: tokenSymbol,
        loading: false,
        refetch: () => {},
        error: null
      };
    }

    // LOGIC: Determine how to fetch the balance based on the network
    // -------------------------------------------------------------
    let fetchConfig = {
      address: address,
    };

    // For Arc Testnet, USDC is fetched using ERC-20 contract (not native currency)
    if (chainIdNumber === ARC_CHAIN_ID && tokenSymbol === 'USDC') {
      // On Arc Testnet, USDC is an ERC-20 token, not native currency
      // We need to specify the token contract address
      fetchConfig.token = USDC_ARC_ADDRESS;
    } 
    // For Sepolia, USDC is an ERC-20 token
    else if (chainIdNumber === SEPOLIA_CHAIN_ID && tokenSymbol === 'USDC') {
      // on Sepolia, USDC is an ERC-20 Token.
      // we MUST pass the specific contract address to find the balance.
      fetchConfig.token = USDC_SEPOLIA_ADDRESS; // USDC Address on Sepolia
    }
    // For unsupported chains or tokens, return zero balance
    else {
      return {
        balance: '0.00',
        symbol: tokenSymbol,
        loading: false,
        refetch: () => {},
        error: null
      };
    }

    // Additional safety check: ensure fetchConfig.address is valid
    if (!fetchConfig.address) {
      return {
        balance: '0.00',
        symbol: tokenSymbol,
        loading: false,
        refetch: () => {},
        error: 'Invalid address'
      };
    }

    // Wagmi hook that fetches the data
    const { data, isLoading, refetch, error } = useBalance(fetchConfig);

    return {
      balance: data?.formatted || '0.00', // returns an output like "10.50"
      symbol: data?.symbol || tokenSymbol,
      loading: isLoading,
      refetch,
      error: error?.message || null
    };
  } catch (error) {
    console.error('Error in useTokenBalance:', error);
    return {
      balance: '0.00',
      symbol: tokenSymbol,
      loading: false,
      refetch: () => {},
      error: error.message || 'Failed to fetch balance'
    };
  }
};
export default useTokenBalance;