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

    // For MVP: Use Lovable AI to synthesize research (simulates web search + synthesis)
    // In production: Integrate SerpAPI, Brave Search, or web scraping
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    let researchResult = {
      query,
      research_type,
      findings: [] as any[],
      summary: '',
      confidence: 0.5,
      sources: [] as string[],
    };

    if (LOVABLE_API_KEY) {
      const researchPrompt = `Research Query: "${query}"
Context: ${context || 'General feature capability gap'}
Type: ${research_type}

Provide:
1. Key findings (3-5 bullet points)
2. Best practices or alternatives
3. Implementation suggestions with code examples if applicable
4. Confidence score (0-1) based on information availability

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
          // Try to parse as JSON
          const parsed = JSON.parse(content);
          researchResult.findings = parsed.findings || [];
          researchResult.summary = parsed.summary || content;
          researchResult.confidence = parsed.confidence || 0.6;
        } catch {
          // If not JSON, use raw content
          researchResult.summary = content;
          researchResult.findings = content.split('\n').filter((l: string) => l.trim().startsWith('-') || l.trim().startsWith('•')).map((l: string) => l.trim());
        }
      }
    } else {
      // Fallback: Log as gap signal for manual review
      researchResult.summary = `[Research queued - no AI key] Query: ${query}`;
      researchResult.confidence = 0.3;
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
