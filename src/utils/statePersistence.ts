// src/utils/statePersistence.ts - State persistence utilities
export const NavigationState = {
  save: (key: string, data: any) => {
    try {
      // Use both sessionStorage (for session) and localStorage (for persistence)
      sessionStorage.setItem(key, JSON.stringify(data));
      
      // Save important data to localStorage with expiry
      if (['journeyContext', 'userPreferences'].includes(key)) {
        const withExpiry = {
          data,
          expiry: new Date().getTime() + (24 * 60 * 60 * 1000) // 24 hours
        };
        localStorage.setItem(key, JSON.stringify(withExpiry));
      }
    } catch (error) {
      console.error('Failed to save navigation state:', error);
    }
  },
  
  load: (key: string) => {
    try {
      // First check sessionStorage
      const sessionData = sessionStorage.getItem(key);
      if (sessionData) {
        return JSON.parse(sessionData);
      }
      
      // Fall back to localStorage
      const localData = localStorage.getItem(key);
      if (localData) {
        const { data, expiry } = JSON.parse(localData);
        if (expiry > new Date().getTime()) {
          return data;
        }
        // Clean up expired data
        localStorage.removeItem(key);
      }
      
      return null;
    } catch (error) {
      console.error('Failed to load navigation state:', error);
      return null;
    }
  },
  
  clear: (key: string) => {
    sessionStorage.removeItem(key);
    localStorage.removeItem(key);
  },
  
  clearAll: () => {
    // Clear all navigation-related state
    const keysToClear = [
      'selectedCollection',
      'amenityContext',
      'terminalContext',
      'vibeContext',
      'navigationHistory'
    ];
    
    keysToClear.forEach(key => {
      sessionStorage.removeItem(key);
      localStorage.removeItem(key);
    });
  },
  
  // Get journey context with fallback
  getJourneyContext: () => {
    return NavigationState.load('journeyContext') || {
      airportCode: null,
      terminalCode: null,
      fromDeepLink: false
    };
  },
  
  // Set journey context
  setJourneyContext: (context: any) => {
    NavigationState.save('journeyContext', {
      ...NavigationState.getJourneyContext(),
      ...context,
      updatedAt: new Date().toISOString()
    });
  },
  
  // Get user preferences
  getUserPreferences: () => {
    return NavigationState.load('userPreferences') || {
      theme: 'auto',
      language: 'en',
      notifications: true,
      analytics: true
    };
  },
  
  // Set user preferences
  setUserPreferences: (preferences: any) => {
    NavigationState.save('userPreferences', {
      ...NavigationState.getUserPreferences(),
      ...preferences,
      updatedAt: new Date().toISOString()
    });
  }
};

// Session management utilities
export const SessionManager = {
  // Get or create session ID
  getSessionId: (): string => {
    let sessionId = sessionStorage.getItem('sessionId');
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('sessionId', sessionId);
    }
    return sessionId;
  },
  
  // Get session start time
  getSessionStartTime: (): Date => {
    const startTime = sessionStorage.getItem('sessionStartTime');
    if (startTime) {
      return new Date(startTime);
    }
    
    const now = new Date();
    sessionStorage.setItem('sessionStartTime', now.toISOString());
    return now;
  },
  
  // Get session duration in minutes
  getSessionDuration: (): number => {
    const startTime = SessionManager.getSessionStartTime();
    const now = new Date();
    return Math.floor((now.getTime() - startTime.getTime()) / (1000 * 60));
  },
  
  // Check if session is active (less than 30 minutes)
  isSessionActive: (): boolean => {
    return SessionManager.getSessionDuration() < 30;
  },
  
  // Refresh session
  refreshSession: () => {
    const now = new Date();
    sessionStorage.setItem('sessionStartTime', now.toISOString());
  }
};

// Analytics utilities
export const AnalyticsManager = {
  // Track page view
  trackPageView: (path: string, title?: string) => {
    const event = {
      event: 'page_view',
      path,
      title: title || document.title,
      timestamp: new Date().toISOString(),
      sessionId: SessionManager.getSessionId(),
      sessionDuration: SessionManager.getSessionDuration()
    };
    
    // Send to analytics service if available
    if (window.gtag) {
      window.gtag('event', 'page_view', event);
    }
    
    // Store locally for debugging
    try {
      const pageViews = JSON.parse(localStorage.getItem('page_views') || '[]');
      pageViews.push(event);
      localStorage.setItem('page_views', JSON.stringify(pageViews.slice(-100)));
    } catch (error) {
      console.warn('Failed to log page view:', error);
    }
  },
  
  // Track user interaction
  trackInteraction: (action: string, target: string, metadata: any = {}) => {
    const event = {
      event: 'user_interaction',
      action,
      target,
      timestamp: new Date().toISOString(),
      sessionId: SessionManager.getSessionId(),
      ...metadata
    };
    
    // Send to analytics service if available
    if (window.gtag) {
      window.gtag('event', 'user_interaction', event);
    }
    
    // Store locally for debugging
    try {
      const interactions = JSON.parse(localStorage.getItem('user_interactions') || '[]');
      interactions.push(event);
      localStorage.setItem('user_interactions', JSON.stringify(interactions.slice(-200)));
    } catch (error) {
      console.warn('Failed to log user interaction:', error);
    }
  },
  
  // Track collection interaction
  trackCollectionInteraction: (collectionSlug: string, action: string, metadata: any = {}) => {
    AnalyticsManager.trackInteraction('collection', action, {
      collection_slug: collectionSlug,
      ...metadata
    });
  },
  
  // Track amenity interaction
  trackAmenityInteraction: (amenitySlug: string, action: string, metadata: any = {}) => {
    AnalyticsManager.trackInteraction('amenity', action, {
      amenity_slug: amenitySlug,
      ...metadata
    });
  }
};
