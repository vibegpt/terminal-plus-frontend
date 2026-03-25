// =====================================================
// EXAMPLE: How to Update Your Components
// Shows how to integrate the new unified service
// =====================================================

import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useUnifiedCollections, useCollectionAmenities } from '@/hooks/useUnifiedCollections';
import { TerminalCodeUtils } from '@/utils/terminalCodeUtils';

// =====================================================
// EXAMPLE 1: Terminal Best Of Page
// =====================================================
export function TerminalBestOfPage() {
  const { terminalCode } = useParams<{ terminalCode: string }>();
  const navigate = useNavigate();
  
  // Parse terminal code (works with any format)
  const { airport, terminal } = TerminalCodeUtils.parseTerminalCode(terminalCode || 'SYD-T1');
  
  // Use the new hook - it handles all format variations!
  const { collections, loading, error } = useUnifiedCollections(airport, terminal);
  
  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2">Loading collections...</span>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="p-4 bg-red-50 rounded-lg">
        <p className="text-red-600">Error: {error}</p>
      </div>
    );
  }
  
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">
        Best of {airport} {TerminalCodeUtils.getDisplayName(terminalCode!)}
      </h1>
      
      <div className="grid gap-4">
        {collections.map(collection => (
          <div 
            key={collection.id}
            className={`p-4 rounded-lg bg-gradient-to-r ${collection.gradient}`}
            onClick={() => navigate(`/collection/${collection.collection_id}`)}
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <span className="text-2xl">{collection.icon}</span>
                  {collection.name}
                </h3>
                <p className="text-sm opacity-90">{collection.description}</p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold">{collection.spots_in_terminal}</div>
                <div className="text-sm">spots</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// =====================================================
// EXAMPLE 2: Collection Detail Page
// =====================================================
export function CollectionDetailPage() {
  const { collectionSlug, terminalCode } = useParams<{ 
    collectionSlug: string; 
    terminalCode: string; 
  }>();
  const navigate = useNavigate();
  
  // Parse terminal code
  const { airport, terminal } = TerminalCodeUtils.parseTerminalCode(terminalCode || 'SYD-T1');
  
  // Use the amenities hook
  const { collection, amenities, loading, error } = useCollectionAmenities(
    collectionSlug || '',
    airport,
    terminal
  );
  
  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  
  if (error || !collection) {
    return (
      <div className="p-4">
        <p className="text-red-600">Collection not found</p>
        <button 
          onClick={() => navigate(-1)}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded"
        >
          Go Back
        </button>
      </div>
    );
  }
  
  return (
    <div className="p-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <span className="text-3xl">{collection.icon}</span>
          {collection.name}
        </h1>
        <p className="text-gray-600">{collection.description}</p>
        <p className="text-sm mt-2">
          {amenities.length} spots in {TerminalCodeUtils.getDisplayName(terminalCode!)}
        </p>
      </div>
      
      <div className="space-y-4">
        {amenities.map(amenity => (
          <div 
            key={amenity.id}
            className="p-4 bg-white rounded-lg shadow border border-gray-200"
            onClick={() => navigate(`/amenity/${amenity.amenity_slug}`)}
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold">{amenity.name}</h3>
                <p className="text-sm text-gray-600 mt-1">{amenity.description}</p>
                {amenity.vibe_tags && (
                  <div className="flex gap-2 mt-2">
                    {(Array.isArray(amenity.vibe_tags) ? amenity.vibe_tags : [amenity.vibe_tags])
                      .map(tag => (
                        <span key={tag} className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                          {tag}
                        </span>
                      ))
                    }
                  </div>
                )}
              </div>
              {amenity.is_featured && (
                <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-xs">
                  Featured
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// =====================================================
// EXAMPLE 3: Simple Collection Card Component
// =====================================================
export function CollectionCard({ airport, terminal }: { airport: string; terminal: string }) {
  // The hook handles ANY terminal format!
  const { collections, loading } = useUnifiedCollections(airport, terminal);
  
  if (loading) return <div>Loading...</div>;
  
  return (
    <div>
      {collections.map(c => (
        <div key={c.id}>
          {c.icon} {c.name}: {c.spots_in_terminal} spots
        </div>
      ))}
    </div>
  );
}

// =====================================================
// MIGRATION NOTES
// =====================================================
/*
To update your existing components:

1. Replace imports:
   OLD: import { getCollectionsByAirport } from '@/lib/services/collections';
   NEW: import { useUnifiedCollections } from '@/hooks/useUnifiedCollections';

2. Replace service calls:
   OLD: const data = await getCollectionsForTerminal('SYD', 'T1');
   NEW: const { collections } = useUnifiedCollections('SYD', 'T1');

3. Terminal codes work with ANY format:
   - useUnifiedCollections('SYD', 'T1')           ✓
   - useUnifiedCollections('SYD', 'Terminal 1')   ✓
   - useUnifiedCollections('SIN', 'JEWEL')        ✓
   - useUnifiedCollections('SIN', 'T3')           ✓

4. The service automatically:
   - Formats terminal codes consistently
   - Tries multiple query methods
   - Falls back gracefully
   - Provides detailed console logs
*/
