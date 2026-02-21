const fs = require('fs');
const path = require('path');

// SIN transit filtering logic
function filterSinTransitAmenities(amenities) {
  console.log(`🔍 Processing ${amenities.length} amenities for SIN transit filtering...`);
  
  const filtered = amenities.filter(amenity => {
    const name = amenity.name?.toLowerCase() || '';
    const isNonTransit = name.includes('immigration') || 
                       name.includes('customs') || 
                       name.includes('baggage') ||
                       name.includes('arrival hall');
    return !isNonTransit;
  });
  
  console.log(`🇸🇬 SIN transit filtering: ${filtered.length}/${amenities.length} amenities available`);
  console.log(`📊 Transit availability: ${((filtered.length / amenities.length) * 100).toFixed(1)}%`);
  
  return filtered;
}

// Parse CSV data
function parseCSV(csvContent) {
  const lines = csvContent.split('\n').filter(line => line.trim());
  const headers = lines[0].split(',').map(h => h.trim());
  
  const amenities = lines.slice(1).map(line => {
    // Handle CSV with commas in quoted fields
    const values = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim());
    
    const amenity = {};
    headers.forEach((header, index) => {
      amenity[header] = values[index] || '';
    });
    return amenity;
  });
  
  return amenities;
}

// Convert amenities to JSON format
function convertToJSON(amenities) {
  return amenities.map((amenity, index) => {
    // Extract vibe tags from the CSV format
    let vibeTags = [];
    if (amenity.vibe_tags) {
      try {
        // Remove curly braces and split by comma
        const tags = amenity.vibe_tags.replace(/[{}]/g, '').split(',').map(t => t.trim());
        vibeTags = tags.filter(t => t.length > 0);
      } catch (e) {
        console.log('Warning: Could not parse vibe tags for amenity:', amenity.name);
      }
    }
    
    return {
      id: amenity.id || `sin-transit-${index + 1}`,
      name: amenity.name || amenity.amenity_slug || '',
      category: vibeTags.length > 0 ? vibeTags[0] : 'General',
      description: amenity.description || '',
      location: amenity.terminal_code || '',
      rating: 4.0, // Default rating
      timeRequired: '15 min',
      isTransitAvailable: amenity.available_in_tr === 'true',
      airport: amenity.airport_code || 'SIN',
      context: 'transit',
      vibeTags: vibeTags,
      bookingRequired: amenity.booking_required === 'true',
      priceLevel: amenity.price_level || '',
      openingHours: amenity.opening_hours || ''
    };
  });
}

// Main sync function
function syncSinTransitData() {
  try {
    console.log('🚀 Starting SIN transit data sync...');
    
    // Read the CSV file
    const csvPath = path.join(__dirname, 'amenity_detail_rows-9.csv');
    if (!fs.existsSync(csvPath)) {
      console.error('❌ CSV file not found:', csvPath);
      console.log('📁 Available files in scripts directory:');
      const files = fs.readdirSync(__dirname);
      files.forEach(file => console.log(`  - ${file}`));
      return;
    }
    
    const csvContent = fs.readFileSync(csvPath, 'utf8');
    console.log(`📖 Read CSV file: ${csvContent.split('\n').length} lines`);
    
    // Parse CSV data
    const rawAmenities = parseCSV(csvContent);
    console.log(`📊 Parsed ${rawAmenities.length} amenities from CSV`);
    
    // Apply SIN transit filtering
    const transitAmenities = filterSinTransitAmenities(rawAmenities);
    
    // Convert to JSON format
    const jsonAmenities = convertToJSON(transitAmenities);
    
    // Create output directory if it doesn't exist
    const outputDir = path.join(__dirname, '..', 'src', 'data');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // Save filtered data
    const outputPath = path.join(outputDir, 'sin-transit-amenities.json');
    fs.writeFileSync(outputPath, JSON.stringify(jsonAmenities, null, 2));
    console.log(`💾 Saved ${jsonAmenities.length} transit amenities to: ${outputPath}`);
    
    // Create summary report
    const summary = {
      totalAmenities: rawAmenities.length,
      transitAmenities: transitAmenities.length,
      availabilityPercentage: ((transitAmenities.length / rawAmenities.length) * 100).toFixed(1),
      filteredOut: rawAmenities.length - transitAmenities.length,
      categories: [...new Set(jsonAmenities.map(a => a.category))],
      syncTimestamp: new Date().toISOString()
    };
    
    const summaryPath = path.join(outputDir, 'sin-transit-summary.json');
    fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
    console.log(`📋 Summary saved to: ${summaryPath}`);
    
    // Display summary
    console.log('\n📊 SIN Transit Data Sync Summary:');
    console.log(`  Total amenities: ${summary.totalAmenities}`);
    console.log(`  Transit available: ${summary.transitAmenities}`);
    console.log(`  Availability: ${summary.availabilityPercentage}%`);
    console.log(`  Filtered out: ${summary.filteredOut}`);
    console.log(`  Categories: ${summary.categories.join(', ')}`);
    
    console.log('\n✅ SIN transit data sync completed successfully!');
    
  } catch (error) {
    console.error('❌ Error during SIN transit data sync:', error);
    process.exit(1);
  }
}

// Run the sync if this script is executed directly
if (require.main === module) {
  syncSinTransitData();
}

module.exports = { syncSinTransitData, filterSinTransitAmenities };
