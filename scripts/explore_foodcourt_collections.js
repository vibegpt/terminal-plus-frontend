// Explore Food Court as Collections Architecture
// This explores treating food courts as collections with stalls as amenities

const FOOD_COURT_COLLECTION_CONCEPT = {

  // Food Court Collections (new collection type)
  'food-courts': {

    // T1 Basement Food Court broken into cuisine-based collections
    't1-basement-asian-hawker': {
      name: 'T1 Basement - Asian Hawker',
      location: 'Terminal 1, Basement Level (B1)',
      vibe_tags: ['Refuel', 'Quick', 'Discover'], // Multi-vibe!
      collection_type: 'food_court',
      parent_location: 'T1 Basement Food Court',
      amenities: [
        {
          name: 'Uncle Chicken Rice Stall',
          slug: 't1-basement-chicken-rice',
          cuisine: 'Singaporean',
          specialty: 'Hainanese Chicken Rice',
          price_range: '$3-6',
          vibe_tags: ['Refuel', 'Quick']
        },
        {
          name: 'Laksa Corner',
          slug: 't1-basement-laksa',
          cuisine: 'Malaysian-Singaporean',
          specialty: 'Laksa, Curry Mee',
          price_range: '$4-7',
          vibe_tags: ['Refuel', 'Discover']
        },
        {
          name: 'Char Kway Teow Uncle',
          slug: 't1-basement-char-kway-teow',
          cuisine: 'Malaysian-Chinese',
          specialty: 'Char Kway Teow, Wok Hei',
          price_range: '$4-6',
          vibe_tags: ['Refuel', 'Quick']
        },
        {
          name: 'Indian Curry Stall',
          slug: 't1-basement-indian-curry',
          cuisine: 'Indian',
          specialty: 'Curry, Biryani, Roti',
          price_range: '$5-8',
          vibe_tags: ['Refuel', 'Comfort']
        },
        {
          name: 'Bak Kut Teh Corner',
          slug: 't1-basement-bak-kut-teh',
          cuisine: 'Chinese-Singaporean',
          specialty: 'Pork Rib Soup',
          price_range: '$6-10',
          vibe_tags: ['Refuel', 'Comfort']
        }
      ]
    },

    't1-basement-western-fusion': {
      name: 'T1 Basement - Western & Fusion',
      location: 'Terminal 1, Basement Level (B1)',
      vibe_tags: ['Refuel', 'Quick'],
      collection_type: 'food_court',
      parent_location: 'T1 Basement Food Court',
      amenities: [
        {
          name: 'Pasta Express Stall',
          slug: 't1-basement-pasta-express',
          cuisine: 'Italian',
          specialty: 'Carbonara, Aglio Olio',
          price_range: '$7-12',
          vibe_tags: ['Refuel', 'Quick']
        },
        {
          name: 'Western Grill Corner',
          slug: 't1-basement-western-grill',
          cuisine: 'Western',
          specialty: 'Chicken Chop, Fish & Chips',
          price_range: '$8-15',
          vibe_tags: ['Refuel', 'Comfort']
        },
        {
          name: 'Korean Fusion Stall',
          slug: 't1-basement-korean-fusion',
          cuisine: 'Korean-Fusion',
          specialty: 'Korean Fried Chicken, Bibimbap',
          price_range: '$8-14',
          vibe_tags: ['Refuel', 'Discover']
        }
      ]
    },

    // T2 Staff Canteen
    't2-staff-canteen-local': {
      name: 'T2 Staff Canteen - Local Hawker',
      location: 'Terminal 2, 3rd Floor',
      vibe_tags: ['Refuel', 'Quick', 'Discover'], // The "hidden gem" factor
      collection_type: 'food_court',
      parent_location: 'T2 Staff Canteen',
      features: ['Budget-friendly', 'Authentic local food', 'Staff prices', 'Cash only'],
      amenities: [
        {
          name: 'Economic Rice Stall',
          slug: 't2-canteen-economic-rice',
          cuisine: 'Chinese-Singaporean',
          specialty: 'Cai Fan (Economic Rice)',
          price_range: '$3-5',
          vibe_tags: ['Refuel', 'Quick']
        },
        {
          name: 'Mee Rebus Uncle',
          slug: 't2-canteen-mee-rebus',
          cuisine: 'Malay',
          specialty: 'Mee Rebus, Mee Siam',
          price_range: '$3-5',
          vibe_tags: ['Refuel', 'Discover']
        },
        {
          name: 'Fish Soup Stall',
          slug: 't2-canteen-fish-soup',
          cuisine: 'Chinese-Singaporean',
          specialty: 'Sliced Fish Soup, Fish Bee Hoon',
          price_range: '$4-6',
          vibe_tags: ['Refuel', 'Comfort']
        },
        {
          name: 'Wanton Mee Corner',
          slug: 't2-canteen-wanton-mee',
          cuisine: 'Chinese',
          specialty: 'Wanton Mee, Char Siu',
          price_range: '$3-5',
          vibe_tags: ['Refuel', 'Quick']
        }
      ]
    },

    // T3 Basement Food Court
    't3-basement-international': {
      name: 'T3 Basement - International Food Court',
      location: 'Terminal 3, Basement 2',
      vibe_tags: ['Refuel', 'Quick', 'Shop'],
      collection_type: 'food_court',
      parent_location: 'T3 Basement Food Court',
      amenities: [
        {
          name: 'Japanese Teriyaki Stall',
          slug: 't3-basement-japanese-teriyaki',
          cuisine: 'Japanese',
          specialty: 'Teriyaki Chicken, Salmon Set',
          price_range: '$7-12',
          vibe_tags: ['Refuel', 'Quick']
        },
        {
          name: 'Thai Express Counter',
          slug: 't3-basement-thai-express',
          cuisine: 'Thai',
          specialty: 'Pad Thai, Green Curry',
          price_range: '$6-10',
          vibe_tags: ['Refuel', 'Quick']
        },
        {
          name: 'Korean BBQ Bowl',
          slug: 't3-basement-korean-bbq',
          cuisine: 'Korean',
          specialty: 'Bulgogi Bowl, Kimchi Fried Rice',
          price_range: '$8-12',
          vibe_tags: ['Refuel', 'Discover']
        },
        {
          name: 'Vietnamese Pho Corner',
          slug: 't3-basement-vietnamese-pho',
          cuisine: 'Vietnamese',
          specialty: 'Pho Bo, Banh Mi',
          price_range: '$6-9',
          vibe_tags: ['Refuel', 'Comfort']
        }
      ]
    }
  }
};

// How this would work in the collection system
const UPDATED_COLLECTION_ARCHITECTURE = {

  // Regular collections (existing)
  'comfort': ['lounge-life', 'sleep-pods', 'spa-wellness'],
  'chill': ['hidden-quiet-spots', 'garden-paradise'],

  // Refuel now includes food court collections
  'refuel': [
    'coffee-worth-walk',
    'local-food-real-prices',
    'fine-dining-changi',
    // NEW: Food court collections
    't1-basement-asian-hawker',
    't1-basement-western-fusion',
    't2-staff-canteen-local',
    't3-basement-international'
  ],

  'quick': [
    'grab-and-go',
    '24-7-heroes',
    // NEW: Same food courts appear in Quick vibe too!
    't1-basement-asian-hawker', // Multi-vibe!
    't2-staff-canteen-local',
    't3-basement-international'
  ],

  'discover': [
    'only-at-changi',
    'hidden-gems',
    // NEW: Staff canteen as "hidden gem"
    't2-staff-canteen-local', // The Anthony Bourdain experience!
    't1-basement-western-fusion' // Fusion cuisine discovery
  ]
};

const SMART7_EXAMPLES = {
  scenario_1: {
    user_context: "Quick lunch, Terminal 1, 30 minutes before boarding",
    vibe_selected: "Quick",
    collections_shown: [
      "24-7-heroes",
      "grab-and-go",
      "t1-basement-asian-hawker"  // Food court collection!
    ],
    smart7_from_t1_basement: [
      "Uncle Chicken Rice Stall ($3-6)",
      "Char Kway Teow Uncle ($4-6)",
      "Laksa Corner ($4-7)",
      "Bak Kut Teh Corner ($6-10)",
      "Indian Curry Stall ($5-8)",
      // Algorithm picks 7 from 8 available stalls
    ]
  },

  scenario_2: {
    user_context: "Food discovery, Terminal 2, long layover",
    vibe_selected: "Discover",
    collections_shown: [
      "hidden-gems",
      "t2-staff-canteen-local" // The secret staff canteen!
    ],
    smart7_from_t2_canteen: [
      "Economic Rice Stall ($3-5) - Authentic staff prices",
      "Mee Rebus Uncle ($3-5) - Local specialty",
      "Fish Soup Stall ($4-6) - Comfort food",
      "Wanton Mee Corner ($3-5) - Traditional style"
      // Shows 4 from 4 available stalls
    ]
  }
};

console.log('🍽️ FOOD COURT AS COLLECTIONS ARCHITECTURE');
console.log('==========================================');

console.log('\n📋 COLLECTION BENEFITS:');
console.log('✅ Food courts naturally group related dining options');
console.log('✅ Stalls become individual amenities with specific details');
console.log('✅ Multi-vibe mapping (same food court in Refuel + Quick + Discover)');
console.log('✅ Scalable (start with major food courts, add stalls gradually)');
console.log('✅ User-friendly ("Browse T1 Food Court Asian section")');
console.log('✅ Smart7 can pick 7 stalls from 10-15 in each food court');

console.log('\n🎯 MVP APPROACH:');
console.log('1. Convert 3 main food courts to collections');
console.log('2. Research 5-8 key stalls per food court');
console.log('3. Organize by cuisine type (Asian, Western, International)');
console.log('4. Allow food court collections in multiple vibes');
console.log('5. Keep standalone restaurants as regular amenities');

console.log('\n📊 DATA STRUCTURE:');
console.log('Food Court Collection = 8-12 stall amenities');
console.log('Smart7 shows 7 stalls from the collection');
console.log('Each stall has: name, cuisine, specialty, price, vibe tags');

console.log('\n🚀 IMPLEMENTATION COMPLEXITY:');
console.log('Medium - Need to research individual stalls');
console.log('But provides much richer, more targeted recommendations!');

module.exports = {
  FOOD_COURT_COLLECTION_CONCEPT,
  UPDATED_COLLECTION_ARCHITECTURE,
  SMART7_EXAMPLES
};