// supabase/functions/rocker-proactive-sweep/index.ts
// Purpose: scan for eligible users and log a dry-run Rocker action (no messages yet)
import { serve } from "https://deno.land/std@0.170.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req: Request) => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // Example: pick 50 recent active users as candidates
  const { data: users, error } = await supabase
    .from("ai_action_ledger")
    .select("user_id")
    .not("user_id", "is", null)
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) return new Response(error.message, { status: 500 });

  const uniqueUserIds = [...new Set((users ?? []).map(u => u.user_id))].slice(0, 50);

  const results: Array<{ user_id: string; allowed: boolean; reasons: string[] }> = [];

  for (const uid of uniqueUserIds) {
    const { data: consentJson } = await supabase
      .rpc("rocker_check_consent", { p_user_id: uid, p_action_type: "nudge_cart" });

    const allowed = Boolean(consentJson?.allowed);
    const reasons = (consentJson?.reasons ?? []) as string[];

    // Log an action (dry-run)
    await supabase.rpc("rocker_log_action", {
      p_user_id: uid,
      p_agent: "rocker",
      p_action: "nudge_cart_dry_run",
      p_input: { reason: "phase0_sweep" },
      p_output: { allowed, reasons },
      p_result: allowed ? "success" : "failure",
      p_correlation_id: crypto.randomUUID(),
    });

    results.push({ user_id: uid as string, allowed, reasons });
  }

  return new Response(JSON.stringify({ scanned: uniqueUserIds.length, results }, null, 2), {
    headers: { "content-type": "application/json" },
  });
});
