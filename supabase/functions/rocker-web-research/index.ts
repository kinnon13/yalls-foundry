// Web Research Tool for Gap Filling
// Searches external sources for missing capabilities, best practices, alternatives
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

console.log('[rocker-web-research] boot');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ResearchRequest {
  query: string;
  context?: string;
  research_type: 'feature_gap' | 'best_practice' | 'alternative' | 'troubleshooting';
  user_id?: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    { auth: { persistSession: false } }
  );

  try {
    const { query, context, research_type, user_id }: ResearchRequest = await req.json();

    console.log('[Web Research]', { query, research_type });

    // Real external research using SerpAPI
    const SERPAPI_API_KEY = Deno.env.get('SERPAPI_API_KEY');
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    let researchResult = {
      query,
      research_type,
      findings: [] as any[],
      summary: '',
      confidence: 0.5,
      sources: [] as string[],
    };

    // Step 1: Perform actual web search via SerpAPI
    if (SERPAPI_API_KEY) {
      try {
        const serpParams = new URLSearchParams({
          api_key: SERPAPI_API_KEY,
          q: query,
          engine: 'google',
          num: '5',
        });

        const serpResponse = await fetch(`https://serpapi.com/search.json?${serpParams}`);
        
        if (serpResponse.ok) {
          const serpData = await serpResponse.json();
          const organicResults = serpData.organic_results || [];
          
          // Extract findings from search results
          researchResult.sources = organicResults.map((r: any) => r.link).filter(Boolean).slice(0, 5);
          researchResult.findings = organicResults.map((r: any) => ({
            title: r.title,
            snippet: r.snippet,
            link: r.link,
          })).slice(0, 5);
          
          // Step 2: Synthesize findings with AI if available
          if (LOVABLE_API_KEY && researchResult.findings.length > 0) {
            const synthesisPrompt = `Research Query: "${query}"
Context: ${context || 'General feature capability gap'}
Type: ${research_type}

Search Results:
${researchResult.findings.map((f: any, i: number) => `${i+1}. ${f.title}\n   ${f.snippet}\n   ${f.link}`).join('\n\n')}

Synthesize these results into:
1. Key actionable findings (3-5 bullet points)
2. Best practices or implementation recommendations
3. Confidence score (0-1) based on result quality

Format as JSON: { findings: string[], summary: string, confidence: number }`;

            const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
              method: "POST",
              headers: {
                Authorization: `Bearer ${LOVABLE_API_KEY}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                model: "google/gemini-2.5-flash",
                messages: [
                  { role: "system", content: "You are a technical research assistant. Synthesize search results into actionable insights." },
                  { role: "user", content: synthesisPrompt }
                ],
                temperature: 0.3,
              }),
            });

            if (aiResponse.ok) {
              const aiData = await aiResponse.json();
              const content = aiData.choices?.[0]?.message?.content || '{}';
              
              try {
                const parsed = JSON.parse(content);
                researchResult.summary = parsed.summary || content;
                researchResult.confidence = Math.min(parsed.confidence || 0.7, 0.9);
                // Merge AI-synthesized findings with raw results
                if (parsed.findings && parsed.findings.length > 0) {
                  researchResult.findings = [
                    ...parsed.findings.map((f: string) => ({ text: f, source: 'ai_synthesis' })),
                    ...researchResult.findings
                  ];
                }
              } catch {
                researchResult.summary = content;
              }
            }
          } else {
            // No AI synthesis, use raw search results
            researchResult.summary = `Found ${organicResults.length} relevant results for "${query}"`;
            researchResult.confidence = organicResults.length > 0 ? 0.7 : 0.3;
          }
          
          console.log('[Web Research] SerpAPI search complete:', {
            query,
            results: organicResults.length,
            confidence: researchResult.confidence
          });
        } else {
          console.error('[Web Research] SerpAPI error:', serpResponse.status);
          researchResult.summary = `Search API error (${serpResponse.status})`;
          researchResult.confidence = 0.2;
        }
      } catch (e: any) {
        console.error('[Web Research] SerpAPI exception:', e);
        researchResult.summary = `Search failed: ${e.message}`;
        researchResult.confidence = 0.2;
      }
    } else if (LOVABLE_API_KEY) {
      // Fallback to AI-only synthesis if no SerpAPI key
      const researchPrompt = `Research Query: "${query}"
Context: ${context || 'General feature capability gap'}
Type: ${research_type}

Provide technical research based on your knowledge:
1. Key findings (3-5 bullet points)
2. Best practices or alternatives
3. Implementation suggestions
4. Confidence score (0-1)

Format as JSON: { findings: string[], summary: string, confidence: number }`;

      const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: "You are a technical research assistant. Provide concise, actionable findings." },
            { role: "user", content: researchPrompt }
          ],
          temperature: 0.3,
        }),
      });

      if (aiResponse.ok) {
        const data = await aiResponse.json();
        const content = data.choices?.[0]?.message?.content || '{}';
        
        try {
          const parsed = JSON.parse(content);
          researchResult.findings = parsed.findings || [];
          researchResult.summary = parsed.summary || content;
          researchResult.confidence = parsed.confidence || 0.5;
        } catch {
          researchResult.summary = content;
          researchResult.findings = content.split('\n').filter((l: string) => l.trim().startsWith('-') || l.trim().startsWith('•')).map((l: string) => l.trim());
        }
      }
    } else {
      // No API keys available
      researchResult.summary = `[Research queued - no API keys configured]`;
      researchResult.confidence = 0.1;
    }

    // Store research in rocker_gap_signals for tracking/ranking
    const { data: gapSignal, error: gapError } = await supabase
      .from('rocker_gap_signals')
      .insert({
        kind: research_type === 'feature_gap' ? 'research_needed' : 'low_conf',
        query,
        user_id: user_id || null,
        score: researchResult.confidence,
        entities: {
          research_type,
          findings: researchResult.findings,
          summary: researchResult.summary,
        },
      })
      .select()
      .single();

    if (gapError) {
      console.error('[Web Research] Failed to store gap signal:', gapError);
    }

    // Also log to ai_action_ledger for audit trail
    try {
      await supabase.from('ai_action_ledger').insert({
        user_id: user_id || null,
        agent: 'rocker_research',
        action: 'web_research',
        input: { query, research_type, context },
        output: researchResult,
        result: 'success',
      });
    } catch (logErr) {
      console.error('[rocker-web-research] Failed to log:', logErr);
    }

    return new Response(
      JSON.stringify({
        success: true,
        ...researchResult,
        gap_signal_id: gapSignal?.id,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (e: any) {
    console.error('[rocker-web-research] error:', e);
    return new Response(
      JSON.stringify({ error: e.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
