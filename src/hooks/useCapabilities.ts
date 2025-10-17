/**
 * Capability flags hook
 * Checks which features user has access to
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type CapabilityKey = 
  | 'dashboard_business'
  | 'dashboard_crm'
  | 'dashboard_events'
  | 'dashboard_orders'
  | 'dashboard_earnings'
  | 'dashboard_ai'
  | 'dashboard_settings'
  | 'marketplace'
  | 'events'
  | 'crm';

export function useCapabilities() {
  const { data: capabilities = [], isLoading } = useQuery({
    queryKey: ['capabilities'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('account_capabilities')
        .select('feature_id, features(key)')
        .eq('user_id', user.id)
        .eq('enabled', true);

      if (error) throw error;

      return data?.map(c => c.features?.key).filter(Boolean) as string[];
    },
  });

  const hasCapability = (key: CapabilityKey) => {
    // Default: all features enabled if no capability system set up
    if (capabilities.length === 0 && !isLoading) return true;
    return capabilities.includes(key);
  };

  return { hasCapability, capabilities, isLoading };
}
