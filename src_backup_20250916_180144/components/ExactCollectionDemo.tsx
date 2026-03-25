import React, { useState } from 'react';
import { useCollectionAmenities } from '../hooks/useAmenities';
import { 
  COLLECTIONS_TO_SHOW, 
  COLLECTION_AMENITIES, 
  COLLECTION_COUNTS,
  validateCollectionAmenities,
  getCollectionMetadata
} from '../utils/collectionDefinitions';

// Demo component showing exact collection definitions
// Demonstrates the precise amenity lists and validation

const ExactCollectionDemo: React.FC = () => {
  const [selectedCollection, setSelectedCollection] = useState('local-eats');
  const [terminalCode, setTerminalCode] = useState('SIN-T3');
  
  const { amenities, loading, totalCount } = useCollectionAmenities(terminalCode, selectedCollection);
  
  // Get collection metadata
  const metadata = getCollectionMetadata(selectedCollection);
  const expectedAmenities = COLLECTION_AMENITIES[selectedCollection]?.amenities || [];
  const minCount = COLLECTION_AMENITIES[selectedCollection]?.minCount || 0;
  
  // Validate the collection
  const validation = validateCollectionAmenities(
    selectedCollection, 
    amenities.map(a => a.id || a.amenity_slug || a.slug)
  );

  const handleCollectionChange = (collection: string) => {
    setSelectedCollection(collection);
  };

  const handleTerminalChange = (terminal: string) => {
    setTerminalCode(terminal);
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-8 text-center">
        Exact Collection Definitions Demo
      </h1>
      
      <p className="text-gray-600 text-center mb-8 max-w-3xl mx-auto">
        This demo shows the exact amenity lists for each collection, with validation 
        and real-time checking against the expected amenities.
      </p>

      {/* Collection Selector */}
      <div className="mb-8 p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
        <h2 className="text-xl font-bold mb-4 text-center text-blue-800">
          📚 Select Collection
        </h2>
        <div className="flex flex-wrap justify-center gap-3">
          {COLLECTIONS_TO_SHOW.map(collection => (
            <button
              key={collection}
              onClick={() => handleCollectionChange(collection)}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                selectedCollection === collection
                  ? 'bg-blue-600 text-white shadow-lg scale-105'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              {collection.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Terminal Selector */}
      <div className="mb-8 p-4 bg-gray-50 rounded-lg">
        <h3 className="text-lg font-semibold mb-3 text-center">🛫 Select Terminal</h3>
        <div className="flex flex-wrap justify-center gap-2">
          {['SIN-T1', 'SIN-T2', 'SIN-T3', 'SIN-T4', 'SIN-JEWEL'].map(terminal => (
            <button
              key={terminal}
              onClick={() => handleTerminalChange(terminal)}
              className={`px-3 py-1 rounded text-sm ${
                terminalCode === terminal
                  ? 'bg-green-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              {terminal}
            </button>
          ))}
        </div>
      </div>

      {/* Collection Information */}
      <div className="mb-8 p-6 bg-white rounded-lg border border-gray-200 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Collection Details */}
          <div>
            <h3 className="text-xl font-bold mb-4 text-gray-900">
              {metadata?.name || selectedCollection}
            </h3>
            <p className="text-gray-600 mb-4">
              {metadata?.description || 'Collection description'}
            </p>
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="font-medium">Expected Amenities:</span>
                <span className="text-blue-600 font-bold">{expectedAmenities.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Minimum Count:</span>
                <span className="text-orange-600 font-bold">{minCount}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Found in {terminalCode}:</span>
                <span className="text-green-600 font-bold">{totalCount}</span>
              </div>
            </div>
          </div>

          {/* Validation Status */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-semibold mb-3 text-gray-800">Validation Status</h4>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className={`w-3 h-3 rounded-full ${validation.isValid ? 'bg-green-500' : 'bg-red-500'}`}></span>
                <span className={validation.isValid ? 'text-green-700' : 'text-red-700'}>
                  {validation.isValid ? '✅ Valid' : '❌ Invalid'}
                </span>
              </div>
              <div className="text-sm text-gray-600">
                <div>Expected: {validation.expectedCount}</div>
                <div>Found: {validation.foundCount}</div>
                <div>Missing: {validation.missingAmenities.length}</div>
                <div>Extra: {validation.extraAmenities.length}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Expected Amenities List */}
      <div className="mb-8 p-6 bg-green-50 rounded-lg border border-green-200">
        <h3 className="text-lg font-semibold mb-4 text-green-800">
          📋 Expected Amenities for {selectedCollection}
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {expectedAmenities.map(amenityId => {
            const found = amenities.some(a => 
              (a.id || a.amenity_slug || a.slug) === amenityId
            );
            return (
              <div 
                key={amenityId}
                className={`p-3 rounded-lg border ${
                  found 
                    ? 'bg-green-100 border-green-300 text-green-800' 
                    : 'bg-red-100 border-red-300 text-red-800'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">
                    {found ? '✅' : '❌'}
                  </span>
                  <span className="font-medium">
                    {amenityId.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                  </span>
                </div>
                <div className="text-xs mt-1 opacity-75">
                  {found ? 'Found' : 'Missing'}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Found Amenities */}
      <div className="mb-8 p-6 bg-blue-50 rounded-lg border border-blue-200">
        <h3 className="text-lg font-semibold mb-4 text-blue-800">
          🔍 Found Amenities in {terminalCode}
        </h3>
        
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading amenities...</p>
          </div>
        ) : amenities.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {amenities.map(amenity => {
              const amenityId = amenity.id || amenity.amenity_slug || amenity.slug;
              const isExpected = expectedAmenities.includes(amenityId);
              
              return (
                <div 
                  key={amenityId}
                  className={`p-4 rounded-lg border ${
                    isExpected 
                      ? 'bg-green-100 border-green-300' 
                      : 'bg-yellow-100 border-yellow-300'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">
                      {isExpected ? '✅' : '⚠️'}
                    </span>
                    <h4 className="font-semibold text-gray-900">
                      {amenity.name || amenityId}
                    </h4>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">
                    {amenity.description || 'No description available'}
                  </p>
                  <div className="text-xs text-gray-500">
                    ID: {amenityId}
                    {!isExpected && (
                      <span className="ml-2 text-yellow-600">
                        (Not in expected list)
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            No amenities found for this collection in {terminalCode}
          </div>
        )}
      </div>

      {/* Collection Summary */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-xl font-bold mb-4 text-center">📊 Collection Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
          <div className="bg-white p-4 rounded-lg border">
            <div className="text-2xl font-bold text-blue-600">{COLLECTIONS_TO_SHOW.length}</div>
            <div className="text-sm text-gray-600">Total Collections</div>
          </div>
          <div className="bg-white p-4 rounded-lg border">
            <div className="text-2xl font-bold text-green-600">
              {Object.values(COLLECTION_COUNTS).reduce((sum, count) => sum + count, 0)}
            </div>
            <div className="text-sm text-gray-600">Total Expected Amenities</div>
          </div>
          <div className="bg-white p-4 rounded-lg border">
            <div className="text-2xl font-bold text-orange-600">
              {Object.values(COLLECTION_AMENITIES).reduce((sum, collection) => sum + collection.minCount, 0)}
            </div>
            <div className="text-sm text-gray-600">Total Minimum Count</div>
          </div>
          <div className="bg-white p-4 rounded-lg border">
            <div className="text-2xl font-bold text-purple-600">
              {validation.isValid ? '✅' : '❌'}
            </div>
            <div className="text-sm text-gray-600">Current Collection Valid</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExactCollectionDemo;
