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
    
    const { tenantId, taskClass = 'generic', complexity = 'medium' } = await req.json();

    // pull route & budget
    const { data: route } = await supabase
      .from('ai_model_routes')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('task_class', taskClass)
      .maybeSingle();

    const { data: budget } = await supabase
      .from('ai_model_budget')
      .select('*')
      .eq('tenant_id', tenantId)
      .maybeSingle();

    // simple policy: if budget near cap, downgrade to fallback/economy
    const nearCap = budget && budget.spent_cents > 0.9 * budget.limit_cents;
    const model = nearCap
      ? (route?.fallback_model || 'google/gemini-2.5-flash-lite')
      : (route?.preferred_model || 'google/gemini-2.5-flash');

    return new Response(
      JSON.stringify({
        model,
        maxTokens: route?.max_tokens ?? 4096,
        temperature: route?.temperature ?? 0.3
      }),
      { headers: { ...CORS, 'Content-Type': 'application/json' } }
    );
  } catch (e: any) {
    return new Response(
      JSON.stringify({ error: String(e?.message || e) }),
      { status: 500, headers: { ...CORS, 'Content-Type': 'application/json' } }
    );
  }
});
