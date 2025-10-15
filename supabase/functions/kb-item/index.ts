import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const uri = url.searchParams.get('uri');
    
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

    console.log('[KB Item] Fetching URI:', uri);

    // Fetch item with all chunks
    const { data: item, error } = await supabaseClient
      .from('knowledge_items')
      .select(`
        *,
        knowledge_chunks(
          id,
          idx,
          text,
          token_count
        )
      `)
      .eq('uri', uri)
      .single();

    if (error) {
      console.error('[KB Item] Error:', error);
      if (error.code === 'PGRST116') {
        return new Response(
          JSON.stringify({ error: 'Item not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      throw error;
    }

    // Sort chunks by index
    if (item.knowledge_chunks) {
      item.knowledge_chunks.sort((a: any, b: any) => a.idx - b.idx);
    }

    console.log('[KB Item] Found:', item.title);

    return new Response(
      JSON.stringify({ item }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[KB Item] Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
