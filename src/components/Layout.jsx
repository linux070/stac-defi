import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useAccount } from 'wagmi';
import { useTheme } from '../hooks/useTheme';
import {
  X, Moon, ChevronRight, ArrowLeft, Check, ChevronDown, Bell, Globe
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

  const { status, isConnected, address } = useAccount();

  // Capture initial localStorage value in a ref so it survives wagmi's
  // transient 'disconnected' status that fires on page refresh before reconnection.
  const wasConnectedRef = useRef(
    typeof window !== 'undefined' ? localStorage.getItem('walletConnected') === 'true' : false
  );

  // Keep ref in sync with actual connection state
  useEffect(() => {
    if (isConnected && address) {
      wasConnectedRef.current = true;
    }
  }, [isConnected, address]);

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

  useEffect(() => {
    if (!isMoreOpen) {
      setTimeout(() => setMoreMenuPage('main'), 200);
    }
  }, [isMoreOpen]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (moreRef.current && !moreRef.current.contains(event.target)) {
        setIsMoreOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

  useEffect(() => {
    setIsMenuOpen(false);
    document.body.style.overflow = '';
  }, [activeTab]);

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
      {(activeTab === 'swap' || activeTab === 'bridge') && <BackgroundGradient />}

      <div className="fixed top-0 left-0 right-0 z-[100]">
        <div className="lg:hidden w-full h-16 bg-transparent px-5 flex items-center justify-between relative z-[100] transition-colors duration-300">
          <div className="flex items-center cursor-pointer transition-all active:scale-95 group" onClick={() => setActiveTab('home')}>
            <div className="h-7 w-5 overflow-hidden flex-shrink-0 bg-transparent transition-transform group-hover:scale-110">
              <img src="/icons/stac.png" alt="" className="h-7 max-w-none object-cover dark:invert" style={{ objectPosition: 'left' }} />
            </div>
            <div className="h-7 overflow-hidden flex-shrink-0 ml-1.5 bg-transparent">
              <img src="/icons/stac.png" alt="Stac" className="h-7 max-w-none object-cover dark:invert" style={{ marginLeft: '-20px' }} />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center">
              {(() => {
                const wasConnected = wasConnectedRef.current;
                const isReturningUser = wasConnected || status === 'reconnecting' || status === 'connecting';
                const showLaunchApp = activeTab === 'home' && status === 'disconnected' && !isReturningUser;

                return showLaunchApp ? (
                  <button
                    onClick={() => setActiveTab('swap')}
                    className="h-[38px] px-5 rounded-lg bg-black dark:bg-white text-white dark:text-black hover:bg-black/90 dark:hover:bg-white/90 active:scale-95 transition-all duration-300 font-bold text-[12px] whitespace-nowrap flex items-center justify-center group relative overflow-hidden"
                  >
                    <span className="relative z-10">{t('Launch App')}</span>
                  </button>
                ) : (
                  <div className="flex items-center scale-90 origin-right translate-y-[1px]">
                    <CustomConnectButton connectText={t('Connect')} isMobile={true} />
                  </div>
                );
              })()}
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsMenuOpen(prev => !prev);
              }}
              className="p-2 -mr-1 text-black dark:text-white transition-all active:scale-75 touch-manipulation relative z-[99999]"
              aria-label={isMenuOpen ? t("Close Menu") : t("Open Menu")}
            >
              <div className="w-6 h-6 flex flex-col items-end justify-center gap-1.5">
                <motion.span animate={isMenuOpen ? { rotate: 45, y: 4, width: '100%' } : { rotate: 0, y: 0, width: '100%' }} className="block h-0.5 bg-current rounded-full" />
                <motion.span animate={isMenuOpen ? { opacity: 0, x: 10 } : { opacity: 1, x: 0, width: '70%' }} className="block h-0.5 bg-current rounded-full" />
                <motion.span animate={isMenuOpen ? { rotate: -45, y: -4, width: '100%' } : { rotate: 0, y: 0, width: '100%' }} className="block h-0.5 bg-current rounded-full" />
              </div>
            </button>
          </div>
        </div>

        {/* Desktop Header - Refined Nav Positions */}
        <div className="hidden lg:grid grid-cols-[1fr_auto_1fr] fixed top-0 left-0 right-0 h-20 items-center px-10 bg-transparent transition-all duration-300">
          {/* Column 1: Logo */}
          <div className="flex items-center">
            <div className="flex items-center cursor-pointer transition-all hover:opacity-80 active:scale-95 flex-shrink-0 group" onClick={() => setActiveTab('home')}>
              <div className="h-9 w-7 overflow-hidden flex-shrink-0 bg-transparent transition-transform group-hover:scale-110">
                <img src="/icons/stac.png" alt="" className="h-9 max-w-none object-cover dark:invert" style={{ objectPosition: 'left' }} />
              </div>
              <div className="h-9 overflow-hidden flex-shrink-0 ml-3 bg-transparent">
                <img src="/icons/stac.png" alt="Stac" className="h-9 max-w-none object-cover dark:invert" style={{ marginLeft: '-28px' }} />
              </div>
            </div>
          </div>

          {/* Column 2: Navigation Groups (Centered) */}
          <div className="flex items-center justify-center h-full">
            <div className="flex items-center h-full">
              {activeTab === 'home' ? (
                landingNavItems.map((item, idx) => (
                  <a
                    key={idx}
                    href={item.href}
                    target={item.href.startsWith('http') ? '_blank' : undefined}
                    rel={item.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                    className={`relative px-5 py-2 text-[14px] font-semibold transition-all duration-300 flex items-center whitespace-nowrap gap-2 group ${item.comingSoon ? 'cursor-not-allowed' : ''}`}
                  >
                    <span className={`transition-colors duration-300 ${item.comingSoon ? 'text-slate-400 opacity-60' : 'text-slate-600 dark:text-slate-400 group-hover:text-black dark:group-hover:text-white'}`}>
                      {item.label}
                    </span>
                    {item.comingSoon && (
                      <span className="text-[8px] bg-slate-100 dark:bg-white/10 px-1.5 py-0.5 rounded-md uppercase tracking-wider font-bold text-slate-400">{t('Soon')}</span>
                    )}
                    {!item.comingSoon && (
                      <div className="absolute bottom-[1px] left-0 right-0 h-[3px] bg-black dark:bg-black dark:bg-white scale-x-0 group-hover:scale-x-100 transition-all duration-300 rounded-full" />
                    )}
                  </a>
                ))
              ) : (
                navItems.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className="relative px-5 py-2 flex flex-col items-center cursor-pointer group"
                  >
                    <span className={`text-[14px] font-semibold transition-colors duration-300 ${activeTab === item.id ? 'text-black dark:text-white' : 'text-slate-600 dark:text-slate-400'}`}>
                      {item.label}
                    </span>
                    {activeTab === item.id && (
                      <motion.div
                        layoutId="activeTabUnderline"
                        className="absolute bottom-[1px] left-0 right-0 h-[3px] bg-black dark:bg-black dark:bg-white rounded-full"
                        initial={false}
                        transition={{ type: "spring", stiffness: 380, damping: 30 }}
                      />
                    )}
                  </div>
                ))
              )}

              {/* More Tab - Minimalism (No Underline) */}
              <div className="relative h-full flex items-center" ref={moreRef}>
                <div
                  onClick={() => setIsMoreOpen(!isMoreOpen)}
                  className="relative px-5 py-2 flex items-center cursor-pointer group h-full justify-center transition-all duration-200"
                >
                  <div className={`flex items-center gap-1.5 transition-all duration-200 text-sm font-bold tracking-wider ${isMoreOpen ? 'text-black dark:text-white' : 'text-slate-500 dark:text-slate-400 hover:text-black dark:hover:text-white'}`}>
                    <span>{t('More')}</span>
                    <ChevronDown size={14} strokeWidth={2.5} className={`transition-transform duration-300 ${isMoreOpen ? 'rotate-180' : ''}`} />
                  </div>
                </div>

                <AnimatePresence>
                  {isMoreOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.99 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.99 }}
                      transition={{ duration: 0.15, ease: 'easeOut' }}
                      className="absolute top-[calc(100%-8px)] left-0 w-[220px] z-[2000] bg-white dark:bg-[#161616] rounded-[14px] border border-slate-200 dark:border-white/10 shadow-xl dark:shadow-none overflow-hidden origin-top-left backdrop-blur-3xl"
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
                            <div className="px-5 pt-5 pb-2 border-b border-gray-100/50 dark:border-white/5 bg-slate-50/50 dark:bg-black">
                              <span className="text-[10px] font-bold text-slate-400 dark:text-white/30 uppercase tracking-[0.2em]">
                                {t('App Settings')}
                              </span>
                            </div>
                            <div className="py-2">
                              {/* What's New */}
                              <button
                                onClick={() => {
                                  setShowUpdates(true);
                                  setIsMoreOpen(false);
                                }}
                                className="w-full px-6 py-3.5 text-left flex items-center group/item transition-all duration-200 hover:bg-slate-100 dark:hover:bg-white/10"
                              >
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center transition-all duration-300 group-hover/item:bg-black dark:group-hover/item:bg-white">
                                    <Bell size={15} strokeWidth={2.5} className="text-slate-600 dark:text-slate-400 group-hover/item:text-white dark:group-hover/item:text-black transition-colors" />
                                  </div>
                                  <span className="text-[14px] font-bold text-slate-600 dark:text-slate-400 group-hover/item:text-black dark:group-hover/item:text-white transition-colors">{t("What's New")}</span>
                                </div>
                              </button>

                              {/* Language */}
                              <button
                                onClick={() => setMoreMenuPage('language')}
                                className="w-full px-6 py-3.5 text-left flex items-center justify-between group/item transition-all duration-200 hover:bg-slate-100 dark:hover:bg-white/10"
                              >
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center transition-all duration-300 group-hover/item:bg-black dark:group-hover/item:bg-white">
                                    <Globe size={15} strokeWidth={2.5} className="text-slate-600 dark:text-slate-400 group-hover/item:text-white dark:group-hover/item:text-black transition-colors" />
                                  </div>
                                  <span className="text-[14px] font-bold text-slate-600 dark:text-slate-400 group-hover/item:text-black dark:group-hover/item:text-white transition-colors">{t("Language")}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] font-bold text-black dark:text-white bg-slate-100 dark:bg-white/10 px-2.5 py-1 rounded-lg uppercase tracking-wider">{currentLang.code}</span>
                                  <ChevronRight size={14} className="text-slate-400 group-hover/item:translate-x-0.5 transition-all" />
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
                            <div className="px-5 pt-5 pb-2 border-b border-gray-100/50 dark:border-white/5 bg-slate-50/50 dark:bg-black">
                              <button
                                onClick={() => setMoreMenuPage('main')}
                                className="flex items-center gap-2 group/back text-slate-400 dark:text-white/30 hover:text-black dark:text-white dark:hover:text-black dark:text-white transition-colors"
                              >
                                <ArrowLeft size={14} className="group-hover/back:-translate-x-0.5 transition-transform" />
                                <span className="text-[9px] font-bold uppercase tracking-[0.2em]">{t('Back')}</span>
                              </button>
                            </div>
                            <div className="py-2">
                              {languages.map((lang) => {
                                const isActive = i18n.language.startsWith(lang.code);
                                return (
                                  <button
                                    key={lang.code}
                                    onClick={() => i18n.changeLanguage(lang.code)}
                                    className={`w-full px-5 py-2.5 text-left flex items-center justify-between group/item transition-all duration-200 active:scale-[0.98] ${isActive ? 'bg-slate-100 dark:bg-white/[0.08]' : 'hover:bg-slate-100 dark:hover:bg-white/10'}`}
                                  >
                                    <div className="flex items-center gap-3">
                                      <div className="w-5 h-5 rounded-full overflow-hidden border border-slate-200 dark:border-white/10 shadow-sm transition-transform group-hover/item:scale-110">
                                        <img src={lang.flag} alt="" className="w-full h-full object-cover" />
                                      </div>
                                      <span className={`text-[13px] tracking-tight ${isActive ? 'text-black dark:text-white font-bold' : 'text-slate-500 dark:text-white/60 group-hover/item:text-slate-800 dark:group-hover/item:text-white transition-colors'}`}>{lang.name}</span>
                                    </div>
                                    {isActive && <Check size={14} className="text-black dark:text-white dark:text-white" />}
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

          {/* Column 3: Actions (Right) */}
          <div className="flex items-center justify-end gap-3 h-full">
            <button
              onClick={toggleDarkMode}
              className="h-[40px] w-[40px] flex items-center justify-center rounded-xl text-slate-700 dark:text-white hover:bg-slate-100 dark:hover:bg-white/10 active:scale-90 group"
              aria-label={t("Toggle Theme")}
            >
              {darkMode ? (
                <Moon size={18} strokeWidth={2.5} className="group-hover:text-black dark:group-hover:text-white" />
              ) : (
                <SunIcon size={20} className="group-hover:text-black dark:group-hover:text-white" />
              )}
            </button>

            <div className="flex items-center">
              {(() => {
                const wasConnected = wasConnectedRef.current;
                const isReturningUser = wasConnected || status === 'reconnecting' || status === 'connecting';
                const showLaunchApp = activeTab === 'home' && status === 'disconnected' && !isReturningUser;

                return showLaunchApp ? (
                  <button
                    onClick={() => setActiveTab('swap')}
                    className="h-[44px] px-8 rounded-xl bg-black dark:bg-white text-white dark:text-black hover:bg-black/90 dark:hover:bg-white/90 active:scale-95 transition-all duration-300 font-bold text-[13px] whitespace-nowrap flex items-center justify-center group relative overflow-hidden"
                  >
                    <span className="relative z-10">{t('Launch App')}</span>
                  </button>
                ) : (
                  <div className="scale-95 origin-right">
                    <CustomConnectButton />
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[7000] bg-white dark:bg-black flex flex-col lg:hidden"
          >
            <button onClick={() => setIsMenuOpen(false)} className="absolute top-6 right-6 p-2 text-slate-500 dark:text-slate-400 hover:text-black dark:hover:text-white transition-all bg-transparent border-none z-[7001] active:scale-75">
              <X size={28} strokeWidth={2} />
            </button>
            <div className="flex-grow overflow-y-auto flex flex-col">
              <nav className="flex flex-col items-start px-8 pt-20 pb-8 gap-1">
                {navItems.map((item) => (
                  <div key={item.id} onClick={() => { setActiveTab(item.id); setIsMenuOpen(false); }} className="text-[18px] font-semibold tracking-tight py-3 text-slate-500 dark:text-slate-400 hover:text-black dark:hover:text-white transition-all duration-300 relative cursor-pointer w-full">
                    {activeTab === item.id && <motion.div layoutId="mobile-active-indicator" className="absolute left-[-16px] top-1/2 -translate-y-1/2 w-1.5 h-6 bg-black dark:bg-black dark:bg-white rounded-full shadow-[0_0_12px_rgba(37,99,235,0.4)]" />}
                    {item.label}
                  </div>
                ))}
                <div onClick={() => setIsThemeModalOpen(true)} className="flex items-center justify-between text-[18px] font-semibold tracking-tight py-3 text-slate-500 dark:text-slate-500 hover:text-black dark:hover:text-white transition-all duration-300 cursor-pointer w-full border-t border-slate-100 dark:border-white/5 mt-2 pt-5 group">
                  <span>{t('Theme')}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-black dark:text-white text-[14px] font-bold tracking-tight opacity-70">{darkMode ? t('Dark') : t('Light')}</span>
                    <ChevronRight size={20} className="text-slate-400" />
                  </div>
                </div>
                <LanguageSelector placement="mobile-menu" />
                <div onClick={() => setIsFeedbackOpen(true)} className="text-[18px] font-semibold tracking-tight py-3 text-slate-500 dark:text-slate-400 hover:text-black dark:hover:text-white transition-all duration-300 cursor-pointer w-full">{t('Feedback')}</div>
                <div onClick={() => { setShowUpdates(true); setIsMenuOpen(false); }} className="flex items-center justify-between text-[18px] font-semibold tracking-tight py-3 text-slate-500 dark:text-slate-400 hover:text-black dark:hover:text-white transition-all duration-300 cursor-pointer w-full border-t border-slate-100 dark:border-white/5 mt-2 pt-5 group">
                  <span>{t("What's New")}</span>
                  <div className="flex items-center gap-3">
                    <span className="px-4 py-1.5 rounded-xl bg-black dark:bg-white text-white dark:text-black text-[12px] font-medium tracking-wider active:scale-95 transition-all">
                      {t('Latest')}
                    </span>
                  </div>
                </div>
              </nav>
              <div className="mt-auto w-full flex flex-col px-8 pb-6">
                <div className="flex flex-col items-center gap-2 text-slate-400 dark:text-slate-600 text-[11px] font-bold uppercase tracking-[0.2em]">
                  <div className="flex items-center gap-2">
                    <span className="opacity-50">Built by :</span>
                    <a href="https://x.com/linux_mode" target="_blank" rel="noopener noreferrer" className="text-slate-500 dark:text-slate-400 hover:text-black dark:hover:text-white transition-all duration-300 font-bold uppercase tracking-[0.2em]">Linux</a>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isThemeModalOpen && (
          <motion.div
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-[20000] bg-white dark:bg-black flex flex-col p-6 overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-8">
              <button onClick={() => setIsThemeModalOpen(false)} className="p-2 -ml-2 text-slate-600 dark:text-slate-300 active:scale-90 transition-all"><ArrowLeft size={24} /></button>
              <h2 className="text-xl font-bold text-black dark:text-white">{t('Theme')}</h2>
              <div className="w-10" />
            </div>
            <div className="space-y-1">
              {[
                { id: 'light', label: t('Light'), active: !darkMode, icon: <SunIcon size={20} /> },
                { id: 'dark', label: t('Dark'), active: darkMode, icon: <Moon size={18} strokeWidth={2.5} /> }
              ].map((option) => (
                <button
                  key={option.id}
                  onClick={() => { if (option.id === 'light' && darkMode) toggleDarkMode(); if (option.id === 'dark' && !darkMode) toggleDarkMode(); }}
                  className={`w-full py-4 px-2 flex items-center justify-between group transition-all ${option.active ? 'text-black dark:text-white dark:text-white' : 'text-slate-500 dark:text-slate-400 hover:text-black dark:hover:text-white'}`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`${option.active ? 'text-black dark:text-white dark:text-white' : 'text-slate-400 dark:text-slate-500'}`}>{option.icon}</div>
                    <span className="text-[17px] font-semibold">{option.label}</span>
                  </div>
                  {option.active && <Check size={20} className="text-black dark:text-white dark:text-white" />}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className={`flex-grow w-full ${activeTab === 'home' ? 'bg-transparent pt-0 lg:pt-0 pb-0' : ['swap', 'bridge'].includes(activeTab) ? 'bg-transparent pt-20 lg:pt-28 pb-0' : 'bg-white dark:bg-black pt-20 lg:pt-20 pb-12'} text-black dark:text-white overflow-x-hidden relative z-10 flex flex-col`}>
        {children}
      </main>

      {/* Global Feedback Component */}
      <FeedbackButton isOpen={isFeedbackOpen} setIsOpen={setIsFeedbackOpen} />

      {/* Global Updates Modal */}
      <UpdatesModal isOpen={showUpdates} onClose={() => setShowUpdates(false)} />
    </div>
  );
};

export default Layout;