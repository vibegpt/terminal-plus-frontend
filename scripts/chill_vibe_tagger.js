// Interactive script to help tag amenities for Chill vibe
const fs = require('fs');
const path = require('path');

function suggestChillTags() {
  console.log('🏷️  CHILL VIBE TAGGING RECOMMENDATIONS\n');

  const amenitiesPath = path.join(__dirname, '../src/data/amenities.json');
  let amenities = JSON.parse(fs.readFileSync(amenitiesPath, 'utf8'));

  // High confidence chill additions
  const definitelyChillUpdates = [
    {
      slug: 'cha-mulan-jewel',
      reason: 'Tea house - inherently relaxing atmosphere',
      action: 'add'
    },
    {
      slug: 'tiger-den-t4',
      reason: 'Explicitly described as "Chill bar"',
      action: 'add'
    },
    {
      slug: 'fish-spa-t1',
      reason: 'Spa services are relaxing by nature',
      action: 'add'
    },
    {
      slug: 'spa-express',
      reason: 'Quick massage/spa treatments',
      action: 'add'
    },
    {
      slug: 'aji-ichi-sushi-bar-t4',
      reason: 'Sushi bars typically have quiet, focused atmosphere',
      action: 'add'
    },
    {
      slug: 'twg-tea-boutique-t1',
      reason: 'Premium tea boutique with tasting - relaxing',
      action: 'add'
    },
    {
      slug: 'twg-tea-boutique-t2',
      reason: 'Premium tea boutique with tasting - relaxing',
      action: 'add'
    },
    {
      slug: 'twg-tea-boutique-t3',
      reason: 'Premium tea boutique with tasting - relaxing',
      action: 'add'
    }
  ];

  // Conditional chill additions - need judgment
  const maybeChillUpdates = [
    {
      slug: 'hudsons-coffee-t2',
      reason: 'Coffee shop - depends on seating style and noise level',
      question: 'Quiet cafe with comfortable seating?'
    },
    {
      slug: 'starbucks-t3',
      reason: 'Coffee chain - some locations are busier than others',
      question: 'Does this Starbucks have quiet seating areas?'
    },
    {
      slug: 'hard-rock-cafe-t2',
      reason: 'Rock themed restaurant - could be loud or have quiet sections',
      question: 'Does Hard Rock have quieter seating away from music?'
    },
    {
      slug: 'tap-brew-t1',
      reason: 'Craft beer pub - could be sports bar or quiet gastropub',
      question: 'Is this a quiet craft beer spot or loud sports bar?'
    },
    {
      slug: 'ya-kun-family-cafe-t3',
      reason: 'Traditional cafe - usually quiet local atmosphere',
      question: 'Traditional cafes are often chill - quiet atmosphere?'
    },
    {
      slug: 'old-town-express-t3',
      reason: 'Malaysian coffee shop - traditional style often relaxed',
      question: 'Traditional kopitiam style with relaxed seating?'
    }
  ];

  console.log('✅ DEFINITE CHILL ADDITIONS (8):');
  definitelyChillUpdates.forEach(update => {
    const amenity = amenities.find(a => a.slug === update.slug);
    if (amenity) {
      console.log(`  🎯 ${amenity.name} [${amenity.terminal_code}]`);
      console.log(`     Type: ${amenity.amenity_type || 'N/A'}`);
      console.log(`     Reason: ${update.reason}`);
      console.log(`     Current vibes: ${amenity.vibe_tags?.join(', ') || 'None'}`);
      console.log('');
    }
  });

  console.log('🤔 CONDITIONAL CHILL ADDITIONS (6):');
  console.log('These need on-site assessment or local knowledge:');
  maybeChillUpdates.forEach(update => {
    const amenity = amenities.find(a => a.slug === update.slug);
    if (amenity) {
      console.log(`  ❓ ${amenity.name} [${amenity.terminal_code}]`);
      console.log(`     Type: ${amenity.amenity_type || 'N/A'}`);
      console.log(`     Question: ${update.question}`);
      console.log(`     Current vibes: ${amenity.vibe_tags?.join(', ') || 'None'}`);
      console.log('');
    }
  });

  // Generate update script
  console.log('📝 AUTO-UPDATE SCRIPT:');
  console.log('Copy and run this to apply the definite additions:\n');

  const updates = {};
  definitelyChillUpdates.forEach(update => {
    const amenity = amenities.find(a => a.slug === update.slug);
    if (amenity) {
      const currentVibes = amenity.vibe_tags || [];
      if (!currentVibes.includes('Chill')) {
        updates[amenity.slug] = [...currentVibes, 'Chill'];
      }
    }
  });

  console.log('const chillUpdates = {');
  Object.entries(updates).forEach(([slug, vibes]) => {
    console.log(`  "${slug}": ${JSON.stringify(vibes)},`);
  });
  console.log('};\n');

  // Apply updates function
  console.log('// Function to apply these updates:');
  console.log(`function applyChillUpdates() {
  const fs = require('fs');
  const path = require('path');

  const chillUpdates = {`);
  Object.entries(updates).forEach(([slug, vibes]) => {
    console.log(`    "${slug}": ${JSON.stringify(vibes)},`);
  });
  console.log(`  };

  const amenitiesPath = path.join(__dirname, '../src/data/amenities.json');
  let amenities = JSON.parse(fs.readFileSync(amenitiesPath, 'utf8'));

  let updatedCount = 0;
  amenities.forEach(amenity => {
    if (chillUpdates[amenity.slug]) {
      amenity.vibe_tags = chillUpdates[amenity.slug];
      updatedCount++;
      console.log('✅ Updated:', amenity.name, '- Added Chill vibe');
    }
  });

  fs.writeFileSync(amenitiesPath, JSON.stringify(amenities, null, 2));
  console.log('\\n🎉 Updated', updatedCount, 'amenities with Chill vibe');
}`);

  console.log('\n🎯 COLLECTION IMPACT:');
  console.log('After these updates, you could create these Chill collections:');
  console.log('');
  console.log("'quiet-sips': [");
  console.log("  'cha-mulan-jewel',           // Chinese tea house");
  console.log("  'twg-tea-boutique-t1',       // Premium tea T1");
  console.log("  'twg-tea-boutique-t2',       // Premium tea T2");
  console.log("  'twg-tea-boutique-t3',       // Premium tea T3");
  console.log("  'hudsons-coffee-t2',         // Coffee shop (if quiet)");
  console.log("  'starbucks-t3',              // Coffee (if quiet seating)");
  console.log("  'tiger-den-t4'               // Chill bar");
  console.log("],");
  console.log('');
  console.log("'wellness-escape': [");
  console.log("  'fish-spa-t1',               // Fish spa experience");
  console.log("  'spa-express',               // Quick spa treatments");
  console.log("  'butterfly-garden',          // Nature gardens");
  console.log("  'cactus-garden',");
  console.log("  'sunflower-garden',");
  console.log("  'koi-pond'");
  console.log("],");
  console.log('');
  console.log("'quiet-dining': [");
  console.log("  'aji-ichi-sushi-bar-t4',     // Focused sushi experience");
  console.log("  'paradise-dynasty',          // Upscale Chinese");
  console.log("  'ya-kun-family-cafe-t3',     // Traditional cafe (if confirmed quiet)");
  console.log("  'old-town-express-t3'        // Traditional kopitiam (if confirmed quiet)");
  console.log("],");

  return {
    definiteUpdates: definitelyChillUpdates.length,
    conditionalUpdates: maybeChillUpdates.length,
    totalPotential: definitelyChillUpdates.length + maybeChillUpdates.length
  };
}

if (require.main === module) {
  suggestChillTags();
}

module.exports = { suggestChillTags };