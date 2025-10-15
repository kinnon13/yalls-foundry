import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.0";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function generateEmbedding(text: string, openaiKey: string): Promise<number[]> {
  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openaiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'text-embedding-3-small',
      input: text,
    }),
  });

  if (!response.ok) {
    throw new Error(`Embedding API error: ${response.status}`);
  }

  const data = await response.json();
  return data.data[0].embedding;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      q, 
      scope, 
      category, 
      subcategory, 
      tags,
      limit = 10,
      semantic = true,
    } = await req.json();
    
    if (!q) {
      return new Response(
        JSON.stringify({ error: 'Query required' }),
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

    const { data: { user } } = await supabaseClient.auth.getUser();
    console.log('[KB Search] Query:', q, 'User:', user?.id);

    // Build filter conditions
    const filters: any = {};
    
    if (scope) {
      filters.scope = scope;
    } else if (user) {
      // Default: search global + site + user's own
      // This will be handled by RLS
    }
    
    if (category) filters.category = category;
    if (subcategory) filters.subcategory = subcategory;

    // Keyword search on knowledge_items
    let itemsQuery = supabaseClient
      .from('knowledge_items')
      .select('*, knowledge_chunks(id, text, idx)')
      .textSearch('title', q, { type: 'websearch' })
      .limit(limit);

    Object.entries(filters).forEach(([key, value]) => {
      itemsQuery = itemsQuery.eq(key, value);
    });

    if (tags && tags.length > 0) {
      itemsQuery = itemsQuery.overlaps('tags', tags);
    }

    const { data: keywordResults, error: keywordError } = await itemsQuery;

    if (keywordError) {
      console.error('[KB Search] Keyword error:', keywordError);
      throw keywordError;
    }

    console.log('[KB Search] Keyword results:', keywordResults?.length || 0);

    // Semantic search if enabled and OpenAI key available
    let semanticResults: any[] = [];
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    
    if (semantic && OPENAI_API_KEY) {
      try {
        const queryEmbedding = await generateEmbedding(q, OPENAI_API_KEY);
        
        // Search chunks by vector similarity
        let chunksQuery = supabaseClient.rpc('match_knowledge_chunks', {
          query_embedding: queryEmbedding,
          match_threshold: 0.7,
          match_count: limit * 2,
        });

        const { data: chunks, error: chunksError } = await chunksQuery;

        if (chunksError) {
          console.error('[KB Search] Semantic error:', chunksError);
        } else {
          console.log('[KB Search] Semantic chunk results:', chunks?.length || 0);
          
          // Group chunks by item
          const itemIds = [...new Set(chunks?.map((c: any) => c.item_id) || [])];
          
          if (itemIds.length > 0) {
            let itemsFromChunksQuery = supabaseClient
              .from('knowledge_items')
              .select('*, knowledge_chunks!inner(id, text, idx, similarity)')
              .in('id', itemIds)
              .limit(limit);

            const { data: items } = await itemsFromChunksQuery;
            
            if (items) {
              semanticResults = items;
            }
          }
        }
      } catch (error) {
        console.error('[KB Search] Semantic search failed:', error);
      }
    }

    // Merge and dedupe results
    const resultMap = new Map();
    
    keywordResults?.forEach((item: any) => {
      if (!resultMap.has(item.id)) {
        resultMap.set(item.id, {
          ...item,
          match_type: 'keyword',
        });
      }
    });

    semanticResults.forEach((item: any) => {
      if (!resultMap.has(item.id)) {
        resultMap.set(item.id, {
          ...item,
          match_type: 'semantic',
        });
      } else {
        // Merge - it matched both ways
        const existing = resultMap.get(item.id);
        existing.match_type = 'hybrid';
      }
    });

    const results = Array.from(resultMap.values()).slice(0, limit);

    console.log('[KB Search] Final results:', results.length);

    return new Response(
      JSON.stringify({ 
        results,
        total: results.length,
        query: q,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[KB Search] Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
