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

    // Load ethics policy
    const { data: policy } = await supabase
      .from('ai_ethics_policy' as any)
      .select('*')
      .eq('tenant_id', tenantId)
      .maybeSingle();

    const weights = policy?.weights || {
      life_impact: 0.3,
      gap_priority: 0.3,
      risk_avoidance: 0.2,
      cost_efficiency: 0.2
    };

    // Normalize inputs from plan
    const factors = {
      life_impact: plan.life_impact ?? 0.7,
      gap_priority: plan.gap_priority ?? 0.7,
      risk_avoidance: 1 - (plan.risk_score ?? 30) / 100,
      cost_efficiency: 1 - Math.min((plan.estimated_cost_cents ?? 100) / 1000, 1)
    };

    // Calculate ethics-weighted score
    const ethicsScore =
      weights.life_impact * factors.life_impact +
      weights.gap_priority * factors.gap_priority +
      weights.risk_avoidance * factors.risk_avoidance +
      weights.cost_efficiency * factors.cost_efficiency;

    // Heuristic screening: require human approval if cost>threshold or risk_score>threshold
    const cost = plan?.estimated_cost_cents ?? 0;
    const risk = plan?.risk_score ?? 0;
    const allowed = ethicsScore >= 0.6 && risk <= 60;
    const needsHuman = cost > 500 || risk > 30 || !allowed;

    if (needsHuman) {
      await supabase.from('ai_incidents' as any).insert({
        tenant_id: tenantId,
        severity: 'medium',
        source: 'verify_output',
        summary: 'Plan requires approval',
        detail: { cost, risk, plan, ethicsScore }
      });
    }

    return new Response(
      JSON.stringify({ ok: true, needsHuman, allowed, ethicsScore }),
      { headers: { ...CORS, 'Content-Type': 'application/json' } }
    );
  } catch (e: any) {
    return new Response(
      JSON.stringify({ error: String(e?.message || e) }),
      { status: 500, headers: { ...CORS, 'Content-Type': 'application/json' } }
    );
  }
});
