import { useTranslation } from 'react-i18next';
import { LucideClock } from 'lucide-react';
import { motion } from 'framer-motion';

const Liquidity = () => {
  const { t } = useTranslation();

  return (
    <div className="max-w-4xl mx-auto w-full px-4 sm:px-6 flex items-center justify-center py-10 md:py-20 min-h-[80dvh]">
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="w-full relative group"
      >
        {/* Superior Ambient Glows - Rebranded to Arc Blues */}
        <div className="absolute -top-12 -left-12 w-48 h-48 md:w-72 md:h-72 bg-blue-600/20 blur-[60px] md:blur-[100px] rounded-full group-hover:opacity-60 transition-opacity"></div>
        <div className="absolute -bottom-12 -right-12 w-48 h-48 md:w-72 md:h-72 bg-indigo-600/20 blur-[60px] md:blur-[100px] rounded-full group-hover:opacity-60 transition-opacity"></div>

        <div className="relative z-10 bg-white/70 dark:bg-slate-900/40 backdrop-blur-3xl border border-slate-200/60 dark:border-white/10 rounded-[32px] md:rounded-[48px] p-8 md:p-16 text-center shadow-2xl overflow-hidden font-['Inter','Satoshi','General_Sans',sans-serif]">
          {/* Top light sweep decoration - Arc Blue */}
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent"></div>

          <div className="flex flex-col items-center">
            {/* Visual Centerpiece - Arc Logo Themed */}
            <div className="relative mb-10 md:mb-14">
              <motion.div
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.2, 0.4, 0.2]
                }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                className="absolute inset-0 bg-blue-500/40 blur-3xl rounded-full"
              ></motion.div>

              <div className="relative w-20 h-20 md:w-24 md:h-24 bg-gradient-to-br from-[#1e40af] to-[#60a5fa] rounded-[24px] md:rounded-[28px] flex items-center justify-center rotate-12 group-hover:rotate-0 transition-transform duration-700 shadow-2xl overflow-hidden">
                <LucideClock size={36} className="text-white md:hidden" strokeWidth={2} />
                <LucideClock size={48} className="text-white hidden md:block" strokeWidth={1.5} />
                {/* Gloss effect on icon */}
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent opacity-50"></div>
              </div>
            </div>

            {/* Content Section */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="space-y-6 md:space-y-8"
            >
              <div className="flex items-center justify-center gap-3 md:gap-6">
                <div className="h-px w-8 md:w-16 bg-gradient-to-r from-transparent to-blue-500/40 dark:to-blue-400"></div>
                <span className="text-[10px] md:text-xs font-medium uppercase tracking-[0.4em] text-blue-600 dark:text-blue-300">
                  {t('Coming Soon')}
                </span>
                <div className="h-px w-8 md:w-16 bg-gradient-to-l from-transparent to-blue-500/40 dark:to-blue-400"></div>
              </div>

              <p className="text-sm md:text-xl text-slate-700 dark:text-slate-200 max-w-lg mx-auto leading-relaxed font-medium tracking-tight">
                {t('liquidity.poolsLaunchingSoon')}
              </p>
            </motion.div>

            {/* Bottom Status Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 mt-12 md:mt-20 w-full max-w-2xl border-t border-slate-200 dark:border-white/5 pt-10 md:pt-14">
              {[
                { label: t('Yield') },
                { label: t('Liquidity') },
                { label: t('Farming') },
                { label: t('Governance') }
              ].map((item, i) => (
                <div key={i} className="flex flex-col items-center gap-3 opacity-60 dark:opacity-40 group-hover:opacity-100 dark:group-hover:opacity-80 transition-all duration-500">
                  <div className="w-2 h-2 rounded-full bg-blue-500 dark:bg-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.4)]"></div>
                  <span className="text-[9px] md:text-[10px] font-medium uppercase tracking-[0.2em] text-slate-600 dark:text-slate-300">
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Liquidity;