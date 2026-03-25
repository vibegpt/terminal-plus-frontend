// Comprehensive Changi Airport F&B scraper
// Combines multiple sources to build complete dining database

const fs = require('fs');
const path = require('path');

// Manual data from research - will build on this with web scraping
const MANUAL_DINING_DATA = {
  'T1': [
    {
      name: 'Heavenly Wang',
      slug: 'heavenly-wang-t1',
      terminal_code: 'SIN-T1',
      category: 'Food & Beverage',
      amenity_type: 'Local Cuisine',
      cuisine: 'Singaporean',
      vibe_tags: ['Refuel', 'Quick'],
      description: 'Local Singaporean breakfast specialties',
      signature_dishes: ['Curry Chicken Rice Set ($10.50)', 'Laksa Set ($12)'],
      operating_hours: '24 hours',
      features: ['24-hour operation']
    },
    {
      name: 'Jamba',
      slug: 'jamba-t1',
      terminal_code: 'SIN-T1',
      category: 'Food & Beverage',
      amenity_type: 'Smoothies & Health Food',
      cuisine: 'Health Food',
      vibe_tags: ['Refuel', 'Quick', 'Comfort'],
      description: "Singapore's first Jamba outlet offering healthy drinks and bowls",
      signature_dishes: ['Mango-A-Go-Go', 'Nutty Almond Butter Bowl'],
      features: ['Healthy options', 'Vegetarian-friendly']
    },
    {
      name: 'Pontian Wanton Noodle',
      slug: 'pontian-wanton-noodle-t1',
      terminal_code: 'SIN-T1',
      category: 'Food & Beverage',
      amenity_type: 'Noodles',
      cuisine: 'Malaysian',
      vibe_tags: ['Refuel', 'Quick'],
      description: 'Authentic Malaysian-style wonton noodles',
      operating_hours: '24 hours',
      features: ['24-hour operation']
    },
    {
      name: 'Tap + Brew',
      slug: 'tap-brew-t1',
      terminal_code: 'SIN-T1',
      category: 'Food & Beverage',
      amenity_type: 'Pub & Brewery',
      cuisine: 'Western',
      vibe_tags: ['Refuel', 'Discover', 'Comfort'],
      description: 'Craft beer and Western pub food',
      signature_dishes: ['Signature Tap + Brew Wagyu Cheeseburger'],
      operating_hours: '24 hours',
      features: ['24-hour operation', 'Craft beer', 'Western dining']
    },
    {
      name: 'Woke Ramen',
      slug: 'woke-ramen-t1',
      terminal_code: 'SIN-T1',
      category: 'Food & Beverage',
      amenity_type: 'Ramen',
      cuisine: 'Fusion Asian',
      vibe_tags: ['Refuel', 'Discover'],
      description: 'Fusion Chinese-Japanese ramen with unique flavors',
      signature_dishes: ['Chicken Chashu Collagen Ramen', 'Prawn Paste Ramen'],
      operating_hours: '24 hours',
      features: ['24-hour operation', 'Fusion cuisine', 'Unique ramen']
    },
    {
      name: 'Chatterbox Express',
      slug: 'chatterbox-express-t1',
      terminal_code: 'SIN-T1',
      category: 'Food & Beverage',
      amenity_type: 'Local Cuisine',
      cuisine: 'Singaporean',
      vibe_tags: ['Refuel', 'Shop'], // Also shopping brand
      description: 'Famous for Hainanese chicken rice',
      signature_dishes: ['Legendary Mandarin Chicken Rice Set'],
      features: ['Famous Singapore brand', 'Chicken rice specialist']
    },
    {
      name: 'Andes by Astons',
      slug: 'andes-by-astons-t1',
      terminal_code: 'SIN-T1',
      category: 'Food & Beverage',
      amenity_type: 'Western Restaurant',
      cuisine: 'Western',
      vibe_tags: ['Refuel', 'Comfort'],
      description: 'Halal Western restaurant specializing in steaks',
      features: ['Halal certified', 'Steaks specialty', 'Western dining'],
      dining_options: ['Steaks', 'Chicken', 'Seafood', 'Pasta']
    },
    {
      name: 'Saboten',
      slug: 'saboten-t1',
      terminal_code: 'SIN-T1',
      category: 'Food & Beverage',
      amenity_type: 'Japanese Restaurant',
      cuisine: 'Japanese',
      vibe_tags: ['Refuel', 'Comfort'],
      description: 'Japanese restaurant specializing in tonkatsu',
      specialty: 'Tonkatsu',
      features: ['Japanese dining', 'Tonkatsu specialist']
    },
    {
      name: 'Burger King',
      slug: 'burger-king-t1',
      terminal_code: 'SIN-T1',
      category: 'Food & Beverage',
      amenity_type: 'Fast Food',
      cuisine: 'American Fast Food',
      vibe_tags: ['Refuel', 'Quick'],
      description: 'International fast food chain',
      features: ['Fast food', 'International brand']
    },
    {
      name: 'T1 Basement Food Court',
      slug: 't1-basement-food-court',
      terminal_code: 'SIN-T1',
      category: 'Food & Beverage',
      amenity_type: 'Food Court',
      cuisine: 'Multi-cuisine',
      vibe_tags: ['Refuel', 'Quick', 'Shop'],
      description: 'Hidden basement hawker center with authentic local options',
      location_description: 'Basement Level (B1), past Burger King arrival area',
      features: ['Staff canteen', 'Budget-friendly', 'Authentic local food', 'Multiple stalls'],
      cuisine_types: ['Chinese', 'Malay', 'Indian', 'Local Singaporean']
    }
  ],

  'T2': [
    {
      name: 'Hard Rock Cafe',
      slug: 'hard-rock-cafe-t2',
      terminal_code: 'SIN-T2',
      category: 'Food & Beverage',
      amenity_type: 'Themed Restaurant',
      cuisine: 'American',
      vibe_tags: ['Refuel', 'Discover', 'Comfort'],
      description: 'Iconic rock and roll themed restaurant',
      signature_dishes: ['Legendary Steak Burgers', 'Baby Back Ribs'],
      features: ['Live music memorabilia', 'Popular cocktails', 'Rock theme']
    },
    {
      name: 'GOPIZZA',
      slug: 'gopizza-t2',
      terminal_code: 'SIN-T2',
      category: 'Food & Beverage',
      amenity_type: 'Pizza',
      cuisine: 'Korean-Italian',
      vibe_tags: ['Refuel', 'Quick'],
      description: 'Korean pizza chain with unique flavors',
      features: ['Korean chain', 'Individual sized pizzas']
    },
    {
      name: 'Hudsons Coffee',
      slug: 'hudsons-coffee-t2',
      terminal_code: 'SIN-T2',
      category: 'Food & Beverage',
      amenity_type: 'Coffee Shop',
      cuisine: 'Coffee & Light Meals',
      vibe_tags: ['Refuel', 'Work', 'Quick'],
      description: 'Australian coffee house chain',
      features: ['Premium coffee', 'Australian brand']
    },
    {
      name: 'Boost Juice',
      slug: 'boost-juice-t2',
      terminal_code: 'SIN-T2',
      category: 'Food & Beverage',
      amenity_type: 'Juice & Smoothies',
      cuisine: 'Health Drinks',
      vibe_tags: ['Refuel', 'Quick', 'Comfort'],
      description: 'Fresh juice and smoothie bar',
      features: ['Healthy drinks', 'Fresh juices', 'Smoothies']
    },
    {
      name: "Dunkin'",
      slug: 'dunkin-t2',
      terminal_code: 'SIN-T2',
      category: 'Food & Beverage',
      amenity_type: 'Coffee & Donuts',
      cuisine: 'American Coffee Shop',
      vibe_tags: ['Refuel', 'Quick'],
      description: 'Coffee and donuts chain',
      features: ['Donuts', 'Coffee', 'Quick service']
    },
    {
      name: 'Café O',
      slug: 'cafe-o-t2',
      terminal_code: 'SIN-T2',
      category: 'Food & Beverage',
      amenity_type: 'Local Café',
      cuisine: 'Local Fusion',
      vibe_tags: ['Refuel', 'Discover'],
      description: 'Local café featuring unique prata flatbread delights',
      specialty: 'Prata flatbread',
      features: ['Local brand', 'Unique prata dishes']
    },
    {
      name: "Baker's Well",
      slug: 'bakers-well-t2',
      terminal_code: 'SIN-T2',
      category: 'Food & Beverage',
      amenity_type: 'Bakery',
      cuisine: 'Peranakan',
      vibe_tags: ['Refuel', 'Shop', 'Discover'],
      description: 'Authentic Peranakan confectionery and baked goods',
      specialty: 'Peranakan pastries',
      features: ['Heritage recipes', 'Traditional Peranakan', 'Local specialty']
    },
    {
      name: 'Swee Choon',
      slug: 'swee-choon-t2',
      terminal_code: 'SIN-T2',
      category: 'Food & Beverage',
      amenity_type: 'Dim Sum',
      cuisine: 'Chinese',
      vibe_tags: ['Refuel', 'Comfort'],
      description: 'Traditional dim sum restaurant',
      location_description: 'Arrival Hall',
      operating_hours: '24 hours',
      features: ['24-hour operation', 'Traditional dim sum', 'Arrival hall location']
    },
    {
      name: 'T2 Staff Canteen',
      slug: 't2-staff-canteen',
      terminal_code: 'SIN-T2',
      category: 'Food & Beverage',
      amenity_type: 'Food Court',
      cuisine: 'Multi-cuisine',
      vibe_tags: ['Refuel', 'Quick', 'Discover'],
      description: 'Staff canteen with authentic local hawker food',
      location_description: '3rd floor',
      features: ['Staff canteen', 'Budget-friendly', 'Authentic local food', 'Hidden gem'],
      operating_hours: '6AM-10PM',
      payment: 'Cash only'
    }
  ],

  'T3': [
    {
      name: 'Ichikokudo Hokkaido Ramen',
      slug: 'ichikokudo-hokkaido-ramen-t3',
      terminal_code: 'SIN-T3',
      category: 'Food & Beverage',
      amenity_type: 'Ramen',
      cuisine: 'Japanese',
      vibe_tags: ['Refuel', 'Comfort'],
      description: 'Authentic Hokkaido-style ramen',
      features: ['Hokkaido specialty', 'Authentic Japanese ramen']
    },
    {
      name: 'Old Town Express',
      slug: 'old-town-express-t3',
      terminal_code: 'SIN-T3',
      category: 'Food & Beverage',
      amenity_type: 'Malaysian Café',
      cuisine: 'Malaysian',
      vibe_tags: ['Refuel', 'Quick'],
      description: 'Malaysian coffee shop chain',
      features: ['Malaysian heritage', 'Traditional coffee']
    },
    {
      name: "Swensen's",
      slug: 'swensens-t3',
      terminal_code: 'SIN-T3',
      category: 'Food & Beverage',
      amenity_type: 'Ice Cream & American Diner',
      cuisine: 'American',
      vibe_tags: ['Refuel', 'Comfort', 'Discover'],
      description: 'American diner with ice cream specialties',
      features: ['Ice cream sundaes', 'American classics', 'Family-friendly']
    },
    {
      name: 'Ya Kun Family Cafe',
      slug: 'ya-kun-family-cafe-t3',
      terminal_code: 'SIN-T3',
      category: 'Food & Beverage',
      amenity_type: 'Traditional Café',
      cuisine: 'Singaporean',
      vibe_tags: ['Refuel', 'Quick', 'Comfort'],
      description: 'Traditional Singaporean breakfast café',
      specialty: 'Kaya toast',
      features: ['Traditional kaya toast', 'Local heritage brand', 'Kopitiam style']
    },
    {
      name: 'Mr Teh Tarik Express',
      slug: 'mr-teh-tarik-express-t3',
      terminal_code: 'SIN-T3',
      category: 'Food & Beverage',
      amenity_type: 'Indian-Muslim Café',
      cuisine: 'Indian-Muslim',
      vibe_tags: ['Refuel', 'Quick'],
      description: 'Indian-Muslim café serving roti prata and teh tarik',
      specialty: 'Roti prata',
      operating_hours: '24 hours',
      features: ['24-hour operation', 'Halal food', 'Traditional roti prata']
    },
    {
      name: 'Crown Prince Kitchenette',
      slug: 'crown-prince-kitchenette-t3',
      terminal_code: 'SIN-T3',
      category: 'Food & Beverage',
      amenity_type: 'Zi Char',
      cuisine: 'Chinese',
      vibe_tags: ['Refuel', 'Comfort'],
      description: 'Traditional Chinese zi char dishes',
      signature_dishes: ['Signature Seafood Crispy Chao Ta Bee Hoon ($10.80)', 'Honey Pork Rib Cubes with Yam Patties ($16.90)'],
      features: ['Zi char style', 'Seafood specialties']
    },
    {
      name: "McDonald's",
      slug: 'mcdonalds-t3',
      terminal_code: 'SIN-T3',
      category: 'Food & Beverage',
      amenity_type: 'Fast Food',
      cuisine: 'American Fast Food',
      vibe_tags: ['Refuel', 'Quick'],
      description: 'International fast food chain',
      location_description: 'Level 1 Arrival Hall',
      features: ['24-hour operation', 'International brand', 'Fast service']
    },
    {
      name: 'Starbucks',
      slug: 'starbucks-t3',
      terminal_code: 'SIN-T3',
      category: 'Food & Beverage',
      amenity_type: 'Coffee Shop',
      cuisine: 'Coffee & Light Meals',
      vibe_tags: ['Refuel', 'Work', 'Quick'],
      description: 'International coffee chain',
      location_description: 'Level 2 Departure Hall',
      operating_hours: '24 hours',
      features: ['24-hour operation', 'WiFi available', 'Work-friendly']
    },
    {
      name: 'Chengdu Bowl',
      slug: 'chengdu-bowl-t3',
      terminal_code: 'SIN-T3',
      category: 'Food & Beverage',
      amenity_type: 'Sichuan Restaurant',
      cuisine: 'Sichuan',
      vibe_tags: ['Refuel', 'Discover'],
      description: 'Hidden Sichuan restaurant behind an orange vending machine',
      specialty: 'Sichuan grain bowls',
      features: ['Hidden entrance', 'Unique concept', 'Sichuan cuisine']
    },
    {
      name: 'T3 Basement Food Court',
      slug: 't3-basement-food-court',
      terminal_code: 'SIN-T3',
      category: 'Food & Beverage',
      amenity_type: 'Food Court',
      cuisine: 'Multi-cuisine',
      vibe_tags: ['Refuel', 'Quick', 'Shop'],
      description: 'Large food court with multiple cuisine stalls',
      location_description: 'Basement 2',
      cuisine_types: ['Chinese', 'Malay', 'Indian', 'International'],
      features: ['Multiple stalls', 'Affordable dining', 'Wide variety']
    }
  ],

  'T4': [
    {
      name: 'Tiger Den',
      slug: 'tiger-den-t4',
      terminal_code: 'SIN-T4',
      category: 'Food & Beverage',
      amenity_type: 'Bar',
      cuisine: 'Bar & Grill',
      vibe_tags: ['Refuel', 'Discover', 'Comfort'],
      description: 'Chill bar specializing in Tiger Beer variations',
      features: ['Tiger Beer on draught', 'Multiple Tiger Beer varieties'],
      price_range: 'From $17++',
      specialty: 'Tiger Beer'
    },
    {
      name: 'Aji Ichi Sushi Bar',
      slug: 'aji-ichi-sushi-bar-t4',
      terminal_code: 'SIN-T4',
      category: 'Food & Beverage',
      amenity_type: 'Sushi Bar',
      cuisine: 'Japanese',
      vibe_tags: ['Refuel', 'Comfort'],
      description: 'Sushi bar offering fresh sushi and sashimi',
      features: ['Fresh sushi', 'Sashimi selection', 'Counter seating'],
      specialty: 'Sushi & Sashimi'
    },
    {
      name: 'Paris Baguette',
      slug: 'paris-baguette-t4',
      terminal_code: 'SIN-T4',
      category: 'Food & Beverage',
      amenity_type: 'Bakery Café',
      cuisine: 'Korean-French',
      vibe_tags: ['Refuel', 'Quick', 'Shop'],
      description: 'Korean bakery with French-inspired pastries',
      location_description: 'Arrival Hall',
      features: ['Grab-and-go menu', 'French-Korean pastries', 'Bakery items']
    }
  ],

  'JEWEL': [
    {
      name: 'Gwangjang GAON',
      slug: 'gwangjang-gaon-jewel',
      terminal_code: 'SIN-JEWEL',
      category: 'Food & Beverage',
      amenity_type: 'Korean Restaurant',
      cuisine: 'Korean',
      vibe_tags: ['Refuel', 'Comfort', 'Discover'],
      description: "Award-winning Korean restaurant with Korea's Blue Ribbon award",
      features: ['Blue Ribbon award', 'First overseas venture', 'Premium Korean dining'],
      status: 'New 2025 opening'
    },
    {
      name: 'Fish & Co.',
      slug: 'fish-co-jewel',
      terminal_code: 'SIN-JEWEL',
      category: 'Food & Beverage',
      amenity_type: 'Seafood Restaurant',
      cuisine: 'Western Seafood',
      vibe_tags: ['Refuel', 'Comfort'],
      description: 'Seafood-centric Western restaurant with maritime décor',
      specialty: 'Seafood',
      features: ['Maritime theme', 'Western seafood specialties'],
      status: 'New 2025 opening'
    },
    {
      name: 'CHA MULAN',
      slug: 'cha-mulan-jewel',
      terminal_code: 'SIN-JEWEL',
      category: 'Food & Beverage',
      amenity_type: 'Tea House',
      cuisine: 'Chinese Tea',
      vibe_tags: ['Refuel', 'Comfort', 'Work'],
      description: 'Chinese brewed tea as healthier alternative to bubble tea',
      specialty: 'Chinese brewed teas',
      features: ['Healthy tea options', 'Alternative to bubble tea'],
      status: 'New 2025 opening'
    },
    {
      name: 'Tsuta',
      slug: 'tsuta-jewel',
      terminal_code: 'SIN-JEWEL',
      category: 'Food & Beverage',
      amenity_type: 'Michelin Star Ramen',
      cuisine: 'Japanese',
      vibe_tags: ['Refuel', 'Comfort', 'Discover'],
      description: "World's first Michelin-starred ramen restaurant",
      features: ['Michelin star', 'Cross-ordering with Mrs Pho', 'Premium ramen'],
      status: 'New 2025 opening'
    },
    {
      name: 'Mrs Pho',
      slug: 'mrs-pho-jewel',
      terminal_code: 'SIN-JEWEL',
      category: 'Food & Beverage',
      amenity_type: 'Vietnamese Restaurant',
      cuisine: 'Vietnamese',
      vibe_tags: ['Refuel', 'Comfort'],
      description: 'Vietnamese restaurant with cross-ordering from Tsuta',
      specialty: 'Vietnamese pho',
      features: ['Cross-ordering with Tsuta', 'Authentic Vietnamese'],
      status: 'New 2025 opening'
    }
  ]
};

// Function to convert manual data to amenity format
function convertDiningToAmenities() {
  console.log('🍽️ Converting dining data to amenity format...');

  const amenities = [];

  Object.entries(MANUAL_DINING_DATA).forEach(([terminal, restaurants]) => {
    restaurants.forEach(restaurant => {
      const amenity = {
        name: restaurant.name,
        slug: restaurant.slug,
        terminal_code: restaurant.terminal_code,
        airport_code: 'SIN',
        category: restaurant.category,
        amenity_type: restaurant.amenity_type,
        description: restaurant.description || '',
        location_description: restaurant.location_description || '',
        vibe_tags: restaurant.vibe_tags,
        status: 'active',
        available_in_transit: true,
        opening_hours: restaurant.operating_hours ? { 'general': restaurant.operating_hours } : {},
        price_tier: restaurant.price_range || '',
        coordinates: {},
        image_url: '',
        website_url: '',
        booking_required: false,
        source: 'manual_dining_research',

        // Additional F&B specific fields
        cuisine: restaurant.cuisine,
        specialty: restaurant.specialty || '',
        signature_dishes: restaurant.signature_dishes || [],
        features: restaurant.features || [],
        dining_options: restaurant.dining_options || [],
        payment: restaurant.payment || '',
        cuisine_types: restaurant.cuisine_types || []
      };

      amenities.push(amenity);
    });
  });

  return amenities;
}

// Function to merge with existing amenities
function mergeWithExistingAmenities() {
  console.log('🔄 Merging dining data with existing amenities...');

  const existingPath = path.join(__dirname, '../src/data/amenities.json');
  const existing = JSON.parse(fs.readFileSync(existingPath, 'utf8'));
  const newDining = convertDiningToAmenities();

  // Create set of existing slugs
  const existingSlugs = new Set(existing.map(a => a.slug));

  // Add only new dining amenities
  const uniqueNewDining = newDining.filter(dining => !existingSlugs.has(dining.slug));

  // Combine and sort
  const combined = [...existing, ...uniqueNewDining];
  combined.sort((a, b) => {
    if (a.terminal_code !== b.terminal_code) {
      return a.terminal_code.localeCompare(b.terminal_code);
    }
    return a.name.localeCompare(b.name);
  });

  // Write back to file
  fs.writeFileSync(existingPath, JSON.stringify(combined, null, 2));

  console.log(`\n📊 DINING DATA MERGE SUMMARY:`);
  console.log(`Existing amenities: ${existing.length}`);
  console.log(`New dining amenities added: ${uniqueNewDining.length}`);
  console.log(`Total amenities: ${combined.length}`);

  // Show new F&B by terminal
  console.log('\n🍽️ NEW F&B AMENITIES BY TERMINAL:');
  const byTerminal = {};
  uniqueNewDining.forEach(amenity => {
    byTerminal[amenity.terminal_code] = (byTerminal[amenity.terminal_code] || 0) + 1;
  });

  Object.entries(byTerminal).sort().forEach(([terminal, count]) => {
    console.log(`  ${terminal}: +${count} F&B amenities`);
  });

  // Show cuisine breakdown
  console.log('\n🥘 NEW CUISINE TYPES:');
  const cuisines = {};
  uniqueNewDining.forEach(amenity => {
    if (amenity.cuisine) {
      cuisines[amenity.cuisine] = (cuisines[amenity.cuisine] || 0) + 1;
    }
  });

  Object.entries(cuisines).sort((a, b) => b[1] - a[1]).forEach(([cuisine, count]) => {
    console.log(`  ${cuisine}: ${count} restaurants`);
  });

  return combined;
}

// Function to generate updated collection mappings for refuel vibe
function generateRefuelCollections() {
  console.log('📝 Generating updated refuel collection mappings...');

  const amenitiesPath = path.join(__dirname, '../src/data/amenities.json');
  const amenities = JSON.parse(fs.readFileSync(amenitiesPath, 'utf8'));

  // Filter refuel amenities
  const refuelAmenities = amenities.filter(a =>
    Array.isArray(a.vibe_tags) && a.vibe_tags.includes('Refuel')
  );

  console.log(`\n🍽️ TOTAL REFUEL AMENITIES: ${refuelAmenities.length}`);

  // Group by cuisine/type for collection suggestions
  const cuisineGroups = {};
  refuelAmenities.forEach(amenity => {
    const cuisine = amenity.cuisine || amenity.amenity_type || 'Other';
    if (!cuisineGroups[cuisine]) cuisineGroups[cuisine] = [];
    cuisineGroups[cuisine].push(amenity);
  });

  console.log('\n📋 COLLECTION MAPPING SUGGESTIONS:');

  // Coffee & Tea collections
  const coffeeShops = refuelAmenities.filter(a =>
    a.name.toLowerCase().includes('coffee') ||
    a.name.toLowerCase().includes('starbucks') ||
    a.amenity_type?.toLowerCase().includes('coffee') ||
    a.cuisine?.toLowerCase().includes('coffee')
  );

  console.log(`\n☕ COFFEE-WORTH-WALK (${coffeeShops.length} amenities):`);
  coffeeShops.forEach(a => console.log(`  '${a.slug}',`));

  // Local/Singaporean food
  const localFood = refuelAmenities.filter(a =>
    a.cuisine === 'Singaporean' ||
    a.cuisine === 'Malaysian' ||
    a.features?.includes('Local heritage brand') ||
    a.name.toLowerCase().includes('chicken rice') ||
    a.name.toLowerCase().includes('laksa') ||
    a.specialty?.toLowerCase().includes('kaya toast')
  );

  console.log(`\n🇸🇬 LOCAL-FOOD-REAL-PRICES (${localFood.length} amenities):`);
  localFood.forEach(a => console.log(`  '${a.slug}',`));

  // Fast food / Quick options
  const fastFood = refuelAmenities.filter(a =>
    a.amenity_type === 'Fast Food' ||
    a.vibe_tags?.includes('Quick') ||
    a.features?.includes('Fast service') ||
    a.name.toLowerCase().includes("mcdonald's") ||
    a.name.toLowerCase().includes('burger king')
  );

  console.log(`\n⚡ GRAB-AND-GO (${fastFood.length} amenities):`);
  fastFood.forEach(a => console.log(`  '${a.slug}',`));

  // Food courts
  const foodCourts = refuelAmenities.filter(a =>
    a.amenity_type === 'Food Court' ||
    a.name.toLowerCase().includes('food court') ||
    a.features?.includes('Multiple stalls')
  );

  console.log(`\n🏪 HAWKER-HEAVEN (${foodCourts.length} amenities):`);
  foodCourts.forEach(a => console.log(`  '${a.slug}',`));

  // Fine dining / Comfort dining
  const fineDining = refuelAmenities.filter(a =>
    a.vibe_tags?.includes('Comfort') ||
    a.features?.includes('Michelin star') ||
    a.features?.includes('Premium') ||
    a.amenity_type?.includes('Restaurant') ||
    a.price_range?.includes('$$$')
  );

  console.log(`\n🍽️ FINE-DINING-DELIGHTS (${fineDining.length} amenities):`);
  fineDining.forEach(a => console.log(`  '${a.slug}',`));

  return refuelAmenities;
}

// Main execution
async function scrapeDiningData() {
  try {
    console.log('🚀 Starting comprehensive Changi Airport dining data collection...');

    // Step 1: Merge manual research data
    const updatedAmenities = mergeWithExistingAmenities();

    // Step 2: Generate collection mappings
    generateRefuelCollections();

    console.log('\n✅ Dining data collection complete!');
    console.log('📁 Updated amenities.json with comprehensive F&B data');

  } catch (error) {
    console.error('❌ Error in dining data collection:', error);
  }
}

if (require.main === module) {
  scrapeDiningData();
}

module.exports = {
  MANUAL_DINING_DATA,
  convertDiningToAmenities,
  mergeWithExistingAmenities,
  generateRefuelCollections
};