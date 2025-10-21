import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET,POST,DELETE,OPTIONS',
};

// Encryption helpers
async function getKey(): Promise<CryptoKey> {
  const raw = Deno.env.get("ENCRYPTION_KEY");
  
  // Debug logging
  const allEnvKeys = Object.keys(Deno.env.toObject());
  console.log("Available env keys:", allEnvKeys.filter(k => !k.includes('KEY')).join(', '));
  console.log("ENCRYPTION_KEY exists?", allEnvKeys.includes("ENCRYPTION_KEY"));
  
  if (!raw) {
    throw new Error("ENCRYPTION_KEY not found in environment. Please add it in Cloud > Secrets with name: ENCRYPTION_KEY");
  }
  
  let keyBytes: Uint8Array;
  if (raw.startsWith("base64:")) {
    const b64 = raw.slice(7);
    const binString = atob(b64);
    keyBytes = new Uint8Array(binString.length);
    for (let i = 0; i < binString.length; i++) {
      keyBytes[i] = binString.charCodeAt(i);
    }
  } else {
    keyBytes = new TextEncoder().encode(raw);
  }
  
  if (keyBytes.length !== 32) {
    throw new Error(`ENCRYPTION_KEY must be 32 bytes, got ${keyBytes.length}`);
  }
  
  return await crypto.subtle.importKey(
    "raw",
    keyBytes,
    { name: "AES-GCM" },
    false,
    ["encrypt", "decrypt"]
  );
}

async function encryptSecret(plain: string): Promise<string> {
  const key = await getKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const plainBytes = new TextEncoder().encode(plain);
  
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    plainBytes
  );
  
  const ivB64 = btoa(String.fromCharCode(...iv));
  const ctB64 = btoa(String.fromCharCode(...new Uint8Array(ciphertext)));
  
  return `${ivB64}.${ctB64}`;
}

function maskKey(s: string): string {
  return s.length <= 8 ? "••••" : s.slice(0, 4) + "•••" + s.slice(-4);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const authHeader = req.headers.get("Authorization")!;
    
    // Auth client (for verifying user)
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Service client (bypass RLS for managed operations, scoped by owner_user_id)
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!serviceKey) {
      return new Response(JSON.stringify({ error: "server misconfigured: missing service key" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const serviceClient = createClient(supabaseUrl, serviceKey);

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // GET - list secrets
    if (req.method === "GET") {
      const { data, error } = await serviceClient
        .from("app_provider_secrets")
        .select("id, provider, name, created_at, updated_at, last_used_at")
        .eq("owner_user_id", user.id)
        .order("provider")
        .order("name");
      
      if (error) throw error;
      
      return new Response(JSON.stringify({ items: data }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // POST - save/update secret
    if (req.method === "POST") {
      const { provider, name = "default", apiKey } = await req.json();
      
      if (!provider || !apiKey) {
        return new Response(JSON.stringify({ error: "provider and apiKey required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const encrypted = await encryptSecret(apiKey.trim());
      
      const { error } = await serviceClient
        .from("app_provider_secrets")
        .upsert({
          owner_user_id: user.id,
          provider,
          name,
          enc_api_key: encrypted,
        }, {
          onConflict: "owner_user_id,provider,name"
        });
      
      if (error) throw error;
      
      return new Response(JSON.stringify({
        ok: true,
        stored: { provider, name, mask: maskKey(apiKey) }
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // DELETE - remove secret
    if (req.method === "DELETE") {
      const { provider, name = "default" } = await req.json();
      
      const { error } = await serviceClient
        .from("app_provider_secrets")
        .delete()
        .eq("owner_user_id", user.id)
        .eq("provider", provider)
        .eq("name", name);
      
      if (error) throw error;
      
      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("secrets-manage error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
