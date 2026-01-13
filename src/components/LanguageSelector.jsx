import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronRight, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const LanguageSelector = ({ placement = 'header' }) => {
  const { t, i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const selectorRef = useRef(null);

  // Language options with high-quality SVG flags from flagcdn
  const languages = [
    { code: 'en', name: 'English', flag: 'https://flagcdn.com/w40/us.png' },
    { code: 'es', name: 'Español', flag: 'https://flagcdn.com/w40/es.png' },
    { code: 'fr', name: 'Français', flag: 'https://flagcdn.com/w40/fr.png' },
    { code: 'de', name: 'Deutsch', flag: 'https://flagcdn.com/w40/de.png' },
    { code: 'zh', name: '中文', flag: 'https://flagcdn.com/w40/cn.png' }
  ];

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (selectorRef.current && !selectorRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close dropdown on Escape key
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  const changeLanguage = (langCode) => {
    i18n.changeLanguage(langCode);
    setIsOpen(false);
  };

  const currentLanguage = languages.find(lang => lang.code === i18n.language) || languages[0];

  // Determine styling based on placement
  const getContainerClasses = () => {
    if (placement === 'footer') {
      return 'relative inline-block';
    }
    if (placement === 'mobile-menu') {
      return 'relative flex items-center justify-between w-full h-full';
    }
    return 'relative';
  };

  const getButtonClasses = () => {
    if (placement === 'footer') {
      return 'flex items-center space-x-1 text-sm text-gray-500 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 transition-colors bg-white dark:bg-gray-800 rounded-lg px-3 py-2 shadow-sm';
    }
    if (placement === 'mobile-menu') {
      return 'flex items-center gap-2 w-full justify-between';
    }
    return 'p-2 rounded-full hover:bg-white/10 dark:hover:bg-white/5 mx-1 flex items-center';
  };

  const getDropdownPosition = () => {
    if (placement === 'footer') {
      return 'absolute bottom-full right-0 mb-2';
    }
    if (placement === 'mobile-menu') {
      return 'absolute bottom-full right-0 mb-4';
    }
    return 'absolute right-0 top-full mt-1';
  };

  return (
    <div ref={selectorRef} className={getContainerClasses()}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={getButtonClasses()}
        aria-haspopup="true"
        aria-expanded={isOpen}
        title={t('changeLanguage')}
      >
        {placement === 'mobile-menu' ? (
          <>
            <div className="flex items-center gap-4">
              <span className="text-[15px] font-semibold text-slate-900 dark:text-white">{t('Language')}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[13px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                {i18n.language === 'en' ? 'EN-US' : i18n.language.toUpperCase()}
              </span>
              {!isOpen && <ChevronRight size={16} className="text-slate-300 dark:text-slate-600" />}
            </div>
          </>
        ) : (
          <>
            <img
              src={currentLanguage.flag}
              alt={currentLanguage.name}
              className="w-4 h-3 object-cover rounded-sm shadow-sm"
            />
            <span className="uppercase">{currentLanguage.code}</span>
            <ChevronDown size={16} />
          </>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className={`${getDropdownPosition()} z-[2000] w-48 bg-white dark:bg-[#1a1c23] rounded-2xl shadow-2xl border border-slate-200 dark:border-white/10 overflow-hidden backdrop-blur-xl`}
          >
            <div className="p-2 space-y-1">
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => changeLanguage(lang.code)}
                  className={`w-full px-4 py-3 rounded-xl text-left text-sm flex items-center justify-between transition-all ${i18n.language === lang.code
                    ? 'text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-500/10 font-bold'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5'
                    }`}
                >
                  <div className="flex items-center space-x-3">
                    <img
                      src={lang.flag}
                      alt={lang.name}
                      className="w-5 h-4 object-cover rounded shadow-sm"
                    />
                    <span className="font-medium">{lang.name}</span>
                  </div>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LanguageSelector;