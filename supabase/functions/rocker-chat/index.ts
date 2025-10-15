import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.0";
import { rateLimit } from "../_shared/rate-limit.ts";
import { USER_SYSTEM_PROMPT, buildUserContext } from "./prompts.ts";
import { extractLearningsFromConversation } from "./learning.ts";
import { aggregatePatternsAndAnalytics } from "./analytics.ts";
import { TOOL_DEFINITIONS } from "./tools/definitions.ts";
import { executeTool } from "./tools/executor.ts";

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not configured');
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Apply rate limiting (10 requests per minute per user)
    const rateLimitResult = await rateLimit(req, user.id, {
      limit: 10,
      windowSec: 60,
      prefix: 'ratelimit:rocker-chat'
    });

    if (rateLimitResult instanceof Response) {
      return rateLimitResult;
    }

    const reqClone = req.clone();
    const body = await reqClone.json();
    const { messages, sessionId: requestedSessionId } = body;

    // Build user context from profile, memory, and analytics
    let userContext = `\n\n**CURRENT USER:**\n- User ID: ${user.id}\n- Email: ${user.email || 'Not provided'}`;

    try {
      const { data: profile } = await supabaseClient
        .from('profiles')
        .select('display_name, bio')
        .eq('user_id', user.id)
        .maybeSingle();

      const { data: memoryData } = await supabaseClient.functions.invoke('rocker-memory', {
        body: {
          action: 'search_memory',
          limit: 25  // Increased from 10 to give AI more context about the user
        }
      });

      const { data: analytics } = await supabaseClient
        .from('ai_user_analytics')
        .select('*')
        .eq('user_id', user.id)
        .order('calculated_at', { ascending: false })
        .limit(5);

      userContext += buildUserContext(profile, memoryData?.memories || [], analytics || []);
    } catch (err) {
      console.warn('Failed to load user context:', err);
    }

    // Build system prompt with user context
    const systemPrompt = USER_SYSTEM_PROMPT + userContext;
    
    let conversationHistory: any[] = [];
    
    if (requestedSessionId) {
      // Load specific session (all messages)
      const { data: sessionMessages } = await supabaseClient
        .from('rocker_conversations')
        .select('role, content, created_at')
        .eq('user_id', user.id)
        .eq('session_id', requestedSessionId)
        .order('created_at', { ascending: true });
      
      conversationHistory = (sessionMessages || []).map((msg: any) => ({
        role: msg.role,
        content: msg.content
      }));
    } else {
      // Load recent messages across all sessions (last 20 for context)
      const { data: recentConversations } = await supabaseClient
        .from('rocker_conversations')
        .select('role, content')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      conversationHistory = (recentConversations || []).reverse().map((msg: any) => ({
        role: msg.role,
        content: msg.content
      }));
    }

    // Use provided session ID or create new one
    const sessionId = requestedSessionId || crypto.randomUUID();
    const isNewSession = !requestedSessionId;

    if (messages.length > 0) {
      const lastUserMessage = messages[messages.length - 1];
      const { error: insertError } = await supabaseClient
        .from('rocker_conversations')
        .insert({
          user_id: user.id,
          session_id: sessionId,
          role: 'user',
          content: lastUserMessage.content,
          metadata: { timestamp: new Date().toISOString() }
        });
      
      if (insertError) {
        console.error('[Conversation] Failed to save user message:', insertError);
      }

      // For new sessions, create metadata entry
      if (isNewSession) {
        const { error: metaError } = await supabaseClient
          .from('conversation_sessions')
          .insert({
            user_id: user.id,
            session_id: sessionId,
            title: lastUserMessage.content.slice(0, 60) + (lastUserMessage.content.length > 60 ? '...' : ''),
            summary: null
          });
        
        if (metaError) {
          console.error('[Conversation] Failed to create session metadata:', metaError);
        }
      }
    }

    // Tool calling loop - include conversation history for context
    let conversationMessages = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory.slice(-5),  // Include last 5 historical messages for context
      ...messages
    ];

    let maxIterations = 5;
    let iterations = 0;

    while (iterations < maxIterations) {
      iterations++;

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: conversationMessages,
          tools: TOOL_DEFINITIONS,
          stream: false
        }),
      });

      if (!response.ok) {
        if (response.status === 429) {
          return new Response(JSON.stringify({ error: "OpenAI rate limits exceeded, please try again later." }), {
            status: 429,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        const errorText = await response.text();
        console.error('OpenAI API error:', response.status, errorText);
        throw new Error('OpenAI API error');
      }

      const completion = await response.json();
      const assistantMessage = completion.choices[0].message;

      // Check if AI wants to call tools
      if (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
        // Add assistant message with tool calls
        conversationMessages.push(assistantMessage);

        // Execute each tool
        for (const toolCall of assistantMessage.tool_calls) {
          const toolName = toolCall.function.name;
          const toolArgs = JSON.parse(toolCall.function.arguments);

          const result = await executeTool(toolName, toolArgs, supabaseClient, user.id);

          // Add tool result
          conversationMessages.push({
            role: 'tool',
            tool_call_id: toolCall.id,
            content: JSON.stringify(result)
          });
        }

        // Continue loop to get AI's response with tool results
        continue;
      } else {
        // No more tool calls, save assistant response
        const { error: saveError } = await supabaseClient
          .from('rocker_conversations')
          .insert({
            user_id: user.id,
            session_id: sessionId,
            role: 'assistant',
            content: assistantMessage.content,
            metadata: {
              timestamp: new Date().toISOString(),
              iterations
            }
          });

        if (saveError) {
          console.error('[Conversation] Failed to save assistant message:', saveError);
        }

        // Extract learnings from conversation
        await extractLearningsFromConversation(
          supabaseClient,
          user.id,
          messages[messages.length - 1]?.content || '',
          assistantMessage.content
        );

        // Aggregate patterns and analytics (async, don't block response)
        setTimeout(() => {
          aggregatePatternsAndAnalytics(supabaseClient, user.id).catch(err =>
            console.error('[Analytics] Background job failed:', err)
          );
        }, 0);

        // Generate summary for the conversation (after a few messages)
        if (isNewSession && conversationMessages.length >= 4) {
          try {
            const summaryPrompt = `Summarize this conversation in one brief sentence (max 100 chars): ${conversationMessages.slice(-4).map(m => `${m.role}: ${m.content}`).join('\n')}`;
            const summaryResponse = await fetch('https://api.openai.com/v1/chat/completions', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${OPENAI_API_KEY}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                model: 'gpt-4o-mini',
                messages: [{ role: 'system', content: summaryPrompt }],
                max_tokens: 50
              }),
            });

            if (summaryResponse.ok) {
              const summaryData = await summaryResponse.json();
              const summary = summaryData.choices[0].message.content;
              
              await supabaseClient
                .from('conversation_sessions')
                .update({ summary })
                .eq('session_id', sessionId);
            }
          } catch (err) {
            console.error('[Summary] Failed to generate summary:', err);
          }
        }

        // Build response
        const response: any = {
          content: assistantMessage.content,
          role: 'assistant',
          sessionId: sessionId
        };

        // Check if navigation was called
        const navigationCalls = conversationMessages
          .filter(m => m.role === 'assistant' && m.tool_calls)
          .flatMap(m => m.tool_calls || [])
          .filter((tc: any) => tc.function.name === 'navigate');

        if (navigationCalls.length > 0) {
          const lastNavCall = navigationCalls[navigationCalls.length - 1];
          const navArgs = JSON.parse(lastNavCall.function.arguments);
          response.navigationPath = navArgs.path;
        }

        // Track which tools were called
        if (conversationMessages.some(m => m.role === 'tool')) {
          response.tool_calls = conversationMessages
            .filter(m => m.role === 'assistant' && m.tool_calls)
            .flatMap(m => m.tool_calls || [])
            .map((tc: any) => ({ name: tc.function.name }));
        }

        return new Response(
          JSON.stringify(response),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }
    }

    // Max iterations reached
    return new Response(
      JSON.stringify({
        content: "I apologize, but I've reached my processing limit for this request. Please try breaking it into smaller tasks.",
        role: 'assistant'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in rocker-chat:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
