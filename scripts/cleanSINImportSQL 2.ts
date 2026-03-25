// cleanSINImportSQL.ts
// Script to clean the SQL file and remove POINT geometry data

import fs from 'fs';
import path from 'path';

function cleanSQLFile(inputFile: string, outputFile: string) {
  console.log('🧹 Starting SQL file cleanup...');
  console.log(`📂 Input file: ${inputFile}`);
  console.log(`📝 Output file: ${outputFile}`);
  
  try {
    // Read the SQL file
    let sqlContent = fs.readFileSync(inputFile, 'utf-8');
    
    // Count issues before fixing
    const pointMatches = sqlContent.match(/POINT\([^)]+\)/g) || [];
    console.log(`\n🔍 Found ${pointMatches.length} POINT geometry entries to remove`);
    
    // Remove POINT geometry data
    // Pattern 1: POINT(...), with comma
    sqlContent = sqlContent.replace(/POINT\([^)]+\),/g, '');
    
    // Pattern 2: POINT(...) without comma (might be last in list)
    sqlContent = sqlContent.replace(/POINT\([^)]+\)/g, '');
    
    // Clean up any double commas that might result
    sqlContent = sqlContent.replace(/,\s*,/g, ',');
    
    // Clean up any trailing commas before closing parenthesis
    sqlContent = sqlContent.replace(/,\s*\)/g, ')');
    
    // Remove any lines that are just commas or spaces
    sqlContent = sqlContent.replace(/^\s*,\s*$/gm, '');
    
    // Fix any potential issues with VALUES formatting
    // Ensure proper comma separation between value sets
    sqlContent = sqlContent.replace(/\)\s*\(/g, '),\n  (');
    
    // Write the cleaned SQL
    fs.writeFileSync(outputFile, sqlContent);
    
    // Verify the cleanup
    const remainingPoints = sqlContent.match(/POINT\([^)]+\)/g) || [];
    if (remainingPoints.length === 0) {
      console.log('✅ Successfully removed all POINT geometry data');
    } else {
      console.log(`⚠️ Warning: ${remainingPoints.length} POINT entries may still remain`);
    }
    
    // Check file size difference
    const originalSize = fs.statSync(inputFile).size;
    const newSize = fs.statSync(outputFile).size;
    const sizeDiff = originalSize - newSize;
    console.log(`\n📊 File size reduced by ${sizeDiff} bytes (${Math.round(sizeDiff/1024)}KB)`);
    
    console.log('\n✅ SQL file cleaned successfully!');
    console.log(`🎯 Next step: Run ${outputFile} in your Supabase SQL editor`);
    
  } catch (error) {
    console.error('❌ Error cleaning SQL file:', error);
  }
}

// Also create a version that generates completely fresh SQL without coordinates
function generateCleanSQL() {
  console.log('\n🔨 Generating fresh SQL import file...\n');
  
  const DATA_DIR = '/Users/toddbyrne/Desktop/terminal-plus-frontend/src/data';
  const TERMINAL_FILES = [
    'sin_t1.json',
    'sin_t2.json', 
    'sin_t3.json',
    'sin_t4.json',
    'sin_jewel.json'
  ];
  
  const allAmenities: any[] = [];
  
  // Load all terminal data
  for (const file of TERMINAL_FILES) {
    const filePath = path.join(DATA_DIR, file);
    try {
      const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      const terminalName = file.replace('sin_', '').replace('.json', '').toUpperCase();
      
      data.forEach((amenity: any, index: number) => {
        // Generate ID based on terminal
        const terminalOffsets: Record<string, number> = {
          'T1': 300000,
          'T2': 310000,
          'T3': 320000,
          'T4': 330000,
          'JEWEL': 340000
        };
        
        const id = (terminalOffsets[terminalName] || 350000) + index + 1;
        const terminalCode = `SIN-${terminalName}`;
        
        // Create clean amenity object
        const cleanAmenity = {
          id,
          created_at: '2024-01-01T00:00:00.000Z',
          name: amenity.name,
          amenity_slug: amenity.slug || amenity.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          description: amenity.description || `Visit ${amenity.name} at Terminal ${terminalName}`,
          website_url: amenity.website_url || null,
          logo_url: amenity.logo_url || null,
          vibe_tags: amenity.vibe_tags?.length > 0 ? `{${amenity.vibe_tags.join(',')}}` : '{Explore}',
          booking_required: false,
          available_in_tr: terminalName !== 'JEWEL', // Jewel needs immigration
          price_level: determinePriceLevel(amenity),
          opening_hours: JSON.stringify(amenity.opening_hours || {"Monday-Sunday": "6:00 AM - 11:00 PM"}),
          terminal_code: terminalCode,
          airport_code: 'SIN'
        };
        
        allAmenities.push(cleanAmenity);
      });
      
      console.log(`✅ Loaded ${data.length} amenities from ${terminalName}`);
    } catch (error) {
      console.error(`❌ Error loading ${file}:`, error);
    }
  }
  
  // Generate SQL without any POINT data
  const values = allAmenities.map(a => {
    const fields = [
      a.id,
      `'${a.created_at}'`,
      `'${a.amenity_slug.replace(/'/g, "''")}'`,
      `'${a.description.replace(/'/g, "''")}'`,
      a.website_url ? `'${a.website_url}'` : 'NULL',
      a.logo_url ? `'${a.logo_url}'` : 'NULL',
      `'${a.vibe_tags}'`,
      a.booking_required,
      a.available_in_tr,
      `'${a.price_level}'`,
      `'${a.opening_hours.replace(/'/g, "''")}'`,
      `'${a.terminal_code}'`,
      `'${a.airport_code}'`,
      `'${a.name.replace(/'/g, "''")}'`
    ];
    
    return `  (${fields.join(', ')})`;
  }).join(',\n');
  
  const sql = `-- =====================================================
-- SINGAPORE CHANGI AIRPORT AMENITIES IMPORT (CLEAN)
-- Generated: ${new Date().toISOString()}
-- Total Amenities: ${allAmenities.length}
-- =====================================================

-- Step 1: Clear existing SIN amenities (optional - be careful!)
-- DELETE FROM collection_amenities WHERE amenity_detail_id IN (
--   SELECT id FROM amenity_detail WHERE airport_code = 'SIN'
-- );
-- DELETE FROM amenity_detail WHERE airport_code = 'SIN';

-- Step 2: Insert SIN amenities (NO COORDINATES)
INSERT INTO amenity_detail (
  id, created_at, amenity_slug, description, website_url, logo_url, 
  vibe_tags, booking_required, available_in_tr, price_level, 
  opening_hours, terminal_code, airport_code, name
) VALUES
${values}
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  vibe_tags = EXCLUDED.vibe_tags,
  opening_hours = EXCLUDED.opening_hours,
  terminal_code = EXCLUDED.terminal_code,
  available_in_tr = EXCLUDED.available_in_tr,
  price_level = EXCLUDED.price_level;

-- Step 3: Verify import
SELECT 
  terminal_code, 
  COUNT(*) as count,
  COUNT(CASE WHEN available_in_tr = true THEN 1 END) as transit_available
FROM amenity_detail 
WHERE airport_code = 'SIN'
GROUP BY terminal_code
ORDER BY terminal_code;`;
  
  fs.writeFileSync('sin_import_clean.sql', sql);
  console.log(`\n✅ Generated clean SQL file: sin_import_clean.sql`);
  console.log(`📊 Total amenities: ${allAmenities.length}`);
  
  // Terminal breakdown
  const terminalCounts: Record<string, number> = {};
  allAmenities.forEach(a => {
    terminalCounts[a.terminal_code] = (terminalCounts[a.terminal_code] || 0) + 1;
  });
  
  console.log('\n📍 Amenities by terminal:');
  Object.entries(terminalCounts).forEach(([terminal, count]) => {
    console.log(`  ${terminal}: ${count} amenities`);
  });
}

function determinePriceLevel(amenity: any): string {
  const name = (amenity.name || '').toLowerCase();
  const category = (amenity.category || '').toLowerCase();
  
  if (name.includes('lounge') || name.includes('spa') || name.includes('plaza premium')) {
    return '$$$';
  }
  if (category === 'restaurant' || name.includes('restaurant') || name.includes('bar')) {
    return '$$';
  }
  if (name.includes('food court') || name.includes('hawker') || name.includes('kopitiam')) {
    return '$';
  }
  
  return '$';
}

// Main execution
console.log('🚀 SIN SQL Import Cleaner\n');
console.log('This script will:');
console.log('1. Clean your existing SQL file (remove POINT data)');
console.log('2. Generate a fresh, clean SQL file from your JSON data\n');

// Try to clean existing file if it exists
const existingFile = 'sin_terminals_import.sql';
if (fs.existsSync(existingFile)) {
  console.log(`Found existing file: ${existingFile}`);
  cleanSQLFile(existingFile, 'sin_import_fixed.sql');
}

// Always generate a fresh clean version
generateCleanSQL();

console.log('\n🎉 Complete! You now have clean SQL files ready for Supabase.');
console.log('\n📝 Files generated:');
if (fs.existsSync('sin_import_fixed.sql')) {
  console.log('  - sin_import_fixed.sql (cleaned version of your original)');
}
console.log('  - sin_import_clean.sql (fresh generation from JSON files)');
console.log('\n🚀 Next steps:');
console.log('  1. Open Supabase SQL editor');
console.log('  2. Run sin_import_clean.sql');
console.log('  3. Then run the collections mapping SQL');
