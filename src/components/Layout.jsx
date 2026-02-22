import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useAccount } from 'wagmi';
import { useTheme } from '../hooks/useTheme';
import {
  X, Moon, ChevronRight, ArrowLeft, Check, ChevronDown, Bell, Globe, MessageCircle
} from 'lucide-react';
import UpdatesModal from './UpdatesModal';
import { motion, AnimatePresence } from 'framer-motion';
import LanguageSelector from './LanguageSelector';
import BackgroundGradient from './BackgroundGradient';
import FeedbackButton from './FeedbackButton';
import CustomConnectButton from './CustomConnectButton';

const SunIcon = ({ size = 18, className = "" }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <circle cx="12" cy="12" r="4" />
    <line x1="12" y1="2" x2="12" y2="4" />
    <line x1="12" y1="20" x2="12" y2="22" />
    <line x1="4.93" y1="4.93" x2="6.34" y2="6.34" />
    <line x1="17.66" y1="17.66" x2="19.07" y2="19.07" />
    <line x1="2" y1="12" x2="4" y2="12" />
    <line x1="20" y1="12" x2="22" y2="12" />
    <line x1="4.93" y1="19.07" x2="6.34" y2="17.66" />
    <line x1="17.66" y1="6.34" x2="19.07" y2="4.93" />
  </svg>
);
const Layout = ({ children, activeTab, setActiveTab }) => {
  const { t, i18n } = useTranslation();
  const { darkMode, toggleDarkMode } = useTheme();

  const { isConnected } = useAccount();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showUpdates, setShowUpdates] = useState(false);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const [moreMenuPage, setMoreMenuPage] = useState('main'); // 'main' or 'language'
  const moreRef = useRef(null);

  const languages = [
    { code: 'en', name: 'English', flag: 'https://flagcdn.com/w80/us.png' },
    { code: 'es', name: 'Español', flag: 'https://flagcdn.com/w80/es.png' },
    { code: 'fr', name: 'Français', flag: 'https://flagcdn.com/w80/fr.png' },
    { code: 'de', name: 'Deutsch', flag: 'https://flagcdn.com/w80/de.png' },
    { code: 'zh', name: '中文', flag: 'https://flagcdn.com/w80/cn.png' }
  ];

  const currentLang = languages.find(l => i18n.language.startsWith(l.code)) || languages[0];

  // Reset more menu page when closed
  useEffect(() => {
    if (!isMoreOpen) {
      setTimeout(() => setMoreMenuPage('main'), 200);
    }
  }, [isMoreOpen]);

  // Click outside for More dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (moreRef.current && !moreRef.current.contains(event.target)) {
        setIsMoreOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

  // Global listener for updates modal
  useEffect(() => {
    const handleOpenUpdates = () => setShowUpdates(true);
    window.addEventListener('open-updates', handleOpenUpdates);
    return () => window.removeEventListener('open-updates', handleOpenUpdates);
  }, []);
  const navItems = [
    { id: 'swap', label: t('Swap') },
    { id: 'bridge', label: t('Bridge') },
    { id: 'liquidity', label: t('Liquidity') },
    { id: 'transactions', label: t('Transactions') },
  ];

  const landingNavItems = [
    { label: t('Docs'), href: '#', comingSoon: true },
    { label: t('Twitter'), href: 'https://x.com/stac_defi' },
    { label: t('Discord'), href: '#' },
    { label: t('GitHub'), href: 'https://github.com/linux070/stac-defi' },
  ];

  return (
    <div className={`min-h-[100dvh] flex flex-col bg-white dark:bg-black ${['home', 'swap', 'bridge'].includes(activeTab) ? 'bg-transparent' : ''}`}>
      {/* Animated Background Gradient - Only for Swap and Bridge pages */}
      {(activeTab === 'swap' || activeTab === 'bridge') && <BackgroundGradient />}

      {/* Header - Immersive full-width design */}
      <div className="fixed top-0 left-0 right-0 z-[100]">
        {/* Mobile Header (Relay Style) - Always visible */}
        <div className="lg:hidden w-full h-16 backdrop-blur-2xl bg-transparent border-b border-white/10 dark:border-white/5 px-5 flex items-center justify-between relative z-[100] transition-colors duration-300">
          {/* Logo Section */}
          <div className="flex items-center cursor-pointer transition-all active:scale-95 group" onClick={() => setActiveTab('home')}>
            <div className="h-7 w-5 overflow-hidden flex-shrink-0 bg-transparent transition-transform group-hover:scale-110">
              <img
                src="/icons/stac.png"
                alt=""
                className="h-7 max-w-none object-cover dark:invert"
                style={{ objectPosition: 'left' }}
              />
            </div>
            <div className="h-7 overflow-hidden flex-shrink-0 ml-1.5 bg-transparent">
              <img
                src="/icons/stac.png"
                alt="Stac"
                className="h-7 max-w-none object-cover dark:invert"
                style={{ marginLeft: '-20px' }}
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center">
              {activeTab === 'home' && !isConnected ? (
                <button
                  onClick={() => setActiveTab('swap')}
                  className="h-[38px] px-4 rounded-lg bg-blue-500 text-white hover:bg-blue-600 active:scale-95 transition-all duration-300 font-bold text-[12px] whitespace-nowrap shadow-md shadow-blue-500/20 flex items-center justify-center group relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                  <span className="relative z-10">{t('Launch App')}</span>
                </button>
              ) : (
                <div className="flex items-center scale-90 origin-right translate-y-[1px]">
                  <CustomConnectButton connectText={t('Connect')} isMobile={true} />
                </div>
              )}
            </div>
            {/* Menu Button - Always accessible */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsMenuOpen(prev => !prev);
              }}
              className="p-2 -mr-1 text-slate-900 dark:text-white transition-all active:scale-75 touch-manipulation relative z-[99999]"
              aria-label={isMenuOpen ? t("Close Menu") : t("Open Menu")}
            >
              <div className="w-6 h-6 flex flex-col items-end justify-center gap-1.5">
                <motion.span
                  animate={isMenuOpen ? { rotate: 45, y: 4, width: '100%' } : { rotate: 0, y: 0, width: '100%' }}
                  className="block h-0.5 bg-current rounded-full"
                />
                <motion.span
                  animate={isMenuOpen ? { opacity: 0, x: 10 } : { opacity: 1, x: 0, width: '70%' }}
                  className="block h-0.5 bg-current rounded-full"
                />
                <motion.span
                  animate={isMenuOpen ? { rotate: -45, y: -4, width: '100%' } : { rotate: 0, y: 0, width: '100%' }}
                  className="block h-0.5 bg-current rounded-full"
                />
              </div>
            </button>
          </div>
        </div>

        <div className="hidden lg:grid grid-cols-3 fixed top-0 left-0 right-0 h-20 items-center px-10 backdrop-blur-2xl bg-transparent border-b border-white/10 dark:border-white/5 transition-all duration-300">
          {/* Left Section: Logo */}
          <div className="flex items-center">
            <div
              className="flex items-center cursor-pointer transition-all hover:opacity-80 active:scale-95 flex-shrink-0 group"
              onClick={() => setActiveTab('home')}
            >
              <div className="h-9 w-7 overflow-hidden flex-shrink-0 bg-transparent transition-transform group-hover:scale-110">
                <img
                  src="/icons/stac.png"
                  alt=""
                  className="h-9 max-w-none object-cover dark:invert"
                  style={{ objectPosition: 'left' }}
                />
              </div>
              <div className="h-9 overflow-hidden flex-shrink-0 ml-3 bg-transparent">
                <img
                  src="/icons/stac.png"
                  alt="Stac"
                  className="h-9 max-w-none object-cover dark:invert"
                  style={{ marginLeft: '-28px' }}
                />
              </div>
            </div>
          </div>

          {/* Center Section: Navigation */}
          <div className="flex justify-center items-center">
            <div className="flex items-center gap-1">
              {activeTab === 'home' ? (
                // Landing Page Navigation - Underline style
                landingNavItems.map((item, idx) => (
                  <a
                    key={idx}
                    href={item.href}
                    target={item.href.startsWith('http') ? '_blank' : undefined}
                    rel={item.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                    className="relative px-6 py-2 text-[14px] font-semibold transition-all duration-300 flex items-center whitespace-nowrap gap-2 group"
                  >
                    <span className={`transition-colors duration-300 ${item.comingSoon ? 'text-slate-400 cursor-not-allowed opacity-60' : 'text-slate-600 dark:text-slate-400'}`}>
                      {item.label}
                    </span>
                    {item.comingSoon && (
                      <span className="text-[8px] bg-slate-100 dark:bg-white/10 px-1.5 py-0.5 rounded-md uppercase tracking-wider font-bold text-slate-400">{t('Soon')}</span>
                    )}
                    {/* Hover underline for links */}
                    {!item.comingSoon && (
                      <div className="absolute bottom-0 left-6 right-6 h-0.5 bg-blue-600 dark:bg-blue-400 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 rounded-full" />
                    )}
                  </a>
                ))
              ) : (
                // App Navigation - Underline style
                navItems.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className="relative px-6 py-2 flex flex-col items-center cursor-pointer group"
                  >
                    <span className="text-[14px] font-semibold transition-colors duration-300 text-slate-600 dark:text-slate-400">
                      {item.label}
                    </span>
                    {/* Hover Underline (Desktop Only) */}
                    {activeTab !== item.id && (
                      <div className="absolute bottom-0 left-6 right-6 h-0.5 bg-blue-600 dark:bg-blue-400 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 rounded-full" />
                    )}
                    {activeTab === item.id && (
                      <motion.div
                        layoutId="activeTabUnderline"
                        className="absolute bottom-0 left-6 right-6 h-0.5 bg-blue-600 dark:bg-blue-400 rounded-full"
                        initial={false}
                        transition={{ type: "spring", stiffness: 380, damping: 30 }}
                      />
                    )}
                  </div>
                ))
              )}



              {/* Premium More Dropdown */}
              <div className="relative" ref={moreRef}>
                <button
                  onClick={() => setIsMoreOpen(!isMoreOpen)}
                  className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white text-[13px] font-semibold transition-colors duration-200"
                >
                  <span>{t('More')}</span>
                  <ChevronDown size={14} strokeWidth={2.5} className={`transition-transform duration-200 ${isMoreOpen ? 'rotate-180' : ''}`} />
                </button>

                <AnimatePresence>
                  {isMoreOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 15, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
                      className="absolute top-full left-0 mt-4 w-[300px] z-[200] bg-white/95 dark:bg-[#0c0c0c]/95 backdrop-blur-2xl rounded-[32px] shadow-[0_20px_50px_rgba(0,0,0,0.15)] dark:shadow-[0_25px_60px_rgba(0,0,0,0.4)] border border-slate-200/60 dark:border-white/10 overflow-hidden origin-top-left"
                    >
                      <AnimatePresence mode="wait">
                        {moreMenuPage === 'main' ? (
                          <motion.div
                            key="main"
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -10 }}
                            transition={{ duration: 0.15 }}
                          >
                            <div className="px-6 pt-6 pb-2 border-b border-gray-100/50 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.02]">
                              <span className="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">
                                {t('App Settings')}
                              </span>
                            </div>
                            <div className="p-3">
                              <button
                                onClick={() => {
                                  setShowUpdates(true);
                                  setIsMoreOpen(false);
                                }}
                                className="w-full px-3 py-3 text-left flex items-center rounded-2xl group/item transition-all duration-200 hover:bg-slate-50 dark:hover:bg-white/5 active:scale-[0.98]"
                              >
                                <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400 group-hover/item:text-slate-900 dark:group-hover/item:text-white">
                                  <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-white/5 flex items-center justify-center transition-colors group-hover/item:bg-blue-500/10 dark:group-hover/item:bg-blue-500/20">
                                    <Bell size={18} strokeWidth={2.2} className="group-hover/item:text-blue-600 dark:group-hover/item:text-blue-400" />
                                  </div>
                                  <span className="text-[14px] font-bold tracking-tight">{t("What's New")}</span>
                                </div>
                              </button>

                              <button
                                onClick={() => {
                                  setIsFeedbackOpen(true);
                                  setIsMoreOpen(false);
                                }}
                                className="w-full px-3 py-3 text-left flex items-center rounded-2xl group/item transition-all duration-200 hover:bg-slate-50 dark:hover:bg-white/5 active:scale-[0.98]"
                              >
                                <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400 group-hover/item:text-slate-900 dark:group-hover/item:text-white">
                                  <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-white/5 flex items-center justify-center transition-colors group-hover/item:bg-blue-500/10 dark:group-hover/item:bg-blue-500/20">
                                    <MessageCircle size={18} strokeWidth={2.2} className="group-hover/item:text-blue-600 dark:group-hover/item:text-blue-400" />
                                  </div>
                                  <span className="text-[14px] font-bold tracking-tight">{t("Feedback")}</span>
                                </div>
                              </button>

                              <button
                                onClick={() => setMoreMenuPage('language')}
                                className="w-full px-3 py-3 text-left flex items-center justify-between rounded-2xl group/item transition-all duration-200 hover:bg-slate-50 dark:hover:bg-white/5"
                              >
                                <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400 group-hover/item:text-slate-900 dark:group-hover/item:text-white">
                                  <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-white/5 flex items-center justify-center transition-colors group-hover/item:bg-blue-500/10 dark:group-hover/item:bg-blue-500/20">
                                    <Globe size={18} strokeWidth={2.2} className="group-hover/item:text-blue-600 dark:group-hover/item:text-blue-400" />
                                  </div>
                                  <span className="text-[14px] font-bold tracking-tight">{t("Language")}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-[11px] font-extrabold text-blue-600 dark:text-blue-400 bg-blue-600/10 dark:bg-blue-500/10 px-2.5 py-1 rounded-lg uppercase tracking-wider">{currentLang.code}</span>
                                  <ChevronRight size={14} className="text-slate-400 opacity-60 group-hover/item:opacity-100 group-hover/item:translate-x-0.5 transition-all text-slate-400" />
                                </div>
                              </button>
                            </div>
                          </motion.div>
                        ) : (
                          <motion.div
                            key="language"
                            initial={{ opacity: 0, x: 10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 10 }}
                            transition={{ duration: 0.15 }}
                          >
                            <div className="px-6 pt-6 pb-2 border-b border-gray-100/50 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.02]">
                              <button
                                onClick={() => setMoreMenuPage('main')}
                                className="flex items-center gap-2 group/back text-slate-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                              >
                                <ArrowLeft size={16} className="group-hover/back:-translate-x-0.5 transition-transform" />
                                <span className="text-[10px] font-extrabold uppercase tracking-[0.2em]">{t('Back')}</span>
                              </button>
                            </div>
                            <div className="p-3">
                              {languages.map((lang) => {
                                const isActive = i18n.language.startsWith(lang.code);
                                return (
                                  <button
                                    key={lang.code}
                                    onClick={() => {
                                      i18n.changeLanguage(lang.code);
                                    }}
                                    className={`w-full px-3 py-3 text-left flex items-center justify-between rounded-2xl group/item transition-all duration-200 active:scale-[0.98] ${isActive ? 'bg-blue-600/5 dark:bg-blue-500/10' : 'hover:bg-slate-50 dark:hover:bg-white/5'}`}
                                  >
                                    <div className="flex items-center gap-3">
                                      <div className="w-8 h-8 rounded-xl overflow-hidden border border-slate-200 dark:border-white/10 shadow-sm transition-transform group-hover/item:scale-110">
                                        <img src={lang.flag} alt="" className="w-full h-full object-cover scale-[1.2]" />
                                      </div>
                                      <span className={`text-[14px] font-bold tracking-tight ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-800 dark:text-slate-200 group-hover/item:text-slate-900 dark:group-hover/item:text-white transition-colors'}`}>{lang.name}</span>
                                    </div>
                                    {isActive && <Check size={16} className="text-blue-600 dark:text-blue-400" />}
                                  </button>
                                );
                              })}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* Right Section: Actions */}
          <div className="flex items-center justify-end gap-3">
            {/* Theme Toggle */}
            <button
              onClick={toggleDarkMode}
              className="h-[40px] w-[40px] flex items-center justify-center rounded-full text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 transition-all duration-200 active:scale-90 group"
              aria-label={t("Toggle Theme")}
            >
              {darkMode ? (
                <Moon size={18} strokeWidth={2.5} className="group-hover:text-blue-400 transition-colors" />
              ) : (
                <SunIcon size={20} className="group-hover:text-blue-600 transition-colors" />
              )}
            </button>

            {/* Wallet Button / Launch App */}
            <div className="flex items-center">
              {activeTab === 'home' && !isConnected ? (
                <button
                  onClick={() => setActiveTab('swap')}
                  className="h-[44px] px-8 rounded-xl bg-blue-500 text-white hover:bg-blue-600 active:scale-95 transition-all duration-300 font-bold text-[13px] whitespace-nowrap shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 flex items-center justify-center group relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                  <span className="relative z-10">{t('Launch App')}</span>
                </button>
              ) : (
                <div className="scale-95 origin-right">
                  <CustomConnectButton />
                </div>
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
            className="fixed inset-0 z-[7000] bg-white dark:bg-black flex flex-col lg:hidden"
          >
            {/* Absolute Close Button */}
            <button
              onClick={() => setIsMenuOpen(false)}
              className="absolute top-6 right-6 p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all bg-transparent border-none z-[7001] active:scale-75"
              aria-label={t("Close Menu")}
            >
              <X size={28} strokeWidth={2} />
            </button>

            {/* Scrollable Content Area */}
            <div className="flex-grow overflow-y-auto flex flex-col">
              {/* Navigation Links - Always visible */}
              <nav className="flex flex-col items-start px-8 pt-20 pb-8 gap-1">
                {navItems.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      setIsMenuOpen(false);
                    }}
                    className="text-[18px] font-semibold tracking-tight py-3 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all duration-300 relative cursor-pointer w-full"
                  >
                    {activeTab === item.id && (
                      <motion.div
                        layoutId="mobile-active-indicator"
                        className="absolute left-[-16px] top-1/2 -translate-y-1/2 w-1.5 h-6 bg-blue-600 dark:bg-blue-400 rounded-full shadow-[0_0_12px_rgba(37,99,235,0.4)]"
                      />
                    )}
                    {item.label}
                  </div>
                ))}

                <div
                  onClick={() => setIsThemeModalOpen(true)}
                  className="flex items-center justify-between text-[18px] font-semibold tracking-tight py-3 text-slate-500 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white transition-all duration-300 cursor-pointer w-full border-t border-slate-100 dark:border-white/5 mt-2 pt-5 group"
                >
                  <span>{t('Theme')}</span>
                  <div className="flex items-center gap-3">
                    <span className="px-3.5 py-1.5 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-[11px] font-bold tracking-tight shadow-sm border border-blue-100/50 dark:border-blue-800/20 group-hover:scale-105 transition-transform">
                      {darkMode ? t('Dark') : t('Light')}
                    </span>
                    <ChevronRight size={20} className="text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200 transition-colors" />
                  </div>
                </div>
                <LanguageSelector
                  placement="mobile-menu"
                />

                {/* Feedback as a Tab */}
                <div
                  onClick={() => setIsFeedbackOpen(true)}
                  className="text-[18px] font-semibold tracking-tight py-3 text-slate-500 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white transition-all duration-300 cursor-pointer w-full"
                >
                  {t('Feedback')}
                </div>

                {/* What's New as a Tab */}
                <div
                  onClick={() => {
                    setShowUpdates(true);
                    setIsMenuOpen(false);
                  }}
                  className="flex items-center justify-between text-[18px] font-semibold tracking-tight py-3 text-slate-500 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white transition-all duration-300 cursor-pointer w-full border-t border-slate-100 dark:border-white/5 mt-2 pt-5 group"
                >
                  <span>{t("What's New")}</span>
                  <div className="flex items-center gap-3">
                    <span className="px-3.5 py-1.5 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-[11px] font-bold tracking-tight shadow-sm border border-blue-100/50 dark:border-blue-800/20 group-hover:scale-105 transition-transform">
                      {t('Latest')}
                    </span>
                  </div>
                </div>
              </nav>

              {/* Bottom Controls Area - Pushed to bottom with mt-auto */}
              <div className="mt-auto w-full flex flex-col px-8 pb-6">
                <div className="flex flex-col items-center gap-1.5 text-slate-400 dark:text-slate-600 text-[10px] font-semibold uppercase tracking-[0.2em]">
                  <div className="flex items-center gap-2">
                    <span>Built by :</span>
                    <a
                      href="https://x.com/linux_mode"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-semibold uppercase tracking-[0.15em]"
                    >
                      Linux
                    </a>
                  </div>
                  <span className="opacity-50 text-[8px] font-semibold tracking-[0.3em]">© 2026 Stac</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isThemeModalOpen && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-[20000] bg-white dark:bg-black flex flex-col p-6 overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-8">
              <button onClick={() => setIsThemeModalOpen(false)} className="p-2 -ml-2 text-slate-600 dark:text-slate-300 active:scale-90 transition-all">
                <ArrowLeft size={24} />
              </button>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">{t('Theme')}</h2>
              <div className="w-10" /> {/* Spacer */}
            </div>

            <div className="space-y-1">
              {[
                {
                  id: 'light',
                  label: t('Light'),
                  active: !darkMode,
                  icon: <SunIcon size={20} />
                },
                {
                  id: 'dark',
                  label: t('Dark'),
                  active: darkMode,
                  icon: <Moon size={18} strokeWidth={2.5} />
                }
              ].map((option) => (
                <button
                  key={option.id}
                  onClick={() => {
                    if (option.id === 'light' && darkMode) toggleDarkMode();
                    if (option.id === 'dark' && !darkMode) toggleDarkMode();
                  }}
                  className={`w-full py-4 px-2 flex items-center justify-between group transition-all
                    ${option.active ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`${option.active ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500'}`}>
                      {option.icon}
                    </div>
                    <span className="text-[17px] font-semibold">{option.label}</span>
                  </div>
                  {option.active && <Check size={20} className="text-blue-600 dark:text-blue-400" />}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <main className={`flex-grow w-full ${activeTab === 'home' ? 'bg-transparent pt-0 lg:pt-0 pb-0' : ['swap', 'bridge'].includes(activeTab) ? 'bg-transparent pt-20 lg:pt-28 pb-0' : 'bg-white dark:bg-black pt-20 lg:pt-20 pb-12'} text-slate-900 dark:text-white overflow-x-hidden relative z-10 flex flex-col`}>
        {children}
      </main>

      {/* Footer moved to Home.jsx for better reload synchronization */}


      <FeedbackButton
        isOpen={isFeedbackOpen}
        setIsOpen={setIsFeedbackOpen}
      />

      {/* Global Updates Modal */}
      <UpdatesModal
        isOpen={showUpdates}
        onClose={() => setShowUpdates(false)}
      />
    </div >
  );
};

export default Layout;