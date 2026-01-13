import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { WalletProvider } from './contexts/WalletContext';
import { ThemeProvider } from './contexts/ThemeContext';
import Layout from './components/Layout';
import Home from './pages/Home';
import Swap from './pages/Swap';
import Bridge from './pages/Bridge';
import Liquidity from './pages/Liquidity';
import Transactions from './pages/Transactions';
import { Analytics } from '@vercel/analytics/react';

// Wrapper component to handle routing and pass navigation to Layout
const AppContent = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Map pathname to tab id
  const getActiveTab = () => {
    const path = location.pathname;
    if (path === '/' || path === '/home') return 'home';
    if (path === '/swap') return 'swap';
    if (path === '/bridge') return 'bridge';
    if (path === '/liquidity') return 'liquidity';
    if (path === '/transactions') return 'transactions';
    return 'home';
  };

  // Navigate to tab by updating URL
  const setActiveTab = (tabId) => {
    const routes = {
      'home': '/home',
      'swap': '/swap',
      'bridge': '/bridge',
      'liquidity': '/liquidity',
      'transactions': '/transactions'
    };
    navigate(routes[tabId] || '/home');
  };

  return (
    <Layout activeTab={getActiveTab()} setActiveTab={setActiveTab}>
      <Routes>
        <Route path="/" element={<Navigate to="/home" replace />} />
        <Route path="/home" element={<Home setActiveTab={setActiveTab} />} />
        <Route path="/swap" element={<Swap />} />
        <Route path="/bridge" element={<Bridge />} />
        <Route path="/liquidity" element={<Liquidity />} />
        <Route path="/transactions" element={<Transactions />} />
        {/* Fallback route */}
        <Route path="*" element={<Navigate to="/home" replace />} />
      </Routes>
    </Layout>
  );
};

function App() {
  return (
    <ThemeProvider>
      <WalletProvider>
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
        <Analytics />
      </WalletProvider>
    </ThemeProvider>
  );
}

export default App;