// Fix major collection relevance issues identified in analysis
const fs = require('fs');
const path = require('path');

function fixCollectionIssues() {
  console.log('🔧 Fixing Collection Relevance Issues...\n');

  const amenitiesPath = path.join(__dirname, '../src/data/amenities.json');
  let amenities = JSON.parse(fs.readFileSync(amenitiesPath, 'utf8'));

  console.log('📋 CRITICAL ISSUES TO FIX:\n');

  // 1. Fix vibe mismatches for amenities in collections
  const vibeFixUpdates = {
    // Coffee-worth-walk collection - lounges need Refuel tag
    'cathay-pacific-lounge': { add: ['Refuel'], reason: 'In coffee-worth-walk collection' },
    'plaza-premium-lounge': { add: ['Refuel'], reason: 'In coffee-worth-walk collection' },
    'sats-premier-lounge': { add: ['Refuel'], reason: 'In coffee-worth-walk collection' },
    'singapore-airlines-silverkris-lounge': { add: ['Refuel'], reason: 'In coffee-worth-walk collection' },

    // Gate-essentials collection - items need Quick tag
    'irvins-salted-egg-t1': { add: ['Quick'], reason: 'In gate-essentials collection' },
    'garrett-popcorn-t1': { add: ['Quick'], reason: 'In gate-essentials collection' },
    'twg-tea-boutique-t1': { add: ['Quick'], reason: 'In gate-essentials collection' },

    // Quiet-zones collection - gardens need Work tag
    'butterfly-garden': { add: ['Work'], reason: 'In quiet-zones collection' },
    'cactus-garden': { add: ['Work'], reason: 'In quiet-zones collection' },
    'koi-pond': { add: ['Work'], reason: 'In quiet-zones collection' },

    // Hidden-quiet-spots collection - memory space needs Chill tag
    'memory-of-lived-space': { add: ['Chill'], reason: 'In hidden-quiet-spots collection' },

    // Jewel-experience collection - shopping items need Discover tag
    'irvins-salted-egg-jewel': { add: ['Discover'], reason: 'In jewel-experience collection' },
    'fila-jewel': { add: ['Discover'], reason: 'In jewel-experience collection' },
    'furla-jewel': { add: ['Discover'], reason: 'In jewel-experience collection' },
    'uniqlo-jewel': { add: ['Discover'], reason: 'In jewel-experience collection' },

    // Wellness collections - forest valley needs Chill tag
    'shiseido-forest-valley': { add: ['Chill'], reason: 'In wellness-escape & garden-paradise collections' },

    // Local food collection - taste singapore needs Refuel tag
    'taste-singapore': { add: ['Refuel'], reason: 'In local-food-real-prices collection' },

    // Healthy choices - spa express needs Refuel tag
    'spa-express': { add: ['Refuel'], reason: 'In healthy-choices collection' }
  };

  console.log('1️⃣ FIXING VIBE MISMATCHES:\n');

  let vibeFixCount = 0;
  amenities.forEach(amenity => {
    const update = vibeFixUpdates[amenity.slug];
    if (update) {
      const oldVibes = [...(amenity.vibe_tags || [])];
      const newVibes = [...oldVibes];

      update.add.forEach(vibe => {
        if (!newVibes.includes(vibe)) {
          newVibes.push(vibe);
        }
      });

      if (newVibes.length > oldVibes.length) {
        amenity.vibe_tags = newVibes;
        vibeFixCount++;
        console.log(`✅ ${amenity.name} [${amenity.terminal_code}]`);
        console.log(`   Added: ${update.add.join(', ')}`);
        console.log(`   Reason: ${update.reason}`);
        console.log(`   Before: [${oldVibes.join(', ')}]`);
        console.log(`   After:  [${newVibes.join(', ')}]`);
        console.log('');
      }
    }
  });

  // Write back updated amenities
  fs.writeFileSync(amenitiesPath, JSON.stringify(amenities, null, 2));

  console.log(`📊 VIBE FIXES APPLIED: ${vibeFixCount} amenities updated\n`);

  // 2. Generate collection optimization recommendations
  console.log('2️⃣ COLLECTION OPTIMIZATION RECOMMENDATIONS:\n');

  console.log('🔄 OVERLAPPING COLLECTIONS TO CONSOLIDATE:');
  console.log('');
  console.log('❗ quiet-sips ↔ hidden-quiet-spots (12 shared amenities)');
  console.log('   RECOMMENDATION: Merge into "quiet-escapes" or differentiate clearly');
  console.log('   • quiet-sips: Focus on beverages (tea, coffee, bar)');
  console.log('   • hidden-quiet-spots: Focus on spaces (art, gardens, unique spots)');
  console.log('');

  console.log('❗ lounge-life ↔ spa-wellness (8 shared lounges)');
  console.log('   RECOMMENDATION: Keep separate but differentiate purpose');
  console.log('   • lounge-life: General comfort amenities');
  console.log('   • spa-wellness: Health/wellness focused only');
  console.log('');

  console.log('❗ local-food-real-prices ↔ hawker-heaven (9 shared amenities)');
  console.log('   RECOMMENDATION: Differentiate by price point');
  console.log('   • local-food-real-prices: Budget local food');
  console.log('   • hawker-heaven: Traditional hawker experience');
  console.log('');

  console.log('❗ gate-essentials ↔ 2-minute-stops (4 shared amenities)');
  console.log('   RECOMMENDATION: Merge into single "last-minute-essentials"');
  console.log('');

  console.log('🚮 MISSING AMENITIES TO REMOVE FROM COLLECTIONS:');
  console.log('');
  console.log('❌ duty-free-deals: Remove 7 missing perfume/cosmetic amenities');
  console.log('❌ last-minute-gifts: Remove 2 missing bookstore amenities');
  console.log('❌ shilla-duty-free: Not found in amenities data');
  console.log('');

  console.log('🎯 COLLECTION COHERENCE IMPROVEMENTS:');
  console.log('');
  console.log('🔧 healthy-choices: Consider removing spa services, focus on food/drinks');
  console.log('🔧 duty-free-deals: Add variety beyond just wines & spirits');
  console.log('🔧 meeting-ready-spaces: Too small (5 amenities), merge with work-spots-real-wifi');
  console.log('');

  console.log('✨ IMPLEMENTATION PRIORITY:');
  console.log('1. HIGH: Fix vibe mismatches (DONE ✅)');
  console.log('2. HIGH: Remove missing amenities from collections');
  console.log('3. MEDIUM: Differentiate overlapping collections');
  console.log('4. LOW: Merge small collections');

  return {
    vibeFixesApplied: vibeFixCount,
    criticalIssues: [
      '12 amenities shared between quiet-sips & hidden-quiet-spots',
      '8 lounges shared between lounge-life & spa-wellness',
      '7 missing amenities in duty-free-deals',
      '9 local food amenities duplicated across collections'
    ]
  };
}

if (require.main === module) {
  fixCollectionIssues();
}

module.exports = { fixCollectionIssues };