import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const authHeader = req.headers.get('Authorization');
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader?.replace('Bearer ', '') || ''
    );

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { topic } = await req.json();
    if (!topic) {
      return new Response(JSON.stringify({ error: 'Topic required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('[andy-write-note] Researching topic:', topic);

    // Generate detailed report using AI
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        temperature: 0.7,
        messages: [
          {
            role: 'system',
            content: `You are Super Andy, a highly analytical AI assistant. Write detailed, actionable reports on technical topics. Structure your report with:
1. Executive Summary (2-3 sentences)
2. Key Findings (bullet points)
3. Detailed Analysis (paragraphs)
4. Recommendations (actionable steps)
5. Follow-up Questions (2-3)

Be specific, cite examples, and focus on practical insights.`
          },
          {
            role: 'user',
            content: `Research and write a detailed report about: ${topic}`
          }
        ],
        max_tokens: 2000,
      }),
    });

    if (!aiResponse.ok) {
      throw new Error(`AI request failed: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices[0].message.content;

    // Determine note type and priority based on content
    let note_type: 'report' | 'finding' | 'suggestion' | 'analysis' = 'report';
    let priority: 'low' | 'medium' | 'high' | 'critical' = 'medium';
    
    if (content.toLowerCase().includes('security') || content.toLowerCase().includes('critical')) {
      priority = 'high';
    }
    if (content.toLowerCase().includes('bug') || content.toLowerCase().includes('issue')) {
      note_type = 'finding';
      priority = 'high';
    }
    if (content.toLowerCase().includes('suggest') || content.toLowerCase().includes('recommend')) {
      note_type = 'suggestion';
    }

    // Store the note
    const { data: note, error: insertError } = await supabase
      .from('andy_notes')
      .insert({
        user_id: user.id,
        topic,
        title: `Report: ${topic}`,
        content,
        note_type,
        priority,
        tags: [topic.toLowerCase().split(' ')[0]],
      })
      .select()
      .single();

    if (insertError) throw insertError;

    // Auto-create follow-up task if priority is high or critical
    if (priority === 'high' || priority === 'critical') {
      await supabase
        .from('rocker_tasks_v2')
        .insert({
          user_id: user.id,
          title: `Review: ${topic}`,
          status: 'open',
          due_at: new Date(Date.now() + 24 * 3600000).toISOString(), // 24h from now
        });
    }

    console.log('[andy-write-note] Note created:', note.id);

    return new Response(JSON.stringify({
      success: true,
      note_id: note.id,
      title: note.title,
      priority: note.priority,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('[andy-write-note] Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
