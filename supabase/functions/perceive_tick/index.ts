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

    // Check global pause flag
    const { data: flags } = await supabase
      .from('ai_control_flags' as any)
      .select('*')
      .single();
    
    if (flags?.global_pause) {
      return new Response(
        JSON.stringify({ paused: true }),
        { status: 202, headers: { ...CORS, 'Content-Type': 'application/json' } }
      );
    }

    // Pull tenants with heavy goal load using RPC
    const { data: tenants } = await supabase
      .rpc('distinct_tenants_with_active_goals');

    // Monitor queues and incidents
    const { count: dlq } = await supabase
      .from('ai_job_dlq' as any)
      .select('*', { count: 'exact', head: true });

    const { count: openIncidents } = await supabase
      .from('ai_incidents' as any)
      .select('*', { count: 'exact', head: true })
      .is('resolved_at', null);

    // Create suggestions with richer context
    for (const t of (tenants || [])) {
      await supabase.from('ai_proactive_suggestions' as any).insert({
        tenant_id: t.tenant_id,
        category: 'ops/productivity',
        title: 'Backlog consolidation',
        summary: `You have ${t.active_count} active goals; DLQ=${dlq || 0}, open incidents=${openIncidents || 0}. Propose consolidation & schedule.`,
        plan: {
          steps: ['cluster_goals', 'schedule_block', 'auto-reminders'],
          signals: { dlq, openIncidents }
        },
        confidence: 75
      });
    }

    return new Response(
      JSON.stringify({ ok: true, suggestions: (tenants || []).length }),
      { headers: { ...CORS, 'Content-Type': 'application/json' } }
    );
  } catch (e: any) {
    return new Response(
      JSON.stringify({ error: String(e?.message || e) }),
      { status: 500, headers: { ...CORS, 'Content-Type': 'application/json' } }
    );
  }
});
