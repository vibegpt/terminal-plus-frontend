// Analyze and improve Chill vibe tagging for bars, restaurants, and quiet spaces
const fs = require('fs');
const path = require('path');

function analyzeChill() {
  console.log('🧘 Analyzing CHILL vibe tagging opportunities...\n');

  const amenitiesPath = path.join(__dirname, '../src/data/amenities.json');
  const amenities = JSON.parse(fs.readFileSync(amenitiesPath, 'utf8'));

  // Current chill amenities
  const currentChill = amenities.filter(a => a.vibe_tags?.includes('Chill'));

  console.log('📊 CURRENT CHILL AMENITIES (' + currentChill.length + '):');
  currentChill.forEach(a => {
    console.log(`  ✅ ${a.name} (${a.category}) [${a.terminal_code}]`);
  });

  // Potential chill candidates - bars, wine, tea, quiet restaurants
  const chillKeywords = [
    'wine', 'lounge', 'tea', 'coffee', 'garden', 'spa', 'quiet', 'relax',
    'bar', 'cafe', 'bistro', 'brewery', 'cocktail', 'whisky', 'champagne'
  ];

  const potentialChill = amenities.filter(a => {
    if (a.vibe_tags?.includes('Chill')) return false; // Already tagged

    const searchText = `${a.name} ${a.description} ${a.category} ${a.amenity_type}`.toLowerCase();
    return chillKeywords.some(keyword => searchText.includes(keyword));
  });

  console.log('\n🤔 POTENTIAL CHILL CANDIDATES (' + potentialChill.length + '):');

  // Group by category for easier analysis
  const grouped = {};
  potentialChill.forEach(a => {
    const category = a.category || 'Other';
    if (!grouped[category]) grouped[category] = [];
    grouped[category].push(a);
  });

  Object.entries(grouped).forEach(([category, items]) => {
    console.log(`\n  ${category.toUpperCase()} (${items.length}):`);
    items.forEach(a => {
      const currentVibes = a.vibe_tags?.join(', ') || 'None';
      console.log(`    🟡 ${a.name} [${a.terminal_code}]`);
      console.log(`       Current vibes: ${currentVibes}`);
      console.log(`       Type: ${a.amenity_type || 'N/A'}`);
      if (a.description) {
        console.log(`       Description: ${a.description}`);
      }
      console.log('');
    });
  });

  // Analyze bars specifically (they vary widely in atmosphere)
  console.log('\n🍻 BAR ANALYSIS - Atmosphere Assessment Needed:');
  const bars = amenities.filter(a => {
    const searchText = `${a.name} ${a.description} ${a.amenity_type}`.toLowerCase();
    return searchText.includes('bar') ||
           searchText.includes('brewery') ||
           searchText.includes('pub') ||
           searchText.includes('cocktail');
  });

  bars.forEach(a => {
    const isChill = a.vibe_tags?.includes('Chill');
    const currentVibes = a.vibe_tags?.join(', ') || 'None';
    console.log(`  ${isChill ? '✅' : '❓'} ${a.name} [${a.terminal_code}]`);
    console.log(`     Current vibes: ${currentVibes}`);
    console.log(`     Type: ${a.amenity_type || 'N/A'}`);
    if (a.description) {
      console.log(`     Description: ${a.description}`);
    }
    console.log('');
  });

  // Recommendations for different types of chill environments
  console.log('\n💡 CHILL VIBE RECOMMENDATIONS:');

  console.log('\n  🍷 WINE BARS & LOUNGES (Likely Chill):');
  const wineSpaces = potentialChill.filter(a => {
    const text = `${a.name} ${a.description}`.toLowerCase();
    return text.includes('wine') || text.includes('cocktail') ||
           (text.includes('bar') && !text.includes('sports'));
  });
  wineSpaces.forEach(a => {
    console.log(`    + ${a.name} [${a.terminal_code}] - ${a.amenity_type}`);
  });

  console.log('\n  ☕ CAFES & TEA HOUSES (Likely Chill):');
  const quietCafes = potentialChill.filter(a => {
    const text = `${a.name} ${a.description}`.toLowerCase();
    return text.includes('coffee') || text.includes('tea') || text.includes('cafe');
  });
  quietCafes.forEach(a => {
    console.log(`    + ${a.name} [${a.terminal_code}] - ${a.amenity_type}`);
  });

  console.log('\n  🌿 NATURE & WELLNESS (Definitely Chill):');
  const wellness = potentialChill.filter(a => {
    const text = `${a.name} ${a.description}`.toLowerCase();
    return text.includes('garden') || text.includes('spa') || text.includes('nature');
  });
  wellness.forEach(a => {
    console.log(`    + ${a.name} [${a.terminal_code}] - ${a.amenity_type}`);
  });

  // Generate suggested updates
  console.log('\n📝 SUGGESTED CHILL VIBE ADDITIONS:');
  console.log('// Add these to your amenities for better Chill collections:');

  const autoSuggestions = [
    ...wineSpaces.slice(0, 5),
    ...quietCafes.slice(0, 5),
    ...wellness
  ];

  autoSuggestions.forEach(a => {
    const newVibes = [...(a.vibe_tags || []), 'Chill'];
    console.log(`// ${a.name}: Add "Chill" to [${a.vibe_tags?.join(', ') || 'None'}]`);
    console.log(`"${a.slug}": ${JSON.stringify(newVibes)},`);
  });

  return {
    currentChill: currentChill.length,
    potentialChill: potentialChill.length,
    bars: bars.length,
    suggestions: autoSuggestions.length
  };
}

if (require.main === module) {
  analyzeChill();
}

module.exports = { analyzeChill };