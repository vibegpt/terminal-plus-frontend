// Improve vibe tagging for Singapore amenities
// This script analyzes amenity names, categories, and descriptions to assign appropriate vibe tags

const fs = require('fs');
const path = require('path');

// Vibe assignment rules based on keywords and categories
const VIBE_RULES = {
  // REFUEL vibe - Food & Dining
  refuel: {
    categories: ['Food & Beverage', 'Coffee & Snacks', 'Bars & Pubs', 'Food & Drink'],
    keywords: [
      'restaurant', 'cafe', 'coffee', 'starbucks', 'food', 'dining', 'burger', 'pizza',
      'mcdonald', 'kfc', 'subway', 'bakery', 'tea', 'bar', 'pub', 'juice', 'smoothie',
      'dunkin', 'pasta', 'noodle', 'rice', 'chicken', 'beef', 'fish', 'breakfast',
      'lunch', 'dinner', 'snack', 'ice cream', 'donut', 'sandwich', 'salad', 'soup',
      'asian', 'chinese', 'japanese', 'indian', 'thai', 'italian', 'french',
      'hawker', 'dim sum', 'sushi', 'ramen', 'curry', 'satay', 'laksa'
    ],
    types: ['Restaurant', 'Coffee Shop', 'Cafe', 'Bar', 'Fast Food', 'Snacks', 'Tea Boutique']
  },

  // SHOP vibe - Retail & Shopping
  shop: {
    categories: ['Shopping', 'Retail', 'Fashion & Accessories', 'Souvenirs'],
    keywords: [
      'store', 'shop', 'retail', 'boutique', 'fashion', 'clothing', 'accessories',
      'watch', 'jewelry', 'perfume', 'cosmetics', 'electronics', 'duty free',
      'souvenir', 'gift', 'brand', 'luxury', 'designer', 'bags', 'shoes',
      'sunglasses', 'pharmacy', 'drugstore', 'bookstore', 'toys', 'sports'
    ],
    types: ['Store', 'Retail', 'Fashion', 'Electronics', 'Pharmacy', 'Bookstore']
  },

  // COMFORT vibe - Wellness, Spa, Premium services
  comfort: {
    categories: ['Wellness', 'Spa', 'Hotels & Accommodations', 'Lounges'],
    keywords: [
      'spa', 'massage', 'wellness', 'relaxation', 'lounge', 'premium', 'first class',
      'business class', 'hotel', 'accommodation', 'sleep', 'rest', 'shower',
      'quiet', 'peaceful', 'comfort', 'luxury', 'vip', 'private', 'exclusive'
    ],
    types: ['Spa', 'Wellness', 'Lounge', 'Hotel', 'Premium Service']
  },

  // CHILL vibe - Gardens, Quiet spaces, Relaxation
  chill: {
    categories: ['Garden', 'Green Space', 'Rest Areas', 'Parks'],
    keywords: [
      'garden', 'park', 'green', 'nature', 'outdoor', 'seating', 'quiet zone',
      'meditation', 'peaceful', 'tranquil', 'relaxing', 'butterfly', 'orchid',
      'tree', 'plant', 'zen', 'calm', 'silence', 'reading', 'lounge'
    ],
    types: ['Garden', 'Park', 'Green Area', 'Seating Area', 'Rest Area']
  },

  // DISCOVER vibe - Attractions, Art, Entertainment
  discover: {
    categories: ['Attraction', 'Art & Culture', 'Entertainment', 'Experiences'],
    keywords: [
      'attraction', 'art', 'sculpture', 'installation', 'museum', 'gallery',
      'entertainment', 'slide', 'playground', 'interactive', 'experience',
      'cinema', 'movie', 'theater', 'show', 'exhibition', 'cultural',
      'heritage', 'unique', 'instagram', 'photo', 'maze', 'waterfall',
      'fountain', 'light show', 'kinetic', 'digital', 'virtual'
    ],
    types: ['Attraction', 'Art Installation', 'Entertainment', 'Interactive', 'Cinema']
  },

  // WORK vibe - Business services, WiFi, Charging
  work: {
    categories: ['Business Services', 'Information', 'Technology'],
    keywords: [
      'business', 'meeting', 'conference', 'wifi', 'internet', 'charging',
      'workstation', 'desk', 'computer', 'office', 'productivity', 'quiet',
      'study', 'work', 'laptop', 'phone', 'power', 'outlet', 'business center'
    ],
    types: ['Business Center', 'Information', 'Technology', 'Charging Station']
  },

  // QUICK vibe - Fast services, Convenience, 24/7
  quick: {
    categories: ['Services', 'Convenience', 'Information'],
    keywords: [
      'atm', 'bank', 'currency', 'exchange', 'quick', 'fast', 'express',
      'convenience', '24/7', 'grab', 'go', 'vending', 'machine', 'self-service',
      'instant', 'automatic', 'service', 'information', 'help', 'assistance',
      'pharmacy', 'medical', 'first aid', 'emergency'
    ],
    types: ['Service', 'ATM', 'Information', 'Convenience', 'Medical', 'Currency Exchange']
  }
};

// Function to analyze text for vibe keywords
function analyzeTextForVibes(text) {
  if (!text) return [];

  const lowerText = text.toLowerCase();
  const vibes = [];

  for (const [vibe, rules] of Object.entries(VIBE_RULES)) {
    // Check keywords
    if (rules.keywords.some(keyword => lowerText.includes(keyword))) {
      vibes.push(vibe);
    }
  }

  return vibes;
}

// Function to get vibes based on category and type
function getVibesFromCategory(category, type) {
  const vibes = [];

  for (const [vibe, rules] of Object.entries(VIBE_RULES)) {
    // Check categories
    if (rules.categories.some(cat =>
      category && category.toLowerCase().includes(cat.toLowerCase())
    )) {
      vibes.push(vibe);
    }

    // Check types
    if (rules.types && rules.types.some(t =>
      type && type.toLowerCase().includes(t.toLowerCase())
    )) {
      vibes.push(vibe);
    }
  }

  return vibes;
}

// Special cases for multi-vibe amenities
function getSpecialVibes(name, category, type, description) {
  const vibes = new Set();
  const lowerName = (name || '').toLowerCase();
  const lowerDesc = (description || '').toLowerCase();
  const combined = `${lowerName} ${lowerDesc}`;

  // Lounges get multiple vibes
  if (combined.includes('lounge')) {
    vibes.add('comfort');
    vibes.add('chill');
    vibes.add('work'); // Many lounges have business facilities
    if (combined.includes('food') || combined.includes('dining')) {
      vibes.add('refuel');
    }
  }

  // Coffee shops get multiple vibes
  if (combined.includes('coffee') || combined.includes('starbucks') || combined.includes('cafe')) {
    vibes.add('refuel');
    vibes.add('work'); // WiFi and work-friendly
    if (combined.includes('quick') || combined.includes('grab')) {
      vibes.add('quick');
    }
  }

  // Gardens and parks
  if (combined.includes('garden') || combined.includes('park') || combined.includes('green')) {
    vibes.add('chill');
    vibes.add('discover'); // Often interesting/unique
  }

  // Attractions and entertainment
  if (combined.includes('slide') || combined.includes('maze') || combined.includes('playground')) {
    vibes.add('discover');
    vibes.add('chill'); // Relaxing activities
  }

  // Shopping areas with food
  if (category === 'Shopping' && (combined.includes('food') || combined.includes('court'))) {
    vibes.add('shop');
    vibes.add('refuel');
  }

  // Premium/luxury items
  if (combined.includes('luxury') || combined.includes('premium') || combined.includes('exclusive')) {
    vibes.add('shop');
    vibes.add('comfort');
  }

  return Array.from(vibes);
}

// Capitalize first letter of vibe for consistency
function capitalizeVibe(vibe) {
  const vibeMap = {
    'refuel': 'Refuel',
    'shop': 'Shop',
    'comfort': 'Comfort',
    'chill': 'Chill',
    'discover': 'Discover',
    'work': 'Work',
    'quick': 'Quick'
  };
  return vibeMap[vibe] || vibe;
}

async function improveVibeTagging() {
  console.log('🎯 Starting vibe tagging improvement...');

  const filePath = path.join(__dirname, '../src/data/amenities.json');
  const amenities = JSON.parse(fs.readFileSync(filePath, 'utf8'));

  let improvedCount = 0;
  let emptyVibeCount = 0;

  amenities.forEach(amenity => {
    const originalVibes = amenity.vibe_tags || [];
    const newVibes = new Set(originalVibes);

    // Check if amenity has no vibe tags
    if (originalVibes.length === 0) {
      emptyVibeCount++;
    }

    // Get vibes from category and type
    const categoryVibes = getVibesFromCategory(amenity.category, amenity.amenity_type);
    categoryVibes.forEach(vibe => newVibes.add(capitalizeVibe(vibe)));

    // Get vibes from name analysis
    const nameVibes = analyzeTextForVibes(amenity.name);
    nameVibes.forEach(vibe => newVibes.add(capitalizeVibe(vibe)));

    // Get vibes from description analysis
    const descVibes = analyzeTextForVibes(amenity.description);
    descVibes.forEach(vibe => newVibes.add(capitalizeVibe(vibe)));

    // Apply special multi-vibe rules
    const specialVibes = getSpecialVibes(amenity.name, amenity.category, amenity.amenity_type, amenity.description);
    specialVibes.forEach(vibe => newVibes.add(capitalizeVibe(vibe)));

    // Update if vibes changed
    const finalVibes = Array.from(newVibes);
    if (finalVibes.length !== originalVibes.length ||
        !finalVibes.every(vibe => originalVibes.includes(vibe))) {
      amenity.vibe_tags = finalVibes;
      improvedCount++;
    }

    // Ensure at least one vibe tag (fallback based on category)
    if (amenity.vibe_tags.length === 0) {
      // Fallback assignment
      if (amenity.category && amenity.category.toLowerCase().includes('shopping')) {
        amenity.vibe_tags = ['Shop'];
      } else if (amenity.category && amenity.category.toLowerCase().includes('food')) {
        amenity.vibe_tags = ['Refuel'];
      } else if (amenity.category && amenity.category.toLowerCase().includes('attraction')) {
        amenity.vibe_tags = ['Discover'];
      } else {
        amenity.vibe_tags = ['Quick']; // Default fallback
      }
      improvedCount++;
    }
  });

  // Write improved data
  fs.writeFileSync(filePath, JSON.stringify(amenities, null, 2));

  // Generate new summary
  const vibeCounts = {};
  amenities.forEach(amenity => {
    if (Array.isArray(amenity.vibe_tags)) {
      amenity.vibe_tags.forEach(vibe => {
        vibeCounts[vibe] = (vibeCounts[vibe] || 0) + 1;
      });
    }
  });

  console.log('\n📊 VIBE TAGGING IMPROVEMENT SUMMARY:');
  console.log(`Amenities improved: ${improvedCount}`);
  console.log(`Originally had empty vibe tags: ${emptyVibeCount}`);
  console.log('\nNew Vibe Distribution:');
  Object.entries(vibeCounts).sort((a, b) => b[1] - a[1]).forEach(([vibe, count]) => {
    console.log(`  ${vibe}: ${count} amenities`);
  });

  console.log(`\n✅ Vibe tagging improvement complete!`);
}

// Run the improvement
if (require.main === module) {
  improveVibeTagging().catch(console.error);
}

module.exports = { improveVibeTagging };