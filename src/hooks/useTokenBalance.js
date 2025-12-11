import { useAccount, useBalance, useChainId } from 'wagmi';
import { NETWORKS } from '../config/networks';

// Official Circle USDC Contract on Sepolia Testnet
const USDC_SEPOLIA_ADDRESS = '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238';

const useTokenBalance = (tokenSymbol) => {
  const { address, isConnected } = useAccount();
  const chainId = useChainId(); // Returns a number (e.g. 11155111)

  // Safety check: return early if not connected or chainId is not available
  if (!isConnected || !chainId || !NETWORKS) {
    return {
      balance: '0.00',
      symbol: tokenSymbol,
      loading: false,
      refetch: () => {}
    };
  }

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
      refetch: () => {}
    };
  }

  // LOGIC: Determine how to fetch the balance based on the network
  // -------------------------------------------------------------
  let fetchConfig = {
    address: address,
  };

  if (chainId === ARC_CHAIN_ID) {
    // 1. ON ARC: USDC is the "Native Token" (like ETH on Ethereum).
    // We do NOT pass a token address. We just ask for the native balance.
    // fetchConfig stays as { address }
  } 
  else if (chainId === SEPOLIA_CHAIN_ID && tokenSymbol === 'USDC') {
    // 2. ON SEPOLIA: USDC is an ERC-20 Token.
    // We MUST pass the specific contract address to find the balance.
    fetchConfig.token = USDC_SEPOLIA_ADDRESS;
  }

  // Wagmi hook that fetches the data
  const { data, isLoading, refetch } = useBalance(fetchConfig);

  return {
    balance: data?.formatted || '0.00', // Returns string like "10.50"
    symbol: data?.symbol,
    loading: isLoading,
    refetch
  };
};

export default useTokenBalance;