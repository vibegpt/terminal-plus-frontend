import * as fs from 'fs';

// The complete Supabase CSV data you provided
const completeSupabaseData = `id,created_at,amenity_slug,description,website_url,logo_url,vibe_tags,booking_required,available_in_tr,price_level,opening_hours,terminal_code,airport_code,name
1,2025-08-02 15:06:51.227649+00,apple-store,,,,{Shop},false,true,,,SIN-T3,SIN,
2,2025-08-02 15:06:51.227649+00,cabin-bar-dfs,,,,{Explore},false,true,,,SIN-T3,SIN,
3,2025-08-02 15:06:51.227649+00,caffe-nero-t3-departures,"Ever since we opened our first coffee house in 1997, Caffè Nero has been dedicated to two things: creating the very finest handcrafted Italian coffee and providing a warm and relaxing atmosphere in which to enjoy it.


As every second counts when you're flying, you need good food - fast! This is why Caffè Nero at Heathrow offers a 15-minute menu.",,,"{Refuel,Quick}",false,false,,,LHR-T3,LHR,
4,2025-08-02 15:06:51.227649+00,caffe-nero-t3-gate-b36,"Ever since we opened our first coffee house in 1997, Caffè Nero has been dedicated to two things: creating the very finest handcrafted Italian coffee and providing a warm and relaxing atmosphere in which to enjoy it.


As every second counts when you're flying, you need good food - fast! This is why Caffè Nero at Heathrow offers a 15-minute menu.",,,"{Refuel,Quick}",false,false,,05:00-22:30,LHR-T3,LHR,
5,2025-08-02 15:06:51.227649+00,caffe-nero-t4-gate-16,"Ever since we opened our first coffee house in 1997, Caffè Nero has been dedicated to two things: creating the very finest handcrafted Italian coffee and providing a warm and relaxing atmosphere in which to enjoy it.


As every second counts when you're flying, you need good food - fast! This is why Caffè Nero at Heathrow offers a 15-minute menu.",,,"{Refuel,Quick}",false,false,,05:30-22:30,LHR-T4,LHR,
6,2025-08-02 15:06:51.227649+00,caffe-nero-t5-arrivals,"Ever since we opened our first coffee house in 1997, Caffè Nero has been dedicated to two things: creating the very finest handcrafted Italian coffee and providing a warm and relaxing atmosphere in which to enjoy it.


As every second counts when you're flying, you need good food - fast! This is why Caffè Nero at Heathrow offers a 15-minute menu.",,,"{Refuel,Quick}",false,false,,00:00-24:00,LHR-T5,LHR,
7,2025-08-02 15:06:51.227649+00,caffe-nero-t5-check-in,"Ever since we opened our first coffee house in 1997, Caffè Nero has been dedicated to two things: creating the very finest handcrafted Italian coffee and providing a warm and relaxing atmosphere in which to enjoy it.


As every second counts when you're flying, you need good food - fast! This is why Caffè Nero at Heathrow offers a 15-minute menu.",,,"{Refuel,Quick}",false,false,,05:00-23:30,LHR-T5,LHR,
8,2025-08-02 15:06:51.227649+00,chandelier,,,,{Explore},false,true,,,SIN-T4,SIN,
9,2025-08-02 15:06:51.227649+00,charles-keith,,,,{Shop},false,true,,,SIN-T3,SIN,
10,2025-08-02 15:06:51.227649+00,coach,,,,{Shop},false,true,,,SIN-T3,SIN,
14,2025-08-02 15:06:51.227649+00,fila-jewel,,,,{Shop},false,false,,,SIN-JEWEL,SIN,
15,2025-08-02 15:06:51.227649+00,fila-t4,,https://www.fila.com.sg/,,{Shop},false,false,,,SIN-T4,SIN,
16,2025-08-02 15:06:51.227649+00,fila-kids-t2,,https://www.fila.com.sg/,,{Shop},false,false,,,SIN-T2,SIN,
20,2025-08-02 15:06:51.227649+00,furla-jewel,,https://www.furla.com/sg/en/,,{Shop},false,false,,,SIN-JEWEL,SIN,
42,2025-08-02 15:06:51.227649+00,irvins-salted-egg-jewel,,https://www.irvinsaltedegg.com/,,{Shop},false,false,,,SIN-JEWEL,SIN,
88,2025-08-02 15:06:51.227649+00,rhythm-of-nature,,https://www.jewelchangiairport.com/en/attractions/shiseido-forest-valley.html,,{Explore},false,false,,,SIN-JEWEL,SIN,
100,2025-08-02 15:06:51.227649+00,the-digital-gadgets-jewel,,https://www.thedigitalgadgets.com/,,{Shop},false,false,,,SIN-JEWEL,SIN,
118,2025-08-02 15:06:51.227649+00,uniqlo-jewel,,https://www.uniqlo.com/sg/,,{Shop},false,false,,,SIN-JEWEL,SIN,
10147,2025-08-02 18:06:08.3+00,tokyu-hands-t4-new,Japanese lifestyle store,,,{Explore},false,true,$$,"{""Monday-Sunday"": ""06:00-23:00""}",SIN-T4,SIN,Tokyu Hands`;

function parseCSV(csvData: string): Set<string> {
  const lines = csvData.split('\n');
  const existingSlugs = new Set<string>();
  
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
      const slug = columns[2]; // amenity_slug column
      existingSlugs.add(slug);
    }
  }
  
  return existingSlugs;
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

function generateSlug(name: string, terminal: string): string {
  const baseSlug = name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '-');
  
  const terminalSuffix = terminal.toLowerCase().replace('-', '');
  return `${baseSlug}-${terminalSuffix}`;
}

function convertToSupabaseFormat(amenity: any, id: number): any {
  const slug = generateSlug(amenity.name, amenity.terminal);
  
  return {
    id: id,
    created_at: new Date().toISOString(),
    amenity_slug: slug,
    description: amenity.description || '',
    website_url: amenity.website_url || '',
    logo_url: amenity.logo_url || '',
    vibe_tags: amenity.vibe_tags ? `{${amenity.vibe_tags.join(',')}}` : '{Explore}',
    booking_required: amenity.booking_required || false,
    available_in_tr: amenity.available_in_transit || true,
    price_level: amenity.price_level || '$$',
    opening_hours: amenity.opening_hours ? JSON.stringify(amenity.opening_hours) : '{"Monday-Sunday": "24/7"}',
    terminal_code: amenity.terminal,
    airport_code: amenity.airport,
    name: amenity.name
  };
}

function generateCSV(amenities: any[]): string {
  const headers = [
    'id', 'created_at', 'amenity_slug', 'description', 'website_url', 
    'logo_url', 'vibe_tags', 'booking_required', 'available_in_tr', 
    'price_level', 'opening_hours', 'terminal_code', 'airport_code', 'name'
  ];
  
  const csvRows = [headers.join(',')];
  
  for (const amenity of amenities) {
    const row = [
      amenity.id,
      amenity.created_at,
      amenity.amenity_slug,
      `"${amenity.description}"`,
      amenity.website_url,
      amenity.logo_url,
      `"${amenity.vibe_tags}"`,
      amenity.booking_required,
      amenity.available_in_tr,
      amenity.price_level,
      amenity.opening_hours || '',
      amenity.terminal_code,
      amenity.airport_code,
      `"${amenity.name}"`
    ];
    csvRows.push(row.join(','));
  }
  
  return csvRows.join('\n');
}

function main() {
  console.log('🔍 Parsing complete Supabase data...');
  const existingSlugs = parseCSV(completeSupabaseData);
  console.log(`Found ${existingSlugs.size} amenities in complete Supabase data`);
  
  console.log('📁 Loading modular JSON amenities...');
  const modularAmenities = loadModularAmenities();
  console.log(`Found ${modularAmenities.length} amenities in modular JSON files`);
  
  // Filter out amenities that already exist in Supabase
  const missingAmenities = modularAmenities.filter(amenity => {
    const slug = generateSlug(amenity.name, amenity.terminal);
    return !existingSlugs.has(slug);
  });
  
  console.log(`\n📊 Analysis:`);
  console.log(`- Total modular amenities: ${modularAmenities.length}`);
  console.log(`- Existing in Supabase: ${existingSlugs.size}`);
  console.log(`- Missing from Supabase: ${missingAmenities.length}`);
  
  if (missingAmenities.length === 0) {
    console.log('\n✅ All modular amenities are already in Supabase!');
    return;
  }
  
  // Show breakdown by terminal
  const terminalCounts: { [key: string]: number } = {};
  for (const amenity of missingAmenities) {
    const terminal = amenity.terminal;
    terminalCounts[terminal] = (terminalCounts[terminal] || 0) + 1;
  }
  
  console.log('\n📋 Missing amenities by terminal:');
  for (const [terminal, count] of Object.entries(terminalCounts).sort()) {
    console.log(`- ${terminal}: ${count} amenities`);
  }
  
  // Convert to Supabase format and generate CSV
  const supabaseAmenities = missingAmenities.map((amenity, index) => 
    convertToSupabaseFormat(amenity, 50000 + index)
  );
  
  const csvContent = generateCSV(supabaseAmenities);
  fs.writeFileSync('truly-missing-amenities.csv', csvContent);
  
  console.log(`\n✅ Generated truly-missing-amenities.csv with ${missingAmenities.length} amenities`);
  console.log('📝 This CSV contains ONLY amenities that are truly missing from your Supabase database');
}

main(); 