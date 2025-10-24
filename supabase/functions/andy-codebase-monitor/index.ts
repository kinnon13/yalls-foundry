import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Real-time codebase monitor webhook for Super Andy
 * Triggers on every code change to analyze and learn continuously
 */
serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  try {
    const { file_path, change_type, content, user_id } = await req.json();
    
    console.log('[Andy Monitor] Code change detected:', { file_path, change_type, user_id });

    // 1. Ingest the changed file into knowledge base
    if (content && file_path) {
      const { error: kbError } = await supabase.from('rocker_knowledge').insert({
        user_id: user_id || (await supabase.auth.admin.listUsers()).data.users[0]?.id,
        content: `File: ${file_path}\nChange: ${change_type}\n\n${content}`,
        chunk_summary: `Code change in ${file_path}`,
        meta: {
          category: 'code_change',
          file_path,
          change_type,
          monitored_at: new Date().toISOString(),
          source: 'real_time_monitor'
        }
      });
      
      if (kbError) console.warn('[Andy Monitor] KB insert failed:', kbError);
    }

    // 2. Trigger Andy's analysis functions
    const triggers = [
      supabase.functions.invoke('andy-learn-from-message', {
        body: { 
          message: `Code changed: ${file_path}`,
          content: content?.substring(0, 1000)
        }
      }),
      supabase.functions.invoke('andy-expand-memory', {
        body: { user_id }
      }),
      supabase.functions.invoke('ingest-codebase', {
        headers: { Authorization: req.headers.get('Authorization') || '' }
      })
    ];

    await Promise.allSettled(triggers);

    // 3. Log the monitoring event
    await supabase.from('ai_action_ledger').insert({
      agent: 'super_andy',
      action: 'codebase_monitor',
      input: { file_path, change_type },
      output: { triggered: true },
      result: 'success'
    });

    return new Response(JSON.stringify({ 
      ok: true,
      message: `Andy monitoring ${file_path}`,
      triggered_functions: ['andy-learn-from-message', 'andy-expand-memory', 'ingest-codebase']
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (e: any) {
    console.error('[Andy Monitor] Error:', e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
