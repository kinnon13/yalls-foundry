/**
 * Role: Yalls Social edge function - feed curation and viral ranking
 * Path: supabase/functions/yalls-social/index.ts
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const url = new URL(req.url);
    const action = url.searchParams.get('action');

    switch (action) {
      case 'curate-feed': {
        const userId = url.searchParams.get('userId');
        const page = parseInt(url.searchParams.get('page') || '0');
        
        if (!userId) {
          return new Response(JSON.stringify({ error: 'Missing userId' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Fetch posts with viral ranking
        const { data, error } = await supabase
          .from('yalls_social_posts')
          .select('*')
          .order('viral_score', { ascending: false })
          .range(page * 20, (page + 1) * 20 - 1);

        if (error) throw error;

        // Recalculate viral scores
        const posts = (data || []).map((post: any) => {
          const hoursOld = (Date.now() - new Date(post.created_at).getTime()) / (1000 * 60 * 60);
          const freshness = Math.exp(-hoursOld / 24);
          return {
            ...post,
            viral_score: post.likes_count * freshness,
          };
        });

        return new Response(JSON.stringify({ posts }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'boost-post': {
        // Stub: Paid viral boost feature
        const { postId, multiplier } = await req.json();
        
        const { error } = await supabase.rpc('boost_post_viral_score', {
          post_id: postId,
          boost_multiplier: multiplier,
        });

        if (error) throw error;

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      default:
        return new Response(JSON.stringify({ error: 'Invalid action' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
  } catch (error) {
    console.error('Yalls Social function error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
