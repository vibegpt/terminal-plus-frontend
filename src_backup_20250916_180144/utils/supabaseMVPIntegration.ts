// supabaseMVPIntegration.ts
// Supabase integration for Terminal+ MVP with Singapore terminals only

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { VibePatternVerifier } from './vibePatternVerifier';
import { getStorageManager } from './vibeStorageManager';

// Supabase types based on your amenities table
interface SupabaseAmenity {
  id: number;
  created_at: string;
  amenity_slug: string;
  description: string;
  website_url: string | null;
  logo_url: string | null;
  vibe_tags: string;
  booking_required: boolean;
  available_in_tr: boolean;
  price_level: string;
  opening_hours: string;
  terminal_code: string;
  airport_code: string;
  name: string;
}

interface SupabaseCollection {
  id: string;
  slug: string;
  vibe: string;
  name: string;
  description: string;
  image_url?: string;
  amenity_ids: number[];
  terminals: string[];
  featured: boolean;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// MVP Configuration - Singapore Only
const MVP_CONFIG = {
  AIRPORT_CODE: 'SIN',
  TERMINALS: ['SIN-T1', 'SIN-T2', 'SIN-T3', 'SIN-T4', 'SIN-JEWEL'],
  TERMINAL_NAMES: {
    'SIN-T1': 'Terminal 1',
    'SIN-T2': 'Terminal 2', 
    'SIN-T3': 'Terminal 3',
    'SIN-T4': 'Terminal 4',
    'SIN-JEWEL': 'Jewel Changi'
  },
  DEFAULT_TERMINAL: 'SIN-T3', // Default for testing
  CACHE_DURATION: 3600000, // 1 hour
  BATCH_SIZE: 100 // For pagination
};

// Vibe to Collection mapping for MVP - Expanded Singapore Collections (19 total)
const MVP_COLLECTIONS: SupabaseCollection[] = [
  // DISCOVER VIBE
  {
    id: 'coll_1',
    slug: 'jewel-discovery',
    vibe: 'discover',
    name: 'Jewel Discovery',
    description: 'Explore the wonders of Jewel Changi Airport',
    image_url: '/images/jewel-discovery.jpg',
    amenity_ids: [], // Will be populated from amenities
    terminals: ['SIN-JEWEL', 'SIN-T1', 'SIN-T2', 'SIN-T3'],
    featured: true,
    display_order: 1,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'coll_2',
    slug: 'hidden-gems',
    vibe: 'discover',
    name: 'Hidden Gems',
    description: 'Discover secret spots and local favorites',
    amenity_ids: [],
    terminals: ['SIN-T1', 'SIN-T2', 'SIN-T3', 'SIN-T4'],
    featured: false,
    display_order: 2,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'coll_3',
    slug: 'garden-paradise',
    vibe: 'discover',
    name: 'Garden Paradise',
    description: 'Lush greenery and nature experiences',
    image_url: '/images/garden-paradise.jpg',
    amenity_ids: [],
    terminals: ['SIN-JEWEL', 'SIN-T1', 'SIN-T2'],
    featured: true,
    display_order: 3,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'coll_4',
    slug: 'entertainment-hub',
    vibe: 'discover',
    name: 'Entertainment Hub',
    description: 'Fun activities and entertainment options',
    image_url: '/images/entertainment-hub.jpg',
    amenity_ids: [],
    terminals: ['SIN-JEWEL', 'SIN-T1', 'SIN-T2', 'SIN-T3'],
    featured: false,
    display_order: 4,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'coll_5',
    slug: 'jewel-experience',
    vibe: 'discover',
    name: 'Jewel Experience',
    description: 'Immersive Jewel Changi experiences',
    image_url: '/images/jewel-experience.jpg',
    amenity_ids: [],
    terminals: ['SIN-JEWEL'],
    featured: true,
    display_order: 5,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  
  // QUICK VIBE
  {
    id: 'coll_6',
    slug: 'grab-and-go',
    vibe: 'quick',
    name: 'Grab & Go',
    description: 'Quick bites for travelers on the move',
    amenity_ids: [],
    terminals: MVP_CONFIG.TERMINALS,
    featured: true,
    display_order: 1,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'coll_7',
    slug: 'quick-bites',
    vibe: 'quick',
    name: 'Quick Bites',
    description: 'Fast food and snacks when time is tight',
    amenity_ids: [],
    terminals: MVP_CONFIG.TERMINALS,
    featured: false,
    display_order: 2,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },

  // WORK VIBE
  {
    id: 'coll_8',
    slug: 'productivity-spaces',
    vibe: 'work',
    name: 'Productivity Spaces',
    description: 'Quiet zones with WiFi and power outlets for remote work',
    amenity_ids: [],
    terminals: ['SIN-T1', 'SIN-T2', 'SIN-T3', 'SIN-T4'],
    featured: true,
    display_order: 1,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'coll_9',
    slug: 'meeting-rooms',
    vibe: 'work',
    name: 'Meeting Rooms',
    description: 'Professional spaces for business meetings and calls',
    amenity_ids: [],
    terminals: ['SIN-T1', 'SIN-T2', 'SIN-T3', 'SIN-JEWEL'],
    featured: false,
    display_order: 2,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },

  // SHOP VIBE
  {
    id: 'coll_10',
    slug: 'retail-therapy',
    vibe: 'shop',
    name: 'Retail Therapy',
    description: 'Premium shopping from luxury brands to local crafts',
    amenity_ids: [],
    terminals: MVP_CONFIG.TERMINALS,
    featured: true,
    display_order: 1,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'coll_11',
    slug: 'duty-free-finds',
    vibe: 'shop',
    name: 'Duty-Free Finds',
    description: 'Tax-free shopping on perfumes, alcohol, chocolates and more',
    amenity_ids: [],
    terminals: ['SIN-T1', 'SIN-T2', 'SIN-T3', 'SIN-T4'],
    featured: false,
    display_order: 2,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'coll_12',
    slug: 'singapore-shopping-trail',
    vibe: 'shop',
    name: 'Singapore Shopping Trail',
    description: 'Local shopping experiences and markets',
    image_url: '/images/singapore-shopping-trail.jpg',
    amenity_ids: [],
    terminals: ['SIN-T1', 'SIN-T2', 'SIN-T3', 'SIN-T4'],
    featured: false,
    display_order: 3,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'coll_13',
    slug: 'support-local-champions',
    vibe: 'shop',
    name: 'Support Local Champions',
    description: 'Local businesses and entrepreneurs',
    image_url: '/images/support-local-champions.jpg',
    amenity_ids: [],
    terminals: ['SIN-T1', 'SIN-T2', 'SIN-T3', 'SIN-T4'],
    featured: false,
    display_order: 4,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'coll_14',
    slug: 'artisan-craft-masters',
    vibe: 'shop',
    name: 'Artisan Craft Masters',
    description: 'Handcrafted and artisanal products',
    image_url: '/images/artisan-craft-masters.jpg',
    amenity_ids: [],
    terminals: ['SIN-T1', 'SIN-T2', 'SIN-T3'],
    featured: false,
    display_order: 5,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },

  // REFUEL VIBE
  {
    id: 'coll_15',
    slug: 'morning-essentials',
    vibe: 'refuel',
    name: 'Morning Essentials',
    description: 'Start your day right with coffee and breakfast',
    amenity_ids: [],
    terminals: MVP_CONFIG.TERMINALS,
    featured: true,
    display_order: 1,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'coll_16',
    slug: 'energy-boost',
    vibe: 'refuel',
    name: 'Energy Boost',
    description: 'Healthy smoothies, snacks and meals to keep you going',
    amenity_ids: [],
    terminals: MVP_CONFIG.TERMINALS,
    featured: false,
    display_order: 2,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'coll_17',
    slug: 'hawker-heaven',
    vibe: 'refuel',
    name: 'Hawker Heaven',
    description: 'Authentic Singapore street food experience',
    image_url: '/images/hawker-heaven.jpg',
    amenity_ids: [],
    terminals: ['SIN-T1', 'SIN-T2', 'SIN-T3', 'SIN-T4'],
    featured: true,
    display_order: 3,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },

  // CHILL VIBE
  {
    id: 'coll_18',
    slug: 'lounge-life',
    vibe: 'chill',
    name: 'Lounge Life',
    description: 'Relax in comfort before your flight',
    amenity_ids: [],
    terminals: ['SIN-T1', 'SIN-T2', 'SIN-T3', 'SIN-T4'],
    featured: true,
    display_order: 1,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'coll_19',
    slug: 'quiet-zones',
    vibe: 'chill',
    name: 'Quiet Zones',
    description: 'Peaceful areas for rest, meditation, or a quick nap',
    amenity_ids: [],
    terminals: MVP_CONFIG.TERMINALS,
    featured: false,
    display_order: 2,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

export class SupabaseMVPService {
  private client: SupabaseClient;
  private storageManager = getStorageManager();

  constructor(
    supabaseUrl: string,
    supabaseAnonKey: string
  ) {
    this.client = createClient(supabaseUrl, supabaseAnonKey);
  }

  /**
   * Fetch amenities for Singapore terminals only (MVP)
   */
  async fetchMVPAmenities(options: {
    terminal?: string;
    vibe?: string;
    useCache?: boolean;
  } = {}): Promise<SupabaseAmenity[]> {
    const { terminal, vibe, useCache = true } = options;

    // Check cache first
    if (useCache) {
      const cached = await this.storageManager.getAmenities({
        terminal,
        vibe,
        useCache: true
      });
      
      if (cached && cached.length > 0) {
        console.log('✅ Using cached amenities');
        return cached as SupabaseAmenity[];
      }
    }

    try {
      // Build query for Singapore amenities only
      let query = this.client
        .from('amenities')
        .select('*')
        .eq('airport_code', MVP_CONFIG.AIRPORT_CODE)
        .in('terminal_code', MVP_CONFIG.TERMINALS);

      // Filter by specific terminal if provided
      if (terminal && MVP_CONFIG.TERMINALS.includes(terminal)) {
        query = query.eq('terminal_code', terminal);
      }

      // Filter by vibe tags if provided
      if (vibe) {
        query = query.ilike('vibe_tags', `%${vibe}%`);
      }

      // Execute query
      const { data, error } = await query
        .order('name')
        .limit(MVP_CONFIG.BATCH_SIZE);

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      // Validate and cache the data
      if (data && data.length > 0) {
        console.log(`📦 Fetched ${data.length} amenities from Supabase`);
        
        // Validate each amenity
        const validAmenities = data.filter(amenity => {
          const validation = VibePatternVerifier.validateAmenityData(amenity);
          if (!validation.valid) {
            console.warn(`Invalid amenity data: ${amenity.name}`, validation.errors);
          }
          return validation.valid;
        });

        // Cache the results
        if (useCache) {
          await this.storageManager.storeAmenities(
            validAmenities,
            terminal || 'all_sin'
          );
        }

        return validAmenities;
      }

      return [];
    } catch (error) {
      console.error('Failed to fetch amenities:', error);
      // Fall back to cached data if available
      const cached = await this.storageManager.getAmenities({ terminal, vibe });
      return cached as SupabaseAmenity[];
    }
  }

  /**
   * Fetch amenities for a specific collection
   */
  async fetchCollectionAmenities(
    vibe: string,
    collectionSlug: string,
    terminal?: string
  ): Promise<SupabaseAmenity[]> {
    // Find collection definition
    const collection = MVP_COLLECTIONS.find(
      c => c.vibe === vibe && c.slug === collectionSlug
    );

    if (!collection) {
      console.warn(`Collection not found: ${vibe}/${collectionSlug}`);
      return [];
    }

    // Check if terminal is valid for this collection
    if (terminal && !collection.terminals.includes(terminal)) {
      console.warn(`Terminal ${terminal} not available for collection ${collectionSlug}`);
      return [];
    }

    // Fetch amenities with vibe filter
    const amenities = await this.fetchMVPAmenities({
      terminal,
      vibe,
      useCache: true
    });

    // Additional filtering based on collection rules
    return this.filterAmenitiesForCollection(amenities, collection);
  }

  /**
   * Filter amenities based on collection rules
   */
  private filterAmenitiesForCollection(
    amenities: SupabaseAmenity[],
    collection: SupabaseCollection
  ): SupabaseAmenity[] {
    // Apply collection-specific filters
    switch (collection.slug) {
      case 'jewel-discovery':
        // Only Jewel amenities
        return amenities.filter(a => 
          a.terminal_code === 'SIN-JEWEL' &&
          a.vibe_tags?.includes('discover')
        );

      case 'grab-and-go':
        // Quick service, no booking required
        return amenities.filter(a => 
          !a.booking_required &&
          (a.vibe_tags?.includes('quick') || a.vibe_tags?.includes('grab'))
        );

      case 'morning-essentials':
        // Coffee shops and breakfast places
        return amenities.filter(a => 
          a.vibe_tags?.includes('refuel') ||
          a.vibe_tags?.includes('morning') ||
          a.vibe_tags?.includes('coffee') ||
          a.description?.toLowerCase().includes('breakfast') ||
          a.description?.toLowerCase().includes('coffee')
        );

      case 'lounge-life':
        // Lounges and quiet spaces
        return amenities.filter(a => 
          a.vibe_tags?.includes('chill') ||
          a.vibe_tags?.includes('lounge') ||
          a.name?.toLowerCase().includes('lounge')
        );

      case 'hidden-gems':
        // Less common amenities
        return amenities.filter(a => 
          a.vibe_tags?.includes('discover') ||
          a.vibe_tags?.includes('hidden') ||
          a.vibe_tags?.includes('local')
        );

      default:
        return amenities;
    }
  }

  /**
   * Get terminal statistics for MVP
   */
  async getTerminalStats(terminal?: string): Promise<any> {
    try {
      let query = this.client
        .from('amenities')
        .select('terminal_code, price_level, vibe_tags', { count: 'exact' })
        .eq('airport_code', MVP_CONFIG.AIRPORT_CODE);

      if (terminal) {
        query = query.eq('terminal_code', terminal);
      } else {
        query = query.in('terminal_code', MVP_CONFIG.TERMINALS);
      }

      const { data, count, error } = await query;

      if (error) throw error;

      // Process statistics
      const stats = {
        totalAmenities: count,
        byTerminal: {} as Record<string, number>,
        byPriceLevel: {} as Record<string, number>,
        byVibe: {} as Record<string, number>,
        terminals: MVP_CONFIG.TERMINALS.map(t => ({
          code: t,
          name: MVP_CONFIG.TERMINAL_NAMES[t],
          count: 0
        }))
      };

      if (data) {
        data.forEach((amenity: any) => {
          // Terminal distribution
          stats.byTerminal[amenity.terminal_code] = 
            (stats.byTerminal[amenity.terminal_code] || 0) + 1;

          // Price distribution
          if (amenity.price_level) {
            stats.byPriceLevel[amenity.price_level] = 
              (stats.byPriceLevel[amenity.price_level] || 0) + 1;
          }

          // Vibe distribution
          if (amenity.vibe_tags) {
            amenity.vibe_tags.split(',').forEach((vibe: string) => {
              const cleanVibe = vibe.trim();
              stats.byVibe[cleanVibe] = (stats.byVibe[cleanVibe] || 0) + 1;
            });
          }
        });

        // Update terminal counts
        stats.terminals.forEach(t => {
          t.count = stats.byTerminal[t.code] || 0;
        });
      }

      return stats;
    } catch (error) {
      console.error('Failed to get terminal stats:', error);
      return null;
    }
  }

  /**
   * Search amenities with full-text search
   */
  async searchAmenities(
    searchQuery: string,
    terminal?: string
  ): Promise<SupabaseAmenity[]> {
    try {
      let query = this.client
        .from('amenities')
        .select('*')
        .eq('airport_code', MVP_CONFIG.AIRPORT_CODE)
        .in('terminal_code', MVP_CONFIG.TERMINALS);

      // Add terminal filter if specified
      if (terminal && MVP_CONFIG.TERMINALS.includes(terminal)) {
        query = query.eq('terminal_code', terminal);
      }

      // Full-text search on name and description
      query = query.or(
        `name.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%,amenity_slug.ilike.%${searchQuery}%`
      );

      const { data, error } = await query
        .order('name')
        .limit(50);

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Search failed:', error);
      return [];
    }
  }

  /**
   * Get collections for MVP
   */
  async getCollections(vibe?: string): Promise<SupabaseCollection[]> {
    if (vibe) {
      return MVP_COLLECTIONS.filter(c => c.vibe === vibe && c.is_active);
    }
    return MVP_COLLECTIONS.filter(c => c.is_active);
  }

  /**
   * Get featured collections for homepage
   */
  async getFeaturedCollections(): Promise<SupabaseCollection[]> {
    return MVP_COLLECTIONS
      .filter(c => c.featured && c.is_active)
      .sort((a, b) => a.display_order - b.display_order);
  }

  /**
   * Sync local cache with Supabase
   */
  async syncCache(): Promise<void> {
    console.log('🔄 Syncing cache with Supabase...');
    
    // Clear old cache
    await this.storageManager.clearCache({ all: true });

    // Pre-fetch data for all SIN terminals
    for (const terminal of MVP_CONFIG.TERMINALS) {
      await this.fetchMVPAmenities({
        terminal,
        useCache: false // Force fresh fetch
      });
      console.log(`✅ Cached ${terminal}`);
    }

    // Cache collections
    for (const collection of MVP_COLLECTIONS) {
      await this.storageManager.storeCollection({
        slug: collection.slug,
        vibe: collection.vibe,
        name: collection.name,
        description: collection.description,
        imageUrl: collection.image_url,
        amenityIds: collection.amenity_ids,
        terminals: collection.terminals,
        featured: collection.featured,
        order: collection.display_order,
        metadata: {
          id: collection.id,
          is_active: collection.is_active
        }
      });
    }

    console.log('✅ Cache sync complete');
  }

  /**
   * Real-time subscription to amenity changes
   */
  subscribeToAmenityChanges(
    callback: (payload: any) => void,
    terminal?: string
  ): () => void {
    const channel = this.client
      .channel('amenity-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'amenities',
          filter: terminal 
            ? `terminal_code=eq.${terminal}` 
            : `airport_code=eq.${MVP_CONFIG.AIRPORT_CODE}`
        },
        async (payload) => {
          console.log('Amenity change detected:', payload);
          
          // Invalidate cache for affected terminal
          const terminalCode = payload.new?.terminal_code || payload.old?.terminal_code;
          if (terminalCode) {
            await this.storageManager.clearCache({ terminal: terminalCode });
          }
          
          callback(payload);
        }
      )
      .subscribe();

    // Return unsubscribe function
    return () => {
      this.client.removeChannel(channel);
    };
  }

  /**
   * Get amenity by ID
   */
  async getAmenityById(id: number): Promise<SupabaseAmenity | null> {
    try {
      const { data, error } = await this.client
        .from('amenities')
        .select('*')
        .eq('id', id)
        .eq('airport_code', MVP_CONFIG.AIRPORT_CODE)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Failed to get amenity:', error);
      return null;
    }
  }

  /**
   * Batch fetch amenities by IDs
   */
  async getAmenitiesByIds(ids: number[]): Promise<SupabaseAmenity[]> {
    try {
      const { data, error } = await this.client
        .from('amenities')
        .select('*')
        .in('id', ids)
        .eq('airport_code', MVP_CONFIG.AIRPORT_CODE);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Failed to batch fetch amenities:', error);
      return [];
    }
  }
}

// React Hook for Supabase integration
import { useEffect, useState } from 'react';

interface UseSupabaseAmenitiesOptions {
  terminal?: string;
  vibe?: string;
  collection?: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export function useSupabaseAmenities(
  supabaseUrl: string,
  supabaseAnonKey: string,
  options: UseSupabaseAmenitiesOptions = {}
) {
  const [amenities, setAmenities] = useState<SupabaseAmenity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastFetched, setLastFetched] = useState<Date | null>(null);

  const service = new SupabaseMVPService(supabaseUrl, supabaseAnonKey);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      try {
        let data: SupabaseAmenity[];
        
        if (options.collection && options.vibe) {
          data = await service.fetchCollectionAmenities(
            options.vibe,
            options.collection,
            options.terminal
          );
        } else {
          data = await service.fetchMVPAmenities({
            terminal: options.terminal,
            vibe: options.vibe
          });
        }

        setAmenities(data);
        setLastFetched(new Date());
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch amenities');
        console.error('Hook error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // Set up auto-refresh if enabled
    if (options.autoRefresh) {
      const interval = setInterval(
        fetchData,
        options.refreshInterval || 60000 // Default 1 minute
      );
      return () => clearInterval(interval);
    }
  }, [options.terminal, options.vibe, options.collection]);

  // Subscribe to real-time updates
  useEffect(() => {
    const unsubscribe = service.subscribeToAmenityChanges(
      (payload) => {
        // Re-fetch on changes
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          const newAmenity = payload.new as SupabaseAmenity;
          
          // Check if this amenity matches our filters
          if (options.terminal && newAmenity.terminal_code !== options.terminal) {
            return;
          }
          
          if (options.vibe && !newAmenity.vibe_tags?.includes(options.vibe)) {
            return;
          }

          // Update local state optimistically
          setAmenities(prev => {
            const index = prev.findIndex(a => a.id === newAmenity.id);
            if (index >= 0) {
              // Update existing
              const updated = [...prev];
              updated[index] = newAmenity;
              return updated;
            } else {
              // Add new
              return [...prev, newAmenity];
            }
          });
        } else if (payload.eventType === 'DELETE') {
          const deletedId = payload.old?.id;
          if (deletedId) {
            setAmenities(prev => prev.filter(a => a.id !== deletedId));
          }
        }
      },
      options.terminal
    );

    return unsubscribe;
  }, [options.terminal, options.vibe]);

  return {
    amenities,
    loading,
    error,
    lastFetched,
    refresh: async () => {
      setLoading(true);
      const data = await service.fetchMVPAmenities({
        terminal: options.terminal,
        vibe: options.vibe,
        useCache: false
      });
      setAmenities(data);
      setLastFetched(new Date());
      setLoading(false);
    }
  };
}

// Export configuration and types
export { MVP_CONFIG, MVP_COLLECTIONS };
export type { SupabaseAmenity, SupabaseCollection };
