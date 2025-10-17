/**
 * Worker Entry Point
 * Run with: node dist/workers/index.js
 */

import { runWorker } from './queue';

console.log('[Worker] Starting...');
runWorker().catch((e) => {
  console.error('[Worker] Fatal error:', e);
  process.exit(1);
});
