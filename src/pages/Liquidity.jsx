import { useTranslation } from 'react-i18next';
import { LucideClock } from 'lucide-react';
import { motion } from 'framer-motion';

const Liquidity = () => {
  const { t } = useTranslation();

  return (
    <div className="max-w-2xl mx-auto w-full px-4 sm:px-6 flex items-center justify-center py-10 md:py-20 min-h-[100dvh]">
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full relative group"
      >
        {/* Superior Ambient Glows - Unified Arc Blues */}
        <div className="absolute -top-12 -left-12 w-48 h-48 md:w-72 md:h-72 bg-blue-600/10 dark:bg-blue-600/15 blur-[60px] md:blur-[100px] rounded-full group-hover:opacity-70 transition-opacity"></div>
        <div className="absolute -bottom-12 -right-12 w-48 h-48 md:w-72 md:h-72 bg-blue-500/10 dark:bg-blue-500/15 blur-[60px] md:blur-[100px] rounded-full group-hover:opacity-70 transition-opacity"></div>

        <div className="relative z-10 bg-white/80 dark:bg-[#0f1729]/80 backdrop-blur-3xl border border-slate-200/60 dark:border-white/[0.12] rounded-[32px] p-8 md:p-12 text-center shadow-2xl dark:shadow-[0_8px_40px_rgba(0,0,0,0.4),0_0_0_1px_rgba(255,255,255,0.05)_inset] overflow-hidden font-['Inter','Satoshi','General_Sans',sans-serif]">
          {/* Top light sweep decoration - Arc Blue */}
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 dark:via-blue-400/40 to-transparent"></div>
          {/* Subtle inner top glow for dark mode depth */}
          <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-b from-blue-500/[0.04] to-transparent pointer-events-none hidden dark:block"></div>

          <div className="flex flex-col items-center">
            {/* Visual Centerpiece - Arc Logo Themed */}
            <div className="relative mb-8 md:mb-12">
              <motion.div
                animate={{
                  scale: [1, 1.15, 1],
                  opacity: [0.15, 0.35, 0.15]
                }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute inset-0 bg-blue-500/40 dark:bg-blue-500/50 blur-3xl rounded-full"
              ></motion.div>

              <div className="relative w-20 h-20 bg-gradient-to-br from-[#1e40af] to-[#60a5fa] rounded-2xl flex items-center justify-center rotate-12 group-hover:rotate-0 transition-transform duration-500 shadow-2xl dark:shadow-[0_8px_30px_rgba(59,130,246,0.35)] overflow-hidden">
                <LucideClock size={36} className="text-white" strokeWidth={2} />
                {/* Gloss effect on icon */}
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent opacity-50"></div>
              </div>
            </div>

            {/* Content Section */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.4 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-center gap-3 md:gap-4">
                <div className="h-px w-6 md:w-12 bg-gradient-to-r from-transparent to-blue-500/40 dark:to-blue-400/60"></div>
                <span className="text-[10px] md:text-xs font-bold uppercase tracking-[0.4em] text-blue-600 dark:text-blue-300">
                  {t('Coming Soon')}
                </span>
                <div className="h-px w-6 md:w-12 bg-gradient-to-l from-transparent to-blue-500/40 dark:to-blue-400/60"></div>
              </div>

              <p className="text-lg md:text-xl text-slate-800 dark:text-white max-w-md mx-auto leading-relaxed font-bold tracking-tight">
                {t('liquidity.poolsLaunchingSoon')}
              </p>
            </motion.div>

            {/* Bottom Status Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-4 mt-12 md:mt-16 w-full border-t border-slate-200/50 dark:border-white/[0.08] pt-10">
              {[
                { label: t('Yield') },
                { label: t('Liquidity') },
                { label: t('Farming') },
                { label: t('Governance') }
              ].map((item, i) => (
                <div key={i} className="flex flex-col items-center gap-2.5 opacity-60 group-hover:opacity-100 transition-all duration-300">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)] dark:shadow-[0_0_10px_rgba(59,130,246,0.7)]"></div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
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