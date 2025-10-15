/**
 * Job Processor
 * 
 * Background job processor with retry logic and outbox pattern.
 * Processes pending jobs from the jobs table.
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { withRateLimit, RateLimits } from "../_shared/rate-limit-wrapper.ts";
import { createLogger } from "../_shared/logger.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const limited = await withRateLimit(req, 'process-jobs', RateLimits.admin);
  if (limited) return limited;

  const log = createLogger('process-jobs');
  log.startTimer();

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    log.info('Starting job processing batch');
    const startTime = Date.now();

    // Fetch pending jobs (batch of 10)
    const { data: jobs, error: fetchError } = await supabase
      .from("jobs")
      .select("*")
      .eq("status", "pending")
      .lte("scheduled_at", new Date().toISOString())
      .limit(10)
      .order("scheduled_at", { ascending: true });

    if (fetchError) {
      throw fetchError;
    }

    if (!jobs || jobs.length === 0) {
      log.info('No pending jobs found');
      return new Response(
        JSON.stringify({ processed: 0, message: "No pending jobs" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    log.info('Pending jobs found', { count: jobs.length });

    const results = [];

    for (const job of jobs) {
      try {
        // Mark as processing
        await supabase
          .from("jobs")
          .update({
            status: "processing",
            started_at: new Date().toISOString(),
            attempts: job.attempts + 1,
          })
          .eq("id", job.id);

        log.info('Processing job', { jobId: job.id, jobType: job.job_type });

        // Process based on job type
        let result;
        switch (job.job_type) {
          case "generate_embeddings":
            result = await processEmbeddingsJob(job, supabase);
            break;
          case "process_order":
            result = await processOrderJob(job, supabase);
            break;
          case "send_notification":
            result = await processSendNotificationJob(job, supabase);
            break;
          case "update_metrics":
            result = await processUpdateMetricsJob(job, supabase);
            break;
          case "sync_inventory":
            result = await processSyncInventoryJob(job, supabase);
            break;
          case "cleanup_carts":
            result = await processCleanupCartsJob(job, supabase);
            break;
          case "implement_suggestion":
            result = await processImplementSuggestionJob(job, supabase);
            break;
          case "moderate_flag":
            result = await processModerateFlagJob(job, supabase);
            break;
          default:
            throw new Error(`Unknown job type: ${job.job_type}`);
        }

        // Mark as completed
        await supabase
          .from("jobs")
          .update({
            status: "completed",
            completed_at: new Date().toISOString(),
            result,
          })
          .eq("id", job.id);

        results.push({ job_id: job.id, success: true });
        log.info('Job completed', { jobId: job.id });
      } catch (error) {
        log.error('Job processing error', error, { jobId: job.id });
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';

        // Check if should retry
        const shouldRetry = job.attempts + 1 < job.max_attempts;

        await supabase
          .from("jobs")
          .update({
            status: shouldRetry ? "pending" : "failed",
            error: errorMessage,
            completed_at: shouldRetry ? null : new Date().toISOString(),
          })
          .eq("id", job.id);

        results.push({ job_id: job.id, success: false, error: errorMessage });
      }
    }

    const duration = Date.now() - startTime;
    const successCount = results.filter(r => r.success).length;

    log.info('Job batch complete', { 
      processed: jobs.length,
      succeeded: successCount,
      durationMs: duration
    });

    return new Response(
      JSON.stringify({
        processed: jobs.length,
        succeeded: successCount,
        failed: jobs.length - successCount,
        duration_ms: duration,
        results,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    log.error('Job processing error', error);
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

// Job processors
async function processEmbeddingsJob(job: any, supabase: any) {
  const { chunks } = job.payload;
  
  // Call embeddings function
  const { data, error } = await supabase.functions.invoke("generate-embeddings", {
    body: { chunks },
  });

  if (error) throw error;
  return data;
}

async function processOrderJob(job: any, supabase: any) {
  // Process order completion, MLM commissions, etc.
  return { processed: true };
}

async function processSendNotificationJob(job: any, supabase: any) {
  // Send email/SMS notifications
  return { sent: true };
}

async function processUpdateMetricsJob(job: any, supabase: any) {
  // Update aggregated metrics
  return { updated: true };
}

async function processSyncInventoryJob(job: any, supabase: any) {
  // Sync inventory across listings
  return { synced: true };
}

async function processCleanupCartsJob(job: any, supabase: any) {
  // Cleanup expired carts
  const { data, error } = await supabase
    .from("shopping_carts")
    .delete()
    .lt("expires_at", new Date().toISOString());

  if (error) throw error;
  return { deleted: data?.length || 0 };
}

async function processImplementSuggestionJob(job: any, supabase: any) {
  // Implement approved platform suggestion
  const { suggestion_id } = job.payload;
  
  // Get suggestion details
  const { data: suggestion, error: fetchError } = await supabase
    .from("platform_suggestions")
    .select("*")
    .eq("id", suggestion_id)
    .single();

  if (fetchError) throw fetchError;

  // Auto-implement based on suggestion type
  if (suggestion.suggestion_type === "marketplace_category") {
    // Create slug from title
    const slug = suggestion.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    
    // Get parent category ID if specified
    let parentId = null;
    if (suggestion.config?.parent_category) {
      const { data: parent } = await supabase
        .from("dynamic_categories")
        .select("id")
        .eq("slug", suggestion.config.parent_category)
        .single();
      parentId = parent?.id || null;
    }

    // Insert new category
    const { error: insertError } = await supabase
      .from("dynamic_categories")
      .insert({
        slug,
        name: suggestion.title,
        description: suggestion.description,
        parent_category_id: parentId,
        attributes: suggestion.config?.filters ? { filters: suggestion.config.filters } : {},
        is_ai_suggested: true,
        suggestion_id: suggestion.id,
      });

    if (insertError) throw insertError;
  }

  // Mark suggestion as implemented
  await supabase
    .from("platform_suggestions")
    .update({
      status: "implemented",
      implemented_at: new Date().toISOString(),
    })
    .eq("id", suggestion_id);

  return { implemented: true, suggestion_id };
}

async function processModerateFlagJob(job: any, supabase: any) {
  // AI-powered content moderation
  const { flag_id } = job.payload;
  
  // Get flag details
  const { data: flag, error: fetchError } = await supabase
    .from("content_flags")
    .select("*")
    .eq("id", flag_id)
    .single();

  if (fetchError) throw fetchError;

  // For now, just mark as reviewing (AI moderation would analyze here)
  await supabase
    .from("content_flags")
    .update({ status: "reviewing" })
    .eq("id", flag_id);

  // TODO: Call AI moderation API to analyze content
  // TODO: Auto-hide content if AI detects violation
  // TODO: Notify admins if needs human review

  return { moderated: true, flag_id };
}
