import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://cvnrliwvalfyyzakivjo.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2bnJsaXd2YWxmeXl6YWtpdmpvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYwOTgwODUsImV4cCI6MjEwMTY3NDA4NX0.2oa4UVxjKTqgyCLKGpGeqK-d5HhvzB21yE9kald1wsw';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: window.localStorage,
  },
});

export default supabase;
