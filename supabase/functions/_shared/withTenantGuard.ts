/**
 * Tenant Guard Middleware
 * Ensures RLS isolation and prevents cross-tenant data leaks
 */

import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

export interface TenantContext {
  supabase: SupabaseClient;
  user: {
    id: string;
    email?: string;
  };
  tenantId: string;
}

/**
 * Wrap an edge function with tenant isolation
 */
export async function withTenantGuard(
  req: Request,
  handler: (ctx: TenantContext) => Promise<Response>
): Promise<Response> {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

  // Get auth header
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return new Response(
      JSON.stringify({ error: 'Missing Authorization header' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Create client bound to user's auth token
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } }
  });

  // Verify user
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Tenant ID = user ID for now (can be extended for multi-tenant orgs)
  const tenantId = user.id;

  const ctx: TenantContext = {
    supabase,
    user: {
      id: user.id,
      email: user.email,
    },
    tenantId,
  };

  return handler(ctx);
}
