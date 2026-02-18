# Stac | Arc Network dApp

A premium, high-performance decentralized application (dApp) for seamless asset management across the Arc Network and surrounding Ethereum ecosystems. Built with a focus on visual excellence, deterministic performance, and a mobile-first user experience.

## Overview

Stac serves as the primary interface for the Arc Network, offering users a unified environment for cross-chain bridging, token swapping, and transaction tracking. The dApp is engineered to bridge the gap between complex blockchain protocols and professional-grade user interfaces.

## Core Features

### 1. Cross-Chain Bridge
* **Circle CCTP Integration**: Secure and efficient bridging of USDC across supported networks (Arc, Sepolia, Base Sepolia).
* **Real-time Monitoring**: Millisecond-accurate gas estimation and transaction state tracking.
* **Network Auto-Switch**: Intelligent chain detection that prompts users for necessary network transitions.

### 2. Universal Swap
* **Optimized Execution**: Low-latency token swapping with professional-grade slippage controls.
* **Dynamic Quotes**: Real-time price impact analysis and Liquidity Provider (LP) data visualization.
* **Premium Input Design**: Refined input groups with tabular number formatting for financial precision.

### 3. Persisted Transaction History
* **IndexedDB Implementation**: A local-first storage solution ensuring transaction logs are preserved across browser sessions and refreshes.
* **Global Activity Feed**: Toggle between personal user history and global network activity.
* **Deduplication Engine**: Merges blockchain-on-chain data with local-state metadata for 100% accuracy.

### 4. Professional UI/UX
* **Theme-Aware Ecosystem**: Seamless transitions between deep midnight dark mode and high-clarity light mode.
* **Responsive Architecture**: Fully optimized for mobile viewports using Dynamic Viewport Height (dvh) units and fluid grid systems.
* **Native SVG Animations**: Zero-JS-overhead hero animations for a premium look without sacrificing performance.

## Technology Stack

### Frontend Architecture
* **React 18**: Component-based UI logic.
* **Vite**: Ultra-fast development and build pipeline.
* **Tailwind CSS**: Utility-first styling with a custom design system.
* **Framer Motion**: Production-grade micro-interactions and transitions.

### Blockchain & Integration
* **Wagmi & Viem**: Type-safe Ethereum hooks and low-level protocol interactions.
* **RainbowKit / AppKit**: Streamlined wallet connection experience.
* **Circle Bridge Kit**: Powering the underlying cross-chain USDC transfers.
* **i18next**: Comprehensive internationalization and translation support.

## Getting Started

### Prerequisites
* Node.js (v18 or higher)
* npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/stac.git
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure Environment:
   Create a `.env` file in the root directory and add your RPC URLs and Project IDs:
   ```env
   VITE_PROJECT_ID=your_reown_project_id
   VITE_RPC_URL_ARC=your_arc_rpc
   ```

4. Start Development Server:
   ```bash
   npm run dev
   ```

5. Build for Production:
   ```bash
   npm run build
   ```

## Design Philosophy

The Stac platform is built on the principle of **Functional Minimalism**, focusing instead on:
* **Typography**: Professional slate and blue palettes with high-readability fonts (Inter, Satoshi, Outfit).
* **Deterministic UI**: Eliminating layout shifts and ensuring instant component feedback.
* **Native Performance**: Utilizing CSS transitions and SVG animations to keep the main thread unblocked.

---

Created and maintained by the linux_mode and team.
[visit site](https://stac-defi.vercel.app)
