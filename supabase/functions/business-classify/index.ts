/**
 * Business Classification
 * Uses AI to suggest marketplace categories
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { name, description, website } = await req.json();

    if (!description || description.trim().length < 3) {
      return new Response(
        JSON.stringify({ categories: [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const prompt = `Analyze this business and suggest 3-5 marketplace categories.

Business Name: ${name}
Description: ${description}
${website ? `Website: ${website}` : ''}

Return ONLY a JSON array of category objects with this structure:
[
  {
    "label": "Category Name",
    "parent_key": null,
    "synonyms": ["synonym1", "synonym2"]
  }
]

Focus on specific, actionable categories for a marketplace. Examples:
- Tack & Equipment
- Training Services
- Veterinary Services
- Feed & Nutrition
- Apparel & Accessories

Return only the JSON array, no other text.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: 'You are a business categorization expert. Return only valid JSON.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded', categories: [] }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      return new Response(
        JSON.stringify({ categories: [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extract JSON from response
    let categories = [];
    try {
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        categories = JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      console.error('[Classify] JSON parse error:', e);
    }

    return new Response(
      JSON.stringify({ categories }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[Classify] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message, categories: [] }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
