import * as fs from 'fs';

function analyzeSupabaseCSV() {
  const csvContent = fs.readFileSync('supabase-amenities-clean.csv', 'utf-8');
  const lines = csvContent.split('\n');
  
  console.log('📊 Analysis of supabase-amenities-clean.csv:');
  console.log('============================================');
  console.log(`Total lines: ${lines.length}`);
  
  const amenities: any[] = [];
  const slugs = new Set<string>();
  const names = new Set<string>();
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;
    
    // Parse CSV with quoted fields
    const columns: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let j = 0; j < line.length; j++) {
      const char = line[j];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        columns.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    columns.push(current.trim());
    
    if (columns.length >= 14) {
      const amenity = {
        id: columns[0],
        slug: columns[2],
        name: columns[13],
        terminal: columns[11]
      };
      amenities.push(amenity);
      slugs.add(columns[2]);
      names.add(columns[13].toLowerCase());
    }
  }
  
  console.log(`Valid amenities found: ${amenities.length}`);
  console.log(`Unique slugs: ${slugs.size}`);
  console.log(`Unique names: ${names.size}`);
  
  // Show some examples
  console.log('\n📝 Examples from CSV:');
  console.log('=====================');
  for (const amenity of amenities.slice(0, 10)) {
    console.log(`- ${amenity.name} (${amenity.terminal}) - slug: ${amenity.slug}`);
  }
  
  // Check for potential duplicates in CSV
  const nameCounts: { [key: string]: number } = {};
  for (const amenity of amenities) {
    const name = amenity.name.toLowerCase();
    nameCounts[name] = (nameCounts[name] || 0) + 1;
  }
  
  const duplicates = Object.entries(nameCounts).filter(([name, count]) => count > 1);
  if (duplicates.length > 0) {
    console.log('\n⚠️ Potential duplicates in CSV:');
    console.log('===============================');
    for (const [name, count] of duplicates.slice(0, 5)) {
      console.log(`- "${name}" appears ${count} times`);
    }
  }
  
  return { amenities, slugs, names };
}

function checkAgainstModularJSONs() {
  const terminals = ['sin_jewel', 'sin_t1', 'sin_t2', 'sin_t3', 'sin_t4'];
  const allAmenities: any[] = [];
  
  for (const terminal of terminals) {
    try {
      const content = fs.readFileSync(`../src/data/${terminal}.json`, 'utf-8');
      const amenities = JSON.parse(content);
      
      for (const amenity of amenities) {
        const enhancedAmenity = {
          ...amenity,
          terminal: terminal.toUpperCase().replace('_', '-'),
          airport: 'SIN'
        };
        allAmenities.push(enhancedAmenity);
      }
    } catch (error) {
      console.log(`⚠️ Could not read ${terminal}.json`);
    }
  }
  
  console.log(`\n📁 Modular JSON amenities: ${allAmenities.length}`);
  
  // Check for amenities that might already exist
  const csvData = analyzeSupabaseCSV();
  const csvNames = csvData.names;
  
  const potentiallyExisting: any[] = [];
  const definitelyMissing: any[] = [];
  
  for (const amenity of allAmenities) {
    const nameLower = amenity.name.toLowerCase();
    if (csvNames.has(nameLower)) {
      potentiallyExisting.push(amenity);
    } else {
      definitelyMissing.push(amenity);
    }
  }
  
  console.log(`\n📊 Comparison Results:`);
  console.log(`- Potentially already in Supabase: ${potentiallyExisting.length}`);
  console.log(`- Definitely missing: ${definitelyMissing.length}`);
  
  if (potentiallyExisting.length > 0) {
    console.log('\n🔍 Potentially existing amenities:');
    console.log('=================================');
    for (const amenity of potentiallyExisting.slice(0, 10)) {
      console.log(`- ${amenity.name} (${amenity.terminal})`);
    }
    if (potentiallyExisting.length > 10) {
      console.log(`... and ${potentiallyExisting.length - 10} more`);
    }
  }
  
  if (definitelyMissing.length > 0) {
    console.log('\n❌ Definitely missing amenities:');
    console.log('================================');
    for (const amenity of definitelyMissing.slice(0, 10)) {
      console.log(`- ${amenity.name} (${amenity.terminal})`);
    }
    if (definitelyMissing.length > 10) {
      console.log(`... and ${definitelyMissing.length - 10} more`);
    }
  }
  
  return { definitelyMissing, potentiallyExisting };
}

function main() {
  console.log('🔍 Analyzing current state...');
  console.log('=============================');
  
  const results = checkAgainstModularJSONs();
  
  console.log(`\n💡 Recommendation:`);
  console.log(`The CSV file you're using (supabase-amenities-clean.csv) appears to be incomplete.`);
  console.log(`Your actual Supabase database likely has more amenities than what's in this CSV file.`);
  console.log(`\nTo get an accurate list of missing amenities, you should:`);
  console.log(`1. Export the current state of your Supabase amenity_detail table`);
  console.log(`2. Use that export to filter out existing amenities`);
  console.log(`3. Generate a new CSV with only the truly missing amenities`);
}

main(); 