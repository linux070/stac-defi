// Global constants for the Stac DeFi application

export const APP_NAME = 'Stac';
export const APP_DESCRIPTION = 'Experience direct on-chain interactions, seamless swapping, and cross-chain bridging, all powered by the Arc App Kit.';
export const APP_KIT_ADDRESS = "0x3200000000000000000000000000000000000000"; // App Kit / Token Messenger on Arc

// The Official USDC Address on Arc (Do not change)
export const USDC_ADDRESS = "0x3600000000000000000000000000000000000000";

// Developer Fee Recipient
export const DEVELOPER_FEE_RECIPIENT = "0x7fdfEb80A18BC30604090DeFB5Bb53206e7E2c4a";




export const DECIMALS = {
    USDC: 6,
    EURC: 6,
    OTHERS: 18,
};

// Default Transaction Settings
export const DEFAULT_SLIPPAGE = 0.5; // 0.5%
export const MAX_SLIPPAGE = 50; // 50%
export const DEFAULT_DEADLINE_MINUTES = 20;

// Chain IDs (Decimal)
export const CHAINS = {
    ARC_TESTNET: 5042002,
    ETHEREUM_SEPOLIA: 11155111,
    BASE_SEPOLIA: 84532,
};

// Gas Estimates
export const GAS_LIMITS = {
    SWAP: 250000n,
    APPROVE: 60000n,
    BRIDGE: 300000n,
};

// UI Constants
export const REFRESH_INTERVAL = 30000; // 30 seconds
export const TOAST_DURATION = 5000; // 5 seconds

