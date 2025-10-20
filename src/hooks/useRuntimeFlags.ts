/**
 * Runtime Flags Hook
 * Access dynamic feature flags from database
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useRuntimeFlags() {
  const { data: flags, isLoading } = useQuery({
    queryKey: ['runtime-flags'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('runtime_flags')
        .select('key, value');
      
      if (error) {
        console.error('Failed to load runtime flags:', error);
        return {};
      }

      // Convert array to map
      return (data || []).reduce((acc, flag) => {
        acc[flag.key] = flag.value;
        return acc;
      }, {} as Record<string, any>);
    },
    staleTime: 5 * 60 * 1000, // Cache 5 minutes
  });

  const isEnabled = (key: string): boolean => {
    return flags?.[key]?.enabled === true;
  };

  const getValue = (key: string, defaultValue?: any) => {
    return flags?.[key] ?? defaultValue;
  };

  return { flags: flags || {}, isLoading, isEnabled, getValue };
}
