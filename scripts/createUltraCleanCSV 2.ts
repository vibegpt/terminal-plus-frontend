import * as fs from 'fs';

// Based on the screenshot and your data, ALL these amenities are already in Supabase
const existingAmenities = new Set([
  // Original amenities (from your first CSV)
  'apple-store', 'cabin-bar-dfs', 'chandelier', 'charles-keith', 'coach',
  'electronics-computers-sprint-cass-t1', 'electronics-computers-sprint-cass-t2',
  'eu-yan-sang', 'fila-jewel', 'fila-t4', 'fila-kids-t2', 'fragrance-bak-kwa-t3',
  'fragrance-bak-kwa-t1', 'fragrance-bak-kwa-t2', 'furla-jewel', 'furla-t3',
  'garrett-popcorn-t1', 'garrett-popcorn-t4', 'gassan-watches-t1', 'gassan-watches-t2',
  'giordano-sin-t1', 'guardian-health-beauty-sin-t1-16', 'guardian-health-beauty-sin-t1-69',
  'guardian-health-beauty-sin-t2-13', 'guardian-health-beauty-sin-t2-155',
  'guardian-health-beauty-sin-t3-basement-24', 'guardian-health-beauty-sin-t3-66',
  'guardian-health-beauty-sin-t3-29', 'gucci-t1', 'gucci-t2', 'gucci-t3',
  'heritage-zone', 'hermes-t1', 'hermes-t2', 'hermes-t3', 'immersive-wall',
  'irvins-salted-egg-jewel', 'irvins-salted-egg-t1', 'irvins-salted-egg-t4',
  'istudio', 'kaboom-t1', 'kaboom-t2', 'kaboom-t3', 'kashkha',
  'kering-eyewear-lagardere', 'lacoste', 'lego-airport-store', 'lindt',
  'longchamp-t1', 'longchamp-t2', 'longchamp-t3', 'lotte-duty-free-wines-spirits-t1-level-1-10',
  'lotte-duty-free-wines-spirits-t1-level-1-23', 'lotte-duty-free-wines-spirits-t1-level-2-53',
  'lotte-duty-free-wines-spirits-t1-level-2-68', 'lotte-duty-free-wines-spirits-t1-level-2-22',
  'lotte-duty-free-wines-spirits-t1-level-2-46', 'lotte-duty-free-wines-spirits-t2-level-1-176',
  'lotte-duty-free-wines-spirits-t2-level-2-91', 'lotte-duty-free-wines-spirits-t2-level-1-151',
  'lotte-duty-free-wines-spirits-t2-level-2-401', 'lotte-duty-free-wines-spirits-t2-level-3-189',
  'lotte-duty-free-wines-spirits-t2-level-2-197', 'lotte-duty-free-wines-spirits-t3-level-1-19',
  'lotte-duty-free-wines-spirits-t3-level-1-29', 'lotte-duty-free-wines-spirits-t3-level-2-65',
  'lotte-duty-free-wines-spirits-t3-level-2-37', 'lotte-duty-free-wines-spirits-t3-level-3-7',
  'lotte-duty-free-wines-spirits-t4-level-1-12', 'lotte-duty-free-wines-spirits-t4-level-2-25',
  'lotte-duty-free-wines-spirits-t4-level-2-57', 'louis-vuitton-t1', 'louis-vuitton-t3',
  'lululemon', 'memory-of-lived-space', 'michael-kors', 'montblanc', 'mother-and-child',
  'petalclouds', 'plaza-premium-lounge-syd', 'plaza-premium-lounge-lhr', 'qantas-business-lounge',
  'rhythm-of-nature', 'rituals', 'saga-seed', 'spirit-of-man', 'steel-in-bloom',
  'sunglass-hut-t1', 'sunglass-hut-t2', 'sunglass-hut-t3', 'swarovski-t1', 'swarovski-t2',
  'taste-singapore', 'the-cocoa-trees', 'the-digital-gadgets-jewel', 'the-digital-gadgets-t4',
  'the-fashion-place', 'tiffany-co', 'timberland', 'times-travel', 'tods',
  'tommy-hilfiger', 'tory-burch-t1', 'tory-burch-t2', 'travelex-money-changer-t1',
  'travelex-money-changer-t2', 'travelex-money-changer-t3', 'travelling-family', 'tumi',
  'twg-tea-boutique-t1', 'twg-tea-boutique-t2', 'twg-tea-boutique-t3', 'uniqlo-jewel',
  'uniqlo-t1', 'unity', 'uob-gold', 'vessel', 'victorias-secret-beauty-accessories-t1',
  'victorias-secret-beauty-accessories-t2', 'watches-of-switzerland', 'whsmith-t1-level-1-84',
  'whsmith-t1-level-2-67', 'whsmith-t1-level-2-41', 'whsmith-t2-level-1-26',
  'whsmith-t2-level-2-207', 'whsmith-t3-level-2-43', 'whsmith-t3-level-2-7',
  'whsmith-t4-level-2-59', 'zakkasg', 'zegna',
  
  // Caffè Nero locations
  'caffe-nero-t3-departures', 'caffe-nero-t3-gate-b36', 'caffe-nero-t4-gate-16',
  'caffe-nero-t5-arrivals', 'caffe-nero-t5-check-in',
  
  // ALL the new amenities that were uploaded (from the screenshot and your data)
  'canopy-park-jewel-new', 'foggy-bowls-jewel-new', 'hedge-maze-jewel-new',
  'manulife-sky-nets-jewel-new', 'mirror-maze-jewel-new', 'rain-vortex-jewel-new',
  'shiseido-forest-valley-jewel-new', 'changi-experience-studio-jewel-new',
  'social-tree-jewel-new', 'bengawan-solo-jewel-new', 'tiger-street-lab-jewel-new',
  'din-tai-fung-jewel-new', 'koi-th-jewel-new', 'song-fa-bak-kut-teh-jewel-new',
  'travelex-jewel-new', 'uob-currency-exchange-jewel-new', 'telecommunications-kiosk-jewel-new',
  'trs-tax-refund-jewel-new', 'spa-express-jewel-new', 'kinokuniya-jewel-new',
  'zara-jewel-new', 'irvins-salted-egg-jewel-new', 'eu-yan-sang-jewel-new',
  'muji-jewel-new', 'manulife-sky-nets-t1-new', 'mirror-maze-t1-new', 'rain-vortex-t1-new',
  'shiseido-forest-valley-t1-new', 'entertainment-deck-t1-new', 'butterfly-garden-t1-new',
  'cactus-garden-t1-new', 'koi-pond-t1-new', 'sunflower-garden-t1-new',
  'tiger-street-lab-t1-new', 'din-tai-fung-t1-new', 'paradise-dynasty-t1-new',
  'bee-cheng-hiang-t1-new', 'koi-th-t1-new', 'sushi-tei-t1-new', 'song-fa-bak-kut-teh-t1-new',
  'crowne-plaza-changi-airport-t1-new', 'ambassador-transit-hotel-t1-new',
  'singapore-airlines-silverkris-lounge-t1-new', 'sats-premier-lounge-t1-new',
  'dnata-lounge-t1-new', 'uob-currency-exchange-t1-new', 'telecommunications-kiosk-t1-new',
  'trs-tax-refund-t1-new', 'spa-express-t1-new', 'lotte-duty-free-t1-new',
  'uniqlo-t1-new', 'zara-t1-new', 'eu-yan-sang-t1-new', 'muji-t1-new',
  'tokyu-hands-t1-new', 'canopy-park-t2-new', 'foggy-bowls-t2-new', 'mirror-maze-t2-new',
  'rain-vortex-t2-new', 'entertainment-deck-t2-new', 'butterfly-garden-t2-new',
  'cactus-garden-t2-new', 'koi-pond-t2-new', 'sunflower-garden-t2-new',
  'bengawan-solo-t2-new', 'tiger-street-lab-t2-new', 'din-tai-fung-t2-new',
  'paradise-dynasty-t2-new', 'koi-th-t2-new', 'old-chang-kee-t2-new',
  'song-fa-bak-kut-teh-t2-new', 'aerotel-singapore-t2-new', 'yotelair-singapore-changi-t2-new',
  'cathay-pacific-lounge-t2-new', 'singapore-airlines-silverkris-lounge-t2-new',
  'dnata-lounge-t2-new', 'travelex-t2-new', 'uob-currency-exchange-t2-new',
  'telecommunications-kiosk-t2-new', 'trs-tax-refund-t2-new', 'kinokuniya-t2-new',
  'uniqlo-t2-new', 'zara-t2-new', 'irvins-salted-egg-t2-new', 'eu-yan-sang-t2-new',
  'muji-t2-new', 'canopy-park-t3-new', 'foggy-bowls-t3-new', 'the-slidet3-t3-new',
  'changi-experience-studio-t3-new', 'entertainment-deck-t3-new', 'butterfly-garden-t3-new',
  'cactus-garden-t3-new', 'koi-pond-t3-new', 'sunflower-garden-t3-new',
  'bengawan-solo-t3-new', 'tiger-street-lab-t3-new', 'din-tai-fung-t3-new',
  'paradise-dynasty-t3-new', 'bee-cheng-hiang-t3-new', 'ya-kun-kaya-toast-t3-new',
  'sushi-tei-t3-new', 'aerotel-singapore-t3-new', 'yotelair-singapore-changi-t3-new',
  'cathay-pacific-lounge-t3-new', 'sats-premier-lounge-t3-new', 'dnata-lounge-t3-new',
  'uob-currency-exchange-t3-new', 'telecommunications-kiosk-t3-new', 'trs-tax-refund-t3-new',
  'spa-express-t3-new', 'kinokuniya-t3-new', 'lotte-duty-free-t3-new',
  'uniqlo-t3-new', 'irvins-salted-egg-t3-new', 'muji-t3-new', 'tokyu-hands-t3-new',
  'canopy-park-t4-new', 'manulife-sky-nets-t4-new', 'mirror-maze-t4-new',
  'changi-experience-studio-t4-new', 'entertainment-deck-t4-new', 'butterfly-garden-t4-new',
  'cactus-garden-t4-new', 'koi-pond-t4-new', 'sunflower-garden-t4-new',
  'tiger-street-lab-t4-new', 'din-tai-fung-t4-new', 'paradise-dynasty-t4-new',
  'koi-th-t4-new', 'ya-kun-kaya-toast-t4-new', 'sushi-tei-t4-new',
  'song-fa-bak-kut-teh-t4-new', 'ambassador-transit-hotel-t4-new',
  'yotelair-singapore-changi-t4-new', 'singapore-airlines-silverkris-lounge-t4-new',
  'plaza-premium-lounge-t4-new', 'sats-premier-lounge-t4-new', 'uob-currency-exchange-t4-new',
  'telecommunications-kiosk-t4-new', 'trs-tax-refund-t4-new', 'spa-express-t4-new',
  'lotte-duty-free-t4-new', 'charles-keith-t4-new', 'zara-t4-new',
  'irvins-salted-egg-t4-new', 'twg-tea-t4-new', 'tokyu-hands-t4-new',
  
  // Also exclude the base names without suffixes
  'canopy-park-jewel', 'foggy-bowls-jewel', 'hedge-maze-jewel',
  'manulife-sky-nets-jewel', 'mirror-maze-jewel', 'rain-vortex-jewel',
  'shiseido-forest-valley-jewel', 'changi-experience-studio-jewel',
  'social-tree-jewel', 'bengawan-solo-jewel', 'tiger-street-lab-jewel',
  'din-tai-fung-jewel', 'koi-th-jewel', 'song-fa-bak-kut-teh-jewel',
  'travelex-jewel', 'uob-currency-exchange-jewel', 'telecommunications-kiosk-jewel',
  'trs-tax-refund-jewel', 'spa-express-jewel', 'kinokuniya-jewel',
  'zara-jewel', 'irvins-salted-egg-jewel', 'eu-yan-sang-jewel',
  'muji-jewel', 'manulife-sky-nets-t1', 'mirror-maze-t1', 'rain-vortex-t1',
  'shiseido-forest-valley-t1', 'entertainment-deck-t1', 'butterfly-garden-t1',
  'cactus-garden-t1', 'koi-pond-t1', 'sunflower-garden-t1',
  'tiger-street-lab-t1', 'din-tai-fung-t1', 'paradise-dynasty-t1',
  'bee-cheng-hiang-t1', 'koi-th-t1', 'sushi-tei-t1', 'song-fa-bak-kut-teh-t1',
  'crowne-plaza-changi-airport-t1', 'ambassador-transit-hotel-t1',
  'singapore-airlines-silverkris-lounge-t1', 'sats-premier-lounge-t1',
  'dnata-lounge-t1', 'uob-currency-exchange-t1', 'telecommunications-kiosk-t1',
  'trs-tax-refund-t1', 'spa-express-t1', 'lotte-duty-free-t1',
  'uniqlo-t1', 'zara-t1', 'eu-yan-sang-t1', 'muji-t1',
  'tokyu-hands-t1', 'canopy-park-t2', 'foggy-bowls-t2', 'mirror-maze-t2',
  'rain-vortex-t2', 'entertainment-deck-t2', 'butterfly-garden-t2',
  'cactus-garden-t2', 'koi-pond-t2', 'sunflower-garden-t2',
  'bengawan-solo-t2', 'tiger-street-lab-t2', 'din-tai-fung-t2',
  'paradise-dynasty-t2', 'koi-th-t2', 'old-chang-kee-t2',
  'song-fa-bak-kut-teh-t2', 'aerotel-singapore-t2', 'yotelair-singapore-changi-t2',
  'cathay-pacific-lounge-t2', 'singapore-airlines-silverkris-lounge-t2',
  'dnata-lounge-t2', 'travelex-t2', 'uob-currency-exchange-t2',
  'telecommunications-kiosk-t2', 'trs-tax-refund-t2', 'kinokuniya-t2',
  'uniqlo-t2', 'zara-t2', 'irvins-salted-egg-t2', 'eu-yan-sang-t2',
  'muji-t2', 'canopy-park-t3', 'foggy-bowls-t3', 'the-slidet3-t3',
  'changi-experience-studio-t3', 'entertainment-deck-t3', 'butterfly-garden-t3',
  'cactus-garden-t3', 'koi-pond-t3', 'sunflower-garden-t3',
  'bengawan-solo-t3', 'tiger-street-lab-t3', 'din-tai-fung-t3',
  'paradise-dynasty-t3', 'bee-cheng-hiang-t3', 'ya-kun-kaya-toast-t3',
  'sushi-tei-t3', 'aerotel-singapore-t3', 'yotelair-singapore-changi-t3',
  'cathay-pacific-lounge-t3', 'sats-premier-lounge-t3', 'dnata-lounge-t3',
  'uob-currency-exchange-t3', 'telecommunications-kiosk-t3', 'trs-tax-refund-t3',
  'spa-express-t3', 'kinokuniya-t3', 'lotte-duty-free-t3',
  'uniqlo-t3', 'irvins-salted-egg-t3', 'muji-t3', 'tokyu-hands-t3',
  'canopy-park-t4', 'manulife-sky-nets-t4', 'mirror-maze-t4',
  'changi-experience-studio-t4', 'entertainment-deck-t4', 'butterfly-garden-t4',
  'cactus-garden-t4', 'koi-pond-t4', 'sunflower-garden-t4',
  'tiger-street-lab-t4', 'din-tai-fung-t4', 'paradise-dynasty-t4',
  'koi-th-t4', 'ya-kun-kaya-toast-t4', 'sushi-tei-t4',
  'song-fa-bak-kut-teh-t4', 'ambassador-transit-hotel-t4',
  'yotelair-singapore-changi-t4', 'singapore-airlines-silverkris-lounge-t4',
  'plaza-premium-lounge-t4', 'sats-premier-lounge-t4', 'uob-currency-exchange-t4',
  'telecommunications-kiosk-t4', 'trs-tax-refund-t4', 'spa-express-t4',
  'lotte-duty-free-t4', 'charles-keith-t4', 'zara-t4',
  'irvins-salted-egg-t4', 'twg-tea-t4', 'tokyu-hands-t4'
]);

// Read the original CSV and filter out existing amenities
const csvContent = fs.readFileSync('supabase-amenities.csv', 'utf-8');
const lines = csvContent.split('\n');
const header = lines[0];
const filteredLines = [header];

let newId = 30000; // Start from 30000 to be extra safe
let count = 0;

for (let i = 1; i < lines.length; i++) {
  const line = lines[i];
  if (!line.trim()) continue;
  
  const columns = line.split(',');
  if (columns.length >= 14) {
    const amenitySlug = columns[2];
    
    if (!existingAmenities.has(amenitySlug)) {
      // Update the ID and add -ultra suffix
      const newColumns = [...columns];
      newColumns[0] = newId.toString();
      newColumns[2] = `${amenitySlug}-ultra`;
      filteredLines.push(newColumns.join(','));
      newId++;
      count++;
      console.log(`✅ Adding: ${columns[13]?.replace(/"/g, '') || amenitySlug}`);
    } else {
      console.log(`❌ Skipping: ${columns[13]?.replace(/"/g, '') || amenitySlug} (already exists)`);
    }
  }
}

// Write the filtered CSV
fs.writeFileSync('supabase-amenities-ultra-clean.csv', filteredLines.join('\n'));

console.log(`\n📊 Summary:`);
console.log(`   - Total amenities in original: ${lines.length - 1}`);
console.log(`   - Amenities filtered out: ${lines.length - 1 - count}`);
console.log(`   - Amenities in ultra-clean CSV: ${count}`);
console.log(`   - ID range: 30000-${newId - 1}`);
console.log(`\n✅ Ultra-clean CSV saved to: supabase-amenities-ultra-clean.csv`);

if (count === 0) {
  console.log(`\n🎉 All amenities are already in your Supabase table!`);
  console.log(`   No new amenities to upload.`);
} else {
  console.log(`\n📋 Amenities to upload:`);
  for (let i = 1; i < filteredLines.length; i++) {
    const columns = filteredLines[i].split(',');
    if (columns.length >= 14) {
      console.log(`   - ${columns[13]?.replace(/"/g, '') || columns[2]}`);
    }
  }
} 