/**
 * Production Feature Flags (Backend Safe Mode)
 * Used by edge functions to check safe mode and other runtime flags
 */

import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Check if safe mode is enabled (disables exploration)
 * Use in edge functions before running bandit exploration
 */
export async function isSafeMode(supabase: SupabaseClient): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('runtime_flags')
      .select('value')
      .eq('key', 'global.safe_mode')
      .maybeSingle();

    if (error) {
      console.warn('Error checking safe mode:', error);
      return false; // Fail open
    }

    return !!data?.value?.enabled;
  } catch (err) {
    console.error('Safe mode check failed:', err);
    return false;
  }
}

/**
 * Get any runtime flag value
 * Returns the flag's value object or null if not found
 */
export async function getFlag(
  supabase: SupabaseClient,
  key: string
): Promise<any> {
  try {
    const { data, error } = await supabase
      .from('runtime_flags')
      .select('value')
      .eq('key', key)
      .maybeSingle();

    if (error) {
      console.warn(`Error fetching flag ${key}:`, error);
      return null;
    }

    return data?.value;
  } catch (err) {
    console.error(`Flag fetch failed for ${key}:`, err);
    return null;
  }
}

/**
 * Check if a flag is enabled (boolean check)
 */
export async function isFlagEnabled(
  supabase: SupabaseClient,
  key: string
): Promise<boolean> {
  const value = await getFlag(supabase, key);
  return !!value?.enabled;
}
