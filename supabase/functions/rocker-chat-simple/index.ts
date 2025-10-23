import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { withTenantGuard, type TenantContext } from "../_shared/tenantGuard.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { createLogger } from "../_shared/logger.ts";
import { kernel } from "../_shared/dynamic-kernel.ts";
import { offlineRAG } from "../_shared/offline-rag.ts";
import type { Message } from "../_shared/ai.ts";
import { rockerTools } from "./tools.ts";
import { executeTool } from "./executor-full.ts";

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  return withTenantGuard(req, async (ctx: TenantContext) => {
    const log = createLogger('rocker-chat-simple');
    log.startTimer();

    try {
      const payload = await req.json().catch(() => ({}));
      const { message, thread_id } = payload as { message?: string; thread_id?: string };
      
      log.info('Incoming request', { 
        hasMessage: !!message, 
        hasThread: !!thread_id,
        userId: ctx.userId,
        orgId: ctx.orgId 
      });
      
      if (!message || typeof message !== 'string') {
        return new Response(JSON.stringify({ error: 'message is required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Persist user message when thread provided
      if (thread_id) {
        try {
          await ctx.tenantClient.from('rocker_messages').insert({
            thread_id,
            user_id: ctx.userId,
            role: 'user',
            content: message,
            meta: {},
          });
        } catch (e) {
          log.error('Failed to insert user message', e);
        }
      }

      // Fetch conversation history + relevant memories
      let conversationHistory: Message[] = [];
      if (thread_id) {
        const { data: history } = await ctx.tenantClient
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
      
      // RAG: Retrieve relevant memories
      const ragResults = await offlineRAG.search(ctx, message, { limit: 5, threshold: 0.6 });
      const memoryContext = ragResults.length > 0
        ? '\n\nRelevant memories:\n' + ragResults.map(r => `- ${r.key}: ${JSON.stringify(r.value)}`).join('\n')
        : '';
      
      log.info('Context loaded', {
        history_count: conversationHistory.length,
        memories_count: ragResults.length
      });

      // Determine actor role from capabilities
      const actorRole = ctx.capabilities.includes('super_admin') ? 'knower'
        : ctx.capabilities.includes('admin') ? 'admin'
        : 'user';

      // Persona-specific system prompts
      const systemPrompts: Record<string, string> = {
        user: 'You are User Rocker - friendly, helpful personal assistant. Focus on user tasks, preferences, and daily needs. Keep answers concise.' + memoryContext,
        admin: 'You are Admin Rocker - professional oversight assistant. Focus on moderation, analytics, org-level tasks. Be precise and audit-focused.' + memoryContext,
        knower: 'You are Super Andy - omniscient meta-cognitive AI. You have full system access, can orchestrate complex tasks, and self-improve. Think strategically.' + memoryContext
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
          // Use dynamic kernel for optimal model selection
          const response = await kernel.chat(ctx, messages, {
            tools: rockerTools.map(t => ({
              name: t.name,
              description: t.description,
              parameters: t.parameters
            })),
            temperature: 0.7,
            latency: 'interactive'
          });

          // Check if AI returned tool calls in raw response
          const toolCalls = response.raw?.choices?.[0]?.message?.tool_calls;
          if (toolCalls && toolCalls.length > 0) {
            log.info('Tool calls requested', { count: toolCalls.length });
            
            // Execute each tool with proper context
            for (const toolCall of toolCalls) {
              const toolResult = await executeTool(
                ctx,
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
        log.error('AI/tool execution failed', e);
        confidence = 0;
        return new Response(JSON.stringify({ error: 'AI call failed' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Phase 2: Gap signal detection - log when confidence is low
      if (confidence < 0.65) {
        try {
          await ctx.tenantClient.from('rocker_gap_signals').insert({
            user_id: ctx.userId,
            kind: 'low_conf',
            query: message,
            score: confidence,
            meta: { thread_id, suggestedRefresh: true }
          });
          log.info('Gap signal logged for low confidence');
        } catch (e) {
          log.error('Failed to log gap signal', e);
        }
      }

      // Phase 3: Auto-task detection - create tasks from action items
      if (/action needed|todo|task|remind me|schedule|follow up/i.test(reply)) {
        try {
          const taskMatch = reply.match(/(?:action needed|todo|task|remind me|schedule|follow up)[:\s]+([^.!?]+)/i);
          if (taskMatch && taskMatch[1]) {
            const taskTitle = taskMatch[1].trim().slice(0, 100);
            await ctx.tenantClient.from('rocker_tasks').insert({
              user_id: ctx.userId,
              title: taskTitle,
              status: 'pending',
              priority: 'medium',
              meta: { auto_created: true, source_message: message }
            });
            log.info('Auto-created task', { title: taskTitle });
          }
        } catch (e) {
          log.error('Failed to auto-create task', e);
        }
      }

      // Persist assistant reply
      if (thread_id && reply) {
        try {
          await ctx.tenantClient.from('rocker_messages').insert({
            thread_id,
            user_id: ctx.userId,
            role: 'assistant',
            content: reply,
            meta: { confidence },
          });
        } catch (e) {
          log.error('Failed to insert assistant message', e);
        }
      }

      log.info('Request completed', { 
        reply_length: reply.length,
        confidence,
        tool_calls: toolCallCount 
      });

      return new Response(JSON.stringify({ reply }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } catch (e) {
      log.error('Handler error', e);
      return new Response(JSON.stringify({ error: e instanceof Error ? e.message : 'Unknown error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  }, { 
    requireAuth: true, 
    rateLimitTier: 'standard' 
  });
});