// Collection badge utilities for size indicators and curation levels
export interface CollectionBadge {
  text: string;
  color: string;
  bgColor: string;
  textColor: string;
  icon?: string;
  description?: string;
}

// Collection size thresholds
export const COLLECTION_SIZES = {
  MICRO: { max: 10, name: 'Micro' },
  CURATED: { max: 25, name: 'Curated' },
  POPULAR: { max: 50, name: 'Popular' },
  COMPREHENSIVE: { max: 100, name: 'Comprehensive' },
  EXPLORE_ALL: { max: Infinity, name: 'Explore All' }
} as const;

// Badge configurations
export const COLLECTION_BADGES: Record<string, CollectionBadge> = {
  micro: {
    text: 'Micro',
    color: 'emerald',
    bgColor: 'bg-emerald-100',
    textColor: 'text-emerald-800',
    icon: '✨',
    description: 'Hand-picked essentials'
  },
  curated: {
    text: 'Curated',
    color: 'purple',
    bgColor: 'bg-purple-100',
    textColor: 'text-purple-800',
    icon: '🎯',
    description: 'Expertly selected'
  },
  popular: {
    text: 'Popular',
    color: 'blue',
    bgColor: 'bg-blue-100',
    textColor: 'text-blue-800',
    icon: '🔥',
    description: 'Crowd favorites'
  },
  comprehensive: {
    text: 'Comprehensive',
    color: 'indigo',
    bgColor: 'bg-indigo-100',
    textColor: 'text-indigo-800',
    icon: '📚',
    description: 'Complete guide'
  },
  explore_all: {
    text: 'Explore All',
    color: 'gray',
    bgColor: 'bg-gray-100',
    textColor: 'text-gray-800',
    icon: '🌍',
    description: 'Full collection'
  }
};

/**
 * Get collection badge based on amenity count
 */
export const getCollectionBadge = (count: number): CollectionBadge => {
  if (count <= COLLECTION_SIZES.MICRO.max) return COLLECTION_BADGES.micro;
  if (count <= COLLECTION_SIZES.CURATED.max) return COLLECTION_BADGES.curated;
  if (count <= COLLECTION_SIZES.POPULAR.max) return COLLECTION_BADGES.popular;
  if (count <= COLLECTION_SIZES.COMPREHENSIVE.max) return COLLECTION_BADGES.comprehensive;
  return COLLECTION_BADGES.explore_all;
};

/**
 * Get collection badge with custom thresholds
 */
export const getCustomCollectionBadge = (
  count: number, 
  thresholds: { [key: string]: number } = {}
): CollectionBadge => {
  const customThresholds = {
    micro: thresholds.micro || 10,
    curated: thresholds.curated || 25,
    popular: thresholds.popular || 50,
    comprehensive: thresholds.comprehensive || 100
  };

  if (count <= customThresholds.micro) return COLLECTION_BADGES.micro;
  if (count <= customThresholds.curated) return COLLECTION_BADGES.curated;
  if (count <= customThresholds.popular) return COLLECTION_BADGES.popular;
  if (count <= customThresholds.comprehensive) return COLLECTION_BADGES.comprehensive;
  return COLLECTION_BADGES.explore_all;
};

/**
 * Get badge with additional context (time, terminal, etc.)
 */
export const getContextualBadge = (
  count: number,
  context: {
    timeOfDay?: string;
    terminal?: string;
    isFeatured?: boolean;
    isUniversal?: boolean;
  } = {}
): CollectionBadge => {
  const baseBadge = getCollectionBadge(count);
  
  // Enhance badge based on context
  if (context.isFeatured) {
    return {
      ...baseBadge,
      text: `${baseBadge.text} ✨`,
      bgColor: 'bg-yellow-100',
      textColor: 'text-yellow-800'
    };
  }
  
  if (context.isUniversal) {
    return {
      ...baseBadge,
      text: `${baseBadge.text} 🌍`,
      bgColor: 'bg-green-100',
      textColor: 'text-green-800'
    };
  }
  
  if (context.terminal && context.terminal.includes('T1')) {
    return {
      ...baseBadge,
      text: `${baseBadge.text} 🎯`,
      description: `${baseBadge.description} - Terminal specific`
    };
  }
  
  return baseBadge;
};

/**
 * Get badge size class for responsive design
 */
export const getBadgeSizeClass = (size: 'sm' | 'md' | 'lg' = 'md'): string => {
  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base'
  };
  return sizeClasses[size];
};

/**
 * Get full badge HTML classes for Tailwind
 */
export const getBadgeClasses = (
  badge: CollectionBadge, 
  size: 'sm' | 'md' | 'lg' = 'md'
): string => {
  const sizeClass = getBadgeSizeClass(size);
  return `${badge.bgColor} ${badge.textColor} ${sizeClass} rounded-full font-medium inline-flex items-center gap-1`;
};

/**
 * Get badge with count display
 */
export const getBadgeWithCount = (count: number): CollectionBadge & { count: number } => {
  const badge = getCollectionBadge(count);
  return {
    ...badge,
    text: `${badge.text} (${count})`,
    count
  };
};

/**
 * Get collection size description
 */
export const getCollectionSizeDescription = (count: number): string => {
  if (count <= 10) return 'Perfect for quick visits';
  if (count <= 25) return 'Curated selection of highlights';
  if (count <= 50) return 'Popular spots and hidden gems';
  if (count <= 100) return 'Comprehensive guide to the terminal';
  return 'Complete exploration of all amenities';
};

/**
 * Get collection difficulty level
 */
export const getCollectionDifficulty = (count: number): {
  level: 'Easy' | 'Moderate' | 'Challenging';
  description: string;
  timeEstimate: string;
} => {
  if (count <= 15) {
    return {
      level: 'Easy',
      description: 'Quick tour, perfect for short layovers',
      timeEstimate: '15-30 minutes'
    };
  }
  
  if (count <= 35) {
    return {
      level: 'Moderate',
      description: 'Balanced exploration, good for medium layovers',
      timeEstimate: '30-60 minutes'
    };
  }
  
  return {
    level: 'Challenging',
    description: 'Full exploration, best for long layovers',
    timeEstimate: '1-2 hours'
  };
};

// React component helper (if you want to use it directly)
export const CollectionBadgeComponent = ({ 
  count, 
  size = 'md',
  showDescription = false,
  className = ''
}: {
  count: number;
  size?: 'sm' | 'md' | 'lg';
  showDescription?: boolean;
  className?: string;
}) => {
  const badge = getCollectionBadge(count);
  const badgeClasses = getBadgeClasses(badge, size);
  
  return (
    <div className={`${badgeClasses} ${className}`}>
      <span>{badge.icon}</span>
      <span>{badge.text}</span>
      {showDescription && (
        <span className="text-xs opacity-75 ml-2">
          {badge.description}
        </span>
      )}
    </div>
  );
};
