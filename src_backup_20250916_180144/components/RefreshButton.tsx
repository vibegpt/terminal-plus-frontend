import React from 'react';
import { motion } from 'framer-motion';

interface RefreshButtonProps {
  onClick: () => void;
  loading?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const RefreshButton: React.FC<RefreshButtonProps> = ({
  onClick,
  loading = false,
  size = 'md',
  className = ''
}) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12'
  };

  return (
    <motion.button
      onClick={onClick}
      disabled={loading}
      className={`bg-white/20 backdrop-blur rounded-full hover:bg-white/30 transition-all disabled:opacity-50 ${sizeClasses[size]} ${className}`}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <motion.svg
        className="w-full h-full p-2"
        fill="none"
        stroke="currentColor"
        animate={loading ? { rotate: 360 } : {}}
        transition={{ duration: 0.5 }}
      >
        <path 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          strokeWidth={2} 
          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" 
        />
      </motion.svg>
    </motion.button>
  );
};
