// Social proof and activity types for Terminal+

import type { Vibe } from './common.types';

// Activity types for social proof
export type ActivityType = 
  | 'terminal_visited'
  | 'amenity_reviewed'
  | 'trip_planned'
  | 'achievement_earned'
  | 'user_followed'
  | 'favorite_added'
  | 'photo_shared'
  | 'checkin'
  | 'review' 
  | 'favorite'
  | 'photo'
  | 'discover';

// Social activity interface
export interface SocialActivity {
  id: string;
  userId: string;
  username: string;
  userAvatar?: string;
  activityType: ActivityType;
  location: string;
  terminal?: string;
  timestamp: Date;
  vibe: Vibe;
  rating?: number;
  comment?: string;
  photoUrl?: string;
  tags?: string[];
  metadata?: {
    deviceType?: string;
    appVersion?: string;
    location?: {
      lat: number;
      lng: number;
    };
  };
}

// User profile for social features
export interface SocialUser {
  id: string;
  username: string;
  displayName: string;
  avatar?: string;
  bio?: string;
  joinDate: Date;
  totalCheckins: number;
  totalReviews: number;
  favoriteVibes: Vibe[];
  homeAirport?: string;
  isVerified: boolean;
  privacySettings: {
    showActivity: boolean;
    showLocation: boolean;
    allowMessages: boolean;
  };
}

// Social interaction types
export interface SocialInteraction {
  id: string;
  type: 'like' | 'comment' | 'share' | 'follow';
  userId: string;
  targetId: string; // Activity ID or User ID
  timestamp: Date;
  content?: string;
}

// Check-in interface
export interface CheckIn {
  id: string;
  userId: string;
  amenityId: string;
  amenityName: string;
  terminal: string;
  timestamp: Date;
  vibe: Vibe;
  rating?: number;
  comment?: string;
  photoUrl?: string;
  isPublic: boolean;
  location?: {
    lat: number;
    lng: number;
  };
}

// Review interface
export interface Review {
  id: string;
  userId: string;
  amenityId: string;
  amenityName: string;
  terminal: string;
  timestamp: Date;
  rating: number;
  comment: string;
  vibe: Vibe;
  helpfulCount: number;
  photoUrl?: string;
  tags?: string[];
  isVerified: boolean;
}

// Social feed item
export interface SocialFeedItem {
  id: string;
  type: 'activity' | 'checkin' | 'review' | 'recommendation';
  user: SocialUser;
  content: SocialActivity | CheckIn | Review;
  interactions: {
    likes: number;
    comments: number;
    shares: number;
  };
  userInteractions: {
    hasLiked: boolean;
    hasCommented: boolean;
    hasShared: boolean;
  };
  timestamp: Date;
}

// Social proof configuration
export interface SocialProofConfig {
  enabled: boolean;
  maxActivities: number;
  refreshInterval: number;
  showUserAvatars: boolean;
  showTimestamps: boolean;
  showRatings: boolean;
  showComments: boolean;
  privacyMode: 'public' | 'anonymous' | 'private';
}

// Real-time activity update
export interface ActivityUpdate {
  type: 'new_activity' | 'activity_removed' | 'activity_updated';
  activity: SocialActivity;
  timestamp: Date;
  source: 'websocket' | 'polling' | 'push';
}

// Social analytics
export interface SocialAnalytics {
  totalUsers: number;
  activeUsers: number;
  totalCheckins: number;
  totalReviews: number;
  popularAmenities: Array<{
    amenityId: string;
    amenityName: string;
    checkinCount: number;
    averageRating: number;
  }>;
  popularVibes: Array<{
    vibe: Vibe;
    count: number;
    percentage: number;
  }>;
  peakActivityHours: Array<{
    hour: number;
    activityCount: number;
  }>;
}

// Social notification
export interface SocialNotification {
  id: string;
  type: 'new_follower' | 'activity_like' | 'activity_comment' | 'checkin_reminder' | 'vibe_match';
  title: string;
  message: string;
  userId?: string;
  activityId?: string;
  amenityId?: string;
  timestamp: Date;
  isRead: boolean;
  actionUrl?: string;
  metadata?: Record<string, any>;
}

// Social gamification
export interface SocialAchievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: 'checkin' | 'review' | 'exploration' | 'social' | 'vibe';
  requirements: {
    type: string;
    count: number;
    timeframe?: number; // in days
  };
  reward?: {
    type: 'badge' | 'points' | 'feature' | 'title';
    value: string | number;
  };
  isUnlocked: boolean;
  unlockedAt?: Date;
  progress: number;
  maxProgress: number;
}

// Social leaderboard
export interface LeaderboardEntry {
  userId: string;
  username: string;
  avatar?: string;
  score: number;
  rank: number;
  category: 'checkins' | 'reviews' | 'exploration' | 'vibes' | 'overall';
  period: 'daily' | 'weekly' | 'monthly' | 'all_time';
  stats: {
    checkins: number;
    reviews: number;
    averageRating: number;
    uniqueAmenities: number;
    vibesUsed: number;
  };
}

// Social recommendation
export interface SocialRecommendation {
  id: string;
  type: 'friend_activity' | 'popular_amenity' | 'vibe_match' | 'trending';
  title: string;
  description: string;
  amenityId?: string;
  amenityName?: string;
  userCount?: number;
  averageRating?: number;
  vibe: Vibe;
  confidence: number; // 0-1
  reason: string;
  timestamp: Date;
}

// Social search filters
export interface SocialSearchFilters {
  vibes?: Vibe[];
  terminals?: string[];
  timeRange?: {
    start: Date;
    end: Date;
  };
  activityTypes?: ActivityType[];
  minRating?: number;
  hasPhotos?: boolean;
  hasComments?: boolean;
  verifiedOnly?: boolean;
}

// Social export data
export interface SocialExportData {
  activities: SocialActivity[];
  checkins: CheckIn[];
  reviews: Review[];
  interactions: SocialInteraction[];
  achievements: SocialAchievement[];
  analytics: SocialAnalytics;
  exportDate: Date;
  exportFormat: 'json' | 'csv' | 'pdf';
}

// Utility types for social features
export type SocialFeature = 'checkins' | 'reviews' | 'activity_feed' | 'leaderboards' | 'achievements' | 'notifications';

export type PrivacyLevel = 'aggregated' | 'anonymous' | 'minimal' | 'public';

export type NotificationPreference = 'all' | 'important' | 'none';

// Social API response types
export interface SocialApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  errors?: string[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface SocialApiError {
  code: string;
  message: string;
  details?: Record<string, any>;
  timestamp: Date;
}

// Real-time social events
export interface SocialEvent {
  type: 'user_checkin' | 'new_review' | 'activity_like' | 'user_joined' | 'achievement_unlocked';
  userId: string;
  username: string;
  avatar?: string;
  data: Record<string, any>;
  timestamp: Date;
  location?: {
    airport: string;
    terminal?: string;
    amenity?: string;
  };
} 

// New interfaces for social proof components
export interface AnonymizedActivity {
  id: string;
  activityType: ActivityType;
  location: string;
  terminal: string;
  vibe: Vibe;
  userCount: number;
  averageRating?: number;
  timestamp: Date;
  timeRange: string;
  anonymizedId: string;
  description: string;
}

export interface CrowdInsight {
  id: string;
  type: InsightType;
  title: string;
  description: string;
  location: string;
  terminal: string;
  vibe: Vibe;
  userCount: number;
  percentage: number;
  averageRating?: number;
  timeRange: string;
  confidence: number;
}

export type InsightType = 
  | 'helpful_spot'
  | 'popular_spot'
  | 'vibe_pattern'
  | 'rating_trend'
  | 'quick_service'
  | 'work_space'
  | 'comfort_zone';

export interface SimilarUserRecommendation {
  id: string;
  title: string;
  description: string;
  location: string;
  terminal: string;
  vibe: Vibe;
  similarUserCount: number;
  matchPercentage: number;
  averageRating?: number;
  reason: string;
  timeRange: string;
  confidence: number;
  amenities: string[];
  distance: string;
}

export interface PopularSpot {
  id: string;
  name: string;
  location: string;
  terminal: string;
  vibe: Vibe;
  currentUsers: number;
  totalVisits: number;
  averageRating?: number;
  popularityScore: number;
  liveActivity: LiveActivityIndicator;
  amenities: string[];
  distance: string;
  lastActivity: Date;
  trend: 'increasing' | 'stable' | 'decreasing';
}

export interface LiveActivityIndicator {
  checkins: number;
  reviews: number;
  photos: number;
  favorites: number;
}

export interface VibePattern {
  vibe: Vibe;
  userCount: number;
  percentage: number;
  averageRating?: number;
  confidence: number;
} 