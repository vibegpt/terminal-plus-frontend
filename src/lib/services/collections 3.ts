// ============================================
// SUPABASE COLLECTIONS SERVICE
// ============================================
// Add this to your services folder (e.g., /lib/services/collections.ts)

import { supabase } from '@/lib/supabase';

export interface Collection {
  id: string;
  collection_id: string;
  name: string;
  description: string;
  icon: string;
  gradient: string;
  universal: boolean;
  airports: string[];
  featured: boolean;
  amenity_count?: number;
  sample_amenities?: string[];
}

export interface CollectionAmenity {
  amenity_id: number;
  name: string;
  amenity_slug: string;
  description: string;
  terminal_code: string;
  airport_code: string;
  vibe_tags: string;
  price_level: string;
  opening_hours: any;
  priority: number;
  is_featured: boolean;
}

// ============================================
// FETCHING FUNCTIONS
// ============================================

/**
 * Get all collections for a specific airport
 */
export async function getCollectionsByAirport(airport: string) {
  const { data, error } = await supabase
    .from('collections')
    .select(`
      *,
      collection_amenities!inner(
        amenity_detail_id,
        amenity_detail!inner(
          airport_code
        )
      )
    `)
    .or(`universal.eq.true,airports.cs.{${airport}}`)
    .order('universal', { ascending: false });

  if (error) {
    console.error('Error fetching collections:', error);
    return [];
  }

  return data;
}

/**
 * Get collections with amenity counts for display
 */
export async function getCollectionsWithStats(airport: string, terminal?: string) {
  // First get the collections
  const { data: collections, error: collectionsError } = await supabase
    .from('collections')
    .select('*')
    .or(`universal.eq.true,airports.cs.{${airport}}`);

  if (collectionsError) {
    console.error('Error fetching collections:', collectionsError);
    return [];
  }

  // Then get amenity counts for each collection
  const collectionsWithStats = await Promise.all(
    collections.map(async (collection) => {
      const { count, data: amenities } = await supabase
        .from('collection_amenities')
        .select(`
          amenity_detail_id,
          amenity_detail!inner(
            id,
            name,
            terminal_code,
            airport_code
          )
        `, { count: 'exact' })
        .eq('collection_id', collection.id)
        .eq('amenity_detail.airport_code', airport);

      // Get sample amenity names
      const sampleAmenities = amenities
        ?.slice(0, 3)
        .map(a => a.amenity_detail?.name)
        .filter(Boolean) || [];

      return {
        ...collection,
        amenity_count: count || 0,
        sample_amenities: sampleAmenities
      };
    })
  );

  return collectionsWithStats;
}

/**
 * Get amenities in a specific collection
 */
export async function getCollectionAmenities(
  collectionId: string, 
  airport: string, 
  terminal?: string
): Promise<CollectionAmenity[]> {
  let query = supabase
    .from('collection_amenity_details')
    .select('*')
    .eq('collection_id', collectionId)
    .eq('airport_code', airport);

  // If terminal is provided, prioritize amenities from that terminal
  if (terminal) {
    query = query.order('terminal_code', { 
      ascending: false,
      nullsFirst: false 
    });
  }

  const { data, error } = await query
    .order('priority', { ascending: false })
    .order('amenity_name');

  if (error) {
    console.error('Error fetching collection amenities:', error);
    return [];
  }

  // If terminal provided, sort to put matching terminal first
  if (terminal && data) {
    return data.sort((a, b) => {
      if (a.terminal_code === terminal && b.terminal_code !== terminal) return -1;
      if (b.terminal_code === terminal && a.terminal_code !== terminal) return 1;
      return 0;
    });
  }

  return data || [];
}

/**
 * Get terminal-specific collections (with "Near You" items)
 */
export async function getTerminalCollections(
  airport: string, 
  terminal: string,
  limit: number = 5
) {
  console.log('getTerminalCollections called with:', { airport, terminal, limit });
  
  // Get collections that have amenities in the user's terminal
  const { data, error } = await supabase
    .rpc('get_terminal_collections', {
      p_airport: airport,
      p_terminal: terminal,
      p_limit: limit
    });

  if (error) {
    console.error('Error fetching terminal collections:', error);
    console.error('Error details:', error.message, error.details, error.hint);
    return [];
  }

  console.log('Supabase RPC returned:', data);
  return data || [];
}

/**
 * Alternative: Get terminal collections using direct query (no RPC)
 */
export async function getTerminalCollectionsDirect(
  airport: string,
  terminal: string,
  limit: number = 5
) {
  console.log('Direct query for collections:', { airport, terminal, limit });
  
  try {
    // First, get all collections for the airport
    const { data: collections, error: collectionsError } = await supabase
      .from('collections')
      .select('*')
      .or(`universal.eq.true,airports.cs.{${airport}}`);

    if (collectionsError) {
      console.error('Error fetching collections:', collectionsError);
      return [];
    }

    // Process collections to add counts
    const processedCollections = await Promise.all(
      collections.slice(0, limit).map(async (collection) => {
        // Get amenity counts for this collection
        const { data: amenityMappings, error: countError } = await supabase
          .from('collection_amenities')
          .select('amenity_detail_id, amenity_detail!inner(terminal_code, airport_code)')
          .eq('collection_id', collection.id);

        if (countError) {
          console.error('Error counting amenities:', countError);
          return null;
        }

        // Filter for this airport
        const airportAmenities = amenityMappings?.filter(
          (m: any) => m.amenity_detail?.airport_code === airport
        ) || [];

        // Count terminal-specific amenities
        const terminalAmenities = airportAmenities.filter(
          (m: any) => m.amenity_detail?.terminal_code === terminal
        ).length;

        return {
          collection_id: collection.id,
          collection_name: collection.name,
          collection_slug: collection.collection_id,
          collection_icon: collection.icon,
          collection_gradient: collection.gradient,
          is_universal: collection.universal,
          is_featured: collection.featured,
          amenity_count: airportAmenities.length,
          terminal_amenity_count: terminalAmenities
        };
      })
    );

    // Filter out nulls and sort by featured first, then by terminal amenity count
    return processedCollections
      .filter(c => c !== null)
      .sort((a, b) => {
        if (a.is_featured && !b.is_featured) return -1;
        if (!a.is_featured && b.is_featured) return 1;
        return b.terminal_amenity_count - a.terminal_amenity_count;
      });

  } catch (error) {
    console.error('Error in direct collections query:', error);
    return [];
  }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Group collections by type for carousel display
 */
export function groupCollectionsByType(
  collections: Collection[],
  userAirport: string
) {
  const grouped = {
    terminalSpecific: [] as Collection[],
    universal: [] as Collection[],
    local: [] as Collection[]
  };

  collections.forEach(collection => {
    if (collection.universal) {
      grouped.universal.push(collection);
    } else if (collection.airports?.includes(userAirport)) {
      grouped.local.push(collection);
    }
  });

  return grouped;
}

/**
 * Filter collections based on journey context
 */
export function filterByJourneyContext(
  collections: Collection[],
  context: 'departure' | 'transit' | 'arrival'
) {
  const contextFilters = {
    departure: ['coffee-chill', 'lounge-life', 'duty-free', 'true-blue-aussie'],
    transit: ['quick-bites', '24-7-heroes', 'stay-connected'],
    arrival: ['stay-connected', 'transport', 'sydney-harbour-vibes']
  };

  const priorityIds = contextFilters[context];
  
  return collections.sort((a, b) => {
    const aIndex = priorityIds.indexOf(a.collection_id);
    const bIndex = priorityIds.indexOf(b.collection_id);
    
    if (aIndex === -1 && bIndex === -1) return 0;
    if (aIndex === -1) return 1;
    if (bIndex === -1) return -1;
    
    return aIndex - bIndex;
  });
}

// ============================================
// SQL FUNCTION FOR SUPABASE (Run this in SQL Editor)
// ============================================
/*
CREATE OR REPLACE FUNCTION get_terminal_collections(
  p_airport TEXT,
  p_terminal TEXT,
  p_limit INT DEFAULT 5
)
RETURNS TABLE (
  collection_id UUID,
  collection_name TEXT,
  amenity_count BIGINT,
  terminal_amenity_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id as collection_id,
    c.name as collection_name,
    COUNT(DISTINCT ca.amenity_detail_id) as amenity_count,
    COUNT(DISTINCT CASE 
      WHEN a.terminal_code = p_terminal THEN ca.amenity_detail_id 
    END) as terminal_amenity_count
  FROM collections c
  JOIN collection_amenities ca ON c.id = ca.collection_id
  JOIN amenity_detail a ON ca.amenity_detail_id = a.id
  WHERE a.airport_code = p_airport
    AND (c.universal = true OR p_airport = ANY(c.airports))
  GROUP BY c.id, c.name
  HAVING COUNT(DISTINCT CASE 
    WHEN a.terminal_code = p_terminal THEN ca.amenity_detail_id 
  END) > 0
  ORDER BY terminal_amenity_count DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;
*/

// ============================================
// USAGE EXAMPLE IN REACT COMPONENT
// ============================================
/*
import { useEffect, useState } from 'react';
import { 
  getCollectionsWithStats, 
  groupCollectionsByType,
  filterByJourneyContext 
} from '@/lib/services/collections';

export function BestOfCollections({ airport, terminal, journeyContext }) {
  const [collections, setCollections] = useState({
    universal: [],
    local: [],
    terminalSpecific: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCollections() {
      const data = await getCollectionsWithStats(airport, terminal);
      const grouped = groupCollectionsByType(data, airport);
      const filtered = {
        ...grouped,
        universal: filterByJourneyContext(grouped.universal, journeyContext)
      };
      setCollections(filtered);
      setLoading(false);
    }

    loadCollections();
  }, [airport, terminal, journeyContext]);

  if (loading) return <div>Loading collections...</div>;

  return (
    <div>
      {collections.universal.map(collection => (
        <CollectionCard key={collection.id} collection={collection} />
      ))}
    </div>
  );
}
*/
