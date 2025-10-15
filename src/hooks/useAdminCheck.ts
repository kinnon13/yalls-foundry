/**
 * Hook to check if current user has admin role
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSession } from '@/lib/auth/context';

export function useAdminCheck() {
  const { session } = useSession();

  const { data: isAdmin, isLoading } = useQuery({
    queryKey: ['is-admin', session?.userId],
    queryFn: async () => {
      if (!session?.userId) return false;
      
      const { data, error } = await supabase.rpc('has_role', {
        _user_id: session.userId,
        _role: 'admin',
      });

      if (error) {
        console.error('Admin check error:', error);
        return false;
      }

      return !!data;
    },
    enabled: !!session?.userId,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  return { isAdmin: isAdmin ?? false, isLoading };
}
