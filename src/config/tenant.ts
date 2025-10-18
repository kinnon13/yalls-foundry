/**
 * Tenant Configuration
 * Centralized tenant resolution for multi-tenant architecture
 */

import { supabase } from '@/integrations/supabase/client';

export const GLOBAL_TENANT_ID = '00000000-0000-0000-0000-000000000000';

/**
 * Resolve tenant ID from user context
 * Supports:
 * - Authenticated users (user_id = tenant_id)
 * - Guest users (fallback to GLOBAL_TENANT_ID)
 * - Future: Subdomain-based tenant resolution
 */
export async function resolveTenantId(userId?: string): Promise<string> {
  if (!userId) {
    const { data: { user } } = await supabase.auth.getUser();
    userId = user?.id;
  }

  // Guest fallback
  if (!userId) {
    return GLOBAL_TENANT_ID;
  }

  // Future: Query workspace/organization membership
  // For now: user_id = tenant_id
  return userId;
}

/**
 * Get tenant from subdomain (future)
 * Example: "acme.yalls.ai" -> "acme"
 */
export function getTenantFromSubdomain(): string | null {
  if (typeof window === 'undefined') return null;
  
  const hostname = window.location.hostname;
  const parts = hostname.split('.');
  
  // Single subdomain on production domain
  if (parts.length === 3 && parts[1] === 'yalls') {
    return parts[0];
  }
  
  return null;
}
