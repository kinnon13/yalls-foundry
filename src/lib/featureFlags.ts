/**
 * Feature Flags Utilities
 * Legacy RPC-based flags + new safe mode check
 */

import { supabase } from '@/integrations/supabase/client';
import React from 'react';

export type FeatureFlag = 
  | 'feed_shop_blend'
  | 'discover_reels' 
  | 'payments_real'
  | 'rocker_always_on';

let cachedFlags: Record<string, boolean> | null = null;
let cacheTime = 0;
const CACHE_TTL = 60000; // 1 minute

/**
 * Fetch legacy flags from server via RPC
 * Cached for 1 minute to reduce RPC load
 */
export async function getFlags(): Promise<Record<string, boolean>> {
  const now = Date.now();
  
  if (cachedFlags && (now - cacheTime) < CACHE_TTL) {
    return cachedFlags;
  }
  
  try {
    // @ts-ignore - RPC not yet in generated types
    const { data, error } = await supabase.rpc('flags_for');
    
    if (error) throw error;
    
    cachedFlags = (data as any) as Record<string, boolean>;
    cacheTime = now;
    
    return cachedFlags;
  } catch (err) {
    console.error('[FeatureFlags] RPC error:', err);
    // Fail open with defaults
    return {
      feed_shop_blend: true,
      discover_reels: true,
      payments_real: false,
      rocker_always_on: true,
    };
  }
}

/**
 * Check if a specific legacy flag is enabled
 */
export async function isEnabled(flag: FeatureFlag): Promise<boolean> {
  const flags = await getFlags();
  return flags[flag] ?? false;
}

/**
 * Force refresh legacy flags (use after admin changes)
 */
export function refreshFlags(): void {
  cachedFlags = null;
  cacheTime = 0;
}

/**
 * React hook for legacy feature flags
 */
export function useFeatureFlags() {
  const [flags, setFlags] = React.useState<Record<string, boolean>>({});
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    getFlags().then(f => {
      setFlags(f);
      setLoading(false);
    });
  }, []);

  return { flags, loading, isEnabled: (flag: FeatureFlag) => flags[flag] ?? false };
}

/**
 * NEW: Production safe mode check (for edge functions)
 * Use this in edge functions to check safe mode before exploration
 */
export async function isSafeMode(supabaseClient: typeof supabase): Promise<boolean> {
  try {
    const { data, error } = await supabaseClient
      .from('runtime_flags')
      .select('value')
      .eq('key', 'global.safe_mode')
      .maybeSingle();

    if (error) {
      console.warn('Error checking safe mode:', error);
      return false; // Fail open
    }

    const value = data?.value as { enabled?: boolean } | null;
    return !!value?.enabled;
  } catch (err) {
    console.error('Safe mode check failed:', err);
    return false;
  }
}

/**
 * NEW: Get any runtime flag value (for edge functions)
 */
export async function getRuntimeFlag(
  supabaseClient: typeof supabase,
  key: string
): Promise<any> {
  try {
    const { data, error } = await supabaseClient
      .from('runtime_flags')
      .select('value')
      .eq('key', key)
      .maybeSingle();

    if (error) {
      console.warn(`Error fetching flag ${key}:`, error);
      return null;
    }

    return data?.value as any;
  } catch (err) {
    console.error(`Flag fetch failed for ${key}:`, err);
    return null;
  }
}
