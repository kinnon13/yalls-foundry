/**
 * User RAG Index Worker
 * Generates embeddings for user content (memories, messages, files) for semantic search
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
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Fetch unindexed memories from last 7 days
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    
    const { data: memories } = await supabase
      .from('ai_user_memory')
      .select('id, user_id, content, created_at')
      .gte('created_at', sevenDaysAgo)
      .is('embedding', null)
      .limit(50);

    if (!memories || memories.length === 0) {
      return new Response(JSON.stringify({ 
        ok: true, 
        indexed: 0,
        message: 'No new content to index'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let indexed = 0;

    // Generate embeddings using Lovable AI
    for (const memory of memories) {
      try {
        // Call embedding model (using Lovable AI gateway with embedding endpoint)
        const embeddingResponse = await fetch('https://api.openai.com/v1/embeddings', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${LOVABLE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'text-embedding-3-small',
            input: memory.content.slice(0, 8000), // Truncate to token limit
          }),
        });

        if (!embeddingResponse.ok) {
          console.error(`[RAG] Embedding failed for memory ${memory.id}`);
          continue;
        }

        const embeddingData = await embeddingResponse.json();
        const embedding = embeddingData.data[0].embedding;

        // Store embedding back to memory
        await supabase
          .from('ai_user_memory')
          .update({ 
            embedding,
            updated_at: new Date().toISOString()
          })
          .eq('id', memory.id);

        indexed++;
      } catch (err) {
        console.error(`[RAG] Error indexing memory ${memory.id}:`, err);
      }
    }

    // Log indexing activity
    await supabase.from('ai_action_ledger').insert({
      tenant_id: null,
      topic: 'rag.index',
      payload: {
        total: memories.length,
        indexed,
        failed: memories.length - indexed,
        date: new Date().toISOString()
      }
    });

    console.log(`[RAG] Indexed ${indexed}/${memories.length} memories`);

    return new Response(JSON.stringify({ 
      ok: true, 
      total: memories.length,
      indexed,
      failed: memories.length - indexed
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[RAG] Error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
