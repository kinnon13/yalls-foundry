import { brpop } from '@/lib/redis';
import { QUEUE } from './util-enqueue';
import { handleCsv } from './handlers/csv_export';
import { handleNotif } from './handlers/notif';

type Job =
  | { type: 'csv_export'; table: string; where?: Record<string, string | number>; userId: string }
  | { type: 'notif'; userId: string; lane: string; payload: any }
  | { type: 'usage_rollup'; window: string };

async function handle(job: Job) {
  switch (job.type) {
    case 'csv_export': return handleCsv(job);
    case 'notif': return handleNotif(job);
    case 'usage_rollup': return;
    default: console.warn('[Worker] Unknown job type:', (job as any).type);
  }
}

(async function run() {
  console.log('[Worker] online; queue:', QUEUE);
  // eslint-disable-next-line no-constant-condition
  while (true) {
    try {
      const job = await brpop<Job>(QUEUE, 10);
      if (!job) continue;
      await handle(job);
    } catch (e) {
      console.error('[Worker] error:', e);
    }
  }
})();
