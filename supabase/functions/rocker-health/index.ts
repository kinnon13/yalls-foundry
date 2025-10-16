import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.0";
import { withRateLimit, RateLimits } from "../_shared/rate-limit-wrapper.ts";
import { createLogger } from "../_shared/logger.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const limited = await withRateLimit(req, 'rocker-health', RateLimits.high);
  if (limited) return limited;

  const log = createLogger('rocker-health');
  log.startTimer();

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const health = {
      env: {
        openai: !!Deno.env.get('OPENAI_API_KEY') ? 'ok' : 'missing',
        supabase: !!Deno.env.get('SUPABASE_URL') ? 'ok' : 'missing',
      },
      migrations: 'ok',
      prompts_registered: [
        'rocker.voice.greeting.v1',
        'rocker.vision.classify.v1',
        'rocker.events.builder.v1',
        'rocker.recall.v1',
        'rocker.memory.v1',
        'rocker.proactive.v1',
        'rocker.admin.v1'
      ],
      tools_loaded: [
        'get_user_profile',
        'search_user_memory',
        'write_memory',
        'search_entities',
        'save_post',
        'reshare_post',
        'recall_content',
        'create_event'
      ],
      triggers_loaded: 0,
      version: 'rocker@1.0.0'
    };

    // Check if key tables exist
    try {
      const { error: profilesError } = await supabaseClient
        .from('profiles')
        .select('count')
        .limit(1);
      
      const { error: memoryError } = await supabaseClient
        .from('ai_user_memory')
        .select('count')
        .limit(1);
      
      const { error: sessionsError } = await supabaseClient
        .from('ai_sessions')
        .select('count')
        .limit(1);

      if (profilesError || memoryError || sessionsError) {
        health.migrations = 'error';
      }

      // Count triggers
      const { data: triggers } = await supabaseClient
        .from('ai_triggers')
        .select('count', { count: 'exact', head: true });
      
      health.triggers_loaded = triggers?.length || 0;
    } catch (err) {
      log.error('Health check error', err);
      health.migrations = 'partial';
    }

    return new Response(
      JSON.stringify(health),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    log.error('Rocker health error', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
