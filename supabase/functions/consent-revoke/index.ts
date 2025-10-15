import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createLogger } from "../_shared/logger.ts";
import { withRateLimit, RateLimits, getTenantFromJWT } from "../_shared/rate-limit-wrapper.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const log = createLogger('consent-revoke');
  log.startTimer();

  // Apply rate limiting
  const limited = await withRateLimit(req, 'consent-revoke', RateLimits.auth);
  if (limited) return limited;

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(
      req.headers.get('Authorization')?.replace('Bearer ', '') ?? ''
    );
    
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const tenantId = getTenantFromJWT(req) || user.id;

    // Update consent to revoked
    const { error: revokeError } = await supabaseClient
      .from('ai_user_consent')
      .update({
        site_opt_in: false,
        sms_opt_in: false,
        email_opt_in: false,
        push_opt_in: false,
        proactive_enabled: false,
        updated_at: new Date().toISOString()
      })
      .eq('tenant_id', tenantId)
      .eq('user_id', user.id);

    if (revokeError) {
      throw revokeError;
    }

    // Audit log
    await supabaseClient.rpc('audit_write', {
      p_actor: user.id,
      p_role: 'user',
      p_tenant: tenantId,
      p_action: 'consent.revoke',
      p_scope: 'site',
      p_targets: [],
      p_meta: { revoked_at: new Date().toISOString() }
    });

    return new Response(
      JSON.stringify({ ok: true, message: 'Consent revoked. Your account access is now disabled.' }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    log.error('Consent revoke error', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});