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

    // Example: find tenants with many open items and suggest consolidation
    const { data: suggestions } = await supabase
      .from('ai_proactive_suggestions')
      .select('tenant_id')
      .eq('status', 'proposed')
      .limit(1);

    // Toy signal: create a suggestion if none exist yet
    if (!suggestions || suggestions.length === 0) {
      await supabase.from('ai_proactive_suggestions').insert({
        tenant_id: null,
        user_id: null,
        category: 'ops',
        title: 'Review system health',
        summary: 'Periodic health check and optimization suggestions.',
        plan: { task: 'ops.health_check', steps: ['analyze_metrics', 'suggest_improvements'] },
        confidence: 75
      });
    }

    return new Response(
      JSON.stringify({ ok: true, suggestions: 1 }),
      { headers: { ...CORS, 'Content-Type': 'application/json' } }
    );
  } catch (e: any) {
    return new Response(
      JSON.stringify({ error: String(e?.message || e) }),
      { status: 500, headers: { ...CORS, 'Content-Type': 'application/json' } }
    );
  }
});
