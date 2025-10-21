import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Generate 10 prediction questions for Andy to test his understanding
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { user_id, session_number } = await req.json();
    console.log('🎯 Generating Andy prediction game...', session_number);

    // Get user memories, Andy's research, and learning patterns
    const [memories, research, learnings, stats] = await Promise.all([
      supabase
        .from('rocker_long_memory')
        .select('id, kind, key, value')
        .eq('user_id', user_id)
        .order('updated_at', { ascending: false })
        .limit(50),
      supabase
        .from('andy_research')
        .select('id, topic, content')
        .eq('user_id', user_id)
        .order('created_at', { ascending: false })
        .limit(20),
      supabase
        .from('andy_learning_log')
        .select('learning_type, what_learned, confidence')
        .eq('user_id', user_id)
        .order('learned_at', { ascending: false })
        .limit(30),
      supabase
        .from('andy_prediction_stats')
        .select('*')
        .eq('user_id', user_id)
        .order('stat_date', { ascending: false })
        .limit(7)
    ]);

    const context = {
      memories: memories.data?.slice(0, 30).map(m => `[${m.kind}] ${m.key}: ${JSON.stringify(m.value).slice(0, 100)}`).join('\n'),
      research: research.data?.slice(0, 10).map(r => `${r.topic}: ${JSON.stringify(r.content).slice(0, 100)}`).join('\n'),
      learnings: learnings.data?.slice(0, 15).map(l => `[${l.learning_type}] ${l.what_learned}`).join('\n'),
      accuracy: stats.data?.[0]?.accuracy_rate || 0
    };

    console.log('🤖 Generating questions with AI...');
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${Deno.env.get('LOVABLE_API_KEY')}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        temperature: 0.7,
        messages: [
          {
            role: "system",
            content: `You are Andy testing your understanding of the user. Generate exactly 10 diverse questions.

For each question:
1. Pick an insight/pattern from their memories
2. Create a testable question (yes/no, multiple choice, or 1-5 scale)
3. Predict what they'll answer based on patterns
4. State your confidence (0.0-1.0)
5. Explain your reasoning

Current accuracy: ${Math.round((context.accuracy as number) * 100)}% - use this to calibrate difficulty.

Return JSON array:
[{
  "question": "...",
  "type": "yes_no|multiple_choice|scale_1_5",
  "options": ["option1", "option2"] or null,
  "prediction": "your predicted answer",
  "confidence": 0.0-1.0,
  "reasoning": "why you think this",
  "memory_ids": ["id1", "id2"]
}]`
          },
          {
            role: "user",
            content: `Memories:\n${context.memories}\n\nResearch:\n${context.research}\n\nLearnings:\n${context.learnings}`
          }
        ]
      })
    });

    const aiData = await aiResponse.json();
    let questions: any[] = [];
    
    try {
      const extracted = aiData?.choices?.[0]?.message?.content || "[]";
      const jsonMatch = extracted.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        questions = JSON.parse(jsonMatch[0]);
      }
    } catch (e) {
      console.error('Failed to parse questions:', e);
      return new Response(JSON.stringify({ error: 'Parse failed' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (questions.length === 0) {
      return new Response(JSON.stringify({ error: 'No questions generated' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Save game session
    const sessionId = crypto.randomUUID();
    const today = new Date().toISOString().split('T')[0];

    const gameRecords = questions.slice(0, 10).map((q, i) => ({
      user_id,
      game_session_id: sessionId,
      session_number: session_number || 1,
      game_date: today,
      question_number: i + 1,
      question_text: q.question,
      question_type: q.type || 'yes_no',
      options: q.options || null,
      andy_prediction: q.prediction,
      andy_confidence: q.confidence || 0.7,
      based_on_memories: q.memory_ids || [],
      based_on_analysis: q.reasoning || ''
    }));

    const { error: insertError } = await supabase
      .from('andy_prediction_game')
      .insert(gameRecords);

    if (insertError) throw insertError;

    console.log(`✅ Generated ${gameRecords.length} prediction questions`);

    return new Response(JSON.stringify({ 
      ok: true, 
      session_id: sessionId,
      questions: gameRecords.length,
      message: `Andy has ${gameRecords.length} questions ready to test his understanding!`
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('❌ Error in andy-prediction-game:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
