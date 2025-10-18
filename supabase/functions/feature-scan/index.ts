import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, 'content-type': 'application/json' },
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (req.method !== 'POST') {
      return json({ error: 'Method not allowed' }, 405);
    }

    const auth = req.headers.get('Authorization') ?? '';
    const url = Deno.env.get('SUPABASE_URL')!;
    const anon = Deno.env.get('SUPABASE_ANON_KEY')!;
    const service = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const userClient = createClient(url, anon, {
      global: { headers: { Authorization: auth } },
    });

    const { data: { user }, error: userErr } = await userClient.auth.getUser();
    if (userErr) throw userErr;
    if (!user) return json({ error: 'Unauthorized' }, 401);

    // Check if user is admin
    let isAdmin = false;
    try {
      const { data, error } = await userClient.rpc('is_admin', { _user_id: user.id });
      if (error) throw error;
      isAdmin = !!data;
    } catch {
      const roles: string[] = (user.app_metadata?.roles as string[]) || [];
      isAdmin = roles.includes('admin');
    }

    if (!isAdmin) return json({ error: 'Forbidden' }, 403);

    const admin = createClient(url, service);
    const body = await req.json().catch(() => ({}));

    console.log('Scanning features:', { 
      rpcs: body.rpcs?.length ?? 0, 
      tables: body.tables?.length ?? 0, 
      routes: body.routes?.length ?? 0,
      rls_read_tables: body.rls_read_tables?.length ?? 0,
      introspectAll: body.introspectAll 
    });

    // Call the comprehensive feature_introspect RPC
    const { data, error } = await admin.rpc('feature_introspect', {
      p_rpcs: body.rpcs ?? null,
      p_tables: body.tables ?? null,
      p_introspect_all: body.introspectAll === true,
    });

    if (error) {
      console.error('feature_introspect error:', error);
      throw error;
    }

    // User RLS probe - test if user can actually read from these tables
    const userProbe: Record<string, boolean> = {};
    const rls_read_tables = Array.isArray(body.rls_read_tables) ? body.rls_read_tables : [];
    
    console.log('Running RLS user probes for', rls_read_tables.length, 'tables');
    for (const tbl of rls_read_tables) {
      try {
        const tableName = tbl.replace(/^public\./, '');
        const { error: rlsError } = await userClient
          .from(tableName)
          .select('id')
          .limit(1);
        userProbe[tbl] = !rlsError;
        if (rlsError) {
          console.log(`RLS probe failed for ${tbl}:`, rlsError.message);
        }
      } catch (e) {
        console.warn(`RLS probe error for ${tbl}:`, e);
        userProbe[tbl] = false;
      }
    }

    return json({ 
      ok: true, 
      routes: body.routes ?? [], 
      userProbe,
      ...data 
    });
  } catch (e) {
    console.error('feature-scan error:', e);
    return json({ ok: false, error: String(e) }, 500);
  }
});
