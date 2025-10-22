/**
 * Circuit Breaker Tick
 * Evaluates API/topic breakers, enforces budget limits, clamps pools on DLQ overflow
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Best+10% thresholds
const DLQ_CRITICAL = 250;
const QUEUE_DEPTH_WARN = 500;
const BUDGET_SOFT_PCT = 0.85;
const BUDGET_HARD_PCT = 0.95;
const CLAMP_FACTOR = 0.60;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // 1) Evaluate breakers
    const apiEval = await supabase.rpc('evaluate_api_breakers');
    const topicEval = await supabase.rpc('evaluate_topic_breakers');

    const apiRows = apiEval.data ?? [];
    const topicRows = topicEval.data ?? [];

    // 2) Stats
    const { count: dlqCount } = await supabase
      .from('ai_job_dlq')
      .select('*', { count: 'exact', head: true });

    const { data: pools } = await supabase
      .from('ai_worker_pools')
      .select('*');

    const { data: budget } = await supabase
      .from('ai_model_budget')
      .select('*')
      .is('tenant_id', null)
      .maybeSingle();

    const spent = budget?.spent_cents ?? 0;
    const limit = budget?.limit_cents ?? 20000;
    const pct = limit > 0 ? spent / limit : 0;

    // 3) Budget breakers
    if (pct >= BUDGET_HARD_PCT) {
      await supabase
        .from('ai_control_flags')
        .update({ external_calls_enabled: false, updated_at: new Date().toISOString() })
        .eq('id', '00000000-0000-0000-0000-000000000001');

      await supabase.from('ai_incidents').insert({
        tenant_id: null,
        severity: 'high',
        source: 'circuit_breaker',
        summary: `Budget hard threshold reached (${Math.round(pct * 100)}%)`,
        detail: { spent, limit },
      });
    } else if (pct >= BUDGET_SOFT_PCT) {
      await supabase
        .from('ai_model_routes')
        .update({ preferred_model: 'grok-2', fallback_model: 'grok-mini' })
        .is('tenant_id', null)
        .in('task_class', ['mdr.generate', 'vision.analyze']);
    }

    // 4) DLQ breaker
    if ((dlqCount ?? 0) >= DLQ_CRITICAL) {
      await supabase.from('ai_incidents').insert({
        tenant_id: null,
        severity: 'high',
        source: 'circuit_breaker',
        summary: `DLQ overflow: ${dlqCount}`,
        detail: { threshold: DLQ_CRITICAL },
      });

      for (const p of pools ?? []) {
        const clamped = Math.max(1, Math.floor(p.current_concurrency * CLAMP_FACTOR));
        await supabase
          .from('ai_worker_pools')
          .update({ current_concurrency: clamped })
          .eq('pool', p.pool);
      }
    }

    // 5) Topic breaker
    const trippedTopics = (topicRows as any[]).filter((r) => r.state === 'open').map((r) => r.topic);
    if (trippedTopics.length > 0) {
      for (const topic of trippedTopics) {
        await supabase
          .from('ai_jobs')
          .update({ status: 'queued', not_before: new Date(Date.now() + 60_000).toISOString() })
          .eq('topic', topic)
          .eq('status', 'running');
      }
    }

    console.log('[Circuit Breaker] Evaluated', {
      apiBreakers: apiRows.length,
      topicBreakers: topicRows.length,
      budgetPct: Math.round(pct * 100),
      dlqCount,
    });

    return new Response(
      JSON.stringify({
        ok: true,
        api_breakers: apiRows,
        topic_breakers: topicRows,
        budget: { spent, limit, pct },
        dlqCount,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[Circuit Breaker] Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
