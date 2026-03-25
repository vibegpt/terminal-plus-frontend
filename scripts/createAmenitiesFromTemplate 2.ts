// createAmenitiesFromTemplate.ts

import fs from 'fs';
import path from 'path';

interface ProvidedAmenity {
  name: string;
  slug: string;
  vibes: string[];
  terminal: string;
  airportCode: string;
  image_url: string;
  logo_url: string;
}

interface TransformedAmenity {
  name: string;
  terminal_code: string;
  category: string;
  amenity_type: string;
  description: string;
  location_description: string;
  opening_hours: Record<string, string>;
  vibe_tags: string[];
  status: string;
  image_url: string;
  airport_code: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  price_tier: string;
  access: string;
  tags: string[];
}

// Enhanced category and type mapping
const categoryMapping: Record<string, { category: string; amenity_type: string; price_tier: string }> = {
  "Refuel": { category: "Dining", amenity_type: "Casual Dining", price_tier: "$$" },
  "Quick": { category: "Dining", amenity_type: "Quick Service", price_tier: "$" },
  "Shop": { category: "Shopping", amenity_type: "Retail", price_tier: "$$$" },
  "Luxury": { category: "Shopping", amenity_type: "Luxury Retail", price_tier: "$$$" },
  "Comfort": { category: "Comfort", amenity_type: "Lounge", price_tier: "$$$" },
  "Chill": { category: "Comfort", amenity_type: "Rest Area", price_tier: "Free" },
  "Explore": { category: "Entertainment", amenity_type: "Attraction", price_tier: "$$" },
  "Work": { category: "Business", amenity_type: "Business Center", price_tier: "$$" },
  "Entertainment": { category: "Entertainment", amenity_type: "Entertainment", price_tier: "$$" },
  "Wellness": { category: "Wellness", amenity_type: "Spa", price_tier: "$$$" }
};

// Luxury brand detection
const luxuryBrands = [
  "gucci", "hermes", "louis vuitton", "chanel", "prada", "fendi", "cartier", 
  "rolex", "omega", "tiffany", "burberry", "ralph lauren", "tom ford"
];

// Food/dining keywords
const foodKeywords = [
  "burger", "coffee", "restaurant", "cafe", "bar", "pizza", "sushi", 
  "sandwich", "bakery", "juice", "smoothie", "ice cream", "chocolate"
];

function determineCategoryAndType(vibes: string[], name: string): { category: string; amenity_type: string; price_tier: string } {
  const lowerName = name.toLowerCase();
  
  // Check for luxury brands
  if (luxuryBrands.some(brand => lowerName.includes(brand))) {
    return { category: "Shopping", amenity_type: "Luxury Retail", price_tier: "$$$" };
  }
  
  // Check for food/dining
  if (foodKeywords.some(keyword => lowerName.includes(keyword))) {
    return { category: "Dining", amenity_type: "Casual Dining", price_tier: "$$" };
  }
  
  // Check vibes for categorization
  for (const vibe of vibes) {
    if (categoryMapping[vibe]) {
      return categoryMapping[vibe];
    }
  }
  
  // Default fallback based on name patterns
  if (lowerName.includes("lounge") || lowerName.includes("club")) {
    return { category: "Comfort", amenity_type: "Lounge", price_tier: "$$$" };
  }
  
  if (lowerName.includes("store") || lowerName.includes("shop") || lowerName.includes("boutique")) {
    return { category: "Shopping", amenity_type: "Retail", price_tier: "$$" };
  }
  
  return { category: "Other", amenity_type: "General", price_tier: "$$" };
}

function transformAmenity(amenity: ProvidedAmenity, index: number): TransformedAmenity {
  const { category, amenity_type, price_tier } = determineCategoryAndType(amenity.vibes, amenity.name);
  
  return {
    name: amenity.name,
    terminal_code: `${amenity.airportCode}-${amenity.terminal}`,
    category,
    amenity_type,
    description: "",
    location_description: "Departures, After Security",
    opening_hours: {
      "Monday-Sunday": "24/7"
    },
    vibe_tags: amenity.vibes,
    status: "active",
    image_url: amenity.image_url === "..." ? "" : amenity.image_url,
    airport_code: amenity.airportCode,
    coordinates: {
      lat: -33.946111 + (index * 0.0001),
      lng: 151.177222 + (index * 0.0001)
    },
    price_tier,
    access: "",
    tags: []
  };
}

function createAmenitiesFromTemplate(providedAmenities: ProvidedAmenity[]) {
  console.log(`\n🔄 Processing ${providedAmenities.length} amenities...`);
  
  // Transform all provided amenities
  const transformedAmenities = providedAmenities.map((amenity, index) => 
    transformAmenity(amenity, index)
  );
  
  // Read existing amenities if they exist
  const existingAmenitiesPath = path.join(__dirname, '../src/data/amenities.json');
  let existingAmenities: TransformedAmenity[] = [];
  
  if (fs.existsSync(existingAmenitiesPath)) {
    existingAmenities = JSON.parse(fs.readFileSync(existingAmenitiesPath, 'utf-8'));
    console.log(`📖 Found ${existingAmenities.length} existing amenities`);
  }
  
  // Check for duplicates
  const existingKeys = new Set(existingAmenities.map(a => `${a.name}-${a.terminal_code}`));
  const newAmenities = transformedAmenities.filter(amenity => {
    const key = `${amenity.name}-${amenity.terminal_code}`;
    return !existingKeys.has(key);
  });
  
  const duplicates = transformedAmenities.length - newAmenities.length;
  
  console.log(`\n📊 Results:`);
  console.log(`✅ Transformed: ${transformedAmenities.length} amenities`);
  console.log(`✅ New: ${newAmenities.length} amenities`);
  console.log(`⚠️  Duplicates: ${duplicates} amenities`);
  
  if (newAmenities.length > 0) {
    console.log(`\n📝 New amenities to be added:`);
    newAmenities.forEach(amenity => {
      console.log(`  - ${amenity.name} (${amenity.terminal_code}) - ${amenity.category}`);
    });
  }
  
  // Combine existing and new amenities
  const combinedAmenities = [...existingAmenities, ...newAmenities];
  
  // Write to new file
  const outputPath = path.join(__dirname, '../src/data/amenities-new.json');
  fs.writeFileSync(outputPath, JSON.stringify(combinedAmenities, null, 2));
  
  console.log(`\n💾 New amenities.json created: ${outputPath}`);
  console.log(`📈 Total amenities: ${combinedAmenities.length}`);
  
  return combinedAmenities;
}

// Example usage with the provided data
const exampleAmenities: ProvidedAmenity[] = [
  {
    "name": "Betty's Burgers",
    "slug": "bettys-burgers",
    "vibes": ["Refuel", "Quick"],
    "terminal": "T1",
    "airportCode": "SYD",
    "image_url": "...",
    "logo_url": "..."
  },
  {
    "name": "Gucci",
    "slug": "gucci",
    "vibes": ["Shop"],
    "terminal": "T1",
    "airportCode": "SYD",
    "image_url": "...",
    "logo_url": "..."
  }
];

// Run the transformation
createAmenitiesFromTemplate(exampleAmenities);

// Export the function for use with larger datasets
export { createAmenitiesFromTemplate, ProvidedAmenity, TransformedAmenity }; 