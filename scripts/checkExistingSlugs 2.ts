import * as fs from 'fs';

interface SupabaseAmenity {
  id: string;
  created_at: string;
  amenity_slug: string;
  description: string;
  website_url: string;
  logo_url: string;
  vibe_tags: string;
  booking_required: boolean;
  available_in_tr: boolean;
  price_level: string;
  opening_hours: string;
  terminal_code: string;
  airport_code: string;
  name: string;
}

function loadSupabaseAmenities(): SupabaseAmenity[] {
  const csvContent = fs.readFileSync('supabase-amenities-clean.csv', 'utf-8');
  const lines = csvContent.split('\n');
  const amenities: SupabaseAmenity[] = [];
  
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
      const amenity: SupabaseAmenity = {
        id: columns[0],
        created_at: columns[1],
        amenity_slug: columns[2],
        description: columns[3],
        website_url: columns[4],
        logo_url: columns[5],
        vibe_tags: columns[6],
        booking_required: columns[7] === 'true',
        available_in_tr: columns[8] === 'true',
        price_level: columns[9],
        opening_hours: columns[10],
        terminal_code: columns[11],
        airport_code: columns[12],
        name: columns[13]
      };
      amenities.push(amenity);
    }
  }
  
  return amenities;
}

function generateSlug(name: string, terminal: string): string {
  const baseSlug = name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '-');
  
  const terminalSuffix = terminal.toLowerCase().replace('-', '');
  return `${baseSlug}-${terminalSuffix}`;
}

function loadModularAmenities(): any[] {
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
  
  return allAmenities;
}

function main() {
  console.log('🔍 Loading Supabase amenities...');
  const supabaseAmenities = loadSupabaseAmenities();
  console.log(`Found ${supabaseAmenities.length} amenities in Supabase CSV`);
  
  console.log('📁 Loading modular JSON amenities...');
  const modularAmenities = loadModularAmenities();
  console.log(`Found ${modularAmenities.length} amenities in modular JSON files`);
  
  // Create sets for comparison
  const supabaseSlugs = new Set(supabaseAmenities.map(a => a.amenity_slug));
  const supabaseNames = new Set(supabaseAmenities.map(a => a.name.toLowerCase()));
  
  console.log('\n📊 Analysis:');
  console.log('=============');
  
  const existingMatches: any[] = [];
  const potentialMatches: any[] = [];
  const trulyMissing: any[] = [];
  
  for (const amenity of modularAmenities) {
    const slug = generateSlug(amenity.name, amenity.terminal);
    const nameLower = amenity.name.toLowerCase();
    
    if (supabaseSlugs.has(slug)) {
      existingMatches.push({
        modular: amenity,
        supabase: supabaseAmenities.find(s => s.amenity_slug === slug)
      });
    } else if (supabaseNames.has(nameLower)) {
      potentialMatches.push({
        modular: amenity,
        supabase: supabaseAmenities.find(s => s.name.toLowerCase() === nameLower)
      });
    } else {
      trulyMissing.push(amenity);
    }
  }
  
  console.log(`\n✅ Exact slug matches: ${existingMatches.length}`);
  console.log(`🔍 Potential name matches: ${potentialMatches.length}`);
  console.log(`❌ Truly missing: ${trulyMissing.length}`);
  
  // Show exact matches
  if (existingMatches.length > 0) {
    console.log('\n✅ Exact slug matches (already in Supabase):');
    console.log('==============================================');
    for (const match of existingMatches.slice(0, 10)) { // Show first 10
      console.log(`- ${match.modular.name} (${match.modular.terminal})`);
    }
    if (existingMatches.length > 10) {
      console.log(`... and ${existingMatches.length - 10} more`);
    }
  }
  
  // Show potential matches
  if (potentialMatches.length > 0) {
    console.log('\n🔍 Potential name matches (check these):');
    console.log('=========================================');
    for (const match of potentialMatches.slice(0, 10)) { // Show first 10
      console.log(`- Modular: "${match.modular.name}" (${match.modular.terminal})`);
      console.log(`  Supabase: "${match.supabase?.name}" (${match.supabase?.terminal_code})`);
      console.log('');
    }
    if (potentialMatches.length > 10) {
      console.log(`... and ${potentialMatches.length - 10} more`);
    }
  }
  
  // Show truly missing
  if (trulyMissing.length > 0) {
    console.log('\n❌ Truly missing from Supabase:');
    console.log('===============================');
    for (const amenity of trulyMissing.slice(0, 10)) { // Show first 10
      console.log(`- ${amenity.name} (${amenity.terminal})`);
    }
    if (trulyMissing.length > 10) {
      console.log(`... and ${trulyMissing.length - 10} more`);
    }
  }
  
  // Generate updated CSV with only truly missing amenities
  if (trulyMissing.length > 0) {
    console.log(`\n📄 Would generate CSV with ${trulyMissing.length} truly missing amenities`);
  } else {
    console.log('\n✅ All amenities are already in Supabase!');
  }
}

main(); 