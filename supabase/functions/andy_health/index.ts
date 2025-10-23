import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

serve((_req) => {
  const headers = new Headers({
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,OPTIONS",
  });

  const env = Deno.env;
  const checks = {
    openai_key: Boolean(env.get("OPENAI_API_KEY")),
    supabase_url: Boolean(env.get("SUPABASE_URL")),
    supabase_anon_key: Boolean(env.get("SUPABASE_ANON_KEY")),
    build_sha: env.get("BUILD_SHA") ?? null,
  };

  const ok = checks.openai_key;
  return new Response(JSON.stringify({ ok, checks, now: new Date().toISOString() }), {
    status: ok ? 200 : 503,
    headers,
  });
});
