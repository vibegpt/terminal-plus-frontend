import { TerminalAmenity } from '../types/amenity.types';

// Import VIBE_CONFIG from App.tsx
// Note: In a real app, this would be in a shared config file
const VIBE_CONFIG = {
  relationships: {
    'chill': ['quiet', 'spa', 'lounge', 'wellness', 'calm'],
    'refuel': ['food', 'restaurant', 'cafe', 'grab-and-go', 'snacks'],
    'comfort': ['lounge', 'wellness', 'massage', 'quiet', 'relaxation'],
    'explore': ['duty-free', 'events', 'pop-up', 'local-products', 'souvenirs', 'discover'],
    'quick': ['express', 'grab-and-go', 'fast-food', 'convenience', 'urgent'],
    'work': ['workspace', 'wifi', 'business', 'quiet', 'focus'],
    'shop': ['fashion', 'souvenirs', 'gifts', 'electronics', 'luxury', 'duty-free']
  },

  scoring: {
    EXACT_MATCH: 10,
    RELATED_MATCH: 5,
    BASE_SCORE: 1,
    PROXIMITY_MULTIPLIER: 3,
    VARIETY_BONUS: 2,
    ANTI_VIBE_PENALTY: -3
  },

  hasAntiVibe(selectedVibe: string, amenityTags: string[]) {
    const antiVibes: Record<string, string[]> = {
      'chill': ['loud', 'crowded', 'energetic', 'busy'],
      'refuel': ['bar', 'nightlife', 'alcohol-only'],
      'comfort': ['loud', 'party', 'standing-only'],
      'explore': ['quiet-zone', 'business-only', 'restricted-access'],
      'quick': ['full-service', 'lengthy', 'slow'],
      'work': ['loud', 'social', 'party', 'entertainment'],
      'shop': ['closed', 'appointment-only', 'business-zone']
    };
    
    const conflicting = antiVibes[selectedVibe] || [];
    return amenityTags.some(tag => conflicting.includes(tag));
  }
};

interface RecommendationContext {
  current_terminal: string;
  current_gate: string;
  time_available_minutes: number;
  active_vibe: string;
  previous_vibe?: string;
  priority_flags: {
    show_time_sensitive: boolean;
    avoid_long_walks: boolean;
    prefer_quick_restore: boolean;
  };
  user_preferences?: UserPreferences;
  user_history?: UserHistory;
  current_location: Coordinates;
}

interface RecommendedAction {
  title: string;
  type: string;
  slug: string;
  description: string;
  estimated_time_minutes: number;
  distance_meters: number;
  match_score: number;
  urgency: 'low' | 'medium' | 'high';
  transitions_well_from: string[];
  image_url: string;
  availability: 'low' | 'medium' | 'high';
  map_coordinates: {
    x: number;
    y: number;
  };
  tags: string[];
}

interface RecommendationResponse {
  user_id: string;
  current_terminal: string;
  current_gate: string;
  current_time_utc: string;
  boarding_time_utc: string;
  time_available_minutes: number;
  active_vibe: string;
  previous_vibe?: string;
  vibe_changed: boolean;
  recommendation_strategy: string;
  priority_flags: {
    show_time_sensitive: boolean;
    avoid_long_walks: boolean;
    prefer_quick_restore: boolean;
  };
  suggested_actions: RecommendedAction[];
  events: {
    vibe_change_detected: boolean;
    recalculate_time_triggered: boolean;
    user_action_pending: boolean;
  };
  generated_at: string;
}

// Enhanced vibe mappings with weights and transitions
interface VibeMapping {
  amenity_types: string[];
  weight: number;
  transitions: {
    from: string[];
    to: string[];
  };
  time_preferences: {
    min_time: number;
    max_time: number;
    ideal_time: number;
  };
}

const VIBE_MAPPINGS: Record<string, VibeMapping> = {
  'Chill': {
    amenity_types: [
      'Lounge', 'Spa', 'Quiet Zone', 'Rest Area', 'Meditation Space',
      'Airline Lounge', 'Credit Card Lounge', 'Independent Lounge', 'Airline Alliance Lounge'
    ],
    weight: 1.0,
    transitions: {
      from: ['Explore', 'Work', 'Social'],
      to: ['Comfort', 'Quick']
    },
    time_preferences: {
      min_time: 15,
      max_time: 120,
      ideal_time: 45
    }
  },
  'Explore': {
    amenity_types: ['Art Gallery', 'Garden', 'Observation Deck', 'Shopping', 'Local Food'],
    weight: 1.0,
    transitions: {
      from: ['Relax', 'Work'],
      to: ['Social', 'Quick']
    },
    time_preferences: {
      min_time: 20,
      max_time: 90,
      ideal_time: 60
    }
  },
  'Quick': {
    amenity_types: ['Grab & Go', 'Express Food', 'Quick Service', 'Convenience Store'],
    weight: 1.2,
    transitions: {
      from: ['Relax', 'Explore', 'Work'],
      to: ['Comfort']
    },
    time_preferences: {
      min_time: 5,
      max_time: 30,
      ideal_time: 15
    }
  },
  'Comfort': {
    amenity_types: ['Lounge', 'Rest Area', 'Shower', 'Prayer Room', 'Family Room'],
    weight: 1.0,
    transitions: {
      from: ['Quick', 'Work'],
      to: ['Relax']
    },
    time_preferences: {
      min_time: 10,
      max_time: 60,
      ideal_time: 30
    }
  },
  'Work': {
    amenity_types: ['Business Center', 'Work Pod', 'Meeting Room', 'Co-working Space'],
    weight: 0.9,
    transitions: {
      from: ['Relax', 'Social'],
      to: ['Quick', 'Comfort']
    },
    time_preferences: {
      min_time: 30,
      max_time: 180,
      ideal_time: 90
    }
  },
  'Social': {
    amenity_types: ['Bar', 'Restaurant', 'Cafe', 'Social Space', 'Entertainment'],
    weight: 1.1,
    transitions: {
      from: ['Work', 'Explore'],
      to: ['Quick', 'Comfort']
    },
    time_preferences: {
      min_time: 20,
      max_time: 90,
      ideal_time: 45
    }
  },
  'Shop': {
    amenity_types: ['Shopping', 'Gift Shop', 'Duty Free', 'Boutique', 'Bookstore', 'Souvenir'],
    weight: 1.1,
    transitions: {
      from: ['Explore', 'Relax', 'Quick'],
      to: ['Quick', 'Comfort']
    },
    time_preferences: {
      min_time: 10,
      max_time: 60,
      ideal_time: 30
    }
  },
};

// Calculate time-based score
const calculateTimeScore = (
  amenity: TerminalAmenity,
  context: RecommendationContext,
  vibeMapping: VibeMapping
): number => {
  const { time_available_minutes } = context;
  const { min_time, max_time, ideal_time } = vibeMapping.time_preferences;
  
  // If time available is less than minimum time, heavily penalize
  if (time_available_minutes < min_time) {
    return 0.1;
  }
  
  // If time available is more than maximum time, slightly penalize
  if (time_available_minutes > max_time) {
    return 0.7;
  }
  
  // Calculate how close the time available is to the ideal time
  const timeDiff = Math.abs(time_available_minutes - ideal_time);
  const maxDiff = max_time - min_time;
  return 1 - (timeDiff / maxDiff);
};

// Calculate vibe transition score
const calculateTransitionScore = (
  context: RecommendationContext,
  vibeMapping: VibeMapping
): number => {
  if (!context.previous_vibe) return 1.0;
  
  const { transitions } = vibeMapping;
  if (transitions.from.includes(context.previous_vibe)) {
    return 1.2; // Boost score for good transitions
  }
  if (transitions.to.includes(context.previous_vibe)) {
    return 0.8; // Penalize for poor transitions
  }
  return 1.0;
};

// Calculate price tier score
const calculatePriceScore = (amenity: TerminalAmenity): number => {
  const priceTierScores: Record<string, number> = {
    '$': 1.0,
    '$$': 0.8,
    '$$$': 0.6,
    '$$$$': 0.4
  };
  return priceTierScores[amenity.price_tier] || 0.5;
};

// Calculate opening hours score
const calculateOpeningHoursScore = (amenity: TerminalAmenity): number => {
  const now = new Date();
  const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' });
  const currentTime = now.toLocaleTimeString('en-US', { hour12: false });
  
  const hours = amenity.opening_hours[currentDay];
  if (!hours) return 0.3; // Not open today
  
  const [open, close] = hours.split('-').map(t => t.trim());
  if (currentTime >= open && currentTime <= close) {
    return 1.0;
  }
  
  return 0.3; // Not open now
};

// Add new interfaces for user preferences and history
interface UserPreferences {
  preferred_price_tiers: string[];
  preferred_amenity_types: string[];
  preferred_vibes: string[];
  walking_speed_meters_per_minute: number;
  max_walking_distance_meters: number;
  time_preferences: {
    prefer_morning: boolean;
    prefer_afternoon: boolean;
    prefer_evening: boolean;
  };
}

interface UserHistory {
  visited_amenities: {
    amenity_slug: string;
    timestamp: string;
    vibe: string;
    duration_minutes: number;
    rating?: number;
  }[];
  vibe_transitions: {
    from: string;
    to: string;
    timestamp: string;
  }[];
}

interface Coordinates {
  x: number;
  y: number;
}

// Add coordinates to TerminalAmenity
interface TerminalAmenityWithLocation extends TerminalAmenity {
  coordinates: Coordinates;
}

// Calculate actual distance between two points
const calculateDistance = (point1: Coordinates, point2: Coordinates): number => {
  const dx = point2.x - point1.x;
  const dy = point2.y - point1.y;
  return Math.sqrt(dx * dx + dy * dy);
};

// Calculate walking time in minutes
const calculateWalkingTime = (
  distance: number,
  walkingSpeed: number = 80 // default 80 meters per minute
): number => {
  return Math.ceil(distance / walkingSpeed);
};

// Calculate user preference score
const calculateUserPreferenceScore = (
  amenity: TerminalAmenity,
  preferences: UserPreferences
): number => {
  let score = 0.5;
  let factors = 0;

  // Price tier preference
  if (preferences.preferred_price_tiers.includes(amenity.price_tier)) {
    score += 0.2;
    factors++;
  }

  // Amenity type preference
  if (preferences.preferred_amenity_types.includes(amenity.amenity_type)) {
    score += 0.2;
    factors++;
  }

  // Vibe preference
  if (preferences.preferred_vibes.some(vibe => 
    VIBE_MAPPINGS[vibe].amenity_types.includes(amenity.amenity_type)
  )) {
    score += 0.2;
    factors++;
  }

  // Time of day preference
  const currentHour = new Date().getHours();
  const isMorning = currentHour >= 5 && currentHour < 12;
  const isAfternoon = currentHour >= 12 && currentHour < 17;
  const isEvening = currentHour >= 17 || currentHour < 5;

  if ((isMorning && preferences.time_preferences.prefer_morning) ||
      (isAfternoon && preferences.time_preferences.prefer_afternoon) ||
      (isEvening && preferences.time_preferences.prefer_evening)) {
    score += 0.1;
    factors++;
  }

  return factors > 0 ? score / factors : 0.5;
};

// Calculate historical score
const calculateHistoricalScore = (
  amenity: TerminalAmenity,
  history: UserHistory
): number => {
  let score = 0.5;
  const visitedCount = history.visited_amenities.filter(
    v => v.amenity_slug === amenity.slug
  ).length;

  if (visitedCount > 0) {
    // If visited before, consider ratings and frequency
    const visits = history.visited_amenities.filter(v => v.amenity_slug === amenity.slug);
    const averageRating = visits.reduce((sum, visit) => sum + (visit.rating || 3), 0) / visits.length;
    score = 0.3 + (averageRating / 5) * 0.4; // Base 0.3 + up to 0.4 from rating
  } else {
    // If never visited, slightly boost score to encourage exploration
    score = 0.6;
  }

  return score;
};

// Enhanced distance score with actual calculations
const calculateDistanceScore = (
  amenity: TerminalAmenityWithLocation,
  context: RecommendationContext
): number => {
  const distance = calculateDistance(context.current_location, amenity.coordinates);
  const walkingTime = calculateWalkingTime(
    distance,
    context.user_preferences?.walking_speed_meters_per_minute
  );

  // If distance is beyond user's max walking distance, heavily penalize
  if (context.user_preferences?.max_walking_distance_meters && 
      distance > context.user_preferences.max_walking_distance_meters) {
    return 0.1;
  }

  // Score based on walking time relative to available time
  const timeRatio = walkingTime / context.time_available_minutes;
  if (timeRatio > 0.5) return 0.2; // More than 50% of time spent walking
  if (timeRatio > 0.3) return 0.4; // More than 30% of time spent walking
  if (timeRatio > 0.2) return 0.6; // More than 20% of time spent walking
  if (timeRatio > 0.1) return 0.8; // More than 10% of time spent walking
  return 1.0; // Less than 10% of time spent walking
};

// Update the match score calculation to include VIBE_CONFIG integration
const calculateMatchScore = (
  amenity: TerminalAmenity,
  context: RecommendationContext
): number => {
  const vibeMapping = VIBE_MAPPINGS[context.active_vibe];
  if (!vibeMapping) return 0.5;

  // Base score from vibe type matching
  const baseScore = vibeMapping.amenity_types.includes(amenity.amenity_type) ? 0.7 : 0.3;

  // Enhanced vibe scoring using VIBE_CONFIG
  let vibeScore = VIBE_CONFIG.scoring.BASE_SCORE;
  const amenityTags = (amenity.vibe_tags || []).map(tag => tag.toLowerCase());
  const selectedVibe = context.active_vibe.toLowerCase();

  // Check for exact vibe match
  if (amenityTags.includes(selectedVibe)) {
    vibeScore += VIBE_CONFIG.scoring.EXACT_MATCH;
  }

  // Check for related vibe matches
  const relatedTags = VIBE_CONFIG.relationships[selectedVibe] || [];
  const relatedMatches = amenityTags.filter(tag => relatedTags.includes(tag));
  vibeScore += relatedMatches.length * VIBE_CONFIG.scoring.RELATED_MATCH;

  // Check for anti-vibe conflicts
  if (VIBE_CONFIG.hasAntiVibe(selectedVibe, amenityTags)) {
    vibeScore += VIBE_CONFIG.scoring.ANTI_VIBE_PENALTY;
  }

  // Normalize vibe score to 0-1 range
  const normalizedVibeScore = Math.max(0, Math.min(1, vibeScore / 20)); // Assuming max score around 20

  // Calculate component scores
  const timeScore = calculateTimeScore(amenity, context, vibeMapping);
  const transitionScore = calculateTransitionScore(context, vibeMapping);
  const distanceScore = calculateDistanceScore(amenity, context);
  const priceScore = calculatePriceScore(amenity);
  const openingHoursScore = calculateOpeningHoursScore(amenity);

  // Calculate user preference and historical scores if available
  const userPreferenceScore = context.user_preferences 
    ? calculateUserPreferenceScore(amenity, context.user_preferences)
    : 0.5;

  const historicalScore = context.user_history
    ? calculateHistoricalScore(amenity, context.user_history)
    : 0.5;

  // Weighted combination of scores
  const weightedScore = (
    (baseScore + normalizedVibeScore) * 0.15 +
    timeScore * 0.15 +
    transitionScore * 0.1 +
    distanceScore * 0.15 +
    priceScore * 0.1 +
    openingHoursScore * 0.05 +
    userPreferenceScore * 0.15 +
    historicalScore * 0.1
  ) * vibeMapping.weight;

  // Apply priority flags
  let finalScore = weightedScore;

  if (context.priority_flags.show_time_sensitive) {
    finalScore *= timeScore;
  }

  if (context.priority_flags.avoid_long_walks) {
    finalScore *= distanceScore;
  }

  if (context.priority_flags.prefer_quick_restore) {
    finalScore *= timeScore;
  }

  return Math.min(finalScore, 1.0);
};

// Convert amenity to recommended action
const amenityToRecommendedAction = (
  amenity: TerminalAmenity,
  matchScore: number
): RecommendedAction => {
  // Generate slug from name if not provided
  const generateSlug = (name: string) => {
    return name.toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  return {
    title: amenity.name,
    type: amenity.amenity_type,
    slug: amenity.slug || generateSlug(amenity.name),
    description: amenity.location_description || amenity.description || '',
    estimated_time_minutes: 30, // This should be calculated based on amenity type
    distance_meters: 100, // This should be calculated based on actual location
    match_score: matchScore,
    urgency: 'medium',
    transitions_well_from: [], // This should be populated based on amenity type
    image_url: amenity.image_url || '',
    availability: 'high',
    map_coordinates: {
      x: 0.5, // These should be actual coordinates
      y: 0.5
    },
    tags: amenity.vibe_tags || []
  };
};

export const getRecommendations = async (
  amenities: TerminalAmenity[],
  context: RecommendationContext
): Promise<RecommendationResponse> => {
  // Filter and score amenities
  const scoredAmenities = amenities
    .map(amenity => ({
      amenity,
      score: calculateMatchScore(amenity, context)
    }))
    .sort((a, b) => b.score - a.score);

  // Convert to recommended actions
  const suggestedActions = scoredAmenities
    .slice(0, 5) // Take top 5 recommendations
    .map(({ amenity, score }) => amenityToRecommendedAction(amenity, score));

  // Create response
  const response: RecommendationResponse = {
    user_id: 'temp-user-id', // This should come from auth
    current_terminal: context.current_terminal,
    current_gate: context.current_gate,
    current_time_utc: new Date().toISOString(),
    boarding_time_utc: new Date(Date.now() + context.time_available_minutes * 60000).toISOString(),
    time_available_minutes: context.time_available_minutes,
    active_vibe: context.active_vibe,
    previous_vibe: context.previous_vibe,
    vibe_changed: !!context.previous_vibe && context.previous_vibe !== context.active_vibe,
    recommendation_strategy: 'match_vibe_time_distance_priority',
    priority_flags: context.priority_flags,
    suggested_actions: suggestedActions,
    events: {
      vibe_change_detected: !!context.previous_vibe && context.previous_vibe !== context.active_vibe,
      recalculate_time_triggered: true,
      user_action_pending: false
    },
    generated_at: new Date().toISOString()
  };

  return response;
}; 