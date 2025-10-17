import { rpush } from '@/lib/redis';

export const QUEUE = process.env.JOBS_QUEUE || 'jobs:main';

export async function enqueue(job: unknown): Promise<void> {
  await rpush(QUEUE, job);
}
