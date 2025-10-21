/**
 * Generate Platform Suggestions
 * 
 * Analyzes user corrections and traces to suggest platform evolution
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { withRateLimit, RateLimits } from "../_shared/rate-limit-wrapper.ts";
import { createLogger } from "../_shared/logger.ts";
import { ai } from "../_shared/ai.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const limited = await withRateLimit(req, 'generate-suggestions', RateLimits.expensive);
  if (limited) return limited;

  const log = createLogger('generate-suggestions');
  log.startTimer();

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    log.info("Generating platform suggestions from corrections and traces");

    // Fetch pending corrections
    const { data: corrections, error: correctionsError } = await supabase
      .from("ai_corrections")
      .select("*")
      .eq("status", "pending")
      .limit(100);

    if (correctionsError) throw correctionsError;

    if (!corrections || corrections.length === 0) {
      return new Response(
        JSON.stringify({ message: "No pending corrections", suggestions: [] }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Group corrections by type
    const correctionsByType: Record<string, any[]> = {};
    corrections.forEach(correction => {
      if (!correctionsByType[correction.correction_type]) {
        correctionsByType[correction.correction_type] = [];
      }
      correctionsByType[correction.correction_type].push(correction);
    });

    const suggestions = [];

    // Analyze each correction type
    for (const [type, items] of Object.entries(correctionsByType)) {
      if (items.length < 3) continue; // Need at least 3 similar requests

      // Create summary of requests
      const summary = items.map(c => c.corrected_content).join("\n");

      // Ask AI to generate suggestion
      const { text } = await ai.chat({
        role: 'knower',
        messages: [
          {
            role: "system",
            content: "You are a platform evolution AI. Analyze user requests and suggest new marketplace categories, business tools, or features. Return JSON: {title, description, suggestion_type, config}",
          },
          {
            role: "user",
            content: `Analyze these ${items.length} user requests of type "${type}":\n\n${summary}\n\nSuggest a new feature, category, or tool.`,
          },
        ],
        temperature: 0.3,
        maxTokens: 800
      });

      const suggestion = JSON.parse(text);

      // Insert suggestion
      const { data: newSuggestion, error: insertError } = await supabase
        .from("platform_suggestions")
        .insert({
          suggestion_type: suggestion.suggestion_type || type,
          title: suggestion.title,
          description: suggestion.description,
          config: suggestion.config || {},
          supporting_traces_count: items.length,
          interest_score: Math.min(items.length / 10, 1), // Score based on request count
        })
        .select()
        .single();

      if (insertError) {
        log.error("Error inserting suggestion", insertError);
        continue;
      }

      suggestions.push(newSuggestion);

      // Mark corrections as processed
      await supabase
        .from("ai_corrections")
        .update({ status: "processing", processed_at: new Date().toISOString() })
        .in("id", items.map(c => c.id));
    }

    return new Response(
      JSON.stringify({
        success: true,
        suggestions_generated: suggestions.length,
        suggestions,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    log.error("Error generating suggestions", error);
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
