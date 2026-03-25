interface TrackingEvent {
  id: string;
  type: string;
  timestamp: Date;
  data: Record<string, any>;
  sessionId: string;
  userId?: string;
}

interface UserBehavior {
  sessionId: string;
  userId?: string;
  startTime: Date;
  lastActivity: Date;
  events: TrackingEvent[];
  journey?: {
    terminal: string;
    flightNumber?: string;
    gate?: string;
  };
  preferences: {
    vibes: string[];
    priceRange: string;
    walkingDistance: string;
  };
}

class BehavioralTrackingService {
  private sessionId: string;
  private userId?: string;
  private behavior: UserBehavior;
  private eventQueue: TrackingEvent[] = [];
  private isOnline: boolean = navigator.onLine;
  private flushInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.behavior = this.initializeBehavior();
    this.setupEventListeners();
    this.startFlushInterval();
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private initializeBehavior(): UserBehavior {
    return {
      sessionId: this.sessionId,
      userId: this.userId,
      startTime: new Date(),
      lastActivity: new Date(),
      events: [],
      preferences: {
        vibes: [],
        priceRange: 'any',
        walkingDistance: 'medium',
      },
    };
  }

  private setupEventListeners(): void {
    // Track online/offline status
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.flushEvents();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
    });

    // Track page visibility
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.trackEvent('page_hidden', { timestamp: new Date() });
      } else {
        this.trackEvent('page_visible', { timestamp: new Date() });
      }
    });

    // Track beforeunload
    window.addEventListener('beforeunload', () => {
      this.trackEvent('page_unload', { timestamp: new Date() });
      this.flushEvents(true); // Force flush
    });
  }

  private startFlushInterval(): void {
    this.flushInterval = setInterval(() => {
      if (this.isOnline && this.eventQueue.length > 0) {
        this.flushEvents();
      }
    }, 30000); // Flush every 30 seconds
  }

  private stopFlushInterval(): void {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
      this.flushInterval = null;
    }
  }

  public init(): void {
    this.trackEvent('session_start', {
      userAgent: navigator.userAgent,
      language: navigator.language,
      platform: navigator.platform,
      screenResolution: `${screen.width}x${screen.height}`,
      viewportSize: `${window.innerWidth}x${window.innerHeight}`,
    });
  }

  public cleanup(): void {
    this.trackEvent('session_end', {
      duration: Date.now() - this.behavior.startTime.getTime(),
      totalEvents: this.behavior.events.length,
    });
    
    this.flushEvents(true);
    this.stopFlushInterval();
  }

  public setUserId(userId: string): void {
    this.userId = userId;
    this.behavior.userId = userId;
  }

  public trackEvent(type: string, data: Record<string, any> = {}): void {
    const event: TrackingEvent = {
      id: this.generateEventId(),
      type,
      timestamp: new Date(),
      data,
      sessionId: this.sessionId,
      userId: this.userId,
    };

    this.behavior.events.push(event);
    this.behavior.lastActivity = new Date();
    this.eventQueue.push(event);

    // Send to analytics if available
    this.sendToAnalytics(event);

    // Flush if queue is getting large
    if (this.eventQueue.length >= 10) {
      this.flushEvents();
    }
  }

  public trackPageView(page: string, data: Record<string, any> = {}): void {
    this.trackEvent('page_view', {
      page,
      referrer: document.referrer,
      ...data,
    });
  }

  public trackAmenityView(amenityId: string, amenityName: string, data: Record<string, any> = {}): void {
    this.trackEvent('amenity_view', {
      amenityId,
      amenityName,
      ...data,
    });
  }

  public trackAmenityBookmark(amenityId: string, amenityName: string): void {
    this.trackEvent('amenity_bookmark', {
      amenityId,
      amenityName,
    });
  }

  public trackVibeSelection(vibe: string, selected: boolean): void {
    this.trackEvent('vibe_selection', {
      vibe,
      selected,
    });
  }

  public trackSearch(query: string, resultsCount: number, filters?: Record<string, any>): void {
    this.trackEvent('search', {
      query,
      resultsCount,
      filters,
    });
  }

  public trackJourneyStart(terminal: string, flightNumber?: string, gate?: string): void {
    this.behavior.journey = { terminal, flightNumber, gate };
    this.trackEvent('journey_start', {
      terminal,
      flightNumber,
      gate,
    });
  }

  public trackJourneyEnd(duration: number, amenitiesVisited: number): void {
    this.trackEvent('journey_end', {
      duration,
      amenitiesVisited,
      terminal: this.behavior.journey?.terminal,
      flightNumber: this.behavior.journey?.flightNumber,
    });
    this.behavior.journey = undefined;
  }

  public trackPreferencesUpdate(preferences: Record<string, any>): void {
    this.behavior.preferences = { ...this.behavior.preferences, ...preferences };
    this.trackEvent('preferences_update', preferences);
  }

  public trackError(error: Error, context?: string): void {
    this.trackEvent('error', {
      message: error.message,
      stack: error.stack,
      context,
    });
  }

  public trackPerformance(metric: string, value: number, unit: string = 'ms'): void {
    this.trackEvent('performance', {
      metric,
      value,
      unit,
    });
  }

  private generateEventId(): string {
    return `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private sendToAnalytics(event: TrackingEvent): void {
    // Send to Google Analytics if available
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', event.type, {
        event_category: 'Behavior',
        event_label: event.data.page || event.data.amenityName || 'Unknown',
        value: event.data.duration || event.data.resultsCount || 1,
        custom_map: event.data,
      });
    }

    // Send to PostHog if available
    if (typeof window !== 'undefined' && (window as any).posthog) {
      (window as any).posthog.capture(event.type, event.data);
    }
  }

  private async flushEvents(force: boolean = false): Promise<void> {
    if (!this.isOnline && !force) return;
    if (this.eventQueue.length === 0) return;

    const eventsToFlush = [...this.eventQueue];
    this.eventQueue = [];

    try {
      // Send to your analytics endpoint
      await this.sendToServer(eventsToFlush);
      
      // Store in localStorage as backup
      this.storeInLocalStorage(eventsToFlush);
    } catch (error) {
      console.error('Failed to flush events:', error);
      // Re-add events to queue if failed
      this.eventQueue.unshift(...eventsToFlush);
    }
  }

  private async sendToServer(events: TrackingEvent[]): Promise<void> {
    // Replace with your actual analytics endpoint
    const response = await fetch('/api/analytics/events', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sessionId: this.sessionId,
        userId: this.userId,
        events,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to send events: ${response.status}`);
    }
  }

  private storeInLocalStorage(events: TrackingEvent[]): void {
    try {
      const stored = localStorage.getItem('terminal-plus-events');
      const existingEvents = stored ? JSON.parse(stored) : [];
      const allEvents = [...existingEvents, ...events];
      
      // Keep only last 100 events
      const eventsToStore = allEvents.slice(-100);
      
      localStorage.setItem('terminal-plus-events', JSON.stringify(eventsToStore));
    } catch (error) {
      console.error('Failed to store events in localStorage:', error);
    }
  }

  public getBehaviorData(): UserBehavior {
    return { ...this.behavior };
  }

  public exportEvents(): string {
    return JSON.stringify(this.behavior.events, null, 2);
  }

  public clearEvents(): void {
    this.behavior.events = [];
    this.eventQueue = [];
    localStorage.removeItem('terminal-plus-events');
  }
}

export const behavioralTrackingService = new BehavioralTrackingService();