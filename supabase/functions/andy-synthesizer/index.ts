/**
 * Andy Synthesizer
 * Combines all iteration results into one unified insight
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { taskId } = await req.json();
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('[andy-synthesizer] Synthesizing task:', taskId);

    // Fetch all iterations
    const { data: iterations, error: iterError } = await supabase
      .from('brain_iterations')
      .select('*')
      .eq('task_id', taskId)
      .order('iteration_index', { ascending: true });

    if (iterError) throw iterError;
    if (!iterations || iterations.length === 0) {
      return new Response(JSON.stringify({ error: 'No iterations found' }), { status: 400 });
    }

    // Get task info
    const { data: task } = await supabase
      .from('brain_tasks')
      .select('*')
      .eq('id', taskId)
      .single();

    // Combine summaries
    const combined = iterations
      .map((it: any) => `(${it.iteration_index}) [${it.angle}] → ${it.summary}`)
      .join('\n\n');

    // Generate unified insight using AI
    const insightText = await generateSynthesis(combined, task?.goal || 'Unknown goal');

    // Extract key points
    const keyPoints = insightText
      .split(/[.•-]/)
      .filter((s: string) => s.trim().length > 5)
      .slice(0, 6);

    // Generate embedding
    const embedding = await generateEmbedding(`${task?.task_name}\n${insightText}`);

    // Store insight
    await supabase.from('brain_insights').insert({
      user_id: task?.user_id,
      task_id: taskId,
      title: `Insight: ${task?.task_name || 'Research'}`,
      summary: keyPoints.slice(0, 2).join(' '),
      full_text: insightText,
      key_points: keyPoints,
      embedding: embedding
    });

    // Update task status
    await supabase.from('brain_tasks').update({
      status: 'synthesized'
    }).eq('id', taskId);

    console.log('[andy-synthesizer] ✅ Synthesized and archived insight for task:', taskId);

    return new Response(JSON.stringify({
      success: true,
      insight: insightText
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[andy-synthesizer] Error:', error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function generateSynthesis(combined: string, goal: string): Promise<string> {
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
            content: 'You are a synthesis expert. Combine multiple perspectives into one coherent insight.'
          },
          {
            role: 'user',
            content: `Goal: ${goal}\n\nMultiple perspectives:\n${combined}\n\nSynthesize these into one unified, actionable insight (3-5 sentences).`
          }
        ]
      })
    });

    const data = await response.json();
    return data.choices?.[0]?.message?.content || `Unified interpretation across perspectives: ${goal}`;
  } catch (error) {
    console.error('[generateSynthesis] Error:', error);
    return `Unified interpretation across all perspectives: ${goal}`;
  }
}

async function generateEmbedding(text: string): Promise<number[]> {
  const aiUrl = 'https://ai.gateway.lovable.dev/v1/embeddings';
  const apiKey = Deno.env.get('XAI_API_KEY');

  try {
    const response = await fetch(aiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'text-embedding-3-small',
        input: text
      })
    });

    const data = await response.json();
    return data.data?.[0]?.embedding || [];
  } catch (error) {
    console.error('[generateEmbedding] Error:', error);
    // Return a zero vector as fallback
    return Array(1536).fill(0);
  }
}
