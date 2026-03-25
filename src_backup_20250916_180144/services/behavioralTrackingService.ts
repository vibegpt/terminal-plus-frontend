import { supabase } from '../lib/supabase';

interface TrackingContext {
  terminal_code?: string;
  collection_id?: string;
  vibe_context?: string;
  time_until_boarding?: number;
  journey_phase?: 'planning' | 'at_airport' | 'in_transit';
  scroll_depth?: number;
  device_type?: 'mobile' | 'desktop' | 'tablet';
}

class BehavioralTrackingService {
  private sessionId: string;
  private userId: string | null = null;
  private clickBuffer: any[] = [];
  private flushInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.sessionId = this.getOrCreateSessionId();
    this.startFlushInterval();
  }

  private getOrCreateSessionId(): string {
    let sessionId = sessionStorage.getItem('terminal_session_id');
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('terminal_session_id', sessionId);
      this.createSession(sessionId);
    }
    return sessionId;
  }

  private async createSession(sessionId: string) {
    const deviceType = this.detectDeviceType();
    await supabase.from('user_sessions').insert([{
      id: sessionId,
      device_type: deviceType,
      terminal_code: 'SYD-T1', // You can make this dynamic
      started_at: new Date().toISOString()
    }]);
  }

  private detectDeviceType(): string {
    const width = window.innerWidth;
    if (width <= 768) return 'mobile';
    if (width <= 1024) return 'tablet';
    return 'desktop';
  }

  // Buffer clicks and batch insert for performance
  private startFlushInterval() {
    this.flushInterval = setInterval(() => {
      this.flushClickBuffer();
    }, 5000); // Flush every 5 seconds
  }

  private async flushClickBuffer() {
    if (this.clickBuffer.length === 0) return;
    
    const bufferCopy = [...this.clickBuffer];
    this.clickBuffer = [];

    try {
      await supabase
        .from('user_behaviors')
        .insert(bufferCopy);
    } catch (error) {
      console.error('Failed to flush click buffer:', error);
      // Re-add failed items back to buffer
      this.clickBuffer.unshift(...bufferCopy);
    }
  }

  // Track amenity click
  async trackAmenityClick(
    amenityId: number,
    amenityName: string,
    context: TrackingContext
  ) {
    const clickData = {
      user_id: this.userId,
      amenity_detail_id: amenityId,
      collection_id: context.collection_id,
      action_type: 'click',
      context: {
        ...context,
        amenity_name: amenityName,
        timestamp: new Date().toISOString(),
        viewport_width: window.innerWidth,
        viewport_height: window.innerHeight,
        scroll_y: window.scrollY
      },
      session_id: this.sessionId
    };

    // Add to buffer for batch processing
    this.clickBuffer.push(clickData);

    // Also update metrics immediately for important clicks
    if (context.collection_id) {
      this.updateCollectionMetrics(context.collection_id, context.terminal_code || 'SYD-T1');
    }
  }

  // Track collection view
  async trackCollectionView(collectionId: string, collectionName: string) {
    await supabase.from('user_behaviors').insert([{
      user_id: this.userId,
      collection_id: collectionId,
      action_type: 'view',
      context: {
        collection_name: collectionName,
        timestamp: new Date().toISOString()
      },
      session_id: this.sessionId
    }]);
  }

  // Track scroll behavior
  trackScroll(depth: number, maxDepth: number) {
    const percentage = (depth / maxDepth) * 100;
    
    // Only track significant scroll milestones
    if (percentage > 25 && !this.scrollMilestones?.has(25)) {
      this.recordScrollMilestone(25);
    } else if (percentage > 50 && !this.scrollMilestones?.has(50)) {
      this.recordScrollMilestone(50);
    } else if (percentage > 75 && !this.scrollMilestones?.has(75)) {
      this.recordScrollMilestone(75);
    } else if (percentage > 90 && !this.scrollMilestones?.has(90)) {
      this.recordScrollMilestone(90);
    }
  }

  private scrollMilestones = new Set<number>();

  private async recordScrollMilestone(milestone: number) {
    this.scrollMilestones.add(milestone);
    await supabase.from('user_behaviors').insert([{
      user_id: this.userId,
      action_type: 'scroll',
      context: {
        milestone_percentage: milestone,
        timestamp: new Date().toISOString()
      },
      session_id: this.sessionId
    }]);
  }

  // Update collection performance metrics
  private async updateCollectionMetrics(collectionId: string, terminalCode: string) {
    await supabase.rpc('increment_collection_clicks', {
      p_collection_id: collectionId,
      p_terminal_code: terminalCode
    });
  }

  // Get personalized recommendations
  async getPersonalizedRecommendations(terminalCode: string, timeUntilBoarding?: number) {
    // Get user's click history
    const { data: userHistory } = await supabase
      .from('user_behaviors')
      .select('amenity_detail_id, context')
      .eq('session_id', this.sessionId)
      .eq('action_type', 'click')
      .order('created_at', { ascending: false })
      .limit(20);

    // Get popular amenities for this time context
    let query = supabase
      .from('amenity_detail')
      .select(`
        *,
        amenity_metrics (
          click_count,
          avg_rating
        )
      `)
      .eq('terminal_code', terminalCode);

    // Apply time-based filtering
    if (timeUntilBoarding && timeUntilBoarding < 30) {
      query = query.lte('walking_time_minutes', 5);
    } else if (timeUntilBoarding && timeUntilBoarding < 60) {
      query = query.lte('walking_time_minutes', 10);
    }

    const { data: recommendations } = await query
      .order('amenity_metrics.click_count', { ascending: false })
      .limit(20);

    return recommendations;
  }

  // Cleanup on unmount
  cleanup() {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
      this.flushClickBuffer(); // Final flush
    }
  }
}

export const behavioralTracking = new BehavioralTrackingService();
