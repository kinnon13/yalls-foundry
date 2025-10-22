/**
 * CTM Reminder Tick
 * Scans for due reminders and enqueues notification events
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
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
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const now = new Date().toISOString();

    // Find due reminders
    const { data: reminders, error } = await supabase
      .from('ai_reminders')
      .select('*')
      .lte('due_at', now)
      .is('sent_at', null)
      .limit(50);

    if (error) throw error;

    for (const reminder of reminders || []) {
      // Enqueue notification event
      await supabase.from('ai_events').insert({
        tenant_id: reminder.tenant_id,
        topic: 'notification.reminder',
        payload: {
          reminder_id: reminder.id,
          goal_id: reminder.goal_id,
          message: reminder.message,
        },
        status: 'new',
      });

      // Mark as sent
      await supabase
        .from('ai_reminders')
        .update({ sent_at: now })
        .eq('id', reminder.id);
    }

    console.log(`[CTM Reminder] Processed ${reminders?.length || 0} reminders`);

    return new Response(JSON.stringify({ 
      processed: reminders?.length || 0 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[CTM Reminder] Error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
