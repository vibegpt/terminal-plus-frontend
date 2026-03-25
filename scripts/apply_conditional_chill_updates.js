// Apply conditional Chill vibe updates based on user feedback
const fs = require('fs');
const path = require('path');

function applyConditionalChillUpdates() {
  console.log('🏷️  Applying conditional Chill vibe updates...\n');

  // Based on user feedback:
  // YES: Traditional cafes, Tap + Brew
  // NO: Hard Rock, Starbucks
  const conditionalChillUpdates = {
    "ya-kun-family-cafe-t3": ["Refuel","Quick","Comfort","Chill"],
    "old-town-express-t3": ["Refuel","Quick","Chill"],
    "tap-brew-t1": ["Refuel","Discover","Comfort","Chill"]
  };

  const amenitiesPath = path.join(__dirname, '../src/data/amenities.json');
  let amenities = JSON.parse(fs.readFileSync(amenitiesPath, 'utf8'));

  console.log('📋 CONDITIONAL UPDATES BASED ON LOCAL KNOWLEDGE:');

  let updatedCount = 0;
  amenities.forEach(amenity => {
    if (conditionalChillUpdates[amenity.slug]) {
      const oldVibes = [...(amenity.vibe_tags || [])];
      amenity.vibe_tags = conditionalChillUpdates[amenity.slug];
      updatedCount++;
      console.log(`✅ ${amenity.name} [${amenity.terminal_code}]`);
      console.log(`   Type: ${amenity.amenity_type || 'N/A'}`);
      console.log(`   Before: [${oldVibes.join(', ')}]`);
      console.log(`   After:  [${amenity.vibe_tags.join(', ')}]`);
      console.log('');
    }
  });

  // Write back to file
  fs.writeFileSync(amenitiesPath, JSON.stringify(amenities, null, 2));

  console.log('📊 FINAL CHILL STATS:');
  const finalChill = amenities.filter(a => a.vibe_tags?.includes('Chill')).length;
  console.log(`   Total Chill amenities: ${finalChill}`);
  console.log(`   Conditional updates applied: ${updatedCount}`);

  console.log('\n✅ APPROVED FOR CHILL:');
  console.log('   • Ya Kun Family Cafe - Traditional kopitiam atmosphere');
  console.log('   • Old Town Express - Malaysian coffee shop, relaxed setting');
  console.log('   • Tap + Brew - Craft beer pub (not sports bar style)');

  console.log('\n❌ REJECTED FOR CHILL:');
  console.log('   • Hard Rock Cafe - Rock music theme, can be loud');
  console.log('   • Starbucks - Busy international chain, depends on time but generally bustling');
  console.log('   • Hudsons Coffee - (not specified, assuming similar to Starbucks)');

  return {
    finalChillCount: finalChill,
    conditionalUpdates: updatedCount
  };
}

if (require.main === module) {
  applyConditionalChillUpdates();
}

module.exports = { applyConditionalChillUpdates };