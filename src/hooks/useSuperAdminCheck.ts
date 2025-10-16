/**
 * Hook to check if current user has super_admin role
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/lib/auth/context';

export function useSuperAdminCheck() {
  const { session } = useSession();

  const { data: isSuperAdmin, isLoading } = useQuery({
    queryKey: ['is-super-admin', session?.userId],
    queryFn: async () => {
      if (!session?.userId) return false;
      
      // Use direct RPC call since types may not be regenerated yet
      const { data, error } = await supabase.rpc('is_super_admin' as any, {
        _user_id: session.userId,
      });

      if (error) {
        console.error('Super admin check error:', error);
        return false;
      }

      return !!data;
    },
    enabled: !!session?.userId,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  return { isSuperAdmin: isSuperAdmin ?? false, isLoading };
}
