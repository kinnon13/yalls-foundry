import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/**
 * Entitlements hook - checks user's access to modules/features
 * 
 * Future: connect to subscription_tier + account_capabilities
 * For now: returns basic free-tier access
 */
export function useEntitlements() {
  const { data: session } = useQuery({
    queryKey: ['session'],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      return session;
    },
  });

  // TODO: Replace with actual entitlement check against user_roles or subscription_tier
  const canUseModule = (moduleKey: string): boolean => {
    if (!session) return false;
    
    // For now, all authenticated users can access all modules
    // Future: check against account_capabilities or subscription tier
    return true;
  };

  const canUseFeature = (featureId: string): boolean => {
    if (!session) return false;
    
    // Future: check feature-level entitlements
    return true;
  };

  return {
    canUseModule,
    canUseFeature,
    isAuthenticated: !!session,
  };
}
