/**
 * React Hook for Feature Flags
 * Subscribes to flag changes and provides current values
 */

import { useState, useEffect } from 'react';
import { getFlag, subscribe, type FlagKey, allFlags } from '@/lib/flags/index';

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
