// deno-lint-ignore-file no-explicit-any
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS });

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );
    
    const { version = 1, tenantId = null } = await req.json();

    // Check opt-in flag
    const { data: flag } = await supabase
      .from('ai_federation_flags' as any)
      .select('*')
      .eq('tenant_id', tenantId)
      .maybeSingle();
    
    if (!flag?.opt_in) {
      return new Response(
        JSON.stringify({ shared: false, reason: 'opt_out' }),
        { headers: { ...CORS, 'Content-Type': 'application/json' } }
      );
    }

    // Aggregate last 24h learnings into coarse buckets (privacy) using k-anon RPC
    const { data: agg } = await supabase.rpc('aggregate_learnings_k_anon');

    await supabase.from('ai_learnings_agg' as any).insert({
      version,
      stats: { buckets: agg || [] }
    });

    return new Response(
      JSON.stringify({ ok: true, shared: true, k: flag.min_k, buckets: (agg || []).length }),
      { headers: { ...CORS, 'Content-Type': 'application/json' } }
    );
  } catch (e: any) {
    return new Response(
      JSON.stringify({ error: String(e?.message || e) }),
      { status: 500, headers: { ...CORS, 'Content-Type': 'application/json' } }
    );
  }
});
