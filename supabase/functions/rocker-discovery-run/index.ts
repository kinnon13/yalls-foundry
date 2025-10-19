import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // Lease up to 20 items with 2-minute TTL
  const { data: items, error: fetchError } = await supabase
    .rpc("lease_discovery_items", {
      p_limit: 20,
      p_ttl_seconds: 120
    });

    if (fetchError) {
      console.error("Failed to fetch queue:", fetchError);
      return new Response(
        JSON.stringify({ error: fetchError.message }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        }
      );
    }

    const results: any[] = [];

  // Process each leased item
  for (const item of items ?? []) {
    try {
      // Item is already marked as processing via lease
      
      // Check inventory for this category
        // Note: marketplace_listings.category is text, so we join via the category_id's corresponding text
        const { data: category } = await supabase
          .from("marketplace_categories")
          .select("category")
          .eq("id", item.category_id)
          .single();

        const { count } = await supabase
          .from("marketplace_listings")
          .select("*", { count: "exact", head: true })
          .eq("category", category?.category ?? "");

        // Determine gap level
        const gap = !count ? "critical" : count < 5 ? "low" : "none";

        // Upsert gap record
        await supabase.from("marketplace_gaps").upsert(
          {
            interest_id: item.interest_id,
            category_id: item.category_id,
            inventory_ct: count ?? 0,
            gap_level: gap,
            last_checked: new Date().toISOString(),
          },
          { onConflict: "interest_id" }
        );

      // Acknowledge successful processing
      await supabase.rpc("ack_discovery_item", {
        p_id: item.id,
        p_token: item.lease_token
      });

      results.push({ id: item.id, gap, count: count ?? 0 });
    } catch (e: any) {
      console.error(`Error processing item ${item.id}:`, e);
      // Mark failed (will retry or dead-letter after 4 attempts)
      await supabase.rpc("fail_event", {
        p_id: item.id,
        p_token: item.lease_token,
        p_error: e?.message ?? "unknown",
      });
      results.push({ id: item.id, error: e?.message });
    }
  }

    return new Response(
      JSON.stringify({ processed: results.length, results }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (e: any) {
    console.error("Worker failed:", e);
    return new Response(
      JSON.stringify({ error: e?.message ?? "unknown error" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
