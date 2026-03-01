import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronRight, ArrowLeft, Check } from 'lucide-react';

const LanguageSelector = ({ placement = 'header' }) => {
  const { t, i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const selectorRef = useRef(null);

  const languages = [
    { code: 'en', name: 'English', flag: 'https://flagcdn.com/w80/us.png' },
    { code: 'es', name: 'Español', flag: 'https://flagcdn.com/w80/es.png' },
    { code: 'fr', name: 'Français', flag: 'https://flagcdn.com/w80/fr.png' },
    { code: 'de', name: 'Deutsch', flag: 'https://flagcdn.com/w80/de.png' },
    { code: 'zh', name: '中文', flag: 'https://flagcdn.com/w80/cn.png' }
  ];

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (selectorRef.current && !selectorRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const changeLanguage = (langCode) => {
    i18n.changeLanguage(langCode);
  };

  const currentLang = languages.find(l => i18n.language.startsWith(l.code)) || languages[0];

  return (
    <div ref={selectorRef} className={`relative ${placement === 'mobile-menu' ? 'block w-full border-t border-slate-100 dark:border-white/5' : 'inline-block'}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center transition-all duration-200 group outline-none w-full
          ${placement === 'footer'
            ? 'gap-1.5 text-slate-500 dark:text-slate-400 hover:text-black dark:hover:text-white text-sm font-bold uppercase tracking-wider'
            : placement === 'mobile-menu'
              ? 'justify-between text-[18px] font-semibold tracking-tight py-3 text-slate-500 dark:text-slate-500 hover:text-black dark:hover:text-white'
              : 'gap-1.5 h-[44px] px-4 rounded-xl border border-slate-200/60 dark:border-white/10 bg-slate-50/50 dark:bg-white/5 backdrop-blur-xl text-slate-700 dark:text-slate-300 hover:bg-white dark:hover:bg-white/10 shadow-sm font-bold active:scale-95'
          }`}
      >
        {placement === 'footer' ? (
          <>
            <span>{currentLang.code.toUpperCase()}</span>
            <ChevronDown
              size={14}
              strokeWidth={2.5}
              className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : 'rotate-0'}`}
            />
          </>
        ) : placement === 'mobile-menu' ? (
          <>
            <span>{t('Language')}</span>
            <div className="flex items-center gap-3">
              <span className="text-black dark:text-white text-[14px] font-bold tracking-tight opacity-70 group-hover:opacity-100 transition-opacity">
                {currentLang.name}
              </span>
              <ChevronRight
                size={20}
                className="text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200 transition-colors"
              />
            </div>
          </>
        ) : (
          <span>{t('Language')}</span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          placement === 'mobile-menu' ? (
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-0 z-[10000] bg-white dark:bg-black flex flex-col p-6 overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-8">
                <button onClick={() => setIsOpen(false)} className="p-2 -ml-2 text-slate-600 dark:text-slate-300 active:scale-90 transition-all">
                  <ArrowLeft size={24} />
                </button>
                <h2 className="text-xl font-bold text-black dark:text-white">{t('Language')}</h2>
                <div className="w-10" /> {/* Spacer */}
              </div>

              <div className="space-y-1">
                {languages.map((lang) => {
                  const isActive = i18n.language.startsWith(lang.code);
                  return (
                    <button
                      key={lang.code}
                      onClick={() => changeLanguage(lang.code)}
                      className={`w-full py-4 px-2 flex items-center justify-between group transition-all
                        ${isActive ? 'text-black dark:text-white dark:text-black dark:text-white' : 'text-slate-700 dark:text-slate-300'}`}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-6 h-6 rounded-full overflow-hidden border border-slate-100 dark:border-white/10 flex-shrink-0 shadow-sm">
                          <img src={lang.flag} alt="" className="w-full h-full object-cover" />
                        </div>
                        <span className="text-[17px] font-semibold">{lang.name}</span>
                      </div>
                      {isActive && <Check size={20} className="text-black dark:text-white dark:text-black dark:text-white" />}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.99 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.99 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
              className={`absolute z-[2000] w-[220px] bg-white dark:bg-[#161616] rounded-[14px] border border-slate-200 dark:border-white/10 shadow-xl dark:shadow-none overflow-hidden
                ${placement === 'footer' ? 'bottom-full mb-3 left-0' : 'top-full mt-2 right-0'}`}
            >
              <div className="px-5 pt-5 pb-2">
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">
                  {t('Select Language')}
                </span>
              </div>
              <div className="py-2">
                {languages.map((lang) => {
                  const isActive = i18n.language.startsWith(lang.code);
                  return (
                    <button
                      key={lang.code}
                      onClick={() => changeLanguage(lang.code)}
                      className={`w-full px-5 py-2.5 text-left flex items-center group/item transition-all duration-200
                        ${isActive
                          ? 'bg-slate-100 dark:bg-white/[0.08]'
                          : 'hover:bg-slate-50 dark:hover:bg-white/[0.03]'}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-5 h-5 rounded-full overflow-hidden border border-slate-100 dark:border-white/5 flex-shrink-0">
                          <img src={lang.flag} alt="" className="w-full h-full object-cover" />
                        </div>
                        <span className={`text-[13px] tracking-tight transition-colors duration-200
                          ${isActive
                            ? 'text-black dark:text-white font-bold'
                            : 'text-slate-500 dark:text-slate-400 group-hover/item:text-black dark:group-hover/item:text-white'}`}>
                          {lang.name}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )
        )}
      </AnimatePresence>
    </div>
  );
};

export default LanguageSelector;