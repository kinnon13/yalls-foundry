import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'content-type': 'application/json' },
      });
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
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'content-type': 'application/json' },
      });
    }

    let isAdmin = false;
    try {
      const { data, error } = await userClient.rpc('is_admin', { _user_id: user.id });
      if (error) throw error;
      isAdmin = !!data;
    } catch {
      const roles: string[] = (user.app_metadata?.roles as string[]) || [];
      isAdmin = roles.includes('admin');
    }

    if (!isAdmin) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403,
        headers: { ...corsHeaders, 'content-type': 'application/json' },
      });
    }

    const admin = createClient(url, service);

    const body = await req.json().catch(() => ({}));
    const rpcs = Array.isArray(body.rpcs) ? body.rpcs : [];
    const tables = Array.isArray(body.tables) ? body.tables : [];
    const routes = Array.isArray(body.routes) ? body.routes : [];

    const { data, error } = await admin.rpc('feature_introspect', { rpcs, tables });
    if (error) {
      console.error('feature_introspect error:', error);
      throw error;
    }

    return new Response(JSON.stringify({ ok: true, routes, ...data }), {
      headers: { ...corsHeaders, 'content-type': 'application/json' },
    });
  } catch (e) {
    console.error('feature-scan error:', e);
    return new Response(JSON.stringify({ ok: false, error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, 'content-type': 'application/json' },
    });
  }
});
