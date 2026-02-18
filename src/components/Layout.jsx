import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../contexts/ThemeContext';
import {
  Menu, X, Moon, Sun, Globe, MessageSquare, FileText, Github, ChevronRight, LogOut
} from 'lucide-react';
import UpdatesModal from './UpdatesModal';
import { motion, AnimatePresence } from 'framer-motion';
import LanguageSelector from './LanguageSelector';
import BackgroundGradient from './BackgroundGradient';
import FeedbackButton from './FeedbackButton';
import CustomConnectButton from './CustomConnectButton';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import Jazzicon, { jsNumberForAddress } from 'react-jazzicon';
import NotificationBell from './NotificationBell';

const Layout = ({ children, activeTab, setActiveTab }) => {
  const { t } = useTranslation();
  const { darkMode, toggleDarkMode } = useTheme();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showUpdates, setShowUpdates] = useState(false);

  // Body scroll lock effect - Simplified and robust
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMenuOpen]);

  // Auto-close menu and safety reset on tab/route change
  useEffect(() => {
    setIsMenuOpen(false);
    document.body.style.overflow = '';
  }, [activeTab]);
  const navItems = [
    { id: 'swap', label: t('Swap') },
    { id: 'bridge', label: t('Bridge') },
    { id: 'liquidity', label: t('Liquidity') },
    { id: 'transactions', label: t('Transactions') },
  ];

  const landingNavItems = [
    { label: t('Docs'), href: '#', comingSoon: true },
    { label: t('Discord'), href: '#' },
    { label: t('GitHub'), href: 'https://github.com/linux070/stac-defi' },
    { label: t('Twitter'), href: 'https://x.com/stac_defi' },
  ];

  return (
    <div className={`min-h-[100dvh] flex flex-col ${activeTab === 'swap' || activeTab === 'bridge' ? 'bg-transparent' : activeTab === 'transactions' ? 'bg-white dark:bg-black' : 'bg-white dark:bg-black'}`}>
      {/* Animated Background Gradient - Only for Swap and Bridge pages */}
      {(activeTab === 'swap' || activeTab === 'bridge') && <BackgroundGradient />}

      {/* Header - Immersive full-width design */}
      <div className="fixed top-0 left-0 right-0 z-[100] transition-all duration-300">
        {/* Mobile Header (Relay Style) - Always visible */}
        <div className="lg:hidden w-full h-16 bg-white dark:bg-black border-b border-slate-200 dark:border-white/10 px-4 flex items-center justify-between relative z-[100]">
          {/* Logo Section */}
          <div className="flex items-center cursor-pointer transition-all duration-300 hover:opacity-80 active:scale-95" onClick={() => setActiveTab('home')}>
            <div className="h-8 w-6 overflow-hidden flex-shrink-0 bg-transparent">
              <img
                src="/icons/stac.png"
                alt=""
                className="h-8 max-w-none object-cover dark:invert"
                style={{ objectPosition: 'left' }}
              />
            </div>
            <div className="h-8 overflow-hidden flex-shrink-0 ml-1.5 bg-transparent">
              <img
                src="/icons/stac.png"
                alt="Stac"
                className="h-8 max-w-none object-cover dark:invert"
                style={{ marginLeft: '-24px' }}
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <NotificationBell placement="mobile" onExplore={() => setShowUpdates(true)} />
            {/* Menu Button - Always accessible */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsMenuOpen(prev => !prev);
              }}
              className="p-2 -mr-2 text-slate-900 dark:text-white transition-all active:scale-90 touch-manipulation relative z-[99999]"
              aria-label={isMenuOpen ? "Close Menu" : "Open Menu"}
            >
              {isMenuOpen ? <X size={26} strokeWidth={2.5} /> : <Menu size={26} strokeWidth={2.5} />}
            </button>
          </div>
        </div>

        {/* Desktop Header - Sleek Rectangular Top Bar */}
        <div className="hidden lg:flex fixed top-0 left-0 right-0 h-20 items-center justify-between px-10 bg-white dark:bg-black border-b border-slate-200 dark:border-white/5 shadow-sm">
          <div className="flex items-center gap-12">
            {/* Logo Section */}
            <div
              className="flex items-center cursor-pointer transition-all duration-300 hover:opacity-80 active:scale-95 flex-shrink-0"
              onClick={() => setActiveTab('home')}
            >
              <div className="h-9 w-7 overflow-hidden flex-shrink-0 bg-transparent">
                <img
                  src="/icons/stac.png"
                  alt=""
                  className="h-9 max-w-none object-cover dark:invert"
                  style={{ objectPosition: 'left' }}
                />
              </div>
              <div className="h-9 overflow-hidden flex-shrink-0 ml-4 bg-transparent">
                <img
                  src="/icons/stac.png"
                  alt="Stac"
                  className="h-9 max-w-none object-cover dark:invert"
                  style={{ marginLeft: '-28px' }}
                />
              </div>
            </div>

            {/* Desktop Navigation */}
            <div className="flex items-center">
              {activeTab === 'home' ? (
                <div className="flex items-center">
                  {landingNavItems.map((item, idx) => (
                    <div key={idx} className="flex items-center">
                      <a
                        href={item.href}
                        className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 whitespace-nowrap flex items-center gap-2
                            ${item.comingSoon
                            ? 'text-slate-400 cursor-not-allowed opacity-60'
                            : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/5'}`}
                      >
                        {item.label}
                        {item.comingSoon && (
                          <span className="text-[9px] bg-slate-100 dark:bg-white/10 px-1.5 py-0.5 rounded-md uppercase tracking-wider">Soon</span>
                        )}
                      </a>
                      {idx < landingNavItems.length - 1 && (
                        <div className="w-px h-4 bg-slate-200 dark:bg-white/10 mx-1" />
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center">
                  {navItems.map((item, idx) => (
                    <div key={item.id} className="flex items-center">
                      <div
                        onClick={() => setActiveTab(item.id)}
                        className={`px-6 py-2.5 rounded-xl text-[14px] font-bold transition-all duration-300 flex items-center nav-link whitespace-nowrap cursor-pointer
                            ${activeTab === item.id
                            ? 'bg-blue-600/10 text-blue-600 dark:bg-blue-400/10 dark:text-blue-400'
                            : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/5'
                          }`}
                      >
                        <span className="whitespace-nowrap">{item.label}</span>
                      </div>
                      {idx < navItems.length - 1 && (
                        <div className="w-px h-4 bg-slate-200 dark:bg-white/10 mx-1" />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Language Selector */}
            <div className="flex items-center">
              <LanguageSelector placement="header" />
            </div>

            {/* What's New Toggle */}
            <NotificationBell onExplore={() => setShowUpdates(true)} />

            {/* Theme Toggle */}
            <button
              onClick={toggleDarkMode}
              className="h-[44px] w-[44px] flex items-center justify-center rounded-2xl border border-slate-200/60 dark:border-white/10 bg-slate-50/50 dark:bg-white/5 backdrop-blur-xl text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-white/10 hover:border-blue-500/30 dark:hover:border-blue-400/30 transition-all duration-300 active:scale-95 shadow-sm"
            >
              {darkMode ? <Sun size={18} className="text-amber-500" /> : <Moon size={18} className="text-slate-600 dark:text-slate-400" />}
            </button>

            {/* Wallet Button */}
            <div className="flex items-center">
              {activeTab === 'home' ? (
                <button
                  onClick={() => setActiveTab('swap')}
                  className="h-[44px] px-6 rounded-2xl bg-blue-600 text-white hover:bg-blue-700 transition-all duration-300 shadow-lg shadow-blue-500/25 active:scale-95 font-bold text-[13px] whitespace-nowrap flex items-center justify-center tracking-tight"
                >
                  {t('Launch App')}
                </button>
              ) : (
                <CustomConnectButton />
              )}
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[7000] bg-white dark:bg-black flex flex-col lg:hidden pt-16"
          >
            {/* Scrollable Content Area */}
            <div className="flex-grow overflow-y-auto flex flex-col">
              {/* Close Button Row */}
              <div className="flex justify-end px-6 pt-4 pb-2">
                <button
                  onClick={() => setIsMenuOpen(false)}
                  className="p-2.5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors bg-slate-100 dark:bg-white/10 rounded-xl"
                  aria-label="Close Menu"
                >
                  <X size={22} strokeWidth={2} />
                </button>
              </div>

              {/* Navigation Links - Always visible */}
              <nav className="flex flex-col items-start px-8 pt-2 pb-8 gap-1">
                {navItems.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      setIsMenuOpen(false);
                    }}
                    className={`text-[18px] font-semibold tracking-tight py-3 transition-all duration-300 relative cursor-pointer
                      ${activeTab === item.id
                        ? 'text-blue-600 dark:text-blue-400'
                        : 'text-slate-500 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white'
                      }`}
                  >
                    {activeTab === item.id && (
                      <motion.div
                        layoutId="mobile-active-indicator"
                        className="absolute left-[-16px] top-1/2 -translate-y-1/2 w-1.5 h-5 bg-blue-600 dark:bg-blue-400 rounded-lg"
                      />
                    )}
                    {item.label}
                  </div>
                ))}
              </nav>

              {/* Bottom Controls Area - Pushed to bottom with mt-auto */}
              <div className="mt-auto w-full flex flex-col bg-white dark:bg-black border-t border-slate-100 dark:border-white/5 pb-8">
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
                        <div className="px-6 pt-6 pb-2">
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
                              <div className={`w-8 h-8 ${chain.name.toLowerCase().includes('base') ? 'base-sepolia-icon-representation' : 'rounded-lg overflow-hidden bg-slate-100 dark:bg-white/10'} flex items-center justify-center`}>
                                <img
                                  alt={chain.name ?? 'Chain icon'}
                                  src={chain.iconUrl}
                                  className={chain.name.toLowerCase().includes('base') ? "w-full h-full object-cover" : "w-5 h-5 dark:invert-0"}
                                />
                              </div>
                            ) : (
                              <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-white/10 flex items-center justify-center">
                                <Globe size={18} className="text-slate-400" />
                              </div>
                            )}
                            <span className="text-[17px] font-semibold text-slate-900 dark:text-white">{chain.name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-slate-400">{t('Switch')}</span>
                            <ChevronRight size={20} className="text-slate-300 dark:text-slate-600" />
                          </div>
                        </button>

                        {/* Row 2: Wallet */}
                        <button
                          onClick={openAccountModal}
                          className="w-full h-16 px-8 flex items-center justify-between border-b border-slate-100 dark:border-white/5 active:bg-slate-50 dark:active:bg-white/5 transition-colors"
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-8 h-8 rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center bg-slate-100 dark:bg-white/5 shadow-inner">
                              <Jazzicon diameter={32} seed={jsNumberForAddress(account.address)} />
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
                <div className="w-full h-16 px-8 flex items-center justify-between border-b border-slate-100 dark:border-white/5 transition-colors">
                  <span className="text-[17px] font-semibold text-slate-900 dark:text-white">{t('Theme')}</span>
                  <div className="flex items-center p-1 bg-slate-100 dark:bg-white/5 rounded-xl border border-slate-200 dark:border-white/10">
                    <button
                      onClick={() => !darkMode && toggleDarkMode()}
                      className={`p-1.5 rounded-lg transition-all duration-200 ${!darkMode ? 'bg-white shadow-sm text-amber-500' : 'text-slate-400 hover:text-slate-300'}`}
                    >
                      <Sun size={18} />
                    </button>
                    <button
                      onClick={() => darkMode && toggleDarkMode()}
                      className={`p-1.5 rounded-lg transition-all duration-200 ${darkMode ? 'bg-blue-600 shadow-sm text-white' : 'text-slate-500 hover:text-slate-600'}`}
                    >
                      <Moon size={18} />
                    </button>
                  </div>
                </div>

                {/* Socials */}
                <div className="w-full px-8 pt-8 flex items-center justify-center gap-10">
                  <a href="#" className="p-2 text-slate-400 hover:text-blue-500 transition-colors">
                    <FileText size={24} />
                  </a>
                  <a href="https://x.com/stac_defi" target="_blank" rel="noopener noreferrer" className="p-2 text-slate-400 hover:text-blue-500 transition-colors">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                    </svg>
                  </a>
                  <a href="https://github.com/linux070/stac-defi" target="_blank" rel="noopener noreferrer" className="p-2 text-slate-400 hover:text-blue-500 transition-colors">
                    <Github size={24} />
                  </a>
                  <a href="#" className="p-2 text-slate-400 hover:text-blue-500 transition-colors">
                    <MessageSquare size={24} />
                  </a>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className={`flex-grow w-full ${activeTab === 'swap' || activeTab === 'bridge' ? 'bg-transparent' : activeTab === 'transactions' ? 'bg-white dark:bg-black' : 'bg-white dark:bg-black'} text-slate-900 dark:text-white max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 md:pt-32 pb-12 overflow-x-hidden md:overflow-visible relative z-10 flex flex-col`}>
        {children}
      </main>


      {/* Footer - Only shown on Homepage */}
      {
        activeTab === 'home' && (
          <footer
            className={`mt-auto border-t border-gray-200 dark:border-gray-700 ${activeTab === 'swap' || activeTab === 'bridge' ? 'bg-white/80 dark:bg-black/80 backdrop-blur-sm' : 'bg-white dark:bg-black'} relative z-20 py-4 lg:py-8`}
            style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))' }}
          >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              {/* Flex container that stacks on mobile and aligns horizontally on desktop */}
              <div className="flex flex-col lg:flex-row items-center justify-between min-h-[60px] gap-6 lg:gap-0">
                {/* Left Section - Language Selector (hidden on mobile) */}
                <div className="hidden lg:flex flex-shrink-0 lg:mr-4 w-full lg:w-auto justify-center lg:justify-start">
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

                {/* Right Section - Footer Links - Modernized with Icons */}
                <div className="flex items-center gap-6 md:gap-8 w-full lg:w-auto justify-center lg:justify-end">
                  <a
                    href="#"
                    className="hidden lg:flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-300 hover:scale-110"
                  >
                    <FileText size={20} />
                  </a>
                  <a
                    href="https://github.com/linux070/stac-defi"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hidden lg:flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-300 hover:scale-110"
                  >
                    <Github size={20} />
                  </a>
                  <a
                    href="https://x.com/stac_defi"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hidden lg:flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-300 hover:scale-110"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                    </svg>
                  </a>
                  <a
                    href="#"
                    className="hidden lg:flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-300 hover:scale-110"
                  >
                    <MessageSquare size={20} />
                  </a>
                </div>
              </div>
            </div>
          </footer>
        )
      }

      <FeedbackButton />

      {/* Global Updates Modal */}
      <UpdatesModal
        isOpen={showUpdates}
        onClose={() => setShowUpdates(false)}
      />
    </div >
  );
};

export default Layout;