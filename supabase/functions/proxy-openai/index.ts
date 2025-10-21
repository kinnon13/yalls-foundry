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
    keyBytes = new Uint8Array(binString.length);
    for (let i = 0; i < binString.length; i++) {
      keyBytes[i] = binString.charCodeAt(i);
    }
  } else {
    keyBytes = new TextEncoder().encode(raw);
  }
  
  if (keyBytes.length !== 32) throw new Error("ENCRYPTION_KEY must be 32 bytes");
  
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
    const { data: secretData, error: secretError } = await supabase
      .from("app_provider_secrets")
      .select("enc_api_key")
      .eq("owner_user_id", user.id)
      .eq("provider", "openai")
      .eq("name", keyName)
      .single();

    if (secretError || !secretData) {
      return new Response(JSON.stringify({ error: "OpenAI API key not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const apiKey = await decryptSecret(secretData.enc_api_key);
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

    // Update last_used_at
    await supabase
      .from("app_provider_secrets")
      .update({ last_used_at: new Date().toISOString() })
      .eq("owner_user_id", user.id)
      .eq("provider", "openai")
      .eq("name", keyName);

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
