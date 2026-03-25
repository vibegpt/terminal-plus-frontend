// hooks/useAmenities.ts

import { useEffect, useState } from "react";

// Terminal file mapping for dynamic imports
const terminalFileMap: Record<string, () => Promise<any>> = {
  "SYD-T1": () => import("@/data/syd_t1.json"),
  "SYD-T2": () => import("@/data/syd_t2.json"),
  "SIN-T1": () => import("@/data/sin_t1.json"),
  "SIN-T2": () => import("@/data/sin_t2.json"),
  "SIN-T3": () => import("@/data/sin_t3.json"),
  "SIN-T4": () => import("@/data/sin_t4.json"),
  "SIN-JEWEL": () => import("@/data/sin_jewel.json"),
  "LHR-T2": () => import("@/data/lhr_t2.json"),
  // fallback
  "DEFAULT": () => import("@/data/amenities_fallback.json"),
};

export async function loadAmenitiesByTerminal(terminalCode: string) {
  try {
    console.log(`🔍 loadAmenitiesByTerminal: Loading amenities for terminal ${terminalCode}`);
    
    const loader = terminalFileMap[terminalCode] || terminalFileMap["DEFAULT"];
    const module = await loader();
    
    // Handle the default export from dynamic imports
    const data = module.default || module;
    
    console.log(`🔍 loadAmenitiesByTerminal: Module structure for ${terminalCode}:`, {
      hasDefault: !!module.default,
      hasData: !!data,
      dataKeys: data ? Object.keys(data).slice(0, 5) : [],
    });
    
    // Handle different JSON structures
    const amenities = data.amenities || data.data || (Array.isArray(data) ? data : []);
    
    return amenities.map(normalizeAmenity);
  } catch (error) {
    console.error(`❌ loadAmenitiesByTerminal: Failed to load ${terminalCode}:`, error);
    return [];
  }
}

export function useAmenities(terminalCode: string) {
  const [amenities, setAmenities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAmenities() {
      try {
        setLoading(true);
        setError(null);
        const data = await loadAmenitiesByTerminal(terminalCode);
        setAmenities(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load amenities');
        setAmenities([]);
      } finally {
        setLoading(false);
      }
    }

    fetchAmenities();
  }, [terminalCode]);

  return { amenities, loading, error };
}

// Hook to get amenities for a specific collection
export function useCollectionAmenities(terminalCode: string, collectionSlug: string) {
  const [amenities, setAmenities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    async function fetchCollectionAmenities() {
      try {
        setLoading(true);
        setError(null);
        
        // Try Supabase first (if available)
        if (typeof window !== 'undefined' && (window as any).supabase) {
          try {
            const supabase = (window as any).supabase;
            const [airport, terminal] = terminalCode.split('-');
            
            console.log(`🔍 useCollectionAmenities: Fetching from Supabase for ${airport}-${terminal}`);
            
            // Call the RPC function as shown in your example
            const { data, error: rpcError } = await supabase.rpc('get_collections_for_terminal', {
              p_airport_code: airport,
              p_terminal: terminal
            });
            
            if (rpcError) {
              console.warn('⚠️ Supabase RPC failed, falling back to local data:', rpcError);
              throw rpcError;
            }
            
            if (data && data.length > 0) {
              console.log(`✅ Supabase RPC success: ${data.length} collections found`);
              
              // Find the specific collection
              const targetCollection = data.find((col: any) => 
                col.collection_slug === collectionSlug
              );
              
              if (targetCollection) {
                // If we have collection data, try to get its amenities
                const { data: amenityData, error: amenityError } = await supabase
                  .from('amenity_detail')
                  .select('*')
                  .eq('terminal_code', terminalCode)
                  .contains('vibe_tags', [collectionSlug]);
                
                if (!amenityError && amenityData) {
                  const normalizedAmenities = amenityData.map(normalizeAmenity);
                  setAmenities(normalizedAmenities);
                  setTotalCount(normalizedAmenities.length);
                  setLoading(false);
                  return;
                }
              }
            }
          } catch (supabaseError) {
            console.log('🔄 Supabase failed, using local data fallback');
          }
        }
        
        // Fallback to local JSON data
        console.log(`🔄 useCollectionAmenities: Using local data fallback for ${terminalCode}`);
        const localAmenities = await loadAmenitiesByTerminal(terminalCode);
        
                        // Apply collection filtering using exact amenity lists
        const { getCollectionAmenities, validateCollectionAmenities } = await import('../utils/collectionDefinitions');
        
        const expectedAmenityIds = getCollectionAmenities(collectionSlug);
        
        if (expectedAmenityIds.length > 0) {
          // Use exact amenity list filtering
          const filteredAmenities = localAmenities.filter((amenity: any) => {
            const amenityId = amenity.id || amenity.amenity_slug || amenity.slug;
            return expectedAmenityIds.includes(amenityId);
          });
          
          // Validate the collection
          const validation = validateCollectionAmenities(collectionSlug, filteredAmenities.map((a: any) => a.id || a.amenity_slug || a.slug));
          
          console.log(`🔍 Collection validation for ${collectionSlug}:`, {
            expected: validation.expectedCount,
            found: validation.foundCount,
            isValid: validation.isValid,
            missing: validation.missingAmenities,
            extra: validation.extraAmenities
          });
          
          // Enhance amenities with multi-context information
          const enhancedAmenities = filteredAmenities.map((amenity: any) => {
            // Try to find multi-context information for this amenity
            try {
              const { getAmenityContext } = require('../utils/amenityContexts');
              const context = getAmenityContext(amenity.id, collectionSlug);
              
              if (context) {
                return {
                  ...amenity,
                  // Add context-aware properties
                  contextInfo: context,
                  displayName: context.name || amenity.name,
                  displayDescription: context.description || amenity.description,
                  contextBadge: context.context,
                  emphasisTags: context.emphasis || [],
                  callToAction: context.callToAction || 'Learn more'
                };
              }
            } catch (contextError) {
              // Context system not available, use base amenity
            }
            
            return amenity;
          });
          
          setAmenities(enhancedAmenities);
          setTotalCount(enhancedAmenities.length);
        } else {
          // Fallback to generic filtering for unknown collections
          console.warn(`⚠️ No exact amenity list found for ${collectionSlug}, using generic filtering`);
          
          const genericFilters: Record<string, (a: any) => boolean> = {
            'hawker-heaven': (a: any) => 
              a.category === 'Food & Beverage' && (
                a.name?.toLowerCase().includes('hawker') ||
                a.name?.toLowerCase().includes('food court') ||
                a.name?.toLowerCase().includes('local')
              ),
            'coffee-chill': (a: any) => 
              a.name?.toLowerCase().includes('coffee') ||
              a.name?.toLowerCase().includes('cafe') ||
              a.name?.toLowerCase().includes('tea'),
            'local-eats': (a: any) => 
              a.category === 'Food & Beverage' && (
                a.name?.toLowerCase().includes('local') ||
                a.name?.toLowerCase().includes('traditional') ||
                a.name?.toLowerCase().includes('singapore')
              ),
            'jewel-gardens': (a: any) => 
              a.terminal_code === 'SIN-JEWEL' ||
              a.location?.includes('Jewel') ||
              a.category === 'Attraction'
          };
          
          const filterFn = genericFilters[collectionSlug];
          const filteredAmenities = filterFn ? localAmenities.filter(filterFn) : localAmenities;
          
          // Enhance amenities with multi-context information
          const enhancedAmenities = filteredAmenities.map((amenity: any) => {
            // Try to find multi-context information for this amenity
            try {
              const { getAmenityContext } = require('../utils/amenityContexts');
              const context = getAmenityContext(amenity.id, collectionSlug);
              
              if (context) {
                return {
                  ...amenity,
                  // Add context-aware properties
                  contextInfo: context,
                  displayName: context.name || amenity.name,
                  displayDescription: context.description || amenity.description,
                  contextBadge: context.context,
                  emphasisTags: context.emphasis || [],
                  callToAction: context.callToAction || 'Learn more'
                };
              }
            } catch (contextError) {
              // Context system not available, use base amenity
            }
            
            return amenity;
          });
          
          setAmenities(enhancedAmenities);
          setTotalCount(enhancedAmenities.length);
        }
        
      } catch (err) {
        console.error('❌ useCollectionAmenities: Failed to load collection amenities:', err);
        setError(err instanceof Error ? err.message : 'Failed to load collection amenities');
        setAmenities([]);
        setTotalCount(0);
      } finally {
        setLoading(false);
      }
    }

    fetchCollectionAmenities();
  }, [terminalCode, collectionSlug]);

  return { 
    amenities, 
    loading, 
    error,
    totalCount 
  };
}

// Hook for direct Supabase RPC calls (as shown in your example)
export function useSupabaseCollections(airportCode: string, terminal: string) {
  const [collections, setCollections] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCollections() {
      try {
        setLoading(true);
        setError(null);
        
        if (typeof window !== 'undefined' && (window as any).supabase) {
          const supabase = (window as any).supabase;
          
          console.log(`🔍 useSupabaseCollections: Fetching collections for ${airportCode}-${terminal}`);
          
          const { data, error: rpcError } = await supabase.rpc('get_collections_for_terminal', {
            p_airport_code: airportCode,
            p_terminal: terminal
          });
          
          if (rpcError) {
            console.error('❌ Supabase RPC error:', rpcError);
            setError(rpcError.message);
            setCollections([]);
          } else {
            console.log(`✅ Supabase RPC success: ${data?.length || 0} collections found`);
            setCollections(data || []);
          }
        } else {
          setError('Supabase client not available');
          setCollections([]);
        }
      } catch (err) {
        console.error('❌ useSupabaseCollections: Failed to fetch collections:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch collections');
        setCollections([]);
      } finally {
        setLoading(false);
      }
    }

    fetchCollections();
  }, [airportCode, terminal]);

  return { collections, loading, error };
}

// Hook to get amenities grouped by vibe
export function useVibeAmenities(terminalCode: string) {
  const { amenities, loading, error } = useAmenities(terminalCode);
  
  const vibeGroups = {
    'Chill': amenities.filter(a => 
      a.vibe_tags?.includes('chill') || 
      a.vibe_tags?.includes('relax') ||
      a.category === 'Lounge'
    ),
    'Discover': amenities.filter(a =>
      a.vibe_tags?.includes('explore') ||
      a.vibe_tags?.includes('discover') ||
      a.category === 'Attraction'
    ),
    'Refuel': amenities.filter(a => 
      a.vibe_tags?.includes('refuel') || 
      a.vibe_tags?.includes('eat') ||
      a.category === 'Food & Beverage'
    ),
    'Connect': amenities.filter(a => 
      a.vibe_tags?.includes('connect') || 
      a.vibe_tags?.includes('wifi') ||
      a.category === 'Services'
    ),
    'Treat': amenities.filter(a => 
      a.vibe_tags?.includes('treat') || 
      a.vibe_tags?.includes('luxury') ||
      a.price_level?.includes('$$$')
    ),
    'Play': amenities.filter(a => 
      a.vibe_tags?.includes('play') || 
      a.vibe_tags?.includes('fun') ||
      a.category === 'Entertainment'
    ),
    'Quick': amenities.filter(a => 
      a.vibe_tags?.includes('quick') || 
      a.vibe_tags?.includes('fast') ||
      a.name?.toLowerCase().includes('express')
    ),
  };

  return { vibeGroups, loading, error };
}

// Utility function to normalize amenity data structure
function normalizeAmenity(amenity: any) {
  return {
    id: amenity.id || amenity.amenity_id,
    name: amenity.name,
    slug: amenity.slug || amenity.amenity_slug,
    description: amenity.description,
    category: amenity.category,
    terminal_code: amenity.terminal_code || amenity.terminal,
    airport_code: amenity.airport_code || amenity.airport || 'SIN',
    vibe_tags: amenity.vibe_tags || amenity.vibes?.join(',') || '',
    price_level: amenity.price_level || amenity.price || '$$',
    opening_hours: amenity.opening_hours || amenity.hours,
    location: amenity.location,
    gate_proximity: amenity.gate_proximity || amenity.gates_nearby,
    walking_time: amenity.walking_time || amenity.walk_time || 5,
    available_in_tr: amenity.available_in_tr !== false,
    website_url: amenity.website_url || amenity.website,
    logo_url: amenity.logo_url || amenity.logo,
    image_url: amenity.image_url || amenity.image,
    rating: amenity.rating,
    crowd_level: amenity.crowd_level,
  };
} 