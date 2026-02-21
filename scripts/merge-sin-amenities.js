const fs = require('fs');
const path = require('path');

// Paths to the SIN terminal JSON files
const terminalFiles = [
  'src/data/sin_t1.json',
  'src/data/sin_t2.json', 
  'src/data/sin_t3.json',
  'src/data/sin_t4.json',
  'src/data/sin_jewel.json',
  'src/data/sin-transit-amenities.json'
];

// Function to convert JSON array to CSV
function jsonToCSV(data, headers) {
  if (data.length === 0) return '';
  
  // Create CSV header
  const csvHeader = headers.join(',');
  
  // Create CSV rows
  const csvRows = data.map(item => {
    return headers.map(header => {
      let value = item[header];
      
      // Handle different data types
      if (value === null || value === undefined) {
        value = '';
      } else if (Array.isArray(value)) {
        value = value.join('; ');
      } else if (typeof value === 'object') {
        value = JSON.stringify(value).replace(/"/g, '""');
      } else {
        value = String(value).replace(/"/g, '""');
      }
      
      // Wrap in quotes if contains comma, newline, or quote
      if (value.includes(',') || value.includes('\n') || value.includes('"')) {
        value = `"${value}"`;
      }
      
      return value;
    }).join(',');
  });
  
  return [csvHeader, ...csvRows].join('\n');
}

// Function to merge and deduplicate amenities
function mergeAmenities(allAmenities) {
  const merged = [];
  const seen = new Set();
  
  for (const amenity of allAmenities) {
    // Create a unique key for deduplication
    const key = `${amenity.name}-${amenity.terminal_code || amenity.location || 'unknown'}`;
    
    if (!seen.has(key)) {
      seen.add(key);
      
      // Normalize the amenity object
      const normalizedAmenity = {
        id: amenity.id || '',
        name: amenity.name || '',
        category: amenity.category || '',
        type: amenity.type || amenity.amenity_type || '',
        description: amenity.description || '',
        terminal_code: amenity.terminal_code || amenity.location || '',
        airport_code: amenity.airport_code || amenity.airport || 'SIN',
        vibe_tags: amenity.vibe_tags || amenity.vibeTags || [],
        slug: amenity.slug || '',
        available_in_transit: amenity.available_in_transit || amenity.isTransitAvailable || false,
        rating: amenity.rating || '',
        time_required: amenity.timeRequired || '',
        booking_required: amenity.bookingRequired || false,
        price_level: amenity.priceLevel || amenity.price_tier || '',
        opening_hours: amenity.openingHours || amenity.opening_hours || '',
        location_description: amenity.location_description || '',
        image_url: amenity.image_url || '',
        coordinates: amenity.coordinates || '',
        status: amenity.status || 'active',
        context: amenity.context || ''
      };
      
      merged.push(normalizedAmenity);
    }
  }
  
  return merged;
}

// Main function to process all files
async function processAllAmenities() {
  console.log('🔄 Processing SIN terminal amenities...');
  
  let allAmenities = [];
  let totalFiles = 0;
  let totalAmenities = 0;
  
  for (const filePath of terminalFiles) {
    const fullPath = path.join(__dirname, '..', filePath);
    
    if (fs.existsSync(fullPath)) {
      try {
        const fileContent = fs.readFileSync(fullPath, 'utf8');
        const data = JSON.parse(fileContent);
        
        console.log(`📁 Processing ${filePath}: ${data.length} amenities`);
        
        if (Array.isArray(data)) {
          allAmenities = allAmenities.concat(data);
          totalFiles++;
          totalAmenities += data.length;
        } else {
          console.log(`⚠️  Skipping ${filePath}: Not an array`);
        }
      } catch (error) {
        console.error(`❌ Error processing ${filePath}:`, error.message);
      }
    } else {
      console.log(`⚠️  File not found: ${filePath}`);
    }
  }
  
  console.log(`\n📊 Summary:`);
  console.log(`   Files processed: ${totalFiles}`);
  console.log(`   Total amenities before deduplication: ${totalAmenities}`);
  
  // Merge and deduplicate
  const mergedAmenities = mergeAmenities(allAmenities);
  console.log(`   Total amenities after deduplication: ${mergedAmenities.length}`);
  
  // Define CSV headers
  const headers = [
    'id',
    'name', 
    'category',
    'type',
    'description',
    'terminal_code',
    'airport_code',
    'vibe_tags',
    'slug',
    'available_in_transit',
    'rating',
    'time_required',
    'booking_required',
    'price_level',
    'opening_hours',
    'location_description',
    'image_url',
    'coordinates',
    'status',
    'context'
  ];
  
  // Convert to CSV
  const csvContent = jsonToCSV(mergedAmenities, headers);
  
  // Write CSV file
  const outputPath = path.join(__dirname, '..', 'data', 'sin_all_amenities.csv');
  fs.writeFileSync(outputPath, csvContent, 'utf8');
  
  console.log(`\n✅ CSV file created: ${outputPath}`);
  console.log(`   Rows: ${mergedAmenities.length + 1} (including header)`);
  console.log(`   Columns: ${headers.length}`);
  
  // Generate summary by terminal
  const terminalSummary = {};
  mergedAmenities.forEach(amenity => {
    const terminal = amenity.terminal_code || 'Unknown';
    terminalSummary[terminal] = (terminalSummary[terminal] || 0) + 1;
  });
  
  console.log(`\n📋 Amenities by Terminal:`);
  Object.entries(terminalSummary).forEach(([terminal, count]) => {
    console.log(`   ${terminal}: ${count} amenities`);
  });
  
  // Generate summary by category
  const categorySummary = {};
  mergedAmenities.forEach(amenity => {
    const category = amenity.category || 'Unknown';
    categorySummary[category] = (categorySummary[category] || 0) + 1;
  });
  
  console.log(`\n📋 Top Categories:`);
  Object.entries(categorySummary)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10)
    .forEach(([category, count]) => {
      console.log(`   ${category}: ${count} amenities`);
    });
}

// Run the script
processAllAmenities().catch(console.error);

