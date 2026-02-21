// standardizeVibeTags.ts

import fs from 'fs';
import path from 'path';

interface Amenity {
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

// Our defined vibes
const definedVibes = [
  "Refuel", "Quick", "Shop", "Luxury", "Comfort", "Chill", 
  "Explore", "Work", "Entertainment", "Wellness"
];

// Mapping from undefined vibes to defined vibes
const vibeMapping: Record<string, string[]> = {
  "Active": ["Explore"],
  "Asian": ["Refuel"],
  "Convenience": ["Quick"],
  "Family": ["Explore"],
  "Fashion": ["Shop"],
  "Food": ["Refuel"],
  "Grind": ["Work"],
  "Healthy": ["Refuel"],
  "Learn": ["Explore"],
  "Local": ["Refuel"],
  "Premium": ["Luxury"],
  "Services": ["Work"],
  "Shopping": ["Shop"],
  "Social": ["Entertainment"]
};

function standardizeVibeTags() {
  // Read current amenities
  const amenitiesPath = path.join(__dirname, '../src/data/amenities.json');
  const amenities: Amenity[] = JSON.parse(fs.readFileSync(amenitiesPath, 'utf-8'));
  
  console.log(`🔄 Standardizing vibe tags for ${amenities.length} amenities...\n`);
  
  let totalChanges = 0;
  const changes: string[] = [];
  
  // Process each amenity
  const updatedAmenities = amenities.map(amenity => {
    if (!amenity.vibe_tags || amenity.vibe_tags.length === 0) {
      return amenity;
    }
    
    const originalVibes = [...amenity.vibe_tags];
    const newVibes: string[] = [];
    let hasChanges = false;
    
    amenity.vibe_tags.forEach(vibe => {
      if (definedVibes.includes(vibe)) {
        // Keep defined vibes as-is
        newVibes.push(vibe);
      } else if (vibeMapping[vibe]) {
        // Map undefined vibes to defined ones
        newVibes.push(...vibeMapping[vibe]);
        hasChanges = true;
        changes.push(`${amenity.name}: "${vibe}" → [${vibeMapping[vibe].join(', ')}]`);
      } else {
        // Keep unknown vibes but log them
        newVibes.push(vibe);
        console.log(`⚠️  Unknown vibe "${vibe}" for ${amenity.name} - keeping as-is`);
      }
    });
    
    // Remove duplicates
    const uniqueVibes = [...new Set(newVibes)];
    
    if (hasChanges || uniqueVibes.length !== originalVibes.length) {
      totalChanges++;
      return {
        ...amenity,
        vibe_tags: uniqueVibes
      };
    }
    
    return amenity;
  });
  
  // Show changes
  if (changes.length > 0) {
    console.log(`📝 Vibe tag changes:`);
    changes.forEach(change => {
      console.log(`  ${change}`);
    });
  }
  
  // Analyze results
  const allVibes = new Set<string>();
  updatedAmenities.forEach(amenity => {
    if (amenity.vibe_tags) {
      amenity.vibe_tags.forEach(vibe => allVibes.add(vibe));
    }
  });
  
  const finalVibes = Array.from(allVibes).sort();
  const undefinedVibes = finalVibes.filter(vibe => !definedVibes.includes(vibe));
  
  console.log(`\n📊 Results:`);
  console.log(`✅ Total changes: ${totalChanges} amenities updated`);
  console.log(`✅ Final unique vibes: ${finalVibes.length}`);
  console.log(`✅ Defined vibes: ${finalVibes.filter(v => definedVibes.includes(v)).length}`);
  console.log(`⚠️  Remaining undefined: ${undefinedVibes.length}`);
  
  if (undefinedVibes.length > 0) {
    console.log(`\n⚠️  Remaining undefined vibes:`);
    undefinedVibes.forEach(vibe => {
      console.log(`  - "${vibe}"`);
    });
  }
  
  // Write updated amenities
  fs.writeFileSync(amenitiesPath, JSON.stringify(updatedAmenities, null, 2));
  
  console.log(`\n💾 Updated amenities.json with standardized vibe tags`);
  console.log(`📍 File: ${amenitiesPath}`);
  
  return {
    totalAmenities: updatedAmenities.length,
    totalChanges,
    finalVibes: finalVibes.length,
    definedVibes: finalVibes.filter(v => definedVibes.includes(v)).length,
    undefinedVibes: undefinedVibes.length
  };
}

// Run the standardization
standardizeVibeTags(); 