export const corsHeaders = {
  "Access-Control-Allow-Origin": Deno.env.get("ALLOWED_ORIGIN") ?? "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

export function withCors(body: BodyInit | null, init: ResponseInit = {}) {
  return new Response(body, { ...init, headers: { ...(init.headers ?? {}), ...corsHeaders } });
}
