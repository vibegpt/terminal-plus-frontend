import * as fs from 'fs';
import * as path from 'path';

interface TestAmenity {
  id: number;
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

function generateTestAmenity(): TestAmenity {
  return {
    id: 99999,
    created_at: new Date().toISOString(),
    amenity_slug: 'test-amenity-unique-sin-t1',
    description: 'Test amenity for Supabase import',
    website_url: 'https://example.com',
    logo_url: 'https://yourbucket.supabase.co/storage/test-logo.png',
    vibe_tags: '{Shop,Quick}',
    booking_required: false,
    available_in_tr: true,
    price_level: '$$',
    opening_hours: '',
    terminal_code: 'SIN-T1',
    airport_code: 'SIN',
    name: 'Test Amenity'
  };
}

function generateCSV(amenity: TestAmenity): string {
  const headers = [
    'id', 'created_at', 'amenity_slug', 'description', 'website_url', 
    'logo_url', 'vibe_tags', 'booking_required', 'available_in_tr', 
    'price_level', 'opening_hours', 'terminal_code', 'airport_code', 'name'
  ];
  
  const values = [
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
    amenity.opening_hours,
    amenity.terminal_code,
    amenity.airport_code,
    `"${amenity.name}"`
  ];
  
  return `${headers.join(',')}\n${values.join(',')}`;
}

function main() {
  console.log('🧪 Generating test amenity for Supabase import...');
  
  const testAmenity = generateTestAmenity();
  const csvContent = generateCSV(testAmenity);
  
  const outputPath = path.join(__dirname, 'test-single-amenity.csv');
  fs.writeFileSync(outputPath, csvContent);
  
  console.log('✅ Generated test-single-amenity.csv');
  console.log('\n📋 Test amenity details:');
  console.log(`- Slug: ${testAmenity.amenity_slug}`);
  console.log(`- Name: ${testAmenity.name}`);
  console.log(`- Terminal: ${testAmenity.terminal_code}`);
  console.log(`- Opening Hours: ${testAmenity.opening_hours}`);
  console.log(`- Vibe Tags: ${testAmenity.vibe_tags}`);
  console.log(`- Price Level: ${testAmenity.price_level}`);
  console.log('\n📁 File saved as: test-single-amenity.csv');
  console.log('🔍 You can now test this single row in Supabase to verify the format');
}

main(); 