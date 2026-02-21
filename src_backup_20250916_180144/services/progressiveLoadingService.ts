// Progressive Data Loading Service for Airport Amenity App
// Implements optimal loading strategy based on data analysis

export interface EssentialSchema {
  id: number;
  amenity_slug: string;
  airport_code: string;
  terminal_code: string;
  vibe_tags: string;
  price_level: string;
}

export interface DetailSchema {
  name: string;
  description: string;
  opening_hours: string;
  booking_required: boolean;
  location_description?: string;
}

export interface MediaSchema {
  logo_url?: string;
  website_url?: string;
  image_url?: string;
}

export interface AmenityData {
  essential: EssentialSchema;
  detail?: DetailSchema;
  media?: MediaSchema;
  loadingState: 'essential' | 'detail' | 'media' | 'complete';
}

export interface LoadingPriority {
  priority: 1 | 2 | 3 | 4;
  description: string;
  estimatedAmenities: number;
  loadStrategy: 'immediate' | 'on-demand' | 'background' | 'lazy';
}

export interface PreloadStrategy {
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
  vibeCategories: string[];
  priority: 'high' | 'medium' | 'low';
}

export interface CacheStrategy {
  persistent: {
    fields: string[];
    ttl: number; // days
  };
  sessionCache: {
    fields: string[];
    ttl: number; // hours
  };
  noCache: {
    fields: string[];
    ttl: number; // none
  };
}

class ProgressiveLoadingService {
  private static instance: ProgressiveLoadingService;
  private cache: Map<string, AmenityData> = new Map();
  private loadingQueue: Map<string, Promise<any>> = new Map();
  private performanceMetrics: Map<string, number> = new Map();

  private constructor() {}

  static getInstance(): ProgressiveLoadingService {
    if (!ProgressiveLoadingService.instance) {
      ProgressiveLoadingService.instance = new ProgressiveLoadingService();
    }
    return ProgressiveLoadingService.instance;
  }

  /**
   * 1. Progressive Data Loading Architecture
   */
  
  /**
   * Load only essential fields for instant UI (< 50KB)
   * Impact: ~60% size reduction, enables instant search/filter
   */
  async loadEssentialData(terminal: string): Promise<EssentialSchema[]> {
    const cacheKey = `essential_${terminal}`;
    
    // Check cache first
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      this.trackPerformance('cache_hit_essential', Date.now());
      return cached as EssentialSchema[];
    }

    const startTime = Date.now();
    
    try {
      // Fetch minimal data for instant UI
      const response = await fetch(`/api/amenities/${terminal}/essential`);
      const data: EssentialSchema[] = await response.json();
      
      // Cache essential data (persistent cache)
      this.setCache(cacheKey, data, 'persistent');
      
      this.trackPerformance('essential_load_time', Date.now() - startTime);
      this.trackPerformance('essential_data_size', JSON.stringify(data).length);
      
      return data;
    } catch (error) {
      console.error('Failed to load essential data:', error);
      // Return cached data if available, or empty array
      return this.getFromCache(cacheKey) || [];
    }
  }

  /**
   * Load secondary data when user shows intent (scroll, tap)
   */
  async loadDetailData(amenityIds: string[]): Promise<DetailSchema[]> {
    const cacheKey = `detail_${amenityIds.sort().join('_')}`;
    
    // Check cache first
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      this.trackPerformance('cache_hit_detail', Date.now());
      return cached as DetailSchema[];
    }

    const startTime = Date.now();
    
    try {
      // Fetch detail data on-demand
      const response = await fetch('/api/amenities/details', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amenityIds })
      });
      const data: DetailSchema[] = await response.json();
      
      // Cache detail data (session cache)
      this.setCache(cacheKey, data, 'sessionCache');
      
      this.trackPerformance('detail_load_time', Date.now() - startTime);
      this.trackPerformance('detail_data_size', JSON.stringify(data).length);
      
      return data;
    } catch (error) {
      console.error('Failed to load detail data:', error);
      return [];
    }
  }

  /**
   * Load media data only when visible in viewport
   */
  async loadMediaData(amenityIds: string[]): Promise<MediaSchema[]> {
    const cacheKey = `media_${amenityIds.sort().join('_')}`;
    
    // Check cache first
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      this.trackPerformance('cache_hit_media', Date.now());
      return cached as MediaSchema[];
    }

    const startTime = Date.now();
    
    try {
      // Fetch media data only when needed
      const response = await fetch('/api/amenities/media', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amenityIds })
      });
      const data: MediaSchema[] = await response.json();
      
      // Cache media data (no persistent cache due to frequent updates)
      this.setCache(cacheKey, data, 'noCache');
      
      this.trackPerformance('media_load_time', Date.now() - startTime);
      this.trackPerformance('media_data_size', JSON.stringify(data).length);
      
      return data;
    } catch (error) {
      console.error('Failed to load media data:', error);
      return [];
    }
  }

  /**
   * 2. Smart Chunking by Terminal
   * Your data shows heavy concentration in Singapore terminals (683/768 amenities)
   */
  getLoadingPriority(currentTerminal: string, userLocation: string): LoadingPriority[] {
    const priorities: LoadingPriority[] = [
      {
        priority: 1,
        description: 'Current Terminal',
        estimatedAmenities: 150,
        loadStrategy: 'immediate'
      },
      {
        priority: 2,
        description: 'Current Airport',
        estimatedAmenities: 500,
        loadStrategy: 'on-demand'
      },
      {
        priority: 3,
        description: 'Recent Airports',
        estimatedAmenities: 200,
        loadStrategy: 'background'
      },
      {
        priority: 4,
        description: 'Popular Airports (SIN, LHR, SYD)',
        estimatedAmenities: 300,
        loadStrategy: 'lazy'
      }
    ];

    // Adjust based on current terminal
    if (currentTerminal.startsWith('SIN')) {
      priorities[1].estimatedAmenities = 683; // Singapore has 683 amenities
    }

    return priorities;
  }

  /**
   * 3. Context-Aware Preloading
   * Based on vibe tags distribution and time of day
   */
  getPreloadStrategies(): PreloadStrategy[] {
    const hour = new Date().getHours();
    let timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
    
    if (hour >= 6 && hour < 12) timeOfDay = 'morning';
    else if (hour >= 12 && hour < 17) timeOfDay = 'afternoon';
    else if (hour >= 17 && hour < 22) timeOfDay = 'evening';
    else timeOfDay = 'night';

    const strategies: PreloadStrategy[] = [
      {
        timeOfDay: 'morning',
        vibeCategories: ['Refuel', 'Quick', 'Grab & Go', 'Coffee'],
        priority: 'high'
      },
      {
        timeOfDay: 'afternoon',
        vibeCategories: ['Lunch', 'Quick', 'Shop', 'Work'],
        priority: 'high'
      },
      {
        timeOfDay: 'evening',
        vibeCategories: ['Chill', 'Comfort', 'Dine', 'Bar'],
        priority: 'medium'
      },
      {
        timeOfDay: 'night',
        vibeCategories: ['Late Night', 'Comfort', 'Lounge'],
        priority: 'low'
      }
    ];

    return strategies.filter(s => s.timeOfDay === timeOfDay);
  }

  /**
   * 4. Intelligent Caching Strategy
   */
  getCacheStrategy(): CacheStrategy {
    return {
      persistent: {
        fields: ['id', 'amenity_slug', 'terminal_code', 'airport_code'],
        ttl: 30 * 24 * 60 * 60 * 1000 // 30 days
      },
      sessionCache: {
        fields: ['vibe_tags', 'price_level', 'opening_hours'],
        ttl: 24 * 60 * 60 * 1000 // 24 hours
      },
      noCache: {
        fields: ['logo_url', 'website_url'],
        ttl: 0 // no cache
      }
    };
  }

  /**
   * 5. Collection Loading Optimization
   * For your Smart7 collections feature
   */
  async getCollectionStrategy(): Promise<{
    cached: string[];
    dynamic: {
      timeOfDay: string[];
      flightStatus: string[];
      userProfile: string[];
    };
  }> {
    return {
      cached: ['quick-bites', 'luxury-shopping', 'work-zones', 'hawker-heaven'],
      dynamic: {
        timeOfDay: this.getTimeBasedCollections(),
        flightStatus: this.getFlightStatusCollections(),
        userProfile: this.getPersonalizedCollections()
      }
    };
  }

  /**
   * 6. Error Recovery Pattern
   */
  async loadAmenities(terminal: string): Promise<AmenityData[]> {
    try {
      // Try cache first
      const cached = this.getFromCache(`amenities_${terminal}`);
      if (cached && !this.isStale(cached)) {
        this.trackPerformance('cache_hit_full', Date.now());
        return cached as AmenityData[];
      }
      
      // Fallback to minimal data
      const minimal = await this.loadEssentialData(terminal);
      const amenityData = minimal.map(essential => ({
        essential,
        loadingState: 'essential' as const
      }));
      
      // Render minimal data immediately
      this.renderAmenities(amenityData);
      
      // Background fetch full data
      this.loadFullData(terminal).then(fullData => {
        this.updateUI(terminal, fullData);
      });
      
      return amenityData;
    } catch (error) {
      console.error('Failed to load amenities:', error);
      // Show last known good state
      return this.getLastKnownState(terminal) || [];
    }
  }

  /**
   * 7. Performance Metrics Tracking
   */
  trackPerformance(metric: string, value: number): void {
    this.performanceMetrics.set(metric, value);
    
    // Log performance metrics
    console.log(`📊 Performance: ${metric} = ${value}`);
    
    // Send to analytics if available
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'performance_metric', {
        metric_name: metric,
        metric_value: value
      });
    }
  }

  getPerformanceMetrics(): Record<string, number> {
    const metrics: Record<string, number> = {};
    this.performanceMetrics.forEach((value, key) => {
      metrics[key] = value;
    });
    return metrics;
  }

  // Private helper methods
  private getFromCache(key: string): any {
    const cached = this.cache.get(key);
    if (cached && !this.isStale(cached)) {
      return cached;
    }
    return null;
  }

  private setCache(key: string, data: any, strategy: keyof CacheStrategy): void {
    const cacheStrategy = this.getCacheStrategy();
    const ttl = cacheStrategy[strategy].ttl;
    
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  private isStale(cached: any): boolean {
    if (!cached.timestamp || !cached.ttl) return true;
    return Date.now() - cached.timestamp > cached.ttl;
  }

  private renderAmenities(amenities: AmenityData[]): void {
    // This would trigger a re-render in your React component
    console.log(`Rendering ${amenities.length} amenities`);
  }

  private updateUI(terminal: string, fullData: AmenityData[]): void {
    // This would update the UI with full data
    console.log(`Updating UI for ${terminal} with ${fullData.length} amenities`);
  }

  private getLastKnownState(terminal: string): AmenityData[] | null {
    // Return last known good state from cache
    const cached = this.cache.get(`last_known_${terminal}`);
    return cached ? cached.data : null;
  }

  private async loadFullData(terminal: string): Promise<AmenityData[]> {
    // Load complete amenity data
    const essential = await this.loadEssentialData(terminal);
    const detail = await this.loadDetailData(essential.map(e => e.amenity_slug));
    const media = await this.loadMediaData(essential.map(e => e.amenity_slug));
    
    return essential.map((e, index) => ({
      essential: e,
      detail: detail[index],
      media: media[index],
      loadingState: 'complete' as const
    }));
  }

  private getTimeBasedCollections(): string[] {
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 11) return ['breakfast-spots', 'coffee-havens'];
    if (hour >= 11 && hour < 15) return ['lunch-options', 'quick-bites'];
    if (hour >= 17 && hour < 20) return ['dinner-destinations', 'happy-hour'];
    return ['late-night-options', 'comfort-zones'];
  }

  private getFlightStatusCollections(): string[] {
    // This would integrate with your flight status system
    return ['delayed-flight-options', 'overnight-amenities'];
  }

  private getPersonalizedCollections(): string[] {
    // This would integrate with user preferences
    return ['favorite-categories', 'recent-searches'];
  }
}

// Export singleton instance
export const progressiveLoadingService = ProgressiveLoadingService.getInstance();

// Export types for use in components
export type { 
  EssentialSchema, 
  DetailSchema, 
  MediaSchema, 
  AmenityData,
  LoadingPriority,
  PreloadStrategy,
  CacheStrategy
};
