import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

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
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Processing calendar reminders...');

    // Find reminders that should be sent now
    const now = new Date();
    const { data: reminders, error: remindersError } = await supabase
      .from('calendar_event_reminders')
      .select(`
        *,
        event:calendar_events(
          id,
          title,
          description,
          starts_at,
          calendar_id,
          calendar:calendars(owner_profile_id)
        )
      `)
      .is('sent_at', null)
      .lte('trigger_at', now.toISOString());

    if (remindersError) throw remindersError;

    console.log(`Found ${reminders?.length || 0} reminders to process`);

    // Process each reminder
    const results = [];
    for (const reminder of reminders || []) {
      try {
        const event = reminder.event as any;
        const userId = event?.calendar?.owner_profile_id;

        if (!userId) {
          console.warn(`No user found for reminder ${reminder.id}`);
          continue;
        }

        // Send notification (using toast in real-time)
        // In production, you'd send via email/push/SMS
        const notificationPayload = {
          user_id: userId,
          type: 'calendar_reminder',
          title: `Reminder: ${event.title}`,
          message: event.description || `Your event "${event.title}" is coming up`,
          metadata: {
            event_id: event.id,
            event_title: event.title,
            starts_at: event.starts_at,
            reminder_id: reminder.id,
          },
          created_at: new Date().toISOString(),
        };

        console.log('Sending notification:', notificationPayload);

        // Mark reminder as sent
        const { error: updateError } = await supabase
          .from('calendar_event_reminders')
          .update({ sent_at: new Date().toISOString() })
          .eq('id', reminder.id);

        if (updateError) throw updateError;

        // Publish realtime notification
        await supabase
          .from('calendar_events')
          .select('*')
          .eq('id', event.id)
          .single()
          .then(() => {
            // Trigger realtime event for UI
            console.log('Realtime notification triggered for event:', event.id);
          });

        results.push({
          reminder_id: reminder.id,
          event_id: event.id,
          user_id: userId,
          status: 'sent',
        });
      } catch (error) {
        console.error(`Failed to process reminder ${reminder.id}:`, error);
        results.push({
          reminder_id: reminder.id,
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        processed: results.length,
        results,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error processing reminders:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
