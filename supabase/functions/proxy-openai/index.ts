import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function getKey(): Promise<CryptoKey> {
  const raw = Deno.env.get("ENCRYPTION_KEY");
  if (!raw) throw new Error("ENCRYPTION_KEY missing");
  
  let keyBytes: Uint8Array;
  if (raw.startsWith("base64:")) {
    const b64 = raw.slice(7);
    const binString = atob(b64);
    const tmp = new Uint8Array(binString.length);
    for (let i = 0; i < binString.length; i++) tmp[i] = binString.charCodeAt(i);
    if (tmp.length === 32) keyBytes = tmp;
    else {
      // Derive a 32-byte key from provided bytes if length is not 32
      const digest = await crypto.subtle.digest("SHA-256", tmp);
      keyBytes = new Uint8Array(digest);
    }
  } else {
    // Derive a stable 32-byte key from arbitrary string
    const te = new TextEncoder().encode(raw);
    const digest = await crypto.subtle.digest("SHA-256", te);
    keyBytes = new Uint8Array(digest);
  }
  
  return await crypto.subtle.importKey(
    "raw",
    keyBytes,
    { name: "AES-GCM" },
    false,
    ["encrypt", "decrypt"]
  );
}

async function decryptSecret(bundle: string): Promise<string> {
  const key = await getKey();
  const [ivB64, ctB64] = bundle.split(".");
  
  const ivBin = atob(ivB64);
  const iv = new Uint8Array(ivBin.length);
  for (let i = 0; i < ivBin.length; i++) {
    iv[i] = ivBin.charCodeAt(i);
  }
  
  const ctBin = atob(ctB64);
  const ct = new Uint8Array(ctBin.length);
  for (let i = 0; i < ctBin.length; i++) {
    ct[i] = ctBin.charCodeAt(i);
  }
  
  const plainBytes = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    ct
  );
  
  return new TextDecoder().decode(plainBytes);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const authHeader = req.headers.get("Authorization")!;
    
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { path = "/chat/completions", body, keyName = "default" } = await req.json();

    // Fetch encrypted key
    // Fetch encrypted key with robust fallbacks
    let secretData: { enc_api_key: string } | null = null;

    // 1) Exact match (provider/name)
    const { data: exact, error: exactError } = await supabase
      .from("app_provider_secrets")
      .select("enc_api_key, name, provider")
      .eq("owner_user_id", user.id)
      .eq("provider", "openai")
      .eq("name", keyName)
      .maybeSingle();

    if (exact && !exactError) {
      secretData = exact as any;
    } else {
      // 2) Case-insensitive provider/name; 3) Any 'openai' key; prefer name match, then 'default'
      const { data: candidates, error: candError } = await supabase
        .from("app_provider_secrets")
        .select("enc_api_key, name, provider")
        .eq("owner_user_id", user.id)
        .ilike("provider", "openai");

      if (!candError && candidates && candidates.length) {
        const want = (keyName || "default").toLowerCase();
        const byName = candidates.find((r: any) => (r.name || "").toLowerCase() === want);
        const byDefault = candidates.find((r: any) => (r.name || "").toLowerCase() === "default");
        secretData = (byName || byDefault || candidates[0]) as any;
      }
    }

    // Resolve API key: prefer stored user secret, fallback to OPENAI_API_KEY env
    let apiKey: string | null = null;
    let usedStoredSecret = false;

    if (secretData) {
      try {
        apiKey = await decryptSecret(secretData.enc_api_key);
        usedStoredSecret = true;
      } catch (e) {
        console.error("proxy-openai decrypt failed, falling back to env key:", e);
      }
    }

    if (!apiKey) {
      const envKey = Deno.env.get("OPENAI_API_KEY");
      if (envKey) {
        apiKey = envKey;
      } else {
        // No user secret and no env key available
        return new Response(JSON.stringify({ error: "OpenAI API key not configured" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const baseUrl = Deno.env.get("OPENAI_BASE_URL") || "https://api.openai.com/v1";
    const url = `${baseUrl}${path}`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    // Update last_used_at only when we used a stored secret
    if (usedStoredSecret) {
      await supabase
        .from("app_provider_secrets")
        .update({ last_used_at: new Date().toISOString() })
        .eq("provider", "openai")
        .eq("name", ((secretData as any)?.name ?? keyName));
    }

    // Stream response directly (supports SSE when stream=true)
    return new Response(response.body, {
      status: response.status,
      headers: {
        ...corsHeaders,
        "Content-Type": response.headers.get("content-type") || "application/json"
      },
    });

  } catch (error) {
    console.error("proxy-openai error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
