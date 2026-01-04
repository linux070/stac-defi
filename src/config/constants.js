// Global constants for the Stac DeFi application

export const APP_NAME = 'Stac DeFi';
export const APP_DESCRIPTION = 'The next generation of blockchain infrastructure on Arc Network';
export const DEX_ADDRESS = "0x38699BE95B5E73cd91Ec85Fc5482C9436CF996fA"; // FixedPriceDEX Address (From Remix)

// The Official USDC Address on Arc (Do not change)
export const USDC_ADDRESS = "0x3600000000000000000000000000000000000000";

// Your 4 Token Addresses
export const TOKENS = {
    STCK: "0x21AC76D470E301e2E8f0C1976E9a07f56B363341", // STCK Address
    BALL: "0xF2EdfA5fae558a05914dABE9Ba4854aa223D3085", // BALL Address
    MTB: "0xD666B6c8Cd8727407a52E69375Ae90009c4b4ce8", // MTB Address
    ECR: "0x257E6639a9Aa53960a65e8552b30d8db01A557F4", // ECR Address
};

export const BATCH_FAUCET_ADDRESS = "0x5e0A1e0a40b9Fb56D14eDaa3DFcfD70C556f54a7";

// Faucet amounts (in token units, not wei)
export const FAUCET_AMOUNTS = {
    STCK: 100,
    BALL: 100,
    MTB: 100,
    ECR: 100,
};

export const DECIMALS = {
    USDC: 6,
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

// Official Links
// export const LINKS = {
//     DOCS: 'https://docs.stac.finance',
//     TWITTER: 'https://twitter.com/stac_finance',
//     GITHUB: 'https://github.com/stac-finance',
//     DISCORD: 'https://discord.gg/stac',
// };
