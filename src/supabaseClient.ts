import { createClient } from '@supabase/supabase-js';

// Initialise a single Supabase client for the entire app.
// The URL and anon key are provided at build time via Vite environment variables.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default supabase;