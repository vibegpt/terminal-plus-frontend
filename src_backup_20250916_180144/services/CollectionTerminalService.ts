// Frontend Service - Collection Terminal Service
// This should replace or update your existing collection fetching logic

import { supabase } from '@/lib/supabase';

interface CollectionWithCounts {
  collection_id: string;
  collection_name: string;
  icon: string;
  gradient: string;
  spots_total: number;
  spots_near_you: number;
}

/**
 * Get collections with accurate counts for a specific terminal
 */
export async function getCollectionsForTerminal(
  airport: string, 
  terminal: string
): Promise<CollectionWithCounts[]> {
  try {
    // Format terminal code correctly (e.g., 'T3' -> 'SIN-T3')
    const terminalCode = `${airport}-${terminal}`;
    
    console.log(`🔍 Fetching collections for terminal: ${terminalCode}`);
    
    // Query the view we created
    const { data, error } = await supabase
      .from('collection_terminal_counts')
      .select(`
        collection_id,
        collection_name,
        icon,
        gradient,
        amenity_count,
        transit_amenity_count
      `)
      .eq('terminal_code', terminalCode)
      .order('amenity_count', { ascending: false });

    if (error) {
      console.error('Error fetching collection counts:', error);
      // Fallback to getting collections without counts
      return await getCollectionsWithoutCounts(airport);
    }

    // Map to frontend format
    return (data || []).map(item => ({
      collection_id: item.collection_id,
      collection_name: item.collection_name,
      icon: item.icon,
      gradient: item.gradient,
      spots_total: item.amenity_count || 0,
      spots_near_you: item.transit_amenity_count || 0
    }));
    
  } catch (error) {
    console.error('Error in getCollectionsForTerminal:', error);
    return [];
  }
}

/**
 * Alternative: Direct query without view (if view doesn't exist)
 */
export async function getCollectionsDirectQuery(
  airport: string,
  terminal: string
): Promise<CollectionWithCounts[]> {
  try {
    const terminalCode = `${airport}-${terminal}`;
    
    // Direct query joining all tables
    const { data, error } = await supabase
      .rpc('get_collection_stats_for_terminal', {
        p_airport_code: airport,
        p_terminal_code: terminalCode
      });

    if (error) {
      console.error('Error calling RPC:', error);
      
      // Fallback to manual query
      const { data: collections } = await supabase
        .from('collections')
        .select(`
          collection_id,
          name,
          icon,
          gradient,
          collection_amenities!inner(
            amenity_detail!inner(
              id,
              terminal_code,
              available_in_tr
            )
          )
        `)
        .or(`universal.eq.true,airports.cs.{${airport}}`);

      // Process and count manually
      return (collections || []).map(collection => {
        const amenitiesInTerminal = collection.collection_amenities?.filter(
          ca => ca.amenity_detail?.terminal_code === terminalCode
        ) || [];
        
        const transitAvailable = amenitiesInTerminal.filter(
          ca => ca.amenity_detail?.available_in_tr === true
        );

        return {
          collection_id: collection.collection_id,
          collection_name: collection.name,
          icon: collection.icon,
          gradient: collection.gradient,
          spots_total: amenitiesInTerminal.length,
          spots_near_you: transitAvailable.length
        };
      });
    }

    return (data || []).map(item => ({
      collection_id: item.collection_slug,
      collection_name: item.collection_name,
      icon: item.icon,
      gradient: item.gradient,
      spots_total: item.terminal_amenities || 0,
      spots_near_you: item.near_amenities || 0
    }));
    
  } catch (error) {
    console.error('Error in direct query:', error);
    return [];
  }
}

/**
 * Fallback: Get collections without counts
 */
async function getCollectionsWithoutCounts(airport: string) {
  const { data } = await supabase
    .from('collections')
    .select('*')
    .or(`universal.eq.true,airports.cs.{${airport}}`);
    
  return (data || []).map(c => ({
    collection_id: c.collection_id,
    collection_name: c.name,
    icon: c.icon,
    gradient: c.gradient,
    spots_total: 0, // Will show 0 but at least loads
    spots_near_you: 0
  }));
}

/**
 * Enhanced collection fetching with health scoring
 */
export async function getCollectionsWithHealth(
  airport: string,
  terminal: string
): Promise<(CollectionWithCounts & { health_score: string; health_color: string })[]> {
  try {
    const collections = await getCollectionsForTerminal(airport, terminal);
    
    return collections.map(collection => {
      const ratio = collection.spots_near_you / Math.max(collection.spots_total, 1);
      let health_score: string;
      let health_color: string;
      
      if (ratio === 1) {
        health_score = 'Perfect';
        health_color = 'text-green-600';
      } else if (ratio > 0.7) {
        health_score = 'Good';
        health_color = 'text-blue-600';
      } else if (ratio > 0.3) {
        health_score = 'Mixed';
        health_color = 'text-yellow-600';
      } else {
        health_score = 'Poor';
        health_color = 'text-red-600';
      }
      
      return {
        ...collection,
        health_score,
        health_color
      };
    });
    
  } catch (error) {
    console.error('Error getting collections with health:', error);
    return [];
  }
}

/**
 * Get collection recommendations based on journey context
 */
export async function getContextualCollections(
  airport: string,
  terminal: string,
  context: 'departure' | 'arrival' | 'transit' | 'layover'
): Promise<CollectionWithCounts[]> {
  try {
    const collections = await getCollectionsForTerminal(airport, terminal);
    
    // Sort based on journey context
    const contextPriorities = {
      departure: ['coffee-chill', 'quick-bites', 'duty-free', 'lounge-life'],
      arrival: ['transport', 'comfort-spaces', 'quick-bites'],
      transit: ['lounge-life', 'entertainment', 'wellness'],
      layover: ['explore', 'entertainment', 'wellness', 'duty-free']
    };
    
    const priorities = contextPriorities[context] || [];
    
    return collections.sort((a, b) => {
      const aIndex = priorities.indexOf(a.collection_id);
      const bIndex = priorities.indexOf(b.collection_id);
      
      if (aIndex === -1 && bIndex === -1) return 0;
      if (aIndex === -1) return 1;
      if (bIndex === -1) return -1;
      
      return aIndex - bIndex;
    });
    
  } catch (error) {
    console.error('Error getting contextual collections:', error);
    return [];
  }
}

/**
 * Usage in your React component
 */
// In your BestOfCollections component or similar:

// const [collections, setCollections] = useState<CollectionWithCounts[]>([]);
// 
// useEffect(() => {
//   const loadCollections = async () => {
//     const data = await getCollectionsForTerminal('SIN', 'T3');
//     setCollections(data);
//   };
//   loadCollections();
// }, []);
//
// Then in your render:
// {collections.map(collection => (
//   <CollectionCard
//     key={collection.collection_id}
//     name={collection.collection_name}
//     icon={collection.icon}
//     spotsTotal={collection.spots_total}
//     spotsNearYou={collection.spots_near_you}
//     gradient={collection.gradient}
//   />
// ))}

export default {
  getCollectionsForTerminal,
  getCollectionsDirectQuery,
  getCollectionsWithHealth,
  getContextualCollections
};
