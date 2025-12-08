import React, { useState } from 'react';
import { WalletProvider } from './contexts/WalletContext';
import { ThemeProvider } from './contexts/ThemeContext';
import Layout from './components/Layout';
import Home from './pages/Home';
import Swap from './pages/Swap';
import Bridge from './pages/Bridge';
import Liquidity from './pages/Liquidity';
import Transactions from './pages/Transactions';
import { Analytics } from '@vercel/analytics/react';

function App() {
  const [activeTab, setActiveTab] = useState('home');

  const renderTabContent = () => {
    switch (activeTab) {
      case 'home':
        return <Home setActiveTab={setActiveTab} />;
      case 'swap':
        return <Swap />;
      case 'bridge':
        return <Bridge />;
      case 'liquidity':
        return <Liquidity />;
      case 'activity':
        return <Transactions />;
      default:
        return <Home setActiveTab={setActiveTab} />;
    }
  };

  return (
    <ThemeProvider>
      <WalletProvider>
        <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
          {renderTabContent()}
        </Layout>
        <Analytics />
      </WalletProvider>
    </ThemeProvider>
  );
}

export default App;