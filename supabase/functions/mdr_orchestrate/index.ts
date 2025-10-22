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
    
    const { tenantId, taskId, context } = await req.json();

    // Minimal "three sub-agents" plan: gap_finder → verifier → executor
    const agents = [
      { name: 'gap_finder', topic: 'research.gap_find' },
      { name: 'verifier', topic: 'verify.plan' },
      { name: 'executor', topic: 'execute.plan' },
    ];

    for (const a of agents) {
      await supabase.from('ai_jobs').insert({
        tenant_id: tenantId,
        pool: 'realtime',
        topic: a.topic,
        status: 'queued',
        payload: { taskId, context, agent: a.name }
      });
    }

    // record orchestration "seed" run
    await supabase.from('ai_subagent_runs').insert({
      tenant_id: tenantId,
      task_id: taskId,
      agent_name: 'orchestrator',
      input: { context },
      output: { queued_agents: agents.map(x => x.name) },
      success: true
    });

    return new Response(
      JSON.stringify({ ok: true, agents: agents.map(a => a.name) }),
      { headers: { ...CORS, 'Content-Type': 'application/json' } }
    );
  } catch (e: any) {
    return new Response(
      JSON.stringify({ error: String(e?.message || e) }),
      { status: 500, headers: { ...CORS, 'Content-Type': 'application/json' } }
    );
  }
});
