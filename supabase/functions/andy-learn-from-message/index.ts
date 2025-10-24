import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper to extract JSON from model outputs (handles ```json fences)
function extractJson(text: string): string {
  if (!text) return '';
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (fenced) return fenced[1].trim();
  const startBracket = text.indexOf('[');
  const startBrace = text.indexOf('{');
  let start = -1;
  if (startBracket !== -1 && startBrace !== -1) start = Math.min(startBracket, startBrace);
  else start = startBracket !== -1 ? startBracket : startBrace;
  if (start !== -1) {
    const candidate = text.slice(start).trim();
    try { JSON.parse(candidate); return candidate; } catch {}
  }
  return text.trim();
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

    const { thread_id, message_id, content } = await req.json();
    console.log('🧠 Andy learning from message:', message_id);

    // Get message and user
    const { data: msg } = await supabase
      .from('rocker_messages')
      .select(`
        id,
        content,
        thread_id,
        rocker_threads!inner(user_id)
      `)
      .eq('id', message_id)
      .single();

    if (!msg) {
      return new Response(JSON.stringify({ error: 'Message not found' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const userId = (msg as any).rocker_threads.user_id;

    // Get user's learning preferences
    const { data: prefs } = await supabase
      .from('ai_preferences')
      .select('confirm_threshold')
      .eq('user_id', userId)
      .maybeSingle();

    const threshold = prefs?.confirm_threshold ?? 0.7;

    // Extract facts using AI
    console.log('🤖 Extracting facts via AI...');
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${Deno.env.get('LOVABLE_API_KEY')}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        temperature: 0.2,
        messages: [
          {
            role: "system",
            content: `Extract up to 5 atomic facts suitable for long-term memory as JSON array:
[{
  "category": "identity|family|business|goal|project|contact|preference",
  "title": "brief key",
  "value": "the fact",
  "confidence": 0.0-1.0
}]

Only extract explicit facts. Return empty array [] if no facts found.`
          },
          {
            role: "user",
            content: content || msg.content
          }
        ]
      })
    });

const aiData = await aiResponse.json();
let facts: any[] = [];

try {
  const extracted = aiData?.choices?.[0]?.message?.content || "[]";
  const jsonStr = extractJson(extracted);
  facts = JSON.parse(jsonStr);
  if (!Array.isArray(facts)) facts = [];
} catch (e) {
  console.error('Failed to parse AI response:', e);
  facts = [];
}

    console.log(`📊 Extracted ${facts.length} facts`);

    // HARDWIRED: Always do deep analysis on the message content
    console.log('🧠 Running deep analysis on message...');
    try {
      // Load research queue for context
      const { data: researchQueue } = await supabase
        .from('andy_research_queue')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(20);

      const queueContext = researchQueue && researchQueue.length > 0
        ? `\n\nPending Research Queue (${researchQueue.length} items):\n` + researchQueue.map((q: any) => 
            `- ${q.query} (priority: ${q.priority || 'normal'})`
          ).join('\n')
        : '';

      const deepAnalysis = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${Deno.env.get('LOVABLE_API_KEY')}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          temperature: 0.3,
          messages: [
            {
              role: "system",
              content: `Deep analyze this message for:
1. Hidden patterns, connections to past memories
2. Implicit goals, motivations, emotional state
3. Project dependencies, technical requirements
4. Relationships between entities mentioned
5. Future implications and follow-up needs
6. Topics that match or relate to pending research queue items

${queueContext}

Return structured JSON:
{
  "patterns": ["..."],
  "connections": ["..."],
  "implications": ["..."],
  "technical_insights": ["..."],
  "entities": [{"name":"...", "type":"...", "context":"..."}],
  "research_opportunities": ["Topics from the message that could be researched"],
  "related_queue_items": ["IDs or topics from the research queue that relate to this message"]
}`
            },
            { role: "user", content: content || msg.content }
          ]
        })
      });
      
const deepData = await deepAnalysis.json();
const analysis = deepData?.choices?.[0]?.message?.content || "{}";
let deepInsights: any = {};
try { deepInsights = JSON.parse(extractJson(analysis)); } catch {}
      
      // Store deep analysis as a special memory entry
      if (Object.keys(deepInsights).length > 0) {
        await supabase.from('rocker_long_memory').insert({
          user_id: userId,
          kind: 'note',
          key: `analysis_${Date.now()}`,
          value: {
            message_id,
            analysis: deepInsights,
            source: 'auto_deep_analysis',
            timestamp: new Date().toISOString()
          },
          memory_layer: 'meta'
        });

        // Store in Andy's own research files
        await supabase.from('andy_research').insert({
          user_id: userId,
          research_type: 'analysis',
          topic: 'conversation_analysis',
          content: {
            insights: deepInsights,
            message_id,
            analyzed_at: new Date().toISOString()
          },
          metadata: { auto_generated: true, from_conversation: true }
        });
        
        console.log('✅ Deep analysis stored in user memory + Andy research');
      }
    } catch (e) {
      console.error('Deep analysis failed:', e);
      // Continue even if deep analysis fails
    }

    if (facts.length === 0) {
      return new Response(JSON.stringify({ ok: true, learned: 0, confirmed: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Split into auto-save and confirm based on confidence
    const toSave = facts.filter((f: any) => (f.confidence ?? 0) >= threshold);
    const toConfirm = facts.filter((f: any) => (f.confidence ?? 0) < threshold);

    console.log(`✅ Auto-saving ${toSave.length} high-confidence facts`);
    console.log(`❓ Need confirmation for ${toConfirm.length} uncertain facts`);

  // Auto-save confident facts
    if (toSave.length > 0) {
      const { data: savedMemories } = await supabase.from('rocker_long_memory').insert(
        toSave.map((f: any) => {
          const c = String(f.category || '').toLowerCase();
          const mappedKind = (
            c === 'identity' || c === 'family' || c === 'personal' || c === 'bio' || c === 'profile' ? 'profile' :
            c === 'preference' || c === 'like' || c === 'dislike' || c === 'settings' ? 'preference' :
            c === 'goal' || c === 'project' || c === 'todo' || c === 'task' ? 'task' :
            c === 'business' || c === 'company' || c === 'contact' || c === 'lead' || c === 'deal' || c === 'crm' ? 'crm' :
            c === 'finance' || c === 'payment' || c === 'invoice' || c === 'budget' ? 'finance' :
            c === 'doc' || c === 'document' || c === 'file' ? 'doc' :
            c === 'paste' || c === 'snippet' || c === 'clip' ? 'paste' :
            'note'
          ) as 'profile' | 'preference' | 'paste' | 'file' | 'note' | 'task' | 'crm' | 'finance' | 'doc';
          return {
            user_id: userId,
            kind: mappedKind,
            key: f.title,
            value: {
              text: f.value,
              source: 'chat',
              message_id: message_id,
              confidence: f.confidence,
              learned_at: new Date().toISOString()
            },
            memory_layer: mappedKind
          };
        })
      ).select();

      // Have Andy enhance each saved memory
      if (savedMemories && savedMemories.length > 0) {
        for (const mem of savedMemories) {
          const memValue = (mem as any).value;
          const memText = typeof memValue === 'object' ? memValue.text : memValue;
          if (memText) {
            supabase.functions.invoke('andy-enhance-memories', {
              body: {
                user_id: userId,
                memory_id: (mem as any).id,
                content: memText
              }
            }).catch(e => console.warn('Enhancement failed:', e));
          }
        }
      }
    }

    // Ask for confirmation on uncertain facts
    if (toConfirm.length > 0) {
      const lines = toConfirm.map((f: any) => 
        `• **${f.title}**: "${f.value}" (${Math.round(f.confidence * 100)}% confident)`
      ).join('\n');
      
      await supabase.from('rocker_messages').insert({
        thread_id,
        role: 'assistant',
        content: `Quick check — should I remember these?\n\n${lines}\n\nReply "yes to all" or specify which to save.`,
        metadata: {
          type: 'learning_confirmation',
          facts: toConfirm
        }
      });
    }

    return new Response(JSON.stringify({ 
      ok: true, 
      learned: toSave.length,
      needs_confirmation: toConfirm.length
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('❌ Error in andy-learn-from-message:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
