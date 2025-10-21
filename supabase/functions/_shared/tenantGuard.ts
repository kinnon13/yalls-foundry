/**
 * Tenant Guard - Multi-Tenant Isolation Layer
 * 
 * CRITICAL: All edge functions MUST use this wrapper
 * Prevents cross-org data leakage and enforces security boundaries
 */

import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from './cors.ts';
import { createLogger } from './logger.ts';

export interface TenantContext {
  userId: string;
  orgId: string;
  capabilities: string[];
  flags: Record<string, boolean>;
  tenantClient: SupabaseClient;
  adminClient: SupabaseClient;
  requestId: string;
}

interface TenantGuardConfig {
  requireAuth?: boolean;
  requireOrg?: boolean;
  rateLimitTier?: 'low' | 'standard' | 'high' | 'expensive';
}

/**
 * Extract org_id from JWT claims or resolve from user profile
 */
async function resolveOrgId(
  userId: string,
  adminClient: SupabaseClient
): Promise<string> {
  // Try to get org from user_orgs table
  const { data: orgData } = await adminClient
    .from('user_orgs')
    .select('org_id')
    .eq('user_id', userId)
    .single();
  
  if (orgData?.org_id) {
    return orgData.org_id;
  }
  
  // Fallback: user is their own org (single-user mode)
  return userId;
}

/**
 * Load user capabilities (roles)
 */
async function loadCapabilities(
  userId: string,
  adminClient: SupabaseClient
): Promise<string[]> {
  const { data: roles } = await adminClient
    .from('user_roles')
    .select('role')
    .eq('user_id', userId);
  
  return roles?.map(r => r.role) || [];
}

/**
 * Load org-specific feature flags
 */
async function loadFeatureFlags(
  orgId: string,
  adminClient: SupabaseClient
): Promise<Record<string, boolean>> {
  const { data: flags } = await adminClient
    .from('feature_flags')
    .select('feature_key, enabled')
    .or(`enabled_for_tenants.cs.{${orgId}},enabled_for_tenants.is.null`);
  
  const flagMap: Record<string, boolean> = {};
  flags?.forEach(f => {
    flagMap[f.feature_key] = f.enabled;
  });
  
  return flagMap;
}

/**
 * Create tenant-scoped Supabase client
 * All queries automatically filtered to org_id
 */
function createTenantClient(
  orgId: string,
  authHeader: string
): SupabaseClient {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    {
      global: {
        headers: {
          Authorization: authHeader,
          // Custom header for RLS policies to read
          'X-Org-Id': orgId,
        },
      },
    }
  );
  
  return supabase;
}

/**
 * Create admin client (service role) with audit logging
 * Use sparingly - bypasses RLS
 */
function createAdminClient(
  requestId: string,
  userId: string,
  action: string
): SupabaseClient {
  const client = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );
  
  // Log all admin client usage for audit
  client
    .from('admin_audit_log')
    .insert({
      request_id: requestId,
      user_id: userId,
      action,
      timestamp: new Date().toISOString(),
    })
    .then()
    .catch(console.error);
  
  return client;
}

/**
 * Check rate limits (per-org + per-user buckets)
 */
async function checkRateLimits(
  orgId: string,
  userId: string,
  tier: string,
  adminClient: SupabaseClient
): Promise<boolean> {
  // Get rate limit config
  const limits = {
    low: { perMin: 30, burst: 10 },
    standard: { perMin: 100, burst: 20 },
    high: { perMin: 300, burst: 50 },
    expensive: { perMin: 10, burst: 2 },
  }[tier] || { perMin: 100, burst: 20 };
  
  // Check org-level limits
  const { data: orgUsage } = await adminClient
    .from('rate_limit_usage')
    .select('count, window_start')
    .eq('org_id', orgId)
    .eq('tier', tier)
    .gte('window_start', new Date(Date.now() - 60000).toISOString())
    .single();
  
  if (orgUsage && orgUsage.count >= limits.perMin) {
    return false; // Rate limited
  }
  
  // Check user-level limits (prevent single user from exhausting org quota)
  const { data: userUsage } = await adminClient
    .from('rate_limit_usage')
    .select('count, window_start')
    .eq('user_id', userId)
    .eq('tier', tier)
    .gte('window_start', new Date(Date.now() - 60000).toISOString())
    .single();
  
  if (userUsage && userUsage.count >= limits.burst) {
    return false; // Rate limited
  }
  
  // Increment counters
  await adminClient.from('rate_limit_usage').upsert({
    org_id: orgId,
    user_id: userId,
    tier,
    count: (orgUsage?.count || 0) + 1,
    window_start: new Date(Date.now() - (Date.now() % 60000)).toISOString(),
  }, { onConflict: 'org_id,user_id,tier,window_start' });
  
  return true; // Allowed
}

/**
 * Main tenant guard wrapper
 * 
 * USAGE:
 * serve(async (req) => {
 *   if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
 *   
 *   return withTenantGuard(req, async (ctx) => {
 *     // Use ctx.tenantClient for all DB queries
 *     const { data } = await ctx.tenantClient.from('table').select();
 *     return new Response(JSON.stringify(data));
 *   }, { requireAuth: true, rateLimitTier: 'standard' });
 * });
 */
export async function withTenantGuard(
  req: Request,
  handler: (ctx: TenantContext) => Promise<Response>,
  config: TenantGuardConfig = {}
): Promise<Response> {
  const {
    requireAuth = true,
    requireOrg = true,
    rateLimitTier = 'standard',
  } = config;
  
  const requestId = crypto.randomUUID();
  const log = createLogger('tenant-guard', { requestId });
  
  try {
    // 1. Authenticate user
    const authHeader = req.headers.get('Authorization') ?? '';
    
    if (requireAuth && !authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }
    
    // Create admin client for user lookup
    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );
    
    // Get user from JWT
    const { data: { user }, error: authError } = await adminClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    );
    
    if (requireAuth && (authError || !user)) {
      log.warn('Auth failed', { error: authError });
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }
    
    const userId = user?.id || 'anonymous';
    
    // 2. Resolve org
    const orgId = await resolveOrgId(userId, adminClient);
    
    if (requireOrg && !orgId) {
      return new Response(
        JSON.stringify({ error: 'Organization not found' }),
        {
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }
    
    // 3. Check rate limits
    const allowed = await checkRateLimits(orgId, userId, rateLimitTier, adminClient);
    
    if (!allowed) {
      log.warn('Rate limited', { orgId, userId, tier: rateLimitTier });
      return new Response(
        JSON.stringify({ 
          error: 'Rate limit exceeded. Please try again later.',
          retryAfter: 60 
        }),
        {
          status: 429,
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json',
            'Retry-After': '60',
          },
        }
      );
    }
    
    // 4. Load capabilities
    const capabilities = await loadCapabilities(userId, adminClient);
    
    // 5. Load feature flags
    const flags = await loadFeatureFlags(orgId, adminClient);
    
    // 6. Create tenant-scoped client
    const tenantClient = createTenantClient(orgId, authHeader);
    
    // 7. Execute handler
    log.info('Request started', { userId, orgId, capabilities, flags: Object.keys(flags) });
    const startTime = Date.now();
    
    const response = await handler({
      userId,
      orgId,
      capabilities,
      flags,
      tenantClient,
      adminClient,
      requestId,
    });
    
    const duration = Date.now() - startTime;
    log.info('Request completed', { duration });
    
    // Add correlation headers
    response.headers.set('X-Request-Id', requestId);
    response.headers.set('X-Org-Id', orgId);
    
    return response;
    
  } catch (error) {
    log.error('Tenant guard error', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Internal server error',
        requestId 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
}

/**
 * Helper: Enqueue heavy job instead of processing synchronously
 */
export async function enqueueJob(
  ctx: TenantContext,
  kind: string,
  payload: any,
  idempotencyKey?: string
): Promise<string> {
  const { data, error } = await ctx.adminClient
    .from('ingest_jobs')
    .insert({
      org_id: ctx.orgId,
      kind,
      payload,
      external_idempotency_key: idempotencyKey,
    })
    .select('id')
    .single();
  
  if (error) throw error;
  return data.id;
}
