import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.0";
import { createLogger } from "../_shared/logger.ts";
import { ai } from "../_shared/ai.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Insights Extraction - Step 2 of Proactive AI Implementation
 * Analyzes user data (messages, memories) to extract actionable insights
 */
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const log = createLogger('rocker-insights');
  log.startTimer();

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { threadId, lookback = 7 } = await req.json();

    // Get recent messages
    const { data: messages } = await supabaseClient
      .from('rocker_messages')
      .select('content, role, created_at')
      .eq('user_id', user.id)
      .gte('created_at', new Date(Date.now() - lookback * 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: true })
      .limit(100);

    // Get recent memories
    const { data: memories } = await supabaseClient
      .from('ai_user_memory')
      .select('key, value, type, confidence')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20);

    if (!messages || messages.length === 0) {
      return new Response(JSON.stringify({ insights: [], message: 'No data to analyze' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Build context
    const conversationSummary = messages.map(m => 
      `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content.slice(0, 200)}`
    ).join('\n');

    const memorySummary = memories?.map(m => 
      `${m.type}: ${m.key} = ${JSON.stringify(m.value).slice(0, 100)}`
    ).join('\n') || '';

    // Extract insights using AI
    log.info('[Insights] Analyzing conversation and memories...');
    
    const { text } = await ai.chat({
      role: 'knower',
      messages: [
        {
          role: 'system',
          content: `You are an AI insight analyzer. Analyze user data to find patterns, opportunities, and suggested actions.

Return JSON array of insights:
[
  {
    "type": "pattern" | "opportunity" | "reminder" | "task" | "risk",
    "title": "Brief title",
    "description": "What you observed",
    "action": "Suggested action (if any)",
    "priority": "low" | "medium" | "high",
    "confidence": 0.0-1.0
  }
]

Focus on:
- Recurring themes or problems
- Unfinished tasks or goals
- Important dates or commitments
- Skills or interests to develop
- Potential issues or risks`
        },
        {
          role: 'user',
          content: `Recent Conversations:\n${conversationSummary}\n\nMemories:\n${memorySummary}`
        }
      ],
      maxTokens: 1500,
      temperature: 0.3
    });

    // Parse insights
    let insights: any[] = [];
    try {
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        insights = JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      log.error('Failed to parse insights JSON', e);
      return new Response(JSON.stringify({ error: 'Failed to parse insights', raw: text }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Store insights in database
    const insightsToStore = insights.map(insight => ({
      user_id: user.id,
      type: insight.type || 'pattern',
      title: insight.title || 'Untitled',
      description: insight.description || '',
      action: insight.action || null,
      priority: insight.priority || 'medium',
      confidence: insight.confidence || 0.7,
      source: 'auto_analysis',
      metadata: {
        analyzed_messages: messages.length,
        analyzed_memories: memories?.length || 0,
        lookback_days: lookback
      }
    }));

    if (insightsToStore.length > 0) {
      const { error: insertError } = await supabaseClient
        .from('rocker_insights')
        .insert(insightsToStore);

      if (insertError) {
        log.error('Failed to store insights', insertError);
      } else {
        log.info(`[Insights] Stored ${insightsToStore.length} insights`);
      }
    }

    return new Response(
      JSON.stringify({
        insights: insightsToStore,
        summary: {
          total: insights.length,
          high_priority: insights.filter(i => i.priority === 'high').length,
          patterns: insights.filter(i => i.type === 'pattern').length,
          actions: insights.filter(i => i.action).length
        }
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    log.error('Insights extraction failed', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
