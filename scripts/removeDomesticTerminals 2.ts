// removeDomesticTerminals.ts

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

function removeDomesticTerminals() {
  // Read current amenities
  const amenitiesPath = path.join(__dirname, '../src/data/amenities.json');
  const amenities: Amenity[] = JSON.parse(fs.readFileSync(amenitiesPath, 'utf-8'));
  
  console.log(`📖 Total amenities before filtering: ${amenities.length}`);
  
  // Filter out SYD T2 and T3 amenities (domestic terminals)
  const domesticTerminals = ['SYD-T2', 'SYD-T3'];
  const filteredAmenities = amenities.filter(amenity => 
    !domesticTerminals.includes(amenity.terminal_code)
  );
  
  const removedCount = amenities.length - filteredAmenities.length;
  
  console.log(`\n🏢 Terminal Analysis:`);
  const terminalCounts: Record<string, number> = {};
  amenities.forEach(amenity => {
    terminalCounts[amenity.terminal_code] = (terminalCounts[amenity.terminal_code] || 0) + 1;
  });
  
  Object.entries(terminalCounts).forEach(([terminal, count]) => {
    const isRemoved = domesticTerminals.includes(terminal);
    const status = isRemoved ? '❌ REMOVED' : '✅ KEPT';
    console.log(`  ${terminal}: ${count} amenities ${status}`);
  });
  
  console.log(`\n📊 Results:`);
  console.log(`✅ Kept: ${filteredAmenities.length} amenities`);
  console.log(`❌ Removed: ${removedCount} amenities (SYD T2 & T3)`);
  console.log(`📈 Remaining: ${filteredAmenities.length} total amenities`);
  
  // Write filtered amenities back to the file
  fs.writeFileSync(amenitiesPath, JSON.stringify(filteredAmenities, null, 2));
  
  console.log(`\n💾 Updated amenities.json with international terminals only`);
  console.log(`📍 File: ${amenitiesPath}`);
  
  return filteredAmenities;
}

// Run the filtering
removeDomesticTerminals(); 