import { useEffect, lazy, Suspense } from 'react';
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { WalletProvider } from './contexts/WalletContext';
import { ThemeProvider } from './contexts/ThemeContext';
import Layout from './components/Layout';
import { Analytics } from '@vercel/analytics/react';
import { ModalProvider } from './contexts/ModalProvider';
import ErrorBoundary from './components/ErrorBoundary';

// Lazy load pages for production performance
const Home = lazy(() => import('./pages/Home'));
const Swap = lazy(() => import('./pages/Swap'));
const Bridge = lazy(() => import('./pages/Bridge'));
const Liquidity = lazy(() => import('./pages/Liquidity'));
const Transactions = lazy(() => import('./pages/Transactions'));

// Production loading state
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[60dvh] w-full">
    <div className="relative">
      <div className="w-12 h-12 rounded-full border-2 border-slate-200 dark:border-white/10"></div>
      <div className="absolute top-0 left-0 w-12 h-12 rounded-full border-t-2 border-blue-500 animate-spin"></div>
    </div>
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
              <Suspense fallback={<PageLoader />}>
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
              </Suspense>
            </ErrorBoundary>
          </Layout>
          <Analytics />
        </WalletProvider>
      </ModalProvider>
    </ThemeProvider>
  );
}

export default App;