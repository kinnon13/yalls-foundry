/**
 * Referral / Invite code utilities
 * Fetches public inviter data for personalization
 */

import { supabase } from '@/integrations/supabase/client';

export interface InviterInfo {
  interests: string[];
  showName: boolean;
  displayName: string | null;
}

export async function fetchInviter(inviteCode: string): Promise<InviterInfo | null> {
  if (!inviteCode) return null;

  try {
    const { data, error } = await supabase
      .from('ai_user_profiles')
      .select('public_interests, share_name, display_name')
      .eq('invite_code', inviteCode)
      .single();

    if (error || !data) return null;

    return {
      interests: data.public_interests || [],
      showName: !!data.share_name,
      displayName: data.display_name || null,
    };
  } catch {
    return null;
  }
}
