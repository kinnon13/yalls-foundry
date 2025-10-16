import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { withRateLimit, RateLimits } from "../_shared/rate-limit-wrapper.ts";
import { createLogger } from "../_shared/logger.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const limited = await withRateLimit(req, 'rocker-fetch-url', RateLimits.standard);
  if (limited) return limited;

  const log = createLogger('rocker-fetch-url');
  log.startTimer();

  try {
    const { url, term } = await req.json();
    
    if (!url && !term) {
      throw new Error('Either url or term is required');
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
      throw new Error('Unauthorized');
    }

    log.info('Fetching URL or searching', { url, term });

    let targetUrl = url;
    
    // If term provided, search Google for authoritative sources
    if (term && !url) {
      const searchQuery = encodeURIComponent(`"${term}" definition`);
      const googleSearchUrl = `https://www.google.com/search?q=${searchQuery}`;
      
      // Return a search suggestion
      return new Response(
        JSON.stringify({
          search_url: googleSearchUrl,
          suggestions: [
            `I'm not familiar with "${term}". Can you explain what that means?`,
            `Would you like me to search Google for information about "${term}"?`,
            'Or you can describe it to me directly.'
          ],
          action: 'clarify'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch the URL content
    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; RockerBot/1.0)'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch URL: ${response.status}`);
    }

    const html = await response.text();
    
    // Extract title and description from HTML
    const titleMatch = html.match(/<title>([^<]*)<\/title>/i);
    const descMatch = html.match(/<meta\s+name=["']description["']\s+content=["']([^"']*)["']/i);
    
    const title = titleMatch ? titleMatch[1] : 'No title';
    const description = descMatch ? descMatch[1] : '';
    
    // Extract main content
    const pMatch = html.match(/<p[^>]*>([^<]+)<\/p>/i);
    const content = pMatch ? pMatch[1] : '';

    return new Response(
      JSON.stringify({
        url: targetUrl,
        title,
        description,
        content: content.slice(0, 500),
        fetched_at: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    log.error('Rocker fetch URL error', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
