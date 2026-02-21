// Verify that all collection amenities exist in the main amenities.json file
const fs = require('fs');
const path = require('path');

function verifyCollections() {
  console.log('🔍 Verifying collection mappings...');

  // Read amenities data
  const amenitiesPath = path.join(__dirname, '../src/data/amenities.json');
  const amenities = JSON.parse(fs.readFileSync(amenitiesPath, 'utf8'));
  const amenitySlugs = new Set(amenities.map(a => a.slug));

  // Read collection mappings
  const { COLLECTION_AMENITIES } = require('../src/config/collectionAmenities.ts');

  let totalMappings = 0;
  let foundMappings = 0;
  let missingAmenities = [];

  console.log('\n📋 COLLECTION VERIFICATION:');

  Object.entries(COLLECTION_AMENITIES).forEach(([collectionId, amenityList]) => {
    console.log(`\n${collectionId} (${amenityList.length} amenities):`);

    const missing = [];
    amenityList.forEach(slug => {
      totalMappings++;
      if (amenitySlugs.has(slug)) {
        foundMappings++;
        console.log(`  ✅ ${slug}`);
      } else {
        missing.push(slug);
        missingAmenities.push({ collection: collectionId, slug });
        console.log(`  ❌ ${slug} (NOT FOUND)`);
      }
    });

    if (missing.length === 0) {
      console.log(`  🎉 All amenities found for ${collectionId}!`);
    } else {
      console.log(`  ⚠️  ${missing.length} missing amenities in ${collectionId}`);
    }
  });

  console.log('\n📊 SUMMARY:');
  console.log(`Total mappings: ${totalMappings}`);
  console.log(`Found: ${foundMappings}`);
  console.log(`Missing: ${totalMappings - foundMappings}`);
  console.log(`Success rate: ${Math.round((foundMappings / totalMappings) * 100)}%`);

  if (missingAmenities.length > 0) {
    console.log('\n❌ MISSING AMENITIES:');
    missingAmenities.forEach(item => {
      console.log(`  ${item.collection}: ${item.slug}`);
    });
  }

  // Check collection sizes
  console.log('\n📏 COLLECTION SIZES:');
  Object.entries(COLLECTION_AMENITIES).forEach(([collectionId, amenityList]) => {
    const status = amenityList.length >= 5 ? '✅' : '❌';
    console.log(`  ${status} ${collectionId}: ${amenityList.length} amenities ${amenityList.length < 5 ? '(BELOW MINIMUM)' : ''}`);
  });

  return {
    totalMappings,
    foundMappings,
    missingAmenities,
    successRate: Math.round((foundMappings / totalMappings) * 100)
  };
}

if (require.main === module) {
  verifyCollections();
}

module.exports = { verifyCollections };