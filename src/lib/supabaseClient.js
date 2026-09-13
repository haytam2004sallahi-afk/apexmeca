import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://dpdebudbbpbpvghyuwym.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRwZGVidWRiYnBicHZnaHl1d3ltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE0OTk3NjksImV4cCI6MjA3NzA3NTc2OX0.iCTa5sZUc696kUjeCaCRxhdUM91KkXe_wpKC4uQcYwY';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});