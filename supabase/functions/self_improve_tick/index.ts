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
    
    const today = new Date().toISOString().slice(0, 10);

    // Pull last 24h learnings
    const { data: learns } = await supabase
      .from('ai_learnings')
      .select('rating, tags, model_name, created_at')
      .gte('created_at', `${today}T00:00:00`);

    // Simple heuristic: if avg rating < 4, propose policy weight tweak
    const ratings = (learns || []).map(l => l.rating || 0).filter(r => r > 0);
    const avg = ratings.length > 0 ? ratings.reduce((a, c) => a + c, 0) / ratings.length : 5;

    if (avg < 4) {
      const before = { weights: { quality_optimized: 1 } };
      const after = { weights: { quality_optimized: 1.15, cost_optimized: 0.95 } };

      // Select 10% canary cohort for safe rollout
      const { data: allUsers } = await supabase
        .from('ai_user_profiles')
        .select('user_id')
        .limit(1000);
      
      const canarySize = Math.ceil((allUsers?.length || 0) * 0.1);
      const canaryUsers = (allUsers || [])
        .sort(() => Math.random() - 0.5)
        .slice(0, canarySize)
        .map(u => u.user_id);

      await supabase.from('ai_change_proposals').insert({
        tenant_id: null,
        topic: 'policy.weight_tweak',
        dry_run: { avg_rating: avg },
        canary: { 
          cohort_size: canarySize, 
          user_ids: canaryUsers,
          duration_hours: 24 
        },
        status: 'canary',
        risk_score: 10
      });

      await supabase.from('ai_self_improve_log').insert({
        tenant_id: null,
        change_type: 'policy_weight',
        before,
        after,
        rationale: `Avg rating ${avg.toFixed(2)} < 4; boosting quality (canary: ${canarySize} users)`
      });

      console.log(`[Self-Improve] Canary deployment to ${canarySize} users`);
    }

    return new Response(
      JSON.stringify({ ok: true, avg_rating: avg }),
      { headers: { ...CORS, 'Content-Type': 'application/json' } }
    );
  } catch (e: any) {
    return new Response(
      JSON.stringify({ error: String(e?.message || e) }),
      { status: 500, headers: { ...CORS, 'Content-Type': 'application/json' } }
    );
  }
});
