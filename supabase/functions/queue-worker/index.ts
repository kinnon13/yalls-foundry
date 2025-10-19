import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type QueueRow = {
  id: string;
  lease_token: string;
  topic: string;
  payload: any;
};

// Topic handlers
const handlers: Record<string, (row: QueueRow, supabase: any) => Promise<void>> = {
  "discovery.user-signup": handleDiscoverySignup,
  "discovery.new-interest": handleDiscoveryNewInterest,
  "telemetry.signal": handleTelemetrySignal,
  "learning.reward": handleLearningReward,
};

async function handleDiscoverySignup(row: QueueRow, supabase: any) {
  const { user_id } = row.payload;
  console.log(`Processing discovery for user signup: ${user_id}`);

  // Fetch user interests
  const { data: interests } = await supabase
    .from("user_interests")
    .select("interest_id")
    .eq("user_id", user_id);

  if (!interests?.length) return;

  // Enqueue discovery for each interest
  for (const { interest_id } of interests) {
    await supabase.rpc("ensure_category_for_interest", { p_interest_id: interest_id });
  }
}

async function handleDiscoveryNewInterest(row: QueueRow, supabase: any) {
  const { interest_id } = row.payload;
  console.log(`Processing discovery for new interest: ${interest_id}`);
  
  await supabase.rpc("ensure_category_for_interest", { p_interest_id: interest_id });
}

async function handleTelemetrySignal(row: QueueRow, supabase: any) {
  const { signal_data } = row.payload;
  console.log(`Processing telemetry signal: ${signal_data?.name}`);
  
  // Insert into intent_signals
  await supabase.from("intent_signals").insert({
    user_id: signal_data.user_id,
    name: signal_data.name,
    metadata: signal_data.metadata || {},
  });
}

async function handleLearningReward(row: QueueRow, supabase: any) {
  const { user_id, candidate_id, reward } = row.payload;
  console.log(`Recording reward: ${reward} for candidate ${candidate_id}`);
  
  // Update most recent learning event for this candidate
  await supabase
    .from("learning_events")
    .update({ reward })
    .eq("user_id", user_id)
    .eq("candidate_id", candidate_id)
    .is("reward", null)
    .order("ts", { ascending: false })
    .limit(1);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { topic = "discovery.user-signup", limit = 20 } = await req.json().catch(() => ({}));

    // Lease events from queue
    const { data: leased, error: leaseError } = await supabase.rpc("lease_events", {
      p_topic: topic,
      p_limit: limit,
      p_ttl_seconds: 120, // 2 minute lease
    });

    if (leaseError) {
      console.error("Lease error:", leaseError);
      return new Response(
        JSON.stringify({ error: leaseError.message }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        }
      );
    }

    if (!leased || leased.length === 0) {
      return new Response(
        JSON.stringify({ processed: 0, message: "No events to process" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const results: any[] = [];

    // Process each leased event
    for (const row of leased as QueueRow[]) {
      try {
        const handler = handlers[row.topic];
        if (!handler) {
          throw new Error(`No handler for topic: ${row.topic}`);
        }

        await handler(row, supabase);

        // Acknowledge successful processing
        await supabase.rpc("ack_event", {
          p_id: row.id,
          p_token: row.lease_token,
        });

        results.push({ id: row.id, status: "success" });
      } catch (e: any) {
        console.error(`Error processing event ${row.id}:`, e);

        // Mark as failed
        await supabase.rpc("fail_event", {
          p_id: row.id,
          p_token: row.lease_token,
          p_error: e?.message ?? "unknown error",
        });

        results.push({ id: row.id, status: "failed", error: e?.message });
      }
    }

    return new Response(
      JSON.stringify({ processed: results.length, results }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (e: any) {
    console.error("Worker error:", e);
    return new Response(
      JSON.stringify({ error: e?.message ?? "unknown error" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
