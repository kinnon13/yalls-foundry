// deno-lint-ignore-file no-explicit-any
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

const cache = new Map<string, { route: any; exp: number }>();
const TTL = 60000;

function key(tenantId: string | null, cls: string) {
  return `${tenantId || 'global'}::${cls}`;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS });

  try {
    const { tenantId, taskClass = 'generic', complexity = 'medium', requiredTokens = 1024 } = await req.json();
    
    const k = key(tenantId, taskClass);
    const hit = cache.get(k);
    if (hit && hit.exp > Date.now()) {
      return new Response(
        JSON.stringify(hit.route),
        { headers: { ...CORS, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Pull route & budget
    const { data: route } = await supabase
      .from('ai_model_routes' as any)
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('task_class', taskClass)
      .maybeSingle();

    const { data: budget } = await supabase
      .from('ai_model_budget' as any)
      .select('*')
      .eq('tenant_id', tenantId)
      .maybeSingle();

    let model = route?.preferred_model || 'google/gemini-2.5-flash';
    let downgraded = false;
    let downgrade_reason: string | undefined;

    // Check budget constraints
    const remaining = (budget?.limit_cents ?? 20000) - (budget?.spent_cents ?? 0);
    if (remaining < 500) {
      model = route?.fallback_model || 'google/gemini-2.5-flash-lite';
      downgraded = true;
      downgrade_reason = 'low_budget';
    }

    // Check token constraints
    if ((route?.max_tokens ?? 4096) < requiredTokens) {
      model = route?.fallback_model || 'google/gemini-2.5-flash-lite';
      downgraded = true;
      downgrade_reason = downgrade_reason
        ? `${downgrade_reason},max_tokens`
        : 'max_tokens';
    }

    const payload = {
      model,
      maxTokens: route?.max_tokens ?? 4096,
      temperature: route?.temperature ?? 0.3,
      downgraded,
      downgrade_reason
    };

    cache.set(k, { route: payload, exp: Date.now() + TTL });

    return new Response(
      JSON.stringify(payload),
      { headers: { ...CORS, 'Content-Type': 'application/json' } }
    );
  } catch (e: any) {
    return new Response(
      JSON.stringify({ error: String(e?.message || e) }),
      { status: 500, headers: { ...CORS, 'Content-Type': 'application/json' } }
    );
  }
});
