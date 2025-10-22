/**
 * CTM Daily Report Generator
 * Creates daily summary of goals, tasks, and progress
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const today = new Date().toISOString().split('T')[0];

    // Get all active tenants with goals
    const { data: tenants } = await supabase
      .from('ai_goals')
      .select('tenant_id')
      .not('tenant_id', 'is', null);

    const uniqueTenants = [...new Set(tenants?.map(t => t.tenant_id) || [])];

    for (const tenantId of uniqueTenants) {
      // Count completed goals today
      const { count: completed } = await supabase
        .from('ai_goals')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', tenantId)
        .eq('status', 'completed')
        .gte('completed_at', `${today}T00:00:00`);

      // Count active tasks
      const { count: active } = await supabase
        .from('ai_goals')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', tenantId)
        .eq('status', 'active');

      // Generate summary
      const summary = `Completed ${completed || 0} goals today. ${active || 0} tasks remain active.`;

      // Upsert daily report
      await supabase
        .from('ai_daily_reports')
        .upsert({
          tenant_id: tenantId,
          report_date: today,
          summary,
          goals_completed: completed || 0,
          tasks_active: active || 0,
          insights: {
            velocity: completed || 0,
            backlog: active || 0,
          },
        }, {
          onConflict: 'tenant_id,report_date',
        });
    }

    console.log(`[CTM Daily Report] Generated for ${uniqueTenants.length} tenants`);

    return new Response(JSON.stringify({ 
      generated: uniqueTenants.length,
      date: today 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[CTM Daily Report] Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
