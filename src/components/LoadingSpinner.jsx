import React from 'react';
import { Loader } from 'lucide-react';
import { motion } from 'framer-motion';

const LoadingSpinner = ({ message = 'Loading...' }) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center justify-center py-20"
    >
      <Loader className="w-12 h-12 text-primary-600 dark:text-primary-400 animate-spin mb-4" />
      <p className="text-gray-600 dark:text-gray-400 text-lg font-medium">
        {message}
      </p>
    </motion.div>
  );
};

export default LoadingSpinner;
