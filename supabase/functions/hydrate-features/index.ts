import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface UserFeatures {
  top_interests: Array<{ id: string; affinity: number }>;
  emb?: number[];
  follows_ct?: number;
  watch_time_7d?: number;
  ctr_7d?: number;
}

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

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 401,
        }
      );
    }

    // Fetch user interests (top 10 by affinity)
    const { data: interests } = await supabase
      .from("user_interests")
      .select("interest_id, affinity")
      .eq("user_id", user.id)
      .order("affinity", { ascending: false })
      .limit(10);

    // Fetch profile embedding
    const { data: profile } = await supabase
      .from("profiles")
      .select("interests_embedding")
      .eq("user_id", user.id)
      .single();

    // Fetch follows count
    const { count: followsCount } = await supabase
      .from("follows")
      .select("*", { count: "exact", head: true })
      .eq("follower_user_id", user.id);

    // Build feature object
    const features: UserFeatures = {
      top_interests:
        interests?.map((i) => ({
          id: i.interest_id,
          affinity: i.affinity,
        })) || [],
      emb: profile?.interests_embedding || undefined,
      follows_ct: followsCount || 0,
      // TODO: Add watch_time_7d and ctr_7d from telemetry aggregates
    };

    // In production, write to Redis with TTL jitter (prevents thundering herd):
    // const jitteredTtl = 3600 + Math.floor(Math.random() * 720) - 360; // 3600 ± 10%
    // await redis.set(`feat:user:${user.id}:v1`, JSON.stringify(features), { EX: jitteredTtl });

    return new Response(JSON.stringify({ features }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error("Hydration error:", e);
    return new Response(
      JSON.stringify({ error: e?.message ?? "unknown error" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
