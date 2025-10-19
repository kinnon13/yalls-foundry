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

    // Fetch up to 20 queued items
    const { data: items, error: fetchError } = await supabase
      .from("marketplace_discovery_queue")
      .select("*")
      .eq("status", "queued")
      .limit(20);

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

    // Process each item
    for (const item of items ?? []) {
      try {
        // Mark as processing
        await supabase
          .from("marketplace_discovery_queue")
          .update({
            status: "processing",
            updated_at: new Date().toISOString(),
          })
          .eq("id", item.id);

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

        // Mark as done
        await supabase
          .from("marketplace_discovery_queue")
          .update({
            status: "done",
            updated_at: new Date().toISOString(),
          })
          .eq("id", item.id);

        results.push({ id: item.id, gap, count: count ?? 0 });
      } catch (e: any) {
        console.error(`Error processing item ${item.id}:`, e);
        // Mark error via RPC
        await supabase.rpc("discovery_mark_error", {
          p_id: item.id,
          p_msg: e?.message ?? "unknown",
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
