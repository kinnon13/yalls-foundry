import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

serve((req) => {
  const headers = new Headers({
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,OPTIONS",
  });

  const envKeys = [
    "BUILD_SHA",
    "SUPABASE_URL",
    "SUPABASE_ANON_KEY",
    "LOVABLE_PROJECT_ID",
    "LOVABLE_ENV",
  ];
  const env = Object.fromEntries(envKeys.map(k => [k, Boolean(Deno.env.get(k))]));

  const out = {
    ok: true,                        // ✅ keyless: always healthy if the function runs
    now: new Date().toISOString(),
    path: new URL(req.url).pathname,
    env,                             // shows which env vars exist (true/false), but never their values
  };

  return new Response(JSON.stringify(out), { status: 200, headers });
});
