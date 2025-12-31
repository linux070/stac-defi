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
import { sepolia as sepoliaChain } from 'viem/chains';

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

// Define Arc Testnet chain
const arcTestnet = {
  id: 5042002,
  name: 'Arc Testnet',
  nativeCurrency: { name: 'USDC', symbol: 'USDC', decimals: 18 },
  rpcUrls: {
    default: {
      http: ['https://rpc.testnet.arc.network'],
      iconUrls: ['https://stac-defi.vercel.app/icons/Arc.png'] // Absolute URL preferred for wallets
    },
    public: {
      http: ['https://rpc.testnet.arc.network'],
      iconUrls: ['https://stac-defi.vercel.app/icons/Arc.png']
    },
  },
  blockExplorers: {
    default: { name: 'ArcScan', url: 'https://testnet.arcscan.app/' },
  },
  testnet: true,
  iconUrl: '/icons/Arc.png',
  iconBackground: '#fff',
};

// Define Sepolia Testnet chain
const sepolia = {
  ...sepoliaChain,
  rpcUrls: {
    ...sepoliaChain.rpcUrls,
    default: { http: ['https://eth-sepolia.g.alchemy.com/v2/w5SlKrdofEKjcKadoa6KQ'] },
  },
  iconUrl: '/icons/eth.png',
  iconBackground: '#484c50',
};

// Define Base Sepolia chain
const baseSepolia = {
  id: 84532,
  name: 'Base Sepolia',
  nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
  rpcUrls: {
    default: {
      http: ['https://sepolia.base.org'],
      iconUrls: ['/icons/base.png']
    },
    public: {
      http: ['https://sepolia.base.org'],
      iconUrls: ['/icons/base.png']
    },
  },
  blockExplorers: {
    default: { name: 'BaseScan', url: 'https://sepolia.basescan.org/' },
  },
  testnet: true,
  iconUrl: '/icons/base.png',
  iconBackground: '#0052ff',
};

const config = getDefaultConfig({
  appName: 'Stac',
  projectId: '7d4d84f37143c02aea3560eedfebb918',
  chains: [arcTestnet, sepolia, baseSepolia],
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