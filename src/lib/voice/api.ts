/**
 * Voice Post API
 * 
 * Functions for creating posts via voice commands
 */

import { supabase } from '@/integrations/supabase/client';

export interface PublishPostParams {
  content: string;
  visibility: 'public' | 'followers' | 'private';
  mediaUrls?: string[];
}

/**
 * Check if user is within rate limit
 */
export async function checkVoicePostRateLimit(): Promise<boolean> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase.rpc('check_voice_post_rate_limit', {
    p_user_id: user.id,
    p_max_posts: 5,
    p_window_seconds: 60
  });

  if (error) {
    console.error('[Voice API] Rate limit check failed:', error);
    return false;
  }

  return data as boolean;
}

/**
 * Publish a post via voice command (idempotent)
 */
export async function publishVoicePost({ 
  content, 
  visibility, 
  mediaUrls = [] 
}: PublishPostParams): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Check rate limit
  const withinLimit = await checkVoicePostRateLimit();
  if (!withinLimit) {
    throw new Error('Rate limit exceeded. Please wait before posting again.');
  }

  // Generate idempotency key
  const idempotencyKey = `voice:${crypto.randomUUID()}:${content.slice(0, 64)}`;

  const { data, error } = await supabase.rpc('rpc_create_post', {
    p_idempotency_key: idempotencyKey,
    p_content: content,
    p_visibility: visibility,
    p_media_urls: mediaUrls
  });

  if (error) {
    console.error('[Voice API] Failed to publish post:', error);
    throw error;
  }

  return data as string;
}

/**
 * Save a draft for later editing
 */
export async function saveDraft({ content, visibility }: PublishPostParams): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('post_drafts')
    .insert({
      user_id: user.id,
      content,
      visibility
    })
    .select('id')
    .single();

  if (error) throw error;
  return data.id;
}
