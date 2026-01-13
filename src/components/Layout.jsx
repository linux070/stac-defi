import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../contexts/ThemeContext';
import { useWallet } from '../contexts/WalletContext';
import {
  Home, ArrowLeftRight, Droplet, Clock, Menu, X,
  Moon, Sun, Wallet, LogOut, RefreshCw, ChevronDown, Globe, ArrowUpDown, Waypoints,
  Twitter, MessageSquare, ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatAddress } from '../utils/blockchain';
import WalletModal from './WalletModal';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useNavigate, Link } from 'react-router-dom';
import LanguageSelector from './LanguageSelector';
import BackgroundGradient from './BackgroundGradient';
import FeedbackButton from './FeedbackButton';

const Layout = ({ children, activeTab, setActiveTab }) => {
  const { t, i18n } = useTranslation();
  const { darkMode, toggleDarkMode } = useTheme();
  const { walletAddress, balance, isConnected, disconnect, fetchBalance } = useWallet();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const navItems = [
    { id: 'home', label: t('Home') },
    { id: 'swap', label: t('Swap') },
    { id: 'bridge', label: t('Bridge') },
    { id: 'liquidity', label: t('Liquidity') },
    { id: 'transactions', label: t('Transactions') },
  ];

  return (
    <div className={`min-h-[100dvh] flex flex-col ${activeTab === 'swap' || activeTab === 'bridge' ? 'bg-transparent' : activeTab === 'transactions' ? 'bg-white dark:bg-black' : 'bg-white dark:bg-black'}`}>
      {/* Animated Background Gradient - Only for Swap and Bridge pages */}
      {(activeTab === 'swap' || activeTab === 'bridge') && <BackgroundGradient />}

      {/* Header - Immersive full-width design */}
      <div className="fixed top-0 left-0 right-0 z-[1000] transition-all duration-300">
        {/* Mobile Header (Relay Style) */}
        <div className="lg:hidden w-full h-16 bg-white/80 dark:bg-black/80 backdrop-blur-xl border-b border-slate-200 dark:border-white/10 px-4 flex items-center justify-between">
          {/* Logo Section */}
          <div className="flex items-center cursor-pointer transition-all duration-300 hover:opacity-80 active:scale-95" onClick={() => setActiveTab('home')}>
            <div className="h-8 w-6 overflow-hidden flex-shrink-0 bg-transparent">
              <img
                src="/icons/Stac.png"
                alt=""
                className="h-8 max-w-none object-cover dark:invert"
                style={{ objectPosition: 'left' }}
              />
            </div>
            <div className="h-8 overflow-hidden flex-shrink-0 ml-1.5 bg-transparent">
              <img
                src="/icons/Stac.png"
                alt="Stac"
                className="h-8 max-w-none object-cover dark:invert"
                style={{ marginLeft: '-24px' }}
              />
            </div>
          </div>

          {/* Menu Button - Far Right */}
          <button
            onClick={() => setIsMenuOpen(true)}
            className="p-2 rounded-lg text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-all active:scale-90 touch-manipulation"
            aria-label="Open Menu"
          >
            <Menu size={26} />
          </button>
        </div>

        {/* Desktop Header - Floating Island (Preserved for desktop) */}
        <div className="hidden lg:flex lg:h-20 lg:items-center lg:justify-center">
          <div className="flex items-center rounded-full bg-white/80 dark:bg-[#131720]/80 backdrop-blur-xl border border-slate-200 dark:border-white/10 shadow-lg dark:shadow-black/20 px-6 py-2.5 w-fit max-w-full lg:min-w-[500px] lg:max-w-[1200px] flex-nowrap overflow-hidden">
            {/* Logo Section */}
            <div className="flex items-center cursor-pointer transition-all duration-300 hover:opacity-80 active:scale-95 flex-shrink-0 mr-6 md:mr-10 isolation-isolate" onClick={() => setActiveTab('home')}>
              <div className="h-9 w-7 overflow-hidden flex-shrink-0 bg-transparent">
                <img
                  src="/icons/Stac.png"
                  alt=""
                  className="h-9 max-w-none object-cover dark:invert"
                  style={{ objectPosition: 'left' }}
                />
              </div>
              <div className="h-9 overflow-hidden flex-shrink-0 ml-4 bg-transparent">
                <img
                  src="/icons/Stac.png"
                  alt="Stac"
                  className="h-9 max-w-none object-cover dark:invert"
                  style={{ marginLeft: '-28px' }}
                />
              </div>
            </div>

            {/* Desktop Navigation */}
            <nav className="flex items-center gap-1 md:gap-2">
              {navItems.map((item) => {
                const path = item.id === 'home' ? '/home' : `/${item.id}`;
                return (
                  <Link
                    key={item.id}
                    to={path}
                    className={`px-4 py-2 rounded-full text-sm font-semibold transition-all duration-300 flex items-center nav-link whitespace-nowrap
                      ${activeTab === item.id
                        ? 'bg-blue-100/50 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400'
                        : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/5'
                      }`}
                  >
                    <span className="whitespace-nowrap">{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            <div className="flex-grow"></div>

            {/* Theme Toggle */}
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-full hover:bg-white/10 dark:hover:bg-white/5 mx-1"
            >
              {darkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            {/* Wallet Button */}
            <ConnectButton
              showBalance={false}
              accountStatus={{
                smallScreen: 'avatar',
                largeScreen: 'full',
              }}
              chainStatus={{
                smallScreen: 'icon',
                largeScreen: 'full',
              }}
            />
          </div>
        </div>
      </div>

      {/* Full-Screen Mobile Menu Overlay (Relay Aesthetic) */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[2000] bg-white dark:bg-black flex flex-col lg:hidden overflow-y-auto"
          >
            {/* Top Bar */}
            <div className="w-full h-16 px-4 flex-shrink-0 flex items-center justify-between border-b border-slate-200 dark:border-white/10">
              {/* Logo */}
              <div className="flex items-center cursor-pointer" onClick={() => { setIsMenuOpen(false); setActiveTab('home'); }}>
                <div className="h-8 w-6 overflow-hidden flex-shrink-0">
                  <img src="/icons/Stac.png" alt="" className="h-8 max-w-none object-cover dark:invert" style={{ objectPosition: 'left' }} />
                </div>
                <div className="h-8 overflow-hidden flex-shrink-0 ml-1.5">
                  <img src="/icons/Stac.png" alt="Stac" className="h-8 max-w-none object-cover dark:invert" style={{ marginLeft: '-24px' }} />
                </div>
              </div>
              {/* Close Button */}
              <button
                onClick={() => setIsMenuOpen(false)}
                className="p-2 rounded-lg text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-all"
              >
                <X size={28} />
              </button>
            </div>

            {/* Navigation Links - Centered */}
            <nav className="flex-grow flex flex-col justify-center items-start px-8 gap-2">
              {navItems.map((item) => {
                const path = item.id === 'home' ? '/home' : `/${item.id}`;
                return (
                  <Link
                    key={item.id}
                    to={path}
                    onClick={() => setIsMenuOpen(false)}
                    className={`text-xl font-semibold tracking-tight py-2 transition-all duration-300 relative
                      ${activeTab === item.id
                        ? 'text-blue-600 dark:text-blue-400'
                        : 'text-slate-500 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white'
                      }`}
                  >
                    {activeTab === item.id && (
                      <motion.div
                        layoutId="mobile-active-indicator"
                        className="absolute left-[-12px] top-1/2 -translate-y-1/2 w-1 h-5 bg-blue-600 dark:bg-blue-400 rounded-full"
                      />
                    )}
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            {/* Bottom Controls - Relay Style iOS Action Rows */}
            <div className="mt-auto w-full flex flex-col bg-white dark:bg-black border-t border-slate-100 dark:border-white/5">
              <ConnectButton.Custom>
                {({
                  account,
                  chain,
                  openAccountModal,
                  openChainModal,
                  openConnectModal,
                  mounted,
                }) => {
                  const ready = mounted;
                  const connected = ready && account && chain;

                  if (!connected) {
                    return (
                      <div className="p-6">
                        <button
                          onClick={openConnectModal}
                          className="w-full h-16 bg-blue-600 text-white rounded-2xl font-bold text-lg shadow-lg shadow-blue-500/20 active:scale-95 transition-all"
                        >
                          {t('Connect Wallet')}
                        </button>
                      </div>
                    );
                  }

                  return (
                    <div className="flex flex-col w-full">
                      {/* Row 1: Network */}
                      <button
                        onClick={openChainModal}
                        className="w-full h-16 px-8 flex items-center justify-between border-b border-slate-100 dark:border-white/5 active:bg-slate-50 dark:active:bg-white/5 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          {chain.hasIcon && chain.iconUrl ? (
                            <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-100 dark:bg-white/10 flex items-center justify-center">
                              <img
                                alt={chain.name ?? 'Chain icon'}
                                src={chain.iconUrl}
                                className="w-6 h-6"
                              />
                            </div>
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-white/10 flex items-center justify-center">
                              <Globe size={18} className="text-slate-400" />
                            </div>
                          )}
                          <span className="text-[17px] font-semibold text-slate-900 dark:text-white">{chain.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-slate-400">Switch</span>
                          <ChevronRight size={20} className="text-slate-300 dark:text-slate-600" />
                        </div>
                      </button>

                      {/* Row 2: Wallet */}
                      <button
                        onClick={openAccountModal}
                        className="w-full h-16 px-8 flex items-center justify-between border-b border-slate-100 dark:border-white/5 active:bg-slate-50 dark:active:bg-white/5 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-8 h-8 rounded-full overflow-hidden bg-blue-500 flex-shrink-0">
                            {account.ensAvatar ? (
                              <img src={account.ensAvatar} className="w-full h-full" alt="" />
                            ) : (
                              <div className="w-full h-full bg-gradient-to-br from-blue-400 to-blue-600" />
                            )}
                          </div>
                          <span className="text-[17px] font-semibold text-slate-900 dark:text-white">{account.displayName}</span>
                        </div>
                        <LogOut size={20} className="text-slate-400" />
                      </button>
                    </div>
                  );
                }}
              </ConnectButton.Custom>

              {/* Row 3: Language */}
              <div className="w-full h-16 px-8 flex items-center border-b border-slate-100 dark:border-white/5 active:bg-slate-50 dark:active:bg-white/5 transition-colors">
                <LanguageSelector placement="mobile-menu" />
              </div>

              {/* Row 4: Theme */}
              <button
                onClick={toggleDarkMode}
                className="w-full h-16 px-8 flex items-center justify-between border-b border-slate-100 dark:border-white/5 active:bg-slate-50 dark:active:bg-white/5 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-white/10 flex items-center justify-center">
                    {darkMode ? <Moon size={18} className="text-blue-400" /> : <Sun size={18} className="text-amber-400" />}
                  </div>
                  <span className="text-[17px] font-semibold text-slate-900 dark:text-white">Theme</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-slate-400 uppercase">{darkMode ? 'Dark' : 'Light'}</span>
                  <div className={`w-10 h-6 rounded-full p-1 transition-colors ${darkMode ? 'bg-blue-600' : 'bg-slate-200'}`}>
                    <div className={`w-4 h-4 rounded-full bg-white transition-transform ${darkMode ? 'translate-x-4' : 'translate-x-0'}`} />
                  </div>
                </div>
              </button>

              {/* Bottom Padding for Safe Area */}
              <div style={{ height: 'env(safe-area-inset-bottom)', minHeight: '1.5rem' }} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className={`min-h-fit w-full ${activeTab === 'swap' || activeTab === 'bridge' ? 'bg-transparent' : activeTab === 'transactions' ? 'bg-white dark:bg-black' : activeTab === 'liquidity' ? 'bg-white dark:bg-black' : 'bg-white dark:bg-black'} text-slate-900 dark:text-white max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 md:pt-32 pb-12 md:pb-12 overflow-x-hidden md:overflow-visible flex-grow relative z-10`}>
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          {children}
        </motion.div>
      </main>

      {/* Wallet Modal */}
      <WalletModal isOpen={showWalletModal} onClose={() => setShowWalletModal(false)} />

      {/* Footer */}
      <footer
        className={`mt-auto border-t border-gray-200 dark:border-gray-700 ${activeTab === 'swap' || activeTab === 'bridge' ? 'bg-white/80 dark:bg-black/80 backdrop-blur-sm' : 'bg-white dark:bg-black'} relative z-20 md:py-8 py-8`}
        style={{ paddingBottom: 'calc(2rem + env(safe-area-inset-bottom))' }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Flex container that stacks on mobile and aligns horizontally on desktop */}
          <div className="flex flex-col lg:flex-row items-center justify-between min-h-[60px] gap-6 lg:gap-0">
            {/* Left Section - Language Selector (hidden on mobile) */}
            <div className="hidden lg:flex flex-shrink-0 lg:mr-4 w-full lg:w-auto justify-center lg:justify-start">
              <LanguageSelector placement="footer" />
            </div>

            {/* Center Section - Copyright and Attribution */}
            <div className="text-center w-full lg:w-auto">
              <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                <span className="block lg:inline">© {new Date().getFullYear()} Stac. All rights reserved.</span>
                <span className="hidden lg:inline"> · </span>
                <span className="block lg:inline mt-1 lg:mt-0">
                  Built by : <a
                    href="https://x.com/linux_mode"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors font-bold no-underline cursor-pointer"
                  >
                    Linux🏅🃏
                  </a>
                </span>
              </p>
            </div>

            {/* Right Section - Footer Links */}
            <div className="flex items-center gap-6 md:gap-8 w-full lg:w-auto justify-center lg:justify-end">
              <a
                href="#"
                className="text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                Docs
              </a>
              <a
                href="#"
                className="text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                Terms
              </a>
              {/* Twitter link - hidden on mobile */}
              <a
                href="https://x.com/stac_defi"
                target="_blank"
                rel="noopener noreferrer"
                className="hidden lg:block text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                Twitter
              </a>
              <a
                href="#"
                className="text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                Discord
              </a>
            </div>
          </div>
        </div>
      </footer>
      <FeedbackButton />
    </div>
  );
};

export default Layout;