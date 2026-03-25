// vibeStorageManager.ts
// Storage Manager with vibe-first pattern support for collections and amenities

import { VibePatternVerifier } from './vibePatternVerifier';

// Types and Interfaces
interface StorageConfig {
  version: string;
  maxCacheAge: number; // milliseconds
  maxCacheSize: number; // bytes
  enableCompression: boolean;
  enableOfflineSupport: boolean;
}

interface CacheMetadata {
  key: string;
  timestamp: number;
  size: number;
  hits: number;
  vibe?: string;
  terminal?: string;
  collection?: string;
}

interface CollectionData {
  slug: string;
  vibe: string;
  name: string;
  description: string;
  imageUrl?: string;
  amenityIds: number[];
  terminals?: string[];
  featured: boolean;
  order: number;
  metadata?: Record<string, any>;
}

interface AmenityData {
  id: number;
  created_at: string;
  amenity_slug: string;
  description: string;
  website_url?: string;
  logo_url?: string;
  vibe_tags: string;
  booking_required: boolean;
  available_in_tr: boolean;
  price_level: string;
  opening_hours: string;
  terminal_code: string;
  airport_code: string;
  name: string;
}

interface StorageStats {
  totalSize: number;
  itemCount: number;
  cacheHitRate: number;
  oldestItem: Date | null;
  newestItem: Date | null;
  vibeDistribution: Record<string, number>;
  terminalDistribution: Record<string, number>;
}

// Default configuration
const DEFAULT_CONFIG: StorageConfig = {
  version: '1.0.0',
  maxCacheAge: 3600000, // 1 hour
  maxCacheSize: 10 * 1024 * 1024, // 10MB
  enableCompression: true,
  enableOfflineSupport: true
};

// Storage keys namespace
const STORAGE_KEYS = {
  CONFIG: 'vibe_storage_config',
  COLLECTIONS: 'vibe_collections',
  AMENITIES: 'vibe_amenities',
  CACHE_METADATA: 'vibe_cache_metadata',
  USER_PREFERENCES: 'vibe_user_preferences',
  OFFLINE_QUEUE: 'vibe_offline_queue'
};

export class VibeStorageManager {
  private config: StorageConfig;
  private cacheMetadata: Map<string, CacheMetadata>;
  private memoryCache: Map<string, any>;
  private offlineQueue: any[];

  constructor(config: Partial<StorageConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.cacheMetadata = new Map();
    this.memoryCache = new Map();
    this.offlineQueue = [];
    
    this.initialize();
  }

  /**
   * Initialize storage manager
   */
  private initialize(): void {
    try {
      // Load existing metadata
      const savedMetadata = localStorage.getItem(STORAGE_KEYS.CACHE_METADATA);
      if (savedMetadata) {
        const metadata = JSON.parse(savedMetadata);
        Object.entries(metadata).forEach(([key, value]) => {
          this.cacheMetadata.set(key, value as CacheMetadata);
        });
      }

      // Load offline queue
      const savedQueue = localStorage.getItem(STORAGE_KEYS.OFFLINE_QUEUE);
      if (savedQueue) {
        this.offlineQueue = JSON.parse(savedQueue);
      }

      // Clean expired cache on initialization
      this.cleanExpiredCache();
    } catch (error) {
      console.error('Failed to initialize storage manager:', error);
    }
  }

  /**
   * Store collection data with vibe context
   */
  async storeCollection(collection: CollectionData): Promise<boolean> {
    try {
      // Validate collection
      const validation = VibePatternVerifier.validateCollection({
        slug: collection.slug,
        vibe: collection.vibe,
        name: collection.name,
        terminals: collection.terminals,
        amenityCount: collection.amenityIds.length
      });

      if (!validation.valid) {
        console.error('Invalid collection data:', validation.errors);
        return false;
      }

      const key = this.getCollectionKey(collection.vibe, collection.slug);
      const data = this.config.enableCompression ? this.compress(collection) : collection;
      
      // Store in localStorage
      const collections = this.getCollections();
      collections[key] = {
        data,
        timestamp: Date.now()
      };
      
      localStorage.setItem(STORAGE_KEYS.COLLECTIONS, JSON.stringify(collections));
      
      // Update cache metadata
      this.updateCacheMetadata(key, {
        vibe: collection.vibe,
        collection: collection.slug,
        size: JSON.stringify(data).length
      });

      // Store in memory cache for fast access
      this.memoryCache.set(key, collection);

      return true;
    } catch (error) {
      console.error('Failed to store collection:', error);
      return false;
    }
  }

  /**
   * Retrieve collection by vibe and slug
   */
  async getCollection(vibe: string, slug: string): Promise<CollectionData | null> {
    try {
      const key = this.getCollectionKey(vibe, slug);

      // Check memory cache first
      if (this.memoryCache.has(key)) {
        this.incrementCacheHit(key);
        return this.memoryCache.get(key);
      }

      // Check localStorage
      const collections = this.getCollections();
      const stored = collections[key];

      if (!stored) {
        return null;
      }

      // Check if cache is expired
      if (this.isCacheExpired(stored.timestamp)) {
        delete collections[key];
        localStorage.setItem(STORAGE_KEYS.COLLECTIONS, JSON.stringify(collections));
        return null;
      }

      const collection = this.config.enableCompression 
        ? this.decompress(stored.data) 
        : stored.data;

      // Update memory cache
      this.memoryCache.set(key, collection);
      this.incrementCacheHit(key);

      return collection;
    } catch (error) {
      console.error('Failed to get collection:', error);
      return null;
    }
  }

  /**
   * Store amenities with terminal context
   */
  async storeAmenities(amenities: AmenityData[], terminal?: string): Promise<boolean> {
    try {
      const key = terminal ? `amenities_${terminal}` : 'amenities_all';
      const data = this.config.enableCompression ? this.compress(amenities) : amenities;

      const amenityStore = this.getAmenityStore();
      amenityStore[key] = {
        data,
        timestamp: Date.now(),
        count: amenities.length
      };

      localStorage.setItem(STORAGE_KEYS.AMENITIES, JSON.stringify(amenityStore));

      // Update cache metadata
      this.updateCacheMetadata(key, {
        terminal,
        size: JSON.stringify(data).length
      });

      // Store in memory cache for fast access
      this.memoryCache.set(key, amenities);

      return true;
    } catch (error) {
      console.error('Failed to store amenities:', error);
      return false;
    }
  }

  /**
   * Get amenities filtered by vibe and terminal
   */
  async getAmenities(options: {
    vibe?: string;
    collection?: string;
    terminal?: string;
    useCache?: boolean;
  } = {}): Promise<AmenityData[]> {
    const { vibe, collection, terminal, useCache = true } = options;

    try {
      // Construct cache key
      const cacheKey = this.getAmenityCacheKey(options);

      // Check memory cache if enabled
      if (useCache && this.memoryCache.has(cacheKey)) {
        this.incrementCacheHit(cacheKey);
        return this.memoryCache.get(cacheKey);
      }

      // Get all amenities for the terminal (or all if no terminal specified)
      const amenityKey = terminal ? `amenities_${terminal}` : 'amenities_all';
      const amenityStore = this.getAmenityStore();
      const stored = amenityStore[amenityKey];

      if (!stored || this.isCacheExpired(stored.timestamp)) {
        return [];
      }

      let amenities: AmenityData[] = this.config.enableCompression 
        ? this.decompress(stored.data) 
        : stored.data;

      // Filter by collection if specified
      if (vibe && collection) {
        const collectionData = await this.getCollection(vibe, collection);
        if (collectionData) {
          amenities = amenities.filter(a => collectionData.amenityIds.includes(a.id));
        }
      }

      // Filter by vibe tags if only vibe is specified
      if (vibe && !collection) {
        amenities = amenities.filter(a => {
          const vibeTags = a.vibe_tags?.toLowerCase() || '';
          return vibeTags.includes(vibe.toLowerCase());
        });
      }

      // Cache the filtered results
      if (useCache) {
        this.memoryCache.set(cacheKey, amenities);
      }

      return amenities;
    } catch (error) {
      console.error('Failed to get amenities:', error);
      return [];
    }
  }

  /**
   * Batch store collections
   */
  async batchStoreCollections(collections: CollectionData[]): Promise<number> {
    let successCount = 0;
    
    for (const collection of collections) {
      if (await this.storeCollection(collection)) {
        successCount++;
      }
    }

    return successCount;
  }

  /**
   * Get collections by vibe
   */
  async getCollectionsByVibe(vibe: string): Promise<CollectionData[]> {
    try {
      const collections = this.getCollections();
      const vibeCollections: CollectionData[] = [];

      for (const [key, stored] of Object.entries(collections)) {
        if (key.startsWith(`collection_${vibe}_`)) {
          if (!this.isCacheExpired(stored.timestamp)) {
            const collection = this.config.enableCompression 
              ? this.decompress(stored.data) 
              : stored.data;
            vibeCollections.push(collection);
          }
        }
      }

      // Sort by order property
      return vibeCollections.sort((a, b) => a.order - b.order);
    } catch (error) {
      console.error('Failed to get collections by vibe:', error);
      return [];
    }
  }

  /**
   * Clear cache for specific vibe or terminal
   */
  async clearCache(options: {
    vibe?: string;
    terminal?: string;
    all?: boolean;
  } = {}): Promise<void> {
    const { vibe, terminal, all } = options;

    try {
      if (all) {
        // Clear everything
        localStorage.removeItem(STORAGE_KEYS.COLLECTIONS);
        localStorage.removeItem(STORAGE_KEYS.AMENITIES);
        localStorage.removeItem(STORAGE_KEYS.CACHE_METADATA);
        this.memoryCache.clear();
        this.cacheMetadata.clear();
        return;
      }

      // Clear specific items
      if (vibe) {
        const collections = this.getCollections();
        Object.keys(collections).forEach(key => {
          if (key.includes(`_${vibe}_`)) {
            delete collections[key];
            this.memoryCache.delete(key);
            this.cacheMetadata.delete(key);
          }
        });
        localStorage.setItem(STORAGE_KEYS.COLLECTIONS, JSON.stringify(collections));
      }

      if (terminal) {
        const amenityStore = this.getAmenityStore();
        const key = `amenities_${terminal}`;
        delete amenityStore[key];
        localStorage.setItem(STORAGE_KEYS.AMENITIES, JSON.stringify(amenityStore));
        this.memoryCache.delete(key);
        this.cacheMetadata.delete(key);
      }

      this.saveCacheMetadata();
    } catch (error) {
      console.error('Failed to clear cache:', error);
    }
  }

  /**
   * Get storage statistics
   */
  getStats(): StorageStats {
    const stats: StorageStats = {
      totalSize: 0,
      itemCount: 0,
      cacheHitRate: 0,
      oldestItem: null,
      newestItem: null,
      vibeDistribution: {},
      terminalDistribution: {}
    };

    try {
      // Calculate total size
      for (const key of Object.values(STORAGE_KEYS)) {
        const item = localStorage.getItem(key);
        if (item) {
          stats.totalSize += item.length;
        }
      }

      // Analyze cache metadata
      let totalHits = 0;
      let oldestTimestamp = Infinity;
      let newestTimestamp = 0;

      this.cacheMetadata.forEach((metadata) => {
        stats.itemCount++;
        totalHits += metadata.hits;

        if (metadata.timestamp < oldestTimestamp) {
          oldestTimestamp = metadata.timestamp;
        }
        if (metadata.timestamp > newestTimestamp) {
          newestTimestamp = metadata.timestamp;
        }

        // Distribution analysis
        if (metadata.vibe) {
          stats.vibeDistribution[metadata.vibe] = 
            (stats.vibeDistribution[metadata.vibe] || 0) + 1;
        }
        if (metadata.terminal) {
          stats.terminalDistribution[metadata.terminal] = 
            (stats.terminalDistribution[metadata.terminal] || 0) + 1;
        }
      });

      stats.cacheHitRate = stats.itemCount > 0 ? totalHits / stats.itemCount : 0;
      stats.oldestItem = oldestTimestamp < Infinity ? new Date(oldestTimestamp) : null;
      stats.newestItem = newestTimestamp > 0 ? new Date(newestTimestamp) : null;
    } catch (error) {
      console.error('Failed to calculate stats:', error);
    }

    return stats;
  }

  /**
   * Clean expired cache entries
   */
  private cleanExpiredCache(): void {
    try {
      const now = Date.now();
      let hasChanges = false;

      // Clean collections
      const collections = this.getCollections();
      Object.keys(collections).forEach(key => {
        if (this.isCacheExpired(collections[key].timestamp)) {
          delete collections[key];
          this.memoryCache.delete(key);
          this.cacheMetadata.delete(key);
          hasChanges = true;
        }
      });

      if (hasChanges) {
        localStorage.setItem(STORAGE_KEYS.COLLECTIONS, JSON.stringify(collections));
      }

      // Clean amenities
      const amenityStore = this.getAmenityStore();
      hasChanges = false;
      Object.keys(amenityStore).forEach(key => {
        if (this.isCacheExpired(amenityStore[key].timestamp)) {
          delete amenityStore[key];
          this.memoryCache.delete(key);
          this.cacheMetadata.delete(key);
          hasChanges = true;
        }
      });

      if (hasChanges) {
        localStorage.setItem(STORAGE_KEYS.AMENITIES, JSON.stringify(amenityStore));
      }

      this.saveCacheMetadata();
    } catch (error) {
      console.error('Failed to clean expired cache:', error);
    }
  }

  /**
   * Check if cache is expired
   */
  private isCacheExpired(timestamp: number): boolean {
    return Date.now() - timestamp > this.config.maxCacheAge;
  }

  /**
   * Update cache metadata
   */
  private updateCacheMetadata(key: string, data: Partial<CacheMetadata>): void {
    const existing = this.cacheMetadata.get(key) || {
      key,
      timestamp: Date.now(),
      hits: 0,
      size: 0
    };

    this.cacheMetadata.set(key, {
      ...existing,
      ...data,
      timestamp: Date.now()
    });

    this.saveCacheMetadata();
  }

  /**
   * Increment cache hit counter
   */
  private incrementCacheHit(key: string): void {
    const metadata = this.cacheMetadata.get(key);
    if (metadata) {
      metadata.hits++;
      this.cacheMetadata.set(key, metadata);
    }
  }

  /**
   * Save cache metadata to localStorage
   */
  private saveCacheMetadata(): void {
    try {
      const metadata: Record<string, CacheMetadata> = {};
      this.cacheMetadata.forEach((value, key) => {
        metadata[key] = value;
      });
      localStorage.setItem(STORAGE_KEYS.CACHE_METADATA, JSON.stringify(metadata));
    } catch (error) {
      console.error('Failed to save cache metadata:', error);
    }
  }

  /**
   * Get collection key
   */
  private getCollectionKey(vibe: string, slug: string): string {
    return `collection_${vibe}_${slug}`;
  }

  /**
   * Get amenity cache key
   */
  private getAmenityCacheKey(options: any): string {
    const parts = ['amenities'];
    if (options.vibe) parts.push(options.vibe);
    if (options.collection) parts.push(options.collection);
    if (options.terminal) parts.push(options.terminal);
    return parts.join('_');
  }

  /**
   * Get collections from localStorage
   */
  private getCollections(): Record<string, any> {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.COLLECTIONS);
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  }

  /**
   * Get amenity store from localStorage
   */
  private getAmenityStore(): Record<string, any> {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.AMENITIES);
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  }

  /**
   * Simple compression (placeholder - would use pako or similar in production)
   */
  private compress(data: any): any {
    // In production, use a library like pako for actual compression
    return data;
  }

  /**
   * Simple decompression (placeholder)
   */
  private decompress(data: any): any {
    // In production, use a library like pako for actual compression
    return data;
  }

  /**
   * Queue operation for offline support
   */
  async queueOfflineOperation(operation: any): Promise<void> {
    if (this.config.enableOfflineSupport) {
      this.offlineQueue.push({
        ...operation,
        timestamp: Date.now()
      });
      localStorage.setItem(STORAGE_KEYS.OFFLINE_QUEUE, JSON.stringify(this.offlineQueue));
    }
  }

  /**
   * Process offline queue when connection restored
   */
  async processOfflineQueue(): Promise<void> {
    if (!this.config.enableOfflineSupport || this.offlineQueue.length === 0) {
      return;
    }

    // Process each queued operation
    const processed: any[] = [];
    for (const operation of this.offlineQueue) {
      try {
        // Process operation based on type
        // This would integrate with your API layer
        processed.push(operation);
      } catch (error) {
        console.error('Failed to process offline operation:', error);
      }
    }

    // Remove processed operations
    this.offlineQueue = this.offlineQueue.filter(op => !processed.includes(op));
    localStorage.setItem(STORAGE_KEYS.OFFLINE_QUEUE, JSON.stringify(this.offlineQueue));
  }
}

// Singleton instance
let storageManagerInstance: VibeStorageManager | null = null;

export const getStorageManager = (config?: Partial<StorageConfig>): VibeStorageManager => {
  if (!storageManagerInstance) {
    storageManagerInstance = new VibeStorageManager(config);
  }
  return storageManagerInstance;
};

// Export types
export type { StorageConfig, CollectionData, AmenityData, StorageStats, CacheMetadata };
