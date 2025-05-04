import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Missing Supabase environment variables');
}

const supabaseUrl = SUPABASE_URL || '';
const supabaseAnonKey = SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

// Log connection status for debugging
console.log('Supabase URL:', SUPABASE_URL ? 'Found' : 'Missing');
console.log('Supabase Key:', SUPABASE_ANON_KEY ? 'Found' : 'Missing');