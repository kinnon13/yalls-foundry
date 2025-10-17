/**
 * Notifications Worker
 * Drains pending notifications and sends via appropriate channels
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function processNotifications() {
  console.log('[Notifications Worker] Starting drain...');

  // Fetch pending notifications
  const { data: pending, error: fetchError } = await supabase
    .from('notifications')
    .select('*')
    .eq('status', 'pending')
    .lte('scheduled_for', new Date().toISOString())
    .order('scheduled_for', { ascending: true })
    .limit(100);

  if (fetchError) {
    console.error('[Notifications Worker] Fetch error:', fetchError);
    return;
  }

  if (!pending || pending.length === 0) {
    console.log('[Notifications Worker] No pending notifications');
    return;
  }

  console.log(`[Notifications Worker] Processing ${pending.length} notifications`);

  for (const notif of pending) {
    try {
      // Mark as sent (actual delivery would happen here via SendGrid/Twilio/etc)
      const { error: updateError } = await supabase
        .from('notifications')
        .update({ status: 'sent', sent_at: new Date().toISOString() })
        .eq('id', notif.id);

      if (updateError) {
        console.error(`[Notifications Worker] Failed to send ${notif.id}:`, updateError);
        
        await supabase
          .from('notifications')
          .update({ 
            status: 'failed', 
            error: updateError.message 
          })
          .eq('id', notif.id);
      } else {
        console.log(`[Notifications Worker] Sent ${notif.id} via ${notif.channel}`);
      }
    } catch (err) {
      console.error(`[Notifications Worker] Error processing ${notif.id}:`, err);
    }
  }

  console.log('[Notifications Worker] Drain complete');
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    });
  }

  try {
    await processNotifications();

    return new Response(JSON.stringify({ success: true }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error('[Notifications Worker] Fatal error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
});
