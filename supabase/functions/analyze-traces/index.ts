/**
 * Analyze User Traces
 * 
 * Computes user interests from interaction traces and generates embeddings
 */

import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    const { user_id } = await req.json();
    
    if (!user_id) {
      throw new Error("user_id required");
    }

    console.log(`Analyzing traces for user ${user_id}`);

    // Fetch recent traces (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: traces, error: tracesError } = await supabase
      .from("user_traces")
      .select("*")
      .eq("user_id", user_id)
      .gte("created_at", thirtyDaysAgo.toISOString())
      .order("created_at", { ascending: false })
      .limit(1000);

    if (tracesError) throw tracesError;

    if (!traces || traces.length === 0) {
      return new Response(
        JSON.stringify({ message: "No traces found", interests: {} }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Compute interests from traces
    const interests: Record<string, number> = {};
    const entityCounts: Record<string, number> = {};

    traces.forEach((trace: any) => {
      // Weight different trace types
      const weights: Record<string, number> = {
        view: 1,
        click: 2,
        search: 3,
        save: 4,
        purchase: 5,
      };
      const weight = weights[trace.trace_type] || 1;

      if (trace.entity_type) {
        entityCounts[trace.entity_type] = (entityCounts[trace.entity_type] || 0) + weight;
      }

      // Extract category from metadata
      if (trace.metadata?.category) {
        interests[trace.metadata.category] = (interests[trace.metadata.category] || 0) + weight;
      }
    });

    // Normalize scores to 0-1
    const maxScore = Math.max(...Object.values(interests));
    if (maxScore > 0) {
      Object.keys(interests).forEach(key => {
        interests[key] = interests[key] / maxScore;
      });
    }

    // Generate text for embedding
    const interestText = Object.entries(interests)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([category, score]) => `${category} (${(score * 100).toFixed(0)}%)`)
      .join(", ");

    console.log("User interests:", interestText);

    // Generate embedding using OpenAI
    const openAIKey = Deno.env.get("OPENAI_API_KEY");
    let embedding = null;

    if (openAIKey && interestText) {
      const embeddingResponse = await fetch("https://api.openai.com/v1/embeddings", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${openAIKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "text-embedding-3-small",
          input: interestText,
          dimensions: 1536,
        }),
      });

      if (embeddingResponse.ok) {
        const embeddingData = await embeddingResponse.json();
        embedding = embeddingData.data[0].embedding;
      }
    }

    // Upsert user interests
    const { error: upsertError } = await supabase
      .from("user_interests")
      .upsert({
        user_id,
        interests,
        embedding,
        last_computed_at: new Date().toISOString(),
        trace_count: traces.length,
      }, {
        onConflict: "user_id",
      });

    if (upsertError) throw upsertError;

    return new Response(
      JSON.stringify({
        success: true,
        user_id,
        interests,
        trace_count: traces.length,
        top_categories: Object.entries(interests)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5),
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error analyzing traces:", error);
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
