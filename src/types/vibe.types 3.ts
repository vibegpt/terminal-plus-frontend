// vibe.types.ts - Centralized vibe-related types and validation
// Used across components, hooks, and context for consistent vibe handling

// Vibe type definitions with runtime validation
export const VIBE_NAMES = [
  'relax', 
  'work', 
  'explore', 
  'quick', 
  'comfort', 
  'refuel'
] as const;

export type VibeType = typeof VIBE_NAMES[number];

// Vibe categories for grouping
export const VIBE_CATEGORIES = {
  ENERGY: ['work', 'quick'] as const,
  RELAXATION: ['relax', 'comfort'] as const,
  DISCOVERY: ['explore'] as const,
  PRACTICAL: ['refuel'] as const
} as const;

export type VibeCategory = keyof typeof VIBE_CATEGORIES;

// Vibe context types
export interface VibeContextProps {
  selectedVibe: VibeType | null;
  setVibe: (vibe: VibeType) => void;
  availableVibes: VibeType[];
  currentCategory?: VibeCategory;
}

// Vibe preferences and settings
export interface VibePreferences {
  favoriteVibes: VibeType[];
  excludedVibes: VibeType[];
  defaultVibe?: VibeType;
  autoSelect?: boolean;
}

// Vibe recommendation types
export interface VibeRecommendation {
  vibe: VibeType;
  confidence: number; // 0-1
  reason: string;
  context: string[];
}

// Runtime validation functions
export const isValidVibe = (vibe: string): vibe is VibeType => {
  return VIBE_NAMES.includes(vibe as VibeType);
};

export const validateVibe = (vibe: unknown): VibeType | null => {
  if (typeof vibe === 'string' && isValidVibe(vibe)) {
    return vibe;
  }
  return null;
};

export const getVibeCategory = (vibe: VibeType): VibeCategory | null => {
  for (const [category, vibes] of Object.entries(VIBE_CATEGORIES)) {
    if ((vibes as readonly VibeType[]).includes(vibe)) {
      return category as VibeCategory;
    }
  }
  return null;
};

export const getVibesByCategory = (category: VibeCategory): VibeType[] => {
  return [...VIBE_CATEGORIES[category]];
};

export const getAllVibes = (): VibeType[] => {
  return [...VIBE_NAMES];
};

// Vibe compatibility and scoring
export interface VibeCompatibility {
  vibe: VibeType;
  score: number; // 0-100
  factors: {
    timeOfDay: number;
    journeyType: number;
    userPreferences: number;
    context: number;
  };
}

export const calculateVibeCompatibility = (
  vibe: VibeType,
  context: {
    timeOfDay: number; // 0-23
    journeyType: 'transit' | 'departure' | 'arrival';
    userPreferences: VibePreferences;
    stressLevel: 'low' | 'medium' | 'high';
  }
): VibeCompatibility => {
  let score = 50; // Base score
  const factors = {
    timeOfDay: 0,
    journeyType: 0,
    userPreferences: 0,
    context: 0
  };

  // Time of day factor
  const hour = context.timeOfDay;
  if (hour >= 6 && hour < 12) {
    // Morning - prefer energizing vibes
    if (VIBE_CATEGORIES.ENERGY.includes(vibe as any)) {
      factors.timeOfDay = 25;
      score += 25;
    }
  } else if (hour >= 12 && hour < 18) {
    // Afternoon - balanced
    factors.timeOfDay = 15;
    score += 15;
  } else if (hour >= 18 && hour < 22) {
    // Evening - prefer relaxing vibes
    if (VIBE_CATEGORIES.RELAXATION.includes(vibe as any)) {
      factors.timeOfDay = 25;
      score += 25;
    }
  } else {
    // Night - very relaxing
    if (VIBE_CATEGORIES.RELAXATION.includes(vibe as any)) {
      factors.timeOfDay = 30;
      score += 30;
    }
  }

  // Journey type factor
  if (context.journeyType === 'transit') {
    if (VIBE_CATEGORIES.PRACTICAL.includes(vibe as any)) {
      factors.journeyType = 20;
      score += 20;
    }
  } else if (context.journeyType === 'departure') {
    if (VIBE_CATEGORIES.ENERGY.includes(vibe as any)) {
      factors.journeyType = 20;
      score += 20;
    }
  }

  // User preferences factor
  if (context.userPreferences.favoriteVibes.includes(vibe)) {
    factors.userPreferences = 30;
    score += 30;
  } else if (context.userPreferences.excludedVibes.includes(vibe)) {
    factors.userPreferences = -20;
    score -= 20;
  }

  // Stress level factor
  if (context.stressLevel === 'high') {
    if (VIBE_CATEGORIES.RELAXATION.includes(vibe as any)) {
      factors.context = 25;
      score += 25;
    }
  } else if (context.stressLevel === 'low') {
    if (VIBE_CATEGORIES.ENERGY.includes(vibe as any)) {
      factors.context = 20;
      score += 20;
    }
  }

  return {
    vibe,
    score: Math.max(0, Math.min(100, score)),
    factors
  };
};

// Type guards for runtime safety
export const isVibeType = (value: unknown): value is VibeType => {
  return typeof value === 'string' && isValidVibe(value);
};

export const isVibePreferences = (value: unknown): value is VibePreferences => {
  if (!value || typeof value !== 'object') return false;
  const prefs = value as any;
  
  return (
    Array.isArray(prefs.favoriteVibes) &&
    Array.isArray(prefs.excludedVibes) &&
    prefs.favoriteVibes.every(isVibeType) &&
    prefs.excludedVibes.every(isVibeType) &&
    (prefs.defaultVibe === undefined || isVibeType(prefs.defaultVibe)) &&
    (prefs.autoSelect === undefined || typeof prefs.autoSelect === 'boolean')
  );
};

export const isVibeRecommendation = (value: unknown): value is VibeRecommendation => {
  if (!value || typeof value !== 'object') return false;
  const rec = value as any;
  
  return (
    isVibeType(rec.vibe) &&
    typeof rec.confidence === 'number' &&
    rec.confidence >= 0 &&
    rec.confidence <= 1 &&
    typeof rec.reason === 'string' &&
    Array.isArray(rec.context) &&
    rec.context.every((c: unknown) => typeof c === 'string')
  );
}; 