import { createClient } from '@supabase/supabase-js';
import sinT1 from '../data/sin_t1.json';
import sinT2 from '../data/sin_t2.json';
import sinT3 from '../data/sin_t3.json';
import sinT4 from '../data/sin_t4.json';
import sinJewel from '../data/sin_jewel.json';

// Types for better type safety
interface Amenity {
  name: string;
  slug?: string;
  description?: string;
  category?: string;
  vibes?: string[];
  vibe_tags?: string;
  price_level?: string;
  opening_hours?: any;
  website?: string;
  logo?: string;
  transit_accessible?: boolean;
  booking_required?: boolean;
  location?: string;
  gates_nearby?: string;
}

interface FormattedAmenity {
  name: string;
  amenity_slug: string;
  description: string;
  airport_code: string;
  terminal_code: string;
  category: string;
  vibe_tags: string;
  price_level: string;
  opening_hours: any;
  website_url: string;
  logo_url: string;
  available_in_tr: boolean;
  booking_required: boolean;
  location: string;
  gate_proximity: string;
}

// Validate environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables:');
  console.error('   VITE_SUPABASE_URL:', supabaseUrl ? '✅ Set' : '❌ Missing');
  console.error('   VITE_SUPABASE_SERVICE_KEY:', supabaseServiceKey ? '✅ Set' : '❌ Missing');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function importTerminalData(terminalData: { amenities?: Amenity[] } | Amenity[], terminalCode: string): Promise<any> {
  try {
    const amenities = Array.isArray(terminalData) ? terminalData : (terminalData.amenities || []);
    
    console.log(`🔄 Processing ${amenities.length} amenities for ${terminalCode}...`);
    
    const formattedAmenities: FormattedAmenity[] = amenities.map((amenity: Amenity, index: number) => {
      // Progress indicator
      if (index % 50 === 0) {
        console.log(`   Processing amenity ${index + 1}/${amenities.length}`);
      }
      
      return {
        name: amenity.name,
        amenity_slug: amenity.slug || amenity.name.toLowerCase().replace(/\s+/g, '-'),
        description: amenity.description || '',
        airport_code: 'SIN',
        terminal_code: `SIN-${terminalCode}`, // Ensure correct format
        category: amenity.category || 'general',
        vibe_tags: amenity.vibes?.join(',') || (Array.isArray(amenity.vibe_tags) ? amenity.vibe_tags.join(',') : amenity.vibe_tags) || '',
        price_level: amenity.price_level || '$$',
        opening_hours: amenity.opening_hours || '{"24/7": false}',
        website_url: amenity.website || '',
        logo_url: amenity.logo || '',
        available_in_tr: amenity.transit_accessible !== false,
        booking_required: amenity.booking_required || false,
        location: amenity.location || '',
        gate_proximity: amenity.gates_nearby || ''
      };
    });

    console.log(`📤 Uploading ${formattedAmenities.length} amenities to Supabase...`);

    const { data, error } = await supabase
      .from('amenity_detail')
      .upsert(formattedAmenities, { 
        onConflict: 'amenity_slug,terminal_code',
        ignoreDuplicates: false 
      });

    if (error) {
      console.error(`❌ Error importing ${terminalCode}:`, error);
      return null;
    }

    console.log(`✅ Successfully imported ${formattedAmenities.length} amenities for ${terminalCode}`);
    return data;
    
  } catch (error) {
    console.error(`❌ Unexpected error importing ${terminalCode}:`, error);
    return null;
  }
}

async function main(): Promise<void> {
  console.log('🚀 Starting SIN Terminal Amenities Import...');
  console.log('📊 Database:', supabaseUrl);
  console.log('🔑 Service Key:', supabaseServiceKey ? '✅ Valid' : '❌ Invalid');
  console.log('');

  const startTime = Date.now();
  
  try {
    // Import all terminals
    const results = await Promise.allSettled([
      importTerminalData(sinT1, 'T1'),
      importTerminalData(sinT2, 'T2'),
      importTerminalData(sinT3, 'T3'),
      importTerminalData(sinT4, 'T4'),
      importTerminalData(sinJewel, 'JEWEL')
    ]);

    // Summary
    console.log('');
    console.log('📋 Import Summary:');
    console.log('==================');
    
    const totalTime = ((Date.now() - startTime) / 1000).toFixed(2);
    
    results.forEach((result, index) => {
      const terminals = ['T1', 'T2', 'T3', 'T4', 'JEWEL'];
      const terminal = terminals[index];
      
      if (result.status === 'fulfilled') {
        console.log(`✅ ${terminal}: Success`);
      } else {
        console.log(`❌ ${terminal}: Failed - ${result.reason}`);
      }
    });
    
    console.log('');
    console.log(`⏱️  Total time: ${totalTime}s`);
    console.log('🎉 Import process completed!');
    
  } catch (error) {
    console.error('❌ Fatal error during import:', error);
    process.exit(1);
  }
}

// Run the import
main();
