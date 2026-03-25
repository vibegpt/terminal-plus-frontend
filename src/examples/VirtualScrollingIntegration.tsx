// Example integration of virtual scrolling and pagination in existing components

import React from 'react';
import { VirtualAmenityList } from '../components/VirtualAmenityList';
import { usePaginatedAmenities } from '../hooks/usePaginatedAmenities';

// Example 1: Simple virtual scrolling for a large amenity list
export const AmenityListWithVirtualScrolling: React.FC<{ amenities: any[] }> = ({ amenities }) => {
  const handleAmenityClick = (amenity: any) => {
    console.log('Navigate to amenity:', amenity);
    // Navigate to amenity detail page
  };

  return (
    <div className="h-96">
      <VirtualAmenityList
        amenities={amenities}
        height={400}
        itemHeight={120}
        onAmenityClick={handleAmenityClick}
        className="border rounded-lg"
      />
    </div>
  );
};

// Example 2: Paginated amenities with virtual scrolling
export const PaginatedAmenityList: React.FC<{ 
  vibe: string; 
  terminalCode: string; 
  airportCode: string;
}> = ({ vibe, terminalCode, airportCode }) => {
  const {
    amenities,
    loading,
    error,
    hasMore,
    loadMore,
    refresh
  } = usePaginatedAmenities({
    vibe,
    terminalCode,
    airportCode,
    pageSize: 20
  });

  const handleAmenityClick = (amenity: any) => {
    console.log('Navigate to amenity:', amenity);
  };

  if (loading && amenities.length === 0) {
    return <div className="p-4 text-center">Loading amenities...</div>;
  }

  if (error) {
    return (
      <div className="p-4 text-center text-red-600">
        Error: {error}
        <button onClick={refresh} className="ml-2 text-blue-600 underline">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div>
      <VirtualAmenityList
        amenities={amenities}
        height={600}
        onAmenityClick={handleAmenityClick}
      />
      
      {hasMore && (
        <div className="text-center mt-4">
          <button
            onClick={loadMore}
            disabled={loading}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {loading ? 'Loading...' : 'Load More'}
          </button>
        </div>
      )}
    </div>
  );
};

// Example 3: Performance comparison component
export const PerformanceComparison: React.FC<{ amenities: any[] }> = ({ amenities }) => {
  const [useVirtual, setUseVirtual] = React.useState(true);

  return (
    <div className="space-y-4">
      <div className="flex space-x-4">
        <button
          onClick={() => setUseVirtual(true)}
          className={`px-4 py-2 rounded ${
            useVirtual ? 'bg-blue-500 text-white' : 'bg-gray-200'
          }`}
        >
          Virtual Scrolling
        </button>
        <button
          onClick={() => setUseVirtual(false)}
          className={`px-4 py-2 rounded ${
            !useVirtual ? 'bg-blue-500 text-white' : 'bg-gray-200'
          }`}
        >
          Normal Rendering
        </button>
      </div>

      <div className="h-96 border rounded">
        {useVirtual ? (
          <VirtualAmenityList
            amenities={amenities}
            height={400}
            onAmenityClick={(amenity) => console.log('Virtual click:', amenity)}
          />
        ) : (
          <div className="h-full overflow-y-auto">
            {amenities.map((amenity, index) => (
              <div
                key={amenity.id || index}
                className="p-4 border-b hover:bg-gray-50 cursor-pointer"
                onClick={() => console.log('Normal click:', amenity)}
              >
                <h3 className="font-semibold">{amenity.name}</h3>
                <p className="text-sm text-gray-600">{amenity.description}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Example 4: Integration with existing VibePage
export const EnhancedVibePage: React.FC<{ vibeId: string }> = ({ vibeId }) => {
  const [showVirtual, setShowVirtual] = React.useState(false);

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Vibe: {vibeId}</h1>
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={showVirtual}
            onChange={(e) => setShowVirtual(e.target.checked)}
            className="rounded"
          />
          <span>Use Virtual Scrolling</span>
        </label>
      </div>

      <PaginatedAmenityList
        vibe={vibeId}
        terminalCode="T3"
        airportCode="SIN"
      />
    </div>
  );
};
