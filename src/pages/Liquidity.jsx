// =============================================================================
// LIQUIDITY PAGE (Modern & Minimalist Redesign)
// =============================================================================

import { useTranslation } from 'react-i18next';
import { LucideZap, LucideWaves, LucideSprout, LucideCrown } from 'lucide-react';
import { motion } from 'framer-motion';

const containerVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.8,
      ease: [0.16, 1, 0.3, 1],
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.16, 1, 0.3, 1],
    },
  },
};

const Liquidity = () => {
  const { t } = useTranslation();

  const features = [
    { label: t('Yield'), icon: LucideZap, color: 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400' },
    { label: t('Liquidity'), icon: LucideWaves, color: 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400' },
    { label: t('Farming'), icon: LucideSprout, color: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400' },
    { label: t('Governance'), icon: LucideCrown, color: 'bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400' },
  ];

  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center px-6 py-12 md:py-24 relative overflow-hidden">
      
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-4xl w-full z-10"
      >
        {/* Main Card */}
        <div className="relative overflow-hidden rounded-[2.5rem] bg-white dark:bg-surface-dark p-8 md:p-16 border border-slate-200/60 dark:border-white/5 shadow-[0_8px_30px_rgb(0,0,0,0.02)] dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]">
          
          {/* Subtle top-highlight for depth */}
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-slate-200 dark:via-white/10 to-transparent" />

          <div className="flex flex-col items-center">
            {/* ── TYPOGRAPHY ── */}
            <motion.h1 
              variants={itemVariants}
              className="text-3xl md:text-5xl font-['Outfit'] font-bold tracking-tighter text-slate-900 dark:text-white text-center mb-6 max-w-lg leading-[1.1]"
            >
              {t('liquidity.poolsLaunchingSoon')}
            </motion.h1>



            {/* ── BENTO FEATURE GRID ── */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 w-full pt-12 border-t border-slate-100 dark:border-white/5">
              {features.map((item, i) => (
                <motion.div 
                  key={item.label}
                  custom={i}
                  variants={itemVariants}
                  className="flex flex-col items-center gap-4 group/item"
                >
                  <div className={`p-4 rounded-2xl ${item.color} ring-1 ring-black/[0.03] dark:ring-white/5 transition-all duration-500 group-hover/item:scale-110 group-hover/item:-translate-y-1`}>
                    <item.icon size={22} strokeWidth={2} />
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 group-hover/item:text-brand transition-colors duration-300">
                      {item.label}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Liquidity;
