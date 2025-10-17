import { useQuery, useQueryClient } from '@tanstack/react-query';
import { rpcWithObs } from '@/lib/supaRpc';

/**
 * Entitlements hook - checks user's access to features via canonical DB functions
 * Cached for 60s, refreshed every 2min
 */
export function useEntitlements() {
  const queryClient = useQueryClient();
  
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
    // Modules are free; only features within modules are gated
    return true;
  };

  const canUseFeature = (featureId: string): boolean => {
    return feats.includes(featureId);
  };

  const invalidate = () => {
    // Force immediate refresh of entitlements (use after upgrade/downgrade)
    queryClient.invalidateQueries({ queryKey: ['entitlements'] });
  };

  return {
    list: feats,
    has,
    canUseModule,
    canUseFeature,
    invalidate,
    isAuthenticated: true,
  };
}
