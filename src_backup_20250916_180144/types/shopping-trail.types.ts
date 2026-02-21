// Shopping Trail TypeScript Interfaces
// Provides type safety for the Singapore shopping trail feature

export interface CollectionAmenity {
  priority: number;
  is_featured: boolean;
  amenity_detail: AmenityDetail;
}

export interface AmenityDetail {
  id: string;
  name: string;
  description: string;
  vibe_tags: string[];
  price_level: string;
  opening_hours: Record<string, string>;
  latitude: number;
  longitude: number;
  category?: string;
  terminal_code?: string;
  slug?: string;
}

export interface CollectionDetails {
  collection_id: string;
  name: string;
  description: string;
  collection_amenities: CollectionAmenity[];
  total_amenities: number;
  featured_count: number;
}

export interface VisitData {
  amenityId: string;
  rating: number;
  amount: number;
  timestamp?: Date;
}

export interface UserProgress {
  user_id: string;
  collection_slug: string;
  visited_amenities: string[];
  total_spent: number;
  average_rating: number;
  completion_percentage: number;
  last_visit_date?: Date;
  created_at: Date;
  updated_at: Date;
}

export interface CompletionStats {
  visited: number;
  total: number;
  percentage: number;
  remaining: number;
  total_spent: number;
  average_rating: number;
}

export interface TrailInsights {
  popular_amenities: Array<{
    amenity_id: string;
    name: string;
    visit_count: number;
    average_rating: number;
  }>;
  total_visitors: number;
  average_completion: number;
  top_spending_amenities: Array<{
    amenity_id: string;
    name: string;
    total_spent: number;
  }>;
}

export interface ShoppingTrailConfig {
  collectionSlug: string;
  collectionUUID: string;
  cacheDuration: number;
  maxRating: number;
  minRating: number;
}

// Error types for better error handling
export class ShoppingTrailError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any
  ) {
    super(message);
    this.name = 'ShoppingTrailError';
  }
}

export class ValidationError extends ShoppingTrailError {
  constructor(message: string, details?: any) {
    super(message, 'VALIDATION_ERROR', details);
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends ShoppingTrailError {
  constructor(message: string = 'User not authenticated') {
    super(message, 'AUTHENTICATION_ERROR');
    this.name = 'AuthenticationError';
  }
}

export class DatabaseError extends ShoppingTrailError {
  constructor(message: string, details?: any) {
    super(message, 'DATABASE_ERROR', details);
    this.name = 'DatabaseError';
  }
}
