/**
 * AI-Powered Feed Curation
 * 
 * Personalizes feed content based on:
 * - User interactions (likes, comments, shares)
 * - Follow graph
 * - Content freshness
 * - Engagement patterns
 * 
 * Behind `ai_rank` feature flag.
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { posts, userId } = await req.json();
    
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );
    
    // Get user's engagement history
    const { data: interactions } = await supabaseClient
      .from('post_interactions')
      .select('post_id, interaction_type')
      .eq('user_id', userId)
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());
    
    const interactedIds = new Set(interactions?.map(i => i.post_id) || []);
    
    // Get user follows
    const { data: follows } = await supabaseClient
      .from('follows')
      .select('followed_id')
      .eq('follower_id', userId);
    
    const followedIds = new Set(follows?.map(f => f.followed_id) || []);
    
    // Score each post
    const scored = posts.map((post: any) => {
      let score = 0;
      
      // Recency boost (exponential decay)
      const hoursSincePost = (Date.now() - new Date(post.created_at).getTime()) / (1000 * 60 * 60);
      if (hoursSincePost < 1) score += 100;
      else if (hoursSincePost < 6) score += 50;
      else if (hoursSincePost < 24) score += 25;
      else score += Math.max(0, 10 - Math.floor(hoursSincePost / 24));
      
      // Follow boost
      if (followedIds.has(post.author_id)) {
        score += 75;
      }
      
      // Engagement rate
      const engagementRate = (post.likes_count + post.comments_count * 2 + post.shares_count * 3) / 
                             Math.max(1, post.views_count || 1);
      score += engagementRate * 50;
      
      // Novelty bonus (haven't interacted recently)
      if (!interactedIds.has(post.id)) {
        score += 20;
      }
      
      // Content type diversity (avoid too much of same type)
      // TODO: Track last seen types in session and penalize repetition
      
      return { ...post, ai_score: score };
    });
    
    // Sort by score (descending)
    scored.sort((a: any, b: any) => b.ai_score - a.ai_score);
    
    return new Response(
      JSON.stringify({ posts: scored }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Feed curation error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
