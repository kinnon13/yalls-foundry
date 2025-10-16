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

    // Require admin user
    const token = req.headers.get('Authorization')?.replace('Bearer ', '') ?? '';
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Verify admin using RPC is_admin(user_id)
    const { data: isAdmin, error: adminErr } = await supabase.rpc('is_admin', { _user_id: user.id });
    if (adminErr || !isAdmin) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const now = new Date();
    const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

    // Recent outcomes (24h)
    const { data: recent, error: recentErr } = await supabase
      .from('ai_feedback')
      .select('*')
      .gte('created_at', dayAgo)
      .order('created_at', { ascending: false })
      .limit(500);
    if (recentErr) throw recentErr;

    // Weekly outcomes (7d)
    const { data: week, error: weekErr } = await supabase
      .from('ai_feedback')
      .select('*')
      .gte('created_at', weekAgo)
      .order('created_at', { ascending: false })
      .limit(2000);
    if (weekErr) throw weekErr;

    // Selector memory
    const { data: selectors, error: selErr } = await supabase
      .from('ai_selector_memory')
      .select('*')
      .order('last_attempt_at', { ascending: false })
      .limit(500);
    if (selErr) throw selErr;

    // Audit the access
    await supabase.from('admin_audit').insert({
      admin_id: user.id,
      action: 'learning_admin_fetch',
      target: 'learning_dashboard',
      reason: 'Admin fetched learning dashboard data',
      metadata: { dayAgo, weekAgo }
    });

    return new Response(JSON.stringify({
      recent,
      week,
      selectors,
      failures: (recent || []).filter((r: any) => r.kind === 'dom_action' && r.success === false)
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error) {
    const msg = error instanceof Error ? error.message : (typeof error === 'object' ? JSON.stringify(error) : String(error));
    log.error('Admin learning error', { error: msg });
    return new Response(JSON.stringify({ error: msg }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});