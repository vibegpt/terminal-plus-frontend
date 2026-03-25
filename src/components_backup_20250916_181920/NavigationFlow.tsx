import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useCollectionAmenities } from '../hooks/useAmenities';
import { COLLECTIONS_TO_SHOW, COLLECTION_COUNTS } from '../utils/collectionDefinitions';

// Navigation Flow Component
// Demonstrates the exact user journey: Home → Collection → Amenity

const NavigationFlow: React.FC = () => {
  const navigate = useNavigate();

  const handleCollectionClick = (collectionSlug: string) => {
    // Navigate to collection detail page
    // Format: /collection/SIN-T3/hawker-heaven
    const terminalCode = 'SIN-T3';
    const formattedSlug = collectionSlug.toLowerCase().replace(/\s+/g, '-');
    
    console.log(`🔄 Navigating to: /collection/${terminalCode}/${formattedSlug}`);
    navigate(`/collection/${terminalCode}/${formattedSlug}`);
  };

  const handleAmenityClick = (amenitySlug: string) => {
    // Navigate to amenity detail page
    // Format: /amenity/SIN-T3/food-court-name
    const terminalCode = 'SIN-T3';
    
    console.log(`🔄 Navigating to: /amenity/${terminalCode}/${amenitySlug}`);
    navigate(`/amenity/${terminalCode}/${amenitySlug}`);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Navigation Flow Demo</h1>
      
      {/* Step 1: Home (VibesFeedMVP) */}
      <div className="mb-8 p-6 bg-blue-50 rounded-lg">
        <h2 className="text-xl font-bold mb-4 text-blue-600">🏠 Step 1: Home (VibesFeedMVP)</h2>
        <p className="text-gray-700 mb-4">
          Shows collections by vibe. Click on any collection to proceed to Step 2.
        </p>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {COLLECTIONS_TO_SHOW.slice(0, 4).map(collectionSlug => (
            <button
              key={collectionSlug}
              onClick={() => handleCollectionClick(collectionSlug)}
              className="p-3 bg-white border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors text-left"
            >
              <div className="font-medium text-sm">
                {collectionSlug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
              </div>
              <div className="text-xs text-gray-500">
                {COLLECTION_COUNTS[collectionSlug]} amenities
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Step 2: Collection Detail */}
      <div className="mb-8 p-6 bg-green-50 rounded-lg">
        <h2 className="text-xl font-bold mb-4 text-green-600">📚 Step 2: Collection Detail</h2>
        <p className="text-gray-700 mb-4">
          Shows amenities in the selected collection. Click on any amenity to proceed to Step 3.
        </p>
        
        <div className="space-y-4">
          {/* Example: Hawker Heaven Collection */}
          <div className="bg-white p-4 rounded-lg border border-green-200">
            <h3 className="font-semibold mb-2">🥟 Hawker Heaven Collection</h3>
            <p className="text-sm text-gray-600 mb-3">
              Expected: 6 curated food courts in T3
            </p>
            
            <HawkerHeavenAmenities onAmenityClick={handleAmenityClick} />
          </div>
        </div>
      </div>

      {/* Step 3: Amenity Detail */}
      <div className="mb-8 p-6 bg-purple-50 rounded-lg">
        <h2 className="text-xl font-bold mb-4 text-purple-600">🍽️ Step 3: Amenity Detail</h2>
        <p className="text-gray-700 mb-4">
          Shows detailed information about the selected amenity.
        </p>
        
        <div className="bg-white p-4 rounded-lg border border-purple-200">
          <h3 className="font-semibold mb-2">Example: Toast Box Food Court</h3>
          <p className="text-sm text-gray-600">
            Location: Terminal 3, Level 2<br/>
            Cuisine: Local Singapore<br/>
            Price: $$<br/>
            Hours: 6:00 AM - 10:00 PM
          </p>
          <button
            onClick={() => handleAmenityClick('toast-box-food-court')}
            className="mt-3 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            View Full Details
          </button>
        </div>
      </div>

      {/* Navigation Summary */}
      <div className="p-6 bg-gray-50 rounded-lg">
        <h2 className="text-xl font-bold mb-4">🔄 Navigation Summary</h2>
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs">1</span>
            <span><strong>Home (VibesFeedMVP)</strong> → Shows collections by vibe</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-xs">2</span>
            <span><strong>Click "Hawker Heaven"</strong> → Navigate to <code>/collection/SIN-T3/hawker-heaven</code></span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 bg-purple-500 text-white rounded-full flex items-center justify-center text-xs">3</span>
            <span><strong>Shows 3 food courts in T3</strong> → Click on specific food court</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 bg-orange-500 text-white rounded-full flex items-center justify-center text-xs">4</span>
            <span><strong>Navigate to</strong> <code>/amenity/SIN-T3/food-court-name</code></span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Component to show Hawker Heaven amenities
const HawkerHeavenAmenities: React.FC<{ onAmenityClick: (slug: string) => void }> = ({ onAmenityClick }) => {
  const { amenities, loading } = useCollectionAmenities('SIN-T3', 'hawker-heaven');
  
  if (loading) {
    return <div className="text-gray-500">Loading food courts...</div>;
  }
  
  return (
    <div className="space-y-2">
      <div className="text-sm text-gray-600">
        Found: {amenities.length} food courts
      </div>
      {amenities.slice(0, 3).map(amenity => (
        <button
          key={amenity.id}
          onClick={() => onAmenityClick(amenity.slug || amenity.amenity_slug || 'unknown')}
          className="w-full text-left p-2 bg-gray-50 rounded hover:bg-gray-100 transition-colors"
        >
          <div className="font-medium">{amenity.name}</div>
          <div className="text-xs text-gray-500">
            {amenity.description?.substring(0, 50)}...
          </div>
        </button>
      ))}
      {amenities.length === 0 && (
        <div className="text-gray-500 text-sm">
          No food courts found. This might be using fallback data.
        </div>
      )}
    </div>
  );
};

export default NavigationFlow;
