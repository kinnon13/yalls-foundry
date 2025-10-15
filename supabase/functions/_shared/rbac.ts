import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

export type AppRole = 'admin' | 'moderator' | 'user';

export interface AuthenticatedContext {
  supabase: SupabaseClient;
  user: { id: string; email?: string };
}

/**
 * Require a specific role for the request.
 * Returns AuthenticatedContext if authorized, Response if not.
 */
export async function requireRole(
  req: Request,
  role: AppRole
): Promise<AuthenticatedContext | Response> {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    {
      global: {
        headers: {
          Authorization: req.headers.get('Authorization') ?? ''
        }
      }
    }
  );

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    return new Response('Unauthorized', { status: 401 });
  }

  // Check role using the database function
  const { data, error } = await supabase
    .rpc('has_role', { _user: user.id, _role: role });

  if (error) {
    console.error('RBAC check failed:', error);
    return new Response('RBAC check failed', { status: 500 });
  }

  if (!data && role !== 'user') {
    return new Response('Forbidden', { status: 403 });
  }

  return { supabase, user };
}

/**
 * Require authenticated user (no specific role)
 */
export async function requireAuth(req: Request): Promise<AuthenticatedContext | Response> {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    {
      global: {
        headers: {
          Authorization: req.headers.get('Authorization') ?? ''
        }
      }
    }
  );

  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    return new Response('Unauthorized', { status: 401 });
  }

  return { supabase, user };
}
