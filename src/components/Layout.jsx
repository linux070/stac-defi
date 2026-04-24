import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useAccount } from 'wagmi';
import { useTheme } from '../hooks/useTheme';
import { 
  Menu, 
  X,
  ChevronRight, 
  ArrowLeft,
  Check,
  Moon,
  Sun as SunIcon,
  FileText,
  MessageSquare,
  Activity
} from 'lucide-react';
import UpdatesModal from './UpdatesModal';
import { motion, AnimatePresence } from 'framer-motion';
import BackgroundGradient from './BackgroundGradient';
import FeedbackButton from './FeedbackButton';
import CustomConnectButton from './CustomConnectButton';
import StacLogo from './StacLogo';

const ThemeToggle = ({ darkMode, toggleDarkMode, isLarge = true }) => {
  return (
    <div 
      onClick={(e) => { e.stopPropagation(); toggleDarkMode(); }}
      className={`relative flex items-center p-1.5 rounded-full cursor-pointer active:scale-95 transition-colors duration-200 ${
        isLarge ? 'w-[56px] h-[32px]' : 'w-[44px] h-[24px]'
      } ${
        darkMode 
          ? 'bg-brand shadow-[inset_0_2px_4px_rgba(0,0,0,0.1)]' 
          : 'bg-slate-200/50 shelf-inner'
      }`}
    >
      {/* Sliding Thumb */}
      <motion.div 
        animate={{ x: darkMode ? (isLarge ? 24 : 20) : 0 }}
        transition={{ type: "spring", stiffness: 700, damping: 35 }}
        className={`rounded-full flex items-center justify-center shadow-lg ${
          isLarge ? 'w-5 h-5' : 'w-3.5 h-3.5'
        } ${
          darkMode ? 'bg-white' : 'bg-white'
        }`}
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={darkMode ? 'moon' : 'sun'}
            initial={{ opacity: 0, scale: 0.8, rotate: -45 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            exit={{ opacity: 0, scale: 0.8, rotate: 45 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
          >
            {darkMode ? (
              <Moon size={isLarge ? 11 : 9} className="text-brand" strokeWidth={3} />
            ) : (
              <SunIcon size={isLarge ? 11 : 9} className="text-slate-600" strokeWidth={3} />
            )}
          </motion.div>
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

const Layout = ({ children, activeTab, setActiveTab }) => {
  const { t, i18n } = useTranslation();
  const { darkMode, toggleDarkMode } = useTheme();

  const { isConnected, address } = useAccount();

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
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settingsPage, setSettingsPage] = useState('main');
  const settingsRef = useRef(null);

  const languages = [
    { code: 'en', name: 'English', flag: 'https://flagcdn.com/w80/us.png' },
    { code: 'es', name: 'Español', flag: 'https://flagcdn.com/w80/es.png' },
    { code: 'fr', name: 'Français', flag: 'https://flagcdn.com/w80/fr.png' },
    { code: 'de', name: 'Deutsch', flag: 'https://flagcdn.com/w80/de.png' },
    { code: 'zh', name: '中文', flag: 'https://flagcdn.com/w80/cn.png' }
  ];

  const currentLang = languages.find(l => i18n.language.startsWith(l.code)) || languages[0];

  useEffect(() => {
    if (!isSettingsOpen && !isMenuOpen) {
      setTimeout(() => setSettingsPage('main'), 200);
    }
  }, [isSettingsOpen, isMenuOpen]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (settingsRef.current && !settingsRef.current.contains(event.target)) {
        setIsSettingsOpen(false);
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
    { id: 'home', label: t('Home') },
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
    <div className={`min-h-[100dvh] flex flex-col bg-white dark:bg-page-dark ${['home', 'swap', 'bridge'].includes(activeTab) ? 'bg-transparent' : ''}`}>
      {/* Global Background Gradient to fill visual voids */}
      <BackgroundGradient />

      <div className={`fixed top-0 left-0 right-0 ${isMenuOpen ? 'z-[11000]' : 'z-[100]'}`}>
        <div className="lg:hidden w-full h-[64px] bg-white/80 dark:bg-page-dark/80 backdrop-blur-md border-b border-slate-100 dark:border-white/5 px-5 flex items-center justify-between relative transition-colors duration-300">
          <div className="flex items-center cursor-pointer group gap-2" onClick={() => setActiveTab('home')}>
            <StacLogo darkMode={darkMode} className="h-8 w-8 flex-shrink-0" />
            <span className="text-[22px] font-medium tracking-tight text-slate-900 dark:text-white font-sans pt-0.5">STAC</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center">
              {(() => {
                const isHome = activeTab === 'home';

                if (isHome && !isConnected && !wasConnectedRef.current) {
                  return (
                    <button
                      onClick={() => setActiveTab('swap')}
                      className="h-[38px] px-5 rounded-lg bg-brand text-white hover:bg-brand-hover active:scale-98 active:-translate-y-[1px] transition-colors duration-300 font-bold text-[12px] whitespace-nowrap flex items-center justify-center group relative overflow-hidden"
                    >
                      <span className="relative z-10">{t('Get Started')}</span>
                    </button>
                  );
                }
                return (
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
              className="w-[42px] h-[42px] flex items-center justify-center rounded-xl bg-transparent border border-slate-200/50 dark:border-white/10 text-slate-900 dark:text-white backdrop-blur-sm transition-colors active:scale-95 touch-manipulation relative z-[10002]"
              aria-label={isMenuOpen ? t("Close Menu") : t("Open Menu")}
            >
              <div className="w-5 h-4 flex flex-col items-center justify-between">
                <motion.span 
                  animate={isMenuOpen ? { rotate: 45, y: 6 } : { rotate: 0, y: 0 }} 
                  className="block w-full h-[2px] bg-current rounded-full origin-center" 
                />
                {!isMenuOpen && <span className="block w-full h-[2px] bg-current rounded-full" />}
                <motion.span 
                  animate={isMenuOpen ? { rotate: -45, y: -6 } : { rotate: 0, y: 0 }} 
                  className="block w-full h-[2px] bg-current rounded-full origin-center" 
                />
              </div>
            </button>
          </div>
        </div>

        {/* Desktop Header - Refined Nav Positions */}
        <div className="hidden lg:grid grid-cols-[1fr_auto_1fr] fixed top-0 left-0 right-0 h-20 items-center px-10 bg-transparent transition-colors duration-300">
          {/* Column 1: Logo */}
          <div className="flex items-center">
            <div className="flex items-center cursor-pointer flex-shrink-0 group gap-2.5" onClick={() => setActiveTab('home')}>
              <StacLogo darkMode={darkMode} className="h-9 w-9 flex-shrink-0" />
              <span className="text-2xl font-medium tracking-tight text-slate-900 dark:text-white font-sans pt-0.5">STAC</span>
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
                    className={`relative px-4 py-2 text-[14px] font-semibold transition-all duration-300 flex items-center whitespace-nowrap gap-2 group ${item.comingSoon ? 'cursor-not-allowed' : ''}`}
                  >
                    <span className={`transition-colors duration-300 ${item.comingSoon ? 'text-secondary/40' : 'text-secondary/80 dark:text-secondary group-hover:text-black dark:group-hover:text-white'}`}>
                      {item.label}
                    </span>
                    {item.comingSoon && (
                      <span className="text-[8px] bg-slate-100 dark:bg-surface-dark px-1.5 py-0.5 rounded-md uppercase tracking-wider font-bold text-secondary">{t('Soon')}</span>
                    )}
                    {!item.comingSoon && (
                      <div className="absolute bottom-[1px] left-0 right-0 h-[2px] bg-brand scale-x-0 group-hover:scale-x-100 transition-all duration-300 rounded-full" />
                    )}
                  </a>
                ))
              ) : (
                navItems.filter(item => item.id !== 'home').map((item) => (
                  <div
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className="relative px-3.5 py-2 flex flex-col items-center cursor-pointer group"
                  >
                    <span className={`text-[14px] font-semibold transition-colors duration-300 ${activeTab === item.id ? 'text-black dark:text-white' : 'text-secondary/80 dark:text-secondary'}`}>
                      {item.label}
                    </span>
                    {activeTab === item.id && (
                      <motion.div
                        layoutId="activeTabUnderline"
                        className="absolute bottom-[1px] left-0 right-0 h-[2px] bg-brand rounded-full"
                        initial={false}
                        transition={{ type: "spring", stiffness: 380, damping: 30 }}
                      />
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Column 3: Actions (Right) */}
          <div className="flex items-center justify-end gap-3 h-full">
            {activeTab !== 'home' && (
              <div className="flex items-center mr-2">
                <ThemeToggle darkMode={darkMode} toggleDarkMode={toggleDarkMode} isLarge={activeTab !== 'home'} />
              </div>
            )}

            {/* Landing page settings hamburger menu */}
            {activeTab === 'home' && (
              <div className="relative" ref={settingsRef}>
                <button
                  onClick={() => setIsSettingsOpen(!isSettingsOpen)}
                  className="h-[40px] w-[40px] flex items-center justify-center rounded-xl text-slate-700 dark:text-white hover:bg-slate-100 dark:hover:bg-white/10 active:scale-90 group"
                  aria-label={t('Settings')}
                >
                  <Menu size={20} strokeWidth={2.5} className="group-hover:text-black dark:group-hover:text-white" />
                </button>

                <AnimatePresence>
                  {isSettingsOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 8, scale: 0.97 }}
                      transition={{ duration: 0.15, ease: 'easeOut' }}
                      className="absolute top-[calc(100%+12px)] right-0 w-[280px] z-[2000] bg-white/60 dark:bg-zinc-950/60 rounded-[2.5rem] border border-white/20 dark:border-white/[0.05] shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] dark:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.05)] overflow-hidden origin-top-right backdrop-blur-[24px]"
                    >
                      <AnimatePresence mode="wait">
                        {settingsPage === 'main' ? (
                          <motion.div
                            key="settings-main"
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -10 }}
                            transition={{ duration: 0.2, type: 'spring', stiffness: 100, damping: 20 }}
                          >
                            <div className="p-4 space-y-1">
                              {/* Theme Toggle */}
                              <div
                                className="w-full px-5 py-3.5 flex items-center justify-between transition-all duration-300 rounded-[1.5rem]"
                              >
                                <span className="text-[15px] font-medium text-slate-700 dark:text-slate-300 transition-colors tracking-tight font-['Satoshi','Inter',sans-serif]">{t('Theme')}</span>
                                <ThemeToggle darkMode={darkMode} toggleDarkMode={toggleDarkMode} isLarge={false} />
                              </div>

                              {/* What's New */}
                              <button
                                onClick={() => {
                                  setShowUpdates(true);
                                  setIsSettingsOpen(false);
                                }}
                                className="w-full px-5 py-4 text-left flex items-center justify-between group/item transition-all duration-300 rounded-[1.5rem] hover:bg-white dark:hover:bg-white/5 active:scale-[0.98] active:-translate-y-[1px]"
                              >
                                <div className="flex items-center gap-2">
                                  <span className="text-[15px] font-medium text-slate-700 dark:text-slate-300 group-hover/item:text-black dark:group-hover/item:text-white transition-colors tracking-tight font-['Satoshi','Inter',sans-serif]">{t("What's New")}</span>
                                </div>
                                <div className="bg-brand text-white px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest shadow-lg shadow-brand/30 transition-all duration-300 group-hover/item:scale-110">
                                  {t('NEW')}
                                </div>
                              </button>



                              {/* Resources */}
                              <button
                                onClick={() => setSettingsPage('resources')}
                                className="w-full px-5 py-4 text-left flex items-center justify-between group/item transition-all duration-300 rounded-[1.5rem] hover:bg-white dark:hover:bg-white/5 active:scale-[0.98] active:-translate-y-[1px]"
                              >
                                <span className="text-[15px] font-medium text-slate-700 dark:text-slate-300 group-hover/item:text-black dark:group-hover/item:text-white transition-colors tracking-tight font-['Satoshi','Inter',sans-serif]">{t('Resources')}</span>
                                <ChevronRight size={14} strokeWidth={2.5} className="text-slate-400 group-hover/item:text-brand transition-all" />
                              </button>

                              {/* Language */}
                              <button
                                onClick={() => setSettingsPage('language')}
                                className="w-full px-5 py-4 text-left flex items-center justify-between group/item transition-all duration-300 rounded-[1.5rem] hover:bg-white dark:hover:bg-white/5 active:scale-[0.98] active:-translate-y-[1px]"
                              >
                                <span className="text-[15px] font-medium text-slate-700 dark:text-white/90 group-hover/item:text-black dark:group-hover/item:text-white transition-colors tracking-tight font-['Satoshi','Inter',sans-serif]">{t('Language')}</span>
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[12px] font-medium text-slate-500 transition-colors uppercase">{currentLang.code}</span>
                                  <ChevronRight size={14} strokeWidth={2.5} className="text-slate-400 group-hover/item:text-brand transition-all" />
                                </div>
                              </button>
                            </div>
                          </motion.div>
                        ) : settingsPage === 'language' ? (
                          <motion.div
                            key="settings-language"
                            initial={{ opacity: 0, x: 10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 10 }}
                            transition={{ duration: 0.15 }}
                          >
                            <div className="px-5 pt-5 pb-3 bg-slate-50/30 dark:bg-white/[0.02]">
                               <button
                                 onClick={() => setSettingsPage('main')}
                                 className="flex items-center gap-2.5 group/back text-slate-500 dark:text-white/60 hover:text-brand dark:hover:text-white"
                               >
                                 <div className="p-1.5 rounded-lg bg-white dark:bg-surface-dark border border-slate-200 dark:border-brand-border shadow-sm">
                                   <ArrowLeft size={12} strokeWidth={3} className="text-slate-500 dark:text-white/60" />
                                 </div>
                                 <span className="text-[13px] font-medium tracking-tight text-slate-500 dark:text-white/70">{t('Back')}</span>
                               </button>
                             </div>
                            <div className="py-2 px-1">
                              {languages.map((lang) => {
                                const isActive = i18n.language.startsWith(lang.code);
                                return (
                                  <button
                                    key={lang.code}
                                    onClick={() => { i18n.changeLanguage(lang.code); setIsSettingsOpen(false); }}
                                    className={`w-full px-4 py-3 text-left flex items-center justify-between group/item transition-all duration-300 rounded-xl active:scale-[0.98] ${isActive ? 'bg-slate-50 dark:bg-brand-muted/20' : 'hover:bg-slate-50/50 dark:hover:bg-white/5'}`}
                                  >
                                    <div className="flex items-center gap-3">
                                      <div className="w-6 h-6 rounded-full overflow-hidden border border-slate-200 dark:border-brand-border shadow-sm transition-transform group-hover/item:scale-110">
                                        <img src={lang.flag} alt="" className="w-full h-full object-cover" />
                                      </div>
                                      <span className={`text-[14px] tracking-tight font-medium ${isActive ? 'text-black dark:text-white font-semibold' : 'text-slate-500 dark:text-secondary group-hover/item:text-slate-800 dark:group-hover/item:text-white transition-colors'}`}>{lang.name}</span>
                                    </div>
                                    {isActive && (
                                       <Check size={16} strokeWidth={3} className="text-secondary/60 dark:text-secondary/40" />
                                    )}
                                  </button>
                                );
                              })}
                            </div>
                          </motion.div>
                        ) : (
                          <motion.div
                            key="settings-resources"
                            initial={{ opacity: 0, x: 10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 10 }}
                            transition={{ duration: 0.15 }}
                          >
                             <div className="px-5 pt-5 pb-3 bg-slate-50/30 dark:bg-white/[0.02]">
                                <button
                                  onClick={() => setSettingsPage('main')}
                                  className="flex items-center gap-2.5 group/back text-slate-500 dark:text-white/60 hover:text-brand dark:hover:text-white"
                                >
                                  <div className="p-1.5 rounded-lg bg-white dark:bg-surface-dark border border-slate-200 dark:border-brand-border shadow-sm">
                                    <ArrowLeft size={12} strokeWidth={3} className="text-slate-500 dark:text-white/60" />
                                  </div>
                                  <span className="text-[13px] font-medium tracking-tight text-slate-500 dark:text-white/70">{t('Back')}</span>
                                </button>
                              </div>
                            <div className="py-2 px-1">
                              {[
                                { label: t('Docs'), comingSoon: true },
                                { label: t('Brand Assets'), comingSoon: true },
                                { label: t('Feedback'), comingSoon: true }
                              ].map((item, idx) => (
                                <button
                                  key={idx}
                                  onClick={item.comingSoon ? undefined : item.onClick}
                                  className={`w-full px-5 py-4 text-left flex items-center justify-between group/item transition-all duration-300 rounded-[1.5rem] ${item.comingSoon ? 'cursor-not-allowed opacity-60' : 'hover:bg-white dark:hover:bg-white/5 active:scale-[0.98]'}`}
                                >
                                  <div className="flex items-center gap-2">
                                    <span className="text-[15px] font-medium text-slate-700 dark:text-slate-300 group-hover/item:text-black dark:group-hover/item:text-white transition-colors tracking-tight font-['Satoshi','Inter',sans-serif]">{item.label}</span>
                                  </div>
                                  {item.comingSoon && (
                                    <span className="text-[9px] bg-slate-100 dark:bg-surface-dark px-1.5 py-0.5 rounded-md uppercase tracking-wider font-bold text-secondary">{t('Soon')}</span>
                                  )}
                                </button>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            <div className="flex items-center">
              {(() => {
                const isHome = activeTab === 'home';

                if (isHome && !isConnected && !wasConnectedRef.current) {
                  return (
                    <button
                      onClick={() => setActiveTab('swap')}
                      className="h-[44px] px-8 rounded-xl bg-brand text-white hover:bg-brand-hover active:scale-98 active:-translate-y-[1px] transition-all duration-300 font-bold text-[13px] whitespace-nowrap flex items-center justify-center group relative overflow-hidden"
                    >
                      <span className="relative z-10">{t('Get Started')}</span>
                    </button>
                  );
                }

                return (
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
          <>
            {/* Side-Sheet Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              onClick={() => setIsMenuOpen(false)}
              className="fixed inset-0 z-[10999] bg-black/20 dark:bg-black/50 lg:hidden"
            />

            {/* Side Sheet */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ duration: 0.18, ease: [0.32, 0.72, 0, 1] }}
              className="fixed inset-0 z-[11000] bg-white dark:bg-page-dark lg:hidden flex flex-col overflow-hidden"
            >
              <AnimatePresence initial={false}>
                {settingsPage === 'main' ? (
                  <motion.div
                    key="sheet-main"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                    className="flex flex-col flex-1 overflow-y-auto scrollbar-none"
                  >
                    {/* Side-sheet Header with Logo and Close */}
                    <div className="flex items-center justify-between px-8 pt-6 pb-2">
                      <div className="flex items-center cursor-pointer gap-2.5" onClick={() => { setActiveTab('home'); setIsMenuOpen(false); }}>
                        <StacLogo darkMode={darkMode} className="h-7 w-7 flex-shrink-0" />
                        <span className="text-2xl font-medium tracking-tight text-slate-900 dark:text-white font-sans pt-0.5">STAC</span>
                      </div>
                      <button
                        onClick={() => setIsMenuOpen(false)}
                        className="w-10 h-10 flex items-center justify-center text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-white/5 rounded-full transition-all active:scale-95"
                        aria-label={t('Close Menu')}
                      >
                        <X size={22} strokeWidth={2.5} />
                      </button>
                    </div>

                    {/* App Navigation */}
                    <nav className="flex flex-col px-10 pt-10 pb-4">
                      {navItems.map((item) => {
                        const isActive = activeTab === item.id;
                        return (
                          <button
                            key={item.id}
                            onClick={() => { setActiveTab(item.id); setIsMenuOpen(false); }}
                            className="relative flex items-center py-2.5 transition-all group text-left active:scale-[0.98]"
                          >
                            {isActive && (
                              <motion.div
                                layoutId="mobileActiveBar"
                                className="absolute left-[-20px] w-[4px] h-6 bg-brand rounded-r-full"
                                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                              />
                            )}
                            <span className={`text-[17px] tracking-tight transition-all duration-300 ${isActive ? 'text-slate-900 dark:text-white font-semibold' : 'text-slate-500 dark:text-slate-400 font-medium'}`}>
                              {item.label}
                            </span>
                          </button>
                        );
                      })}
                    </nav>

                    {/* Divider */}
                    <div className="px-10">
                      <div className="h-px bg-slate-100 dark:bg-white/5" />
                    </div>

                    {/* Quick Settings Section */}
                    <div className="flex flex-col px-10 pt-8 pb-4">
                      {/* Theme Toggle (Desktop Pill Style) */}
                      <div className="flex items-center justify-between mb-6">
                        <span className="text-[17px] font-medium tracking-tight text-slate-500 dark:text-slate-400">
                          {t('Theme')}
                        </span>
                        <ThemeToggle darkMode={darkMode} toggleDarkMode={toggleDarkMode} isLarge={false} />
                      </div>

                      {/* Language Selection */}
                      <div className="flex items-center justify-between mb-6">
                        <span className="text-[17px] font-medium tracking-tight text-slate-500 dark:text-slate-400">
                          {t('Language')}
                        </span>
                        <div 
                          onClick={() => setSettingsPage('language')}
                          className="flex items-center gap-1.5 text-slate-400 dark:text-slate-500 cursor-pointer hover:text-slate-900 dark:hover:text-white transition-colors"
                        >
                          <span className="text-[14px] font-medium">{currentLang.name}</span>
                          <ChevronRight size={16} />
                        </div>
                      </div>

                      {/* Resources Row */}
                      <div className="flex items-center justify-between mb-6">
                        <span className="text-[17px] font-medium tracking-tight text-slate-500 dark:text-slate-400">
                          {t('Resources')}
                        </span>
                        <div 
                          onClick={() => setSettingsPage('resources')}
                          className="flex items-center gap-1.5 text-slate-400 dark:text-slate-500 cursor-pointer hover:text-slate-900 dark:hover:text-white transition-colors"
                        >
                          <ChevronRight size={16} />
                        </div>
                      </div>

                      {/* What's New Row */}
                      <div className="flex items-center justify-between mt-2">
                        <button 
                           onClick={() => { setShowUpdates(true); setIsMenuOpen(false); }}
                           className="text-[17px] font-medium tracking-tight text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                        >
                          {t("What's New")}
                        </button>
                        
                        {/* New Badge */}
                        <button 
                            onClick={() => { setShowUpdates(true); setIsMenuOpen(false); }}
                            className="px-3.5 py-1 rounded-full bg-brand text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-brand/30 transition-all duration-300 active:scale-95"
                        >
                          {t('NEW')}
                        </button>
                      </div>
                    </div>

                    <div className="flex-1" />

                    {/* Footer Socials Container */}
                    <div className="px-10 pb-8">
                      <div className="flex items-center justify-center gap-8 mb-10">
                        <button 
                          onClick={() => window.open('https://x.com/stac_defi', '_blank')}
                          className="text-slate-900 dark:text-white hover:opacity-70 transition-all hover:scale-110 active:scale-95"
                        >
                          <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
                            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                          </svg>
                        </button>
                        <button 
                          onClick={() => window.open('https://github.com/linux070/stac-defi', '_blank')}
                          className="text-slate-900 dark:text-white hover:opacity-70 transition-all hover:scale-110 active:scale-95"
                        >
                          <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
                            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                          </svg>
                        </button>
                        <button 
                          onClick={() => window.open('https://discord.gg/', '_blank')}
                          className="text-slate-900 dark:text-white hover:opacity-70 transition-all hover:scale-110 active:scale-95"
                        >
                          <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
                            <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.196.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.078.078 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.086 2.157 2.419 0 1.334-.956 2.419-2.157 2.419zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.086 2.157 2.419 0 1.334-.946 2.419-2.157 2.419z" />
                          </svg>
                        </button>
                      </div>

                      <div className="flex justify-center mb-6">
                        <div className="px-3 py-1.5 transition-all text-[11px] font-medium text-slate-400 dark:text-slate-500 tracking-wide">
                          © 2026 Stac. All Rights Reserved.
                        </div>
                      </div>

                      {/* Legal Links */}
                      <div className="flex items-center justify-center gap-6">
                        <a href="#" className="text-[11px] font-medium text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors tracking-wide underline-offset-4 hover:underline">{t('Terms & Conditions')}</a>
                        <div className="w-px h-3 bg-slate-200 dark:bg-white/10" />
                        <a href="#" className="text-[11px] font-medium text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors tracking-wide underline-offset-4 hover:underline">{t('Privacy Policy')}</a>
                        <div className="w-px h-3 bg-slate-200 dark:bg-white/10" />
                        <a href="#" className="text-[11px] font-medium text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors tracking-wide underline-offset-4 hover:underline">{t('Cookie Policy')}</a>
                      </div>
                    </div>
                  </motion.div>
                ) : settingsPage === 'language' ? (
                  <motion.div
                    key="sheet-language"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                    className="absolute inset-0 flex flex-col p-6 bg-white dark:bg-page-dark"
                  >
                    <div className="flex items-center gap-4 mb-8">
                      <button
                        onClick={() => setSettingsPage('main')}
                        className="group active:scale-95 flex items-center gap-3"
                      >
                        <div className="p-2 rounded-lg bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center">
                          <ArrowLeft size={18} strokeWidth={2.5} className="text-slate-600 dark:text-slate-300" />
                        </div>
                        <span className="text-[15px] font-medium tracking-tight text-slate-500 dark:text-slate-400">{t('Back')}</span>
                      </button>
                    </div>
                    <div className="space-y-1 overflow-y-auto scrollbar-none max-h-[70vh]">
                      {languages.map((lang) => {
                        const isActive = i18n.language.startsWith(lang.code);
                        return (
                          <button
                            key={lang.code}
                            onClick={() => { i18n.changeLanguage(lang.code); }}
                            className={`w-full p-4 flex items-center justify-between rounded-2xl transition-all duration-200 ${isActive ? 'bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-white' : 'text-slate-900 dark:text-white hover:bg-slate-50/50 dark:hover:bg-white/5'}`}
                          >
                            <div className="flex items-center gap-4">
                              <div className="w-6 h-6 rounded-full overflow-hidden flex-shrink-0 border border-slate-100 dark:border-white/10 shadow-sm">
                                <img src={lang.flag} alt="" className="w-full h-full object-cover" />
                              </div>
                              <span className="text-[17px] font-medium tracking-tight">{lang.name}</span>
                            </div>
                            {isActive && <Check size={18} strokeWidth={2.5} className="text-brand" />}
                          </button>
                        );
                      })}
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="sheet-resources"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                    className="absolute inset-0 flex flex-col p-6 bg-white dark:bg-page-dark"
                  >
                    <div className="flex items-center gap-4 mb-8">
                      <button
                        onClick={() => setSettingsPage('main')}
                        className="group active:scale-95 flex items-center gap-3"
                      >
                        <div className="p-2 rounded-lg bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center">
                          <ArrowLeft size={18} strokeWidth={2.5} className="text-slate-600 dark:text-slate-300" />
                        </div>
                        <span className="text-[15px] font-medium tracking-tight text-slate-500 dark:text-slate-400">{t('Back')}</span>
                      </button>
                    </div>
                    <div className="space-y-1 overflow-y-auto scrollbar-none max-h-[70vh]">
                      {[
                        { id: 'docs', label: t('Docs'), comingSoon: true },
                        { id: 'brand', label: t('Brand Assets'), comingSoon: true },
                        { id: 'feedback', label: t('Feedback'), comingSoon: true }
                      ].map((item) => (
                        <button
                          key={item.id}
                          onClick={item.comingSoon ? undefined : item.onClick}
                          className={`w-full p-4 flex items-center justify-between rounded-2xl transition-all duration-200 ${item.comingSoon ? 'opacity-50 cursor-not-allowed' : 'text-slate-900 dark:text-white hover:bg-slate-50/50 dark:hover:bg-white/5'}`}
                        >
                          <span className="text-[17px] font-medium tracking-tight">{item.label}</span>
                          {item.comingSoon && (
                            <span className="text-[10px] bg-slate-100 dark:bg-white/5 px-2 py-0.5 rounded-md uppercase tracking-widest font-black text-secondary">{t('Soon')}</span>
                          )}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isThemeModalOpen && (
          <motion.div
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-[20000] bg-white dark:bg-page-dark flex flex-col p-6 overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-8">
              <button 
                onClick={() => setIsThemeModalOpen(false)} 
                className="group active:scale-95 transition-transform"
              >
                <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center group-hover:bg-slate-200 dark:group-hover:bg-white/10 transition-all">
                  <ArrowLeft size={18} strokeWidth={2.5} className="text-slate-600 dark:text-white" />
                </div>
              </button>
              <h2 className="text-[14px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-[0.3em]">{t('Theme')}</h2>
              <div className="w-12" />
            </div>
            <div className="space-y-1">
              {[
                { id: 'light', label: t('Light'), active: !darkMode, icon: <SunIcon size={20} /> },
                { id: 'dark', label: t('Dark'), active: darkMode, icon: <Moon size={18} strokeWidth={2.5} /> }
              ].map((option) => (
                <button
                  key={option.id}
                  onClick={() => { if (option.id === 'light' && darkMode) toggleDarkMode(); if (option.id === 'dark' && !darkMode) toggleDarkMode(); }}
                  className={`w-full py-4 px-2 flex items-center justify-between group transition-all ${option.active ? 'text-black dark:text-white' : 'text-slate-500 dark:text-slate-400 hover:text-black dark:hover:text-white'}`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`${option.active ? 'text-black dark:text-white' : 'text-slate-400 dark:text-slate-500'}`}>{option.icon}</div>
                    <span className="text-[17px] font-medium">{option.label}</span>
                  </div>
                  {option.active && <Check size={20} className="text-black dark:text-white" />}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className={`flex-grow w-full ${activeTab === 'home' ? 'bg-transparent pt-0 lg:pt-0 pb-0' : ['swap', 'bridge'].includes(activeTab) ? 'bg-transparent pt-20 lg:pt-28 pb-0' : 'bg-white dark:bg-page-dark pt-20 lg:pt-20 pb-12'} text-black dark:text-white overflow-x-hidden relative z-10 flex flex-col`}>
        {children}
      </main>

      {/* Global Feedback Component - Trigger visibility handled via showTrigger prop */}
      <FeedbackButton 
        isOpen={isFeedbackOpen} 
        setIsOpen={setIsFeedbackOpen} 
        showTrigger={false}
        onBack={() => {
          if (window.innerWidth < 1024) {
            setIsMenuOpen(true);
            setSettingsPage('resources');
          }
        }}
      />

      {/* Global Updates Modal */}
      <UpdatesModal isOpen={showUpdates} onClose={() => setShowUpdates(false)} />
    </div>
  );
};

export default Layout;
