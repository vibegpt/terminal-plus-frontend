import React from 'react';
import { useCollectionAmenities } from '../hooks/useAmenities';
import { COLLECTIONS_TO_SHOW, COLLECTION_COUNTS } from '../utils/collectionDefinitions';

// Example component showing the exact collections you specified
const CollectionsExample: React.FC = () => {
  // Your exact collections with known counts
  const collectionsToShow = [
    'jewel-wonders',      // 102 amenities
    'hawker-heaven',      // 6 curated food courts
    'changi-exclusives',  // 20 entertainment
    'local-eats-sin',     // 18 local dishes
    'coffee-chill',       // 93 cafes
    'quick-bites',        // 138 fast food
    '24-7-heroes',        // 169 always open
    'lounge-life'         // 50 lounges
  ];

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Collections Overview</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {collectionsToShow.map(collectionSlug => (
          <CollectionCard 
            key={collectionSlug}
            slug={collectionSlug}
            count={COLLECTION_COUNTS[collectionSlug]}
          />
        ))}
      </div>
      
      <div className="mt-8 p-4 bg-blue-50 rounded-lg">
        <h2 className="text-xl font-bold mb-2">Total Amenities</h2>
        <p className="text-2xl font-bold text-blue-600">
          {Object.values(COLLECTION_COUNTS).reduce((sum, count) => sum + count, 0)} amenities
        </p>
      </div>
    </div>
  );
};

// Individual collection card
const CollectionCard: React.FC<{ slug: string; count: number }> = ({ slug, count }) => {
  const { amenities, loading } = useCollectionAmenities('SIN-T3', slug);
  
  return (
    <div className="border rounded-lg p-4 hover:shadow-md transition-shadow">
      <h3 className="font-semibold text-lg mb-2">
        {slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
      </h3>
      
      <div className="text-sm text-gray-600 mb-3">
        Expected: {count} amenities
      </div>
      
      {loading ? (
        <div className="text-gray-500">Loading...</div>
      ) : (
        <div className="text-sm">
          <div className="text-green-600 font-medium">
            Found: {amenities.length} amenities
          </div>
          {amenities.length > 0 && (
            <div className="mt-2">
              <div className="font-medium">Sample:</div>
              {amenities.slice(0, 3).map(amenity => (
                <div key={amenity.id} className="text-gray-600">
                  • {amenity.name}
                </div>
              ))}
              {amenities.length > 3 && (
                <div className="text-gray-500">
                  ... and {amenities.length - 3} more
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CollectionsExample;
