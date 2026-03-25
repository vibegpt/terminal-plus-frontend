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

interface Amenity {
  id: string;
  name: string;
  description?: string;
  category: string;
  location: string;
  terminal: string;
  airport: string;
  vibe_tags: string[];
  opening_hours?: any;
  price_level?: string;
  booking_required?: boolean;
  available_in_transit?: boolean;
  website_url?: string;
  logo_url?: string;
}

function loadSupabaseAmenities(): Set<string> {
  const csvContent = fs.readFileSync('supabase-amenities-clean.csv', 'utf-8');
  const lines = csvContent.split('\n');
  const existingNames = new Set<string>();
  
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
      const name = columns[13].toLowerCase(); // name column
      existingNames.add(name);
    }
  }
  
  return existingNames;
}

function loadModularAmenities(): Amenity[] {
  const terminals = ['sin_jewel', 'sin_t1', 'sin_t2', 'sin_t3', 'sin_t4'];
  const allAmenities: Amenity[] = [];
  
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

function generateSlug(name: string, terminal: string): string {
  const baseSlug = name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '-');
  
  const terminalSuffix = terminal.toLowerCase().replace('-', '');
  return `${baseSlug}-${terminalSuffix}`;
}

function convertToSupabaseFormat(amenity: Amenity, id: number): any {
  const slug = generateSlug(amenity.name, amenity.terminal);
  
  return {
    id: id.toString(),
    created_at: new Date().toISOString(),
    amenity_slug: slug,
    description: amenity.description || '',
    website_url: amenity.website_url || '',
    logo_url: amenity.logo_url || '',
    vibe_tags: `{${amenity.vibe_tags.join(',')}}`,
    booking_required: amenity.booking_required || false,
    available_in_tr: amenity.available_in_transit || false,
    price_level: amenity.price_level || '',
    opening_hours: amenity.opening_hours ? JSON.stringify(amenity.opening_hours) : '{}',
    terminal_code: amenity.terminal,
    airport_code: amenity.airport,
    name: amenity.name
  };
}

function generateCSV(amenities: any[]): string {
  const headers = [
    'id', 'created_at', 'amenity_slug', 'description', 'website_url', 'logo_url',
    'vibe_tags', 'booking_required', 'available_in_tr', 'price_level', 'opening_hours',
    'terminal_code', 'airport_code', 'name'
  ];
  
  const csvLines = [headers.join(',')];
  
  for (const amenity of amenities) {
    const values = [
      amenity.id,
      amenity.created_at,
      amenity.amenity_slug,
      `"${amenity.description}"`,
      amenity.website_url,
      amenity.logo_url,
      amenity.vibe_tags,
      amenity.booking_required,
      amenity.available_in_tr,
      amenity.price_level,
      amenity.opening_hours,
      amenity.terminal_code,
      amenity.airport_code,
      `"${amenity.name}"`
    ];
    csvLines.push(values.join(','));
  }
  
  return csvLines.join('\n');
}

function main() {
  console.log('🔍 Loading existing Supabase amenities...');
  const existingNames = loadSupabaseAmenities();
  console.log(`Found ${existingNames.size} existing amenities in Supabase CSV`);
  
  console.log('📁 Loading modular JSON amenities...');
  const modularAmenities = loadModularAmenities();
  console.log(`Found ${modularAmenities.length} amenities in modular JSON files`);
  
  // Filter out amenities that already exist in Supabase (by name)
  const trulyMissingAmenities = modularAmenities.filter(amenity => {
    const nameLower = amenity.name.toLowerCase();
    return !existingNames.has(nameLower);
  });
  
  console.log(`\n📊 Analysis:`);
  console.log(`- Total modular amenities: ${modularAmenities.length}`);
  console.log(`- Existing in Supabase: ${existingNames.size}`);
  console.log(`- Truly missing from Supabase: ${trulyMissingAmenities.length}`);
  
  if (trulyMissingAmenities.length === 0) {
    console.log('\n✅ All modular amenities are already in Supabase!');
    return;
  }
  
  // Convert to Supabase format
  const supabaseAmenities = trulyMissingAmenities.map((amenity, index) => 
    convertToSupabaseFormat(amenity, 30000 + index) // Start from ID 30000
  );
  
  // Generate CSV
  const csvContent = generateCSV(supabaseAmenities);
  const filename = 'corrected-missing-amenities.csv';
  fs.writeFileSync(filename, csvContent);
  
  console.log(`\n📄 Generated CSV: ${filename}`);
  console.log(`📈 Contains ${supabaseAmenities.length} truly missing amenities`);
  
  // Show breakdown by terminal
  const terminalCounts: { [key: string]: number } = {};
  for (const amenity of supabaseAmenities) {
    const terminal = amenity.terminal_code;
    terminalCounts[terminal] = (terminalCounts[terminal] || 0) + 1;
  }
  
  console.log('\n📋 Breakdown by terminal:');
  for (const [terminal, count] of Object.entries(terminalCounts).sort()) {
    console.log(`- ${terminal}: ${count} amenities`);
  }
  
  // Show some examples of what's being added
  console.log('\n📝 Examples of amenities being added:');
  console.log('=====================================');
  for (const amenity of supabaseAmenities.slice(0, 10)) {
    console.log(`- ${amenity.name} (${amenity.terminal_code})`);
  }
  if (supabaseAmenities.length > 10) {
    console.log(`... and ${supabaseAmenities.length - 10} more`);
  }
  
  console.log(`\n💡 You can now upload '${filename}' to Supabase to add the truly missing amenities!`);
}

main(); 