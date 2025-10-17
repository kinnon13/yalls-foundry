/**
 * Notification Handler
 * Sends notifications via notif_send RPC
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export async function handleNotif(job: {
  userId: string;
  lane: string;
  payload: any;
}) {
  console.log(`[Notif] Sending to user ${job.userId} on lane ${job.lane}`);

  const { error } = await supabaseAdmin.rpc('notif_send', {
    p_user_id: job.userId,
    p_lane: job.lane,
    p_payload: job.payload,
  });

  if (error) {
    console.error('[Notif] Failed:', error);
    throw error;
  }

  console.log('[Notif] Sent successfully');
}
