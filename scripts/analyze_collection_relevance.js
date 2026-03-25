// Analyze collection contents for relevance and coherence
const fs = require('fs');
const path = require('path');

function analyzeCollectionRelevance() {
  console.log('🔍 Analyzing Collection Contents for Relevance...\n');

  // Read amenities and collections
  const amenitiesPath = path.join(__dirname, '../src/data/amenities.json');
  const amenities = JSON.parse(fs.readFileSync(amenitiesPath, 'utf8'));

  const { COLLECTION_AMENITIES } = require('../src/config/collectionAmenities.ts');

  // Create lookup for amenity details
  const amenityLookup = {};
  amenities.forEach(a => {
    amenityLookup[a.slug] = a;
  });

  // Group collections by vibe
  const collectionsByVibe = {
    'Comfort': ['lounge-life', 'sleep-pods', 'spa-wellness'],
    'Chill': ['quiet-sips', 'wellness-escape', 'garden-paradise', 'hidden-quiet-spots'],
    'Refuel': ['local-food-real-prices', 'coffee-worth-walk', 'hawker-heaven', 'healthy-choices'],
    'Work': ['work-spots-real-wifi', 'meeting-ready-spaces', 'stay-connected', 'quiet-zones'],
    'Shop': ['duty-free-deals', 'singapore-exclusives', 'last-minute-gifts', 'local-treasures'],
    'Quick': ['24-7-heroes', 'gate-essentials', '2-minute-stops', 'grab-and-go'],
    'Discover': ['only-at-changi', 'instagram-worthy-spots', 'hidden-gems', 'jewel-experience']
  };

  Object.entries(collectionsByVibe).forEach(([vibe, collections]) => {
    console.log(`\n🎯 ${vibe.toUpperCase()} COLLECTIONS:`);
    console.log('='.repeat(50));

    collections.forEach(collectionId => {
      const amenityList = COLLECTION_AMENITIES[collectionId] || [];
      console.log(`\n📋 ${collectionId.toUpperCase().replace(/-/g, ' ')} (${amenityList.length} amenities):`);

      // Analyze collection composition
      const composition = {
        categories: {},
        types: {},
        terminals: {},
        vibes: {},
        mismatched: []
      };

      amenityList.forEach(slug => {
        const amenity = amenityLookup[slug];
        if (!amenity) {
          console.log(`  ❌ ${slug} (NOT FOUND)`);
          return;
        }

        // Track categories
        const category = amenity.category || 'Unknown';
        composition.categories[category] = (composition.categories[category] || 0) + 1;

        // Track types
        const type = amenity.amenity_type || 'Unknown';
        composition.types[type] = (composition.types[type] || 0) + 1;

        // Track terminals
        const terminal = amenity.terminal_code || 'Unknown';
        composition.terminals[terminal] = (composition.terminals[terminal] || 0) + 1;

        // Track vibes
        if (amenity.vibe_tags) {
          amenity.vibe_tags.forEach(v => {
            composition.vibes[v] = (composition.vibes[v] || 0) + 1;
          });
        }

        // Check if amenity matches collection vibe
        if (amenity.vibe_tags && !amenity.vibe_tags.includes(vibe)) {
          composition.mismatched.push({
            slug: amenity.slug,
            name: amenity.name,
            vibes: amenity.vibe_tags,
            terminal: amenity.terminal_code
          });
        }

        console.log(`  ✅ ${amenity.name} [${amenity.terminal_code}] - ${type}`);
      });

      // Analysis summary
      console.log(`\n  📊 COMPOSITION ANALYSIS:`);
      console.log(`     Categories: ${Object.keys(composition.categories).join(', ')}`);
      console.log(`     Terminals: ${Object.keys(composition.terminals).join(', ')}`);
      console.log(`     Most common type: ${Object.entries(composition.types).sort((a,b) => b[1] - a[1])[0]?.[0] || 'None'}`);

      // Check vibe alignment
      if (composition.mismatched.length > 0) {
        console.log(`\n  ⚠️  VIBE MISMATCHES (${composition.mismatched.length}):`);
        composition.mismatched.forEach(item => {
          console.log(`     • ${item.name} [${item.terminal}] has vibes: [${item.vibes.join(', ')}]`);
        });
      } else {
        console.log(`\n  ✅ All amenities properly tagged for ${vibe} vibe`);
      }

      // Check diversity
      const terminalCount = Object.keys(composition.terminals).length;
      const categoryCount = Object.keys(composition.categories).length;

      if (terminalCount < 2 && amenityList.length > 5) {
        console.log(`\n  🚨 DIVERSITY WARNING: Only ${terminalCount} terminal(s) represented`);
      }
      if (categoryCount === 1 && amenityList.length > 8) {
        console.log(`\n  🚨 VARIETY WARNING: Only 1 category (${Object.keys(composition.categories)[0]})`);
      }

      console.log(`\n  🎲 SMART7 POTENTIAL: ${amenityList.length >= 7 ? 'Good' : 'Limited'} (${amenityList.length} amenities)`);
    });
  });

  // Overall recommendations
  console.log(`\n\n💡 COLLECTION OPTIMIZATION RECOMMENDATIONS:`);
  console.log('='.repeat(60));

  // Check for similar collections
  console.log(`\n🔄 POTENTIAL OVERLAPS TO REVIEW:`);

  const overlaps = [
    ['lounge-life', 'spa-wellness', 'Many shared lounges'],
    ['quiet-sips', 'hidden-quiet-spots', 'Similar quiet dining concept'],
    ['local-food-real-prices', 'hawker-heaven', 'Both focus on local food'],
    ['duty-free-deals', 'singapore-exclusives', 'Some shared duty-free items'],
    ['gate-essentials', '2-minute-stops', 'Quick grab items overlap']
  ];

  overlaps.forEach(([col1, col2, note]) => {
    const list1 = COLLECTION_AMENITIES[col1] || [];
    const list2 = COLLECTION_AMENITIES[col2] || [];
    const shared = list1.filter(item => list2.includes(item));

    if (shared.length > 0) {
      console.log(`  ⚠️  ${col1} ↔ ${col2}: ${shared.length} shared amenities`);
      console.log(`     Note: ${note}`);
      shared.slice(0, 3).forEach(slug => {
        const amenity = amenityLookup[slug];
        if (amenity) console.log(`     • ${amenity.name}`);
      });
      console.log('');
    }
  });

  return {
    totalCollections: Object.keys(COLLECTION_AMENITIES).length,
    vibeBreakdown: Object.entries(collectionsByVibe).map(([vibe, cols]) => ({
      vibe,
      collections: cols.length
    }))
  };
}

if (require.main === module) {
  analyzeCollectionRelevance();
}

module.exports = { analyzeCollectionRelevance };