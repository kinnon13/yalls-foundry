// Super Andy External Learning Loop
// Pulls knowledge from web, APIs, and external sources

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
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    console.log('[Super Andy] Starting external learning cycle...');

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // 1. Identify knowledge gaps from recent queries
    const { data: recentQueries } = await supabase
      .from('ai_action_ledger')
      .select('*')
      .eq('agent', 'super_andy')
      .gte('created_at', new Date(Date.now() - 24 * 3600000).toISOString())
      .order('created_at', { ascending: false })
      .limit(50);

    // 2. Extract topics that need research
    const topics = extractTopicsForResearch(recentQueries || []);

    console.log('[Super Andy] Researching topics:', topics);

    // 3. Use AI to research each topic
    const learnings = [];
    for (const topic of topics.slice(0, 5)) {
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
              content: `You are Super Andy's external knowledge researcher. Research the following topic and provide key insights, patterns, and actionable intelligence. Focus on: emerging trends, best practices, potential risks, and strategic recommendations.`
            },
            {
              role: 'user',
              content: `Research topic: ${topic}\n\nProvide comprehensive analysis in structured format.`
            }
          ],
          max_tokens: 2000,
        }),
      });

      if (aiResponse.ok) {
        const data = await aiResponse.json();
        const insight = data.choices[0].message.content;

        learnings.push({
          topic,
          insight,
          source: 'ai_research',
          confidence: 0.85,
          timestamp: new Date().toISOString(),
        });

        // Store in knowledge base
        await supabase.from('andy_external_knowledge').insert({
          topic,
          content: insight,
          source: 'ai_research',
          learned_at: new Date().toISOString(),
          confidence_score: 0.85,
        });
      }
    }

    // 4. Update learning metrics
    await supabase.from('ai_learning_metrics').insert({
      agent: 'super_andy',
      cycle_type: 'external',
      topics_researched: topics.length,
      insights_captured: learnings.length,
      completed_at: new Date().toISOString(),
    });

    console.log(`[Super Andy] External learning complete: ${learnings.length} insights captured`);

    return new Response(
      JSON.stringify({
        success: true,
        topics_researched: topics.length,
        insights_captured: learnings.length,
        learnings: learnings.slice(0, 3), // Sample
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[Super Andy] External learning error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function extractTopicsForResearch(queries: any[]): string[] {
  const topics = new Set<string>();
  
  for (const query of queries) {
    const input = query.input || {};
    const action = query.action || '';
    
    // Extract topics from common patterns
    if (action.includes('policy')) topics.add('platform_policy_trends');
    if (action.includes('anomaly')) topics.add('anomaly_detection_methods');
    if (action.includes('security')) topics.add('security_best_practices');
    if (input.content_type) topics.add(`${input.content_type}_moderation`);
    if (input.user_segment) topics.add(`${input.user_segment}_behavior_patterns`);
  }

  // Add baseline research topics
  topics.add('ai_safety_emerging_risks');
  topics.add('platform_scaling_strategies');
  topics.add('user_engagement_optimization');

  return Array.from(topics);
}
