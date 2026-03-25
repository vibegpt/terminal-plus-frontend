import { v4 as uuidv4 } from 'uuid';
import type { 
  UserSession, 
  AmenityInteraction, 
  InteractionBuffer, 
  SessionContext 
} from '../types/tracking';

const SESSION_KEY = 'smart7_session';
const INTERACTION_BUFFER_KEY = 'smart7_interaction_buffer';
const FLUSH_INTERVAL_MS = 5000; // 5 seconds
const SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

class SessionTracker {
  private interactionBuffer: InteractionBuffer = {
    interactions: [],
    lastFlush: new Date(),
    flushTimer: undefined
  };
  
  private sessionContext: SessionContext | null = null;
  private pageViewStart: Date | null = null;
  private currentAmenityView: { amenityId: number; startTime: Date } | null = null;

  constructor() {
    this.initializeSession();
    this.loadBufferedInteractions();
    this.startFlushTimer();
    this.setupEventListeners();
  }

  /**
   * Generate a new anonymous session ID
   */
  private generateSessionId(): string {
    return `ses_${Date.now()}_${uuidv4().substring(0, 8)}`;
  }

  /**
   * Get device type based on user agent
   */
  private getDeviceType(): 'mobile' | 'tablet' | 'desktop' {
    const ua = navigator.userAgent.toLowerCase();
    if (/mobile|android|iphone/i.test(ua) && !/ipad|tablet/i.test(ua)) {
      return 'mobile';
    } else if (/ipad|tablet/i.test(ua)) {
      return 'tablet';
    }
    return 'desktop';
  }

  /**
   * Initialize or retrieve existing session
   */
  private initializeSession(): void {
    const storedSession = sessionStorage.getItem(SESSION_KEY);
    
    if (storedSession) {
      try {
        const parsed = JSON.parse(storedSession);
        const lastActive = new Date(parsed.lastActive);
        const now = new Date();
        
        // Check if session is still valid (not timed out)
        if (now.getTime() - lastActive.getTime() < SESSION_TIMEOUT_MS) {
          this.sessionContext = parsed;
          this.updateLastActive();
          return;
        }
      } catch (e) {
        console.error('Failed to parse session:', e);
      }
    }

    // Create new session
    this.createNewSession();
  }

  /**
   * Create a new session
   */
  private createNewSession(): void {
    const sessionId = this.generateSessionId();
    const now = new Date();
    
    this.sessionContext = {
      sessionId,
      startTime: now,
      lastActive: now,
      preferences: {
        clickedAmenities: [],
        viewedCollections: [],
        priceLevel: [],
        vibePreferences: []
      }
    };

    this.saveSession();
  }

  /**
   * Save session to session storage
   */
  private saveSession(): void {
    if (this.sessionContext) {
      try {
        sessionStorage.setItem(SESSION_KEY, JSON.stringify(this.sessionContext));
      } catch (e) {
        console.error('Failed to save session:', e);
      }
    }
  }

  /**
   * Update last active timestamp
   */
  private updateLastActive(): void {
    if (this.sessionContext) {
      this.sessionContext.lastActive = new Date();
      this.saveSession();
    }
  }

  /**
   * Load buffered interactions from session storage
   */
  private loadBufferedInteractions(): void {
    const stored = sessionStorage.getItem(INTERACTION_BUFFER_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        this.interactionBuffer.interactions = parsed.interactions || [];
      } catch (e) {
        console.error('Failed to load interaction buffer:', e);
      }
    }
  }

  /**
   * Save interaction buffer to session storage
   */
  private saveInteractionBuffer(): void {
    try {
      sessionStorage.setItem(
        INTERACTION_BUFFER_KEY,
        JSON.stringify({
          interactions: this.interactionBuffer.interactions
        })
      );
    } catch (e) {
      console.error('Failed to save interaction buffer:', e);
    }
  }

  /**
   * Start the flush timer
   */
  private startFlushTimer(): void {
    if (this.interactionBuffer.flushTimer) {
      clearInterval(this.interactionBuffer.flushTimer);
    }

    this.interactionBuffer.flushTimer = setInterval(() => {
      this.flushInteractions();
    }, FLUSH_INTERVAL_MS);
  }

  /**
   * Setup event listeners for automatic tracking
   */
  private setupEventListeners(): void {
    // Track page visibility changes
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.handlePageHide();
      } else {
        this.handlePageShow();
      }
    });

    // Track before page unload
    window.addEventListener('beforeunload', () => {
      this.handlePageHide();
      this.flushInteractions(true); // Force sync flush
    });
  }

  /**
   * Handle page hide event
   */
  private handlePageHide(): void {
    if (this.currentAmenityView) {
      this.endAmenityView(this.currentAmenityView.amenityId);
    }
  }

  /**
   * Handle page show event
   */
  private handlePageShow(): void {
    this.pageViewStart = new Date();
    this.updateLastActive();
  }

  /**
   * Public API Methods
   */

  /**
   * Get current session ID
   */
  public getSessionId(): string | null {
    return this.sessionContext?.sessionId || null;
  }

  /**
   * Get current session context
   */
  public getSessionContext(): SessionContext | null {
    return this.sessionContext;
  }

  /**
   * Set user terminal
   */
  public setTerminal(terminal: string): void {
    if (this.sessionContext) {
      this.sessionContext.terminal = terminal;
      this.saveSession();
    }
  }

  /**
   * Track amenity view start
   */
  public startAmenityView(amenityId: number): void {
    // End previous view if exists
    if (this.currentAmenityView) {
      this.endAmenityView(this.currentAmenityView.amenityId);
    }

    this.currentAmenityView = {
      amenityId,
      startTime: new Date()
    };
  }

  /**
   * Track amenity view end
   */
  public endAmenityView(amenityId: number): void {
    if (this.currentAmenityView?.amenityId === amenityId) {
      const timeSpent = Math.round(
        (new Date().getTime() - this.currentAmenityView.startTime.getTime()) / 1000
      );
      
      // Only track if viewed for more than 0.5 seconds
      if (timeSpent > 0.5) {
        this.trackInteraction(amenityId, 'view', { time_spent_seconds: timeSpent });
      }
      
      this.currentAmenityView = null;
    }
  }

  /**
   * Track interaction with an amenity
   */
  public trackInteraction(
    amenityId: number,
    type: AmenityInteraction['interaction_type'],
    additionalData?: Partial<AmenityInteraction>
  ): void {
    if (!this.sessionContext) return;

    const interaction: AmenityInteraction = {
      session_id: this.sessionContext.sessionId,
      amenity_id: amenityId,
      interaction_type: type,
      interaction_timestamp: new Date().toISOString(),
      ...additionalData
    };

    // Add to buffer
    this.interactionBuffer.interactions.push(interaction);
    
    // Update session preferences
    if (type === 'click' && !this.sessionContext.preferences.clickedAmenities?.includes(amenityId)) {
      this.sessionContext.preferences.clickedAmenities?.push(amenityId);
    }
    
    this.saveSession();
    this.saveInteractionBuffer();

    // Flush if buffer is getting large
    if (this.interactionBuffer.interactions.length >= 20) {
      this.flushInteractions();
    }
  }

  /**
   * Track collection view
   */
  public trackCollectionView(collectionId: number): void {
    if (!this.sessionContext) return;

    if (!this.sessionContext.preferences.viewedCollections?.includes(collectionId)) {
      this.sessionContext.preferences.viewedCollections?.push(collectionId);
      this.saveSession();
    }
  }

  /**
   * Track Smart7 selection event
   */
  public trackSmart7Selection(
    amenityId: number,
    collectionId: number,
    positionInList: number,
    contextData?: Record<string, any>
  ): void {
    this.trackInteraction(amenityId, 'view', {
      collection_id: collectionId,
      position_in_list: positionInList,
      is_smart7_selection: true,
      context_data: contextData
    });
  }

  /**
   * Update preference
   */
  public updatePreference(key: keyof SessionContext['preferences'], value: any): void {
    if (this.sessionContext) {
      (this.sessionContext.preferences as any)[key] = value;
      this.saveSession();
    }
  }

  /**
   * Flush interactions to backend
   */
  public async flushInteractions(sync: boolean = false): Promise<void> {
    if (this.interactionBuffer.interactions.length === 0) return;

    const interactionsToFlush = [...this.interactionBuffer.interactions];
    this.interactionBuffer.interactions = [];
    this.saveInteractionBuffer();

    try {
      // This will be replaced with actual Supabase call
      if (sync) {
        // Use sendBeacon for sync flush on page unload
        const data = JSON.stringify({
          session_id: this.sessionContext?.sessionId,
          interactions: interactionsToFlush
        });
        
        if (navigator.sendBeacon) {
          navigator.sendBeacon('/api/track', data);
        }
      } else {
        // Async flush - will be implemented in supabaseTrackingService
        try {
          const { supabaseTrackingService } = await import('../services/supabaseTrackingService');
          await supabaseTrackingService.batchInsertInteractions(interactionsToFlush);
        } catch (importError) {
          console.warn('Supabase tracking service not available, interactions will be retried later');
          // Re-add to buffer on failure
          this.interactionBuffer.interactions.unshift(...interactionsToFlush);
          this.saveInteractionBuffer();
          return;
        }
      }

      this.interactionBuffer.lastFlush = new Date();
    } catch (error) {
      console.error('Failed to flush interactions:', error);
      // Re-add to buffer on failure
      this.interactionBuffer.interactions.unshift(...interactionsToFlush);
      this.saveInteractionBuffer();
    }
  }

  /**
   * Clear session
   */
  public clearSession(): void {
    this.flushInteractions();
    sessionStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem(INTERACTION_BUFFER_KEY);
    this.createNewSession();
  }

  /**
   * Cleanup method for component unmounting
   */
  public cleanup(): void {
    if (this.interactionBuffer.flushTimer) {
      clearInterval(this.interactionBuffer.flushTimer);
    }
  }
}

// Export singleton instance
export const sessionTracker = new SessionTracker();
