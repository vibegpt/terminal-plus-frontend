// Apply the definite Chill vibe updates
const fs = require('fs');
const path = require('path');

function applyChillUpdates() {
  console.log('🏷️  Applying Chill vibe updates...\n');

  const chillUpdates = {
    "cha-mulan-jewel": ["Refuel","Comfort","Work","Chill"],
    "tiger-den-t4": ["Refuel","Discover","Comfort","Chill"],
    "fish-spa-t1": ["Comfort","Explore","Refuel","Discover","Chill"],
    "spa-express": ["Shop","Comfort","Quick","Chill"],
    "aji-ichi-sushi-bar-t4": ["Refuel","Comfort","Chill"],
    "twg-tea-boutique-t1": ["Shop","Refuel","Chill"],
    "twg-tea-boutique-t2": ["Shop","Refuel","Chill"],
    "twg-tea-boutique-t3": ["Shop","Refuel","Chill"],
  };

  const amenitiesPath = path.join(__dirname, '../src/data/amenities.json');
  let amenities = JSON.parse(fs.readFileSync(amenitiesPath, 'utf8'));

  console.log('📋 BEFORE UPDATES:');
  const beforeChill = amenities.filter(a => a.vibe_tags?.includes('Chill')).length;
  console.log(`   Chill amenities: ${beforeChill}`);

  let updatedCount = 0;
  amenities.forEach(amenity => {
    if (chillUpdates[amenity.slug]) {
      const oldVibes = [...(amenity.vibe_tags || [])];
      amenity.vibe_tags = chillUpdates[amenity.slug];
      updatedCount++;
      console.log(`✅ ${amenity.name} [${amenity.terminal_code}]`);
      console.log(`   Before: [${oldVibes.join(', ')}]`);
      console.log(`   After:  [${amenity.vibe_tags.join(', ')}]`);
      console.log('');
    }
  });

  // Write back to file
  fs.writeFileSync(amenitiesPath, JSON.stringify(amenities, null, 2));

  console.log('📊 AFTER UPDATES:');
  const afterChill = amenities.filter(a => a.vibe_tags?.includes('Chill')).length;
  console.log(`   Chill amenities: ${afterChill} (+${afterChill - beforeChill})`);
  console.log(`   Updated: ${updatedCount} amenities`);

  console.log('\n🎯 READY FOR COLLECTIONS:');
  console.log('You can now create meaningful Chill collections like:');
  console.log('• quiet-sips (tea houses, coffee, chill bar)');
  console.log('• wellness-escape (spas, gardens)');
  console.log('• quiet-dining (sushi bar, upscale restaurants)');

  return {
    beforeCount: beforeChill,
    afterCount: afterChill,
    updated: updatedCount
  };
}

if (require.main === module) {
  applyChillUpdates();
}

module.exports = { applyChillUpdates };