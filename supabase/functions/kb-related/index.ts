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

  const limited = await withRateLimit(req, 'kb-related', RateLimits.standard);
  if (limited) return limited;

  const log = createLogger('kb-related');
  log.startTimer();

  try {
    const url = new URL(req.url);
    const uri = url.searchParams.get('uri');
    const limit = parseInt(url.searchParams.get('limit') || '8');
    
    if (!uri) {
      return new Response(
        JSON.stringify({ error: 'URI required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    log.info('Finding related items', { uri });

    // Get source item embedding
    const { data: sourceItem, error: sourceError } = await supabaseClient
      .from('knowledge_items')
      .select('id, embedding, category, subcategory')
      .eq('uri', uri)
      .single();

    if (sourceError || !sourceItem) {
      return new Response(
        JSON.stringify({ error: 'Source item not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!sourceItem.embedding) {
      return new Response(
        JSON.stringify({ error: 'Source item has no embedding' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Find similar items using vector similarity
    const { data: related, error: relatedError } = await supabaseClient.rpc(
      'match_knowledge_items',
      {
        query_embedding: sourceItem.embedding,
        match_threshold: 0.6,
        match_count: limit + 1, // +1 to exclude self
      }
    );

    if (relatedError) {
      log.error('Related items search error', relatedError);
      throw relatedError;
    }

    // Filter out source item
    const filtered = related?.filter((item: any) => item.id !== sourceItem.id).slice(0, limit) || [];

    log.info('Related items found', { count: filtered.length });

    return new Response(
      JSON.stringify({ 
        related: filtered,
        source_uri: uri,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    log.error('KB related error', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
