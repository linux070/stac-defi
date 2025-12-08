import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../contexts/ThemeContext';
import { useWallet } from '../contexts/WalletContext';
import {
  Home, ArrowLeftRight, Droplet, Clock, Menu, X,
  Moon, Sun, Wallet, LogOut, RefreshCw, ChevronDown, Globe
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatAddress } from '../utils/blockchain';
import WalletModal from './WalletModal';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import LanguageSelector from './LanguageSelector';

const Layout = ({ children, activeTab, setActiveTab }) => {
  const { t, i18n } = useTranslation();
  const { darkMode, toggleDarkMode } = useTheme();
  const { walletAddress, balance, isConnected, disconnect, fetchBalance } = useWallet();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const navItems = [
    { id: 'home', label: t('Home'), icon: Home },
    { id: 'swap', label: t('Swap'), icon: ArrowLeftRight },
    { id: 'bridge', label: t('Bridge'), icon: Globe },
    { id: 'liquidity', label: t('Liquidity'), icon: Droplet },
    { id: 'activity', label: t('Activity'), icon: Clock },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      {/* Transparent Header Container */}
      <header className="fixed top-4 left-0 right-0 z-50 bg-transparent">
        {/* Mobile Header - Dual-Stack Layout */}
        {/* Top Bar: Logo & Wallet */}
        <div className="md:hidden fixed top-4 left-0 right-0 mx-auto w-[95%] mb-4">
          <div className="flex items-center justify-between rounded-full bg-white/80 dark:bg-[#131720]/80 backdrop-blur-xl border border-slate-200 dark:border-white/10 shadow-lg dark:shadow-black/20 px-4 py-2">
            {/* Logo - Standalone logo without text */}
            <a href="/" className="flex items-center ml-1 cursor-pointer hover:opacity-80 transition-opacity">
              <img 
                src="/icons/stac.png" 
                alt="Stac Logo" 
                className="h-9 w-9 object-contain dark:brightness-0 dark:invert"
              />
            </a>

            {/* Controls - Theme Toggle */}
            <div className="flex items-center gap-2">
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

        {/* Desktop Header - Floating Island */}
        <div className="hidden md:block md:fixed md:top-4 md:left-0 md:right-0 md:flex md:justify-center">
          <div className="flex items-center rounded-full bg-white/80 dark:bg-[#131720]/80 backdrop-blur-xl border border-slate-200 dark:border-white/10 shadow-lg dark:shadow-black/20 px-4 py-2 mx-auto w-fit max-w-full">
            {/* Logo - Standalone logo without text */}
            <a href="/" className="flex items-center ml-2 mr-6 cursor-pointer hover:opacity-80 transition-opacity">
              <img 
                src="/icons/stac.png" 
                alt="Stac Logo" 
                className="h-11 w-11 object-contain dark:brightness-0 dark:invert"
              />
            </a>

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
      </header>

      {/* Mobile Bottom Navigation - Fixed at bottom with glassmorphism effect */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/80 dark:bg-[#131720]/80 backdrop-blur-xl border-t border-slate-200 dark:border-white/10 shadow-lg">
        <div className="grid grid-cols-5">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                data-nav={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`py-3 px-0 text-xs font-medium transition-all duration-200 flex flex-col items-center justify-center nav-link
                  ${activeTab === item.id
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-gray-500 dark:text-gray-400'
                  }`}
              >
                <Icon size={20} className="mb-1" />
                <span className="text-[10px]">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Mobile Sidebar - Adjusted for bottom nav */}
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
              className="fixed left-0 top-16 bottom-16 w-64 bg-white dark:bg-gray-900 shadow-xl z-50 lg:hidden"
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
      <main className="min-h-screen w-full bg-slate-50 text-slate-900 dark:bg-[#050508] dark:bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] dark:from-blue-900/20 dark:via-slate-950/50 dark:to-[#050508] dark:text-white max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-48 md:pt-32 pb-24 md:pb-12 overflow-visible flex-grow">
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
      <footer className="mt-auto py-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Flex container that stacks on mobile and aligns horizontally on desktop */}
          <div className="flex flex-col md:flex-row items-center justify-between min-h-[60px] gap-4 md:gap-0">
            {/* Left Section - Language Selector */}
            <div className="flex-shrink-0 md:mr-4">
              <LanguageSelector placement="footer" />
            </div>
            
            {/* Center Section - Copyright and Attribution */}
            <div className="text-center">
              <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400">
                © {new Date().getFullYear()} Stac. All rights reserved. · 
                Built by : <a 
                  href="https://x.com/linux_mode" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-gray-500 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 transition-colors font-medium"
                >
                  Linux🏅🃏
                </a>
              </p>
            </div>
            
            {/* Right Section - Empty spacer on desktop to maintain balance */}
            <div className="flex-shrink-0 md:w-auto">
              {/* This empty div balances the left element on desktop */}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;