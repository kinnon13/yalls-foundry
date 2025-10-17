/**
 * Rocker SMS Webhook
 * 
 * Receives inbound SMS from Twilio, logs to inbox, and routes:
 * - Quick replies (Y/Later/Skip) to task state machine
 * - Free-form text to planner/executor
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function parseLaterTime(text: string): string | null {
  // Parse "Later 3pm" or "Later 15:00" or "Later 3:30pm"
  const m = text.match(/later\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i);
  if (!m) return null;

  let hour = parseInt(m[1], 10);
  const minute = m[2] ? parseInt(m[2], 10) : 0;
  const ampm = m[3]?.toLowerCase();

  if (ampm === "pm" && hour < 12) hour += 12;
  if (ampm === "am" && hour === 12) hour = 0;

  const when = new Date();
  when.setHours(hour, minute, 0, 0);

  // If time is in the past, assume tomorrow
  if (when.getTime() < Date.now()) {
    when.setDate(when.getDate() + 1);
  }

  return when.toISOString();
}

async function enqueueReply(userId: string, phone: string, body: string) {
  return await supabase.rpc("rocker_enqueue_message", {
    p_user: userId,
    p_channel: "sms",
    p_to: phone,
    p_subject: null,
    p_body: body,
  });
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const form = await req.formData();
    const from = String(form.get("From") ?? "");
    const body = String(form.get("Body") ?? "");

    if (!from || !body) {
      return new Response(
        "<Response><Message>Sorry, I didn't catch that.</Message></Response>",
        { headers: { "Content-Type": "text/xml", ...corsHeaders } }
      );
    }

    // Look up user by phone
    const { data: contact } = await supabase
      .from("user_contacts")
      .select("user_id")
      .eq("phone", from)
      .maybeSingle();

    if (!contact) {
      return new Response(
        "<Response><Message>Please link this phone in Settings → AI.</Message></Response>",
        { headers: { "Content-Type": "text/xml", ...corsHeaders } }
      );
    }

    const userId = contact.user_id;

    // Log to inbox
    await supabase.from("rocker_inbox").insert({
      user_id: userId,
      channel: "sms",
      from_addr: from,
      body,
      payload: { twilio: true },
    });

    const text = body.trim().toLowerCase();

    // Quick reply: Y/Yes (approve pending task)
    if (["y", "yes", "yeah", "yep"].includes(text)) {
      const { data: task } = await supabase
        .from("rocker_tasks")
        .select("id, title")
        .eq("user_id", userId)
        .eq("status", "waiting_approval")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (task) {
        await supabase
          .from("rocker_tasks")
          .update({ status: "queued" })
          .eq("id", task.id);

        await enqueueReply(
          userId,
          from,
          `✅ Got it. I'll take care of "${task.title}" now.`
        );
      } else {
        await enqueueReply(
          userId,
          from,
          "I don't have anything waiting for your approval right now."
        );
      }

      return new Response("<Response></Response>", {
        headers: { "Content-Type": "text/xml", ...corsHeaders },
      });
    }

    // Quick reply: Later HH:MM (defer task)
    if (text.startsWith("later")) {
      const when = parseLaterTime(body);

      if (when) {
        const { data: task } = await supabase
          .from("rocker_tasks")
          .select("id")
          .eq("user_id", userId)
          .eq("status", "waiting_approval")
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (task) {
          await supabase
            .from("rocker_tasks")
            .update({ scheduled_for: when, status: "queued" })
            .eq("id", task.id);

          await enqueueReply(
            userId,
            from,
            `Okay, I'll remind you ${new Date(when).toLocaleString("en-US", {
              hour: "numeric",
              minute: "2-digit",
            })}.`
          );
        }
      } else {
        await enqueueReply(
          userId,
          from,
          'Try "Later 3pm" or "Later 15:30" to defer.'
        );
      }

      return new Response("<Response></Response>", {
        headers: { "Content-Type": "text/xml", ...corsHeaders },
      });
    }

    // Quick reply: Skip/No (cancel task)
    if (["skip", "no", "nope", "cancel"].includes(text)) {
      const { data: task } = await supabase
        .from("rocker_tasks")
        .select("id, title")
        .eq("user_id", userId)
        .eq("status", "waiting_approval")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (task) {
        await supabase
          .from("rocker_tasks")
          .update({ status: "cancelled" })
          .eq("id", task.id);

        await enqueueReply(userId, from, `Okay, I cancelled "${task.title}".`);
      }

      return new Response("<Response></Response>", {
        headers: { "Content-Type": "text/xml", ...corsHeaders },
      });
    }

    // Free-form command → route to planner (TODO: implement in PR2.8)
    // For now, acknowledge receipt
    await enqueueReply(
      userId,
      from,
      "Got your message. Planner coming soon in PR2.8! 🚀"
    );

    return new Response("<Response></Response>", {
      headers: { "Content-Type": "text/xml", ...corsHeaders },
    });
  } catch (error) {
    console.error("[SMS Webhook] Error:", error);
    return new Response(
      "<Response><Message>Sorry, something went wrong. Try again?</Message></Response>",
      { headers: { "Content-Type": "text/xml", ...corsHeaders } }
    );
  }
});
