import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

type EntityKind = 'business' | 'farm' | 'horse' | 'stallion' | 'producer' | 'incentive';
type Counts = Partial<Record<EntityKind, number>>;

export function useEntityCapabilities(userId: string | null) {
  return useQuery({
    queryKey: ['entity-capabilities', userId],
    enabled: !!userId,
    staleTime: 30000, // Cache for 30s
    queryFn: async (): Promise<Counts> => {
      if (!userId) return {};
      
      try {
        // Call RPC using direct query approach to avoid type issues
        const { data, error } = await supabase
          .rpc('entity_counts_by_kind' as any, { 
            p_user_id: userId 
          });
        
        if (error) {
          console.error('Failed to fetch entity capabilities:', error);
          return {};
        }
        
        const counts: Counts = {};
        (data || []).forEach((row: any) => {
          counts[row.kind as EntityKind] = Number(row.count || 0);
        });
        
        return counts;
      } catch (err) {
        console.error('Error in useEntityCapabilities:', err);
        return {};
      }
    }
  });
}
