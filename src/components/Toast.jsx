import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, AlertCircle, Info } from 'lucide-react';
import { createPortal } from 'react-dom';

const Toast = ({ type = 'info', message, onClose, visible }) => {
  const icons = {
    success: <Check className="text-slate-900 dark:text-white" size={20} strokeWidth={3} />,
    error: <X className="text-red-500" size={20} strokeWidth={3} />,
    warning: <AlertCircle className="text-amber-500" size={20} strokeWidth={3} />,
    info: <Info className="text-blue-500" size={20} strokeWidth={3} />,
  };

  const titles = {
    success: 'Success',
    error: 'Error',
    warning: 'Warning',
    info: 'Info',
  };

  return createPortal(
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="fixed bottom-24 left-4 right-4 md:left-8 md:right-auto md:w-80 z-[99999]"
        >
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.5)] p-4 flex items-center gap-4 backdrop-blur-xl">
            <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center flex-shrink-0">
              {icons[type]}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[15px] font-bold text-slate-900 dark:text-white leading-tight">
                {titles[type]}
              </p>
              <p className="text-[13px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">{message}</p>
            </div>
            <button
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default Toast;
