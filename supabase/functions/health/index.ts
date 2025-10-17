/**
 * Health Check Endpoint
 * Returns 200 if DB latency < 500ms, 503 otherwise
 * Production-grade monitoring with timing
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const t0 = performance.now();

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Quick health check query
    const { error: dbError } = await supabase
      .from('profiles')
      .select('id')
      .limit(1);

    const latencyMs = Math.round(performance.now() - t0);
    const isHealthy = !dbError && latencyMs < 500;

    const health = {
      ok: isHealthy,
      latency_ms: latencyMs,
      db_status: dbError ? 'error' : 'up',
      redis: Deno.env.get('REDIS_URL') ? 'configured' : 'not_configured',
      timestamp: new Date().toISOString(),
      environment: Deno.env.get('ENVIRONMENT') || 'production',
      version: Deno.env.get('COMMIT_SHA') || 'dev',
    };

    return new Response(JSON.stringify(health), {
      status: isHealthy ? 200 : 503,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store',
      },
    });
  } catch (error) {
    const latencyMs = Math.round(performance.now() - t0);
    return new Response(
      JSON.stringify({
        ok: false,
        latency_ms: latencyMs,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      }),
      {
        status: 503,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
