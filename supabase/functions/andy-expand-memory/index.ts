import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Continuously expand and connect memories
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { user_id } = await req.json();
    console.log('🧠 Expanding memory system for user:', user_id);

    // Get all memories
    const { data: memories } = await supabase
      .from('rocker_long_memory')
      .select('*')
      .eq('user_id', user_id)
      .order('updated_at', { ascending: false })
      .limit(100);

    if (!memories || memories.length < 2) {
      return new Response(JSON.stringify({ ok: true, message: 'Not enough memories to expand' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Build context from all memories
    const memoryContext = memories.map(m => 
      `[${m.kind}] ${m.key}: ${JSON.stringify(m.value)}`
    ).join('\n');

    console.log('🤖 Analyzing memory connections...');
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${Deno.env.get('LOVABLE_API_KEY')}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        temperature: 0.4,
        messages: [
          {
            role: "system",
            content: `Analyze this user's complete memory system. Find:
1. Hidden connections between memories
2. Patterns across different memory types
3. Gaps that need filling
4. Contradictions to resolve
5. Inferences you can make with high confidence
6. Timeline/causal relationships

Return JSON array of new synthetic memories:
[{
  "kind": "inference|connection|pattern|gap",
  "key": "brief_title",
  "value": {"insight": "...", "based_on": ["memory_key_1", "memory_key_2"], "confidence": 0.0-1.0},
  "priority": "high|medium|low"
}]`
          },
          {
            role: "user",
            content: `Memory system:\n${memoryContext}`
          }
        ]
      })
    });

    const aiData = await aiResponse.json();
    let expansions: any[] = [];
    
    try {
      const extracted = aiData?.choices?.[0]?.message?.content || "[]";
      const jsonMatch = extracted.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        expansions = JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      console.error('Failed to parse AI response:', e);
    }

    console.log(`📈 Generated ${expansions.length} memory expansions`);

    // Store high-confidence expansions
    let stored = 0;
    for (const exp of expansions) {
      if (!exp.key || !exp.value || (exp.value.confidence ?? 0) < 0.6) continue;

      const { error } = await supabase.from('rocker_long_memory').insert({
        user_id,
        kind: exp.kind || 'inference',
        key: exp.key,
        value: {
          ...exp.value,
          synthetic: true,
          generated_at: new Date().toISOString(),
          priority: exp.priority || 'medium'
        },
        memory_layer: 'synthetic'
      });

      if (!error) stored++;
    }

    // Also trigger deep analysis on recent knowledge
    const { data: recentKnowledge } = await supabase
      .from('rocker_knowledge')
      .select('id, content')
      .eq('user_id', user_id)
      .order('created_at', { ascending: false })
      .limit(5);

    if (recentKnowledge && recentKnowledge.length > 0) {
      console.log('🔍 Deep analyzing recent knowledge...');
      for (const k of recentKnowledge) {
        try {
          await supabase.functions.invoke('rocker-deep-analyze', {
            body: { content: k.content, user_id }
          });
        } catch (e) {
          console.warn('Knowledge deep analysis failed:', e);
        }
      }
    }

    return new Response(JSON.stringify({ 
      ok: true, 
      expansions_generated: expansions.length,
      stored,
      message: `Stored ${stored} new synthetic memories`
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('❌ Error in andy-expand-memory:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
