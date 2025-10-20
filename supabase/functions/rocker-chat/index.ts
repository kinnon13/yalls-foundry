/**
 * Rocker Chat v1
 * Real-time conversational AI with tool calling, memory, and SMS support
 */

import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.75.0";
import { buildUserContext } from "./buildContext.ts";
import { executeToolLoop } from "./toolLoop.ts";
import { USER_MODE_NOTICE, ADMIN_MODE_NOTICE, KNOWER_MODE_NOTICE } from "./prompts.ts";
import { toolDefinitions } from "./tools/definitions.ts";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { user_id, session_id, message, actor_role = 'user' } = await req.json();

    if (!user_id || !message) {
      throw new Error("Missing required fields");
    }

    // Get user phone for SMS notifications
    const { data: voicePrefs } = await supabase
      .from("voice_preferences")
      .select("phone_number")
      .eq("user_id", user_id)
      .single();

    const userPhone = voicePrefs?.phone_number;

    // Build context
    const userContext = await buildUserContext(supabase, user_id);
    
    // Get conversation history
    const { data: history } = await supabase
      .from("rocker_messages")
      .select("role, content")
      .eq("thread_id", session_id)
      .order("created_at", { ascending: true })
      .limit(10);

    const conversationHistory = history || [];

    // Determine system prompt based on role
    let systemPrompt = USER_MODE_NOTICE;
    if (actor_role === 'admin') systemPrompt = ADMIN_MODE_NOTICE;
    if (actor_role === 'knower') systemPrompt = KNOWER_MODE_NOTICE;

    // Call Lovable AI with tools
    let reply = "I'm here to help! How can I assist you?";
    let actions = [];

    if (LOVABLE_API_KEY) {
      try {
        const aiMessages = [
          { role: "system", content: systemPrompt + "\n\n" + userContext },
          ...conversationHistory.map((m: any) => ({ role: m.role, content: m.content })),
          { role: "user", content: message }
        ];

        let aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash",
            messages: aiMessages,
            tools: toolDefinitions,
          }),
        });

        if (aiResponse.ok) {
          let data = await aiResponse.json();
          let assistantMessage = data.choices[0]?.message;

          // Tool loop - execute tools if requested
          let toolCallCount = 0;
          const maxToolCalls = 5;

          while (assistantMessage?.tool_calls && toolCallCount < maxToolCalls) {
            toolCallCount++;
            
            // Execute tools
            const toolResults = await executeToolLoop(
              aiMessages,
              assistantMessage.tool_calls,
              supabase,
              user_id,
              actor_role
            );

            // Add tool results to conversation
            aiMessages.push({ 
              role: "assistant", 
              content: assistantMessage.content || "",
              tool_calls: assistantMessage.tool_calls 
            });
            
            for (const result of toolResults) {
              aiMessages.push(result);
            }

            // Get next AI response
            aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
              method: "POST",
              headers: {
                Authorization: `Bearer ${LOVABLE_API_KEY}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                model: "google/gemini-2.5-flash",
                messages: aiMessages,
                tools: toolDefinitions,
              }),
            });

            if (aiResponse.ok) {
              data = await aiResponse.json();
              assistantMessage = data.choices[0]?.message;
            } else {
              break;
            }
          }

          reply = assistantMessage?.content || reply;
        }
      } catch (aiError) {
        console.error("AI error:", aiError);
      }
    }

    // Save messages to database
    await supabase.from("rocker_messages").insert([
      {
        thread_id: session_id,
        user_id,
        role: "user",
        content: message,
      },
      {
        thread_id: session_id,
        user_id,
        role: "assistant",
        content: reply,
      },
    ]);

    // Queue SMS if phone configured
    if (userPhone && reply) {
      await supabase.from("rocker_outbox").insert({
        user_id,
        channel: "sms",
        to_addr: userPhone,
        body: reply.substring(0, 300), // Trim for SMS
        status: "queued",
        scheduled_at: new Date().toISOString(),
      });
    }

    // Log action
    await supabase.from("ai_action_ledger").insert({
      user_id,
      agent: actor_role === 'knower' ? 'andy' : 'rocker',
      action: "chat_message",
      input: { message },
      output: { reply },
      result: "success",
    });

    return new Response(
      JSON.stringify({ reply, actions, sms_queued: !!userPhone }),
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
