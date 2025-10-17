import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function handleNotif(job: { type:'notif'; userId: string; lane: string; payload: any }) {
  const { error } = await supabaseAdmin.rpc('notif_send', {
    p_user_id: job.userId,
    p_lane: job.lane,
    p_payload: job.payload,
  });
  if (error) throw error;
}
