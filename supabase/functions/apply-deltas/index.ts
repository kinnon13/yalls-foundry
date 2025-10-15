/**
 * Apply Federated Deltas (Cron Job)
 * 
 * Processes pending federated deltas in batches, applying platform
 * morphs (categories, tools, tabs) to the live system.
 * 
 * Run via cron every 5 minutes
 */

import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { createLogger } from "../_shared/logger.ts";
import { withRateLimit, RateLimits } from "../_shared/rate-limit-wrapper.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const log = createLogger('apply-deltas');
  log.startTimer();

  // Apply rate limiting
  const limited = await withRateLimit(req, 'apply-deltas', RateLimits.admin);
  if (limited) return limited;

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    log.info('Starting delta application batch');

    // Call RPC to apply deltas
    const { data, error } = await supabase.rpc("apply_federated_deltas", {
      p_batch_size: 100,
    });

    if (error) {
      throw error;
    }

    const { applied, failed } = data as { applied: number; failed: number };

    log.info('Delta batch complete', { applied, failed });

    // Record eval metric
    if (applied > 0) {
      await supabase.from("ai_eval_metrics").insert({
        eval_type: "morph_success",
        metric_name: "deltas_applied",
        metric_value: applied,
        context: {
          failed,
          batch_size: 100,
        },
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        applied,
        failed,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    log.error('Error in apply-deltas', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
