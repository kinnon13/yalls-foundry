/**
 * Andy Task Step Executor
 * Breaks down complex tasks into steps and executes them progressively
 * When user asks Andy to research/analyze, this function handles iterative execution
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
    const { task_id, user_id, step_index } = await req.json();

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const xaiApiKey = Deno.env.get('XAI_API_KEY');
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('[andy-execute-task-step] Starting step', step_index, 'for task', task_id);

    // Load task details
    const { data: task } = await supabase
      .from('rocker_tasks')
      .select('*')
      .eq('id', task_id)
      .single();

    if (!task) {
      throw new Error('Task not found');
    }

    const steps = task.meta?.steps || [];
    const currentStep = steps[step_index];

    if (!currentStep) {
      throw new Error('Step not found');
    }

    console.log('[andy-execute-task-step] Executing:', currentStep.action);

    // Execute the step using AI
    let stepResult = '';

    if (xaiApiKey) {
      // Load user context for better results
      const { data: memories } = await supabase
        .from('rocker_long_memory')
        .select('kind, key, value')
        .eq('user_id', user_id)
        .limit(20);

      const context = memories?.map(m => 
        `[${m.kind}] ${m.key}: ${typeof m.value === 'string' ? m.value : JSON.stringify(m.value)}`
      ).join('\n') || '';

      const prompt = `You are Andy, executing step ${step_index + 1} of a multi-step task.

Task: ${task.title}
Step: ${currentStep.action}
Context: ${currentStep.context || 'None'}

User's relevant info:
${context}

Execute this step and provide detailed findings. Be thorough and specific.`;

      const aiResp = await fetch('https://api.x.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${xaiApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'grok-2-1212',
          messages: [
            { role: 'system', content: 'You are a helpful research assistant. Be detailed and thorough.' },
            { role: 'user', content: prompt }
          ],
          temperature: 0.7,
          max_tokens: 8000
        })
      });

      const aiData = await aiResp.json();
      stepResult = aiData.choices?.[0]?.message?.content || 'Step completed';
    } else {
      stepResult = `Step ${step_index + 1} executed: ${currentStep.action}`;
    }

    console.log('[andy-execute-task-step] Result length:', stepResult.length);

    // Update step status
    steps[step_index].completed = true;
    steps[step_index].result = stepResult;
    steps[step_index].completed_at = new Date().toISOString();

    // Save progress
    await supabase
      .from('rocker_tasks')
      .update({
        meta: {
          ...task.meta,
          steps,
          last_step_completed: step_index,
          progress: Math.round(((step_index + 1) / steps.length) * 100)
        }
      })
      .eq('id', task_id);

    // Save result to knowledge base
    await supabase.from('rocker_knowledge').insert({
      user_id,
      title: `${task.title} - Step ${step_index + 1}`,
      content: stepResult,
      source: 'andy_task_execution',
      tags: ['task', 'research', task_id]
    });

    // Notify user in chat
    await supabase.from('rocker_messages').insert({
      user_id,
      role: 'assistant',
      content: `✅ Completed step ${step_index + 1}/${steps.length}: ${currentStep.action}\n\n${stepResult.slice(0, 500)}${stepResult.length > 500 ? '...\n\n_Full results saved to Files & Memory_' : ''}`,
      meta: {
        task_id,
        step_index,
        type: 'task_progress'
      }
    });

    // If more steps remain, schedule next one
    if (step_index + 1 < steps.length) {
      console.log('[andy-execute-task-step] Scheduling next step...');
      
      // Trigger next step after short delay
      setTimeout(async () => {
        await supabase.functions.invoke('andy-execute-task-step', {
          body: { task_id, user_id, step_index: step_index + 1 }
        });
      }, 2000);
    } else {
      // Task complete!
      await supabase
        .from('rocker_tasks')
        .update({
          status: 'done',
          meta: { ...task.meta, completed_at: new Date().toISOString() }
        })
        .eq('id', task_id);

      await supabase.from('rocker_messages').insert({
        user_id,
        role: 'assistant',
        content: `🎉 Task complete! "${task.title}"\n\nAll ${steps.length} steps finished. Check Files & Memory for full results.`,
        meta: {
          task_id,
          type: 'task_complete'
        }
      });

      console.log('[andy-execute-task-step] Task complete!');
    }

    return new Response(JSON.stringify({
      success: true,
      step_completed: step_index,
      next_step: step_index + 1 < steps.length ? step_index + 1 : null,
      result: stepResult.slice(0, 200) + '...'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[andy-execute-task-step] Error:', error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
