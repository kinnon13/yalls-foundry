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
    const introspectAll = body.introspectAll === true;

    console.log('Scanning features:', { rpcs: rpcs.length, tables: tables.length, routes: routes.length, introspectAll });

    // If introspectAll, discover ALL tables and RPCs in the database
    let allRpcs = rpcs;
    let allTables = tables;

    if (introspectAll) {
      console.log('Introspecting ALL database objects...');
      
      // Query ALL public functions from pg_proc
      try {
        const { data: pgFunctions } = await admin
          .from('pg_proc' as any)
          .select('proname')
          .limit(1000);
        
        if (pgFunctions) {
          const discoveredRpcs = pgFunctions.map((f: any) => f.proname).filter(Boolean);
          allRpcs = [...new Set([...rpcs, ...discoveredRpcs])];
          console.log(`Discovered ${discoveredRpcs.length} total RPCs (${allRpcs.length} unique)`);
        }
      } catch (e) {
        console.warn('Failed to query pg_proc:', e);
      }

      // Query ALL public tables from information_schema
      try {
        const { data: pgTables } = await admin
          .from('information_schema.tables' as any)
          .select('table_name')
          .eq('table_schema', 'public')
          .limit(1000);
        
        if (pgTables) {
          const discoveredTables = pgTables.map((t: any) => t.table_name).filter(Boolean);
          allTables = [...new Set([...tables, ...discoveredTables])];
          console.log(`Discovered ${discoveredTables.length} total tables (${allTables.length} unique)`);
        }
      } catch (e) {
        console.warn('Failed to query information_schema:', e);
      }
    }

    const { data, error } = await admin.rpc('feature_introspect', { rpcs: allRpcs, tables: allTables });
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
