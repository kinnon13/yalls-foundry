/**
 * Hook to check if current user has super_admin role
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/lib/auth/context';
import { getCurrentRole } from '@/security/role';

export function useSuperAdminCheck() {
  const { session } = useSession();

  // Dev/test override via ?role=super (see src/security/role.ts)
  const overrideSuper = typeof window !== 'undefined' && getCurrentRole() === 'super';

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
    enabled: !!session?.userId && !overrideSuper,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  return { isSuperAdmin: overrideSuper ? true : (isSuperAdmin ?? false), isLoading: overrideSuper ? false : isLoading };
}
