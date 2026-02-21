// analyticsUtils.ts — Simple Event Tracker for Terminal+

interface AnalyticsEvent {
  event: string;
  properties?: Record<string, any>;
}

// Example of Supabase tracking function
export async function trackEvent({ event, properties = {} }: AnalyticsEvent) {
  try {
    const response = await fetch('/api/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event, properties, timestamp: new Date().toISOString() })
    });

    if (!response.ok) {
      console.warn('Analytics tracking failed:', response.statusText);
    }
  } catch (error) {
    console.warn('Analytics error:', error);
  }
}

// Convenience functions for common events
export const trackVibeSelected = (vibe: string) => {
  trackEvent({ 
    event: 'vibe_selected', 
    properties: { vibe } 
  });
};

export const trackJourneySaved = (journeyId: string, vibe?: string) => {
  trackEvent({ 
    event: 'journey_saved', 
    properties: { journeyId, vibe } 
  });
};

export const trackAmenityViewed = (amenityId: string, amenityType: string) => {
  trackEvent({ 
    event: 'amenity_viewed', 
    properties: { amenityId, amenityType } 
  });
};

export const trackPageView = (page: string) => {
  trackEvent({ 
    event: 'page_view', 
    properties: { page } 
  });
};

export const trackUserAction = (action: string, properties?: Record<string, any>) => {
  trackEvent({ 
    event: 'user_action', 
    properties: { action, ...properties } 
  });
};

// Legacy alias for backwards compatibility - supports both signatures
export const logEvent = (event: string, properties?: Record<string, any>) => {
  trackEvent({ event, properties });
}; 