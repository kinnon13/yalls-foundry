import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface TwilioMessage {
  sid: string;
  body: string;
  from: string;
  to: string;
  status: string;
  dateCreated: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
      }
    );

    const {
      data: { user },
    } = await supabaseClient.auth.getUser();

    if (!user) {
      throw new Error("Unauthorized");
    }

    const { action, to, message, approval_id, metadata } = await req.json();

    const TWILIO_ACCOUNT_SID = Deno.env.get("TWILIO_ACCOUNT_SID");
    const TWILIO_AUTH_TOKEN = Deno.env.get("TWILIO_AUTH_TOKEN");
    const TWILIO_PHONE_NUMBER = Deno.env.get("TWILIO_PHONE_NUMBER");

    if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE_NUMBER) {
      throw new Error("Twilio credentials not configured");
    }

    // Send SMS message
    if (action === "send_sms") {
      const { data: prefs } = await supabaseClient
        .from("voice_preferences")
        .select("phone_number")
        .eq("user_id", user.id)
        .maybeSingle();

      const targetPhone = to || prefs?.phone_number;
      
      if (!targetPhone) {
        throw new Error("No phone number configured");
      }

      console.log("Sending SMS to:", targetPhone);

      // Send SMS via Twilio
      const smsResponse = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`,
        {
          method: "POST",
          headers: {
            Authorization: `Basic ${btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`)}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            From: TWILIO_PHONE_NUMBER,
            To: targetPhone,
            Body: message
          }),
        }
      );

      if (!smsResponse.ok) {
        const errorText = await smsResponse.text();
        console.error("Twilio SMS error:", errorText);
        throw new Error(`Failed to send SMS: ${errorText}`);
      }

      const smsData: TwilioMessage = await smsResponse.json();
      console.log("SMS sent successfully:", smsData.sid);

      // Log to voice_interactions
      await supabaseClient.from("voice_interactions").insert({
        user_id: user.id,
        interaction_type: "sms_outbound",
        phone_number: targetPhone,
        message_body: message,
        status: smsData.status,
        twilio_sid: smsData.sid,
        metadata: metadata || {}
      });

      return new Response(
        JSON.stringify({ 
          success: true, 
          message_sid: smsData.sid,
          status: smsData.status
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "initiate_call") {
      // Check if user allows voice calls
      const { data: prefs } = await supabaseClient
        .from("voice_preferences")
        .select("*")
        .eq("user_id", user.id)
        .single();

      const { data: canCall } = await supabaseClient.rpc("can_initiate_voice_call", {
        p_user_id: user.id,
      });

      if (!canCall) {
        return new Response(
          JSON.stringify({ error: "Voice calls not allowed at this time" }),
          {
            status: 403,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      // Create TwiML for the call
      const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">Hi, this is Rocker calling about ${message || "an approval request"}. ${
    approval_id ? `Please check your dashboard for approval ID ${approval_id}` : ""
  }</Say>
  <Pause length="1"/>
  <Say voice="alice">You can respond via text message or in the app. Thank you!</Say>
</Response>`;

      // Store TwiML temporarily (in production, use a proper storage)
      const twimlUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/rocker-voice-twiml?message=${encodeURIComponent(message || "")}&approval_id=${approval_id || ""}`;

      // Initiate call
      const callResponse = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Calls.json`,
        {
          method: "POST",
          headers: {
            Authorization: `Basic ${btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`)}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            To: to || prefs?.phone_number,
            From: TWILIO_PHONE_NUMBER,
            Url: twimlUrl,
            Record: "true",
          }),
        }
      );

      if (!callResponse.ok) {
        const error = await callResponse.text();
        throw new Error(`Twilio error: ${error}`);
      }

      const callData = await callResponse.json();

      // Log the interaction
      await supabaseClient.from("voice_interactions").insert({
        user_id: user.id,
        interaction_type: "call",
        direction: "outbound",
        twilio_call_sid: callData.sid,
        metadata: { message, approval_id },
      });

      return new Response(
        JSON.stringify({
          success: true,
          call_sid: callData.sid,
          message: "Call initiated",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    } else if (action === "send_voice_message") {
      // Generate TTS audio via unified gateway
      const { ai } = await import("../_shared/ai.ts");

      const { data: prefs } = await supabaseClient
        .from("voice_preferences")
        .select("preferred_voice")
        .eq("user_id", user.id)
        .single();

      const audioBuffer = await ai.tts('user', message, prefs?.preferred_voice || "alloy");
      const audioBase64 = btoa(String.fromCharCode(...new Uint8Array(audioBuffer)));

      // Upload to storage
      const fileName = `voice-messages/${user.id}/${Date.now()}.mp3`;
      const { data: uploadData, error: uploadError } = await supabaseClient.storage
        .from("voice-messages")
        .upload(fileName, audioBuffer, {
          contentType: "audio/mpeg",
        });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabaseClient.storage
        .from("voice-messages")
        .getPublicUrl(fileName);

      // Log the interaction
      await supabaseClient.from("voice_interactions").insert({
        user_id: user.id,
        interaction_type: "voice_message",
        direction: "outbound",
        recording_url: urlData.publicUrl,
        transcript: message,
        status: "completed",
      });

      return new Response(
        JSON.stringify({
          success: true,
          audio_url: urlData.publicUrl,
          audio_base64: audioBase64,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    throw new Error("Invalid action");
  } catch (error: any) {
    console.error("Voice call error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
