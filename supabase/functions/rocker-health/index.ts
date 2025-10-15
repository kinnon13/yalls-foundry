import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface HealthCheck {
  status: 'healthy' | 'degraded' | 'unhealthy';
  version: string;
  timestamp: string;
  checks: {
    env: Record<string, 'ok' | 'missing'>;
    db: {
      connected: boolean;
      tables: string[];
      missing_tables: string[];
    };
    functions: {
      total: number;
      registered: string[];
    };
  };
}

const REQUIRED_TABLES = [
  'profiles',
  'ai_sessions',
  'ai_user_consent',
  'ai_user_memory',
  'ai_global_knowledge',
  'media',
  'posts',
  'post_saves',
  'post_reshares',
  'user_shortcuts',
  'events'
];

const REQUIRED_ENV_VARS = [
  'SUPABASE_URL',
  'SUPABASE_ANON_KEY',
  'LOVABLE_API_KEY'
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    );

    const health: HealthCheck = {
      status: 'healthy',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      checks: {
        env: {},
        db: {
          connected: false,
          tables: [],
          missing_tables: []
        },
        functions: {
          total: 0,
          registered: []
        }
      }
    };

    // Check environment variables
    for (const envVar of REQUIRED_ENV_VARS) {
      health.checks.env[envVar] = Deno.env.get(envVar) ? 'ok' : 'missing';
      if (!Deno.env.get(envVar)) {
        health.status = 'degraded';
      }
    }

    // Check database connection and tables
    try {
      const tableChecks = await Promise.allSettled(
        REQUIRED_TABLES.map(async (table) => {
          const { error } = await supabaseClient.from(table).select('*').limit(0);
          return { table, ok: !error };
        })
      );

      health.checks.db.connected = true;

      for (const result of tableChecks) {
        if (result.status === 'fulfilled' && result.value.ok) {
          health.checks.db.tables.push(result.value.table);
        } else if (result.status === 'fulfilled') {
          health.checks.db.missing_tables.push(result.value.table);
          health.status = 'unhealthy';
        }
      }
    } catch (error) {
      health.checks.db.connected = false;
      health.status = 'unhealthy';
    }

    // List available edge functions (from config)
    health.checks.functions.registered = [
      'rocker-chat',
      'rocker-memory',
      'rocker-admin',
      'rocker-proposals',
      'save-post',
      'unsave-post',
      'reshare-post',
      'recall-content',
      'upload-media',
      'generate-event-form',
      'consent-status',
      'consent-accept',
      'consent-revoke'
    ];
    health.checks.functions.total = health.checks.functions.registered.length;

    const statusCode = health.status === 'healthy' ? 200 : 
                       health.status === 'degraded' ? 200 : 503;

    return new Response(JSON.stringify(health, null, 2), {
      status: statusCode,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Health check error:', error);
    return new Response(JSON.stringify({ 
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 503,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
