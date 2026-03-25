// Emotion detection and mood tracking types for Terminal+

import type { Vibe } from './common.types';

// Emotion types
export type EmotionType = 
  | 'happy' 
  | 'sad' 
  | 'angry' 
  | 'excited' 
  | 'calm' 
  | 'stressed' 
  | 'neutral' 
  | 'tired' 
  | 'anxious' 
  | 'confident' 
  | 'frustrated' 
  | 'relaxed';

// Emotion detection source
export type EmotionSource = 'voice' | 'facial' | 'manual' | 'text' | 'behavioral';

// Emotion data interface
export interface EmotionData {
  type: EmotionType;
  confidence: number; // 0-1
  energy: number; // 0-100
  stress: number; // 0-100
  timestamp: Date;
  source: EmotionSource;
  metadata: {
    pitch?: number;
    volume?: number;
    speechRate?: number;
    facialFeatures?: {
      smile?: number;
      eyebrow?: number;
      eyeOpenness?: number;
    };
    textSentiment?: {
      positive: number;
      negative: number;
      neutral: number;
    };
    behavioralPatterns?: {
      movementSpeed?: number;
      interactionFrequency?: number;
      responseTime?: number;
    };
  };
}

// Mood trend analysis
export interface MoodTrend {
  trend: 'improving' | 'declining' | 'stable';
  confidence: number;
  factors: string[];
  recommendations: string[];
  duration: number; // in hours
}

// Emotion history entry
export interface EmotionHistoryEntry {
  emotion: EmotionData;
  context: {
    location?: string;
    activity?: string;
    timeOfDay?: string;
    weather?: string;
  };
  impact: {
    productivity?: number;
    socialInteraction?: number;
    decisionMaking?: number;
  };
}

// Emotion-based recommendation
export interface EmotionRecommendation {
  emotion: EmotionType;
  recommendedVibes: Vibe[];
  recommendedActivities: string[];
  reasoning: string;
  confidence: number;
  alternatives: {
    vibes: Vibe[];
    activities: string[];
  };
}

// Voice emotion analysis result
export interface VoiceEmotionResult {
  primaryEmotion: EmotionType;
  secondaryEmotions: EmotionType[];
  confidence: number;
  energy: number;
  stress: number;
  speechCharacteristics: {
    pitch: number;
    volume: number;
    rate: number;
    clarity: number;
  };
  transcript?: string;
  keywords: string[];
}

// Facial emotion analysis result
export interface FacialEmotionResult {
  primaryEmotion: EmotionType;
  secondaryEmotions: EmotionType[];
  confidence: number;
  facialFeatures: {
    smile: number;
    eyebrow: number;
    eyeOpenness: number;
    mouthOpenness: number;
    headTilt: number;
  };
  microExpressions: EmotionType[];
  attentionLevel: number;
  engagementLevel: number;
}

// Behavioral emotion analysis
export interface BehavioralEmotionResult {
  primaryEmotion: EmotionType;
  confidence: number;
  patterns: {
    movementSpeed: number;
    interactionFrequency: number;
    responseTime: number;
    gestureIntensity: number;
    posture: 'open' | 'closed' | 'neutral';
  };
  context: {
    environment: string;
    timeOfDay: string;
    socialContext: string;
  };
}

// Emotion detection configuration
export interface EmotionDetectionConfig {
  enabled: boolean;
  sources: EmotionSource[];
  autoDetect: boolean;
  confidenceThreshold: number;
  updateInterval: number; // in milliseconds
  privacyMode: 'full' | 'partial' | 'minimal';
  storagePolicy: {
    retainHistory: boolean;
    maxHistoryEntries: number;
    anonymizeData: boolean;
  };
}

// Emotion analytics
export interface EmotionAnalytics {
  totalDetections: number;
  emotionDistribution: Record<EmotionType, number>;
  averageConfidence: number;
  moodTrends: {
    daily: MoodTrend[];
    weekly: MoodTrend[];
    monthly: MoodTrend[];
  };
  peakEmotions: Array<{
    emotion: EmotionType;
    count: number;
    timeOfDay: string;
  }>;
  correlationFactors: Array<{
    factor: string;
    correlation: number;
    impact: 'positive' | 'negative' | 'neutral';
  }>;
}

// Emotion-based gamification
export interface EmotionAchievement {
  id: string;
  title: string;
  description: string;
  emotionType: EmotionType;
  requirement: {
    type: 'detection_count' | 'confidence_threshold' | 'duration' | 'pattern';
    value: number;
    timeframe?: number; // in days
  };
  reward: {
    type: 'badge' | 'points' | 'feature' | 'insight';
    value: string | number;
  };
  isUnlocked: boolean;
  progress: number;
  maxProgress: number;
}

// Emotion insights
export interface EmotionInsight {
  id: string;
  type: 'pattern' | 'trend' | 'correlation' | 'recommendation';
  title: string;
  description: string;
  emotionType: EmotionType;
  confidence: number;
  actionable: boolean;
  actionItems?: string[];
  timestamp: Date;
  expiresAt?: Date;
}

// Emotion privacy settings
export interface EmotionPrivacySettings {
  allowVoiceAnalysis: boolean;
  allowFacialAnalysis: boolean;
  allowBehavioralAnalysis: boolean;
  storeEmotionHistory: boolean;
  shareEmotionData: boolean;
  anonymizeData: boolean;
  dataRetentionDays: number;
  exportData: boolean;
}

// Emotion export data
export interface EmotionExportData {
  emotions: EmotionData[];
  history: EmotionHistoryEntry[];
  analytics: EmotionAnalytics;
  achievements: EmotionAchievement[];
  insights: EmotionInsight[];
  exportDate: Date;
  exportFormat: 'json' | 'csv' | 'pdf';
  privacyLevel: 'full' | 'anonymized' | 'aggregated';
}

// Real-time emotion event
export interface EmotionEvent {
  type: 'emotion_detected' | 'mood_change' | 'achievement_unlocked' | 'insight_generated';
  emotion: EmotionData;
  context: {
    location?: string;
    activity?: string;
    appSection?: string;
  };
  timestamp: Date;
  metadata?: Record<string, any>;
}

// Emotion API response
export interface EmotionApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  errors?: string[];
  confidence?: number;
  processingTime?: number;
}

// Emotion API error
export interface EmotionApiError {
  code: string;
  message: string;
  details?: Record<string, any>;
  timestamp: Date;
  retryable: boolean;
}

// Utility types for emotion features
export type EmotionFeature = 'voice_detection' | 'facial_detection' | 'behavioral_analysis' | 'mood_tracking' | 'insights' | 'achievements';

export type EmotionAccuracy = 'high' | 'medium' | 'low';

export type EmotionContext = 'airport' | 'terminal' | 'amenity' | 'journey' | 'general';

// Emotion detection status
export interface EmotionDetectionStatus {
  isActive: boolean;
  currentEmotion: EmotionData | null;
  confidence: number;
  lastUpdate: Date;
  source: EmotionSource;
  error?: string;
}

// Emotion recommendation engine
export interface EmotionRecommendationEngine {
  analyzeEmotion: (emotion: EmotionData) => EmotionRecommendation;
  getMoodTrend: (history: EmotionData[]) => MoodTrend;
  generateInsights: (data: EmotionData[]) => EmotionInsight[];
  suggestActions: (emotion: EmotionData, context: string) => string[];
} 