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

  const log = createLogger('consent-status');
  log.startTimer();

  // Apply rate limiting
  const limited = await withRateLimit(req, 'consent-status', RateLimits.standard);
  if (limited) return limited;

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const tenantId = getTenantFromJWT(req) || user.id;

    // Get user consent
    const { data: consent } = await supabaseClient
      .from('ai_user_consent')
      .select('*')
      .eq('tenant_id', tenantId)
      .eq('user_id', user.id)
      .single();

    // Get required policy version
    const { data: policyConfig } = await supabaseClient
      .from('ai_policy_config')
      .select('required_policy_version')
      .eq('tenant_id', tenantId)
      .single();

    const requiredVersion = policyConfig?.required_policy_version || 'v1';
    const currentVersion = consent?.policy_version || null;
    const siteOptIn = consent?.site_opt_in || false;

    const needsConsent = !siteOptIn || currentVersion !== requiredVersion;

    return new Response(
      JSON.stringify({
        site_opt_in: siteOptIn,
        policy_version_current: currentVersion,
        policy_version_required: needsConsent ? requiredVersion : null,
        needs_consent: needsConsent,
        sms_opt_in: consent?.sms_opt_in || false,
        email_opt_in: consent?.email_opt_in || false,
        push_opt_in: consent?.push_opt_in || false,
        proactive_enabled: consent?.proactive_enabled || false
      }),
      {
        status: 200,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json',
          'Cache-Control': 'private, max-age=60'
        }
      }
    );
  } catch (error) {
    log.error('Consent status error', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});