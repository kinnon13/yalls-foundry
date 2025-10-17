import { RepostsPort, Repost } from '@/ports/reposts';
import { supabase } from '@/integrations/supabase/client';

export const repostsDb: RepostsPort = {
  async create(source_post_id, caption, targets) {
    // TODO: Wire when post_repost RPC exists
    return { new_post_id: crypto.randomUUID() };
  },

  async list(userId) {
    // TODO: Wire to reposts table when ready
    return [];
  },
};
