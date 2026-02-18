import { useEffect } from 'react';
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { WalletProvider } from './contexts/WalletContext';
import { ThemeProvider } from './contexts/ThemeContext';
import Layout from './components/Layout';
import Home from './pages/Home';
import Swap from './pages/Swap';
import Bridge from './pages/Bridge';
import Liquidity from './pages/Liquidity';
import Transactions from './pages/Transactions';
import { Analytics } from '@vercel/analytics/react';
import { ModalProvider } from './contexts/ModalProvider';
import ErrorBoundary from './components/ErrorBoundary';

function App() {
  const location = useLocation();
  const navigate = useNavigate();

  // Map path to tab
  const getTabFromPath = (path) => {
    if (path === '/') return 'home';
    const tab = path.replace('/', '');
    const validTabs = ['home', 'swap', 'bridge', 'liquidity', 'transactions'];
    return validTabs.includes(tab) ? tab : 'home';
  };

  const activeTab = getTabFromPath(location.pathname);

  const setActiveTab = (tab) => {
    const targetPath = tab === 'home' ? '/' : `/${tab}`;
    if (location.pathname !== targetPath) {
      navigate(targetPath);
    }
  };

  // Optional: Persist to localStorage for other purposes, but routing is now URL-driven
  useEffect(() => {
    localStorage.setItem('stac_active_tab', activeTab);
  }, [activeTab]);

  return (
    <ThemeProvider>
      <ModalProvider>
        <WalletProvider>
          <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
            <ErrorBoundary key={activeTab}>
              <Routes>
                <Route path="/" element={<Home setActiveTab={setActiveTab} />} />
                <Route path="/home" element={<Home setActiveTab={setActiveTab} />} />
                <Route path="/swap" element={<Swap />} />
                <Route path="/bridge" element={<Bridge />} />
                <Route path="/liquidity" element={<Liquidity />} />
                <Route path="/transactions" element={<Transactions />} />
                {/* Catch-all for undefined routes defaults to home */}
                <Route path="*" element={<Home setActiveTab={setActiveTab} />} />
              </Routes>
            </ErrorBoundary>
          </Layout>
          <Analytics />
        </WalletProvider>
      </ModalProvider>
    </ThemeProvider>
  );
}

export default App;