import React from 'react';
import { cn } from '../../lib/utils';
import { VibeDefinition } from '../../constants/vibeDefinitions';

interface VibeCardProps {
  vibe: VibeDefinition;
  onClick?: () => void;
  className?: string;
  size?: 'small' | 'medium' | 'large';
}

export const VibeCard: React.FC<VibeCardProps> = ({
  vibe,
  onClick,
  className,
  size = 'medium'
}) => {
  const sizeClasses = {
    small: 'p-4',
    medium: 'p-6',
    large: 'p-8'
  };

  const emojiSizes = {
    small: 'text-2xl',
    medium: 'text-4xl',
    large: 'text-6xl'
  };

  const textSizes = {
    small: {
      title: 'text-lg',
      subtitle: 'text-sm'
    },
    medium: {
      title: 'text-xl',
      subtitle: 'text-sm'
    },
    large: {
      title: 'text-2xl',
      subtitle: 'text-base'
    }
  };

  return (
    <div
      className={cn(
        'vibe-card bg-gradient-to-r cursor-pointer rounded-2xl transition-all duration-300',
        'hover:scale-105 hover:shadow-xl transform',
        'border border-white/20 backdrop-blur-sm',
        sizeClasses[size],
        className
      )}
      style={{
        background: `linear-gradient(135deg, var(--tw-gradient-stops))`,
        '--tw-gradient-from': 'var(--tw-gradient-from)',
        '--tw-gradient-to': 'var(--tw-gradient-to)',
        '--tw-gradient-from': 'var(--tw-gradient-from)',
        '--tw-gradient-to': 'var(--tw-gradient-to)'
      } as any}
      onClick={onClick}
    >
      <div className="text-center text-white">
        {/* Emoji Icon */}
        <div className={cn('mb-3', emojiSizes[size])}>
          {vibe.emoji}
        </div>
        
        {/* Vibe Name */}
        <h3 className={cn(
          'font-bold mb-2 leading-tight',
          textSizes[size].title
        )}>
          {vibe.name}
        </h3>
        
        {/* Subtitle - No count, just descriptive text */}
        <p className={cn(
          'opacity-90 leading-relaxed',
          textSizes[size].subtitle
        )}>
          {vibe.subtitle}
        </p>
        
        {/* Optional description for larger cards */}
        {size === 'large' && vibe.description && (
          <p className="text-xs opacity-75 mt-3 leading-relaxed">
            {vibe.description}
          </p>
        )}
      </div>
      
      {/* Hover effect overlay */}
      <div className="absolute inset-0 bg-white/5 opacity-0 hover:opacity-100 transition-opacity duration-300 rounded-2xl" />
    </div>
  );
};

// Alternative compact version for grid layouts
export const VibeCardCompact: React.FC<VibeCardProps> = ({
  vibe,
  onClick,
  className
}) => {
  return (
    <div
      className={cn(
        'vibe-card-compact bg-gradient-to-r cursor-pointer rounded-xl p-4 transition-all duration-300',
        'hover:scale-105 hover:shadow-lg transform',
        'border border-white/20 backdrop-blur-sm',
        className
      )}
      style={{
        background: `linear-gradient(135deg, var(--tw-gradient-stops))`,
        '--tw-gradient-from': 'var(--tw-gradient-from)',
        '--tw-gradient-to': 'var(--tw-gradient-to)',
        '--tw-gradient-from': 'var(--tw-gradient-from)',
        '--tw-gradient-to': 'var(--tw-gradient-to)'
      } as any}
      onClick={onClick}
    >
      <div className="flex items-center gap-3 text-white">
        {/* Emoji Icon */}
        <div className="text-2xl flex-shrink-0">
          {vibe.emoji}
        </div>
        
        {/* Text Content */}
        <div className="min-w-0 flex-1">
          <h3 className="font-bold text-sm leading-tight mb-1">
            {vibe.name}
          </h3>
          <p className="text-xs opacity-90 leading-relaxed">
            {vibe.subtitle}
          </p>
        </div>
      </div>
      
      {/* Hover effect overlay */}
      <div className="absolute inset-0 bg-white/5 opacity-0 hover:opacity-100 transition-opacity duration-300 rounded-xl" />
    </div>
  );
};
