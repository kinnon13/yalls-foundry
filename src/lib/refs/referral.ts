/**
 * Referral / Invite code utilities
 * Fetches public inviter data for personalization
 */

import { supabase } from '@/integrations/supabase/client';

export interface InviterInfo {
  interests: string[];
  showName: boolean;
}

export async function fetchInviter(inviteCode: string): Promise<InviterInfo | null> {
  if (!inviteCode) return null;

  try {
    const { data, error } = await supabase
      .from('ai_user_profiles')
      .select('public_interests, share_name')
      .eq('invite_code', inviteCode)
      .single();

    if (error || !data) return null;

    return {
      interests: data.public_interests || [],
      showName: !!data.share_name,
    };
  } catch {
    return null;
  }
}
