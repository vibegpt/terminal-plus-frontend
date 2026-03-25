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

function extractSYDT1Amenities() {
  const amenitiesPath = path.join(__dirname, '../src/data/amenities.json');
  const outputPath = path.join(__dirname, 'syd_t1_cleaned_amenities.json');
  
  const amenities: Amenity[] = JSON.parse(fs.readFileSync(amenitiesPath, 'utf-8'));
  
  console.log(`📖 Total amenities: ${amenities.length}`);
  
  // Filter for SYD T1 amenities only
  const sydT1Amenities = amenities.filter(amenity => 
    amenity.terminal_code === 'SYD-T1'
  );
  
  console.log(`🏢 SYD T1 amenities found: ${sydT1Amenities.length}`);
  
  // Clean and standardize the data
  const cleanedAmenities = sydT1Amenities.map(amenity => ({
    name: amenity.name,
    terminal_code: amenity.terminal_code,
    category: amenity.category || 'Other',
    amenity_type: amenity.amenity_type || 'General',
    description: amenity.description || '',
    location_description: amenity.location_description || '',
    opening_hours: amenity.opening_hours || {},
    vibe_tags: amenity.vibe_tags || [],
    status: amenity.status || 'active',
    image_url: amenity.image_url || '',
    airport_code: amenity.airport_code || 'SYD',
    coordinates: amenity.coordinates || { lat: 0, lng: 0 },
    price_tier: amenity.price_tier || '$$',
    access: amenity.access || 'public',
    tags: amenity.tags || []
  }));
  
  // Sort by category, then by name
  cleanedAmenities.sort((a, b) => {
    if (a.category !== b.category) {
      return a.category.localeCompare(b.category);
    }
    return a.name.localeCompare(b.name);
  });
  
  // Write to file
  fs.writeFileSync(outputPath, JSON.stringify(cleanedAmenities, null, 2));
  
  console.log(`\n📊 SYD T1 Amenities Summary:`);
  console.log(`✅ Total: ${cleanedAmenities.length} amenities`);
  
  // Count by category
  const categoryCounts: Record<string, number> = {};
  cleanedAmenities.forEach(amenity => {
    categoryCounts[amenity.category] = (categoryCounts[amenity.category] || 0) + 1;
  });
  
  console.log(`\n📂 By Category:`);
  Object.entries(categoryCounts)
    .sort(([,a], [,b]) => b - a)
    .forEach(([category, count]) => {
      console.log(`  ${category}: ${count} amenities`);
    });
  
  // Count by vibe
  const vibeCounts: Record<string, number> = {};
  cleanedAmenities.forEach(amenity => {
    amenity.vibe_tags.forEach(vibe => {
      vibeCounts[vibe] = (vibeCounts[vibe] || 0) + 1;
    });
  });
  
  console.log(`\n🎯 By Vibe:`);
  Object.entries(vibeCounts)
    .sort(([,a], [,b]) => b - a)
    .forEach(([vibe, count]) => {
      console.log(`  ${vibe}: ${count} amenities`);
    });
  
  console.log(`\n💾 Cleaned SYD T1 amenities saved to: ${outputPath}`);
  
  return cleanedAmenities;
}

if (require.main === module) {
  extractSYDT1Amenities();
}

export { extractSYDT1Amenities }; 