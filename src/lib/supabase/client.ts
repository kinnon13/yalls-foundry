/**
 * Supabase Client
 * 
 * Browser-safe Supabase client for use in React components.
 * Uses localStorage for session persistence.
 * 
 * Usage:
 *   import { supabaseClient } from '@/lib/supabase/client';
 *   const { data } = await supabaseClient.from('profiles').select();
 */

import { createClient } from '@supabase/supabase-js';
import { config } from '@/lib/config';

export const supabaseClient = createClient(
  config.VITE_SUPABASE_URL,
  config.VITE_SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  }
);