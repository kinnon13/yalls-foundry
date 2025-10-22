/**
 * Worker Pools Types
 * Pool configuration is stored in ai_worker_pools table
 */

export interface Pool {
  pool: string;
  min_concurrency: number;
  max_concurrency: number;
  burst_concurrency: number;
  topic_glob: string;
  current_concurrency: number;
}

export const POOL_NAMES = [
  'realtime',
  'heavy',
  'analytics',
  'slow',
  'safety',
  'self',
  'ops',
] as const;

export type PoolName = typeof POOL_NAMES[number];
