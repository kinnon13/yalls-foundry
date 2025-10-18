/**
 * Reposts DB Adapter
 * Wired to Supabase RPCs
 */

import { supabase } from '@/integrations/supabase/client';
import { RepostsPort, Repost } from '@/ports/reposts';

export const repostsDb: RepostsPort = {
  async create(source_post_id: string, caption?: string, targets?: string[]) {
    // If targets provided, use entity repost
    if (targets && targets.length > 0) {
      const { data, error } = await (supabase as any).rpc('post_repost_entity', {
        p_source_post_id: source_post_id,
        p_target_entity_id: targets[0], // Use first target
        p_caption: caption ?? null,
      });
      if (error) throw error;
      return { new_post_id: data.id };
    }

    // Standard repost (or quote if caption)
    const rpcName = caption ? 'post_quote' : 'post_repost';
    const { data, error } = await (supabase as any).rpc(rpcName, {
      p_source_post_id: source_post_id,
      p_caption: caption ?? null,
    });
    if (error) throw error;
    return { new_post_id: data.id };
  },

  async list(userId: string): Promise<Repost[]> {
    const { data, error } = await supabase
      .from('reposts')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map((row: any) => ({
      id: row.id,
      source_post_id: row.source_post_id,
      by_entity_id: row.target_entity_id || userId,
      new_post_id: row.id, // Repost itself is the "new post"
      created_at: row.created_at,
    }));
  },
};
