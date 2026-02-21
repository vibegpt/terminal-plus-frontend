import React from 'react';
import { cn } from '../../lib/utils';

interface BentoCardProps {
  children: React.ReactNode;
  size?: 'small' | 'medium' | 'large';
  gradient?: [string, string];
  live?: boolean;
  className?: string;
  onClick?: () => void;
}

export const BentoCard: React.FC<BentoCardProps> = ({
  children,
  size = 'medium',
  gradient,
  live = false,
  className,
  onClick
}) => {
  const sizeClasses = {
    small: 'col-span-1 row-span-1',
    medium: 'col-span-2 row-span-1',
    large: 'col-span-2 row-span-2'
  };

  const gradientStyle = gradient 
    ? { background: `linear-gradient(135deg, ${gradient[0]}, ${gradient[1]})` }
    : {};

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl border border-gray-200/10 bg-white/5 backdrop-blur-sm transition-all duration-300 hover:scale-[1.02] hover:shadow-xl',
        'cursor-pointer select-none',
        sizeClasses[size],
        className
      )}
      style={gradientStyle}
      onClick={onClick}
    >
      {/* Live indicator */}
      {live && (
        <div className="absolute top-3 right-3 flex items-center gap-2">
          <div className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
          <span className="text-xs font-medium text-white/80">LIVE</span>
        </div>
      )}
      
      {/* Content */}
      <div className="relative z-10 h-full p-6">
        {children}
      </div>
      
      {/* Gradient overlay for better text readability */}
      {gradient && (
        <div className="absolute inset-0 bg-gradient-to-br from-black/20 to-transparent" />
      )}
      
      {/* Hover effect overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 transition-opacity duration-300 hover:opacity-100" />
    </div>
  );
};
