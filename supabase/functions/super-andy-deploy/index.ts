// Super Andy → Admin Rocker Config Push
// Publishes new model parameters, policy updates, or system configurations

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ConfigPush {
  config_type: 'policy' | 'model_params' | 'throttle_rules' | 'feature_flags';
  target: 'admin_rocker' | 'user_rocker' | 'platform';
  payload: Record<string, any>;
  version: string;
  rollback_safe?: boolean;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Service role auth (Super Andy internal only)
    const authHeader = req.headers.get('Authorization');
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!authHeader?.includes(serviceKey || '')) {
      return new Response('Unauthorized - Super Andy service key required', { 
        status: 401, 
        headers: corsHeaders 
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      serviceKey!
    );

    const { config_type, target, payload, version, rollback_safe = true } = await req.json() as ConfigPush;

    console.log('[Andy→Admin] Deploying config:', { config_type, target, version });

    // Store the new config
    const { data: config, error: configError } = await supabase
      .from('ai_config_versions')
      .insert({
        config_type,
        target,
        payload,
        version,
        deployed_at: new Date().toISOString(),
        deployed_by: 'super_andy',
        rollback_safe,
      })
      .select()
      .single();

    if (configError) throw configError;

    // Update active config pointer
    await supabase
      .from('ai_active_configs')
      .upsert({
        target,
        config_type,
        active_version: version,
        config_id: config.id,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'target,config_type',
      });

    // Notify Admin Rocker instances
    await supabase
      .from('ai_events')
      .insert({
        event_type: 'config_deployed',
        agent: 'super_andy',
        payload: {
          config_type,
          target,
          version,
          config_id: config.id,
        },
      });

    // Log in action ledger
    await supabase.from('ai_action_ledger').insert({
      tenant_id: 'platform',
      agent: 'super_andy',
      action: 'deploy_config',
      input: { config_type, target, version },
      output: { config_id: config.id },
      result: 'success',
    });

    console.log('[Andy→Admin] Config deployed successfully:', config.id);

    return new Response(
      JSON.stringify({ 
        success: true, 
        config_id: config.id,
        version,
        deployed_at: config.deployed_at,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[Andy→Admin] Deployment error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
