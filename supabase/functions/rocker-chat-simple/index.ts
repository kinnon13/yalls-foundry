// Super Rocker Chat - Simple mode (fixed duplicates, build: 001)
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

console.log('[rocker-chat-simple] boot', { build: 'bump-002', ts: new Date().toISOString() });

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

  // Service role client for RPC calls
  const supabaseService = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    { auth: { persistSession: false } }
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

    // Load runtime config with sane defaults (tolerate missing table/row)
    const defaultCfg = { alpha: 0.7, retrieve_k: 20, keep_k: 5, sim_threshold: 0.65 };
    let cfg = { ...defaultCfg } as any;
    try {
      const { data: cfgRow, error: cfgErr } = await supabaseService
        .from('rocker_config')
        .select('*')
        .eq('id', 1)
        .maybeSingle();
      if (!cfgErr && cfgRow) cfg = { ...cfg, ...cfgRow };
    } catch (e) {
      console.warn('rocker_config unavailable, using defaults');
    }

    // Embed the user message for semantic search (only if OpenAI key available)
    let qvec: number[] = [];
    const OPENAI_KEY = Deno.env.get('OPENAI_API_KEY');
    if (OPENAI_KEY) {
      try {
        const embedResp = await fetch('https://api.openai.com/v1/embeddings', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${OPENAI_KEY}`,
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
    }

    // Performance tracking
    const t0 = Date.now();

    // Hybrid retrieval (GLOBAL - searches all uploaded content)
    let hits: any[] = [];
    let memoryContext = '';
    if (qvec.length > 0) {
      try {
        const { data, error } = await supabaseService.rpc('search_hybrid', {
          q_vec: qvec,
          q_text: message,
          k: cfg.retrieve_k,
          alpha: cfg.alpha,
          thread: null  // 🔑 GLOBAL SEARCH - no thread filter
        });
        if (error) throw error;
        
        const candidates = (data || []).slice(0, Math.min(30, cfg.retrieve_k));
        
        // Rerank top candidates using Lovable AI if available
        if (LOVABLE_API_KEY && candidates.length > 5) {
          try {
            const rerankPrompt = `Query: ${message}\n\nPassages:\n` + 
              candidates.slice(0, 20).map((c: any, i: number) => 
                `(${i+1}) id=${c.id}\n${String(c.content || '').slice(0, 800)}`
              ).join('\n\n') +
              '\n\nFor each passage, output JSON: {"id":"<id>","score":<0.0-1.0>}. One line per passage. Be strict.';
            
            const rerankResp = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
              method: 'POST',
              headers: { 'Authorization': `Bearer ${LOVABLE_API_KEY}`, 'Content-Type': 'application/json' },
              body: JSON.stringify({
                model: 'google/gemini-2.5-flash',
                messages: [{ role: 'user', content: rerankPrompt }],
                temperature: 0
              })
            });
            
            if (rerankResp.ok) {
              const rerankData = await rerankResp.json();
              const rerankText = rerankData.choices?.[0]?.message?.content || '';
              const rerankScores = new Map<string, number>();
              
              for (const line of rerankText.split('\n')) {
                try {
                  const parsed = JSON.parse(line.trim());
                  if (parsed.id && parsed.score !== undefined) {
                    rerankScores.set(parsed.id, Number(parsed.score));
                  }
                } catch { /* skip bad lines */ }
              }
              
              // Combine hybrid + rerank scores
              for (const c of candidates) {
                const rerank = rerankScores.get(c.id) ?? 0;
                c.combinedScore = ((c.score ?? 0) + rerank) / 2;
              }
              
              candidates.sort((a: any, b: any) => (b.combinedScore ?? 0) - (a.combinedScore ?? 0));
            }
          } catch (e) {
            console.warn('Rerank failed, using hybrid scores only:', e);
          }
        }
        
        // MMR diversity selection (simple version)
        if (candidates.length > 0) {
          hits = [candidates[0]]; // always take top result
          const mmrLambda = cfg.mmr_lambda ?? 0.7;
          while (hits.length < Math.min(cfg.keep_k, candidates.length)) {
            let bestIdx = -1;
            let bestScore = -Infinity;
            
            for (let i = 1; i < candidates.length; i++) {
              if (hits.some((h: any) => h.id === candidates[i].id)) continue;
              
              const rel = candidates[i].combinedScore ?? candidates[i].score ?? 0;
              
              // Penalty for similarity to already-selected (simple text overlap)
              let maxSim = 0;
              for (const h of hits) {
                const aWords = new Set((candidates[i].content || '').toLowerCase().split(/\s+/));
                const bWords = new Set((h.content || '').toLowerCase().split(/\s+/));
                const inter = [...aWords].filter(w => bWords.has(w)).length;
                const union = aWords.size + bWords.size - inter;
                const sim = union > 0 ? inter / union : 0;
                maxSim = Math.max(maxSim, sim);
              }
              
              const score = mmrLambda * rel - (1 - mmrLambda) * maxSim;
              if (score > bestScore) {
                bestScore = score;
                bestIdx = i;
              }
            }
            
            if (bestIdx >= 0) hits.push(candidates[bestIdx]);
            else break;
          }
        }
      } catch (e) {
        console.error('Hybrid search failed, trying vector-only:', e);
        // Fallback to vector-only if hybrid fails
        const { data } = await supabaseService.rpc('match_rocker_memory_vec', {
          q: qvec,
          match_count: cfg.retrieve_k,
          thread: null  // 🔑 GLOBAL SEARCH
        });
        if (data?.length) hits = data.slice(0, cfg.keep_k);
      }
    }

    // Build knowledge context with citations (RELAXED - answers with even 1 good hit)
    // Define scoring vars ONCE here for use throughout function
    const topScore = (hits[0]?.combinedScore ?? hits[0]?.score ?? hits[0]?.similarity ?? 0);
    const lowConfidence = hits.length === 0 || topScore < (cfg.sim_threshold ?? 0.62);
    
    if (hits && hits.length > 0) {
      memoryContext = '\n\n🧠 From embedded knowledge:\n' + hits.map((h: any) => {
        const source = h.meta?.source || h.meta?.title || 'learned knowledge';
        const idx = h.chunk_index ?? -1;
        const confidence = Math.round((topScore || 0) * 100);
        return `[${idx >= 0 ? `#${idx}` : '#note'}] (${confidence}% match from ${source})\n${String(h.content || '').slice(0, 600)}`;
      }).join('\n\n');
    }
    
    // === LOG GAP SIGNALS (learn from failure) ===
    if (lowConfidence || hits.length === 0) {
      try {
        // Extract entities from query (simple keyword match)
        const inferredEntities: any = {};
        const lower = message.toLowerCase();
        if (/(corn|maize)/i.test(lower)) inferredEntities.crop = 'corn';
        if (/(soy|soybean)/i.test(lower)) inferredEntities.crop = 'soy';
        if (/(wheat)/i.test(lower)) inferredEntities.crop = 'wheat';
        if (/(armyworm|aphid|corn borer|rootworm)/i.test(lower)) {
          const match = lower.match(/(armyworm|aphid|corn borer|rootworm)/i);
          if (match) inferredEntities.pest = match[0];
        }
        if (/(sprayer|planter|combine|tractor)/i.test(lower)) {
          const match = lower.match(/(sprayer|planter|combine|tractor)/i);
          if (match) inferredEntities.equipment = match[0];
        }
        const yearMatch = lower.match(/20\d{2}/);
        if (yearMatch) inferredEntities.season = yearMatch[0];

        await supabase.from('rocker_gap_signals').insert({
          user_id: user.id,
          kind: hits.length === 0 ? 'no_results' : 'low_conf',
          query: message,
          entities: inferredEntities,
          score: Math.max(0, 0.8 - topScore),
          meta: {
            top_score: topScore,
            retrieved_ids: hits?.map((h: any) => h.id) || [],
            latency_ms: Date.now() - t0,
          }
        });
      } catch (e) {
        console.warn('[Gap] Failed to log signal:', e);
      }
    }

    // Check for stale content
    if (hits.length > 0) {
      try {
        const oldest = hits.reduce((d: number, h: any) => {
          const docDate = h.meta?.doc_date || h.created_at;
          const ts = docDate ? Date.parse(docDate) : Date.now();
          return Math.min(d, ts);
        }, Date.now());
        const staleDays = (Date.now() - oldest) / (24 * 3600 * 1000);
        if (staleDays > 45) {
          await supabase.from('rocker_gap_signals').insert({
            user_id: user.id,
            kind: 'stale',
            query: message,
            entities: {},
            score: 0.5,
            meta: { oldest_doc_date: new Date(oldest).toISOString(), stale_days: Math.round(staleDays) }
          });
        }
      } catch (e) {
        console.warn('[Gap] Failed to log stale signal:', e);
      }
    }
    
    // Only refuse to answer if truly nothing found AND no other context
    if (hits.length === 0 && qvec.length > 0 && !message.match(/https?:\/\//)) {
      const clarifyReply = "I don't have any uploaded content matching that yet. Try pasting text/files in the Vault first, or share a URL to fetch.";
      
      await supabase.from('rocker_messages').insert([
        { thread_id, user_id: user.id, role: 'user', content: message, meta: {} },
        { thread_id, user_id: user.id, role: 'assistant', content: clarifyReply, meta: { confidence: 'none', sources: [] } }
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

    // Load open tasks for context
    let tasksContext = '';
    try {
      const { data: tasks } = await supabase
        .from('rocker_tasks')
        .select('id, title, status, due_at')
        .eq('user_id', user.id)
        .in('status', ['open', 'doing'])
        .order('created_at', { ascending: true })
        .limit(10);

      if (tasks && tasks.length > 0) {
        tasksContext = '\n\n📋 Current open tasks:\n' + tasks.map((t: any, i: number) => 
          `[Task ${i+1}] ${t.title} (${t.status})${t.due_at ? ' - Due: ' + new Date(t.due_at).toLocaleDateString() : ''}`
        ).join('\n');
        tasksContext += '\n\nYou can reference these tasks by number (e.g., "Task 1") and help work on them. If a task is completed, format your response with "✅ Completed: [task title]" and I will mark it done.';
      }
    } catch (e) {
      console.warn('Failed to load tasks:', e);
    }

    // Load upcoming calendar events if enabled
    let calendarContext = '';
    if (adminSettings?.allow_calendar_access) {
      const { data: events } = await supabase
        .from('calendar_events')
        .select('id, title, starts_at, ends_at, description, location')
        .gte('starts_at', new Date().toISOString())
        .lte('starts_at', new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString())
        .order('starts_at', { ascending: true })
        .limit(5);

      if (events && events.length > 0) {
        calendarContext = '\n\n📅 Upcoming calendar events (next 7 days):\n' + events.map((e: any, i: number) => 
          `[Event ${i+1}] ${e.title} - ${new Date(e.starts_at).toLocaleString()}${e.description ? ': ' + e.description : ''}${e.location ? ' at ' + e.location : ''}`
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

    const systemPrompt = `You are Super Rocker, a fully autonomous AI that proactively manages capabilities and takes action.

CRITICAL RULES - AUTONOMOUS OPERATION:
- ALWAYS proactively suggest next steps after completing actions
- ALWAYS auto-verify features mentioned in conversations without being asked
- ALWAYS research gaps immediately when detected
- When you complete tasks, mark them done with: "✅ Completed: [task]"
- When you identify new work, create tasks with: "todo: [action]"
- End EVERY response with "Next I'm going to:" followed by your autonomous plan

PROACTIVE BEHAVIORS:
- After file ingestion: Auto-audit features → Report status → Research gaps
- After verification failures: Queue research → Suggest fixes → Create implementation tasks
- When user describes capabilities: Verify existence → Test connectivity → Report findings
- Monitor action ledger for patterns → Suggest optimizations → Auto-implement improvements

DEMONSTRATE, DON'T DESCRIBE:
- ALWAYS show actual parsed examples, not just process descriptions
- ALWAYS include real data from logs/queries when diagnosing
- ALWAYS use verification tools to check feature existence/connectivity
- ALWAYS cite exact tool execution results with confidence scores
- When gaps are detected, AUTOMATICALLY research and suggest solutions

RESPONSE FORMAT:
- TL;DR first (1-2 sentences max)
- Then details with CONCRETE DEMONSTRATIONS (tool results, log queries, verification outputs)
- Cite sources with [#log_id] when referencing embedded knowledge
- Format tasks as "todo: [action]" to auto-create them
- When a task is completed, format: "✅ Completed: [task title]" to mark it done
- **ALWAYS end with**: "Next I'm going to: [specific autonomous action]"

SELF-DIAGNOSTIC CAPABILITIES:
- Use query_analysis_logs to check previous actions and identify patterns/errors
- Use query_action_ledger to review past executions and optimize
- Use verify_feature to check if described capabilities (RPCs, tables, routes, components, edge functions) exist and are accessible
- Use web_research when external information is needed to fill gaps

${tasksContext ? '- You can see and reference open tasks in the context provided' : ''}
${calendarContext ? '- Leverage calendar context for prep, reminders, and follow-ups' : ''}
${calendarContext ? '- You can create calendar events using the create_calendar_event tool' : ''}
- When given URLs, you can fetch and summarize them

FEATURE VERIFICATION PROTOCOL:
When users mention features (e.g., "feed_fusion_home RPC", "/dashboard route", "ProfileCard component"):
1. **AUTO-VERIFY** existence using verify_feature tool (don't wait for permission)
2. Check connectivity (can Rocker call it?)
3. Report status: done (✅), partial (⚠️), not_done (❌)
4. If not done, **AUTO-RESEARCH** via web_research tool
5. Provide specific fix suggestions with code examples
6. **AUTO-CREATE** tasks for implementation

PROACTIVE ELEMENT:
- Flag missing capabilities for nightly research/ranking (happens automatically)
- Prioritize suggestions by feasibility × impact
- Auto-decay stale suggestions to keep focus fresh
- **Take initiative**: Don't ask "Would you like me to...", just do it and report results`;

    // Define tools (calendar + verification + diagnostics)
    const tools = [
      ...(adminSettings?.allow_calendar_access ? [{
        type: "function",
        function: {
          name: "create_calendar_event",
          description: "Create a new calendar event for the user. Returns event details with confirmation link.",
          parameters: {
            type: "object",
            properties: {
              title: { type: "string", description: "Event title/name" },
              description: { type: "string", description: "Event description (optional)" },
              starts_at: { type: "string", description: "Start date/time in ISO 8601 format" },
              ends_at: { type: "string", description: "End date/time in ISO 8601 format (optional, defaults to 1 hour after start)" },
              location: { type: "string", description: "Event location (optional)" }
            },
            required: ["title", "starts_at"]
          }
        }
      }] : []),
      {
        type: "function",
        function: {
          name: "verify_feature",
          description: "Verify if a described feature (RPC, table, route, component, edge function) exists in the system and check if Rocker can access it. Returns done/not-done status with suggestions.",
          parameters: {
            type: "object",
            properties: {
              feature_type: { 
                type: "string", 
                enum: ["rpc", "table", "route", "component", "edge_function"],
                description: "Type of feature to verify" 
              },
              feature_name: { type: "string", description: "Name of the feature (e.g., 'feed_fusion_home', '/dashboard', 'ProfileCard')" },
              test_connectivity: { type: "boolean", description: "Whether to test actual connectivity (default: false)" },
              test_params: { type: "object", description: "Parameters for connectivity test (optional)" }
            },
            required: ["feature_type", "feature_name"]
          }
        }
      },
      {
        type: "function",
        function: {
          name: "query_analysis_logs",
          description: "Search ai_action_ledger for previous actions, verifications, or analyses. Use to check self-diagnosis history.",
          parameters: {
            type: "object",
            properties: {
              search_term: { type: "string", description: "Term to search in action or input/output" },
              action_filter: { type: "string", description: "Filter by action name" },
              limit: { type: "number", description: "Max results (default: 10)" }
            }
          }
        }
      },
      {
        type: "function",
        function: {
          name: "query_action_ledger",
          description: "Search ai_action_ledger for past actions/tools Rocker has executed. Use for self-diagnosis of what was attempted.",
          parameters: {
            type: "object",
            properties: {
              action_filter: { type: "string", description: "Filter by action name" },
              result_filter: { type: "string", enum: ["success", "error"], description: "Filter by result" },
              limit: { type: "number", description: "Max results (default: 10)" }
            }
          }
        }
      },
      {
        type: "function",
        function: {
          name: "web_research",
          description: "Trigger external web research on a topic to find missing information or capabilities. Use when gaps are detected.",
          parameters: {
            type: "object",
            properties: {
              topic: { type: "string", description: "Topic or question to research" },
              context: { type: "string", description: "Context about why this research is needed" }
            },
            required: ["topic"]
          }
        }
      }
    ];

    let reply = "I'm here to help! How can I assist you?";
    let toolResults: any[] = [];
    
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

    let tokensIn = 0;
    let tokensOut = 0;
    
    try {
      const aiMessages = [
        { role: "system", content: systemPrompt + memoryContext + tasksContext + calendarContext },
        ...(history || []).map((m: any) => ({ role: m.role, content: m.content })),
        { role: "user", content: message }
      ];

      tokensIn = JSON.stringify(aiMessages).length / 4; // rough estimate

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
          tokensOut = data.usage?.completion_tokens ?? (reply.length / 4);
        }
      } else if (LOVABLE_API_KEY) {
        const requestBody: any = {
          model: "google/gemini-2.5-flash",
          messages: aiMessages,
        };
        
        if (tools.length > 0) {
          requestBody.tools = tools;
        }

        const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
        });

        if (aiResponse.ok) {
          const data = await aiResponse.json();
          const choice = data.choices?.[0];
          
            // Handle tool calls
            if (choice?.message?.tool_calls && choice.message.tool_calls.length > 0) {
              for (const toolCall of choice.message.tool_calls) {
                // === Calendar Event Creation ===
                if (toolCall.function.name === "create_calendar_event") {
                  try {
                    const args = JSON.parse(toolCall.function.arguments);
                    
                    // Get or create user's default calendar
                    let { data: defaultCal } = await supabase
                      .from('calendars')
                      .select('id')
                      .eq('owner_profile_id', user.id)
                      .eq('calendar_type', 'personal')
                      .limit(1)
                      .maybeSingle();
                    
                    if (!defaultCal) {
                      const { data: newCal } = await supabase.functions.invoke('calendar-ops', {
                        body: {
                          operation: 'create_calendar',
                          name: 'My Calendar',
                          calendar_type: 'personal',
                          color: '#3b82f6'
                        }
                      });
                      defaultCal = newCal?.calendar;
                    }
                    
                    if (!defaultCal?.id) {
                      throw new Error('Failed to get or create calendar');
                    }

                    // Create the event via calendar-ops
                    const { data: eventResult, error: eventError } = await supabase.functions.invoke('calendar-ops', {
                      body: {
                        operation: 'create_event',
                        calendar_id: defaultCal.id,
                        title: args.title,
                        description: args.description || null,
                        starts_at: args.starts_at,
                        ends_at: args.ends_at || new Date(new Date(args.starts_at).getTime() + 60 * 60 * 1000).toISOString(),
                        location: args.location || null,
                        visibility: 'private',
                        all_day: false
                      }
                    });

                    if (eventError) throw eventError;
                    const newEvent = eventResult.event;

                    // Format confirmation with link
                    const eventLink = `/calendar?event=${newEvent.id}`;
                    const eventDate = new Date(newEvent.starts_at).toLocaleString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                      timeZoneName: 'short'
                    });

                    toolResults.push({
                      tool: "create_calendar_event",
                      success: true,
                      event_id: newEvent.id,
                      event_link: eventLink,
                      details: {
                        title: newEvent.title,
                        starts_at: eventDate,
                        location: newEvent.location
                      }
                    });

                    // Add confirmation to reply context
                    memoryContext += `\n\n✅ Calendar Event Created:\n📅 ${newEvent.title}\n🕐 ${eventDate}${newEvent.location ? `\n📍 ${newEvent.location}` : ''}\n🔗 [View Event](${eventLink})`;
                  } catch (e: any) {
                    console.error('Failed to create calendar event:', e);
                    toolResults.push({
                      tool: "create_calendar_event",
                      success: false,
                      error: e.message
                    });
                  }
                }
                
                // === Feature Verification ===
                if (toolCall.function.name === "verify_feature") {
                  try {
                    const args = JSON.parse(toolCall.function.arguments);
                    const { data: verifyResult, error: verifyError } = await supabase.functions.invoke('rocker-verify-feature', {
                      body: args
                    });

                    if (verifyError) throw verifyError;

                    toolResults.push({
                      tool: "verify_feature",
                      success: true,
                      result: verifyResult
                    });

                    // Add verification summary to context
                    const status = verifyResult.status === 'done' ? '✅' : verifyResult.status === 'partial' ? '⚠️' : '❌';
                    memoryContext += `\n\n${status} Feature Verification: ${args.feature_type}:${args.feature_name}\nStatus: ${verifyResult.status}\nExists: ${verifyResult.exists}\nAccessible: ${verifyResult.accessible}\n${verifyResult.details.suggestions?.length ? 'Suggestions:\n' + verifyResult.details.suggestions.map((s: string) => `  • ${s}`).join('\n') : ''}`;
                  } catch (e: any) {
                    console.error('Feature verification failed:', e);
                    toolResults.push({
                      tool: "verify_feature",
                      success: false,
                      error: e.message
                    });
                  }
                }
                
                // === Query Analysis Logs ===
                if (toolCall.function.name === "query_analysis_logs") {
                  try {
                    const args = JSON.parse(toolCall.function.arguments);
                    let query = supabase
                      .from('rocker_deep_analysis')
                      .select('id, input_text, analysis, meta, created_at')
                      .order('created_at', { ascending: false })
                      .limit(args.limit || 10);

                    if (args.search_term) {
                      query = query.or(`input_text.ilike.%${args.search_term}%,analysis::text.ilike.%${args.search_term}%`);
                    }
                    
                    if (args.analysis_type) {
                      query = query.eq('meta->>type', args.analysis_type);
                    }

                    const { data: logs, error: logsError } = await query;
                    if (logsError) throw logsError;

                    toolResults.push({
                      tool: "query_analysis_logs",
                      success: true,
                      count: logs?.length || 0,
                      results: logs
                    });

                    memoryContext += `\n\n📊 Analysis Log Query: Found ${logs?.length || 0} matches for "${args.search_term}"`;
                  } catch (e: any) {
                    console.error('Query analysis logs failed:', e);
                    toolResults.push({
                      tool: "query_analysis_logs",
                      success: false,
                      error: e.message
                    });
                  }
                }
                
                // === Query Action Ledger ===
                if (toolCall.function.name === "query_action_ledger") {
                  try {
                    const args = JSON.parse(toolCall.function.arguments);
                    let query = supabase
                      .from('ai_action_ledger')
                      .select('id, agent, action, result, input, output, created_at')
                      .eq('agent', 'rocker')
                      .order('created_at', { ascending: false })
                      .limit(args.limit || 10);

                    if (args.action_filter) {
                      query = query.eq('action', args.action_filter);
                    }
                    
                    if (args.result_filter) {
                      query = query.eq('result', args.result_filter);
                    }

                    const { data: actions, error: actionsError } = await query;
                    if (actionsError) throw actionsError;

                    toolResults.push({
                      tool: "query_action_ledger",
                      success: true,
                      count: actions?.length || 0,
                      results: actions
                    });

                    memoryContext += `\n\n📋 Action Ledger: Found ${actions?.length || 0} actions${args.result_filter ? ` with result=${args.result_filter}` : ''}`;
                  } catch (e: any) {
                    console.error('Query action ledger failed:', e);
                    toolResults.push({
                      tool: "query_action_ledger",
                      success: false,
                      error: e.message
                    });
                  }
                }
                
                // === Web Research ===
                if (toolCall.function.name === "web_research") {
                  try {
                    const args = JSON.parse(toolCall.function.arguments);
                    
                    // Invoke actual research function
                    const { data: researchResult, error: researchError } = await supabase.functions.invoke('rocker-web-research', {
                      body: {
                        query: args.topic,
                        context: args.context,
                        research_type: 'feature_gap',
                        user_id: user.id,
                      }
                    });

                    if (researchError) throw researchError;

                    toolResults.push({
                      tool: "web_research",
                      success: true,
                      topic: args.topic,
                      findings: researchResult?.findings || [],
                      summary: researchResult?.summary || '',
                      confidence: researchResult?.confidence || 0.5,
                      gap_signal_id: researchResult?.gap_signal_id
                    });

                    memoryContext += `\n\n🔍 Research Complete: "${args.topic}"\nFindings: ${researchResult?.summary?.slice(0, 200)}...`;
                  } catch (e: any) {
                    console.error('Web research failed:', e);
                    toolResults.push({
                      tool: "web_research",
                      success: false,
                      error: e.message
                    });
                  }
                }
              }

            // Re-run AI with tool results
            const followUpMessages = [
              ...aiMessages,
              { role: "assistant", content: choice.message.content || "", tool_calls: choice.message.tool_calls },
              {
                role: "tool",
                content: JSON.stringify(toolResults),
                tool_call_id: choice.message.tool_calls[0].id
              }
            ];

            const followUpResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
              method: "POST",
              headers: {
                Authorization: `Bearer ${LOVABLE_API_KEY}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                model: "google/gemini-2.5-flash",
                messages: followUpMessages,
              }),
            });

            if (followUpResponse.ok) {
              const followUpData = await followUpResponse.json();
              reply = followUpData.choices?.[0]?.message?.content || reply;
              tokensOut += reply.length / 4;
            }
          } else {
            reply = choice?.message?.content || reply;
            tokensOut = reply.length / 4;
          }
        }
      }
      
      // Verifier pass: ensure TL;DR, citations, next actions
      if (reply && hits.length > 0) {
        const hasTldr = /^(TL;DR|Summary|In short)/im.test(reply);
        const hasCitations = /\[#\d+\]/.test(reply);
        const hasActions = /Next actions?:/i.test(reply);
        
        if (!hasTldr || !hasCitations) {
          // Quick fixup prompt
          const fixPrompt = `The following answer needs improvement. ${!hasTldr ? 'Add a TL;DR first line.' : ''} ${!hasCitations ? 'Add [#n] citations from sources.' : ''} ${!hasActions ? 'End with "Next actions:" list.' : ''}\n\nOriginal:\n${reply}`;
          
          try {
            const fixResp = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
              method: 'POST',
              headers: { 'Authorization': `Bearer ${LOVABLE_API_KEY}`, 'Content-Type': 'application/json' },
              body: JSON.stringify({
                model: 'google/gemini-2.5-flash',
                messages: [{ role: 'user', content: fixPrompt }],
                temperature: 0
              })
            });
            
            if (fixResp.ok) {
              const fixData = await fixResp.json();
              reply = fixData.choices?.[0]?.message?.content || reply;
              tokensOut += (reply.length / 4);
            }
          } catch { /* keep original if fix fails */ }
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
        scores: hits?.map((h: any) => h.combinedScore ?? h.score ?? h.similarity) || []
      },
      result: 'success'
    });
    
    // === METRICS BLOCK (single place, reuses topScore/lowConfidence from line 199) ===
    const latencyMs = Date.now() - t0;
    const retrievedIds = hits?.map((h: any) => h.id) || [];
    const scores = hits?.map((h: any) => h.combinedScore ?? h.score ?? h.similarity) || [];
    
    // Reusing topScore and lowConfidence from line 199-200 (no redeclaration)
    const mrr = topScore >= cfg.sim_threshold ? 1.0 : 0.0;
    const hit5 = scores.some((s: number) => s >= cfg.sim_threshold);
    
    try {
      await supabaseService.rpc('log_metric', {
        p_user_id: user.id,
        p_action: 'chat_turn',
        p_latency_ms: latencyMs,
        p_tokens_in: Math.round(tokensIn),
        p_tokens_out: Math.round(tokensOut),
        p_retrieved_ids: retrievedIds,
        p_scores: scores,
        p_low_conf: lowConfidence,
        p_mrr: mrr,
        p_hit5: hit5
      });
    } catch (e) {
      console.error('[metrics] log_metric failed:', String(e));
    }

    // Auto-task detection - only create real actionable tasks
    const todoMatch = reply.match(/(?:^|\n)(?:TODO|Action item|Next step):\s*(.+?)(?:\n|$)/mi);
    if (todoMatch) {
      const taskTitle = todoMatch[1].trim().slice(0, 240);
      // Don't create vague clarification tasks
      if (!taskTitle.toLowerCase().includes('specify') && 
          !taskTitle.toLowerCase().includes('clarify') &&
          !taskTitle.toLowerCase().includes('provide') &&
          taskTitle.length > 10) {
        await supabase.from("rocker_tasks").insert({
          user_id: user.id,
          thread_id,
          title: taskTitle,
          status: 'open'
        });
      }
    }

    // Auto-organize knowledge after every few chat turns
    const { count: msgCount } = await supabase
      .from('rocker_messages')
      .select('*', { count: 'exact', head: true })
      .eq('thread_id', thread_id);
    
    if (msgCount && msgCount % 5 === 0) {
      // Every 5 messages, organize the knowledge
      try {
        await supabase.functions.invoke('rocker-organize-knowledge', {
          body: { thread_id }
        });
      } catch (orgErr) {
        console.log('[Chat] Auto-organize queued (async)');
      }
    }

    // Collect tool results for UI feedback (use existing toolResults array)
    if (urlMatch && !toolResults.some(t => t.tool === 'web_fetch')) {
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
