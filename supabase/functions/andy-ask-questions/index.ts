import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing authorization");
    
    const { data: { user }, error: userError } = await supabase.auth.getUser(
      authHeader.replace("Bearer ", "")
    );
    if (userError || !user) throw new Error("Unauthorized");

    // Get recent knowledge about user
    const { data: recentKnowledge } = await supabase
      .from('rocker_knowledge')
      .select('content, chunk_summary')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10);

    const { data: memories } = await supabase
      .from('rocker_long_memory')
      .select('kind, key, value')
      .eq('user_id', user.id)
      .order('priority', { ascending: true })
      .limit(20);

    // Build context
    const knowledgeContext = recentKnowledge?.map(k => k.chunk_summary || k.content.slice(0, 200)).join('\n') || '';
    const memoryContext = memories?.map(m => `${m.kind}: ${JSON.stringify(m.value).slice(0, 100)}`).join('\n') || '';

    // Ask AI for inquisitive follow-up questions
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are Andy, a proactive AI assistant. Based on what you know about the user, ask 2-3 thoughtful, inquisitive questions to learn more and help them better. Be curious about:
- Their goals and what they're working towards
- Context around their projects
- How you can be more useful
- Things they've mentioned but haven't fully explained

Return ONLY a JSON array of questions, no other text:
["question 1", "question 2", "question 3"]`
          },
          {
            role: "user",
            content: `Recent knowledge:\n${knowledgeContext}\n\nMemories:\n${memoryContext}\n\nWhat questions should I ask to learn more?`
          }
        ],
        temperature: 0.7,
      }),
    });

    if (!aiResponse.ok) {
      const error = await aiResponse.text();
      console.error("AI error:", error);
      throw new Error("Failed to generate questions");
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content || "[]";
    
    let questions: string[] = [];
    try {
      questions = JSON.parse(content);
    } catch {
      // If not JSON, split by newlines and clean
      questions = content.split('\n')
        .map((q: string) => q.trim())
        .filter((q: string) => q.length > 10)
        .slice(0, 3);
    }

    return new Response(JSON.stringify({ questions }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("[andy-ask-questions] Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
