import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.0";
import { withRateLimit, getTenantFromJWT } from "../_shared/rate-limit-wrapper.ts";
import { createLogger } from "../_shared/logger.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  const log = createLogger('save-post');
  log.startTimer();
  
  // Rate limiting for standard function
  const limited = await withRateLimit(req, 'save-post', { burst: 10, perMin: 100 });
  if (limited) return limited;
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

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

    const { post_id, collection = 'All', note } = await req.json();

    if (!post_id) {
      return new Response(JSON.stringify({ error: 'post_id is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if post exists and is accessible
    const { data: post, error: postError } = await supabaseClient
      .from('posts')
      .select('*')
      .eq('id', post_id)
      .single();

    if (postError || !post) {
      return new Response(JSON.stringify({ error: 'Post not found or not accessible' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const tenantId = getTenantFromJWT(req) || user.id;
    log.info('Saving post', { post_id, user_id: user.id, tenant_id: tenantId });

    // Save the post
    const { data, error } = await supabaseClient
      .from('post_saves')
      .upsert({
        user_id: user.id,
        post_id,
        collection,
        note,
        tenant_id: tenantId,
      })
      .select()
      .single();

    if (error) {
      log.error('Error saving post', error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ success: true, data }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    log.error('Save post failed', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
