/**
 * Supabase Client
 * 
 * Browser-safe Supabase client for use in React components.
 * Uses localStorage for session persistence.
 * 
 * For Day-0, Supabase is optional. The client will only be created
 * if VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are configured.
 * 
 * Usage:
 *   import { supabaseClient } from '@/lib/supabase/client';
 *   const { data } = await supabaseClient.from('profiles').select();
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { config } from '@/lib/config';

// Only create client if Supabase is configured
let supabaseClient: SupabaseClient | null = null;

if (config.VITE_SUPABASE_URL && config.VITE_SUPABASE_ANON_KEY) {
  supabaseClient = createClient(
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
}

// Export client with helpful error if not configured
export { supabaseClient };

/**
 * Get Supabase client or throw if not configured
 */
export function requireSupabase(): SupabaseClient {
  if (!supabaseClient) {
    throw new Error(
      'Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables.'
    );
  }
  return supabaseClient;
}