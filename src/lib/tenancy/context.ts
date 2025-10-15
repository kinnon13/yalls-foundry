/**
 * Multi-Tenancy Context (Billion-User Ready)
 * 
 * Resolves tenant_id dynamically from user context.
 * Eliminates hardcoded tenant_id for horizontal scalability.
 * 
 * Usage:
 *   const tenantId = await resolveTenantId(userId);
 */

import { supabase } from '@/integrations/supabase/client';

/**
 * Resolve tenant_id from user context
 * 
 * Future: Multi-tenant organizations with workspace tables
 * Current: User-level tenancy (user_id = tenant_id)
 */
export async function resolveTenantId(userId?: string): Promise<string> {
  if (!userId) {
    const { data: { user } } = await supabase.auth.getUser();
    userId = user?.id;
  }

  if (!userId) {
    throw new Error('Unauthorized: No tenant context');
  }

  // Future: Query workspace/organization membership
  // const { data } = await supabase
  //   .from('workspace_members')
  //   .select('workspace_id')
  //   .eq('user_id', userId)
  //   .single();
  // return data?.workspace_id;

  // Current: User-level tenancy (user_id = tenant_id)
  // Production: Will come from JWT claims via app.current_tenant_id()
  if (process.env.NODE_ENV === 'production' && !userId) {
    throw new Error('FATAL: No tenant_id in production. Check JWT claims.');
  }
  
  return userId;
}

/**
 * Get global tenant_id (for platform-wide resources)
 */
export const GLOBAL_TENANT_ID = '00000000-0000-0000-0000-000000000000';
