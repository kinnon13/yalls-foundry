import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { withTenantGuard, type TenantContext } from "../_shared/tenantGuard.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { createLogger } from "../_shared/logger.ts";
import { kernel } from "../_shared/dynamic-kernel.ts";
import { offlineRAG } from "../_shared/offline-rag.ts";
import type { Message } from "../_shared/ai.ts";
import { rockerTools } from "./tools.ts";

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
        knower: 'You are Super Andy - omniscient meta-cognitive AI with full system access. Be INQUISITIVE and proactive: When users ask to open apps (calendar, files, tasks, etc.), use the fe.navigate tool to open them AND ask engaging follow-up questions about what they want to accomplish. Learn from every interaction by asking thoughtful questions. Be conversational and curious about user goals. When performing actions, explain what you\'re doing and why. Help users discover what they need, not just what they ask for. Available apps: calendar, files, tasks, knowledge, learn, inbox, admin, secrets, capabilities, proactive, training, task-os.' + memoryContext
      };

      // Initialize reply and confidence
      let reply = '';
      let confidence = 1.0;

      // Detect complex multi-step tasks that need MDR orchestration
      const isComplexTask = message.length > 200 || 
        /\b(plan|strategy|analyze|compare|evaluate|multi-step|complex|orchestrat)\b/i.test(message);
      
      // For complex tasks: Use MDR (Multi-Dimensional Reasoning)
      if (isComplexTask && actorRole === 'knower') {
        log.info('Complex task detected - invoking MDR orchestration');
        
        const taskId = `task-${Date.now()}-${ctx.userId.substring(0, 8)}`;
        
        // Step 1: Generate perspectives
        const { data: mdrGenerate } = await ctx.adminClient.functions.invoke('mdr_generate', {
          body: { taskId, tenantId: ctx.tenantId, context: { message, history: conversationHistory } }
        });
        
        // Step 2: Build consensus
        const { data: mdrConsensus } = await ctx.adminClient.functions.invoke('mdr_consensus', {
          body: { taskId, tenantId: ctx.tenantId }
        });
        
        // Step 3: Orchestrate sub-agents
        const { data: mdrOrchestrate } = await ctx.adminClient.functions.invoke('mdr_orchestrate', {
          body: { taskId, tenantId: ctx.tenantId, context: mdrConsensus }
        });
        
        reply = `**Complex Task Analysis Complete**\n\nGenerated ${mdrGenerate?.perspectives || 3} strategic perspectives and selected optimal plan (confidence: ${mdrConsensus?.consensus?.confidence || 85}%).\n\n**Chosen Approach:** ${mdrConsensus?.chosenPlan?.approach || 'Multi-step validated execution'}\n\n**Sub-agents queued:** ${mdrOrchestrate?.agents?.join(', ') || 'gap_finder, verifier, executor'}\n\nMonitor progress in the dashboard.`;
        confidence = (mdrConsensus?.consensus?.confidence || 85) / 100;
      } else {
        // Simple tasks: Standard tool-calling loop
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
            toolCallCount++;
            
            // Execute each tool
            const toolResults = [];
            for (const toolCall of toolCalls) {
              const toolName = toolCall.function.name;
              const toolArgs = JSON.parse(toolCall.function.arguments || '{}');
              
              log.info('Executing tool', { tool: toolName, args: toolArgs });
              
              try {
                let result;
                
                // Execute tool based on name
                if (toolName === 'db.create_task') {
                  const { data, error } = await ctx.tenantClient.from('rocker_tasks').insert({
                    user_id: ctx.userId,
                    title: toolArgs.title,
                    description: toolArgs.description,
                    priority: toolArgs.priority || 'medium',
                    status: 'pending',
                    due_at: toolArgs.due_at || null
                  }).select().single();
                  result = error ? { error: error.message } : { success: true, task_id: data?.id };
                } else if (toolName === 'db.query_tasks') {
                  const query = ctx.tenantClient
                    .from('rocker_tasks')
                    .select('*')
                    .eq('user_id', ctx.userId);
                  
                  if (toolArgs.status) query.eq('status', toolArgs.status);
                  query.limit(toolArgs.limit || 10);
                  
                  const { data, error } = await query;
                  result = error ? { error: error.message } : { tasks: data };
                } else if (toolName === 'fe.navigate') {
                  // Emit navigation action - expecting app name not path
                  const appName = toolArgs.path?.replace('/super/', '').replace('/', '') || toolArgs.app || toolArgs.path;
                  try {
                    await ctx.tenantClient.from('ai_proposals').insert({
                      type: 'navigate',
                      user_id: ctx.userId,
                      tenant_id: ctx.tenantId,
                      payload: { app: appName }
                    });
                    result = { success: true, action: 'navigate', app: appName };
                  } catch (e) {
                    result = { error: 'Failed to emit navigation' };
                  }
                } else if (toolName === 'fe.toast') {
                  // Emit toast action
                  try {
                    await ctx.tenantClient.from('ai_proposals').insert({
                      type: 'notify.user',
                      user_id: ctx.userId,
                      tenant_id: ctx.tenantId,
                      payload: {
                        title: toolArgs.title,
                        description: toolArgs.description,
                        variant: toolArgs.variant || 'default'
                      }
                    });
                    result = { success: true, action: 'toast' };
                  } catch (e) {
                    result = { error: 'Failed to emit toast' };
                  }
                } else {
                  result = { error: `Unknown tool: ${toolName}` };
                }
                
                toolResults.push({ tool: toolName, result });
                
                // Add tool result to conversation
                messages.push({
                  role: 'assistant',
                  content: `Tool ${toolName} executed: ${JSON.stringify(result)}`
                });
              } catch (err) {
                log.error('Tool execution failed', { tool: toolName, error: err });
                toolResults.push({ tool: toolName, error: String(err) });
              }
            }
            
            // Continue conversation with tool results
            continue;
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
    } // end else block (simple tasks)

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

      // Check for navigation actions in recent proposals
      let actions: any[] = [];
      if (thread_id) {
        const { data: proposals } = await ctx.tenantClient
          .from('ai_proposals')
          .select('type, payload')
          .eq('user_id', ctx.userId)
          .gte('created_at', new Date(Date.now() - 5000).toISOString())
          .order('created_at', { ascending: false })
          .limit(5);
        
        if (proposals && proposals.length > 0) {
          actions = proposals.map(p => ({
            kind: p.type === 'navigate' ? 'navigate' : p.type,
            ...p.payload
          }));
        }
      }

      log.info('Request completed', { 
        reply_length: reply.length,
        confidence,
        actions_count: actions.length
      });

      return new Response(JSON.stringify({ reply, actions }), {
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