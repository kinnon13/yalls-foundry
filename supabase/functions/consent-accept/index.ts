import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { withRateLimit, getTenantFromJWT } from "../_shared/rate-limit-wrapper.ts";
import { createLogger } from "../_shared/logger.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const GLOBAL_TENANT = '00000000-0000-0000-0000-000000000000';

serve(async (req) => {
  const log = createLogger('consent-accept');
  log.startTimer();
  
  // Rate limiting for auth function
  const limited = await withRateLimit(req, 'consent-accept', { burst: 10, perMin: 100 });
  if (limited) return limited;
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

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

    const {
      policy_version,
      sms_opt_in = false,
      email_opt_in = false,
      push_opt_in = false,
      proactive_enabled = false,
      scopes = []
    } = await req.json();

    const tenantId = getTenantFromJWT(req) || user.id;
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip');
    const userAgent = req.headers.get('user-agent');

    log.info('Accepting consent', { user_id: user.id, tenant_id: tenantId });

    // Upsert consent
    const { error: consentError } = await supabaseClient
      .from('ai_user_consent')
      .upsert({
        tenant_id: tenantId,
        user_id: user.id,
        site_opt_in: true,
        policy_version,
        consented_at: new Date().toISOString(),
        ip,
        user_agent: userAgent,
        sms_opt_in,
        email_opt_in,
        push_opt_in,
        proactive_enabled,
        scopes,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'tenant_id,user_id'
      });

    if (consentError) {
      throw consentError;
    }

    // Audit log
    await supabaseClient.rpc('audit_write', {
      p_actor: user.id,
      p_role: 'user',
      p_tenant: tenantId,
      p_action: 'consent.accept',
      p_scope: 'site',
      p_targets: [],
      p_meta: { policy_version, sms_opt_in, email_opt_in, push_opt_in }
    });

    return new Response(
      JSON.stringify({ ok: true }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    log.error('Consent accept failed', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});