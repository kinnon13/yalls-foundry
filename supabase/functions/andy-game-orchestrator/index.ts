import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Orchestrate the blinded prediction game
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { action, session_id, round_id, user_id, mode, rounds, answer_index, prediction_json, salt } = await req.json();

    console.log(`🎮 Game action: ${action}`);

    // CREATE SESSION
    if (action === 'create_session') {
      const { data: session, error } = await supabase
        .from('ai_game_sessions')
        .insert({ user_id, mode: mode || 'calibration', status: 'active' })
        .select()
        .single();

      if (error) throw error;

      return new Response(JSON.stringify({ session_id: session.id }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // GENERATE ROUND (question + commit)
    if (action === 'generate_round') {
      // Get session mode
      const { data: session } = await supabase
        .from('ai_game_sessions')
        .select('mode, user_id')
        .eq('id', session_id)
        .single();

      // Get round count
      const { count } = await supabase
        .from('ai_game_rounds')
        .select('*', { count: 'exact', head: true })
        .eq('session_id', session_id);

      const round_no = (count || 0) + 1;

      // Gather context for question generation
      const [memories, research, learnings, prevRounds] = await Promise.all([
        supabase
          .from('rocker_long_memory')
          .select('kind, key, value')
          .eq('user_id', session?.user_id)
          .order('updated_at', { ascending: false })
          .limit(30),
        supabase
          .from('andy_research')
          .select('topic, content')
          .eq('user_id', session?.user_id)
          .order('created_at', { ascending: false })
          .limit(15),
        supabase
          .from('andy_learning_log')
          .select('what_learned, confidence')
          .eq('user_id', session?.user_id)
          .order('learned_at', { ascending: false })
          .limit(20),
        supabase
          .from('ai_game_rounds')
          .select('question_text, kind')
          .eq('session_id', session_id)
          .order('round_no', { ascending: false })
          .limit(5)
      ]);

      const context = {
        memories: memories.data?.slice(0, 20).map(m => `[${m.kind}] ${m.key}: ${JSON.stringify(m.value).slice(0, 80)}`).join('\n') || '',
        research: research.data?.slice(0, 10).map(r => `${r.topic}: ${JSON.stringify(r.content).slice(0, 80)}`).join('\n') || '',
        learnings: learnings.data?.slice(0, 15).map(l => l.what_learned).join('\n') || '',
        prevQuestions: prevRounds.data?.map(r => r.question_text).join('\n') || ''
      };

      // Generate question with AI
      const prompt = session?.mode === 'domination'
        ? 'Generate a question where you are >95% confident of the answer based on the user patterns.'
        : 'Generate a question with maximum entropy (uncertainty) to learn the most about the user.';

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
              content: `You are Andy generating ONE prediction game question. ${prompt}

Return JSON:
{
  "kind": "yn|mcq|scale",
  "question": "...",
  "choices": ["option1", "option2", ...] or null for yn/scale,
  "prediction": {
    "choice": <index>,
    "probs": [0.1, 0.7, 0.2, ...]
  }
}

Probabilities must sum to 1.0. Avoid questions similar to: ${context.prevQuestions}`
            },
            {
              role: "user",
              content: `Memories:\n${context.memories}\n\nResearch:\n${context.research}\n\nLearnings:\n${context.learnings}`
            }
          ]
        })
      });

      const aiData = await aiResponse.json();
      const content = aiData?.choices?.[0]?.message?.content || "{}";
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      const questionData = jsonMatch ? JSON.parse(jsonMatch[0]) : null;

      if (!questionData || !questionData.prediction) {
        throw new Error('Failed to generate question');
      }

      // Create round
      const { data: round, error: roundError } = await supabase
        .from('ai_game_rounds')
        .insert({
          session_id,
          round_no,
          kind: questionData.kind,
          question_text: questionData.question,
          choices: questionData.choices,
          created_by: 'ai',
          state: 'awaiting_commit'
        })
        .select()
        .single();

      if (roundError) throw roundError;

      // Generate salt and commit hash
      const saltBytes = crypto.getRandomValues(new Uint8Array(24));
      const saltHex = Array.from(saltBytes).map(b => b.toString(16).padStart(2, '0')).join('');
      
      const predictionStr = JSON.stringify(questionData.prediction);
      const hashInput = predictionStr + saltHex;
      const hashBuffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(hashInput));
      const commitHash = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');

      // Store commit
      await supabase
        .from('ai_prediction_commits')
        .insert({ round_id: round.id, commit_hash: commitHash });

      // Update round state
      await supabase
        .from('ai_game_rounds')
        .update({ state: 'awaiting_answer' })
        .eq('id', round.id);

      // Store salt in temp storage (use env variable storage pattern)
      const saltKey = `game_salt_${round.id}`;
      
      return new Response(JSON.stringify({
        round_id: round.id,
        round_no,
        kind: questionData.kind,
        question: questionData.question,
        choices: questionData.choices,
        commit_hash: commitHash,
        salt: saltHex,
        prediction: questionData.prediction
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // SUBMIT ANSWER
    if (action === 'submit_answer') {
      const { error } = await supabase
        .from('ai_user_answers')
        .insert({ round_id, answer_index });

      if (error) throw error;

      await supabase
        .from('ai_game_rounds')
        .update({ state: 'awaiting_reveal' })
        .eq('id', round_id);

      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // REVEAL & SCORE
    if (action === 'reveal_and_score') {
      if (!prediction_json || !salt) {
        throw new Error('Missing prediction_json or salt');
      }

      // Call reveal function
      const { error: revealError } = await supabase.rpc('sp_reveal_prediction', {
        p_round_id: round_id,
        p_prediction_json: prediction_json,
        p_salt: salt
      });

      if (revealError) throw revealError;

      // Score the round
      const { error: scoreError } = await supabase.rpc('sp_score_round', {
        p_round_id: round_id
      });

      if (scoreError) throw scoreError;

      // Get score
      const { data: score } = await supabase
        .from('ai_round_scores')
        .select('*')
        .eq('round_id', round_id)
        .single();

      return new Response(JSON.stringify({ ok: true, score }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // GET SESSION STATS
    if (action === 'get_stats') {
      const { data: rounds } = await supabase
        .from('ai_game_rounds')
        .select(`
          id,
          round_no,
          state,
          ai_round_scores (
            correct,
            confidence,
            brier,
            log_loss
          )
        `)
        .eq('session_id', session_id)
        .order('round_no');

      const scored = rounds?.filter(r => r.ai_round_scores?.length > 0) || [];
      const accuracy = scored.length > 0 
        ? scored.filter(r => r.ai_round_scores[0]?.correct).length / scored.length 
        : 0;
      
      const avgConfidence = scored.length > 0
        ? scored.reduce((sum, r) => sum + Number(r.ai_round_scores[0]?.confidence || 0), 0) / scored.length
        : 0;

      const avgBrier = scored.length > 0
        ? scored.reduce((sum, r) => sum + (r.ai_round_scores[0]?.brier || 0), 0) / scored.length
        : 0;

      const avgLogLoss = scored.length > 0
        ? scored.reduce((sum, r) => sum + (r.ai_round_scores[0]?.log_loss || 0), 0) / scored.length
        : 0;

      return new Response(JSON.stringify({
        total_rounds: rounds?.length || 0,
        scored_rounds: scored.length,
        accuracy: Math.round(accuracy * 100),
        avg_confidence: Math.round(avgConfidence * 100),
        avg_brier: avgBrier.toFixed(3),
        avg_log_loss: avgLogLoss.toFixed(3),
        per_round: scored.map(r => ({
          round_no: r.round_no,
          correct: r.ai_round_scores[0]?.correct,
          confidence: Number(r.ai_round_scores[0]?.confidence),
          brier: r.ai_round_scores[0]?.brier,
          log_loss: r.ai_round_scores[0]?.log_loss
        }))
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ error: 'Unknown action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('❌ Error in game orchestrator:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
