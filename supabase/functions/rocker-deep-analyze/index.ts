import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.0";
import { ai } from "../_shared/ai.ts";

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();
    const { content, user_id, scope } = body || {} as { content?: string; user_id?: string; scope?: string };

    let analysisText = '';

    if (typeof content === 'string' && content.trim().length > 0) {
      analysisText = content;
    } else if (user_id) {
      const sb = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } });
      // Pull all user knowledge content
      const { data: rows, error } = await sb
        .from('rocker_knowledge')
        .select('content')
        .eq('user_id', user_id);
      if (error) throw error;
      const parts = (rows || [])
        .map(r => (r as any).content as string)
        .filter(Boolean)
        .map(t => t.replace(/\s+/g, ' ').trim());
      // Limit payload size for safety
      const joined = parts.join('\n\n---\n\n');
      analysisText = joined.length > 120_000 ? joined.slice(0, 120_000) : joined;
      if (!analysisText) {
        return new Response(JSON.stringify({ error: 'No content found to analyze' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    } else {
      return new Response(JSON.stringify({ error: 'content or user_id required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // If we have content to analyze, optionally search for additional context
    let webContext = '';
    if (analysisText && analysisText.length > 50) {
      try {
        // Extract key terms for web search
        const keyTerms = analysisText.split(/\s+/).slice(0, 10).join(' ');
        const { data: searchData } = await sb.functions.invoke('rocker-web-search', {
          body: { query: keyTerms, num_results: 3 }
        });
        if (searchData?.results?.length) {
          webContext = '\n\nWeb Context:\n' + searchData.results
            .map((r: any) => `${r.title}: ${r.snippet}`)
            .join('\n');
        }
      } catch (e) {
        console.warn('[deep-analyze] Web search failed:', e);
      }
    }

    const { text, raw } = await ai.chat({
      role: 'knower',
      messages: [
        { role: 'system', content: 'You are Rocker. Perform deep analysis across many files: split into micro-sections, flag uncertainties, and propose 2-3 filing options per sentence.' },
        { role: 'user', content: analysisText + webContext }
      ],
      maxTokens: 1200,
      temperature: 0.2
    });

    return new Response(JSON.stringify({ result: { choices: [{ message: { content: text } }] }, raw, scope: scope || null }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});