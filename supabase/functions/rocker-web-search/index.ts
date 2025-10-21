import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const { query, num_results = 5 } = await req.json();
    
    if (!query || typeof query !== 'string') {
      return new Response(JSON.stringify({ error: 'query is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const serpApiKey = Deno.env.get('SERPAPI_API_KEY');
    if (!serpApiKey) {
      return new Response(JSON.stringify({ error: 'SERPAPI_API_KEY not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Search via SerpAPI
    const searchUrl = new URL('https://serpapi.com/search');
    searchUrl.searchParams.set('engine', 'google');
    searchUrl.searchParams.set('q', query);
    searchUrl.searchParams.set('api_key', serpApiKey);
    searchUrl.searchParams.set('num', num_results.toString());

    const response = await fetch(searchUrl.toString());
    
    if (!response.ok) {
      throw new Error(`SerpAPI request failed: ${response.status}`);
    }

    const data = await response.json();
    
    // Extract clean results
    const results = (data.organic_results || []).map((result: any) => ({
      title: result.title || '',
      snippet: result.snippet || '',
      link: result.link || '',
      position: result.position || 0
    }));

    return new Response(JSON.stringify({ 
      query,
      results,
      total_results: results.length 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[rocker-web-search] Error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});