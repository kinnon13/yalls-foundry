import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const HMAC_SECRET = Deno.env.get("PREVIEW_HMAC_SECRET")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function b64url(data: ArrayBuffer) {
  const b = Array.from(new Uint8Array(data))
    .map(x => String.fromCharCode(x))
    .join("");
  return btoa(b).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+/g, "");
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405, headers: corsHeaders });
  }

  try {
    const { parentOrigin, ttlSeconds = 300 } = await req.json();
    
    if (!parentOrigin) {
      return new Response("Missing parentOrigin", { status: 400, headers: corsHeaders });
    }

    // Validate ttl is between 60 and 900 seconds
    const ttl = Math.max(60, Math.min(900, Number(ttlSeconds)));
    const exp = Date.now() + ttl * 1000;
    
    const message = `${parentOrigin}|${exp}`;
    
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(HMAC_SECRET),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    
    const signature = await crypto.subtle.sign(
      "HMAC",
      key,
      new TextEncoder().encode(message)
    );
    
    return new Response(
      JSON.stringify({
        tk: b64url(signature),
        exp,
        origin: parentOrigin,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Token signing error:", error);
    return new Response("Internal error", { status: 500, headers: corsHeaders });
  }
});
