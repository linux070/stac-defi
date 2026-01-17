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
import Jazzicon, { jsNumberForAddress } from 'react-jazzicon';

// Define Custom Avatar component for project-wide consistency
const CustomAvatar = ({ address, ensImage, size }) => {
  return ensImage ? (
    <img
      src={ensImage}
      width={size}
      height={size}
      style={{ borderRadius: 999 }}
    />
  ) : (
    <Jazzicon diameter={size} seed={jsNumberForAddress(address)} />
  );
};

// Define Arc Testnet chain
const arcTestnet = {
  id: 5042002,
  name: 'Arc Testnet',
  nativeCurrency: { name: 'USDC', symbol: 'USDC', decimals: 18 },
  rpcUrls: {
    default: {
      http: [import.meta.env.VITE_ARC_RPC_URL],
      iconUrls: ['https://stac-defi.vercel.app/icons/Arc.png'] // Absolute URL preferred for wallets
    },
    public: {
      http: [import.meta.env.VITE_ARC_RPC_URL],
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
    default: { http: [import.meta.env.VITE_SEPOLIA_RPC_URL] },
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
      http: [import.meta.env.VITE_BASE_SEPOLIA_RPC_URL],
      iconUrls: ['/icons/base.png']
    },
    public: {
      http: [import.meta.env.VITE_BASE_SEPOLIA_RPC_URL],
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

import GlobalErrorBoundary from './components/GlobalErrorBoundary';

const config = getDefaultConfig({
  appName: 'Stac',
  projectId: import.meta.env.VITE_PROJECT_ID,
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

const rootElement = document.getElementById('root');
if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <GlobalErrorBoundary>
        <WagmiProvider config={config}>
          <QueryClientProvider client={queryClient}>
            <RainbowKitProvider avatar={CustomAvatar}>
              <App />
            </RainbowKitProvider>
          </QueryClientProvider>
        </WagmiProvider>
      </GlobalErrorBoundary>
    </React.StrictMode>
  );
}