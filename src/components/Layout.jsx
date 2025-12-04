import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../contexts/ThemeContext';
import { useWallet } from '../contexts/WalletContext';
import {
  Home, ArrowLeftRight, Droplet, Clock, Menu, X,
  Moon, Sun, Globe, Wallet, LogOut, RefreshCw, ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatAddress } from '../utils/blockchain';
import WalletModal from './WalletModal';
import CustomConnectButton from './CustomConnectButton';

const Layout = ({ children, activeTab, setActiveTab }) => {
  const { t, i18n } = useTranslation();
  const { darkMode, toggleDarkMode } = useTheme();
  const { walletAddress, balance, isConnected, disconnect, fetchBalance } = useWallet();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);

  const languages = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    { code: 'zh', name: '中文', flag: '🇨🇳' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
  ];

  const navItems = [
    { id: 'home', label: t('home'), icon: Home },
    { id: 'swap', label: t('swap'), icon: ArrowLeftRight },
    { id: 'bridge', label: t('bridge'), icon: Globe },
    { id: 'liquidity', label: t('liquidity'), icon: Droplet },
    { id: 'transactions', label: t('transactions'), icon: Clock },
  ];

  const changeLanguage = (lang) => {
    i18n.changeLanguage(lang);
    localStorage.setItem('language', lang);
    setShowLangMenu(false);
  };

  const currentLang = languages.find(l => l.code === i18n.language) || languages[0];

  return (
    <div className="min-h-screen flex flex-col">
      {/* Transparent Header Container */}
      <header className="fixed top-4 left-0 right-0 z-50 bg-transparent">
        {/* Mobile Header - Dual-Stack Layout */}
        {/* Top Bar: Logo & Wallet */}
        <div className="md:hidden fixed top-4 left-0 right-0 mx-auto w-[95%] mb-4">
          <div className="flex items-center justify-between rounded-full bg-white/80 dark:bg-[#131720]/80 backdrop-blur-xl border border-slate-200 dark:border-white/10 shadow-lg dark:shadow-black/20 px-4 py-2">
            {/* Logo - Hide text on mobile, keep only icon */}
            <div className="flex items-center">
              <img 
                src="/icons/stac.png" 
                alt="Stac Logo" 
                className="w-10 h-10 md:w-8 md:h-8 object-contain dark:brightness-0 dark:invert"
              />
              {/* Hidden on mobile, visible on desktop */}
              <h1 className="text-xl font-bold gradient-text ml-1.5 hidden md:block">Stac</h1>
            </div>

            {/* Controls - Theme Toggle and Language Selector */}
            <div className="flex items-center gap-2">
              <button
                onClick={toggleDarkMode}
                className="p-2 rounded-full hover:bg-white/10 dark:hover:bg-white/5 mx-1"
              >
                {darkMode ? <Sun size={20} /> : <Moon size={20} />}
              </button>
              
              <div className="relative mx-1">
                <button
                  onClick={() => setShowLangMenu(!showLangMenu)}
                  className="p-2 rounded-full hover:bg-white/10 dark:hover:bg-white/5 flex items-center"
                >
                  <span className="text-lg">{currentLang.flag}</span>
                </button>
                <AnimatePresence>
                  {showLangMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute right-0 top-full mt-2 w-40 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 py-2 z-50"
                    >
                      {languages.map((lang) => (
                        <button
                          key={lang.code}
                          onClick={() => {
                            changeLanguage(lang.code);
                            setShowLangMenu(false);
                          }}
                          className={`w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center
                            ${i18n.language === lang.code ? 'bg-gray-50 dark:bg-gray-700/50' : ''}`}
                        >
                          <span className="text-lg mr-2">{lang.flag}</span>
                          <span>{lang.name}</span>
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Wallet Button */}
              <div>
                <CustomConnectButton />
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Bar - Bottom Bar */}
        <nav className="md:hidden fixed top-20 left-0 right-0 mx-auto z-30 w-[98%]">
          <div className="bg-white/80 dark:bg-[#131720]/80 backdrop-blur-xl border border-slate-200 dark:border-white/10 shadow-lg dark:shadow-black/20 p-2 rounded-2xl">
            <div className="grid grid-cols-5 gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    data-nav={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`py-3 px-0 rounded-full text-xs font-medium transition-all duration-200 flex flex-col items-center justify-center nav-link
                      ${activeTab === item.id
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                        : 'text-slate-500 bg-transparent'
                      }${item.id === 'transactions' ? ' tracking-tighter' : ''}`}
                  >
                    <Icon size={24} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </nav>

        {/* Desktop Header - Floating Island */}
        <div className="hidden md:block md:fixed md:top-4 md:left-0 md:right-0 md:flex md:justify-center">
          <div className="flex items-center rounded-full bg-white/80 dark:bg-[#131720]/80 backdrop-blur-xl border border-slate-200 dark:border-white/10 shadow-lg dark:shadow-black/20 px-4 py-2 mx-auto w-fit max-w-full">
            {/* Logo */}
            <div className="flex items-center mr-6">
              <img 
                src="/icons/stac.png" 
                alt="Stac Logo" 
                className="h-10 w-auto object-contain dark:brightness-0 dark:invert"
              />
              <h1 className="text-xl font-bold gradient-text ml-1.5">Stac</h1>
            </div>

            {/* Desktop Navigation */}
            <nav className="flex items-center space-x-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    data-nav={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`px-3 py-2 rounded-full text-sm font-medium transition-all duration-200 flex items-center nav-link
                      ${activeTab === item.id
                        ? 'bg-blue-100/50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                        : 'text-gray-600 hover:bg-gray-100/50 dark:text-gray-300 dark:hover:bg-gray-700/50'
                      }`}
                  >
                    <Icon size={16} className="mr-2" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>

            {/* Spacer to push controls to the right */}
            <div className="flex-grow"></div>

            {/* Language Selector */}
            <div className="relative mx-2">
              <button
                onClick={() => setShowLangMenu(!showLangMenu)}
                className="p-2 rounded-full hover:bg-white/10 dark:hover:bg-white/5 flex items-center"
              >
                <span className="text-lg">{currentLang.flag}</span>
              </button>
              <AnimatePresence>
                {showLangMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute right-0 mt-2 w-40 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 py-2 z-50"
                  >
                    {languages.map((lang) => (
                      <button
                        key={lang.code}
                        onClick={() => changeLanguage(lang.code)}
                        className={`w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center
                          ${i18n.language === lang.code ? 'bg-gray-50 dark:bg-gray-700/50' : ''}`}
                      >
                        <span className="text-lg mr-2">{lang.flag}</span>
                        <span>{lang.name}</span>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Theme Toggle */}
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-full hover:bg-white/10 dark:hover:bg-white/5 mx-1"
            >
              {darkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            {/* Wallet Button */}
            <div className="ml-2">
              <CustomConnectButton />
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-40 lg:hidden"
              onClick={() => setSidebarOpen(false)}
            />
            <motion.div
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              className="fixed left-0 top-16 bottom-0 w-64 bg-white dark:bg-gray-900 shadow-xl z-50 lg:hidden"
            >
              <nav className="p-4 space-y-2">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveTab(item.id);
                        setSidebarOpen(false);
                      }}
                      className={`w-full px-4 py-3 rounded-lg font-medium transition-all duration-200 flex items-center space-x-3
                        ${activeTab === item.id
                          ? 'bg-gradient-to-r from-blue-400 to-blue-500 text-white shadow-lg'
                          : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-gray-700'
                        }`}
                    >
                      <Icon size={20} />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </nav>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className="min-h-screen w-full bg-slate-50 text-slate-900 dark:bg-[#050508] dark:bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] dark:from-blue-900/20 dark:via-slate-950/50 dark:to-[#050508] dark:text-white max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-48 md:pt-32 pb-24 md:pb-8 overflow-visible">
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
      <footer className="mt-auto py-6 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              © {new Date().getFullYear()} Stac. All rights reserved. 
              
              
              Built by : <a 
                href="https://x.com/linux_mode" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-gray-600 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 transition-colors font-medium"
              >
                Linux🏅🃏
              </a>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
