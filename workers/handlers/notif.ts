import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function handleNotif(job: { type:'notif'; userId: string; lane: string; payload: any }) {
  const { error } = await supabaseAdmin.rpc('notif_send', {
    p_user_id: job.userId,
    p_lane: job.lane,
    p_payload: job.payload,
  });
  if (error) throw error;
}
