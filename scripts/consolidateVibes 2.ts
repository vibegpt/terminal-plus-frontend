// consolidateVibes.ts

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

// Core vibes as specified by user
const coreVibes = [
  "Refuel", "Comfort", "Shop", "Quick", "Work", "Explore", "Chill"
];

// Mapping to consolidate all vibes into core vibes
const vibeConsolidation: Record<string, string[]> = {
  // Keep core vibes as-is
  "Refuel": ["Refuel"],
  "Comfort": ["Comfort"],
  "Shop": ["Shop"],
  "Quick": ["Quick"],
  "Work": ["Work"],
  "Explore": ["Explore"],
  "Chill": ["Chill"],
  
  // Consolidate Entertainment and Luxury into core vibes
  "Entertainment": ["Explore"], // Entertainment becomes Explore
  "Luxury": ["Shop"], // Luxury becomes Shop (high-end retail)
  
  // Any other vibes that might exist
  "Wellness": ["Comfort"], // Wellness becomes Comfort
};

// Special handling for specific amenities
const specialAmenityMappings: Record<string, string[]> = {
  "The Bistro by Wolfgang Puck": ["Refuel"], // Override: Luxury → Refuel
  "British Airways Concorde Room": ["Work", "Chill"], // Override: Luxury → Work + Chill
};

function consolidateVibes() {
  // Read current amenities
  const amenitiesPath = path.join(__dirname, '../src/data/amenities.json');
  const amenities: Amenity[] = JSON.parse(fs.readFileSync(amenitiesPath, 'utf-8'));
  
  console.log(`🔄 Consolidating vibes into ${coreVibes.length} core vibes for ${amenities.length} amenities...\n`);
  
  let totalChanges = 0;
  const changes: string[] = [];
  
  // Process each amenity
  const updatedAmenities = amenities.map(amenity => {
    if (!amenity.vibe_tags || amenity.vibe_tags.length === 0) {
      return amenity;
    }
    
    const originalVibes = [...amenity.vibe_tags];
    let newVibes: string[] = [];
    let hasChanges = false;
    
    // Check for special amenity mappings first
    if (specialAmenityMappings[amenity.name]) {
      newVibes = specialAmenityMappings[amenity.name];
      hasChanges = true;
      changes.push(`${amenity.name}: [${originalVibes.join(', ')}] → [${newVibes.join(', ')}] (special mapping)`);
    } else {
      // Standard vibe consolidation
      amenity.vibe_tags.forEach(vibe => {
        if (vibeConsolidation[vibe]) {
          // Map to consolidated vibes
          newVibes.push(...vibeConsolidation[vibe]);
          if (!coreVibes.includes(vibe)) {
            hasChanges = true;
            changes.push(`${amenity.name}: "${vibe}" → [${vibeConsolidation[vibe].join(', ')}]`);
          }
        } else {
          // Keep unknown vibes but log them
          newVibes.push(vibe);
          console.log(`⚠️  Unknown vibe "${vibe}" for ${amenity.name} - keeping as-is`);
        }
      });
    }
    
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
    console.log(`📝 Vibe consolidation changes:`);
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
  const nonCoreVibes = finalVibes.filter(vibe => !coreVibes.includes(vibe));
  
  console.log(`\n📊 Results:`);
  console.log(`✅ Total changes: ${totalChanges} amenities updated`);
  console.log(`✅ Final unique vibes: ${finalVibes.length}`);
  console.log(`✅ Core vibes: ${finalVibes.filter(v => coreVibes.includes(v)).length}`);
  console.log(`⚠️  Non-core vibes: ${nonCoreVibes.length}`);
  
  // Show final vibe distribution
  console.log(`\n🎯 Final Vibe Distribution:`);
  coreVibes.forEach(vibe => {
    const count = updatedAmenities.filter(a => a.vibe_tags && a.vibe_tags.includes(vibe)).length;
    console.log(`  ${vibe}: ${count} amenities`);
  });
  
  if (nonCoreVibes.length > 0) {
    console.log(`\n⚠️  Remaining non-core vibes:`);
    nonCoreVibes.forEach(vibe => {
      console.log(`  - "${vibe}"`);
    });
  }
  
  // Write updated amenities
  fs.writeFileSync(amenitiesPath, JSON.stringify(updatedAmenities, null, 2));
  
  console.log(`\n💾 Updated amenities.json with consolidated vibe tags`);
  console.log(`📍 File: ${amenitiesPath}`);
  
  return {
    totalAmenities: updatedAmenities.length,
    totalChanges,
    finalVibes: finalVibes.length,
    coreVibes: finalVibes.filter(v => coreVibes.includes(v)).length,
    nonCoreVibes: nonCoreVibes.length
  };
}

// Run the consolidation
consolidateVibes(); 