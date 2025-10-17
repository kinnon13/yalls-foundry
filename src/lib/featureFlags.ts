/**
 * Feature Flags Client (Task 1)
 * Real-time server-driven flags via RPC
 */

import { supabase } from '@/integrations/supabase/client';

export type FeatureFlag = 
  | 'feed_shop_blend'
  | 'discover_reels' 
  | 'payments_real'
  | 'rocker_always_on';

let cachedFlags: Record<string, boolean> | null = null;
let cacheTime = 0;
const CACHE_TTL = 60000; // 1 minute

/**
 * Fetch flags from server via RPC
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
 * Check if a specific flag is enabled
 */
export async function isEnabled(flag: FeatureFlag): Promise<boolean> {
  const flags = await getFlags();
  return flags[flag] ?? false;
}

/**
 * Force refresh flags (use after admin changes)
 */
export function refreshFlags(): void {
  cachedFlags = null;
  cacheTime = 0;
}

/**
 * React hook for feature flags
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

import React from 'react';
