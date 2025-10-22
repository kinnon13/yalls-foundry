// deno-lint-ignore-file no-explicit-any
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

const MAX_AGENTS = 5;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS });

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );
    
    const { tenantId, taskId, context } = await req.json();

    const { data: flags } = await supabase.from('ai_control_flags' as any).select('*').single();
    if (flags?.global_pause) {
      return new Response(JSON.stringify({ paused: true, reason: 'global_pause' }), 
        { status: 202, headers: { ...CORS, 'Content-Type': 'application/json' } });
    }

    const agents = [
      { name: 'gap_finder', topic: 'research.gap_find', pool: 'realtime' },
      { name: 'verifier', topic: 'verify.plan', pool: 'realtime' },
      { name: 'executor', topic: 'execute.plan', pool: 'realtime' },
    ];

    const bounded = agents.slice(0, MAX_AGENTS);
    for (const a of bounded) {
      await supabase.from('ai_jobs' as any).insert({
        tenant_id: tenantId, pool: a.pool, topic: a.topic, status: 'queued', priority: 5,
        payload: { taskId, context, agent: a.name }
      });
    }

    await supabase.from('ai_subagent_runs' as any).insert({
      tenant_id: tenantId, task_id: taskId, agent_name: 'orchestrator',
      input: { context }, output: { queued_agents: bounded.map(x => x.name) }, success: true
    });

    await supabase.from('ai_action_ledger' as any).insert({
      tenant_id: tenantId, topic: 'orchestrate.spawn', payload: { taskId, agents: bounded.map(a => a.name) }
    });

    return new Response(JSON.stringify({ ok: true, agents: bounded.map(a => a.name) }),
      { headers: { ...CORS, 'Content-Type': 'application/json' } });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: String(e?.message || e) }),
      { status: 500, headers: { ...CORS, 'Content-Type': 'application/json' } });
  }
});
