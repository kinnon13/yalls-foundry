import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
      }
    );

    // Get user for overrides
    const { data: { user } } = await supabase.auth.getUser();

    // Fetch all runtime flags
    const { data: flags } = await supabase
      .from("runtime_flags")
      .select("key, value");

    let overrides: Record<string, any> = {};
    
    // Fetch user overrides if authenticated
    if (user) {
      const { data: o } = await supabase
        .from("runtime_flag_overrides")
        .select("key, value")
        .eq("user_id", user.id);
      
      o?.forEach((r: any) => {
        overrides[r.key] = r.value;
      });
    }

    // Merge flags with overrides
    const payload: Record<string, any> = {};
    flags?.forEach((f: any) => {
      payload[f.key] = overrides[f.key] ?? f.value;
    });

    return new Response(
      JSON.stringify({ flags: payload }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Feature flags error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
