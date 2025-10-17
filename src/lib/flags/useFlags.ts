/**
 * Feature Flags with Deterministic Rollout
 * Billion-user ready with consistent bucketing
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/lib/auth/context';

export interface Flag {
  key: string;
  enabled: boolean;
  rollout: number;
  payload?: Record<string, unknown>;
}

export function useFlags() {
  const { user } = useAuthContext();

  const { data: flags = [] } = useQuery({
    queryKey: ['feature_flags'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('feature_flags')
        .select('key, enabled, rollout, payload');
      if (error) throw error;
      return data as Flag[];
    },
    staleTime: 5 * 60 * 1000, // 5min cache
  });

  const isEnabled = (key: string): boolean => {
    const flag = flags.find(f => f.key === key);
    if (!flag || !flag.enabled) return false;
    if (flag.rollout >= 100) return true;
    if (!user?.id) return false;

    // Deterministic bucketing: same user always gets same result
    const hash = (key + ':' + user.id)
      .split('')
      .reduce((a, c) => ((a << 5) - a + c.charCodeAt(0)) | 0, 0);
    const bucket = Math.abs(hash) % 100;
    return bucket < flag.rollout;
  };

  const getPayload = (key: string): Record<string, unknown> | null => {
    const flag = flags.find(f => f.key === key);
    return flag?.payload || null;
  };

  return { flags, isEnabled, getPayload };
}
