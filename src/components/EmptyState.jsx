import React from 'react';
import { motion } from 'framer-motion';

const EmptyState = ({ 
  icon, 
  title, 
  description, 
  actionLabel, 
  onAction 
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="card text-center"
    >
      <div className="max-w-md mx-auto">
        <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 rounded-full flex items-center justify-center text-5xl">
          {icon}
        </div>
        <h3 className="text-2xl font-bold mb-3 text-gray-900 dark:text-white">
          {title}
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-6 text-lg">
          {description}
        </p>
        {actionLabel && onAction && (
          <button
            onClick={onAction}
            className="btn-primary px-8 py-3 text-lg font-semibold"
          >
            {actionLabel}
          </button>
        )}
      </div>
    </motion.div>
  );
};

export default EmptyState;
