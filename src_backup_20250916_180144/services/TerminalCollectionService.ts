// TerminalCollectionService.ts
// Fix for displaying collection counts and amenities

import { supabase } from '@/lib/supabase';

// =====================================================
// TYPES
// =====================================================

interface CollectionCount {
  id: string;
  slug: string;
  name: string;
  icon: string;
  gradient: string;
  description: string;
  featured: boolean;
  spots_in_terminal: number;
  spots_near_you: number;
  total_spots: number;
}

interface CollectionAmenity {
  id: number;
  name: string;
  slug: string;
  description: string;
  terminal_code: string;
  vibe_tags: string;
  price_level: string;
  opening_hours: any;
  available_in_tr: boolean;
  priority: number;
}

// =====================================================
// MAIN FUNCTIONS - USE THESE IN YOUR APP
// =====================================================

/**
 * Get collections with correct counts for terminal display
 * This is what should be called when showing the Best Of page
 */
export async function getCollectionsWithCounts(
  airport: string,
  terminal: string
): Promise<CollectionCount[]> {
  try {
    console.log(`📱 Fetching collections for ${airport} ${terminal}`);
    
    // Use the working RPC function that we tested
    const { data, error } = await supabase.rpc('get_collections_for_terminal', {
      p_airport_code: airport,
      p_terminal: terminal
    });

    if (error) {
      console.error('❌ Error fetching collection counts:', error);
      throw error;
    }

    console.log(`✅ Found ${data?.length || 0} collections with counts`);
    
    // Log first collection for debugging
    if (data && data.length > 0) {
      console.log('First collection:', {
        name: data[0].collection_name,
        spots_in_terminal: data[0].spots_near_you,
        spots_total: data[0].spots_total
      });
    }

    // Map the data to match your CollectionCount interface
    return (data || []).map((item: any) => ({
      id: item.collection_uuid,
      slug: item.collection_slug,
      name: item.collection_name,
      icon: item.icon,
      gradient: item.gradient,
      description: item.description,
      featured: item.featured,
      spots_in_terminal: item.spots_near_you,
      spots_near_you: item.spots_near_you,
      total_spots: item.spots_total
    }));
    
  } catch (error) {
    console.error('Error in getCollectionsWithCounts:', error);
    return [];
  }
}

/**
 * Get amenities for a specific collection
 * This is what should be called when a collection card is clicked
 */
export async function getCollectionAmenities(
  collectionSlug: string,
  airport: string,
  terminal: string
): Promise<CollectionAmenity[]> {
  try {
    console.log(`📱 Fetching amenities for ${collectionSlug} in ${airport} ${terminal}`);
    
    // Call the RPC function that returns amenities
    const { data, error } = await supabase.rpc('get_collection_amenities_simple', {
      p_collection_slug: collectionSlug,
      p_airport: airport,
      p_terminal: terminal
    });

    if (error) {
      console.error('❌ Error fetching amenities:', error);
      throw error;
    }

    console.log(`✅ Found ${data?.length || 0} amenities in collection`);
    
    // Map the data to match your CollectionAmenity interface
    return (data || []).map((item: any) => ({
      id: item.id,
      name: item.name,
      slug: item.slug,
      description: item.description,
      terminal_code: item.terminal_code,
      vibe_tags: item.vibe_tags,
      price_level: item.price_level,
      opening_hours: item.opening_hours,
      available_in_tr: item.available_in_tr,
      priority: item.priority
    }));
    
  } catch (error) {
    console.error('Error in getCollectionAmenities:', error);
    return [];
  }
}

// =====================================================
// REACT COMPONENT EXAMPLES
// =====================================================

/**
 * Example: Best Of Collections Page Component
 */
export const BestOfCollectionsExample = `
import React, { useEffect, useState } from 'react';
import { getCollectionsWithCounts } from '@/services/TerminalCollectionService';

function BestOfCollections({ airport, terminal }) {
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCollections() {
      setLoading(true);
      try {
        // This will get collections with correct counts
        const data = await getCollectionsWithCounts(airport, terminal);
        setCollections(data);
      } catch (error) {
        console.error('Failed to load collections:', error);
      } finally {
        setLoading(false);
      }
    }
    
    loadCollections();
  }, [airport, terminal]);

  if (loading) return <div>Loading collections...</div>;

  return (
    <div className="collections-grid">
      {collections.map(collection => (
        <CollectionCard
          key={collection.id}
          slug={collection.slug}
          name={collection.name}
          icon={collection.icon}
          gradient={collection.gradient}
          spotsInTerminal={collection.spots_in_terminal}
          spotsNearYou={collection.spots_near_you}
          onClick={() => navigateToCollection(collection.slug)}
        />
      ))}
    </div>
  );
}
`;

/**
 * Example: Collection Card Component
 */
export const CollectionCardExample = `
function CollectionCard({ 
  slug, 
  name, 
  icon, 
  gradient, 
  spotsInTerminal, 
  spotsNearYou,
  onClick 
}) {
  return (
    <div 
      className={\`collection-card bg-gradient-to-r \${gradient} cursor-pointer\`}
      onClick={onClick}
    >
      <div className="icon text-4xl">{icon}</div>
      <h3 className="text-xl font-bold">{name}</h3>
      
      {/* These should now show correct numbers, not 0 */}
      <div className="stats">
        <p className="text-lg">{spotsNearYou} spots near you</p>
        <p className="text-sm opacity-75">{spotsInTerminal} in Terminal {terminal}</p>
      </div>
    </div>
  );
}
`;

/**
 * Example: Collection Detail Page Component
 */
export const CollectionDetailExample = `
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getCollectionAmenities } from '@/services/TerminalCollectionService';

function CollectionDetail({ airport, terminal }) {
  const { collectionSlug } = useParams();
  const [amenities, setAmenities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAmenities() {
      setLoading(true);
      try {
        // This will get amenities for the collection
        const data = await getCollectionAmenities(
          collectionSlug, 
          airport, 
          terminal
        );
        setAmenities(data);
      } catch (error) {
        console.error('Failed to load amenities:', error);
      } finally {
        setLoading(false);
      }
    }
    
    loadAmenities();
  }, [collectionSlug, airport, terminal]);

  if (loading) return <div>Loading amenities...</div>;
  
  if (amenities.length === 0) {
    return <div>No amenities found in this collection for Terminal {terminal}</div>;
  }

  return (
    <div className="amenities-grid">
      {amenities.map(amenity => (
        <AmenityCard
          key={amenity.id}
          name={amenity.name}
          description={amenity.description}
          priceLevel={amenity.price_level}
          onClick={() => navigateToAmenity(amenity.slug)}
        />
      ))}
    </div>
  );
}
`;

// =====================================================
// DEBUGGING HELPERS
// =====================================================

/**
 * Debug function to test if backend is working
 */
export async function testBackendConnection(airport: string, terminal: string) {
  console.log('🧪 Testing backend connection...');
  
  // Test 1: Direct table query
  const { data: directData, error: directError } = await supabase
    .from('collection_terminal_counts')
    .select('*')
    .eq('airport_code', airport)
    .eq('terminal_code', `${airport}-${terminal}`)
    .limit(3);
  
  console.log('Direct query result:', directData, directError);
  
  // Test 2: RPC function
  const { data: rpcData, error: rpcError } = await supabase
    .rpc('get_collection_counts', {
      p_airport: airport,
      p_terminal: terminal
    });
  
  console.log('RPC function result:', rpcData, rpcError);
  
  return {
    directQuery: { data: directData, error: directError },
    rpcFunction: { data: rpcData, error: rpcError }
  };
}

// =====================================================
// EXPORT ALL FUNCTIONS
// =====================================================

export default {
  getCollectionsWithCounts,
  getCollectionAmenities,
  testBackendConnection
};
