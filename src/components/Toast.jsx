import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, AlertCircle, Info } from 'lucide-react';
import { createPortal } from 'react-dom';

const Toast = ({ type = 'info', message, onClose, visible }) => {
  const icons = {
    success: <Check className="text-emerald-500" size={20} strokeWidth={3} />,
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
          <div className="bg-slate-950 text-white border border-white/10 rounded-[22px] shadow-2xl p-4 md:p-5 flex items-start gap-4 backdrop-blur-xl ring-1 ring-white/5">
            <div className="w-11 h-11 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0 mt-0.5">
              {icons[type]}
            </div>
            <div className="flex-1 min-w-0 text-left pt-0.5">
              <p className="text-[15px] font-black text-white leading-tight">
                {titles[type]}
              </p>
              <p className="text-[12px] text-slate-400 font-semibold mt-1 leading-relaxed">{message}</p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition-all ml-2"
            >
              <X size={16} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default Toast;
