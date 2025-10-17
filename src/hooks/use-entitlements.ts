import { useQuery } from '@tanstack/react-query';
import { rpcWithObs } from '@/lib/supaRpc';

/**
 * Entitlements hook - checks user's access to features via canonical DB functions
 * Cached for 60s, refreshed every 2min
 */
export function useEntitlements() {
  const { data: feats = [] } = useQuery({
    queryKey: ['entitlements'],
    queryFn: async () => {
      const { data, error } = await rpcWithObs(
        'get_entitlements',
        {},
        { surface: 'entitlements' }
      );
      if (error) throw error;
      return ((data as any) || []).map((r: any) => r.feature_id as string);
    },
    staleTime: 60_000,
    refetchInterval: 120_000,
  });

  const has = (req?: string[] | null): boolean => {
    if (!req || req.length === 0) return true;
    return req.every(f => feats.includes(f));
  };

  const canUseModule = (moduleKey: string): boolean => {
    // For now, modules are free; only features are gated
    return true;
  };

  const canUseFeature = (featureId: string): boolean => {
    return feats.includes(featureId);
  };

  return {
    list: feats,
    has,
    canUseModule,
    canUseFeature,
    isAuthenticated: true, // If hook runs, user is authenticated
  };
}
