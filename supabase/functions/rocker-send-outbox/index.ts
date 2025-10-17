/**
 * Rocker Outbox Sender
 * 
 * Processes queued messages from rocker_outbox and delivers via appropriate channels.
 * Run via cron every minute.
 * 
 * Supports: SMS (Twilio), Email (generic SMTP relay), Chat (in-app)
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

const TWILIO_SID = Deno.env.get("TWILIO_SID");
const TWILIO_TOKEN = Deno.env.get("TWILIO_TOKEN");
const TWILIO_FROM = Deno.env.get("TWILIO_FROM");

const SMTP_ENDPOINT = Deno.env.get("SMTP_ENDPOINT");
const SMTP_TOKEN = Deno.env.get("SMTP_TOKEN");

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface OutboxRow {
  id: string;
  user_id: string;
  channel: "sms" | "email" | "chat" | "push" | "voice" | "whatsapp";
  to_addr: string;
  subject: string | null;
  body: string;
  payload: any;
  attempt_count: number;
}

async function sendSms(to: string, body: string) {
  if (!TWILIO_SID || !TWILIO_TOKEN || !TWILIO_FROM) {
    throw new Error("Twilio credentials not configured");
  }

  const url = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_SID}/Messages.json`;
  const creds = btoa(`${TWILIO_SID}:${TWILIO_TOKEN}`);
  const form = new URLSearchParams({ From: TWILIO_FROM, To: to, Body: body });

  const res = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Basic ${creds}` },
    body: form,
  });

  if (!res.ok) {
    throw new Error(`Twilio error ${res.status}: ${await res.text()}`);
  }

  return await res.json();
}

async function sendEmail(to: string, subject: string | null, body: string, attachments?: any[]) {
  if (!SMTP_ENDPOINT || !SMTP_TOKEN) {
    throw new Error("SMTP credentials not configured");
  }

  const res = await fetch(SMTP_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${SMTP_TOKEN}`,
    },
    body: JSON.stringify({
      to,
      subject: subject ?? "Rocker",
      text: body,
      attachments: attachments ?? [],
    }),
  });

  if (!res.ok) {
    throw new Error(`SMTP error ${res.status}: ${await res.text()}`);
  }

  return await res.json();
}

async function sendChat(userId: string, body: string) {
  // Post to in-app chat/notifications table
  // For now, just insert into rocker_inbox as a "system" message
  await supabase.from("rocker_inbox").insert({
    user_id: userId,
    channel: "chat",
    from_addr: "system",
    body,
    payload: { auto: true },
  });
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Fetch due messages (queued and scheduled_at <= now)
    const { data: rows, error } = await supabase
      .from("rocker_outbox")
      .select("*")
      .eq("status", "queued")
      .lte("scheduled_at", new Date().toISOString())
      .limit(50);

    if (error) {
      console.error("[Outbox] Query error:", error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const results = { processed: 0, succeeded: 0, failed: 0 };

    for (const row of rows as OutboxRow[]) {
      results.processed++;

      try {
        // Mark as sending
        await supabase
          .from("rocker_outbox")
          .update({
            status: "sending",
            attempt_count: row.attempt_count + 1,
          })
          .eq("id", row.id);

        // Send via appropriate channel
        if (row.channel === "sms") {
          await sendSms(row.to_addr, row.body);
        } else if (row.channel === "email") {
          await sendEmail(
            row.to_addr,
            row.subject,
            row.body,
            row.payload?.attachments
          );
        } else if (row.channel === "chat") {
          await sendChat(row.user_id, row.body);
        } else {
          throw new Error(`Unsupported channel: ${row.channel}`);
        }

        // Mark as sent
        await supabase
          .from("rocker_outbox")
          .update({
            status: "sent",
            sent_at: new Date().toISOString(),
            error: null,
          })
          .eq("id", row.id);

        results.succeeded++;

        // Log telemetry
        await supabase.from("usage_events").insert({
          user_id: row.user_id,
          event_type: "proactive_sent",
          payload: {
            channel: row.channel,
            message_id: row.id,
          },
        });
      } catch (e) {
        console.error(`[Outbox] Failed to send ${row.id}:`, e);
        results.failed++;

        // Exponential backoff: 5min, 10min, 20min
        const maxRetries = 3;
        const status = row.attempt_count >= maxRetries ? "failed" : "queued";
        
        // Compute next retry time with exponential backoff
        const nextRetryDelayMs = Math.pow(2, row.attempt_count) * 5 * 60 * 1000;
        const nextScheduledAt = new Date(Date.now() + nextRetryDelayMs).toISOString();

        await supabase
          .from("rocker_outbox")
          .update({
            status,
            error: String(e),
            ...(status === "queued" && { scheduled_at: nextScheduledAt }),
          })
          .eq("id", row.id);
      }
    }

    console.log("[Outbox] Batch complete:", results);

    return new Response(JSON.stringify(results), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error("[Outbox] Fatal error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
