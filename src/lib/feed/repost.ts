/**
 * Repost Utilities
 * Production-grade cross-posting with attribution and targeting
 */

import { supabase } from '@/integrations/supabase/client';

export interface RepostParams {
  sourcePostId: string;
  caption?: string;
  targetEntities?: string[];
}

export interface RepostResult {
  success: boolean;
  postId?: string;
  error?: string;
}

/**
 * Repost with attribution (creates new post linking to source)
 * Uses RPC for atomic multi-table operations
 */
export async function repostWithAttribution(params: RepostParams): Promise<RepostResult> {
  try {
    // Use the existing post_repost RPC with correct parameters
    const { data, error } = await (supabase as any).rpc('post_repost', {
      p_source_post_id: params.sourcePostId,
      p_caption: params.caption || null,
      p_target_entities: params.targetEntities || null,
    });

    if (error) throw error;

    return { success: true, postId: data };
  } catch (error) {
    console.error('[Repost] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to repost',
    };
  }
}
