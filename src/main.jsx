import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './polyfills.js'
import './index.css'
import './i18n/config.js';
import '@rainbow-me/rainbowkit/styles.css';
import { getDefaultConfig, RainbowKitProvider } from '@rainbow-me/rainbowkit';
import { WagmiProvider } from 'wagmi';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';
import { defineChain } from 'viem';

// Import wallets
import { 
  metaMaskWallet, 
  walletConnectWallet, 
  coinbaseWallet, 
  rabbyWallet,
  safeWallet,
  rainbowWallet,
  baseAccount,
} from '@rainbow-me/rainbowkit/wallets';

// Define Arc Testnet chain - Fixed to match config/networks.js
const arcTestnet = defineChain({
  id: 5042002, // 0x4cef52
  name: 'Arc Testnet',
  nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://rpc-testnet.arc.network'] },
  },
  blockExplorers: {
    default: { name: 'ArcScan', url: 'https://testnet.arcscan.app/' },
  },
  testnet: true,
});// Define Sepolia Testnet chain
const sepolia = defineChain({
  id: 11155111,
  name: 'Sepolia',
  nativeCurrency: { name: 'SepoliaETH', symbol: 'ETH', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://sepolia.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161'] },
  },
  blockExplorers: {
    default: { name: 'Sepolia Explorer', url: 'https://sepolia.etherscan.io/' },
  },
  testnet: true,
});

const config = getDefaultConfig({
  appName: 'Stac',
  projectId: '7d4d84f37143c02aea3560eedfebb918',
  chains: [arcTestnet, sepolia],
  ssr: true,
  wallets: [
    {
      groupName: 'Supported Wallets',
      wallets: [
        metaMaskWallet,
        walletConnectWallet,
        coinbaseWallet,
        rabbyWallet,
        safeWallet,
        rainbowWallet,
        baseAccount
      ]
    }
  ]
});

const queryClient = new QueryClient();

// Add error boundary
try {
  const rootElement = document.getElementById('root');
  if (!rootElement) {
    console.error('Failed to find the root element');
  } else {
    ReactDOM.createRoot(rootElement).render(
      <React.StrictMode>
        <WagmiProvider config={config}>
          <QueryClientProvider client={queryClient}>
            <RainbowKitProvider>
              <App />
            </RainbowKitProvider>
          </QueryClientProvider>
        </WagmiProvider>
      </React.StrictMode>,
    )
  }
} catch (error) {
  console.error('Error rendering the application:', error);
  document.getElementById('root').innerHTML = `
    <div style="padding: 20px; text-align: center; color: #ef4444;">
      <h1>Error Loading Application</h1>
      <p>${error.message}</p>
      <p>Please check the console for more details.</p>
    </div>
  `;
}