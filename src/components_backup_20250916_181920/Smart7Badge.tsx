import React from 'react';
import { motion } from 'framer-motion';

interface Smart7BadgeProps {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'success' | 'warning' | 'premium';
  pulse?: boolean;
  className?: string;
}

export const Smart7Badge: React.FC<Smart7BadgeProps> = ({
  size = 'md',
  variant = 'default',
  pulse = false,
  className = ''
}) => {
  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base'
  };

  const variantClasses = {
    default: 'bg-gradient-to-r from-blue-500 to-purple-600 text-white',
    success: 'bg-gradient-to-r from-green-500 to-emerald-600 text-white',
    warning: 'bg-gradient-to-r from-orange-500 to-red-600 text-white',
    premium: 'bg-gradient-to-r from-purple-500 to-pink-600 text-white'
  };

  return (
    <motion.div
      className={`inline-flex items-center gap-2 font-bold rounded-full ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
      animate={pulse ? { scale: [1, 1.05, 1] } : {}}
      transition={pulse ? { duration: 2, repeat: Infinity } : {}}
    >
      <span className="text-xs">✨</span>
      <span>Smart7</span>
    </motion.div>
  );
};
