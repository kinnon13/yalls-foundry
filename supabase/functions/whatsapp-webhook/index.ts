/**
 * WhatsApp Webhook - Twilio WhatsApp Integration
 * Receives incoming WhatsApp messages and forwards to Rocker
 */

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Parse Twilio webhook
    const formData = await req.formData();
    const from = formData.get("From")?.toString() || "";
    const body = formData.get("Body")?.toString() || "";
    const messageId = formData.get("MessageSid")?.toString() || "";

    if (!from || !body) {
      return new Response("Missing From or Body", { status: 400 });
    }

    // Extract phone number (format: whatsapp:+1234567890)
    const phone = from.replace("whatsapp:", "");

    // Find user by phone in voice_preferences
    const { data: userPref } = await supabase
      .from("voice_preferences")
      .select("user_id")
      .eq("channel", "whatsapp")
      .eq("target", phone)
      .maybeSingle();

    if (!userPref) {
      console.log("No user found for phone:", phone);
      return new Response("User not found", { status: 404 });
    }

    // Insert message into messages table
    await supabase.from("messages").insert({
      user_id: userPref.user_id,
      role: "user",
      body,
      channel: "whatsapp",
      meta: {
        twilio_sid: messageId,
        phone,
      },
    });

    // Respond with TwiML (empty for now, Rocker will reply async)
    return new Response(
      `<?xml version="1.0" encoding="UTF-8"?><Response></Response>`,
      { headers: { "Content-Type": "text/xml" } }
    );
  } catch (error: any) {
    console.error("whatsapp-webhook error:", error);
    return new Response(`Error: ${error.message}`, { status: 500 });
  }
});
