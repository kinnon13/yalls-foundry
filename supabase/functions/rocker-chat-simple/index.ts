import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { ai, type Message } from "../_shared/ai.ts";
import { rockerTools } from "./tools.ts";
import { executeTool } from "./executor-full.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const payload = await req.json().catch(() => ({}));
    const { message, thread_id } = payload as { message?: string; thread_id?: string };
    console.log('[rocker-chat-simple] incoming', { hasMessage: !!message, hasThread: !!thread_id });
    if (!message || typeof message !== 'string') {
      return new Response(JSON.stringify({ error: 'message is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization') || '' } } }
    );

    const { data: { user } } = await supabase.auth.getUser();

    // Persist user message when thread provided
    if (thread_id) {
      try {
        await supabase.from('rocker_messages').insert({
          thread_id,
          user_id: user?.id,
          role: 'user',
          content: message,
          meta: {},
        });
      } catch (e) {
        console.error('[rocker-chat-simple] failed to insert user message', e);
      }
    }

    // Fetch conversation history for context
    let conversationHistory: Message[] = [];
    if (thread_id) {
      const { data: history } = await supabase
        .from('rocker_messages')
        .select('role, content')
        .eq('thread_id', thread_id)
        .order('created_at', { ascending: true })
        .limit(20);
      conversationHistory = (history || []).map(h => ({
        role: h.role as 'user' | 'assistant' | 'system',
        content: h.content
      }));
    }

    // Determine actor role from user metadata (default: user)
    const { data: profile } = await supabase
      .from('ai_user_profiles')
      .select('actor_role')
      .eq('user_id', user?.id)
      .single();
    const actorRole = (profile?.actor_role || 'user') as 'user' | 'admin' | 'knower';

    // Persona-specific system prompts
    const systemPrompts: Record<string, string> = {
      user: 'You are User Rocker - friendly, helpful personal assistant. Focus on user tasks, preferences, and daily needs. Keep answers concise.',
      admin: 'You are Admin Rocker - professional oversight assistant. Focus on moderation, analytics, org-level tasks. Be precise and audit-focused.',
      knower: 'You are Super Andy - omniscient meta-cognitive AI. You have full system access, can orchestrate complex tasks, and self-improve. Think strategically.'
    };

    // Tool-calling loop with max 5 iterations
    let reply = '';
    let confidence = 1.0;
    let toolCallCount = 0;
    const maxToolCalls = 5;
    
    try {
      const messages: Message[] = [
        { role: 'system', content: systemPrompts[actorRole] || systemPrompts.user },
        ...conversationHistory,
        { role: 'user', content: message }
      ];

      while (toolCallCount < maxToolCalls) {
        const response = await ai.chat({
          role: actorRole,
          messages,
          tools: rockerTools.map(t => ({
            name: t.name,
            description: t.description,
            parameters: t.parameters
          })),
          temperature: 0.7
        });

        // Check if AI returned tool calls in raw response
        const toolCalls = response.raw?.choices?.[0]?.message?.tool_calls;
        if (toolCalls && toolCalls.length > 0) {
          console.log('[rocker-chat-simple] Tool calls requested:', toolCalls.length);
          
          // Execute each tool
          for (const toolCall of toolCalls) {
            const toolResult = await executeTool(
              supabase,
              user?.id || '',
              toolCall.function.name,
              JSON.parse(toolCall.function.arguments || '{}')
            );

            messages.push({
              role: 'assistant',
              content: '',
              name: toolCall.function.name
            });
            messages.push({
              role: 'tool',
              tool_call_id: toolCall.id,
              content: JSON.stringify(toolResult)
            });
          }
          
          toolCallCount++;
        } else {
          // No more tools, final response
          reply = response.text || '';
          break;
        }
      }

      // Detect low confidence
      if (/i don't know|i'm not sure|unclear|cannot help/i.test(reply)) {
        confidence = 0.3;
      }
    } catch (e) {
      console.error('[rocker-chat-simple] AI/tool execution failed:', e);
      confidence = 0;
      return new Response(JSON.stringify({ error: 'AI call failed' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Phase 2: Gap signal detection - log when confidence is low
    if (user?.id && confidence < 0.65) {
      try {
        await supabase.from('rocker_gap_signals').insert({
          user_id: user.id,
          kind: 'low_conf',
          query: message,
          score: confidence,
          meta: { thread_id, suggestedRefresh: true }
        });
        console.log('[rocker-chat-simple] Gap signal logged for low confidence');
      } catch (e) {
        console.error('[rocker-chat-simple] Failed to log gap signal:', e);
      }
    }

    // Phase 3: Auto-task detection - create tasks from action items
    if (user?.id && /action needed|todo|task|remind me|schedule|follow up/i.test(reply)) {
      try {
        const taskMatch = reply.match(/(?:action needed|todo|task|remind me|schedule|follow up)[:\s]+([^.!?]+)/i);
        if (taskMatch && taskMatch[1]) {
          const taskTitle = taskMatch[1].trim().slice(0, 100);
          await supabase.from('rocker_tasks').insert({
            user_id: user.id,
            title: taskTitle,
            status: 'pending',
            priority: 'medium',
            meta: { auto_created: true, source_message: message }
          });
          console.log('[rocker-chat-simple] Auto-created task:', taskTitle);
        }
      } catch (e) {
        console.error('[rocker-chat-simple] Failed to auto-create task:', e);
      }
    }

    // Persist assistant reply
    if (thread_id && reply) {
      try {
        await supabase.from('rocker_messages').insert({
          thread_id,
          user_id: user?.id,
          role: 'assistant',
          content: reply,
          meta: { confidence },
        });
      } catch (e) {
        console.error('[rocker-chat-simple] failed to insert assistant message', e);
      }
    }

    return new Response(JSON.stringify({ reply }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});