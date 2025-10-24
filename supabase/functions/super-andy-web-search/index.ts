// Super Andy Web Search & Learning with Serper + XAI Grok
// Real web search using Serper API, analyzed by XAI Grok for comprehensive insights

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

    console.log('[Super Andy] Web search query:', query);

    // Step 1: Real web search using Serper API
    const SERPER_API_KEY = Deno.env.get('SERPER_API_KEY');
    if (!SERPER_API_KEY) {
      throw new Error('SERPER_API_KEY not configured');
    }

    const serperResponse = await fetch('https://google.serper.dev/search', {
      method: 'POST',
      headers: {
        'X-API-KEY': SERPER_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        q: query,
        num: 10,
      }),
    });

    if (!serperResponse.ok) {
      const errorText = await serperResponse.text();
      console.error('[Serper] Error:', errorText);
      throw new Error(`Serper search failed: ${serperResponse.status}`);
    }

    const serperData = await serperResponse.json();
    const searchResults = serperData.organic || [];

    console.log('[Super Andy] Found', searchResults.length, 'search results');

    // Step 2: Use XAI Grok to analyze and synthesize search results
    const XAI_API_KEY = Deno.env.get('XAI_API_KEY');
    if (!XAI_API_KEY) {
      throw new Error('XAI_API_KEY not configured');
    }

    const contextFromWeb = searchResults
      .slice(0, 5)
      .map((r: any) => `Title: ${r.title}\nSnippet: ${r.snippet}\nURL: ${r.link}`)
      .join('\n\n');

    const xaiResponse = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${XAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'grok-2-latest',
        messages: [
          {
            role: 'system',
            content: `You are Super Andy's research analyst. Analyze web search results and provide comprehensive insights. Format as JSON with:
- summary: Brief overview
- key_points: Array of main insights
- recent_developments: Notable recent changes
- applications: Practical use cases
- related_topics: Array of topics for further research
- confidence: Number 0-1 indicating information confidence
- sources: Array of URLs used`,
          },
          {
            role: 'user',
            content: `Query: ${query}\n\nWeb Search Results:\n${contextFromWeb}\n\nProvide comprehensive analysis in JSON format.`,
          },
        ],
        temperature: 0.7,
      }),
    });

    if (!xaiResponse.ok) {
      const errorText = await xaiResponse.text();
      console.error('[XAI] Error:', errorText);
      throw new Error(`XAI analysis failed: ${xaiResponse.status}`);
    }

    const xaiData = await xaiResponse.json();
    const searchResult = xaiData.choices[0].message.content;

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
        sources: searchResults.slice(0, 3).map((r: any) => r.link),
      };
    }

    // Store in Andy's knowledge base if requested
    if (learn_from_results) {
      await supabase.from('andy_external_knowledge').insert({
        topic: query,
        content: searchResult,
        source: 'serper_xai',
        learned_at: new Date().toISOString(),
        confidence_score: parsedResult.confidence || 0.85,
        metadata: {
          query,
          timestamp: new Date().toISOString(),
          model: 'grok-2-latest',
          search_engine: 'serper',
          results_count: searchResults.length,
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
        sources_count: searchResults.length,
      },
      result: 'success',
    });

    return new Response(
      JSON.stringify({
        success: true,
        query,
        result: parsedResult,
        learned: learn_from_results,
        search_results_count: searchResults.length,
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
