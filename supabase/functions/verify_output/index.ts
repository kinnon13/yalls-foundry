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
    
    const { plan, tenantId } = await req.json();

    // Heuristic screening: require human approval if cost>threshold or risk_score>threshold
    const cost = plan?.estimated_cost_cents ?? 0;
    const risk = plan?.risk_score ?? 0;
    const needsHuman = cost > 500 || risk > 30;

    if (needsHuman) {
      await supabase.from('ai_incidents').insert({
        tenant_id: tenantId,
        severity: 'medium',
        source: 'verify_output',
        summary: 'Plan requires approval',
        detail: { cost, risk, plan }
      });
    }

    return new Response(
      JSON.stringify({ ok: true, needsHuman }),
      { headers: { ...CORS, 'Content-Type': 'application/json' } }
    );
  } catch (e: any) {
    return new Response(
      JSON.stringify({ error: String(e?.message || e) }),
      { status: 500, headers: { ...CORS, 'Content-Type': 'application/json' } }
    );
  }
});
