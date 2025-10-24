/**
 * Andy Iteration Engine
 * Executes one research pass from a specific angle
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const ANGLES = [
  "technical trend analysis",
  "psychology / behavior",
  "economic data",
  "competitive intelligence",
  "cultural narrative"
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { task } = await req.json();
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const angle = ANGLES[task.current_iteration % ANGLES.length];
    console.log(`[andy-iteration] Running iteration ${task.current_iteration + 1}/${task.total_iterations} with angle: ${angle}`);

    // Research from this angle using AI
    const results = await researchFromAngle(task.goal, angle);

    // Store iteration results
    await supabase.from('brain_iterations').insert({
      task_id: task.id,
      iteration_index: task.current_iteration + 1,
      angle,
      source_set: results.sources.join(', '),
      summary: results.summary,
      content: { findings: results.findings }
    });

    // Update task progress
    const done = task.current_iteration + 1 >= task.total_iterations;
    await supabase.from('brain_tasks').update({
      current_iteration: task.current_iteration + 1,
      status: done ? 'complete' : 'scheduled',
      next_run_at: done ? null : new Date(Date.now() + task.interval_seconds * 1000).toISOString()
    }).eq('id', task.id);

    // If complete, trigger synthesis
    if (done) {
      await supabase.functions.invoke('andy-synthesizer', {
        body: { taskId: task.id }
      });
    }

    return new Response(JSON.stringify({
      success: true,
      iteration: task.current_iteration + 1,
      angle,
      complete: done
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[andy-iteration] Error:', error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function researchFromAngle(goal: string, angle: string) {
  // Use Lovable AI for research
  const aiUrl = 'https://ai.gateway.lovable.dev/v1/chat/completions';
  const apiKey = Deno.env.get('XAI_API_KEY');

  try {
    const response = await fetch(aiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'openai/gpt-5-mini',
        messages: [
          {
            role: 'system',
            content: `You are a research analyst. Analyze from this perspective: ${angle}`
          },
          {
            role: 'user',
            content: `Research this goal: ${goal}\n\nProvide 3-5 key findings from the ${angle} perspective.`
          }
        ]
      })
    });

    const data = await response.json();
    const summary = data.choices?.[0]?.message?.content || `Analysis from ${angle} perspective of ${goal}`;

    return {
      summary,
      sources: ['internal_memory', 'ai_analysis', 'pattern_recognition'],
      findings: [summary]
    };
  } catch (error) {
    console.error('[researchFromAngle] Error:', error);
    return {
      summary: `Perspective: ${angle} → key findings about ${goal}`,
      sources: ['internal_memory'],
      findings: [`Analysis from ${angle} angle`]
    };
  }
}
