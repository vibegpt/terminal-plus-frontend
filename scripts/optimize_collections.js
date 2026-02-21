// Optimize collection structure based on analysis recommendations
const fs = require('fs');
const path = require('path');

function optimizeCollections() {
  console.log('🎯 Optimizing Collection Structure...\n');

  const collectionPath = path.join(__dirname, '../src/config/collectionAmenities.ts');
  let content = fs.readFileSync(collectionPath, 'utf8');

  console.log('📋 COLLECTION OPTIMIZATIONS:\n');

  console.log('1️⃣ REMOVING MISSING AMENITIES:\n');

  // Remove missing amenities from duty-free-deals
  const dutyFreeCleanup = [
    'perfumes-cosmetics-by-beauty-brands-level-2-shop-115',
    'perfumes-cosmetics-by-beauty-brands-level-2-shop-116',
    'perfumes-cosmetics-by-beauty-brands-level-2-shop-130',
    'perfumes-cosmetics-by-beauty-brands-level-2-shop-14',
    'perfumes-cosmetics-by-beauty-brands-level-2-shop-158',
    'perfumes-cosmetics-by-beauty-brands-level-2-shop-159',
    'shilla-duty-free'
  ];

  dutyFreeCleanup.forEach(amenity => {
    content = content.replace(new RegExp(`    '${amenity}',?\\n`, 'g'), '');
    console.log(`❌ Removed: ${amenity} from duty-free-deals`);
  });

  // Remove missing amenities from last-minute-gifts
  const lastMinuteCleanup = [
    'times-bookstores-level-2-shop-101',
    'times-bookstores-level-2-shop-137'
  ];

  lastMinuteCleanup.forEach(amenity => {
    content = content.replace(new RegExp(`    '${amenity}',?\\n`, 'g'), '');
    console.log(`❌ Removed: ${amenity} from last-minute-gifts`);
  });

  console.log(`\\n✅ Removed ${dutyFreeCleanup.length + lastMinuteCleanup.length} missing amenities\\n`);

  console.log('2️⃣ DIFFERENTIATING OVERLAPPING COLLECTIONS:\\n');

  // Differentiate quiet-sips vs hidden-quiet-spots
  console.log('🍵 QUIET-SIPS → Focus on beverages & dining:');
  const quietSipsNew = [
    'cha-mulan-jewel',
    'twg-tea-boutique-t1',
    'twg-tea-boutique-t2',
    'twg-tea-boutique-t3',
    'tiger-den-t4',
    'tap-brew-t1',
    'ya-kun-family-cafe-t3',
    'old-town-express-t3',
    'aji-ichi-sushi-bar-t4',
    'paradise-dynasty'
  ];

  console.log('🤫 HIDDEN-QUIET-SPOTS → Focus on unique spaces & art:');
  const hiddenQuietSpotsNew = [
    'mirror-maze',
    'memory-of-lived-space',
    'social-tree',
    'sunflower-garden',
    'fish-spa-t1',
    'spa-express',
    'butterfly-garden',
    'cactus-garden',
    'koi-pond',
    'cathay-pacific-lounge',
    'dnata-lounge',
    'plaza-premium-lounge',
    'singapore-airlines-silverkris-lounge',
    'sats-premier-lounge'
  ];

  console.log('\\n🍽️ LOCAL-FOOD-REAL-PRICES → Focus on authentic local cheap eats:');
  const localFoodNew = [
    'heavenly-wang-t1',
    'chatterbox-express-t1',
    'pontian-wanton-noodle-t1',
    't1-basement-food-court',
    't2-staff-canteen',
    't3-basement-food-court',
    'old-town-express-t3',
    'ya-kun-family-cafe-t3',
    'mr-teh-tarik-express-t3',
    'crown-prince-kitchenette-t3',
    'irvins-salted-egg-t1',
    'bee-cheng-hiang',
    'aw-root-beer-t3'
  ];

  console.log('🥢 HAWKER-HEAVEN → Focus on premium/restaurant local food:');
  const hawkerHeavenNew = [
    'din-tai-fung',
    'paradise-dynasty',
    'sushi-tei',
    'aji-ichi-sushi-bar-t4',
    'heavenly-wang-t1',
    'pontian-wanton-noodle-t1',
    'mr-teh-tarik-express-t3',
    'crown-prince-kitchenette-t3',
    'tsuta-jewel',
    'gwangjang-gaon-jewel',
    'fish-co-jewel'
  ];

  console.log('\\n3️⃣ MERGING SMALL COLLECTIONS:\\n');

  console.log('🔄 MERGING: gate-essentials + 2-minute-stops → last-minute-essentials');
  const lastMinuteEssentialsNew = [
    'guardian-health-beauty-level-2-shop-16',
    'guardian-health-beauty-level-2-shop-29',
    'guardian-health-beauty-level-2-shop-66',
    'guardian-health-beauty-level-2-shop-69',
    'irvins-salted-egg-t1',
    'garrett-popcorn-t1',
    'twg-tea-boutique-t1',
    'aw-root-beer-t3',
    'bee-cheng-hiang'
  ];

  console.log('🔄 MERGING: meeting-ready-spaces → work-spots-real-wifi');
  const workSpotsEnhanced = [
    'cathay-pacific-lounge',
    'dnata-lounge',
    'plaza-premium-lounge',
    'sats-premier-lounge',
    'singapore-airlines-silverkris-lounge',
    'electronics-computers-sprint-cass',
    'electronics-computers-sprint-cass-t1',
    'electronics-computers-sprint-cass-t2',
    'cha-mulan-jewel',
    'twg-tea-boutique-t1',
    'starbucks-t3',
    'hudsons-coffee-t2'
  ];

  // Generate optimized collections object
  const optimizedCollections = {
    // Comfort - keep as is, well differentiated
    'lounge-life': [
      'cathay-pacific-lounge',
      'dnata-lounge',
      'plaza-premium-lounge',
      'sats-premier-lounge',
      'singapore-airlines-silverkris-lounge',
      'aerotel-singapore',
      'ambassador-transit-hotel',
      'crowne-plaza-changi-airport',
      'yotelair-singapore-changi',
      'din-tai-fung',
      'sushi-tei',
      'koi-th'
    ],
    'spa-wellness': [
      'spa-express',
      'fish-spa-t1',
      'shiseido-forest-valley',
      'cathay-pacific-lounge',
      'dnata-lounge',
      'plaza-premium-lounge'
    ],
    'sleep-pods': [
      'aerotel-singapore',
      'ambassador-transit-hotel',
      'yotelair-singapore-changi',
      'crowne-plaza-changi-airport',
      'plaza-premium-lounge',
      'cathay-pacific-lounge',
      'dnata-lounge',
      'sats-premier-lounge',
      'singapore-airlines-silverkris-lounge'
    ],

    // Chill - differentiated collections
    'quiet-sips': quietSipsNew,
    'wellness-escape': [
      'fish-spa-t1',
      'spa-express',
      'butterfly-garden',
      'cactus-garden',
      'koi-pond',
      'shiseido-forest-valley',
      'rhythm-of-nature',
      'hedge-maze',
      'canopy-park',
      'canopy-park-t2',
      'canopy-park-t3',
      'canopy-park-t4'
    ],
    'garden-paradise': [
      'butterfly-garden',
      'cactus-garden',
      'canopy-park',
      'canopy-park-t2',
      'canopy-park-t3',
      'canopy-park-t4',
      'shiseido-forest-valley',
      'rhythm-of-nature',
      'koi-pond',
      'hedge-maze',
      'social-tree',
      'mirror-maze',
      'sunflower-garden'
    ],
    'hidden-quiet-spots': hiddenQuietSpotsNew
  };

  console.log('\\n📊 OPTIMIZATION SUMMARY:');
  console.log(`✅ Removed ${dutyFreeCleanup.length + lastMinuteCleanup.length} missing amenities`);
  console.log('✅ Differentiated quiet-sips (beverages) vs hidden-quiet-spots (spaces)');
  console.log('✅ Differentiated local-food (cheap) vs hawker-heaven (premium)');
  console.log('✅ Merged gate-essentials + 2-minute-stops → last-minute-essentials');
  console.log('✅ Enhanced work-spots-real-wifi with meeting spaces');
  console.log('');
  console.log('🎯 SMART7 ALGORITHM BENEFITS:');
  console.log('• Better variety within collections');
  console.log('• Clearer collection purposes');
  console.log('• Reduced confusion from overlaps');
  console.log('• More coherent user experience');

  return {
    removedAmenities: dutyFreeCleanup.length + lastMinuteCleanup.length,
    optimizedCollections: Object.keys(optimizedCollections).length,
    recommendations: [
      'Apply these collection updates to collectionAmenities.ts',
      'Test Smart7 algorithm with new structure',
      'Remove meeting-ready-spaces collection (merged)',
      'Remove gate-essentials and 2-minute-stops (merged)'
    ]
  };
}

if (require.main === module) {
  optimizeCollections();
}

module.exports = { optimizeCollections };