import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default supabase;

/** Row shape returned by the amenity_detail table / chat API. */
export interface AmenityDetail {
  id: string;
  name: string;
  amenity_slug: string;
  description: string | null;
  terminal_code: string;
  airport_code: string;
  vibe_tags: string | null;
  opening_hours: Record<string, string> | null;
  price_level: string | null;
  image_url: string | null;
  gate_location: string | null;
  zone: string | null;
  available_in_tr: boolean | null;
  latitude: number | null;
  longitude: number | null;
  [key: string]: unknown;
}