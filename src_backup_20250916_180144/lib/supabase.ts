import { createClient } from '@supabase/supabase-js';

// Your Supabase configuration
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables! Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env file');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types matching your actual database schema
export interface AmenityDetail {
  id: number;
  created_at?: string;
  amenity_slug: string;
  name?: string;
  description?: string;
  website_url?: string;
  logo_url?: string;
  vibe_tags?: string;
  booking_required?: string;
  available_in_tr?: string;
  price_level?: string;
  opening_hours?: string;
  terminal_code: string;
  airport_code: string;
  gate_location?: string;
  walking_time_minutes?: number;
  zone?: string;
  latitude?: number;
  longitude?: number;
}

export interface CollectionAmenity {
  id: string;
  collection_id: string;
  amenity_detail_id: number;
  terminal_code: string;
  priority: number;
  is_featured: boolean;
  created_at?: string;
}

export interface CollectionDetail {
  id: string;
  name: string;
  slug?: string;
  description?: string;
  vibe?: string;
  icon?: string;
  color?: string;
}

// Helper function to check connection
export async function testSupabaseConnection() {
  try {
    const { data, error } = await supabase
      .from('amenity_details')
      .select('count')
      .limit(1);
    
    if (error) throw error;
    console.log('✅ Supabase connected successfully!');
    return true;
  } catch (error) {
    console.error('❌ Supabase connection failed:', error);
    return false;
  }
}