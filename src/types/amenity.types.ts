export interface AmenityLocation {
  id: string;
  name: string;
  category: string;
  subcategory?: string;
  terminal?: string;
  location: string;
  priceRange?: string;
  accessibility?: boolean;
  rating?: number;
  hours?: string | Record<string, string>;
  tags?: string[];
  description?: string;
  image_url?: string;
  image?: string;
  walkTime?: number;
  crowdLevel?: 'low' | 'medium' | 'high' | 'peak';
  waitTime?: number;
  urgency?: string;
}

export interface UserPreferences {
  categories: string[];
  priceRange?: string;
  accessibility?: boolean;
  rating?: number;
}

export interface Journey {
  id: string;
  userId: string;
  start: string;
  end: string;
  stops: AmenityLocation[];
  preferences: UserPreferences;
}

export function isJourney(obj: any): obj is Journey {
  return obj && typeof obj === 'object' && 'id' in obj && 'userId' in obj && Array.isArray(obj.stops);
} 