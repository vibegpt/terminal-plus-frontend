// src/lib/analytics/collectionTracking.ts

/**
 * Track when a user views a collection
 */
export const trackCollectionView = (
  collectionId: string, 
  amenityCount: number,
  terminal: string
) => {
  try {
    // Track with Google Analytics 4
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'collection_viewed', {
        collection_id: collectionId,
        amenity_count: amenityCount,
        terminal: terminal,
        timestamp: new Date().toISOString(),
        device_type: /Mobile|Android|iPhone/i.test(navigator.userAgent) ? 'mobile' : 'desktop'
      });
    }
    
    // Log in development
    if (process.env.NODE_ENV === 'development') {
      console.log('📊 Collection View Tracked:', {
        collectionId,
        amenityCount,
        terminal
      });
    }
  } catch (error) {
    console.error('Failed to track collection view:', error);
  }
};

/**
 * Track when a user clicks on an amenity within a collection
 */
export const trackAmenityClick = (
  amenityId: string,
  amenityName: string,
  collectionId: string,
  position: number
) => {
  try {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'amenity_clicked', {
        amenity_id: amenityId,
        amenity_name: amenityName,
        from_collection: collectionId,
        position_in_list: position,
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('Failed to track amenity click:', error);
  }
};

/**
 * Track collection engagement metrics
 */
export const trackCollectionEngagement = (
  collectionId: string,
  action: 'save' | 'share' | 'play_tour' | 'filter_change',
  metadata?: any
) => {
  try {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'collection_engagement', {
        collection_id: collectionId,
        action: action,
        ...metadata,
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('Failed to track collection engagement:', error);
  }
};

/**
 * Track collection performance metrics
 */
export const trackCollectionPerformance = (
  collectionId: string,
  loadTime: number,
  amenityCount: number,
  errorOccurred: boolean = false
) => {
  try {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'collection_performance', {
        collection_id: collectionId,
        load_time_ms: loadTime,
        amenity_count: amenityCount,
        error_occurred: errorOccurred,
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('Failed to track collection performance:', error);
  }
};
