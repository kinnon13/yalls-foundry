import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
  );

  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { thread_id, message } = await req.json();
    
    if (!message) {
      return new Response(JSON.stringify({ error: 'Missing message' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Load runtime config with sane defaults
    const defaultCfg = { alpha: 0.7, retrieve_k: 20, keep_k: 5, sim_threshold: 0.65 };
    const { data: cfgRow } = await supabase.from('rocker_config').select('*').eq('id', 1).maybeSingle();
    const cfg = { ...defaultCfg, ...(cfgRow || {}) };

    // Embed the user message for semantic search
    let qvec: number[] = [];
    try {
      const embedResp = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ model: 'text-embedding-3-small', input: message })
      });
      if (embedResp.ok) {
        const embedData = await embedResp.json();
        qvec = embedData.data[0].embedding;
      }
    } catch (e) {
      console.error('Embedding failed:', e);
    }

    // Hybrid retrieval (vector + lexical + boosts)
    let hits: any[] = [];
    let memoryContext = '';
    try {
      const { data, error } = await supabase.rpc('search_hybrid', {
        q_vec: qvec,
        q_text: message,
        k: cfg.retrieve_k,
        alpha: cfg.alpha,
        thread: thread_id || null
      });
      if (error) throw error;
      hits = (data || []).slice(0, cfg.keep_k);
    } catch (e) {
      console.error('Hybrid search failed, trying vector-only:', e);
      // Fallback to vector-only if hybrid fails
      const { data } = await supabase.rpc('match_rocker_memory_vec', {
        q: qvec,
        match_count: cfg.retrieve_k,
        thread: thread_id || null
      });
      if (data?.length) hits = data.slice(0, cfg.keep_k);
    }

    // Build knowledge context with citations
    if (hits && hits.length > 0) {
      memoryContext = '\n\n🧠 From embedded knowledge:\n' + hits.map((h: any) => 
        `[#${h.chunk_index}] ${String(h.content || '').slice(0, 500)}`
      ).join('\n\n');
    }

    // Confidence gating: if weak signal, ask for clarity instead of bluffing
    const confident = hits.length >= 2 && (hits[0]?.score ?? hits[0]?.similarity ?? 1) >= cfg.sim_threshold;
    if (!confident && qvec.length > 0) {
      const clarifyReply = "I might need a bit more detail. Should I focus on a time range, a person, or a specific doc/thread? You can also say 'summarize thread 26' or paste a link.";
      
      await supabase.from('rocker_messages').insert([
        { thread_id, user_id: user.id, role: 'user', content: message, meta: {} },
        { thread_id, user_id: user.id, role: 'assistant', content: clarifyReply, meta: { confidence: 'low', sources: [] } }
      ]);

      return new Response(
        JSON.stringify({ reply: clarifyReply, sources: [], tool_results: [] }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if super admin has calendar access enabled
    const { data: adminSettings } = await supabase
      .from('super_admin_settings')
      .select('allow_calendar_access')
      .eq('user_id', user.id)
      .maybeSingle();

    // Load upcoming calendar events if enabled
    let calendarContext = '';
    if (adminSettings?.allow_calendar_access) {
      const { data: events } = await supabase
        .from('events')
        .select('id, title, starts_at, ends_at, description')
        .gte('starts_at', new Date().toISOString())
        .lte('starts_at', new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString())
        .order('starts_at', { ascending: true })
        .limit(5);

      if (events && events.length > 0) {
        calendarContext = '\n\nUpcoming calendar events (next 7 days):\n' + events.map((e: any, i: number) => 
          `[Event ${i+1}] ${e.title} - ${new Date(e.starts_at).toLocaleString()}${e.description ? ': ' + e.description : ''}`
        ).join('\n');
      }
    }

    // Get conversation history
    const { data: history } = await supabase
      .from("rocker_messages")
      .select("role, content")
      .eq("thread_id", thread_id)
      .order("created_at", { ascending: true })
      .limit(10);

    const systemPrompt = `You are Super Rocker, a helpful AI assistant.

- TL;DR first, then details
- Cite sources with [#chunk_index] when referencing embedded knowledge
- Format tasks as "todo: [action]" to auto-create them
- End responses with a "Next actions:" list when appropriate
${calendarContext ? '- Leverage calendar context for prep, reminders, and follow-ups' : ''}
- When given URLs, you can fetch and summarize them`;

    let reply = "I'm here to help! How can I assist you?";
    
    // Detect URL in message for web fetch
    const urlMatch = message.match(/https?:\/\/[^\s]+/);
    if (urlMatch) {
      const urlToFetch = urlMatch[0];
      try {
        const { data: fetchResult, error: fetchError } = await supabase.functions.invoke('rocker-fetch-url', {
          body: { url: urlToFetch }
        });

        if (fetchError) {
          reply = `I tried to fetch ${urlToFetch} but got an error: ${fetchError.message}`;
        } else if (fetchResult?.error) {
          reply = `Couldn't access that URL: ${fetchResult.error}`;
        } else {
          // Add fetched content to memory context
          memoryContext += `\n\n[Fetched from ${fetchResult.title || urlToFetch}]:\n${fetchResult.text?.slice(0, 2000)}...`;
        }
      } catch (e) {
        console.error('Web fetch failed:', e);
      }
    }

    try {
      const aiMessages = [
        { role: "system", content: systemPrompt + memoryContext + calendarContext },
        ...(history || []).map((m: any) => ({ role: m.role, content: m.content })),
        { role: "user", content: message }
      ];

      const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');

      if (OPENAI_API_KEY) {
        const aiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${OPENAI_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            messages: aiMessages,
            max_tokens: 400,
          }),
        });

        if (aiResponse.ok) {
          const data = await aiResponse.json();
          reply = data.choices?.[0]?.message?.content || reply;
        }
      } else if (LOVABLE_API_KEY) {
        const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash",
            messages: aiMessages,
          }),
        });

        if (aiResponse.ok) {
          const data = await aiResponse.json();
          reply = data.choices?.[0]?.message?.content || reply;
        }
      }
    } catch (aiError) {
      console.error("AI error:", aiError);
    }

    // Save messages with source tracking
    const messageSources = hits?.map((h: any) => ({ 
      id: h.id, 
      chunk_index: h.chunk_index, 
      score: h.score ?? h.similarity 
    })) || [];
    
    const { error: insertError } = await supabase.from("rocker_messages").insert([
      {
        thread_id,
        user_id: user.id,
        role: "user",
        content: message,
        meta: {}
      },
      {
        thread_id,
        user_id: user.id,
        role: "assistant",
        content: reply,
        meta: { sources: messageSources }
      },
    ]);

    if (insertError) {
      console.error('Failed to save messages:', insertError);
    }

    // Log to action ledger for learning
    await supabase.from('ai_action_ledger').insert({
      user_id: user.id,
      agent: 'rocker',
      action: 'chat_turn',
      input: { message, thread_id },
      output: {
        reply,
        retrieved_ids: hits?.map((h: any) => h.id) || [],
        scores: hits?.map((h: any) => h.score ?? h.similarity) || []
      },
      result: 'success'
    });

    // Auto-task detection
    const todoMatch = reply.match(/todo:\s*(.+?)(?:\n|$)/i);
    if (todoMatch) {
      const taskTitle = todoMatch[1].trim().slice(0, 240);
      await supabase.from("rocker_tasks").insert({
        user_id: user.id,
        thread_id,
        title: taskTitle,
        status: 'open'
      });
    }

    // Collect tool results for UI feedback
    const toolResults = [];
    if (urlMatch) {
      toolResults.push({ tool: 'web_fetch', result: 'Fetched URL' });
    }
    if (todoMatch) {
      toolResults.push({ tool: 'create_task', result: `Created: ${todoMatch[1].slice(0, 40)}...` });
    }

    return new Response(
      JSON.stringify({ reply, sources: messageSources, tool_results: toolResults }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Chat error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
