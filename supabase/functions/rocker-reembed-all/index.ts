import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.0";
import { createLogger } from "../_shared/logger.ts";

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Re-embed ALL files and analyze them for memory extraction
 */
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const log = createLogger('rocker-reembed-all');
  log.startTimer();

  try {
    const sb = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } });

    const { userId } = await req.json();

    if (!userId) {
      return new Response(JSON.stringify({ error: 'userId required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get all files for user
    const { data: files, error: filesErr } = await sb
      .from('rocker_knowledge')
      .select('id')
      .eq('user_id', userId);

    if (filesErr) throw filesErr;

    log.info(`[Reembed] Found ${files?.length || 0} files for user ${userId}`);

    // Clear old embedding jobs
    await sb
      .from('embedding_jobs')
      .delete()
      .eq('user_id', userId);

    // Create new embedding jobs for all files
    const jobs = (files || []).map(f => ({
      knowledge_id: f.id,
      user_id: userId,
      status: 'pending'
    }));

    if (jobs.length > 0) {
      const { error: jobsErr } = await sb
        .from('embedding_jobs')
        .insert(jobs);

      if (jobsErr) {
        log.error('[Reembed] Failed to create jobs', jobsErr);
        throw jobsErr;
      }
    }

    log.info(`[Reembed] Created ${jobs.length} embedding jobs`);

    // Trigger deep analysis to extract insights
    log.info('[Reembed] Triggering deep analysis...');
    
    const { data: analysisData, error: analysisErr } = await sb.functions.invoke('rocker-deep-analyze', {
      body: { 
        user_id: userId,
        scope: 'all'
      }
    });

    if (analysisErr) {
      log.error('[Reembed] Deep analysis failed', analysisErr);
    } else {
      log.info('[Reembed] Deep analysis complete', analysisData);
    }

    return new Response(
      JSON.stringify({
        success: true,
        files_count: files?.length || 0,
        jobs_created: jobs.length,
        analysis: analysisData || null,
        message: 'Re-embedding and analysis triggered. Embeddings will process over next few minutes.'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    log.error('[Reembed] Failed', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
