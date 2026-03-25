// Gamification types for Terminal+

import type { Vibe } from './common.types';

// Achievement types
export type AchievementCategory = 'checkin' | 'review' | 'exploration' | 'vibe' | 'streak' | 'social' | 'special';

export type AchievementRarity = 'common' | 'rare' | 'epic' | 'legendary';

// Achievement interface
export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: AchievementCategory;
  rarity: AchievementRarity;
  points: number;
  isUnlocked: boolean;
  unlockedAt?: Date;
  progress: number;
  maxProgress: number;
  requirements: {
    type: string;
    value: number;
    timeframe?: number; // in days
  };
  reward?: {
    type: 'badge' | 'points' | 'feature' | 'title';
    value: string | number;
  };
  metadata?: {
    hidden?: boolean;
    secret?: boolean;
    seasonal?: boolean;
    event?: string;
  };
}

// User progress interface
export interface UserProgress {
  userId: string;
  level: number;
  experience: number;
  experienceToNextLevel: number;
  totalPoints: number;
  achievementsUnlocked: number;
  totalAchievements: number;
  currentStreak: number;
  longestStreak: number;
  checkins: number;
  reviews: number;
  vibesUsed: number;
  uniqueAmenities: number;
  rank: number;
  badges: string[];
  lastActivity: Date;
  stats: {
    averageRating: number;
    totalTimeSpent: number; // in minutes
    favoriteVibe: Vibe;
    mostVisitedAmenity: string;
    completionRate: number; // percentage
  };
}

// Leaderboard entry interface
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
  metadata?: {
    isCurrentUser?: boolean;
    rankChange?: number;
    scoreChange?: number;
  };
}

// Reward types
export type RewardType = 'badge' | 'feature' | 'cosmetic' | 'points' | 'title' | 'access';

export type RewardRarity = 'common' | 'rare' | 'epic' | 'legendary';

// Reward interface
export interface Reward {
  id: string;
  title: string;
  description: string;
  icon: string;
  type: RewardType;
  rarity: RewardRarity;
  pointsCost: number;
  isClaimed: boolean;
  isAvailable: boolean;
  expiresAt?: Date;
  requirements?: {
    level?: number;
    achievements?: string[];
    points?: number;
    streak?: number;
  };
  metadata?: {
    limited?: boolean;
    seasonal?: boolean;
    event?: string;
    preview?: string;
  };
}

// Quest types
export type QuestCategory = 'daily' | 'weekly' | 'monthly' | 'event' | 'special';

export type QuestDifficulty = 'easy' | 'medium' | 'hard' | 'expert';

// Quest interface
export interface Quest {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: QuestCategory;
  difficulty: QuestDifficulty;
  points: number;
  isCompleted: boolean;
  isActive: boolean;
  progress: number;
  maxProgress: number;
  expiresAt: Date;
  requirements: string[];
  rewards: {
    points: number;
    experience: number;
    items?: string[];
  };
  metadata?: {
    repeatable?: boolean;
    timeLimit?: number; // in hours
    location?: string;
    vibe?: Vibe;
  };
}

// Gamification statistics
export interface GamificationStats {
  totalUsers: number;
  activeUsers: number;
  averageLevel: number;
  totalAchievements: number;
  averageAchievements: number;
  topScore: number;
  averageScore: number;
  achievements: {
    total: number;
    unlocked: number;
    completionRate: number;
  };
  leaderboards: {
    totalEntries: number;
    activeCategories: number;
    averageScore: number;
  };
  rewards: {
    total: number;
    claimed: number;
    claimRate: number;
  };
  quests: {
    total: number;
    completed: number;
    completionRate: number;
  };
}

// Gamification event
export interface GamificationEvent {
  type: 'achievement_unlocked' | 'level_up' | 'reward_claimed' | 'quest_completed' | 'streak_milestone';
  userId: string;
  data: Achievement | UserProgress | Reward | Quest;
  timestamp: Date;
  metadata?: Record<string, any>;
}

// Gamification configuration
export interface GamificationConfig {
  enabled: boolean;
  features: {
    achievements: boolean;
    leaderboards: boolean;
    rewards: boolean;
    quests: boolean;
    streaks: boolean;
  };
  points: {
    checkin: number;
    review: number;
    achievement: number;
    quest: number;
    streak: number;
  };
  experience: {
    baseMultiplier: number;
    levelThresholds: number[];
    maxLevel: number;
  };
  privacy: {
    showLeaderboard: boolean;
    showProgress: boolean;
    showAchievements: boolean;
  };
}

// Gamification API response
export interface GamificationApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  errors?: string[];
  metadata?: {
    totalCount?: number;
    page?: number;
    limit?: number;
  };
}

// Gamification API error
export interface GamificationApiError {
  code: string;
  message: string;
  details?: Record<string, any>;
  timestamp: Date;
  retryable: boolean;
}

// Gamification analytics
export interface GamificationAnalytics {
  userEngagement: {
    dailyActiveUsers: number;
    weeklyActiveUsers: number;
    monthlyActiveUsers: number;
    averageSessionTime: number;
    retentionRate: number;
  };
  achievementMetrics: {
    totalUnlocked: number;
    averagePerUser: number;
    mostPopular: string[];
    completionRate: number;
  };
  leaderboardMetrics: {
    totalParticipants: number;
    averageScore: number;
    topPerformers: number;
    participationRate: number;
  };
  rewardMetrics: {
    totalClaimed: number;
    claimRate: number;
    mostPopular: string[];
    averagePointsSpent: number;
  };
  questMetrics: {
    totalCompleted: number;
    completionRate: number;
    averageTimeToComplete: number;
    mostPopular: string[];
  };
}

// Gamification export data
export interface GamificationExportData {
  userProgress: UserProgress;
  achievements: Achievement[];
  leaderboardHistory: LeaderboardEntry[];
  rewards: Reward[];
  quests: Quest[];
  analytics: GamificationAnalytics;
  exportDate: Date;
  exportFormat: 'json' | 'csv' | 'pdf';
  privacyLevel: 'full' | 'anonymized' | 'aggregated';
}

// Utility types for gamification features
export type GamificationFeature = 'achievements' | 'leaderboards' | 'rewards' | 'quests' | 'streaks' | 'analytics';

export type GamificationPeriod = 'daily' | 'weekly' | 'monthly' | 'all_time';

export type GamificationCategory = 'checkins' | 'reviews' | 'exploration' | 'vibes' | 'overall';

// Gamification notification
export interface GamificationNotification {
  id: string;
  type: 'achievement' | 'level_up' | 'reward' | 'quest' | 'streak';
  title: string;
  message: string;
  userId: string;
  data: Achievement | UserProgress | Reward | Quest;
  timestamp: Date;
  isRead: boolean;
  actionUrl?: string;
  metadata?: Record<string, any>;
}

// Gamification recommendation
export interface GamificationRecommendation {
  id: string;
  type: 'achievement' | 'quest' | 'reward';
  title: string;
  description: string;
  confidence: number; // 0-1
  priority: 'low' | 'medium' | 'high';
  estimatedTime: number; // in minutes
  reward: {
    points: number;
    experience: number;
    items?: string[];
  };
  requirements: string[];
  timestamp: Date;
}

// Gamification search filters
export interface GamificationSearchFilters {
  categories?: AchievementCategory[];
  rarities?: AchievementRarity[];
  difficulties?: QuestDifficulty[];
  periods?: GamificationPeriod[];
  minPoints?: number;
  maxPoints?: number;
  isUnlocked?: boolean;
  isCompleted?: boolean;
  isActive?: boolean;
  timeRange?: {
    start: Date;
    end: Date;
  };
}

// Gamification engine interface
export interface GamificationEngine {
  calculateExperience: (actions: any[]) => number;
  checkAchievements: (userId: string, actions: any[]) => Achievement[];
  updateLeaderboard: (userId: string, score: number) => void;
  generateQuests: (userId: string) => Quest[];
  calculateRewards: (userId: string, actions: any[]) => Reward[];
  getRecommendations: (userId: string) => GamificationRecommendation[];
} 