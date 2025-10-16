import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.0";
import { withRateLimit, RateLimits } from "../_shared/rate-limit-wrapper.ts";
import { createLogger } from "../_shared/logger.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const limited = await withRateLimit(req, 'recall-content', RateLimits.standard);
  if (limited) return limited;

  const log = createLogger('recall-content');
  log.startTimer();

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { query } = await req.json();

    if (!query) {
      return new Response(JSON.stringify({ error: 'query is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const results: any[] = [];

    // 1. Search user shortcuts (exact match)
    const { data: shortcuts } = await supabaseClient
      .from('user_shortcuts')
      .select('*')
      .eq('user_id', user.id)
      .ilike('shortcut', `%${query}%`)
      .order('created_at', { ascending: false })
      .limit(3);

    if (shortcuts && shortcuts.length > 0) {
      for (const shortcut of shortcuts) {
        let targetData = null;
        if (shortcut.target_type === 'post') {
          const { data } = await supabaseClient
            .from('posts')
            .select('*')
            .eq('id', shortcut.target_id)
            .single();
          targetData = data;
        } else if (shortcut.target_type === 'profile') {
          const { data } = await supabaseClient
            .from('profiles')
            .select('*')
            .eq('id', shortcut.target_id)
            .single();
          targetData = data;
        } else if (shortcut.target_type === 'horse') {
          const { data } = await supabaseClient
            .from('entity_profiles')
            .select('*')
            .eq('id', shortcut.target_id)
            .eq('entity_type', 'horse')
            .single();
          targetData = data;
        }

        if (targetData) {
          results.push({
            type: shortcut.target_type,
            id: shortcut.target_id,
            data: targetData,
            confidence: 0.95,
            source: 'shortcut',
            url: `/${shortcut.target_type}s/${shortcut.target_id}`,
          });
        }
      }
    }

    // 2. Search saved posts if no shortcuts found
    if (results.length === 0) {
      const { data: saves } = await supabaseClient
        .from('post_saves')
        .select('post_id, posts(*)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (saves) {
        for (const save of saves) {
          const post = save.posts as any;
          if (post && post.body && post.body.toLowerCase().includes(query.toLowerCase())) {
            results.push({
              type: 'post',
              id: post.id,
              data: post,
              confidence: 0.85,
              source: 'saved_post',
              url: `/posts/${post.id}`,
            });
          }
        }
      }
    }

    // 3. Fallback: search recent posts
    if (results.length === 0) {
      const { data: posts } = await supabaseClient
        .from('posts')
        .select('*')
        .ilike('body', `%${query}%`)
        .eq('visibility', 'public')
        .order('created_at', { ascending: false })
        .limit(5);

      if (posts) {
        results.push(...posts.map(post => ({
          type: 'post',
          id: post.id,
          data: post,
          confidence: 0.70,
          source: 'public_search',
          url: `/posts/${post.id}`,
        })));
      }
    }

    return new Response(JSON.stringify({ results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    log.error('Recall content error', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
