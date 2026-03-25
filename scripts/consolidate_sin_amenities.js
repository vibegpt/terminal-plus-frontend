// Consolidate all Singapore (SIN) amenities data
// This script combines data from terminal JSON files and Supabase CSV

const fs = require('fs');
const path = require('path');

// Helper function to parse CSV
function parseCSV(csvText) {
  const lines = csvText.split('\n');
  const headers = lines[0].split(',');
  const data = [];

  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trim()) {
      const values = lines[i].split(',');
      const obj = {};
      headers.forEach((header, index) => {
        obj[header] = values[index] || '';
      });
      data.push(obj);
    }
  }
  return data;
}

// Helper function to clean vibe tags from CSV format
function cleanVibeTags(vibeString) {
  if (!vibeString) return [];
  // Remove curly braces and split by comma
  const cleaned = vibeString.replace(/[{}]/g, '').trim();
  if (!cleaned) return [];
  return cleaned.split(',').map(tag => tag.trim()).filter(tag => tag);
}

// Helper function to create slug from name
function createSlug(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

// Helper function to normalize amenity data
function normalizeAmenity(amenity, source) {
  const normalized = {
    name: amenity.name || '',
    slug: amenity.slug || amenity.amenity_slug || createSlug(amenity.name || ''),
    terminal_code: amenity.terminal_code || amenity.terminal || '',
    airport_code: 'SIN',
    category: amenity.category || '',
    amenity_type: amenity.type || amenity.amenity_type || '',
    description: amenity.description || '',
    location_description: amenity.location_description || '',
    vibe_tags: amenity.vibe_tags || [],
    status: amenity.status || 'active',
    available_in_transit: amenity.available_in_transit || false,
    opening_hours: amenity.opening_hours || {},
    price_tier: amenity.price_tier || amenity.price_level || '',
    coordinates: amenity.coordinates || {},
    image_url: amenity.image_url || amenity.logo_url || '',
    website_url: amenity.website_url || '',
    booking_required: amenity.booking_required || false,
    source: source
  };

  // Ensure slug exists
  if (!normalized.slug && normalized.name) {
    normalized.slug = createSlug(normalized.name);
  }

  return normalized;
}

async function consolidateAmenities() {
  console.log('🚀 Starting SIN amenities consolidation...');

  const dataDir = path.join(__dirname, '../src/data');
  const scriptDir = __dirname;
  const amenities = [];
  const seenSlugs = new Set();

  // 1. Read terminal JSON files
  const terminalFiles = [
    'sin_t1.json',
    'sin_t2.json',
    'sin_t3.json',
    'sin_t4.json',
    'sin_jewel.json'
  ];

  for (const filename of terminalFiles) {
    const filepath = path.join(dataDir, filename);
    if (fs.existsSync(filepath)) {
      console.log(`📁 Reading ${filename}...`);
      try {
        const data = JSON.parse(fs.readFileSync(filepath, 'utf8'));
        const terminal = filename.replace('.json', '').toUpperCase().replace('_', '-');

        data.forEach(amenity => {
          const normalized = normalizeAmenity(amenity, `json_${filename}`);

          // Skip if we've seen this slug already (deduplication)
          if (!seenSlugs.has(normalized.slug)) {
            seenSlugs.add(normalized.slug);
            amenities.push(normalized);
          }
        });

        console.log(`   ✅ Added ${data.length} amenities from ${filename}`);
      } catch (error) {
        console.error(`   ❌ Error reading ${filename}:`, error.message);
      }
    }
  }

  // 2. Read CSV file
  const csvPath = path.join(scriptDir, 'amenity_detail_rows-9.csv');
  if (fs.existsSync(csvPath)) {
    console.log('📊 Reading Supabase CSV data...');
    try {
      const csvText = fs.readFileSync(csvPath, 'utf8');
      const csvData = parseCSV(csvText);

      const sinAmenities = csvData.filter(row => row.airport_code === 'SIN');

      sinAmenities.forEach(amenity => {
        // Clean vibe tags from CSV format
        const vibeTagsArray = cleanVibeTags(amenity.vibe_tags);

        const normalized = normalizeAmenity({
          ...amenity,
          vibe_tags: vibeTagsArray,
          available_in_transit: amenity.available_in_tr === 'true'
        }, 'supabase_csv');

        // Only add if slug is unique
        if (!seenSlugs.has(normalized.slug)) {
          seenSlugs.add(normalized.slug);
          amenities.push(normalized);
        }
      });

      console.log(`   ✅ Added ${sinAmenities.length} amenities from CSV`);
    } catch (error) {
      console.error('   ❌ Error reading CSV:', error.message);
    }
  }

  // 3. Sort amenities by terminal and name
  amenities.sort((a, b) => {
    if (a.terminal_code !== b.terminal_code) {
      return a.terminal_code.localeCompare(b.terminal_code);
    }
    return a.name.localeCompare(b.name);
  });

  // 4. Write consolidated file
  const outputPath = path.join(dataDir, 'amenities.json');

  console.log('💾 Writing consolidated amenities.json...');
  fs.writeFileSync(outputPath, JSON.stringify(amenities, null, 2));

  // 5. Generate summary
  console.log('\n📊 CONSOLIDATION SUMMARY:');
  console.log(`Total amenities: ${amenities.length}`);

  const terminalCounts = {};
  const vibeCounts = {};
  const categoryCounts = {};

  amenities.forEach(amenity => {
    // Terminal counts
    terminalCounts[amenity.terminal_code] = (terminalCounts[amenity.terminal_code] || 0) + 1;

    // Vibe counts
    if (Array.isArray(amenity.vibe_tags)) {
      amenity.vibe_tags.forEach(vibe => {
        vibeCounts[vibe] = (vibeCounts[vibe] || 0) + 1;
      });
    }

    // Category counts
    if (amenity.category) {
      categoryCounts[amenity.category] = (categoryCounts[amenity.category] || 0) + 1;
    }
  });

  console.log('\nBy Terminal:');
  Object.entries(terminalCounts).sort().forEach(([terminal, count]) => {
    console.log(`  ${terminal}: ${count} amenities`);
  });

  console.log('\nBy Vibe:');
  Object.entries(vibeCounts).sort((a, b) => b[1] - a[1]).forEach(([vibe, count]) => {
    console.log(`  ${vibe}: ${count} amenities`);
  });

  console.log('\nBy Category:');
  Object.entries(categoryCounts).sort((a, b) => b[1] - a[1]).forEach(([category, count]) => {
    console.log(`  ${category}: ${count} amenities`);
  });

  console.log(`\n✅ Consolidation complete! File saved to: ${outputPath}`);

  return amenities;
}

// Run the consolidation
if (require.main === module) {
  consolidateAmenities().catch(console.error);
}

module.exports = { consolidateAmenities };