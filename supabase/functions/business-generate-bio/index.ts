/**
 * Business Bio Generator
 * Creates 3 bio options for a business
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
    const { name, categories, website } = await req.json();

    if (!name) {
      return new Response(
        JSON.stringify({ suggestions: [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const categoriesText = categories?.length > 0 ? categories.join(', ') : 'various products and services';
    const prompt = `Write 3 SHORT business bio options (max 100 characters each) for:

Business: ${name}
Categories: ${categoriesText}
${website ? `Website: ${website}` : ''}

Each bio should:
- Be compelling and concise
- Highlight what makes them unique
- Be under 100 characters
- Be different from each other in tone (professional, friendly, creative)

Return ONLY a JSON array of strings:
["Bio option 1", "Bio option 2", "Bio option 3"]

No other text, just the JSON array.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: 'You are a professional copywriter. Return only valid JSON.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.8
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded', suggestions: [] }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      return new Response(
        JSON.stringify({ suggestions: [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extract JSON from response
    let suggestions = [];
    try {
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        suggestions = JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      console.error('[BioGen] JSON parse error:', e);
    }

    return new Response(
      JSON.stringify({ suggestions: suggestions.slice(0, 3) }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[BioGen] Error:', error);
    return new Response(
      JSON.stringify({ error: error.message, suggestions: [] }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
