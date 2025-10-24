/**
 * Andy Weekly Reflection
 * Generates a journal-style summary of memory changes
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

    console.log('[andy-reflection] Generating weekly memory reflection...');

    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    // Get all insights updated in the last week
    const { data: insights } = await supabase
      .from('brain_insights')
      .select('*')
      .gte('updated_at', weekAgo);

    const reinforced = insights?.filter((m: any) => m.memory_strength >= 0.8) || [];
    const decayed = insights?.filter((m: any) => m.memory_strength < 0.3) || [];
    const newOnes = insights?.filter((m: any) => new Date(m.created_at).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000) || [];

    // Generate reflection summary
    const summary = await generateReflection({
      reinforced,
      decayed,
      newOnes
    });

    // Store reflection for all users (or could be per-user)
    const { data: users } = await supabase.auth.admin.listUsers();
    
    if (users && users.users.length > 0) {
      for (const user of users.users) {
        await supabase.from('brain_reflections').insert({
          user_id: user.id,
          summary,
          reinforced_count: reinforced.length,
          decayed_count: decayed.length,
          new_insights: newOnes.length
        });
      }
    }

    console.log('[andy-reflection] ✅ Generated weekly reflection');

    return new Response(JSON.stringify({
      success: true,
      summary,
      stats: {
        reinforced: reinforced.length,
        decayed: decayed.length,
        new: newOnes.length
      }
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[andy-reflection] Error:', error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function generateReflection(data: {
  reinforced: any[];
  decayed: any[];
  newOnes: any[];
}): Promise<string> {
  const { reinforced, decayed, newOnes } = data;
  
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
            content: 'You are Andy, writing your weekly memory journal. Be reflective and insightful.'
          },
          {
            role: 'user',
            content: `This week:
- Reinforced ${reinforced.length} insights: ${reinforced.slice(0, 2).map(m => m.title).join(', ')}
- ${decayed.length} insights faded: ${decayed.slice(0, 2).map(m => m.title).join(', ')}
- Gained ${newOnes.length} new insights

Write a brief (3-4 sentences) reflective journal entry about this week's learning.`
          }
        ]
      })
    });

    const aiData = await response.json();
    return aiData.choices?.[0]?.message?.content || generateFallbackReflection(data);
  } catch (error) {
    console.error('[generateReflection] Error:', error);
    return generateFallbackReflection(data);
  }
}

function generateFallbackReflection(data: { reinforced: any[]; decayed: any[]; newOnes: any[] }): string {
  const { reinforced, decayed, newOnes } = data;
  
  let text = `This week I reinforced ${reinforced.length} insights`;
  if (reinforced.length > 0) {
    text += `, including "${reinforced[0].title}"`;
  }
  text += '. ';
  
  if (decayed.length > 0) {
    text += `I noticed ${decayed.length} fading memories that may need revisiting. `;
  }
  
  if (newOnes.length > 0) {
    text += `I gained ${newOnes.length} new insights that expand my understanding. `;
  }
  
  text += 'Overall, my memory balance indicates steady learning momentum.';
  
  return text;
}
