import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createLogger } from "../_shared/logger.ts";
import { withRateLimit, RateLimits } from "../_shared/rate-limit-wrapper.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const log = createLogger('chat-store');
  log.startTimer();

  // Apply rate limiting
  const limited = await withRateLimit(req, 'chat-store', RateLimits.high);
  if (limited) return limited;

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      throw new Error("Backend is missing configuration");
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } },
    });

    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ ok: false, error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      const { session_id, role, content, metadata } = await req.json();
      if (!session_id || !role || !content) {
        return new Response(JSON.stringify({ ok: false, error: "Missing fields" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { error: insertErr } = await supabase.from("rocker_conversations").insert({
        user_id: userData.user.id,
        session_id,
        role,
        content,
        metadata: metadata ?? {},
      });

      if (insertErr) throw insertErr;

      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ ok: false, error: "Unsupported content type" }), {
      status: 415,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    log.error('Chat-store error', e);
    return new Response(JSON.stringify({ ok: false, error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
