import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MODE = Deno.env.get("ROCKER_MODE") || "scripted"; // 'llm' | 'scripted'
const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");

type Turn = { role: "user" | "assistant"; content: string };

function systemPrompt(context: any) {
  const memories = context?.memories || [];
  const interests = context?.top_interests || [];
  
  return `You are Rocker: upbeat, curious, concise AI assistant. Act like meeting someone new—ask 1 thoughtful question at a time when useful.

Context about user:
- Interests: ${interests.map((i: any) => i.id).join(", ") || "none yet"}
- Follows: ${context?.follows_ct ?? 0}
- Memories: ${memories.map((m: any) => `${m.kind}: ${m.content}`).join(" | ") || "none yet"}

Guidelines:
1. Ask one concise question (≤12 words) when confidence is low or context is sparse
2. Prefer button choices first (2-4 options), then free-text
3. Reflect back 1 specific detail they mentioned
4. Be warm, capable, playful - zero cringe
5. Never ask about medical/financial/identity topics
6. Keep responses under 3 sentences unless explaining something complex

If user has <3 interests or sparse memories, ask a focused question to learn more.`;
}

async function fetchContext(supabase: any, userId: string, threadId: string) {
  const [interestsRes, followsRes, msgsRes, memoriesRes] = await Promise.all([
    supabase
      .from("user_interests")
      .select("interest_id, affinity")
      .eq("user_id", userId)
      .order("affinity", { ascending: false })
      .limit(5),
    supabase
      .from("follows")
      .select("*", { count: "exact", head: true })
      .eq("follower_user_id", userId),
    supabase
      .from("rocker_messages")
      .select("role, content, meta")
      .eq("thread_id", threadId)
      .order("created_at", { ascending: false })
      .limit(10),
    supabase.rpc("recall_memories", { p_query: "", p_k: 6 }),
  ]);

  const lastQ = msgsRes.data
    ?.find((m: any) => m.role === "assistant" && (m.meta?.is_question || /[?]$/.test(m.content)))
    ?.content;

  return {
    top_interests: (interestsRes.data || []).map((i: any) => ({ id: i.interest_id, affinity: i.affinity })),
    follows_ct: followsRes.count || 0,
    last_question: lastQ || null,
    history: ((msgsRes.data || []) as Turn[]).reverse(),
    memories: memoriesRes.data || [],
  };
}

function scriptedReply(userMsg: string, ctx: any): { content: string; isQuestion: boolean } {
  const has3 = (ctx.top_interests?.length || 0) >= 3;
  const hasMemories = (ctx.memories?.length || 0) > 0;
  const cold = !has3 && !hasMemories;

  if (cold) {
    return {
      content: "Quick vibe-check: what are you most into right now? Pick 2-3 things you'd want to see more of.",
      isQuestion: true,
    };
  }

  const topics = ctx.top_interests?.map((i: any) => i.id).join(", ") || "your interests";
  return {
    content: `Got it! Want more ${topics}—or should I mix in something totally new?`,
    isQuestion: true,
  };
}

async function streamOpenAI(messages: Turn[], sys: string): Promise<ReadableStream> {
  const body = {
    model: "gpt-4o-mini",
    stream: true,
    messages: [{ role: "system", content: sys }, ...messages],
  };

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok || !res.body) throw new Error(`LLM error ${res.status}`);
  return res.body;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: req.headers.get("Authorization")! } } }
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user)
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });

    const payload = await req.json().catch(() => ({}));
    const { thread_id, user_message, remember } = payload;

    if (!thread_id || !user_message) {
      return new Response(JSON.stringify({ error: "thread_id and user_message required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Append user message
    await supabase.rpc("append_rocker_message", {
      p_thread: thread_id,
      p_role: "user",
      p_content: user_message,
    });

    // Telemetry
    await supabase.from("intent_signals").insert({
      user_id: user.id,
      name: "chat_turn_user",
      metadata: { len: user_message.length },
    });

    // Fetch context
    const ctx = await fetchContext(supabase, user.id, thread_id);
    const sys = systemPrompt(ctx);

    // Build message window
    const recent: Turn[] = ctx.history.slice(-8);
    const messages: Turn[] = [...recent, { role: "user", content: user_message }];

    let stream: ReadableStream;
    let assistantText = "";
    let isQuestion = false;

    if (MODE === "llm" && OPENAI_API_KEY) {
      stream = await streamOpenAI(messages, sys);
    } else {
      const scripted = scriptedReply(user_message, ctx);
      assistantText = scripted.content;
      isQuestion = scripted.isQuestion;

      stream = new ReadableStream({
        start(controller) {
          controller.enqueue(
            new TextEncoder().encode(`data: ${JSON.stringify({ delta: assistantText })}\n\n`)
          );
          controller.enqueue(new TextEncoder().encode("data: [DONE]\n\n"));
          controller.close();
        },
      });
    }

    // Fan-out: return stream to client while buffering full text
    const tee = stream.tee();
    const saver = (async () => {
      try {
        if (assistantText === "") {
          const reader = tee[1].getReader();
          let full = "";
          const dec = new TextDecoder();
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const chunk = dec.decode(value);

            for (const line of chunk.split("\n")) {
              const trimmed = line.trim();
              if (!trimmed.startsWith("data:")) continue;
              const json = trimmed.slice(5).trim();
              if (json === "[DONE]") break;
              try {
                const obj = JSON.parse(json);
                if (obj?.choices?.[0]?.delta?.content) full += obj.choices[0].delta.content;
                if (obj?.delta) full += obj.delta;
              } catch {}
            }
          }
          assistantText = full.trim();
          isQuestion = /[?]\s*$/.test(assistantText);
        }

        // Persist assistant turn
        await supabase.rpc("append_rocker_message", {
          p_thread: thread_id,
          p_role: "assistant",
          p_content: assistantText,
          p_meta: { is_question: isQuestion },
        });

        // Telemetry
        await supabase.from("intent_signals").insert({
          user_id: user.id,
          name: "chat_turn_assistant",
          metadata: { is_question: isQuestion, len: assistantText.length },
        });

        // Learning event
        await supabase.from("learning_events").insert({
          user_id: user.id,
          surface: "chat",
          candidate_id: "rocker_turn",
          policy: "chat_guided_v1",
          p_exp: 0.0,
          score: null,
          explored: isQuestion,
          reward: null,
          context: { thread_id },
        });

        // Auto-capture memory for super admin
        const { data: isSuper } = await supabase.rpc("is_super_admin");
        if ((isSuper || remember) && user_message.length > 10) {
          const u = user_message.toLowerCase();
          if (
            u.includes("i like ") ||
            u.includes("i love ") ||
            u.includes("my favorite") ||
            u.includes("i prefer")
          ) {
            await supabase.rpc("save_memory", {
              p_title: "preference",
              p_content: user_message,
              p_kind: "preference",
              p_tags: ["chat"],
              p_importance: 3,
            });
          } else if (u.includes("my goal") || u.includes("i want to")) {
            await supabase.rpc("save_memory", {
              p_title: "goal",
              p_content: user_message,
              p_kind: "goal",
              p_tags: ["chat"],
              p_importance: 4,
            });
          }
        }
      } catch (e) {
        console.error("save error", e);
      }
    })();

    return new Response(tee[0], {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (e: any) {
    console.error(e);
    return new Response(JSON.stringify({ error: e?.message || "error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
