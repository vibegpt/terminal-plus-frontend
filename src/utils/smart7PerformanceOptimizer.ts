import type { AmenityForSelection, SelectionResult } from '../types/smart7';
import { sessionTracker } from './sessionTracking';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
  size: number;
  accessCount: number;
  lastAccessed: number;
}

interface PerformanceConfig {
  enableLazyLoading: boolean;
  enableOfflineMode: boolean;
  enablePrefetch: boolean;
  cacheStrategy: 'memory' | 'sessionStorage' | 'hybrid';
  maxCacheSize: number; // in MB
  staleWhileRevalidate: boolean;
  enableMetrics: boolean;
  prefetchThreshold: number; // ms before intersection
}

interface PerformanceMetrics {
  cacheHitRate: number;
  averageLoadTime: number;
  offlineUsage: number;
  prefetchSuccess: number;
  memoryUsage: number;
}

class Smart7PerformanceOptimizer {
  private memoryCache: Map<string, CacheEntry<any>>;
  private config: PerformanceConfig;
  private currentCacheSize: number = 0;
  private maxCacheSizeBytes: number;
  private prefetchQueue: Set<string>;
  private isOnline: boolean = navigator.onLine;
  private observers: Map<string, IntersectionObserver>;
  private metrics: {
    cacheHits: number;
    cacheMisses: number;
    loadTimes: number[];
    offlineCount: number;
    prefetchCount: number;
    prefetchSuccess: number;
  };

  constructor(config?: Partial<PerformanceConfig>) {
    this.config = {
      enableLazyLoading: true,
      enableOfflineMode: true,
      enablePrefetch: true,
      cacheStrategy: 'hybrid',
      maxCacheSize: 10, // 10MB default
      staleWhileRevalidate: true,
      enableMetrics: true,
      prefetchThreshold: 100, // 100ms before intersection
      ...config
    };

    this.memoryCache = new Map();
    this.maxCacheSizeBytes = this.config.maxCacheSize * 1024 * 1024;
    this.prefetchQueue = new Set();
    this.observers = new Map();
    this.metrics = {
      cacheHits: 0,
      cacheMisses: 0,
      loadTimes: [],
      offlineCount: 0,
      prefetchCount: 0,
      prefetchSuccess: 0
    };

    this.initializeOfflineDetection();
    this.initializeCacheCleanup();
    this.initializePerformanceMonitoring();
  }

  /**
   * Initialize offline detection
   */
  private initializeOfflineDetection() {
    if (!this.config.enableOfflineMode) return;

    window.addEventListener('online', () => {
      this.isOnline = true;
      this.syncOfflineData();
      this.trackEvent('connection_restored');
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.metrics.offlineCount++;
      this.trackEvent('connection_lost');
    });
  }

  /**
   * Initialize periodic cache cleanup
   */
  private initializeCacheCleanup() {
    // Clean up expired cache entries every 5 minutes
    setInterval(() => {
      this.cleanExpiredCache();
    }, 5 * 60 * 1000);
  }

  /**
   * Initialize performance monitoring
   */
  private initializePerformanceMonitoring() {
    if (!this.config.enableMetrics) return;

    // Report metrics every minute
    setInterval(() => {
      this.reportMetrics();
    }, 60 * 1000);
  }

  /**
   * Track performance events
   */
  private trackEvent(eventType: string, data?: Record<string, any>) {
    try {
      sessionTracker.trackInteraction(0, 'view', {
        context_data: {
          performance_event: eventType,
          timestamp: new Date().toISOString(),
          ...data
        }
      } as any);
    } catch (error) {
      console.warn('Failed to track performance event:', error);
    }
  }

  /**
   * Cache with automatic size management and access tracking
   */
  public cache<T>(
    key: string, 
    data: T, 
    ttl: number = 300000 // 5 minutes default
  ): void {
    try {
      const size = this.estimateSize(data);
      
      // If adding this would exceed cache size, remove oldest entries
      if (this.currentCacheSize + size > this.maxCacheSizeBytes) {
        this.evictLRU(size);
      }

      const entry: CacheEntry<T> = {
        data,
        timestamp: Date.now(),
        expiresAt: Date.now() + ttl,
        size,
        accessCount: 0,
        lastAccessed: Date.now()
      };

      // Hybrid cache strategy
      if (this.config.cacheStrategy === 'hybrid' || this.config.cacheStrategy === 'memory') {
        this.memoryCache.set(key, entry);
        this.currentCacheSize += size;
      }

      if (this.config.cacheStrategy === 'hybrid' || this.config.cacheStrategy === 'sessionStorage') {
        try {
          const storageEntry = {
            ...entry,
            data: this.serializeForStorage(data)
          };
          sessionStorage.setItem(`smart7_${key}`, JSON.stringify(storageEntry));
        } catch (e) {
          console.warn('SessionStorage full, falling back to memory only');
          // Fallback to memory only
          if (this.config.cacheStrategy === 'sessionStorage') {
            this.memoryCache.set(key, entry);
            this.currentCacheSize += size;
          }
        }
      }

      this.trackEvent('cache_set', { key, size, ttl });
    } catch (error) {
      console.error('Failed to cache data:', error);
    }
  }

  /**
   * Get from cache with stale-while-revalidate support and access tracking
   */
  public async getCached<T>(
    key: string,
    fetcher?: () => Promise<T>,
    options?: {
      ttl?: number;
      staleWhileRevalidate?: boolean;
    }
  ): Promise<T | null> {
    const startTime = performance.now();
    
    try {
      // Check memory cache first
      const memoryEntry = this.memoryCache.get(key);
      if (memoryEntry) {
        this.updateAccessMetrics(memoryEntry);
        const isExpired = Date.now() > memoryEntry.expiresAt;
        
        if (!isExpired) {
          this.metrics.cacheHits++;
          this.trackEvent('cache_hit', { key, from: 'memory' });
          return memoryEntry.data;
        }
        
        // Stale while revalidate
        if (this.config.staleWhileRevalidate && fetcher && this.isOnline) {
          this.revalidateInBackground(key, fetcher, options?.ttl);
          this.metrics.cacheHits++;
          this.trackEvent('cache_hit_stale', { key, from: 'memory' });
          return memoryEntry.data; // Return stale data
        }
      }

      // Check session storage
      if (this.config.cacheStrategy === 'hybrid' || this.config.cacheStrategy === 'sessionStorage') {
        try {
          const stored = sessionStorage.getItem(`smart7_${key}`);
          if (stored) {
            const entry: CacheEntry<T> = JSON.parse(stored);
            const isExpired = Date.now() > entry.expiresAt;
            
            if (!isExpired) {
              // Promote to memory cache
              this.memoryCache.set(key, entry);
              this.currentCacheSize += entry.size;
              this.metrics.cacheHits++;
              this.trackEvent('cache_hit', { key, from: 'sessionStorage' });
              return entry.data;
            }
          }
        } catch (e) {
          console.error('Failed to parse cached data:', e);
        }
      }

      // Fetch fresh data if online
      if (fetcher && this.isOnline) {
        try {
          const data = await fetcher();
          this.cache(key, data, options?.ttl);
          this.metrics.cacheMisses++;
          
          const loadTime = performance.now() - startTime;
          this.metrics.loadTimes.push(loadTime);
          
          this.trackEvent('cache_miss_fresh', { key, loadTime });
          return data;
        } catch (error) {
          console.error('Failed to fetch data:', error);
          
          // Return expired data if offline or fetch failed
          if (memoryEntry) {
            this.metrics.cacheHits++;
            this.trackEvent('cache_hit_fallback', { key, reason: 'fetch_failed' });
            return memoryEntry.data;
          }
        }
      }

      // Offline fallback
      if (!this.isOnline && memoryEntry) {
        this.metrics.cacheHits++;
        this.trackEvent('cache_hit_offline', { key });
        return memoryEntry.data; // Return even if expired when offline
      }

      this.metrics.cacheMisses++;
      this.trackEvent('cache_miss_no_fallback', { key });
      return null;
    } catch (error) {
      console.error('Cache retrieval failed:', error);
      this.metrics.cacheMisses++;
      return null;
    }
  }

  /**
   * Update access metrics for cache entry
   */
  private updateAccessMetrics(entry: CacheEntry<any>): void {
    entry.accessCount++;
    entry.lastAccessed = Date.now();
  }

  /**
   * Serialize data for storage (handle circular references)
   */
  private serializeForStorage(data: any): any {
    try {
      // Simple circular reference detection
      const seen = new WeakSet();
      return JSON.parse(JSON.stringify(data, (key, value) => {
        if (typeof value === 'object' && value !== null) {
          if (seen.has(value)) {
            return '[Circular]';
          }
          seen.add(value);
        }
        return value;
      }));
    } catch (error) {
      console.warn('Failed to serialize data for storage:', error);
      return data;
    }
  }

  /**
   * Revalidate cache in background
   */
  private async revalidateInBackground<T>(
    key: string,
    fetcher: () => Promise<T>,
    ttl?: number
  ): Promise<void> {
    try {
      const freshData = await fetcher();
      this.cache(key, freshData, ttl);
      this.trackEvent('cache_revalidated', { key });
    } catch (error) {
      console.error('Background revalidation failed:', error);
      this.trackEvent('cache_revalidation_failed', { key, error: error.message });
    }
  }

  /**
   * Lazy load amenities with intersection observer
   */
  public setupLazyLoading(
    container: HTMLElement,
    onVisible: (amenityId: number) => void,
    options?: {
      rootMargin?: string;
      threshold?: number;
    }
  ): void {
    if (!this.config.enableLazyLoading) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const amenityId = entry.target.getAttribute('data-amenity-id');
            if (amenityId) {
              onVisible(Number(amenityId));
              observer.unobserve(entry.target);
              this.trackEvent('lazy_load_triggered', { amenityId: Number(amenityId) });
            }
          }
        });
      },
      {
        root: null,
        rootMargin: options?.rootMargin || '50px',
        threshold: options?.threshold || 0.01
      }
    );

    // Observe all amenity cards
    const cards = container.querySelectorAll('[data-amenity-id]');
    cards.forEach(card => observer.observe(card));

    // Store observer for cleanup
    const observerId = `observer_${Date.now()}`;
    this.observers.set(observerId, observer);
  }

  /**
   * Prefetch next likely collections
   */
  public async prefetchCollections(
    collectionIds: number[],
    fetcher: (id: number) => Promise<any>
  ): Promise<void> {
    if (!this.config.enablePrefetch || !this.isOnline) return;

    this.metrics.prefetchCount += collectionIds.length;

    // Use requestIdleCallback for non-blocking prefetch
    const prefetch = (id: number) => {
      if ('requestIdleCallback' in window) {
        requestIdleCallback(async () => {
          const cacheKey = `collection_${id}`;
          if (!this.memoryCache.has(cacheKey)) {
            try {
              const data = await fetcher(id);
              this.cache(cacheKey, data);
              this.metrics.prefetchSuccess++;
              this.trackEvent('prefetch_success', { collectionId: id });
            } catch (error) {
              console.error(`Prefetch failed for collection ${id}:`, error);
              this.trackEvent('prefetch_failed', { collectionId: id, error: error.message });
            }
          }
        });
      } else {
        // Fallback for browsers without requestIdleCallback
        setTimeout(async () => {
          const cacheKey = `collection_${id}`;
          if (!this.memoryCache.has(cacheKey)) {
            try {
              const data = await fetcher(id);
              this.cache(cacheKey, data);
              this.metrics.prefetchSuccess++;
              this.trackEvent('prefetch_success', { collectionId: id });
            } catch (error) {
              console.error(`Prefetch failed for collection ${id}:`, error);
              this.trackEvent('prefetch_failed', { collectionId: id, error: error.message });
            }
          }
        }, 1000);
      }
    };

    collectionIds.forEach(id => prefetch(id));
  }

  /**
   * Get performance metrics
   */
  public getMetrics(): PerformanceMetrics {
    const totalRequests = this.metrics.cacheHits + this.metrics.cacheMisses;
    const cacheHitRate = totalRequests > 0 ? this.metrics.cacheHits / totalRequests : 0;
    const averageLoadTime = this.metrics.loadTimes.length > 0 
      ? this.metrics.loadTimes.reduce((a, b) => a + b, 0) / this.metrics.loadTimes.length 
      : 0;
    const prefetchSuccess = this.metrics.prefetchCount > 0 
      ? this.metrics.prefetchSuccess / this.metrics.prefetchCount 
      : 0;

    return {
      cacheHitRate,
      averageLoadTime,
      offlineUsage: this.metrics.offlineCount,
      prefetchSuccess,
      memoryUsage: this.currentCacheSize / (1024 * 1024) // MB
    };
  }

  /**
   * Optimize for mobile devices
   */
  public getMobileOptimizations(): {
    reduceAnimations: boolean;
    useWebP: boolean;
    reducedDataMode: boolean;
    touchOptimized: boolean;
    reducedPrefetch: boolean;
    aggressiveCaching: boolean;
  } {
    const connection = (navigator as any).connection;
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    const isSlowConnection = connection?.effectiveType === '2g' || 
                            connection?.effectiveType === 'slow-2g';
    const saveData = connection?.saveData === true;

    return {
      reduceAnimations: isSlowConnection || saveData,
      useWebP: 'createImageBitmap' in window,
      reducedDataMode: saveData || isSlowConnection,
      touchOptimized: isMobile,
      reducedPrefetch: isSlowConnection || saveData || !this.isOnline,
      aggressiveCaching: isSlowConnection || saveData
    };
  }

  /**
   * Get offline fallback selections
   */
  public getOfflineFallback(collectionId: number): SelectionResult[] | null {
    const cacheKey = `offline_fallback_${collectionId}`;
    const cached = this.memoryCache.get(cacheKey);
    
    if (cached?.data) {
      this.trackEvent('offline_fallback_used', { collectionId });
      return cached.data;
    }

    // Try session storage
    try {
      const stored = sessionStorage.getItem(`smart7_${cacheKey}`);
      if (stored) {
        const entry: CacheEntry<SelectionResult[]> = JSON.parse(stored);
        this.trackEvent('offline_fallback_used', { collectionId, from: 'sessionStorage' });
        return entry.data;
      }
    } catch (e) {
      console.error('Failed to get offline fallback:', e);
    }

    return null;
  }

  /**
   * Save selections for offline use
   */
  public saveOfflineFallback(
    collectionId: number, 
    selections: SelectionResult[]
  ): void {
    const cacheKey = `offline_fallback_${collectionId}`;
    this.cache(cacheKey, selections, 24 * 60 * 60 * 1000); // 24 hours
    this.trackEvent('offline_fallback_saved', { collectionId, count: selections.length });
  }

  /**
   * Sync offline data when connection restored
   */
  private async syncOfflineData(): Promise<void> {
    try {
      // Get all offline interactions from session storage
      const offlineInteractions = this.getOfflineInteractions();
      
      if (offlineInteractions.length > 0) {
        // Sync with backend
        const { supabaseTrackingService } = await import('../services/supabaseTrackingService');
        await supabaseTrackingService.batchInsertInteractions(offlineInteractions);
        
        // Clear offline queue
        this.clearOfflineInteractions();
        
        this.trackEvent('offline_data_synced', { count: offlineInteractions.length });
      }
    } catch (error) {
      console.error('Failed to sync offline data:', error);
      this.trackEvent('offline_sync_failed', { error: error.message });
    }
  }

  /**
   * Get offline interactions from storage
   */
  private getOfflineInteractions(): any[] {
    try {
      const stored = sessionStorage.getItem('smart7_offline_interactions');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  /**
   * Clear offline interactions
   */
  private clearOfflineInteractions(): void {
    sessionStorage.removeItem('smart7_offline_interactions');
  }

  /**
   * Report metrics to tracking service
   */
  private async reportMetrics(): Promise<void> {
    if (!this.config.enableMetrics) return;

    try {
      const metrics = this.getMetrics();
      this.trackEvent('performance_metrics', metrics);
      
      // Reset counters
      this.metrics.loadTimes = [];
    } catch (error) {
      console.error('Failed to report metrics:', error);
    }
  }

  /**
   * Evict least recently used cache entries
   */
  private evictLRU(requiredSpace: number): void {
    const entries = Array.from(this.memoryCache.entries());
    entries.sort((a, b) => a[1].lastAccessed - b[1].lastAccessed);
    
    let freedSpace = 0;
    for (const [key, entry] of entries) {
      if (freedSpace >= requiredSpace) break;
      
      this.memoryCache.delete(key);
      this.currentCacheSize -= entry.size;
      freedSpace += entry.size;
    }

    this.trackEvent('cache_eviction', { freedSpace, requiredSpace });
  }

  /**
   * Clean expired cache entries
   */
  private cleanExpiredCache(): void {
    const now = Date.now();
    let cleanedCount = 0;
    let cleanedSize = 0;

    for (const [key, entry] of this.memoryCache.entries()) {
      if (now > entry.expiresAt) {
        this.memoryCache.delete(key);
        this.currentCacheSize -= entry.size;
        cleanedCount++;
        cleanedSize += entry.size;
      }
    }

    if (cleanedCount > 0) {
      this.trackEvent('cache_cleanup', { cleanedCount, cleanedSize });
    }
  }

  /**
   * Estimate object size in bytes
   */
  private estimateSize(obj: any): number {
    try {
      const str = JSON.stringify(obj);
      return str.length * 2; // Rough estimate (2 bytes per character)
    } catch (error) {
      // Fallback for circular references
      return 1024; // 1KB default
    }
  }

  /**
   * Cleanup resources
   */
  public cleanup(): void {
    // Disconnect all observers
    this.observers.forEach(observer => observer.disconnect());
    this.observers.clear();
    
    // Clear memory cache
    this.memoryCache.clear();
    this.currentCacheSize = 0;
    
    // Report final metrics
    if (this.config.enableMetrics) {
      this.reportMetrics();
    }
  }
}

// Export singleton instance
export const performanceOptimizer = new Smart7PerformanceOptimizer();
