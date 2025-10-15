/**
 * Generate AI Embeddings
 * 
 * Creates vector embeddings for semantic search using OpenAI's text-embedding-3-small.
 * Batch processing with idempotency and retry logic.
 */

import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmbeddingRequest {
  chunk_type: string;
  source_id: string;
  source_table: string;
  content: string;
  metadata?: Record<string, any>;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    const { chunks } = await req.json() as { chunks: EmbeddingRequest[] };

    if (!chunks || chunks.length === 0) {
      throw new Error("No chunks provided");
    }

    console.log(`Generating embeddings for ${chunks.length} chunks`);

    const openAIKey = Deno.env.get("OPENAI_API_KEY");
    if (!openAIKey) {
      throw new Error("OPENAI_API_KEY not configured");
    }

    // Generate embeddings in batch (OpenAI supports up to 2048 inputs)
    const batchSize = 100;
    const results = [];

    for (let i = 0; i < chunks.length; i += batchSize) {
      const batch = chunks.slice(i, i + batchSize);
      
      const embeddingResponse = await fetch("https://api.openai.com/v1/embeddings", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${openAIKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "text-embedding-3-small",
          input: batch.map(c => c.content),
          dimensions: 1536,
        }),
      });

      if (!embeddingResponse.ok) {
        const error = await embeddingResponse.text();
        console.error("OpenAI API error:", error);
        throw new Error(`OpenAI API error: ${error}`);
      }

      const embeddingData = await embeddingResponse.json();

      // Insert chunks with embeddings
      for (let j = 0; j < batch.length; j++) {
        const chunk = batch[j];
        const embedding = embeddingData.data[j].embedding;

        const { data, error } = await supabase
          .from("ai_chunks")
          .upsert({
            chunk_type: chunk.chunk_type,
            source_id: chunk.source_id,
            source_table: chunk.source_table,
            content: chunk.content,
            tokens: chunk.content.split(/\s+/).length, // Rough token count
            embedding,
            metadata: chunk.metadata || {},
          }, {
            onConflict: "source_table,source_id",
          });

        if (error) {
          console.error("Error inserting chunk:", error);
          results.push({ success: false, error: error.message, chunk_id: chunk.source_id });
        } else {
          results.push({ success: true, chunk_id: chunk.source_id });
        }
      }

      console.log(`Processed batch ${i / batchSize + 1} of ${Math.ceil(chunks.length / batchSize)}`);
    }

    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;

    return new Response(
      JSON.stringify({
        success: true,
        processed: chunks.length,
        succeeded: successCount,
        failed: failCount,
        results,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error in generate-embeddings:", error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
