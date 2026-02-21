import React from 'react';
import { cn } from '../../lib/utils';

interface CollectionCardProps {
  collection: {
    slug: string;
    name: string;
    subtitle: string;
    emoji: string;
    gradient: string;
    amenities: string[];
  };
  onClick?: () => void;
  className?: string;
  size?: 'small' | 'medium' | 'large';
  showCount?: boolean;
}

export const CollectionCard: React.FC<CollectionCardProps> = ({
  collection,
  onClick,
  className,
  size = 'medium',
  showCount = true
}) => {
  const sizeClasses = {
    small: 'p-4',
    medium: 'p-6',
    large: 'p-8'
  };

  const emojiSizes = {
    small: 'text-2xl',
    medium: 'text-3xl',
    large: 'text-4xl'
  };

  const textSizes = {
    small: {
      title: 'text-sm',
      subtitle: 'text-xs',
      count: 'text-xs'
    },
    medium: {
      title: 'text-lg',
      subtitle: 'text-sm',
      count: 'text-sm'
    },
    large: {
      title: 'text-xl',
      subtitle: 'text-base',
      count: 'text-base'
    }
  };

  const amenityCount = collection.amenities?.length || 0;

  return (
    <div
      className={cn(
        'collection-card bg-gradient-to-r cursor-pointer rounded-xl transition-all duration-300',
        'hover:scale-105 hover:shadow-lg transform',
        'border border-white/20 backdrop-blur-sm relative overflow-hidden',
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
      <div className="text-white relative z-10">
        {/* Header with Emoji and Count */}
        <div className="flex items-start justify-between mb-3">
          <div className={cn('flex-shrink-0', emojiSizes[size])}>
            {collection.emoji}
          </div>
          
          {/* Count Badge - This is where counts are shown */}
          {showCount && amenityCount > 0 && (
            <div className="bg-white/20 backdrop-blur-sm rounded-full px-2 py-1">
              <span className={cn(
                'font-semibold text-white',
                textSizes[size].count
              )}>
                {amenityCount} {amenityCount === 1 ? 'spot' : 'spots'}
              </span>
            </div>
          )}
        </div>
        
        {/* Collection Name */}
        <h3 className={cn(
          'font-bold mb-2 leading-tight',
          textSizes[size].title
        )}>
          {collection.name}
        </h3>
        
        {/* Subtitle */}
        <p className={cn(
          'opacity-90 leading-relaxed mb-3',
          textSizes[size].subtitle
        )}>
          {collection.subtitle}
        </p>
        
        {/* Preview of amenities (for larger cards) */}
        {size === 'large' && collection.amenities && (
          <div className="space-y-1">
            <p className="text-xs opacity-75 font-medium mb-2">Highlights:</p>
            {collection.amenities.slice(0, 3).map((amenity, index) => (
              <div key={index} className="flex items-center gap-2 text-xs opacity-80">
                <div className="w-1 h-1 bg-white rounded-full" />
                <span className="capitalize">
                  {amenity.replace(/-/g, ' ')}
                </span>
              </div>
            ))}
            {collection.amenities.length > 3 && (
              <div className="text-xs opacity-60 mt-2">
                +{collection.amenities.length - 3} more
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Hover effect overlay */}
      <div className="absolute inset-0 bg-white/5 opacity-0 hover:opacity-100 transition-opacity duration-300 rounded-xl" />
      
      {/* Gradient overlay for better text readability */}
      <div className="absolute inset-0 bg-gradient-to-br from-black/20 to-transparent" />
    </div>
  );
};

// Compact version for grid layouts
export const CollectionCardCompact: React.FC<CollectionCardProps> = ({
  collection,
  onClick,
  className,
  showCount = true
}) => {
  const amenityCount = collection.amenities?.length || 0;

  return (
    <div
      className={cn(
        'collection-card-compact bg-gradient-to-r cursor-pointer rounded-lg p-4 transition-all duration-300',
        'hover:scale-105 hover:shadow-lg transform',
        'border border-white/20 backdrop-blur-sm relative overflow-hidden',
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
      <div className="flex items-start gap-3 text-white relative z-10">
        {/* Emoji Icon */}
        <div className="text-2xl flex-shrink-0">
          {collection.emoji}
        </div>
        
        {/* Content */}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between mb-1">
            <h3 className="font-bold text-sm leading-tight">
              {collection.name}
            </h3>
            
            {/* Count Badge */}
            {showCount && amenityCount > 0 && (
              <div className="bg-white/20 backdrop-blur-sm rounded-full px-2 py-1 flex-shrink-0">
                <span className="text-xs font-semibold text-white">
                  {amenityCount}
                </span>
              </div>
            )}
          </div>
          
          <p className="text-xs opacity-90 leading-relaxed">
            {collection.subtitle}
          </p>
        </div>
      </div>
      
      {/* Hover effect overlay */}
      <div className="absolute inset-0 bg-white/5 opacity-0 hover:opacity-100 transition-opacity duration-300 rounded-lg" />
      
      {/* Gradient overlay for better text readability */}
      <div className="absolute inset-0 bg-gradient-to-br from-black/20 to-transparent" />
    </div>
  );
};
