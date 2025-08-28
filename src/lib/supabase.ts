import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Use environment variables from .env.example if not configured 
const defaultUrl = 'https://clsenvxbqvuuxxgyvjly.supabase.co';
const defaultKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNsc2VudnhicXZ1dXh4Z3l2amx5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYzMTY1OTEsImV4cCI6MjA3MTg5MjU5MX0.-XrxrhuSEa1Lzcpykg01fK0LoYJ6Us6DhpLmR4GH-jI';

const finalUrl = supabaseUrl || defaultUrl;
const finalKey = supabaseAnonKey || defaultKey;

if (!finalUrl || !finalKey) {
  console.warn('⚠️ Supabase environment variables not configured properly');
}
export const supabase = createClient(finalUrl, finalKey);

// Export supabase client for direct bucket operations
export { supabase as default };