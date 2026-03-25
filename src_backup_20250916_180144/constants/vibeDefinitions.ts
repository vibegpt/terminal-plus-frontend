// Updated Vibe Definitions with Collection Navigation
// Clean vibe cards that lead to collections, then to amenities

export interface VibeDefinition {
  slug: string;
  name: string;
  subtitle: string;
  emoji: string;
  gradient: string;
  collections: string[];
  description?: string;
}

export const VIBES: VibeDefinition[] = [
  {
    slug: 'discover',
    name: 'Discover',
    subtitle: 'Unique experiences',
    emoji: '🔍',
    gradient: 'from-purple-500 to-pink-500',
    collections: ['hidden-gems', 'instagram-hotspots', 'jewel-wonders', 'art-culture', 'only-at-changi'],
    description: 'Find amazing attractions and hidden gems at Changi Airport'
  },
  {
    slug: 'chill',
    name: 'Chill',
    subtitle: 'Easy-going vibes',
    emoji: '😌',
    gradient: 'from-blue-400 to-cyan-400',
    collections: ['coffee-casual', 'garden-vibes', 'social-lounges', 'chill-bars', 'quiet-corners'],
    description: 'Relaxed spots to unwind and put your feet up'
  },
  {
    slug: 'comfort',
    name: 'Comfort',
    subtitle: 'Premium rest & wellness',
    emoji: '🛏️',
    gradient: 'from-indigo-500 to-purple-500',
    collections: ['sleep-solutions', 'spa-wellness', 'premium-lounges', 'quiet-sanctuaries', 'day-rooms'],
    description: 'Premium comfort, sleep, and wellness experiences'
  },
  {
    slug: 'shop',
    name: 'Shop',
    subtitle: 'Retail therapy',
    emoji: '🛍️',
    gradient: 'from-blue-500 to-cyan-500',
    collections: ['luxury-boulevard', 'duty-free-deals', 'singapore-souvenirs', 'tech-gadgets', 'fashion-forward'],
    description: 'Find the perfect souvenirs and luxury items'
  },
  {
    slug: 'refuel',
    name: 'Refuel',
    subtitle: 'Food & drinks',
    emoji: '🍜',
    gradient: 'from-orange-500 to-red-500',
    collections: ['hawker-heaven', 'local-eats', 'quick-bites', 'coffee-chill', 'fine-dining'],
    description: 'Satisfy your hunger with local and international cuisine'
  },
  {
    slug: 'work',
    name: 'Work',
    subtitle: 'Productivity zones',
    emoji: '💼',
    gradient: 'from-gray-600 to-gray-800',
    collections: ['business-lounges', 'meeting-rooms', 'charging-stations', 'wifi-zones', 'quiet-workspaces'],
    description: 'Stay productive with dedicated work spaces and business facilities'
  },
  {
    slug: 'quick',
    name: 'Quick',
    subtitle: 'Time-pressed options',
    emoji: '⚡',
    gradient: 'from-yellow-400 to-amber-400',
    collections: ['grab-and-go', '5-minute-stops', 'gate-essentials', 'express-services', 'quick-charge'],
    description: 'Fast solutions when you\'re short on time'
  }
];

// Collection definitions for each vibe
export const COLLECTION_MAPPINGS = {
  discover: {
    'hidden-gems': {
      name: 'Hidden Gems 💎',
      subtitle: 'Secret spots locals love',
      emoji: '💎',
      gradient: 'from-purple-400 to-pink-600',
      amenities: [
        'rooftop-cactus-garden',
        'heritage-zone',
        'prayer-room-garden',
        'staff-canteen',
        'viewing-mall',
        'transit-hotel-pool',
        'basement-food-court',
        'orchid-garden',
        'koi-pond',
        'meditation-corner',
        'secret-library',
        'hidden-terrace',
        'local-art-corner',
        'vintage-arcade',
        'retro-cinema',
        'underground-market',
        'rooftop-bar',
        'secret-garden-cafe'
      ]
    },
    'instagram-hotspots': {
      name: 'Instagram Hotspots 📸',
      subtitle: 'Picture-perfect moments',
      emoji: '📸',
      gradient: 'from-pink-400 to-rose-600',
      amenities: [
        'rain-vortex',
        'social-tree',
        'butterfly-garden',
        'sunflower-garden',
        'kinetic-rain',
        'light-installations',
        'mirror-maze',
        'canopy-park',
        'shiseido-forest',
        'topiary-walk',
        'orchid-garden-photo-spot',
        'neon-tunnel',
        'infinity-mirror-room',
        'color-changing-walkway',
        'floating-gardens',
        'crystal-dome',
        'led-waterfall',
        'holographic-display',
        'sky-bridge-viewpoint',
        'glass-floor-observatory',
        'sunset-deck',
        'morning-mist-garden'
      ]
    },
    'jewel-wonders': {
      name: 'Jewel Wonders 💎',
      subtitle: 'Architectural marvels',
      emoji: '💎',
      gradient: 'from-blue-400 to-cyan-600',
      amenities: [
        'rain-vortex',
        'canopy-park',
        'shiseido-forest-valley',
        'hedge-maze',
        'sky-nets',
        'foggy-bowls',
        'discovery-slides',
        'canopy-bridge',
        'topiary-walk',
        'petal-garden',
        'walking-trail',
        'bouncing-nets',
        'glass-bottom-bridge'
      ]
    },
    'art-culture': {
      name: 'Art & Culture 🎨',
      subtitle: 'Creative expressions & heritage',
      emoji: '🎨',
      gradient: 'from-purple-400 to-indigo-600',
      amenities: [
        'kinetic-rain',
        'social-tree',
        'heritage-zone',
        'peranakan-gallery',
        'cultural-performances',
        'art-installations',
        'music-stage',
        'sculpture-collection',
        'local-artists-showcase',
        'heritage-exhibits',
        'batik-workshop',
        'calligraphy-corner',
        'pottery-display',
        'traditional-music-zone',
        'cultural-film-screening',
        'art-history-exhibit',
        'rotating-gallery',
        'street-art-wall',
        'digital-art-space',
        'vr-heritage-tour'
      ]
    },
    'only-at-changi': {
      name: 'Only at Changi ✨',
      subtitle: 'Experiences you won\'t find anywhere else',
      emoji: '✨',
      gradient: 'from-amber-400 to-orange-600',
      amenities: [
        'butterfly-garden',
        'movie-theater',
        'swimming-pool',
        'slide-t3',
        'gaming-lounge',
        'enchanted-garden',
        'kinetic-rain',
        'social-tree',
        'heritage-zone',
        'changi-experience-studio',
        'rooftop-jacuzzi',
        'cactus-dome',
        'orchid-paradise',
        'koi-feeding',
        'sunflower-maze'
      ]
    }
  },
  chill: {
    'coffee-casual': {
      name: 'Coffee & Casual ☕',
      subtitle: 'Relaxed cafes and easy-going spots',
      emoji: '☕',
      gradient: 'from-amber-400 to-brown-600',
      amenities: [
        'starbucks',
        'coffee-bean',
        'local-coffee',
        'teh-tarik-stall',
        'yakun-kaya-toast',
        'pacific-coffee',
        'mcdonalds-mccafe',
        'delifrance',
        'paris-baguette',
        'bengawan-solo',
        'toast-box',
        'old-town-white-coffee',
        'huggs-coffee',
        'bacha-coffee',
        'tim-hortons',
        'costa-coffee',
        'peets-coffee',
        'blue-bottle',
        'coffee-lab',
        'local-roasters',
        'tea-chapter',
        'bober-tea'
      ]
    },
    'garden-vibes': {
      name: 'Garden Vibes 🌿',
      subtitle: 'Outdoor seating and natural spaces',
      emoji: '🌿',
      gradient: 'from-green-400 to-emerald-600',
      amenities: [
        'cactus-garden',
        'sunflower-garden',
        'orchid-garden',
        'butterfly-garden',
        'outdoor-plaza',
        'rooftop-garden',
        'viewing-deck',
        'transit-area-gardens',
        'alfresco-dining',
        'garden-benches',
        'lily-pond',
        'bamboo-grove',
        'herb-garden',
        'zen-corner',
        'picnic-area'
      ]
    },
    'social-lounges': {
      name: 'Social Lounges 🛋️',
      subtitle: 'Casual pay lounges and social spaces',
      emoji: '🛋️',
      gradient: 'from-blue-400 to-indigo-600',
      amenities: [
        'plaza-premium-lounge',
        'sats-lounge',
        'pay-per-use-lounge',
        'ambassador-lounge',
        'haven-lounge',
        'lounge-@-t1',
        'lounge-@-t2',
        'lounge-@-t3',
        'lounge-@-t4',
        'jewel-lounge',
        'blossom-lounge',
        'tfg-lounge'
      ]
    },
    'chill-bars': {
      name: 'Chill Bars 🍺',
      subtitle: 'Laid-back drinks and pub vibes',
      emoji: '🍺',
      gradient: 'from-orange-400 to-amber-600',
      amenities: [
        'tiger-tavern',
        'carlsberg-bar',
        'heineken-bar',
        'wine-bar',
        'cocktail-lounge',
        'sports-bar',
        'harrys-bar',
        'brewerkz',
        'little-island-brewing',
        'beer-garden',
        'sunset-bar',
        'craft-beer-corner',
        'whiskey-lounge',
        'sake-bar',
        'rooftop-drinks',
        'poolside-bar',
        'tapas-bar'
      ]
    },
    'quiet-corners': {
      name: 'Quiet Corners 🤫',
      subtitle: 'Peaceful spots to decompress',
      emoji: '🤫',
      gradient: 'from-purple-400 to-indigo-600',
      amenities: [
        'quiet-zone-t1',
        'quiet-zone-t2',
        'quiet-zone-t3',
        'quiet-zone-t4',
        'reading-corner',
        'library-lounge',
        'meditation-space',
        'prayer-room'
      ]
    }
  },
  comfort: {
    'sleep-solutions': {
      name: 'Sleep Solutions 😴',
      subtitle: 'Pods, beds, and proper rest',
      emoji: '😴',
      gradient: 'from-indigo-500 to-purple-600',
      amenities: [
        'snooze-lounge',
        'sleep-pods',
        'aerotel',
        'crowne-plaza',
        'yotel',
        'transit-hotel',
        'rest-area',
        'nap-zone',
        'overnight-lounge',
        'day-room',
        'cocoon-pods',
        'minute-suites',
        'sleepbox',
        'napcabs'
      ]
    },
    'spa-wellness': {
      name: 'Spa & Wellness 💆',
      subtitle: 'Massage, treatments, and pampering',
      emoji: '💆',
      gradient: 'from-pink-400 to-rose-600',
      amenities: [
        'be-relax-spa',
        'wellness-spa',
        'massage-chairs',
        'foot-reflexology',
        'nail-spa',
        'beauty-services',
        'shower-suites',
        'gym-facilities',
        'yoga-room',
        'swimming-pool',
        'sauna',
        'steam-room',
        'facial-treatments',
        'hair-salon',
        'meditation-studio',
        'oxygen-bar',
        'salt-room',
        'aromatherapy-lounge'
      ]
    },
    'premium-lounges': {
      name: 'Premium Lounges 🥂',
      subtitle: 'First & Business class luxury',
      emoji: '🥂',
      gradient: 'from-amber-500 to-yellow-600',
      amenities: [
        'singapore-airlines-first',
        'singapore-airlines-business',
        'qantas-first-lounge',
        'emirates-lounge',
        'cathay-pacific-lounge',
        'british-airways-lounge',
        'united-club',
        'delta-sky-club',
        'centurion-lounge',
        'vip-terminal',
        'lufthansa-senator',
        'air-france-lounge',
        'japan-airlines-sakura',
        'virgin-clubhouse',
        'turkish-lounge',
        'qatar-airways-lounge',
        'thai-royal-silk',
        'malaysia-golden',
        'china-airlines-dynasty',
        'korean-air-prestige'
      ]
    },
    'quiet-sanctuaries': {
      name: 'Quiet Sanctuaries 🕊️',
      subtitle: 'Silent zones for deep rest',
      emoji: '🕊️',
      gradient: 'from-blue-400 to-cyan-600',
      amenities: [
        'sanctuary-lounge',
        'quiet-room',
        'meditation-pod',
        'zen-space',
        'silent-area',
        'relaxation-suite',
        'privacy-pod'
      ]
    },
    'day-rooms': {
      name: 'Day Rooms 🏨',
      subtitle: 'Hotel rooms for proper rest',
      emoji: '🏨',
      gradient: 'from-purple-500 to-indigo-600',
      amenities: [
        'aerotel-hourly',
        'crowne-plaza-day',
        'yotel-cabin',
        'transit-hotel-6hr',
        'transit-hotel-12hr',
        'ambassador-transit',
        'capsule-hotel',
        'micro-room',
        'day-use-suite',
        'shower-nap-combo',
        'cocoon-by-sealy'
      ]
    }
  },
  shop: {
    'luxury-boulevard': {
      name: 'Luxury Boulevard 💎',
      subtitle: 'Premium brands & exclusive items',
      emoji: '💎',
      gradient: 'from-amber-400 to-yellow-600',
      amenities: [
        'louis-vuitton',
        'chanel',
        'hermes',
        'gucci',
        'prada',
        'cartier',
        'rolex',
        'omega',
        'tiffany-co',
        'bottega-veneta',
        'dior',
        'burberry',
        'fendi',
        'valentino',
        'saint-laurent',
        'balenciaga',
        'bulgari',
        'versace',
        'montblanc'
      ]
    },
    'duty-free-deals': {
      name: 'Duty Free Deals 🛒',
      subtitle: 'Tax-free shopping paradise',
      emoji: '🛒',
      gradient: 'from-green-400 to-emerald-600',
      amenities: [
        'dfs-galleria',
        'lotte-duty-free',
        'shilla-duty-free',
        'king-power',
        'duty-free-perfumes',
        'duty-free-liquor',
        'duty-free-tobacco',
        'duty-free-electronics',
        'duty-free-fashion',
        'duty-free-accessories',
        'duty-free-chocolates',
        'duty-free-cosmetics',
        'duty-free-watches'
      ]
    },
    'singapore-souvenirs': {
      name: 'Singapore Souvenirs 🦁',
      subtitle: 'Local treasures & memories',
      emoji: '🦁',
      gradient: 'from-red-400 to-orange-600',
      amenities: [
        'merlion-souvenirs',
        'orchid-accessories',
        'local-snacks',
        'traditional-crafts',
        'cultural-items',
        'singapore-tea',
        'local-chocolates',
        'heritage-gifts',
        'city-themed-items',
        'memorabilia',
        'batik-products',
        'peranakan-gifts',
        'singapore-sling-mix',
        'durian-chocolates',
        'kaya-spread',
        'bak-kwa',
        'pineapple-tarts'
      ]
    },
    'tech-gadgets': {
      name: 'Tech Gadgets 📱',
      subtitle: 'Latest technology & innovation',
      emoji: '📱',
      gradient: 'from-blue-400 to-indigo-600',
      amenities: [
        'apple-store',
        'samsung-experience',
        'sony-store',
        'lg-store',
        'tech-accessories',
        'smart-devices',
        'gaming-consoles',
        'audio-equipment',
        'camera-gear',
        'tech-gadgets',
        'microsoft-store',
        'bose-store',
        'dyson-demo',
        'drone-shop',
        'vr-gear'
      ]
    },
    'fashion-forward': {
      name: 'Fashion Forward 👗',
      subtitle: 'Trendy styles & accessories',
      emoji: '👗',
      gradient: 'from-purple-400 to-pink-600',
      amenities: [
        'zara',
        'h-m',
        'uniqlo',
        'mango',
        'forever-21',
        'fashion-accessories',
        'shoes-bags',
        'jewelry-accessories',
        'sports-fashion',
        'trendy-boutiques',
        'gap',
        'banana-republic',
        'cos',
        'muji',
        'superdry',
        'calvin-klein',
        'tommy-hilfiger',
        'ralph-lauren',
        'nike',
        'adidas',
        'under-armour'
      ]
    }
  },
  refuel: {
    'hawker-heaven': {
      name: 'Hawker Heaven 🥘',
      subtitle: 'Local street food delights',
      emoji: '🥘',
      gradient: 'from-orange-400 to-red-600',
      amenities: [
        'chicken-rice',
        'laksa-stall',
        'char-kway-teow',
        'satay-station',
        'roti-prata',
        'nasi-lemak',
        'mee-goreng',
        'dim-sum',
        'bubble-tea',
        'local-desserts',
        'hokkien-mee',
        'carrot-cake',
        'oyster-omelette',
        'fish-ball-noodles',
        'wanton-mee',
        'yong-tau-foo'
      ]
    },
    'local-eats': {
      name: 'Local Eats 🍜',
      subtitle: 'Authentic Singapore cuisine',
      emoji: '🍜',
      gradient: 'from-red-400 to-pink-600',
      amenities: [
        'singapore-chilli-crab',
        'black-pepper-crab',
        'hainanese-chicken-rice',
        'bak-kut-teh',
        'fish-head-curry',
        'beef-noodles',
        'prawn-noodles',
        'duck-rice',
        'pork-ribs-soup',
        'local-specialties',
        'sambal-stingray',
        'rojak',
        'popiah',
        'kueh-pie-tee',
        'murtabak',
        'nasi-briyani',
        'mee-siam',
        'lontong',
        'sup-tulang',
        'tahu-goreng'
      ]
    },
    'quick-bites': {
      name: 'Quick Bites 🥪',
      subtitle: 'Fast & convenient meals',
      emoji: '🥪',
      gradient: 'from-yellow-400 to-orange-600',
      amenities: [
        'subway',
        'mcdonalds',
        'kfc',
        'burger-king',
        'pizza-hut',
        'dominos',
        'starbucks',
        'coffee-bean',
        'quick-snacks',
        'grab-go-meals',
        'dunkin-donuts',
        'taco-bell',
        'wendys'
      ]
    },
    'coffee-chill': {
      name: 'Coffee & Chill ☕',
      subtitle: 'Relaxing beverage spots',
      emoji: '☕',
      gradient: 'from-brown-400 to-amber-600',
      amenities: [
        'starbucks-reserve',
        'coffee-bean-tea-leaf',
        'local-coffee-shops',
        'tea-houses',
        'juice-bars',
        'smoothie-stations',
        'bubble-tea-shops',
        'coffee-lounges',
        'tea-ceremonies',
        'beverage-corners',
        'boost-juice',
        'jamba-juice',
        'koi-the',
        'gong-cha',
        'liho',
        'tiger-sugar',
        'chi-cha-san-chen',
        'playmade'
      ]
    },
    'fine-dining': {
      name: 'Fine Dining 🍽️',
      subtitle: 'Elegant culinary experiences',
      emoji: '🍽️',
      gradient: 'from-purple-400 to-indigo-600',
      amenities: [
        'crystal-jade',
        'din-tai-fung',
        'paradise-dynasty',
        'tim-ho-wan',
        'jumbo-seafood',
        'long-beach-seafood',
        'no-signboard-seafood',
        'red-house-seafood',
        'palm-beach-seafood',
        'fine-dining-restaurants',
        'imperial-treasure',
        'lei-garden',
        'summer-pavilion',
        'hai-di-lao',
        'putien'
      ]
    }
  },
  work: {
    'business-lounges': {
      name: 'Business Lounges 💼',
      subtitle: 'Work-focused airline lounges',
      emoji: '💼',
      gradient: 'from-gray-600 to-gray-800',
      amenities: [
        'business-center-t1',
        'business-center-t2',
        'business-center-t3',
        'business-center-t4',
        'krisflyer-gold-lounge',
        'priority-pass-lounge',
        'airline-business-lounges',
        'conference-lounge',
        'executive-lounge',
        'workspace-lounge',
        'dnata-lounge',
        'skyteam-lounge',
        'oneworld-lounge'
      ]
    },
    'meeting-rooms': {
      name: 'Meeting Rooms 🤝',
      subtitle: 'Private spaces for calls and meetings',
      emoji: '🤝',
      gradient: 'from-blue-600 to-indigo-700',
      amenities: [
        'meeting-pod-t1',
        'meeting-pod-t2',
        'meeting-pod-t3',
        'meeting-pod-t4',
        'conference-room',
        'phone-booth',
        'video-call-room',
        'private-office'
      ]
    },
    'charging-stations': {
      name: 'Charging Stations 🔌',
      subtitle: 'Power up your devices',
      emoji: '🔌',
      gradient: 'from-yellow-400 to-orange-500',
      amenities: [
        'charging-station-central',
        'charging-bar',
        'power-hub',
        'device-charging-lounge',
        'usb-charging-points',
        'wireless-charging-spots',
        'laptop-charging-area',
        'phone-charging-lockers',
        'fast-charge-zone',
        'power-bank-rental',
        'charging-trees',
        'charging-benches',
        'charging-tables',
        'charging-pods',
        'multi-device-stations',
        'solar-charging',
        'rapid-usb-c'
      ]
    },
    'wifi-zones': {
      name: 'WiFi Zones 📡',
      subtitle: 'High-speed internet areas',
      emoji: '📡',
      gradient: 'from-cyan-400 to-blue-600',
      amenities: [
        'wifi-lounge',
        'internet-corner',
        'digital-zone',
        'tech-hub',
        'connectivity-center',
        'streaming-zone'
      ]
    },
    'quiet-workspaces': {
      name: 'Quiet Workspaces 🤐',
      subtitle: 'Silent zones for focused work',
      emoji: '🤐',
      gradient: 'from-purple-500 to-indigo-600',
      amenities: [
        'quiet-work-area',
        'silent-workspace',
        'focus-zone',
        'study-area',
        'library-workspace',
        'concentration-pod',
        'solo-work-booth',
        'quiet-desk-area',
        'reading-workspace',
        'silent-productivity-zone',
        'private-cubicle'
      ]
    }
  },
  quick: {
    'grab-and-go': {
      name: 'Grab & Go 🌮',
      subtitle: 'Quick food for rushing',
      emoji: '🌮',
      gradient: 'from-red-400 to-orange-500',
      amenities: [
        'subway',
        'mcdonalds',
        'burger-king',
        '7-eleven',
        'cheers',
        'grab-go-deli',
        'sandwich-express',
        'quick-mart',
        'food-kiosk',
        'vending-area',
        'krispy-kreme',
        'auntie-annes',
        'cinnabon'
      ]
    },
    '5-minute-stops': {
      name: '5-Minute Stops ⏱️',
      subtitle: 'Ultra-quick services',
      emoji: '⏱️',
      gradient: 'from-yellow-400 to-amber-500',
      amenities: [
        'atm-machines',
        'currency-exchange',
        'sim-card-booth',
        'travel-essentials',
        'pharmacy-express',
        'newsstand',
        'ticket-kiosk',
        'info-counter'
      ]
    },
    'gate-essentials': {
      name: 'Gate Essentials 🊪',
      subtitle: 'Right by your gate',
      emoji: '🊪',
      gradient: 'from-blue-400 to-cyan-500',
      amenities: [
        'gate-shop',
        'gate-cafe',
        'gate-snacks',
        'water-fountain',
        'restroom',
        'nursing-room',
        'prayer-room',
        'smoking-area',
        'gate-lounge',
        'gate-charging',
        'gate-vending',
        'gate-info-desk',
        'gate-seating',
        'gate-viewing-deck',
        'kids-play-area'
      ]
    },
    'express-services': {
      name: 'Express Services ⚡',
      subtitle: 'Fast-track everything',
      emoji: '⚡',
      gradient: 'from-green-400 to-emerald-500',
      amenities: [
        'fast-track-immigration',
        'express-check-in',
        'priority-security',
        'baggage-express',
        'fast-track-transfer',
        'express-customs',
        'vip-assistance'
      ]
    },
    'quick-charge': {
      name: 'Quick Charge 🔋',
      subtitle: 'Rapid device charging',
      emoji: '🔋',
      gradient: 'from-orange-400 to-red-500',
      amenities: [
        'rapid-charge-station',
        'fast-charge-hub',
        'quick-charge-lounge',
        'power-bank-vending',
        'usb-quick-charge',
        'wireless-fast-charge',
        '30-min-charge-cafe',
        'device-boost-bar',
        'emergency-charging',
        'charge-go-station',
        'lightning-charge-point',
        'super-fast-usb-c',
        'multi-plug-station',
        'charge-share-hub',
        'battery-swap',
        'solar-quick-charge',
        'turbo-charge-zone'
      ]
    }
  }
};

// Helper function to get collections for a specific vibe
export function getCollectionsForVibe(vibeSlug: string) {
  const vibe = VIBES.find(v => v.slug === vibeSlug);
  if (!vibe) return [];
  
  return vibe.collections.map(collectionSlug => ({
    slug: collectionSlug,
    ...COLLECTION_MAPPINGS[vibeSlug as keyof typeof COLLECTION_MAPPINGS]?.[collectionSlug]
  })).filter(Boolean);
}

// Helper function to get all collections
export function getAllCollections() {
  return Object.entries(COLLECTION_MAPPINGS).flatMap(([vibeSlug, collections]) =>
    Object.entries(collections).map(([collectionSlug, collection]) => ({
      ...collection,
      slug: collectionSlug,
      vibeSlug
    }))
  );
}
