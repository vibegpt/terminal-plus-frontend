// analyzeAndTransformAmenities.ts

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

interface CurrentAmenity {
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
  access?: string;
  tags?: string[];
}

// Sample data provided by user (you can expand this with more amenities)
const providedAmenities: ProvidedAmenity[] = [
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

// Enhanced mapping for better categorization
const categoryMapping: Record<string, { category: string; amenity_type: string; price_tier: string }> = {
  "Refuel": { category: "Dining", amenity_type: "Casual Dining", price_tier: "$$" },
  "Quick": { category: "Dining", amenity_type: "Quick Service", price_tier: "$" },
  "Shop": { category: "Shopping", amenity_type: "Retail", price_tier: "$$$" },
  "Luxury": { category: "Shopping", amenity_type: "Luxury Retail", price_tier: "$$$" },
  "Comfort": { category: "Comfort", amenity_type: "Lounge", price_tier: "$$$" },
  "Chill": { category: "Comfort", amenity_type: "Rest Area", price_tier: "Free" },
  "Explore": { category: "Entertainment", amenity_type: "Attraction", price_tier: "$$" },
  "Work": { category: "Business", amenity_type: "Business Center", price_tier: "$$" }
};

function determineCategoryAndType(vibes: string[], name: string): { category: string; amenity_type: string; price_tier: string } {
  const lowerName = name.toLowerCase();
  
  // Check for luxury brands
  if (lowerName.includes("gucci") || lowerName.includes("hermes") || lowerName.includes("louis vuitton") || lowerName.includes("chanel")) {
    return { category: "Shopping", amenity_type: "Luxury Retail", price_tier: "$$$" };
  }
  
  // Check for food/dining
  if (lowerName.includes("burger") || lowerName.includes("coffee") || lowerName.includes("restaurant") || lowerName.includes("cafe")) {
    return { category: "Dining", amenity_type: "Casual Dining", price_tier: "$$" };
  }
  
  // Check vibes for categorization
  for (const vibe of vibes) {
    if (categoryMapping[vibe]) {
      return categoryMapping[vibe];
    }
  }
  
  // Default fallback
  return { category: "Other", amenity_type: "General", price_tier: "$$" };
}

function transformAmenity(amenity: ProvidedAmenity, index: number): CurrentAmenity {
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

function analyzeCurrentAmenities(amenities: CurrentAmenity[]) {
  console.log("\n📊 Current Amenities Analysis:");
  console.log(`Total amenities: ${amenities.length}`);
  
  // Count by airport
  const airportCounts: Record<string, number> = {};
  const terminalCounts: Record<string, number> = {};
  const categoryCounts: Record<string, number> = {};
  
  amenities.forEach(amenity => {
    airportCounts[amenity.airport_code] = (airportCounts[amenity.airport_code] || 0) + 1;
    terminalCounts[amenity.terminal_code] = (terminalCounts[amenity.terminal_code] || 0) + 1;
    categoryCounts[amenity.category] = (categoryCounts[amenity.category] || 0) + 1;
  });
  
  console.log("\n🏢 By Airport:");
  Object.entries(airportCounts).forEach(([airport, count]) => {
    console.log(`  ${airport}: ${count} amenities`);
  });
  
  console.log("\n🏛️ By Terminal:");
  Object.entries(terminalCounts).forEach(([terminal, count]) => {
    console.log(`  ${terminal}: ${count} amenities`);
  });
  
  console.log("\n📂 By Category:");
  Object.entries(categoryCounts).forEach(([category, count]) => {
    console.log(`  ${category}: ${count} amenities`);
  });
}

function createNewAmenitiesJson() {
  // Read existing amenities
  const existingAmenitiesPath = path.join(__dirname, '../src/data/amenities.json');
  const existingAmenities: CurrentAmenity[] = JSON.parse(fs.readFileSync(existingAmenitiesPath, 'utf-8'));
  
  // Analyze current amenities
  analyzeCurrentAmenities(existingAmenities);
  
  // Transform provided amenities
  const transformedNewAmenities = providedAmenities.map((amenity, index) => 
    transformAmenity(amenity, index)
  );
  
  // Check for duplicates by name and terminal_code
  const existingKeys = new Set(existingAmenities.map(a => `${a.name}-${a.terminal_code}`));
  const newAmenities = transformedNewAmenities.filter(amenity => {
    const key = `${amenity.name}-${amenity.terminal_code}`;
    return !existingKeys.has(key);
  });
  
  console.log(`\n🔄 Transformation Results:`);
  console.log(`✅ Transformed ${providedAmenities.length} provided amenities`);
  console.log(`✅ Added ${newAmenities.length} new amenities`);
  console.log(`✅ Skipped ${transformedNewAmenities.length - newAmenities.length} duplicates`);
  
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
  
  console.log(`\n💾 New file created: ${outputPath}`);
  console.log(`📈 Total amenities in new file: ${combinedAmenities.length}`);
  
  return combinedAmenities;
}

// Run the analysis and transformation
createNewAmenitiesJson(); 