import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type Flag = { key: string; enabled: boolean; rollout: number };

export function useFlags() {
  const { data: flags = [] } = useQuery({
    queryKey: ['flags'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('feature_flags')
        .select('key,enabled,rollout');
      if (error) throw error;
      return data as Flag[];
    },
  });

  const isOn = (key: string, userId?: string) => {
    const f = flags.find((x) => x.key === key);
    if (!f) return false;
    if (!f.enabled) return false;
    if (f.rollout >= 100) return true;
    if (!userId) return false;
    
    // Deterministic bucket based on user ID
    const hash = [...userId].reduce((a, c) => (a + c.charCodeAt(0)) % 101, 0);
    return hash < f.rollout;
  };

  return { flags, isOn };
}
