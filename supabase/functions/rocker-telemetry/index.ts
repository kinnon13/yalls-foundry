import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { withRateLimit } from "../_shared/rate-limit-wrapper.ts";
import { createLogger } from "../_shared/logger.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  const log = createLogger('rocker-telemetry');

  // Rate limit and CORS preflight
  const limited = await withRateLimit(req, 'rocker-telemetry', { burst: 60, perMin: 600 });
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

    // Require an authenticated user (prevents spoofing user_id)
    const token = req.headers.get('Authorization')?.replace('Bearer ', '') ?? '';
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json();
    const {
      user_id,
      route,
      action,
      target,
      success,
      message,
      session_id,
      actor_role,
      meta,
    } = body ?? {};

    if (!route || !action || !target || typeof success !== 'boolean') {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Enforce user scope to authenticated caller
    const safeUserId = user.id;

    const insertPayload = {
      user_id: safeUserId,
      route,
      target,
      action,
      success,
      message: message ? String(message).slice(0, 1000) : null,
      session_id: session_id ?? null,
      kind: 'telemetry',
      payload: {},
      meta: {
        ...(meta || {}),
        actor_role: actor_role || 'user',
      },
    } as const;

    const { error } = await supabase.from('ai_feedback').insert(insertPayload);
    if (error) throw error;

    log.info('Logged telemetry', { user_id: safeUserId, route, action, target, success });

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : (typeof error === 'object' ? JSON.stringify(error) : String(error));
    log.error('Telemetry error', { error: msg, stack: error instanceof Error ? error.stack : undefined });
    return new Response(JSON.stringify({ ok: false, error: msg }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
