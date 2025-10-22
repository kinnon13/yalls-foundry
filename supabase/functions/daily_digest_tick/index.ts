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

    // Summarize yesterday goals & suggestions per tenant
    const { data: tenants } = await supabase
      .from('ai_goals' as any)
      .select('tenant_id')
      .not('tenant_id', 'is', null);
    
    const uniq = Array.from(new Set((tenants || []).map((t: any) => t.tenant_id)));

    const today = new Date().toISOString().slice(0, 10);
    
    for (const t of uniq) {
      const { count: completed } = await supabase
        .from('ai_goals' as any)
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', t)
        .eq('status', 'completed')
        .gte('completed_at', `${today}T00:00:00`);

      const { data: sugg } = await supabase
        .from('ai_proactive_suggestions' as any)
        .select('*')
        .eq('tenant_id', t)
        .gte('created_at', `${today}T00:00:00`);

      await supabase
        .from('ai_daily_reports' as any)
        .upsert(
          {
            tenant_id: t,
            report_date: today,
            summary: `Completed ${completed || 0} goals. ${(sugg || []).length} new suggestions.`,
            goals_completed: completed || 0,
            tasks_active: undefined,
            insights: { suggestions: (sugg || []).map((s: any) => ({ id: s.id, title: s.title })) }
          },
          { onConflict: 'tenant_id,report_date' }
        );
    }

    return new Response(
      JSON.stringify({ ok: true, tenants: uniq.length }),
      { headers: { ...CORS, 'Content-Type': 'application/json' } }
    );
  } catch (e: any) {
    return new Response(
      JSON.stringify({ error: String(e?.message || e) }),
      { status: 500, headers: { ...CORS, 'Content-Type': 'application/json' } }
    );
  }
});
