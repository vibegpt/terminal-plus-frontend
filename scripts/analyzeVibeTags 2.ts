// analyzeVibeTags.ts

import fs from 'fs';
import path from 'path';

interface Amenity {
  name: string;
  terminal_code: string;
  category: string;
  amenity_type: string;
  vibe_tags: string[];
  price_tier: string;
  airport_code: string;
}

// Our defined vibes from the transformation system
const definedVibes = [
  "Refuel", "Quick", "Shop", "Luxury", "Comfort", "Chill", 
  "Explore", "Work", "Entertainment", "Wellness"
];

function analyzeVibeTags() {
  // Read current amenities
  const amenitiesPath = path.join(__dirname, '../src/data/amenities.json');
  const amenities: Amenity[] = JSON.parse(fs.readFileSync(amenitiesPath, 'utf-8'));
  
  console.log(`📊 Analyzing ${amenities.length} amenities for vibe tag consistency...\n`);
  
  // Collect all vibe tags
  const allVibes = new Set<string>();
  const vibeCounts: Record<string, number> = {};
  const amenitiesByVibe: Record<string, string[]> = {};
  
  amenities.forEach(amenity => {
    if (amenity.vibe_tags && amenity.vibe_tags.length > 0) {
      amenity.vibe_tags.forEach(vibe => {
        allVibes.add(vibe);
        vibeCounts[vibe] = (vibeCounts[vibe] || 0) + 1;
        
        if (!amenitiesByVibe[vibe]) {
          amenitiesByVibe[vibe] = [];
        }
        amenitiesByVibe[vibe].push(amenity.name);
      });
    }
  });
  
  const sortedVibes = Array.from(allVibes).sort();
  
  console.log(`🎯 Found ${sortedVibes.length} unique vibe tags:\n`);
  
  // Analyze each vibe
  sortedVibes.forEach(vibe => {
    const count = vibeCounts[vibe];
    const isDefined = definedVibes.includes(vibe);
    const status = isDefined ? '✅ DEFINED' : '⚠️  UNDEFINED';
    
    console.log(`${vibe}: ${count} amenities ${status}`);
  });
  
  // Show undefined vibes in detail
  const undefinedVibes = sortedVibes.filter(vibe => !definedVibes.includes(vibe));
  if (undefinedVibes.length > 0) {
    console.log(`\n⚠️  UNDEFINED VIBES (${undefinedVibes.length}):`);
    undefinedVibes.forEach(vibe => {
      const count = vibeCounts[vibe];
      console.log(`  ${vibe}: ${count} amenities`);
      console.log(`    Examples: ${amenitiesByVibe[vibe].slice(0, 3).join(', ')}${amenitiesByVibe[vibe].length > 3 ? '...' : ''}`);
    });
  }
  
  // Show defined vibes usage
  console.log(`\n✅ DEFINED VIBES USAGE:`);
  definedVibes.forEach(vibe => {
    const count = vibeCounts[vibe] || 0;
    console.log(`  ${vibe}: ${count} amenities`);
  });
  
  // Calculate statistics
  const totalAmenitiesWithVibes = amenities.filter(a => a.vibe_tags && a.vibe_tags.length > 0).length;
  const totalVibeTags = Object.values(vibeCounts).reduce((sum, count) => sum + count, 0);
  const definedVibeTags = definedVibes.reduce((sum, vibe) => sum + (vibeCounts[vibe] || 0), 0);
  
  console.log(`\n📈 STATISTICS:`);
  console.log(`  Total amenities: ${amenities.length}`);
  console.log(`  Amenities with vibe tags: ${totalAmenitiesWithVibes}`);
  console.log(`  Total vibe tag instances: ${totalVibeTags}`);
  console.log(`  Defined vibe tag instances: ${definedVibeTags}`);
  console.log(`  Undefined vibe tag instances: ${totalVibeTags - definedVibeTags}`);
  console.log(`  Coverage: ${((definedVibeTags / totalVibeTags) * 100).toFixed(1)}%`);
  
  // Recommendations
  console.log(`\n💡 RECOMMENDATIONS:`);
  if (undefinedVibes.length > 0) {
    console.log(`  • Consider mapping undefined vibes to defined ones:`);
    undefinedVibes.forEach(vibe => {
      console.log(`    - "${vibe}" → suggest mapping`);
    });
  }
  
  const unusedDefinedVibes = definedVibes.filter(vibe => !vibeCounts[vibe]);
  if (unusedDefinedVibes.length > 0) {
    console.log(`  • Unused defined vibes: ${unusedDefinedVibes.join(', ')}`);
  }
  
  return {
    totalAmenities: amenities.length,
    totalVibes: sortedVibes.length,
    definedVibes: definedVibes.length,
    undefinedVibes: undefinedVibes.length,
    coverage: ((definedVibeTags / totalVibeTags) * 100).toFixed(1)
  };
}

// Run the analysis
analyzeVibeTags(); 