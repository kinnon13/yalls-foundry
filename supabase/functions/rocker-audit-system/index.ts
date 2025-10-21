import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.0";
import { createLogger } from "../_shared/logger.ts";
import { ai } from "../_shared/ai.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * System Audit Function - Step 1 of Proactive AI Implementation
 * Tests all core Rocker functionality: chat, memory, embeddings, analysis
 */
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const log = createLogger('rocker-audit-system');
  log.startTimer();

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const results = {
      timestamp: new Date().toISOString(),
      userId: user.id,
      tests: {} as Record<string, { status: 'pass' | 'fail'; message: string; duration?: number }>,
    };

    // Test 1: AI Chat
    try {
      const start = Date.now();
      const { text } = await ai.chat({
        role: 'user',
        messages: [{ role: 'user', content: 'Say "test OK"' }],
        maxTokens: 20
      });
      results.tests.ai_chat = {
        status: text.toLowerCase().includes('ok') ? 'pass' : 'fail',
        message: `AI responded: ${text.slice(0, 50)}`,
        duration: Date.now() - start
      };
    } catch (e) {
      results.tests.ai_chat = {
        status: 'fail',
        message: `Error: ${e instanceof Error ? e.message : 'Unknown'}`
      };
    }

    // Test 2: Embedding Generation
    try {
      const start = Date.now();
      const vectors = await ai.embed('user', ['test embedding']);
      results.tests.embeddings = {
        status: vectors && vectors.length > 0 && vectors[0].length > 0 ? 'pass' : 'fail',
        message: `Generated ${vectors[0]?.length || 0} dimensions`,
        duration: Date.now() - start
      };
    } catch (e) {
      results.tests.embeddings = {
        status: 'fail',
        message: `Error: ${e instanceof Error ? e.message : 'Unknown'}`
      };
    }

    // Test 3: Memory Write
    try {
      const start = Date.now();
      const { error } = await supabaseClient.from('ai_user_memory').upsert({
        user_id: user.id,
        tenant_id: user.id,
        type: 'note',
        key: 'system_audit_test',
        value: { test: true, timestamp: new Date().toISOString() },
        confidence: 1.0,
        source: 'audit',
        scope: 'user',
        tags: ['system_test']
      }, { onConflict: 'tenant_id,user_id,key' });
      
      results.tests.memory_write = {
        status: error ? 'fail' : 'pass',
        message: error ? error.message : 'Memory written successfully',
        duration: Date.now() - start
      };
    } catch (e) {
      results.tests.memory_write = {
        status: 'fail',
        message: `Error: ${e instanceof Error ? e.message : 'Unknown'}`
      };
    }

    // Test 4: Memory Read
    try {
      const start = Date.now();
      const { data, error } = await supabaseClient
        .from('ai_user_memory')
        .select('*')
        .eq('user_id', user.id)
        .limit(5);
      
      results.tests.memory_read = {
        status: error ? 'fail' : 'pass',
        message: error ? error.message : `Retrieved ${data?.length || 0} memories`,
        duration: Date.now() - start
      };
    } catch (e) {
      results.tests.memory_read = {
        status: 'fail',
        message: `Error: ${e instanceof Error ? e.message : 'Unknown'}`
      };
    }

    // Test 5: Thread/Message Storage
    try {
      const start = Date.now();
      const { data: thread, error: threadErr } = await supabaseClient
        .from('rocker_threads')
        .select('id')
        .eq('user_id', user.id)
        .limit(1)
        .maybeSingle();
      
      const { data: messages, error: msgErr } = await supabaseClient
        .from('rocker_messages')
        .select('count')
        .eq('user_id', user.id);
      
      results.tests.message_storage = {
        status: !threadErr && !msgErr ? 'pass' : 'fail',
        message: `Found thread: ${!!thread}, Messages: ${messages?.[0]?.count || 0}`,
        duration: Date.now() - start
      };
    } catch (e) {
      results.tests.message_storage = {
        status: 'fail',
        message: `Error: ${e instanceof Error ? e.message : 'Unknown'}`
      };
    }

    // Overall Status
    const failedTests = Object.values(results.tests).filter(t => t.status === 'fail');
    const overallStatus = failedTests.length === 0 ? 'healthy' : 'degraded';

    log.info(`[Audit] Complete - Status: ${overallStatus}, Failed: ${failedTests.length}/${Object.keys(results.tests).length}`);

    return new Response(
      JSON.stringify({ 
        status: overallStatus,
        results,
        summary: {
          total: Object.keys(results.tests).length,
          passed: Object.values(results.tests).filter(t => t.status === 'pass').length,
          failed: failedTests.length
        }
      }), 
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    log.error('Audit failed', error);
    return new Response(
      JSON.stringify({ 
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
