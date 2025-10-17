/**
 * Feature Flags with Deterministic Rollout
 * Billion-user ready with consistent bucketing
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/lib/auth/context';

export interface Flag {
  key: string;
  enabled: boolean;
  rollout: number;
  payload?: Record<string, unknown>;
}

function hash(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = ((h << 5) - h + str.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export function useFlags() {
  const { session } = useSession();

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
    if (!session?.userId) return false;

    // Deterministic bucketing: same user always gets same result
    const bucket = hash(`${key}:${session.userId}`) % 100;
    return bucket < flag.rollout;
  };

  const getPayload = (key: string): Record<string, unknown> | null => {
    const flag = flags.find(f => f.key === key);
    return flag?.payload || null;
  };

  return { flags, isEnabled, getPayload };
}
