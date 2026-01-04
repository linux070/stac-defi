// Global constants for the Stac DeFi application

export const APP_NAME = 'Stac DeFi';
export const APP_DESCRIPTION = 'The next generation of blockchain infrastructure on Arc Network';
export const DEX_ADDRESS = "0xf910763933b1af74C45B7E3D947fB14460bD8C40"; // StacDEX Address (From Remix)

// The Official USDC Address on Arc (Do not change)
export const USDC_ADDRESS = "0x3600000000000000000000000000000000000000";

// Your 4 Token Addresses
export const TOKENS = {
    STC: "0x1116a7f6424350691D427fE8eF686550889947D1", // STC Address
    BALL: "0x779665f58a31faD7D7E3700700026053Aea7276C", // BALL Address
    MTB: "0x138f4ffa41dADB7860f429c1d1c2FF04736665e9", // MTB Address
    ECR: "0x39a319F0B9D122ad4F4B714A2e1ebc204AB3Bc43", // ECR Address
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
