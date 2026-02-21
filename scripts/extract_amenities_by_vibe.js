// Extract amenities by vibe for collection mapping
const fs = require('fs');
const path = require('path');

function extractAmenitiesByVibe() {
  console.log('🔍 Extracting amenities by vibe...');

  const filePath = path.join(__dirname, '../src/data/amenities.json');
  const amenities = JSON.parse(fs.readFileSync(filePath, 'utf8'));

  const vibeGroups = {};

  amenities.forEach(amenity => {
    if (Array.isArray(amenity.vibe_tags)) {
      amenity.vibe_tags.forEach(vibe => {
        if (!vibeGroups[vibe]) {
          vibeGroups[vibe] = [];
        }
        vibeGroups[vibe].push({
          slug: amenity.slug,
          name: amenity.name,
          category: amenity.category,
          terminal: amenity.terminal_code,
          type: amenity.amenity_type
        });
      });
    }
  });

  // Sort by vibe and then by name
  Object.keys(vibeGroups).forEach(vibe => {
    vibeGroups[vibe].sort((a, b) => a.name.localeCompare(b.name));
  });

  console.log('\n📊 AMENITIES BY VIBE:');
  Object.entries(vibeGroups).sort((a, b) => b[1].length - a[1].length).forEach(([vibe, amenityList]) => {
    console.log(`\n${vibe.toUpperCase()} (${amenityList.length} amenities):`);

    // Show first 15 amenities for each vibe
    amenityList.slice(0, 15).forEach(amenity => {
      console.log(`  - ${amenity.name} (${amenity.slug}) [${amenity.terminal}]`);
    });

    if (amenityList.length > 15) {
      console.log(`  ... and ${amenityList.length - 15} more`);
    }
  });

  // Generate collection mapping suggestions
  console.log('\n📝 SUGGESTED COLLECTION MAPPINGS:');

  // Refuel collections
  const refuelAmenities = vibeGroups['Refuel'] || [];
  console.log('\n// REFUEL Collections');
  console.log("'coffee-worth-walk': [");
  refuelAmenities.filter(a => a.name.toLowerCase().includes('coffee') || a.name.toLowerCase().includes('starbucks'))
    .slice(0, 8).forEach(a => console.log(`  '${a.slug}',`));
  console.log("],");

  console.log("'local-food-real-prices': [");
  refuelAmenities.filter(a => !a.name.toLowerCase().includes('coffee') &&
    (a.name.toLowerCase().includes('food') || a.category === 'Food & Beverage'))
    .slice(0, 8).forEach(a => console.log(`  '${a.slug}',`));
  console.log("],");

  // Shop collections
  const shopAmenities = vibeGroups['Shop'] || [];
  console.log('\n// SHOP Collections');
  console.log("'duty-free-deals': [");
  shopAmenities.filter(a => a.name.toLowerCase().includes('duty') ||
    a.name.toLowerCase().includes('lotte') || a.name.toLowerCase().includes('dfs'))
    .slice(0, 8).forEach(a => console.log(`  '${a.slug}',`));
  console.log("],");

  console.log("'singapore-exclusives': [");
  shopAmenities.filter(a => a.name.toLowerCase().includes('singapore') ||
    a.name.toLowerCase().includes('local') || a.name.toLowerCase().includes('irvins'))
    .slice(0, 8).forEach(a => console.log(`  '${a.slug}',`));
  console.log("],");

  // Comfort collections
  const comfortAmenities = vibeGroups['Comfort'] || [];
  console.log('\n// COMFORT Collections');
  console.log("'lounge-life': [");
  comfortAmenities.filter(a => a.name.toLowerCase().includes('lounge'))
    .slice(0, 8).forEach(a => console.log(`  '${a.slug}',`));
  console.log("],");

  // Discover collections
  const discoverAmenities = vibeGroups['Discover'] || [];
  console.log('\n// DISCOVER Collections');
  console.log("'only-at-changi': [");
  discoverAmenities.slice(0, 8).forEach(a => console.log(`  '${a.slug}',`));
  console.log("],");

  // Save to file for reference
  const outputPath = path.join(__dirname, 'amenities_by_vibe.json');
  fs.writeFileSync(outputPath, JSON.stringify(vibeGroups, null, 2));
  console.log(`\n💾 Full data saved to: ${outputPath}`);
}

if (require.main === module) {
  extractAmenitiesByVibe();
}

module.exports = { extractAmenitiesByVibe };