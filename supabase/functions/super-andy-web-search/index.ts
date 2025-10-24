// Super Andy Web Search & Learning
// Enables Andy to search the web and learn in real-time from conversations

import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query, learn_from_results = true } = await req.json();

    if (!query) {
      return new Response(
        JSON.stringify({ error: 'Query is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    console.log('[Super Andy] Web search query:', query);

    // Use AI to perform web research
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `You are Super Andy's web research assistant. Provide comprehensive, accurate information about the query. Include:
1. Key facts and current information
2. Recent developments or trends
3. Practical applications
4. Potential implications
5. Related topics to explore

Format your response as structured JSON with these fields:
- summary: Brief overview
- key_points: Array of main insights
- recent_developments: Notable recent changes
- applications: Practical use cases
- related_topics: Array of topics for further research
- confidence: Number 0-1 indicating information confidence`
          },
          {
            role: 'user',
            content: `Research: ${query}`
          }
        ],
        max_tokens: 2000,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      throw new Error(`AI search failed: ${aiResponse.status} - ${errorText}`);
    }

    const aiData = await aiResponse.json();
    const searchResult = aiData.choices[0].message.content;

    // Parse the structured response
    let parsedResult;
    try {
      parsedResult = JSON.parse(searchResult);
    } catch {
      // If not JSON, treat as plain text
      parsedResult = {
        summary: searchResult,
        key_points: [searchResult],
        confidence: 0.7,
      };
    }

    // Store in Andy's knowledge base if requested
    if (learn_from_results) {
      await supabase.from('andy_external_knowledge').insert({
        topic: query,
        content: searchResult,
        source: 'web_search_ai',
        learned_at: new Date().toISOString(),
        confidence_score: parsedResult.confidence || 0.85,
        metadata: {
          query,
          timestamp: new Date().toISOString(),
          model: 'gemini-2.5-flash',
        },
      });

      console.log('[Super Andy] Knowledge stored for:', query);
    }

    // Log the search action
    await supabase.from('ai_action_ledger').insert({
      tenant_id: 'platform',
      agent: 'super_andy',
      action: 'web_search',
      input: { query },
      output: { 
        result_summary: parsedResult.summary,
        learned: learn_from_results,
      },
      result: 'success',
    });

    return new Response(
      JSON.stringify({
        success: true,
        query,
        result: parsedResult,
        learned: learn_from_results,
        timestamp: new Date().toISOString(),
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[Super Andy] Web search error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
