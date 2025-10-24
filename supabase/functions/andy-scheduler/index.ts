/**
 * Andy Scheduler
 * Runs every minute to check for due brain tasks and execute iterations
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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('[andy-scheduler] Checking for due tasks...');

    const now = new Date().toISOString();

    // Find tasks that are due
    const { data: dueTasks, error } = await supabase
      .from('brain_tasks')
      .select('*')
      .eq('status', 'scheduled')
      .lte('next_run_at', now)
      .limit(10);

    if (error) throw error;

    console.log('[andy-scheduler] Found', dueTasks?.length || 0, 'due tasks');

    if (dueTasks && dueTasks.length > 0) {
      for (const task of dueTasks) {
        // Invoke iteration function
        const { error: invokeError } = await supabase.functions.invoke('andy-iteration', {
          body: { task }
        });

        if (invokeError) {
          console.error('[andy-scheduler] Error invoking iteration:', invokeError);
        } else {
          console.log('[andy-scheduler] Triggered iteration for task:', task.id);
        }
      }
    }

    return new Response(JSON.stringify({
      success: true,
      processed: dueTasks?.length || 0
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[andy-scheduler] Error:', error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
