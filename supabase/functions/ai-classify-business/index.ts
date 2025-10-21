import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { name, website, examples, freeform } = await req.json();

    if (!name) {
      return new Response(
        JSON.stringify({ error: "Business name is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY not configured");
    }

    // Build classification prompt
    const systemPrompt = `You are a marketplace category expert for the equine industry. Your job is to classify businesses into a hierarchical category structure (max 3 levels deep).

Return a JSON array of category objects with this structure:
{
  "categories": [
    {"label": "Main Category", "parent_key": null, "synonyms": ["alt1", "alt2"]},
    {"label": "Subcategory", "parent_key": "main-category", "synonyms": []},
    {"label": "Sub-subcategory", "parent_key": "main-category/subcategory", "synonyms": []}
  ],
  "notes": "Brief explanation of classification",
  "confidence": 0.85
}

Key rules:
- Use existing categories when possible: Tack, Apparel, Feed, Care, Trailers, Services
- Common subcategories: Saddles, Bridles, Boots, Hats, Training, Boarding
- parent_key should be slugified (lowercase, hyphens): "tack/saddles/western"
- Return 1-5 categories, most to least specific
- confidence: 0-1 (0.8+ is high confidence)`;

    const userPrompt = `Classify this business:
Name: ${name}
${website ? `Website: ${website}` : ''}
${examples?.length ? `Products/Services: ${examples.join(', ')}` : ''}
${freeform ? `Additional context: ${freeform}` : ''}

Return JSON only.`;

    // Call AI
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.3,
        response_format: { type: "json_object" }
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI error:", errorText);
      
      // Return fallback categories
      return new Response(
        JSON.stringify({
          categories: [{ label: "Services", parent_key: null, synonyms: [] }],
          notes: "AI unavailable, using default category",
          confidence: 0.3
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No AI response");
    }

    const result = JSON.parse(content);

    return new Response(
      JSON.stringify(result),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Classification error:", error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        categories: [{ label: "Services", parent_key: null, synonyms: [] }],
        notes: "Error occurred, using default",
        confidence: 0.2
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
