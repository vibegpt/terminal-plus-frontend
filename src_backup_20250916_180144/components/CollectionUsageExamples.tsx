import React from 'react';
import { useCollectionAmenities, useSupabaseCollections } from '../hooks/useAmenities';

// Example 1: Using the useCollectionAmenities hook (as shown in your first example)
const CollectionDetailExample: React.FC = () => {
  const { amenities, loading, error, totalCount } = useCollectionAmenities('SIN-T3', 'hawker-heaven');
  
  // Will return 3 hawker centers in T3 (as you mentioned)
  
  if (loading) return <div>Loading hawker heaven amenities...</div>;
  if (error) return <div>Error: {error}</div>;
  
  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">
        Hawker Heaven in Terminal 3 ({totalCount} spots)
      </h2>
      
      <div className="grid gap-4">
        {amenities.map(amenity => (
          <div key={amenity.id} className="border rounded-lg p-4">
            <h3 className="font-semibold">{amenity.name}</h3>
            <p className="text-gray-600">{amenity.description}</p>
            <div className="text-sm text-gray-500 mt-2">
              {(() => {
                const price = amenity.price_tier || amenity.price_level;
                if (!price || price === '') return null;
                if (price.toLowerCase() === 'free') {
                  return <span className="text-green-600">Price: Free</span>;
                }
                return <span>Price: {price}</span>;
              })()}
              {amenity.location && <span className="ml-2">📍 {amenity.location}</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Example 2: Using direct Supabase RPC calls (as shown in your second example)
const SupabaseCollectionsExample: React.FC = () => {
  const { collections, loading, error } = useSupabaseCollections('SIN', 'T3');
  
  if (loading) return <div>Loading collections from Supabase...</div>;
  if (error) return <div>Supabase error: {error}</div>;
  
  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">
        Collections in Terminal 3 ({collections.length} found)
      </h2>
      
      <div className="grid gap-4">
        {collections.map((collection: any) => (
          <div key={collection.collection_uuid} className="border rounded-lg p-4">
            <h3 className="font-semibold">{collection.collection_name}</h3>
            <p className="text-gray-600">{collection.description}</p>
            <div className="text-sm text-gray-500 mt-2">
              <span>Total spots: {collection.spots_total}</span>
              <span className="ml-2">Near you: {collection.spots_near_you}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Example 3: Combined approach - get collections from Supabase, then amenities for specific collection
const CombinedApproachExample: React.FC = () => {
  const { collections, loading: collectionsLoading } = useSupabaseCollections('SIN', 'T3');
  const { amenities, loading: amenitiesLoading, totalCount } = useCollectionAmenities('SIN-T3', 'hawker-heaven');
  
  const loading = collectionsLoading || amenitiesLoading;
  
  if (loading) return <div>Loading combined data...</div>;
  
  return (
    <div className="p-4 space-y-6">
      {/* Collections from Supabase */}
      <div>
        <h2 className="text-xl font-bold mb-3">Collections Available ({collections.length})</h2>
        <div className="grid grid-cols-2 gap-3">
          {collections.slice(0, 4).map((col: any) => (
            <div key={col.collection_uuid} className="text-sm p-2 bg-gray-50 rounded">
              {col.collection_name}
            </div>
          ))}
        </div>
      </div>
      
      {/* Specific collection amenities */}
      <div>
        <h2 className="text-xl font-bold mb-3">Hawker Heaven Amenities ({totalCount})</h2>
        <div className="grid gap-2">
          {amenities.slice(0, 3).map(amenity => (
            <div key={amenity.id} className="text-sm p-2 bg-blue-50 rounded">
              {amenity.name}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Main component that shows all examples
const CollectionUsageExamples: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <h1 className="text-3xl font-bold text-center mb-8">
        Collection Usage Examples
      </h1>
      
      {/* Example 1: Hook-based approach */}
      <div className="border rounded-lg p-6">
        <h2 className="text-xl font-bold mb-4 text-blue-600">
          Example 1: useCollectionAmenities Hook
        </h2>
        <p className="text-gray-600 mb-4">
          Uses the hook to automatically fetch and filter amenities for a specific collection.
        </p>
        <CollectionDetailExample />
      </div>
      
      {/* Example 2: Direct Supabase approach */}
      <div className="border rounded-lg p-6">
        <h2 className="text-xl font-bold mb-4 text-green-600">
          Example 2: Direct Supabase RPC
        </h2>
        <p className="text-gray-600 mb-4">
          Directly calls the Supabase RPC function as shown in your example.
        </p>
        <SupabaseCollectionsExample />
      </div>
      
      {/* Example 3: Combined approach */}
      <div className="border rounded-lg p-6">
        <h2 className="text-xl font-bold mb-4 text-purple-600">
          Example 3: Combined Approach
        </h2>
        <p className="text-gray-600 mb-4">
          Gets collections from Supabase, then fetches amenities for a specific collection.
        </p>
        <CombinedApproachExample />
      </div>
      
      {/* Usage instructions */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-bold mb-3">Usage Instructions</h3>
        <div className="space-y-3 text-sm">
          <div>
            <strong>Hook Approach:</strong>
            <code className="block bg-white p-2 rounded mt-1">
              const { amenities } = useCollectionAmenities('SIN-T3', 'hawker-heaven');
            </code>
          </div>
          <div>
            <strong>Direct Supabase:</strong>
            <code className="block bg-white p-2 rounded mt-1">
              const { data } = await supabase.rpc('get_collections_for_terminal', {<br/>
              &nbsp;&nbsp;p_airport_code: 'SIN', p_terminal: 'T3'<br/>
              });
            </code>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CollectionUsageExamples;
export { CollectionDetailExample, SupabaseCollectionsExample, CombinedApproachExample };
