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
import { ConnectButton } from '@rainbow-me/rainbowkit';

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
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo and Mobile Menu */}
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
              <div className="flex items-center space-x-2">
                <div className="w-10 h-10 bg-gradient-arc rounded-lg flex items-center justify-center text-white font-bold text-xl">
                  S
                </div>
                <div>
                  <h1 className="text-xl font-bold gradient-text">Stac</h1>
                </div>
              </div>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center space-x-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2
                      ${activeTab === item.id
                        ? 'bg-gradient-to-r from-blue-400 to-blue-500 text-white shadow-lg'
                        : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-gray-700'
                      }`}
                  >
                    <Icon size={18} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>

            {/* Right Side Actions */}
            <div className="flex items-center space-x-2">
              {/* Language Selector */}
              <div className="relative">
                <button
                  onClick={() => setShowLangMenu(!showLangMenu)}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center space-x-1"
                >
                  <span className="text-lg">{currentLang.flag}</span>
                  <ChevronDown size={16} className="text-gray-500" />
                </button>
                <AnimatePresence>
                  {showLangMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 py-2"
                    >
                      {languages.map((lang) => (
                        <button
                          key={lang.code}
                          onClick={() => changeLanguage(lang.code)}
                          className={`w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2
                            ${i18n.language === lang.code ? 'bg-gray-50 dark:bg-gray-700/50' : ''}`}
                        >
                          <span className="text-lg">{lang.flag}</span>
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
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
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
      <main className="min-h-screen w-full bg-slate-50 text-slate-900 dark:bg-[#050508] dark:bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] dark:from-blue-900/20 dark:via-slate-950/50 dark:to-[#050508] dark:text-white max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 overflow-visible">
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
