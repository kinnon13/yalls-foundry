/**
 * Worker Job Processor
 * Claims jobs, processes with exponential backoff, moves failures to DLQ
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

interface Job {
  job_id: string;
  job_type: string;
  payload: Record<string, any>;
  attempts: number;
}

async function processJob(job: Job): Promise<void> {
  console.log(`[Worker] Processing job ${job.job_id} (type: ${job.job_type}, attempt: ${job.attempts})`);

  // Job type handlers
  switch (job.job_type) {
    case 'send_email':
      // Simulate email sending
      console.log(`[Worker] Sending email:`, job.payload);
      break;

    case 'process_webhook':
      // Simulate webhook processing
      console.log(`[Worker] Processing webhook:`, job.payload);
      break;

    case 'aggregate_metrics':
      // Simulate metrics aggregation
      console.log(`[Worker] Aggregating metrics:`, job.payload);
      break;

    default:
      throw new Error(`Unknown job type: ${job.job_type}`);
  }

  // Mark complete
  await supabase.rpc('worker_complete_job', {
    p_job_id: job.job_id,
  });

  console.log(`[Worker] Job ${job.job_id} completed`);
}

async function runWorker() {
  console.log('[Worker] Starting job claim cycle...');

  // Claim a job
  const { data: jobs, error: claimError } = await supabase.rpc('worker_claim_job');

  if (claimError) {
    console.error('[Worker] Claim error:', claimError);
    return;
  }

  if (!jobs || jobs.length === 0) {
    console.log('[Worker] No pending jobs');
    return;
  }

  const job = jobs[0] as Job;

  try {
    await processJob(job);
  } catch (error) {
    console.error(`[Worker] Job ${job.job_id} failed:`, error);

    // Mark failed (will retry with backoff or move to DLQ)
    await supabase.rpc('worker_fail_job', {
      p_job_id: job.job_id,
      p_error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    });
  }

  try {
    await runWorker();

    return new Response(JSON.stringify({ success: true }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error('[Worker] Fatal error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
});
