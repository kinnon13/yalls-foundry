/**
 * Background Job Queue
 * Processes CSV exports, notifications, and other async tasks
 */

import { brpop, rpush } from '../src/lib/redis/client';

export type Job =
  | { type: 'csv_export'; table: string; where?: Record<string, any>; userId: string }
  | { type: 'notif'; userId: string; lane: string; payload: any }
  | { type: 'usage_rollup'; window: string };

const QUEUE = 'jobs:main';

export async function enqueue(job: Job) {
  await rpush(QUEUE, job);
}

export async function runWorker() {
  console.log('[Worker] Starting job processor...');
  
  // Forever loop (let PM2/systemd restart on crash)
  for (;;) {
    try {
      const job = await brpop(QUEUE, 10);
      if (!job) continue;
      
      console.log('[Worker] Processing job:', job.type);
      await handle(job as Job);
    } catch (e) {
      console.error('[Worker] Error processing job:', e);
      // Continue processing despite errors
    }
  }
}

async function handle(job: Job) {
  switch (job.type) {
    case 'csv_export':
      const { handleCsv } = await import('./handlers/csv_export');
      return handleCsv(job);
    case 'notif':
      const { handleNotif } = await import('./handlers/notif');
      return handleNotif(job);
    case 'usage_rollup':
      console.log('[Worker] Usage rollup window:', job.window);
      return; // TODO: Implement usage aggregation
    default:
      console.warn('[Worker] Unknown job type:', (job as any).type);
  }
}
