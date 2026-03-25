import React from 'react';
import { useNavigate } from 'react-router-dom';
import { VIBES, getCollectionsForVibe } from '../constants/vibeDefinitions';

export function TestVibeNavigation() {
  const navigate = useNavigate();

  const testNavigationFlow = () => {
    console.log('Testing Navigation Flow:');
    console.log('========================');
    
    // Test 1: Check vibe definitions
    console.log('\n1. VIBE DEFINITIONS:');
    VIBES.forEach(vibe => {
      console.log(`   ${vibe.emoji} ${vibe.name}: ${vibe.collections.length} collections`);
    });
    
    // Test 2: Check Discover vibe specifically
    console.log('\n2. DISCOVER VIBE COLLECTIONS:');
    const discoverVibe = VIBES.find(v => v.slug === 'discover');
    if (discoverVibe) {
      console.log(`   Found Discover vibe with ${discoverVibe.collections.length} collections:`);
      const collections = getCollectionsForVibe('discover');
      collections.forEach(col => {
        console.log(`   - ${col.name}: ${col.amenities?.length || 0} amenities`);
      });
    }
    
    // Test 3: Check Chill vs Comfort separation
    console.log('\n3. CHILL VS COMFORT VIBES:');
    const chillVibe = VIBES.find(v => v.slug === 'chill');
    const comfortVibe = VIBES.find(v => v.slug === 'comfort');
    
    if (chillVibe) {
      console.log('   CHILL (Easy-going vibes):');
      const chillCollections = getCollectionsForVibe('chill');
      chillCollections.forEach(col => {
        console.log(`   - ${col.name}: ${col.amenities?.length || 0} amenities`);
      });
    }
    
    if (comfortVibe) {
      console.log('\n   COMFORT (Premium rest & wellness):');
      const comfortCollections = getCollectionsForVibe('comfort');
      comfortCollections.forEach(col => {
        console.log(`   - ${col.name}: ${col.amenities?.length || 0} amenities`);
      });
    }
    
    // Test 4: Lounge Distribution
    console.log('\n4. LOUNGE DISTRIBUTION:');
    console.log('   Social Lounges (Chill): Plaza Premium, SATS, Pay-per-use');
    console.log('   Premium Lounges (Comfort): SQ First/Business, Emirates, Centurion');
    console.log('   Business Lounges (Work): KrisFlyer Gold, Conference lounges');
    
    console.log('\n5. NAVIGATION TEST:');
    console.log('   Click any vibe card below to test navigation...');
  };

  React.useEffect(() => {
    testNavigationFlow();
  }, []);

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Vibe Navigation Test</h1>
      
      <div className="mb-8 p-4 bg-blue-50 rounded-lg">
        <h2 className="font-semibold mb-2">Expected Flow:</h2>
        <ol className="list-decimal list-inside space-y-1 text-sm">
          <li>Click a vibe card (no count shown)</li>
          <li>Navigate to /vibe/[vibeSlug]</li>
          <li>See 5 collections with counts (15-25 spots each)</li>
          <li>Click a collection</li>
          <li>Navigate to amenities</li>
        </ol>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {VIBES.map(vibe => (
          <div
            key={vibe.slug}
            onClick={() => navigate(`/vibe/${vibe.slug}`)}
            className={`p-6 rounded-xl bg-gradient-to-r ${vibe.gradient} text-white cursor-pointer hover:scale-105 transition-transform`}
          >
            <div className="text-3xl mb-2">{vibe.emoji}</div>
            <h3 className="font-bold text-lg">{vibe.name}</h3>
            <p className="text-sm opacity-90">{vibe.subtitle}</p>
            <p className="text-xs mt-2 opacity-75">
              ✅ No count shown here
            </p>
          </div>
        ))}
      </div>

      <div className="mt-8 p-4 bg-gray-100 rounded-lg">
        <p className="text-sm text-gray-600">
          Check console for detailed navigation test results
        </p>
      </div>
    </div>
  );
}

export default TestVibeNavigation;
