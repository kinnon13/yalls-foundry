import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { adminClient } from "../_shared/tenantGuard.ts";

const MAX_PER_ORG = Number(Deno.env.get('INGEST_MAX_CONCURRENCY_PER_ORG') ?? 1);

serve(async () => {
  const admin = adminClient();
  
  try {
    // Claim a job (one transaction per claim to avoid thundering herd)
    const { data: job, error } = await admin.rpc('claim_ingest_job');
    
    if (error) {
      console.error('Error claiming job:', error);
      return new Response(JSON.stringify({ status: 'error', error: error.message }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    if (!job) {
      return new Response(JSON.stringify({ status: 'idle' }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    console.log(`Processing job ${job.id} of kind ${job.kind} for org ${job.org_id}`);

    // Process job based on kind
    try {
      switch (job.kind) {
        case 'embed':
          await processEmbedding(admin, job);
          break;
        case 'crawl':
          await processCrawl(admin, job);
          break;
        case 'ocr':
          await processOCR(admin, job);
          break;
        default:
          throw new Error(`Unknown job kind: ${job.kind}`);
      }

      // Mark as done
      await admin
        .from('ingest_jobs')
        .update({ 
          status: 'done', 
          updated_at: new Date().toISOString() 
        })
        .eq('id', job.id);

      return new Response(JSON.stringify({ status: 'ok', job_id: job.id }), {
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (workError) {
      console.error(`Error processing job ${job.id}:`, workError);
      
      // Mark as error
      await admin
        .from('ingest_jobs')
        .update({ 
          status: 'error', 
          updated_at: new Date().toISOString(),
          payload: { 
            ...job.payload, 
            error: workError instanceof Error ? workError.message : 'Unknown error' 
          }
        })
        .eq('id', job.id);

      return new Response(JSON.stringify({ 
        status: 'error', 
        job_id: job.id, 
        error: workError instanceof Error ? workError.message : 'Unknown error' 
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  } catch (e) {
    console.error('Worker error:', e);
    return new Response(JSON.stringify({ 
      status: 'error', 
      error: e instanceof Error ? e.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});

async function processEmbedding(admin: any, job: any) {
  // TODO: Implement embedding logic
  console.log('Processing embedding job:', job.payload);
  await new Promise(resolve => setTimeout(resolve, 100)); // Simulate work
}

async function processCrawl(admin: any, job: any) {
  // TODO: Implement crawl logic
  console.log('Processing crawl job:', job.payload);
  await new Promise(resolve => setTimeout(resolve, 100)); // Simulate work
}

async function processOCR(admin: any, job: any) {
  // TODO: Implement OCR logic
  console.log('Processing OCR job:', job.payload);
  await new Promise(resolve => setTimeout(resolve, 100)); // Simulate work
}
