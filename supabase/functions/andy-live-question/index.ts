import { createClient } from "jsr:@supabase/supabase-js@2";
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper to check if Andy can ask questions
async function canAndyAsk(supabase: any, userId: string, threadId?: string) {
  const { data: p } = await supabase
    .from("ai_preferences")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  
  if (!p) return { ok: false, reason: "no_prefs" };

  const now = new Date();

  // Global snooze
  if (p.snoozed_until && new Date(p.snoozed_until) > now) {
    return { ok: false, reason: "global_snoozed" };
  }

  // DND window
  if (p.dnd_start && p.dnd_end) {
    const tzNow = new Date().toLocaleTimeString("en-US", { 
      hour12: false, 
      hour: "2-digit", 
      minute: "2-digit" 
    });
    const t = tzNow.substring(0, 5);
    if ((p.dnd_start < p.dnd_end && t >= p.dnd_start && t < p.dnd_end) ||
        (p.dnd_start > p.dnd_end && (t >= p.dnd_start || t < p.dnd_end))) {
      return { ok: false, reason: "dnd_window" };
    }
  }

  // Per-thread snooze
  if (threadId) {
    const { data: tp } = await supabase
      .from("ai_thread_prefs")
      .select("snoozed_until")
      .eq("user_id", userId)
      .eq("thread_id", threadId)
      .maybeSingle();
    
    if (tp?.snoozed_until && new Date(tp.snoozed_until) > now) {
      return { ok: false, reason: "thread_snoozed" };
    }
  }

  return { ok: true };
}

// Hash function for duplicate detection
function hashQuestion(text: string): string {
  return text.toLowerCase().replace(/[^\w\s]/g, '').trim();
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { thread_id } = await req.json();
    console.log('🤔 Andy live question check for thread:', thread_id);

    // Get thread
    const { data: thread } = await supabase
      .from('rocker_threads')
      .select('id, user_id')
      .eq('id', thread_id)
      .single();
    
    if (!thread) {
      return new Response(JSON.stringify({ error: 'Thread not found' }), { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Check if Andy can speak
    const gate = await canAndyAsk(supabase, thread.user_id, thread_id);
    if (!gate.ok) {
      console.log('⏸️ Andy skipping question:', gate.reason);
      return new Response(JSON.stringify({ skipped: true, reason: gate.reason }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Get AI preferences
    const { data: prefs } = await supabase
      .from('ai_preferences')
      .select('*')
      .eq('user_id', thread.user_id)
      .maybeSingle();
    
    if (!prefs?.super_mode) {
      return new Response(JSON.stringify({ skipped: true, reason: 'super_mode_off' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Check question cap per thread
    const { data: questionCount, count } = await supabase
      .from('ai_question_events')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', thread.user_id)
      .eq('thread_id', thread_id);
    
    if ((count || 0) >= (prefs.max_questions_per_thread || 5)) {
      console.log('🚫 Question cap reached for thread');
      return new Response(JSON.stringify({ capped: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Build context
    const { data: msgs } = await supabase
      .from('rocker_messages')
      .select('role, content')
      .eq('thread_id', thread_id)
      .order('created_at', { ascending: false })
      .limit(10);

    const { data: mems } = await supabase
      .from('rocker_long_memory')
      .select('kind, key, value')
      .eq('user_id', thread.user_id)
      .order('updated_at', { ascending: false })
      .limit(10);

    const context = [
      'Recent conversation:',
      ...(msgs ?? []).reverse().map(m => `[${m.role}] ${m.content}`),
      '',
      'Known about user:',
      ...(mems ?? []).map(m => `${m.kind} - ${m.key}: ${JSON.stringify(m.value)}`)
    ].join('\n');

    // Generate question via Lovable AI
    console.log('🤖 Generating question via AI...');
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
            content: "You are Andy, a proactive AI assistant. Ask ONE short, high-impact question (8-18 words) that moves the work forward. No preamble, no fluff. Be direct and actionable."
          },
          {
            role: "user",
            content: context
          }
        ]
      })
    });

    const aiData = await aiResponse.json();
    const question = aiData?.choices?.[0]?.message?.content?.slice(0, 200) || 
                    "What's the next action you want me to take?";

    // Check for duplicate
    const qHash = hashQuestion(question);
    const { data: existingQ } = await supabase
      .from('ai_question_events')
      .select('id')
      .eq('user_id', thread.user_id)
      .eq('question_hash', qHash)
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .maybeSingle();

    if (existingQ) {
      console.log('🔁 Duplicate question detected, skipping');
      return new Response(JSON.stringify({ skipped: true, reason: 'duplicate' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Save question to prevent duplicates
    await supabase.from('ai_question_events').insert({
      user_id: thread.user_id,
      thread_id,
      question_text: question,
      question_hash: qHash
    });

    // Post question to thread
    const { data: newMessage } = await supabase
      .from('rocker_messages')
      .insert({
        thread_id,
        role: 'assistant',
        content: `🤔 ${question}`
      })
      .select()
      .single();

    console.log('✅ Andy asked question:', question);

    return new Response(JSON.stringify({ 
      ok: true, 
      question,
      message_id: newMessage?.id 
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('❌ Error in andy-live-question:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
