import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Andy analyzes and enhances user memories with his own research and learning
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { user_id, memory_id, knowledge_id, content } = await req.json();
    console.log('🧠 Andy enhancing memory/knowledge...');

    // Get existing learning patterns for this user
    const { data: learnings } = await supabase
      .from('andy_learning_log')
      .select('learning_type, what_learned, confidence')
      .eq('user_id', user_id)
      .order('learned_at', { ascending: false })
      .limit(20);

    const learningContext = learnings?.map(l => 
      `[${l.learning_type}] ${l.what_learned} (confidence: ${l.confidence})`
    ).join('\n') || '';

    // Analyze and enhance the content
    console.log('🤖 Analyzing with Andy\'s learned patterns...');
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${Deno.env.get('LOVABLE_API_KEY')}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        temperature: 0.3,
        messages: [
          {
            role: "system",
            content: `You are Andy's enhancement engine. Analyze this content and enhance it using:
1. Deep categorization (main category + 3-5 micro-categories)
2. Hidden connections to other concepts
3. Temporal/causal relationships
4. Missing context that would help understanding
5. Research angles worth exploring

Your previous learnings about this user's thinking style:
${learningContext}

Return JSON:
{
  "categories": {
    "primary": "...",
    "micro": ["...", "..."],
    "temporal": "past|present|future|ongoing"
  },
  "connections": [{"to": "...", "type": "...", "strength": 0.0-1.0}],
  "missing_context": ["..."],
  "research_angles": ["..."],
  "enhanced_understanding": "...",
  "user_thinking_style": "...",
  "learning_to_record": {"what": "...", "why": "...", "type": "..."}
}`
          },
          { role: "user", content }
        ]
      })
    });

    const aiData = await aiResponse.json();
    let enhancement: any = {};
    
    try {
      const extracted = aiData?.choices?.[0]?.message?.content || "{}";
      const jsonMatch = extracted.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        enhancement = JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      console.error('Failed to parse enhancement:', e);
      return new Response(JSON.stringify({ error: 'Parse failed' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Store Andy's enhancement
    const { data: enhancementRecord, error: enhError } = await supabase
      .from('andy_memory_enhancements')
      .insert({
        user_id,
        source_memory_id: memory_id || null,
        source_knowledge_id: knowledge_id || null,
        enhancement_type: 'categorization',
        original_content: content,
        enhanced_content: enhancement,
        reasoning: `Applied learned patterns: ${learnings?.length || 0} learnings analyzed`,
        confidence: 0.8
      })
      .select()
      .single();

    if (enhError) throw enhError;

    // Record what Andy learned from this enhancement
    if (enhancement.learning_to_record) {
      const learning = enhancement.learning_to_record;
      await supabase.from('andy_learning_log').insert({
        user_id,
        learned_at: new Date().toISOString(),
        learning_type: learning.type || 'categorization',
        what_learned: learning.what,
        from_content: content.slice(0, 200),
        source_id: memory_id || knowledge_id,
        source_type: memory_id ? 'memory' : 'knowledge',
        confidence: 0.7
      });
    }

    // Store Andy's research on interesting angles
    if (enhancement.research_angles && enhancement.research_angles.length > 0) {
      await supabase.from('andy_research').insert({
        user_id,
        research_type: 'deep_dive',
        topic: enhancement.categories?.primary || 'general',
        content: {
          angles: enhancement.research_angles,
          context: content.slice(0, 300),
          categories: enhancement.categories,
          timestamp: new Date().toISOString()
        },
        source_memory_ids: memory_id ? [memory_id] : [],
        metadata: { auto_generated: true }
      });
    }

    return new Response(JSON.stringify({ 
      ok: true, 
      enhancement: enhancementRecord,
      learned_new_pattern: !!enhancement.learning_to_record,
      research_created: enhancement.research_angles?.length > 0
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('❌ Error in andy-enhance-memories:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
