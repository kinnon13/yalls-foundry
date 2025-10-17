import { LinkedAccountsPort, LinkedAccount, SocialProvider } from '@/ports/linkedAccounts';
import { supabase } from '@/integrations/supabase/client';

export const linkedAccountsDb: LinkedAccountsPort = {
  async list(userId) {
    // TODO: Wire to linked_accounts table when ready
    return [];
  },

  async upsert(userId, provider, handle, proof_url) {
    // TODO: Wire when linked_account_upsert RPC exists
    return {
      id: crypto.randomUUID(),
      user_id: userId,
      provider,
      handle,
      proof_url,
      verified: false,
      linked_at: new Date().toISOString(),
    };
  },

  async remove(userId, accountId) {
    const { error } = await supabase
      .from('linked_accounts')
      .delete()
      .eq('id', accountId)
      .eq('user_id', userId);
    
    if (error) throw error;
  },
};
