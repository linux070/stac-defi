import { useEffect, lazy, Suspense } from 'react';
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { WalletProvider } from './contexts/WalletProvider';
import { ThemeProvider } from './contexts/ThemeProvider';
import Layout from './components/Layout';
import { Analytics } from '@vercel/analytics/react';
import { ModalProvider } from './contexts/ModalProvider';
import ErrorBoundary from './components/ErrorBoundary';

import Home from './pages/Home';
import Swap from './pages/Swap';
import Bridge from './pages/Bridge';
import Transactions from './pages/Transactions';

// Lazy load secondary pages
const Liquidity = lazy(() => import('./pages/Liquidity'));

// Production loading state - Minimalist
const PageLoader = ({ name }) => (
  <div className="flex items-center justify-center min-h-[60dvh] w-full bg-white dark:bg-black">
    <span className="text-[11px] font-bold text-slate-400 dark:text-slate-600 uppercase tracking-[0.5em] animate-pulse">
      {name || 'Loading'}. . .
    </span>
  </div>
);

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

  useEffect(() => {
    localStorage.setItem('stac_active_tab', activeTab);
  }, [activeTab]);

  return (
    <ThemeProvider>
      <ModalProvider>
        <WalletProvider>
          <Suspense fallback={<PageLoader name={activeTab === 'home' ? 'Loading' : activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} />}>
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
          </Suspense>
          <Analytics />
        </WalletProvider>
      </ModalProvider>
    </ThemeProvider>
  );
}

export default App;