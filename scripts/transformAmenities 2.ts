// transformAmenities.ts

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
}

// Sample data provided by user
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

// Helper function to determine category and amenity_type based on vibes
function determineCategoryAndType(vibes: string[], name: string): { category: string; amenity_type: string } {
  const lowerName = name.toLowerCase();
  
  // Check for food/dining related vibes and names
  if (vibes.includes("Refuel") || lowerName.includes("burger") || lowerName.includes("coffee") || lowerName.includes("restaurant")) {
    return { category: "Dining", amenity_type: "Casual Dining" };
  }
  
  // Check for shopping related vibes and names
  if (vibes.includes("Shop") || lowerName.includes("gucci") || lowerName.includes("store") || lowerName.includes("boutique")) {
    return { category: "Shopping", amenity_type: "Luxury Retail" };
  }
  
  // Default fallback
  return { category: "Other", amenity_type: "General" };
}

// Helper function to determine price tier based on vibes and name
function determinePriceTier(vibes: string[], name: string): string {
  const lowerName = name.toLowerCase();
  
  if (lowerName.includes("gucci") || lowerName.includes("luxury") || lowerName.includes("premium")) {
    return "$$$";
  }
  
  if (vibes.includes("Quick") || lowerName.includes("burger") || lowerName.includes("coffee")) {
    return "$$";
  }
  
  return "$$";
}

function transformAmenities(provided: ProvidedAmenity[]): TransformedAmenity[] {
  return provided.map((amenity, index) => {
    const { category, amenity_type } = determineCategoryAndType(amenity.vibes, amenity.name);
    const price_tier = determinePriceTier(amenity.vibes, amenity.name);
    
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
        lat: -33.946111 + (index * 0.0001), // Slight variation for each amenity
        lng: 151.177222 + (index * 0.0001)
      },
      price_tier,
      access: ""
    };
  });
}

function createNewAmenitiesJson() {
  // Read existing amenities
  const existingAmenitiesPath = path.join(__dirname, '../src/data/amenities.json');
  const existingAmenities: TransformedAmenity[] = JSON.parse(fs.readFileSync(existingAmenitiesPath, 'utf-8'));
  
  // Transform provided amenities
  const transformedNewAmenities = transformAmenities(providedAmenities);
  
  // Check for duplicates by name and terminal_code
  const existingNames = new Set(existingAmenities.map(a => `${a.name}-${a.terminal_code}`));
  const newAmenities = transformedNewAmenities.filter(amenity => {
    const key = `${amenity.name}-${amenity.terminal_code}`;
    return !existingNames.has(key);
  });
  
  // Combine existing and new amenities
  const combinedAmenities = [...existingAmenities, ...newAmenities];
  
  // Write to new file
  const outputPath = path.join(__dirname, '../src/data/amenities-new.json');
  fs.writeFileSync(outputPath, JSON.stringify(combinedAmenities, null, 2));
  
  console.log(`✅ Transformed ${providedAmenities.length} amenities`);
  console.log(`✅ Added ${newAmenities.length} new amenities (${transformedNewAmenities.length - newAmenities.length} were duplicates)`);
  console.log(`✅ Total amenities: ${combinedAmenities.length}`);
  console.log(`✅ New file created: ${outputPath}`);
  
  return combinedAmenities;
}

// Run the transformation
createNewAmenitiesJson(); 