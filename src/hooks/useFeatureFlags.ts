/**
 * React Hooks for Feature Flags
 * - Local flags (useFeatureFlag, useAllFeatureFlags): localStorage-based admin toggles
 * - Runtime flags (useRuntimeFlags): backend production flags for safe mode, learning, etc.
 */

import { useState, useEffect } from 'react';
import { getFlag, subscribe, type FlagKey, allFlags } from '@/lib/flags/index';

/**
 * Hook for local feature flag (localStorage-based)
 * Use for admin panel toggles
 */
export function useFeatureFlag(key: FlagKey): boolean {
  const [enabled, setEnabled] = useState(() => getFlag(key));

  useEffect(() => {
    const unsubscribe = subscribe(() => {
      setEnabled(getFlag(key));
    });
    return unsubscribe;
  }, [key]);

  return enabled;
}

/**
 * Hook for all local feature flags (localStorage-based)
 * Use for admin panel display
 */
export function useAllFeatureFlags(): Record<string, boolean> {
  const [flags, setFlags] = useState(() => allFlags());

  useEffect(() => {
    const unsubscribe = subscribe(() => {
      setFlags(allFlags());
    });
    return unsubscribe;
  }, []);

  return flags;
}

/**
 * Hook for runtime flags (backend production flags)
 * Use for safe mode, learning controls, etc.
 */
export function useRuntimeFlags() {
  const [flags, setFlags] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const refreshFlags = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/feature-flags`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch flags: ${response.statusText}`);
      }

      const json = await response.json();
      setFlags(json.flags || {});
      setError(null);
    } catch (err) {
      console.error('Error fetching runtime flags:', err);
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshFlags();
  }, []);

  const isEnabled = (key: string): boolean => {
    return flags[key]?.enabled === true;
  };

  const getValue = (key: string, defaultValue?: any): any => {
    return flags[key]?.value ?? defaultValue;
  };

  return {
    flags,
    loading,
    error,
    refreshFlags,
    isEnabled,
    getValue,
  };
}
