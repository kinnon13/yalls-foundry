import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { z } from "https://esm.sh/zod@3.23.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const BodySchema = z.object({
  event_type: z.string().min(1).max(64),
  source: z.enum(["pay-preview","admin-preview","data-preview","app-preview","preview-security"]),
  payload: z.unknown().optional(),
  route: z.string().max(256).optional(),
  user_agent: z.string().max(1024).optional(),
  hmac: z.object({ tk: z.string(), exp: z.number().int(), origin: z.string().url() }).optional(),
});

function firstIp(h: Headers): string | null {
  const xff = h.get("x-forwarded-for");
  if (!xff) return null;
  return xff.split(",")[0].trim();
}

async function sha256Hex(text: string) {
  const d = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(d)).map(b => b.toString(16).padStart(2, "0")).join("");
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return new Response("Method Not Allowed", { status: 405, headers: corsHeaders });

  // Small body guard (16KB)
  const contentLength = Number(req.headers.get("content-length") || 0);
  if (contentLength > 16_384) {
    return new Response("Payload too large", { status: 413, headers: corsHeaders });
  }
  if (!req.headers.get("content-type")?.includes("application/json")) {
    return new Response("Invalid content type", { status: 415, headers: corsHeaders });
  }

  // Build clients
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const admin = createClient(supabaseUrl, serviceRoleKey);

  // Authenticate user from bearer token
  const authHeader = req.headers.get("authorization") || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) return new Response("Unauthorized", { status: 401, headers: corsHeaders });
  const { data: { user }, error: authErr } = await admin.auth.getUser(token);
  if (authErr || !user) return new Response("Unauthorized", { status: 401, headers: corsHeaders });

  // Parse + validate body
  let bodyJson: unknown;
  try {
    bodyJson = await req.json();
  } catch {
    return new Response("Malformed JSON", { status: 400, headers: corsHeaders });
  }
  const parsed = BodySchema.safeParse(bodyJson);
  if (!parsed.success) {
    return new Response("Invalid payload", { status: 400, headers: corsHeaders });
  }
  const { event_type, source, payload, route, user_agent, hmac } = parsed.data;

  // Privacy: hash the payload instead of storing it
  const payloadStr = JSON.stringify(payload ?? {});
  const payload_hash = await sha256Hex(payloadStr);

  // Deterministic idempotency key (5-min bucket to avoid noisy dupes)
  const now = new Date();
  const bucket5m = Math.floor(now.getTime() / (5 * 60 * 1000));
  const event_id = await sha256Hex(
    `${user.id}|${source}|${event_type}|${route ?? ""}|${payload_hash}|${bucket5m}`
  );

  const ip = firstIp(req.headers);
  const ua = user_agent || req.headers.get("user-agent") || null;

  // Write audit (service role bypasses RLS)
  // Use conditional insert to handle idempotency
  const { data: existing } = await admin
    .from("preview_audit_log")
    .select("id")
    .eq("event_id", event_id)
    .maybeSingle();

  if (existing) {
    // Already logged, return success
    return new Response(JSON.stringify({ ok: true, event_id, duplicate: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const { error: insertErr } = await admin
    .from("preview_audit_log")
    .insert({
      event_id,
      user_id: user.id,
      source,
      event_type,
      route: route ?? null,
      payload_hash,
      user_agent: ua,
      ip_inet: ip,
      meta: hmac ? { hmac_origin: hmac.origin, hmac_exp: hmac.exp } : {},
    });

  if (insertErr) {
    console.error("audit insert failed:", insertErr);
    return new Response("Audit failed", { status: 500, headers: corsHeaders });
  }

  return new Response(JSON.stringify({ ok: true, event_id }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
