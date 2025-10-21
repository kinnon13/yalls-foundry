import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { withRateLimit } from "../_shared/rate-limit-wrapper.ts";
import { createLogger } from "../_shared/logger.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  const log = createLogger('admin-learning');

  // Rate limit and CORS preflight
  const limited = await withRateLimit(req, 'admin-learning', { burst: 30, perMin: 120 });
  if (limited) return limited;
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } } }
    );

    // Require super admin user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      log.warn('Unauthorized access attempt');
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Verify super admin using RPC is_super_admin(user_id)
    const { data: isSuperAdmin, error: adminErr } = await supabase.rpc('is_super_admin', { _user_id: user.id });
    if (adminErr) {
      log.error('Super admin check failed', { error: adminErr });
      return new Response(JSON.stringify({ error: 'Admin verification failed' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    if (!isSuperAdmin) {
      log.warn('Non-super-admin access attempt', { userId: user.id });
      return new Response(JSON.stringify({ error: 'Forbidden: Super admin required' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    log.info('Super admin authenticated', { userId: user.id });

    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

    // Recent outcomes (7 days for learning dashboard)
    const { data: recent, error: recentErr } = await supabase
      .from('ai_feedback')
      .select('*')
      .gte('created_at', weekAgo)
      .order('created_at', { ascending: false })
      .limit(500);
    if (recentErr) throw recentErr;

    // Weekly outcomes (same as recent for now)
    const week = recent;

    // Selector memory
    const { data: selectors, error: selErr } = await supabase
      .from('ai_selector_memory')
      .select('*')
      .order('last_attempt_at', { ascending: false })
      .limit(500);
    if (selErr) throw selErr;

    const failures = (recent || []).filter((r: any) => (r.success === false) && (!r.kind || r.kind === 'telemetry' || r.kind === 'dom_action'));

    // Audit the access
    await supabase.from('admin_audit').insert({
      admin_id: user.id,
      action: 'learning_admin_fetch',
      target: 'learning_dashboard',
      reason: 'Admin fetched learning dashboard data',
      metadata: { weekAgo }
    });

    return new Response(JSON.stringify({
      recent,
      week,
      selectors,
      failures
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error) {
    const msg = error instanceof Error ? error.message : (typeof error === 'object' ? JSON.stringify(error) : String(error));
    log.error('Admin learning error', { error: msg });
    return new Response(JSON.stringify({ error: msg }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});