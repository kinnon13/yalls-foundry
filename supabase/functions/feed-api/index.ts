import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { withRateLimit, getRateLimitScope } from '../_shared/withRateLimit.ts';
import { CACHE_HEADERS, generateETag, checkETag } from '../_shared/cacheHeaders.ts';

/**
 * Feed API endpoint with rate limiting and cache headers
 */
Deno.serve(async (req) => {
  // CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    {
      global: {
        headers: { Authorization: req.headers.get('Authorization') ?? '' }
      }
    }
  );

  const scope = getRateLimitScope(req, 'feed-api');
  
  return withRateLimit(supabase, scope, 100, 60, async () => {
    try {
      const url = new URL(req.url);
      const profileId = url.searchParams.get('profile_id');
      const lane = url.searchParams.get('lane') || 'for_you';
      const cursor = url.searchParams.get('cursor');
      const limit = parseInt(url.searchParams.get('limit') || '20', 10);

      if (!profileId) {
        return new Response(
          JSON.stringify({ error: 'profile_id required' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // Fetch feed data
      const { data, error } = await supabase.rpc('feed_fusion_home', {
        p_profile_id: profileId,
        p_lane: lane,
        p_cursor: cursor ? parseInt(cursor, 10) : null,
        p_limit: limit,
      });

      if (error) throw error;

      // Generate ETag and check for 304
      const etag = generateETag(data);
      if (checkETag(req, etag)) {
        return new Response(null, { status: 304 });
      }

      // Return with cache headers
      return new Response(
        JSON.stringify(data),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'ETag': etag,
            'Access-Control-Allow-Origin': '*',
            ...CACHE_HEADERS.feedJson,
          },
        }
      );
    } catch (err) {
      console.error('Feed API error:', err);
      return new Response(
        JSON.stringify({ error: 'Internal server error' }),
        { 
          status: 500,
          headers: { 
            'Content-Type': 'application/json',
            ...CACHE_HEADERS.noCache,
          }
        }
      );
    }
  });
});
