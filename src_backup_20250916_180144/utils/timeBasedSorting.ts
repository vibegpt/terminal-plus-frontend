// Time-based sorting utilities for amenities
export interface Amenity {
  name: string;
  category?: string;
  vibe_tags?: string[];
  opening_hours?: any;
  price_tier?: string;
  [key: string]: any;
}

// Time of day definitions
export const TIME_PERIODS = {
  EARLY_MORNING: { start: 5, end: 9, name: 'Early Morning' },
  MORNING: { start: 9, end: 12, name: 'Morning' },
  LUNCH: { start: 12, end: 15, name: 'Lunch' },
  AFTERNOON: { start: 15, end: 18, name: 'Afternoon' },
  EVENING: { start: 18, end: 21, name: 'Evening' },
  LATE_NIGHT: { start: 21, end: 5, name: 'Late Night' }
} as const;

// Priority keywords for each time period
export const TIME_PRIORITIES = {
  [TIME_PERIODS.EARLY_MORNING.name]: {
    high: ['Coffee', 'Breakfast', 'Bakery', 'Juice', 'Smoothie'],
    medium: ['Lounge', 'Quiet', 'Work', 'Comfort'],
    low: ['Bar', 'Dinner', 'Entertainment']
  },
  [TIME_PERIODS.MORNING.name]: {
    high: ['Coffee', 'Breakfast', 'Work', 'Lounge', 'Quiet'],
    medium: ['Shopping', 'Wellness', 'Explore'],
    low: ['Bar', 'Dinner', 'Entertainment']
  },
  [TIME_PERIODS.LUNCH.name]: {
    high: ['Restaurant', 'Food', 'Lunch', 'Quick', 'Refuel'],
    medium: ['Coffee', 'Work', 'Lounge'],
    low: ['Bar', 'Entertainment', 'Wellness']
  },
  [TIME_PERIODS.AFTERNOON.name]: {
    high: ['Work', 'Lounge', 'Comfort', 'Explore', 'Shopping'],
    medium: ['Coffee', 'Food', 'Wellness'],
    low: ['Bar', 'Entertainment']
  },
  [TIME_PERIODS.EVENING.name]: {
    high: ['Dinner', 'Restaurant', 'Bar', 'Lounge', 'Entertainment'],
    medium: ['Work', 'Shopping', 'Explore'],
    low: ['Breakfast', 'Coffee']
  },
  [TIME_PERIODS.LATE_NIGHT.name]: {
    high: ['Bar', 'Lounge', '24/7', 'Quick', 'Comfort'],
    medium: ['Work', 'Entertainment'],
    low: ['Breakfast', 'Coffee', 'Restaurant']
  }
} as const;

/**
 * Get current time period
 */
export const getCurrentTimePeriod = (): string => {
  const hour = new Date().getHours();
  
  if (hour >= 5 && hour < 9) return TIME_PERIODS.EARLY_MORNING.name;
  if (hour >= 9 && hour < 12) return TIME_PERIODS.MORNING.name;
  if (hour >= 12 && hour < 15) return TIME_PERIODS.LUNCH.name;
  if (hour >= 15 && hour < 18) return TIME_PERIODS.AFTERNOON.name;
  if (hour >= 18 && hour < 21) return TIME_PERIODS.EVENING.name;
  return TIME_PERIODS.LATE_NIGHT.name;
};

/**
 * Calculate priority score for an amenity based on time
 */
export const calculateTimePriority = (amenity: Amenity, timePeriod: string): number => {
  const priorities = TIME_PRIORITIES[timePeriod as keyof typeof TIME_PRIORITIES];
  if (!priorities) return 0;
  
  const name = amenity.name.toLowerCase();
  const category = amenity.category?.toLowerCase() || '';
  const vibeTags = Array.isArray(amenity.vibe_tags) 
    ? amenity.vibe_tags.map(tag => tag.toLowerCase())
    : [];
  
  // Check high priority keywords
  for (const keyword of priorities.high) {
    if (name.includes(keyword.toLowerCase()) || 
        category.includes(keyword.toLowerCase()) ||
        vibeTags.some(tag => tag.includes(keyword.toLowerCase()))) {
      return 3;
    }
  }
  
  // Check medium priority keywords
  for (const keyword of priorities.medium) {
    if (name.includes(keyword.toLowerCase()) || 
        category.includes(keyword.toLowerCase()) ||
        vibeTags.some(tag => tag.includes(keyword.toLowerCase()))) {
      return 2;
    }
  }
  
  // Check low priority keywords
  for (const keyword of priorities.low) {
    if (name.includes(keyword.toLowerCase()) || 
        category.includes(keyword.toLowerCase()) ||
        vibeTags.some(tag => tag.includes(keyword.toLowerCase()))) {
      return 1;
    }
  }
  
  return 0;
};

/**
 * Sort amenities based on current time of day
 */
export const sortByTimeContext = (amenities: Amenity[]): Amenity[] => {
  const timePeriod = getCurrentTimePeriod();
  
  return [...amenities].sort((a, b) => {
    const priorityA = calculateTimePriority(a, timePeriod);
    const priorityB = calculateTimePriority(b, timePeriod);
    
    // Sort by priority (highest first)
    if (priorityA !== priorityB) {
      return priorityB - priorityA;
    }
    
    // If same priority, maintain original order
    return 0;
  });
};

/**
 * Sort amenities with custom time period
 */
export const sortByCustomTime = (amenities: Amenity[], customHour: number): Amenity[] => {
  let timePeriod: string;
  
  if (customHour >= 5 && customHour < 9) timePeriod = TIME_PERIODS.EARLY_MORNING.name;
  else if (customHour >= 9 && customHour < 12) timePeriod = TIME_PERIODS.MORNING.name;
  else if (customHour >= 12 && customHour < 15) timePeriod = TIME_PERIODS.LUNCH.name;
  else if (customHour >= 15 && customHour < 18) timePeriod = TIME_PERIODS.AFTERNOON.name;
  else if (customHour >= 18 && customHour < 21) timePeriod = TIME_PERIODS.EVENING.name;
  else timePeriod = TIME_PERIODS.LATE_NIGHT.name;
  
  return sortByTimeContext(amenities);
};

/**
 * Enhanced sorting with multiple factors
 */
export const sortByContextEnhanced = (
  amenities: Amenity[], 
  options: {
    timeBased?: boolean;
    priceBased?: boolean;
    ratingBased?: boolean;
    distanceBased?: boolean;
  } = {}
): Amenity[] => {
  let sorted = [...amenities];
  
  // Time-based sorting (highest priority)
  if (options.timeBased !== false) {
    sorted = sortByTimeContext(sorted);
  }
  
  // Price-based sorting (if price data available)
  if (options.priceBased && sorted.some(a => a.price_tier)) {
    sorted.sort((a, b) => {
      const priceOrder = { '$': 1, '$$': 2, '$$$': 3, '$$$$': 4 };
      const priceA = priceOrder[a.price_tier as keyof typeof priceOrder] || 0;
      const priceB = priceOrder[b.price_tier as keyof typeof priceOrder] || 0;
      return priceA - priceB;
    });
  }
  
  // Rating-based sorting (if rating data available)
  if (options.ratingBased && sorted.some(a => a.rating)) {
    sorted.sort((a, b) => (b.rating || 0) - (a.rating || 0));
  }
  
  return sorted;
};

/**
 * Get time-based collection recommendations
 */
export const getTimeBasedRecommendations = (amenities: Amenity[], limit: number = 5): Amenity[] => {
  const sorted = sortByTimeContext(amenities);
  return sorted.slice(0, limit);
};

/**
 * Simple time-based sorting (your original approach, enhanced)
 */
export const sortByContext = (amenities: Amenity[]): Amenity[] => {
  const hour = new Date().getHours();
  
  if (hour < 10) {
    // Morning: Prioritize coffee & breakfast
    return [...amenities].sort((a, b) => {
      const aScore = a.name.includes('Coffee') || a.name.includes('Breakfast') ? 1 : 0;
      const bScore = b.name.includes('Coffee') || b.name.includes('Breakfast') ? 1 : 0;
      return bScore - aScore;
    });
  } else if (hour > 20) {
    // Evening: Prioritize bars & lounges
    return [...amenities].sort((a, b) => {
      const aScore = a.name.includes('Bar') || a.name.includes('Lounge') ? 1 : 0;
      const bScore = b.name.includes('Bar') || b.name.includes('Lounge') ? 1 : 0;
      return bScore - aScore;
    });
  }
  
  return amenities;
};
