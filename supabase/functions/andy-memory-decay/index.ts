/**
 * Andy Memory Decay & Reinforcement
 * Runs every 6 hours to decay old memories and reinforce relevant ones
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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('[andy-memory-decay] Starting memory decay process...');

    // Apply decay function
    const { error: decayError } = await supabase.rpc('decay_brain_memory');
    if (decayError) throw decayError;

    // Find weak memories for potential reinforcement
    const { data: weakMemories } = await supabase
      .from('brain_insights')
      .select('*')
      .lt('memory_strength', 0.25)
      .order('memory_strength', { ascending: true })
      .limit(5);

    let reinforced = 0;

    if (weakMemories && weakMemories.length > 0) {
      for (const memory of weakMemories) {
        // Check if memory is still relevant
        const isRelevant = await checkRelevance(memory, supabase);
        
        if (isRelevant) {
          // Reinforce the memory
          await supabase
            .from('brain_insights')
            .update({
              memory_strength: Math.min(1.0, memory.memory_strength + 0.3),
              last_recalled_at: new Date().toISOString()
            })
            .eq('id', memory.id);

          reinforced++;
          console.log('[andy-memory-decay] Reinforced memory:', memory.title);
        }
      }
    }

    return new Response(JSON.stringify({
      success: true,
      reinforced,
      weakMemoriesChecked: weakMemories?.length || 0
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[andy-memory-decay] Error:', error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function checkRelevance(memory: any, supabase: any): Promise<boolean> {
  try {
    // Check if there are recent tasks related to this memory's topic
    const { data: recentTasks } = await supabase
      .from('brain_tasks')
      .select('goal, task_name')
      .gte('created_at', new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString())
      .limit(10);

    if (!recentTasks || recentTasks.length === 0) return false;

    // Simple relevance check: see if memory title appears in recent task goals
    const memoryTitleLower = memory.title.toLowerCase();
    const isRelevant = recentTasks.some((task: any) => 
      task.goal?.toLowerCase().includes(memoryTitleLower.split(':')[0].trim().toLowerCase())
    );

    return isRelevant;
  } catch (error) {
    console.error('[checkRelevance] Error:', error);
    return Math.random() > 0.5; // Fallback to random
  }
}
