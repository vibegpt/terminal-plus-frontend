// Smart 7 Analytics Service
// Tracks user behavior and algorithm effectiveness for the Smart 7 System

export interface Smart7InteractionEvent {
  collection: string;
  rotations_viewed: number;
  time_to_decision: number; // seconds
  selected_position: number; // which of the 7 was chosen (1-7)
  user_context?: {
    terminal: string;
    phase: 'departure' | 'transit' | 'arrival' | 'exploring' | 'unknown';
    energy: string;
    time_available: string;
    layover_minutes?: number;
  };
  algorithm_metrics?: {
    mode: 'rush' | 'explorer' | 'leisure';
    top_score: number;
    score_variance: number;
    proximity_weight: number;
    temporal_weight: number;
  };
  ui_interactions?: {
    hero_amenity_viewed: boolean;
    quick_badges_clicked: string[];
    context_pills_viewed: string[];
    rotation_controls_used: boolean;
  };
}

export interface Smart7PerformanceMetrics {
  collection_id: string;
  total_interactions: number;
  average_decision_time: number;
  rotation_usage_rate: number;
  hero_selection_rate: number;
  position_preference: Record<number, number>; // position -> count
  context_effectiveness: Record<string, number>; // context -> success rate
}

class Smart7Analytics {
  private static instance: Smart7Analytics;
  private interactionStartTime: Map<string, number> = new Map();
  private rotationCounts: Map<string, number> = new Map();
  private userSessions: Map<string, any> = new Map();

  private constructor() {}

  static getInstance(): Smart7Analytics {
    if (!Smart7Analytics.instance) {
      Smart7Analytics.instance = new Smart7Analytics();
    }
    return Smart7Analytics.instance;
  }

  /**
   * Start tracking a user's interaction with a collection
   */
  startInteraction(collectionId: string, userId?: string): void {
    const sessionId = userId || this.generateSessionId();
    this.interactionStartTime.set(sessionId, Date.now());
    this.rotationCounts.set(sessionId, 0);
    
    // Store user session data
    this.userSessions.set(sessionId, {
      collectionId,
      startTime: Date.now(),
      rotations: 0,
      interactions: []
    });

    // Track interaction start
    this.track('smart7_interaction_start', {
      collection: collectionId,
      session_id: sessionId,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Track rotation to next set of 7 amenities
   */
  trackRotation(collectionId: string, userId?: string): void {
    const sessionId = userId || this.getCurrentSessionId();
    if (sessionId) {
      const currentCount = this.rotationCounts.get(sessionId) || 0;
      this.rotationCounts.set(sessionId, currentCount + 1);
      
      // Update session data
      const session = this.userSessions.get(sessionId);
      if (session) {
        session.rotations = currentCount + 1;
        session.interactions.push({
          type: 'rotation',
          timestamp: Date.now(),
          rotation_number: currentCount + 1
        });
      }

      this.track('smart7_rotation', {
        collection: collectionId,
        session_id: sessionId,
        rotation_number: currentCount + 1,
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Track amenity selection and complete the interaction
   */
  trackSelection(
    collectionId: string, 
    selectedPosition: number, 
    selectedAmenityId: string,
    userId?: string
  ): void {
    const sessionId = userId || this.getCurrentSessionId();
    if (sessionId) {
      const startTime = this.interactionStartTime.get(sessionId);
      const rotations = this.rotationCounts.get(sessionId) || 0;
      
      if (startTime) {
        const timeToDecision = Math.round((Date.now() - startTime) / 1000);
        
        // Complete the interaction tracking
        const interactionEvent: Smart7InteractionEvent = {
          collection: collectionId,
          rotations_viewed: rotations,
          time_to_decision: timeToDecision,
          selected_position: selectedPosition,
          user_context: this.getUserContext(),
          algorithm_metrics: this.getAlgorithmMetrics(),
          ui_interactions: this.getUIIntractions(sessionId)
        };

        // Track the complete interaction
        this.track('smart7_interaction_complete', interactionEvent);

        // Track selection specifically
        this.track('smart7_amenity_selected', {
          collection: collectionId,
          session_id: sessionId,
          selected_position: selectedPosition,
          selected_amenity_id: selectedAmenityId,
          time_to_decision: timeToDecision,
          rotations_viewed: rotations,
          timestamp: new Date().toISOString()
        });

        // Clean up session data
        this.cleanupSession(sessionId);
      }
    }
  }

  /**
   * Track when user exits without making a selection
   */
  trackExit(collectionId: string, userId?: string): void {
    const sessionId = userId || this.getCurrentSessionId();
    if (sessionId) {
      const startTime = this.interactionStartTime.get(sessionId);
      const rotations = this.rotationCounts.get(sessionId) || 0;
      
      if (startTime) {
        const timeSpent = Math.round((Date.now() - startTime) / 1000);
        
        this.track('smart7_exit_without_selection', {
          collection: collectionId,
          session_id: sessionId,
          time_spent: timeSpent,
          rotations_viewed: rotations,
          timestamp: new Date().toISOString()
        });

        this.cleanupSession(sessionId);
      }
    }
  }

  /**
   * Track UI interactions for better UX insights
   */
  trackUIIntraction(
    interactionType: string, 
    details: any, 
    userId?: string
  ): void {
    const sessionId = userId || this.getCurrentSessionId();
    if (sessionId) {
      const session = this.userSessions.get(sessionId);
      if (session) {
        session.interactions.push({
          type: interactionType,
          details,
          timestamp: Date.now()
        });
      }

      this.track('smart7_ui_interaction', {
        interaction_type: interactionType,
        details,
        session_id: sessionId,
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Get performance metrics for a collection
   */
  async getCollectionMetrics(collectionId: string): Promise<Smart7PerformanceMetrics> {
    // This would typically fetch from your analytics backend
    // For now, return mock data structure
    return {
      collection_id: collectionId,
      total_interactions: 0,
      average_decision_time: 0,
      rotation_usage_rate: 0,
      hero_selection_rate: 0,
      position_preference: {},
      context_effectiveness: {}
    };
  }

  /**
   * Track algorithm effectiveness
   */
  trackAlgorithmEffectiveness(
    collectionId: string,
    metrics: {
      mode: string;
      topScore: number;
      scoreVariance: number;
      weights: Record<string, number>;
    }
  ): void {
    this.track('smart7_algorithm_metrics', {
      collection: collectionId,
      algorithm_mode: metrics.mode,
      top_score: metrics.topScore,
      score_variance: metrics.scoreVariance,
      weight_distribution: metrics.weights,
      timestamp: new Date().toISOString()
    });
  }

  // Private helper methods
  private generateSessionId(): string {
    return `smart7_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getCurrentSessionId(): string | null {
    // In a real implementation, this would get the current user's session
    // For now, return the first available session
    return Array.from(this.userSessions.keys())[0] || null;
  }

  private getUserContext(): any {
    // This would get the current user context from your app state
    // For now, return mock data
    return {
      terminal: 'T3',
      phase: 'transit',
      energy: 'active',
      time_available: 'moderate'
    };
  }

  private getAlgorithmMetrics(): any {
    // This would get the current algorithm metrics
    // For now, return mock data
    return {
      mode: 'explorer',
      top_score: 85,
      score_variance: 15,
      proximity_weight: 0.3,
      temporal_weight: 0.2
    };
  }

  private getUIIntractions(sessionId: string): any {
    const session = this.userSessions.get(sessionId);
    if (session) {
      return {
        hero_amenity_viewed: session.interactions.some(i => i.type === 'hero_view'),
        quick_badges_clicked: session.interactions
          .filter(i => i.type === 'badge_click')
          .map(i => i.details.badge_type),
        context_pills_viewed: session.interactions.some(i => i.type === 'context_view'),
        rotation_controls_used: session.rotations > 0
      };
    }
    return {};
  }

  private cleanupSession(sessionId: string): void {
    this.interactionStartTime.delete(sessionId);
    this.rotationCounts.delete(sessionId);
    this.userSessions.delete(sessionId);
  }

  /**
   * Main tracking method - sends data to your analytics service
   */
  private track(eventName: string, data: any): void {
    // In production, this would send to your analytics service
    // For now, log to console and could send to a service like:
    // - Google Analytics 4
    // - Mixpanel
    // - Amplitude
    // - Custom backend
    
    console.log(`📊 Smart7 Analytics: ${eventName}`, data);
    
    // Example: Send to Google Analytics 4
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', eventName, data);
    }
    
    // Example: Send to custom backend
    // this.sendToBackend(eventName, data);
  }

  /**
   * Send data to your backend analytics service
   */
  private async sendToBackend(eventName: string, data: any): Promise<void> {
    try {
      // Replace with your actual analytics endpoint
      const response = await fetch('/api/analytics/smart7', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          event: eventName,
          data,
          timestamp: new Date().toISOString()
        })
      });
      
      if (!response.ok) {
        console.warn('Failed to send analytics to backend:', response.statusText);
      }
    } catch (error) {
      console.warn('Failed to send analytics to backend:', error);
    }
  }
}

// Export singleton instance
export const smart7Analytics = Smart7Analytics.getInstance();

// Export types for use in components
export type { Smart7InteractionEvent, Smart7PerformanceMetrics };
