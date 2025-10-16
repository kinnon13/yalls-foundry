import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.0";
import { withRateLimit, RateLimits } from "../_shared/rate-limit-wrapper.ts";
import { createLogger } from "../_shared/logger.ts";
import { USER_SYSTEM_PROMPT, ANDY_SYSTEM_PROMPT } from "./prompts.ts";
import { extractLearningsFromConversation } from "./learning.ts";
import { aggregatePatternsAndAnalytics } from "./analytics.ts";
import { TOOL_DEFINITIONS } from "./tools/definitions.ts";
import { buildUserContext } from "./buildContext.ts";
import { executeToolLoop } from "./toolLoop.ts";
import { generateSummary } from "./summarize.ts";

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const limited = await withRateLimit(req, 'rocker-chat', RateLimits.expensive);
  if (limited) return limited;

  const log = createLogger('rocker-chat');
  log.startTimer();

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

    const reqClone = req.clone();
    const body = await reqClone.json();
    const { messages, sessionId: requestedSessionId, currentRoute, actor_role } = body;
    
    // Default to 'user' mode unless explicitly set to 'admin'
    const actorRole: 'user' | 'admin' | 'knower' = 
      actor_role === 'admin' ? 'admin' :
      actor_role === 'knower' ? 'knower' : 'user';

    // Build user context from profile, memory, and analytics
    const userContext = await buildUserContext(supabaseClient, user.id, user.email, currentRoute, actorRole);

    // Build role-specific system prompt
    const { USER_MODE_NOTICE, ADMIN_MODE_NOTICE, KNOWER_MODE_NOTICE } = await import('./prompts.ts');
    
    let systemPrompt: string;
    if (actorRole === 'knower') {
      // Andy gets his own completely separate prompt
      systemPrompt = KNOWER_MODE_NOTICE + ANDY_SYSTEM_PROMPT + userContext;
    } else if (actorRole === 'admin') {
      // Admin Rocker gets admin notice + user prompt
      systemPrompt = ADMIN_MODE_NOTICE + USER_SYSTEM_PROMPT + userContext;
    } else {
      // Regular Rocker gets user notice + user prompt
      systemPrompt = USER_MODE_NOTICE + USER_SYSTEM_PROMPT + userContext;
    }
    
    let conversationHistory: any[] = [];
    
    if (requestedSessionId) {
      // Load specific session with knowledge hierarchy:
      // - user: sees only user messages
      // - admin: sees user + admin messages (respecting privacy)
      // - knower: sees ALL messages
      let query = supabaseClient
        .from('rocker_conversations')
        .select('role, content, created_at, user_id')
        .eq('user_id', user.id)
        .eq('session_id', requestedSessionId);
      
      if (actorRole === 'user') {
        query = query.eq('actor_role', 'user');
      } else if (actorRole === 'admin') {
        // Admins see user + admin conversations, but respect privacy
        query = query.in('actor_role', ['user', 'admin']);
      }
      // For 'knower', don't filter - see everything
      
      let { data: sessionMessages } = await query.order('created_at', { ascending: true });

      // Filter out messages from users hidden from this admin
      if (actorRole === 'admin' && sessionMessages) {
        const { data: isHidden } = await supabaseClient.rpc('is_user_hidden_from_admin', {
          _user_id: user.id,
          _admin_id: user.id
        });
        
        if (!isHidden) {
          conversationHistory = (sessionMessages || []).map((msg: any) => ({
            role: msg.role,
            content: msg.content
          }));
        }
      } else {
        conversationHistory = (sessionMessages || []).map((msg: any) => ({
          role: msg.role,
          content: msg.content
        }));
      }
    } else {
      // Load recent messages with hierarchy (last 20 for context)
      let query = supabaseClient
        .from('rocker_conversations')
        .select('role, content, user_id')
        .eq('user_id', user.id);
      
      if (actorRole === 'user') {
        query = query.eq('actor_role', 'user');
      } else if (actorRole === 'admin') {
        query = query.in('actor_role', ['user', 'admin']);
      }
      // For 'knower', don't filter - see everything

      const { data: recentConversations } = await query
        .order('created_at', { ascending: false })
        .limit(20);

      // Filter out messages from hidden users for admins
      if (actorRole === 'admin' && recentConversations) {
        const { data: isHidden } = await supabaseClient.rpc('is_user_hidden_from_admin', {
          _user_id: user.id,
          _admin_id: user.id
        });
        
        if (!isHidden) {
          conversationHistory = (recentConversations || []).reverse().map((msg: any) => ({
            role: msg.role,
            content: msg.content
          }));
        }
      } else {
        conversationHistory = (recentConversations || []).reverse().map((msg: any) => ({
          role: msg.role,
          content: msg.content
        }));
      }
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
          actor_role: actorRole,
          metadata: { timestamp: new Date().toISOString() }
        });
      
      if (insertError) {
        log.error('Failed to save user message', insertError);
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
          log.error('Failed to create session metadata', metaError);
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
        log.error('OpenAI API error', new Error(`Status ${response.status}: ${errorText}`));
        throw new Error('OpenAI API error');
      }

      const completion = await response.json();
      const assistantMessage = completion.choices[0].message;

      // Check if AI wants to call tools
      if (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
        conversationMessages.push(assistantMessage);
        const toolResults = await executeToolLoop(
          conversationMessages,
          assistantMessage.tool_calls,
          supabaseClient,
          user.id,
          actorRole
        );
        conversationMessages.push(...toolResults);
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
            actor_role: actorRole,
            metadata: {
              timestamp: new Date().toISOString(),
              iterations
            }
          });

        if (saveError) {
          log.error('Failed to save assistant message', saveError);
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
            log.error('Background analytics job failed', err)
          );
        }, 0);

        // Generate summary for the conversation (after a few messages)
        if (isNewSession && conversationMessages.length >= 4) {
          const summary = await generateSummary(conversationMessages, OPENAI_API_KEY);
          if (summary) {
            await supabaseClient
              .from('conversation_sessions')
              .update({ summary })
              .eq('session_id', sessionId);
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

        // Track which tools were called - include arguments for frontend execution
        const toolResultsWithActions: any[] = [];
        
        if (conversationMessages.some(m => m.role === 'tool')) {
          const toolMessages = conversationMessages.filter(m => m.role === 'tool');
          
          for (const toolMsg of toolMessages) {
            try {
              const result = JSON.parse(toolMsg.content);
              if (result.action) {
                // This is a DOM action that needs to be executed on the frontend
                toolResultsWithActions.push({
                  action: result.action,
                  ...result
                });
              }
            } catch (e) {
              // Ignore parse errors
            }
          }
          
          response.tool_calls = conversationMessages
            .filter(m => m.role === 'assistant' && m.tool_calls)
            .flatMap(m => m.tool_calls || [])
            .map((tc: any) => ({ 
              name: tc.function.name,
              arguments: tc.function.arguments 
            }));
        }
        
        // Include DOM actions that need to be executed on client
        if (toolResultsWithActions.length > 0) {
          response.client_actions = toolResultsWithActions;
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
    log.error('Error in rocker-chat', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
