import React, { useState } from 'react';
import { WalletProvider } from './contexts/WalletContext';
import { ThemeProvider } from './contexts/ThemeContext';
import Layout from './components/Layout';
import Home from './pages/Home';
import Swap from './pages/Swap';
import Bridge from './pages/Bridge';
import Liquidity from './pages/Liquidity';
import Transactions from './pages/Transactions';

function App() {
  const [activeTab, setActiveTab] = useState('home');

  const renderPage = () => {
    try {
      switch (activeTab) {
        case 'home':
          return <Home setActiveTab={setActiveTab} />;
        case 'swap':
          return <Swap />;
        case 'bridge':
          return <Bridge />;
        case 'liquidity':
          return <Liquidity />;
        case 'transactions':
          return <Transactions />;
        default:
          return <Home />;
      }
    } catch (error) {
      console.error('Error rendering page:', error);
      return (
        <div className="p-4 text-center text-red-500">
          <h2>Error Loading Page</h2>
          <p>{error.message}</p>
        </div>
      );
    }
  };

  try {
    return (
      <ThemeProvider>
        <WalletProvider>
          <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
            {renderPage()}
          </Layout>
        </WalletProvider>
      </ThemeProvider>
    );
  } catch (error) {
    console.error('Error rendering App:', error);
    return (
      <div className="p-4 text-center text-red-500">
        <h1>Application Error</h1>
        <p>{error.message}</p>
        <p>Please check the console for more details.</p>
      </div>
    );
  }
}

export default App;