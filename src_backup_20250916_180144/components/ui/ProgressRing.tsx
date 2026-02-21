import React from 'react';
import { cn } from '../../lib/utils';

interface ProgressRingProps {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
  showLabel?: boolean;
  labelSize?: 'sm' | 'md' | 'lg';
}

export const ProgressRing: React.FC<ProgressRingProps> = ({
  percentage,
  size = 120,
  strokeWidth = 8,
  className,
  showLabel = true,
  labelSize = 'md'
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const progress = Math.min(Math.max(percentage, 0), 100);
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  const labelSizes = {
    sm: 'text-sm',
    md: 'text-lg',
    lg: 'text-2xl'
  };

  return (
    <div className={cn('relative inline-flex items-center justify-center', className)}>
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          className="text-gray-200/30"
        />
        
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="text-white transition-all duration-1000 ease-out"
          style={{
            filter: 'drop-shadow(0 0 8px rgba(255, 255, 255, 0.3))'
          }}
        />
      </svg>
      
      {/* Center label */}
      {showLabel && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={cn(
            'font-bold text-white',
            labelSizes[labelSize]
          )}>
            {Math.round(progress)}%
          </span>
          <span className="text-xs text-white/80 font-medium">
            Complete
          </span>
        </div>
      )}
      
      {/* Animated glow effect */}
      <div 
        className="absolute inset-0 rounded-full bg-gradient-to-r from-white/20 to-transparent opacity-0 animate-pulse"
        style={{
          animationDelay: '0.5s',
          animationDuration: '2s'
        }}
      />
    </div>
  );
};
