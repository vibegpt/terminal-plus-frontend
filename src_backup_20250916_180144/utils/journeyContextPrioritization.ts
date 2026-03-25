// Journey context-based collection prioritization utilities
export interface Collection {
  id: string;
  collection_id?: string;
  name: string;
  title?: string;
  description?: string;
  icon?: string;
  gradient?: string;
  universal?: boolean;
  featured?: boolean;
  amenity_count?: number;
  [key: string]: any;
}

export interface UserContext {
  journeyType: 'departure' | 'arrival' | 'transit' | 'layover';
  timeOfDay: 'early_morning' | 'morning' | 'lunch' | 'afternoon' | 'evening' | 'late_night';
  duration: 'short' | 'medium' | 'long';
  purpose: 'business' | 'leisure' | 'family' | 'solo';
  terminal?: string;
  airport?: string;
}

// Collection priority mappings for different journey contexts
export const JOURNEY_PRIORITIES = {
  // Morning departure contexts
  'morning_departure': {
    high: ['coffee-chill', 'quick-bites', 'sydney-coffee', 'breakfast-spots'],
    medium: ['work-spaces', 'lounge-life', 'duty-free'],
    low: ['entertainment', 'bars', 'dinner-spots']
  },
  
  // Evening arrival contexts
  'evening_arrival': {
    high: ['sydney-harbour-vibes', 'true-blue-aussie', 'dinner-spots', 'bars'],
    medium: ['lounge-life', 'transport', 'stay-connected'],
    low: ['breakfast-spots', 'coffee-chill', 'work-spaces']
  },
  
  // Long layover contexts
  'long_layover': {
    high: ['lounge-life', 'duty-free', 'healthy-choices', 'entertainment'],
    medium: ['work-spaces', 'wellness', 'explore'],
    low: ['quick-bites', 'coffee-chill']
  },
  
  // Late night contexts
  'late_night': {
    high: ['24-7-heroes', 'stay-connected', 'comfort-spaces', 'quick-bites'],
    medium: ['lounge-life', 'work-spaces'],
    low: ['breakfast-spots', 'coffee-chill', 'entertainment']
  },
  
  // Business travel
  'business_travel': {
    high: ['work-spaces', 'lounge-life', 'quick-bites', 'stay-connected'],
    medium: ['coffee-chill', 'duty-free', 'transport'],
    low: ['entertainment', 'bars', 'wellness']
  },
  
  // Family travel
  'family_travel': {
    high: ['family-friendly', 'entertainment', 'quick-bites', 'comfort-spaces'],
    medium: ['explore', 'duty-free', 'lounge-life'],
    low: ['work-spaces', 'bars', 'wellness']
  },
  
  // Solo exploration
  'solo_exploration': {
    high: ['explore', 'entertainment', 'wellness', 'bars'],
    medium: ['coffee-chill', 'work-spaces', 'duty-free'],
    low: ['family-friendly', 'quick-bites']
  }
} as const;

/**
 * Get journey context based on user parameters
 */
export const getJourneyContext = (
  journeyType: string,
  timeOfDay: string,
  duration: string,
  purpose: string
): string => {
  // Primary context
  if (journeyType === 'departure' && timeOfDay === 'morning') return 'morning_departure';
  if (journeyType === 'arrival' && timeOfDay === 'evening') return 'evening_arrival';
  if (duration === 'long') return 'long_layover';
  if (timeOfDay === 'late_night') return 'late_night';
  
  // Purpose-based contexts
  if (purpose === 'business') return 'business_travel';
  if (purpose === 'family') return 'family_travel';
  if (purpose === 'leisure' && journeyType === 'transit') return 'solo_exploration';
  
  // Default context
  return 'general';
};

/**
 * Calculate priority score for a collection based on journey context
 */
export const calculateJourneyPriority = (
  collection: Collection,
  context: string
): number => {
  const priorities = JOURNEY_PRIORITIES[context as keyof typeof JOURNEY_PRIORITIES];
  if (!priorities) return 0;
  
  const collectionId = collection.id || collection.collection_id || '';
  
  // Check high priority collections
  if (priorities.high.some(id => collectionId.includes(id))) return 3;
  
  // Check medium priority collections
  if (priorities.medium.some(id => collectionId.includes(id))) return 2;
  
  // Check low priority collections
  if (priorities.low.some(id => collectionId.includes(id))) return 1;
  
  return 0;
};

/**
 * Reorder collections based on journey context
 */
export const prioritizeCollections = (
  collections: Collection[],
  userContext: UserContext
): Collection[] => {
  const context = getJourneyContext(
    userContext.journeyType,
    userContext.timeOfDay,
    userContext.duration,
    userContext.purpose
  );
  
  return [...collections].sort((a, b) => {
    const priorityA = calculateJourneyPriority(a, context);
    const priorityB = calculateJourneyPriority(b, context);
    
    // Sort by priority (highest first)
    if (priorityA !== priorityB) {
      return priorityB - priorityA;
    }
    
    // If same priority, sort by featured status
    if (a.featured !== b.featured) {
      return a.featured ? -1 : 1;
    }
    
    // If same featured status, sort by amenity count (more amenities first)
    if (a.amenity_count !== b.amenity_count) {
      return (b.amenity_count || 0) - (a.amenity_count || 0);
    }
    
    // Maintain original order for everything else
    return 0;
  });
};

/**
 * Get context-specific collection recommendations
 */
export const getContextRecommendations = (
  collections: Collection[],
  userContext: UserContext,
  limit: number = 5
): Collection[] => {
  const prioritized = prioritizeCollections(collections, userContext);
  return prioritized.slice(0, limit);
};

/**
 * Enhanced prioritization with multiple factors
 */
export const prioritizeCollectionsEnhanced = (
  collections: Collection[],
  userContext: UserContext,
  options: {
    includeTimeBased?: boolean;
    includeTerminalSpecific?: boolean;
    includeUniversal?: boolean;
    maxResults?: number;
  } = {}
): Collection[] => {
  let prioritized = prioritizeCollections(collections, userContext);
  
  // Filter by terminal specificity if requested
  if (options.includeTerminalSpecific !== false && userContext.terminal) {
    const terminalSpecific = prioritized.filter(c => !c.universal);
    const universal = prioritized.filter(c => c.universal);
    prioritized = [...terminalSpecific, ...universal];
  }
  
  // Limit results if specified
  if (options.maxResults) {
    prioritized = prioritized.slice(0, options.maxResults);
  }
  
  return prioritized;
};

/**
 * Get journey context description
 */
export const getJourneyContextDescription = (context: string): string => {
  const descriptions = {
    'morning_departure': 'Perfect for early travelers - coffee, quick bites, and essentials',
    'evening_arrival': 'Welcome to Sydney - harbor views, local dining, and arrival comforts',
    'long_layover': 'Make the most of your time - lounges, shopping, and entertainment',
    'late_night': '24/7 options for late travelers - comfort, connectivity, and quick services',
    'business_travel': 'Business-focused amenities - work spaces, lounges, and efficiency',
    'family_travel': 'Family-friendly options - entertainment, comfort, and convenience',
    'solo_exploration': 'Solo adventure ready - exploration, wellness, and unique experiences'
  };
  
  return descriptions[context as keyof typeof descriptions] || 'General recommendations for all travelers';
};

/**
 * Get context-appropriate greeting
 */
export const getContextGreeting = (userContext: UserContext): string => {
  const { journeyType, timeOfDay, purpose } = userContext;
  
  if (journeyType === 'departure') {
    if (timeOfDay === 'morning') return 'Good morning! Ready for your journey?';
    if (timeOfDay === 'evening') return 'Good evening! Safe travels ahead!';
    return 'Safe travels! Here are some great options before you go.';
  }
  
  if (journeyType === 'arrival') {
    if (timeOfDay === 'morning') return 'Welcome to Sydney! Start your day right.';
    if (timeOfDay === 'evening') return 'Welcome! Time to unwind and explore.';
    return 'Welcome! Here are some great ways to start your visit.';
  }
  
  if (purpose === 'business') return 'Business travel made easy. Here are your options.';
  if (purpose === 'family') return 'Family fun awaits! Here are some great choices.';
  
  return 'Welcome! Here are some collections to explore.';
};

/**
 * Simple prioritization (your original approach, enhanced)
 */
export const prioritizeCollectionsSimple = (
  collections: Collection[],
  userContext: string
): Collection[] => {
  const priorities = {
    'morning_departure': ['coffee-chill', 'quick-bites', 'sydney-coffee'],
    'evening_arrival': ['sydney-harbour-vibes', 'true-blue-aussie'],
    'long_layover': ['lounge-life', 'duty-free', 'healthy-choices'],
    'late_night': ['24-7-heroes', 'stay-connected']
  };
  
  const contextPriorities = priorities[userContext as keyof typeof priorities] || [];
  
  return [...collections].sort((a, b) => {
    const aIndex = contextPriorities.indexOf(a.id);
    const bIndex = contextPriorities.indexOf(b.id);
    
    // If both are in priorities, sort by priority order
    if (aIndex !== -1 && bIndex !== -1) {
      return aIndex - bIndex;
    }
    
    // If only one is in priorities, prioritize it
    if (aIndex !== -1) return -1;
    if (bIndex !== -1) return 1;
    
    // If neither is in priorities, maintain original order
    return 0;
  });
};
