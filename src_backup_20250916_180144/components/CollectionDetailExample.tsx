import React, { useEffect } from 'react';
import { useCollectionAmenities } from '../hooks/useAmenities';

type Props = {
  terminalCode: string;           // e.g., 'SIN-T3'
  collectionSlug: string;         // e.g., 'hawker-heaven'
};

const CollectionDetailExample: React.FC<Props> = ({ terminalCode, collectionSlug }) => {
  const { amenities, loading, totalCount } = useCollectionAmenities(terminalCode, collectionSlug);

  // Add debugging for terminal and collection validation
  useEffect(() => {
    console.log(`Loading collection: ${terminalCode} / ${collectionSlug}`);
    
    // Import validation utility
    import('../utils/validationUtils').then(({ validateTerminalAndCollection, getValidTerminals, getValidCollectionSlugs }) => {
      const validation = validateTerminalAndCollection(terminalCode, collectionSlug);
      
      if (!validation.terminalValid) {
        console.warn(`⚠️  Invalid terminal: ${terminalCode}. Valid formats:`, getValidTerminals());
      } else {
        console.log(`✅ Valid terminal: ${terminalCode} (${validation.terminalName})`);
      }
      
      if (!validation.collectionValid) {
        console.warn(`⚠️  Invalid collection slug: ${collectionSlug}. Valid formats:`, getValidCollectionSlugs());
      } else {
        console.log(`✅ Valid collection slug: ${collectionSlug} (${validation.collectionName})`);
      }
    });
  }, [terminalCode, collectionSlug]);

  if (loading) return <div>Loading amenities…</div>;
  if (!amenities.length) return <div>No amenities found for this collection.</div>;

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">
        {collectionSlug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} 
        <span className="text-gray-500 ml-2">({totalCount})</span>
      </h2>
      
      <div className="grid gap-4">
        {amenities.map(amenity => (
          <div key={amenity.slug} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
            <h3 className="font-semibold text-lg">{amenity.name}</h3>
            {amenity.description && (
              <p className="text-gray-600 mt-1">{amenity.description}</p>
            )}
            <div className="flex gap-2 mt-2 text-sm text-gray-500">
              {(() => {
                const price = amenity.price_tier || amenity.price_level;
                if (!price || price === '') return null;
                if (price.toLowerCase() === 'free') {
                  return <span className="text-green-600">• Free</span>;
                }
                return <span>• {price}</span>;
              })()}
              {amenity.location && <span>• {amenity.location}</span>}
              {amenity.vibe_tags && amenity.vibe_tags.length > 0 && (
                <span>• {amenity.vibe_tags.join(', ')}</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CollectionDetailExample;
