/**
 * Health Check Endpoint
 * Returns system status for monitoring
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

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    // Check DB connection
    const { error: dbError } = await supabase
      .from('profiles')
      .select('id')
      .limit(1);

    const health = {
      ok: !dbError,
      db: dbError ? 'down' : 'up',
      redis: Deno.env.get('REDIS_URL') ? 'configured' : 'not_configured',
      time: new Date().toISOString(),
      version: Deno.env.get('COMMIT_SHA') || 'dev',
    };

    return new Response(JSON.stringify(health), {
      status: health.ok ? 200 : 503,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        ok: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        time: new Date().toISOString(),
      }),
      {
        status: 503,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
