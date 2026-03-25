// Analytics tracking service for collection engagement
// src/services/analyticsService.ts

interface CollectionEngagementData {
  collection_viewed: string;
  view_mode: 'collections' | 'vibes';
  time_to_boarding: number | null;
  collection_position: number;
  interaction_type: 'click' | 'save' | 'scroll_past' | 'swipe' | 'pull_refresh';
  dwell_time?: number;
  is_ml_generated?: boolean;
  is_time_urgent?: boolean;
  user_location?: 'at_airport' | 'remote' | 'unknown';
  live_users_count?: number;
}

interface VibeAnalyticsData {
  vibe_selected: string;
  previous_vibes: string[];
  selection_method: 'manual' | 'suggested' | 'auto';
  time_of_day: string;
  journey_phase: string;
}

interface SwipeAnalyticsData {
  direction: 'left' | 'right';
  collection_viewed: string;
  swipe_velocity: number;
  cards_viewed_count: number;
}

export class AnalyticsService {
  private static startTime: Map<string, number> = new Map();
  
  // Track collection view start time for dwell time calculation
  static startViewTracking(collectionId: string) {
    this.startTime.set(collectionId, Date.now());
  }
  
  // Calculate and track dwell time
  static endViewTracking(collectionId: string): number {
    const start = this.startTime.get(collectionId);
    if (!start) return 0;
    
    const dwellTime = Math.floor((Date.now() - start) / 1000); // in seconds
    this.startTime.delete(collectionId);
    return dwellTime;
  }
  
  // Track collection engagement
  static trackCollectionEngagement(data: CollectionEngagementData) {
    // Add dwell time if interaction is click
    if (data.interaction_type === 'click') {
      data.dwell_time = this.endViewTracking(data.collection_viewed);
    }
    
    // Track with Google Analytics
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'collection_engagement', {
        ...data,
        timestamp: new Date().toISOString(),
        user_agent: navigator.userAgent,
        screen_size: `${window.innerWidth}x${window.innerHeight}`
      });
    }
    
    // Log for debugging
    console.log('📊 Collection Engagement:', data);
    
    // Store in session for pattern analysis
    this.storeSessionData('collection_engagement', data);
  }
  
  // Track vibe selections for ML training
  static trackVibeSelection(data: VibeAnalyticsData) {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'vibe_selection', data);
    }
    
    // Store vibe history for collaborative filtering
    this.updateVibeHistory(data.vibe_selected);
    
    console.log('🎭 Vibe Selected:', data);
  }
  
  // Track swipe gestures
  static trackSwipeGesture(data: SwipeAnalyticsData) {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'carousel_swipe', data);
    }
    
    console.log('👆 Swipe Gesture:', data);
  }
  
  // Track pull to refresh
  static trackPullToRefresh(context: { 
    collections_refreshed: number; 
    time_since_last_refresh: number;
    new_trending_items: number;
  }) {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'pull_to_refresh', context);
    }
    
    console.log('🔄 Pull to Refresh:', context);
  }
  
  // Track ML collection performance
  static trackMLCollectionPerformance(data: {
    collection_id: string;
    ml_confidence: number;
    user_interacted: boolean;
    context_match_score: number;
  }) {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'ml_collection_performance', data);
    }
    
    // Store for model improvement
    this.storeMLFeedback(data);
  }
  
  // Store session data for analysis
  private static storeSessionData(key: string, data: any) {
    const sessionKey = `terminal_plus_${key}`;
    const existing = sessionStorage.getItem(sessionKey);
    const history = existing ? JSON.parse(existing) : [];
    history.push({
      ...data,
      timestamp: Date.now()
    });
    
    // Keep only last 50 entries
    if (history.length > 50) {
      history.shift();
    }
    
    sessionStorage.setItem(sessionKey, JSON.stringify(history));
  }
  
  // Update vibe history for collaborative filtering
  private static updateVibeHistory(vibe: string) {
    const historyKey = 'terminal_plus_vibe_history';
    const existing = localStorage.getItem(historyKey);
    const history = existing ? JSON.parse(existing) : [];
    history.push(vibe);
    
    // Keep only last 10 vibes
    if (history.length > 10) {
      history.shift();
    }
    
    localStorage.setItem(historyKey, JSON.stringify(history));
  }
  
  // Store ML feedback for model improvement
  private static storeMLFeedback(feedback: any) {
    const feedbackKey = 'terminal_plus_ml_feedback';
    const existing = localStorage.getItem(feedbackKey);
    const feedbackList = existing ? JSON.parse(existing) : [];
    feedbackList.push({
      ...feedback,
      timestamp: Date.now()
    });
    
    // Keep only last 100 feedback entries
    if (feedbackList.length > 100) {
      feedbackList.shift();
    }
    
    localStorage.setItem(feedbackKey, JSON.stringify(feedbackList));
  }
  
  // Get user's vibe pattern for collaborative filtering
  static getUserVibePattern(): string[] {
    const historyKey = 'terminal_plus_vibe_history';
    const existing = localStorage.getItem(historyKey);
    return existing ? JSON.parse(existing) : [];
  }
  
  // Get session analytics summary
  static getSessionSummary() {
    const engagementKey = 'terminal_plus_collection_engagement';
    const existing = sessionStorage.getItem(engagementKey);
    const engagements = existing ? JSON.parse(existing) : [];
    
    return {
      total_engagements: engagements.length,
      clicks: engagements.filter((e: any) => e.interaction_type === 'click').length,
      saves: engagements.filter((e: any) => e.interaction_type === 'save').length,
      avg_dwell_time: engagements
        .filter((e: any) => e.dwell_time)
        .reduce((acc: number, e: any) => acc + e.dwell_time, 0) / 
        engagements.filter((e: any) => e.dwell_time).length || 0,
      vibe_pattern: this.getUserVibePattern()
    };
  }
}

// Extend window interface for gtag
declare global {
  interface Window {
    gtag: (...args: any[]) => void;
  }
}

export default AnalyticsService;