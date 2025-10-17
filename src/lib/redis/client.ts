/**
 * Redis Client - Caching & Queue Infrastructure
 * Gracefully degrades if REDIS_URL not configured
 */

import { createClient } from "redis";

const url = import.meta.env.VITE_REDIS_URL;
if (!url) console.warn('[Redis] VITE_REDIS_URL missing; caching/queues disabled');

export const redis = url ? createClient({ url }) : null;

if (redis) {
  redis.on('error', (e) => console.error('[Redis] error', e));
  redis.connect().catch((e) => console.error('[Redis] connect failed', e));
}

// Typed cache get
export async function rget<T = unknown>(key: string): Promise<T | null> {
  if (!redis) return null;
  const v = await redis.get(key);
  return v ? JSON.parse(v) as T : null;
}

// Cache set with TTL
export async function rset(key: string, value: unknown, ttlSec: number) {
  if (!redis) return;
  await redis.set(key, JSON.stringify(value), { EX: ttlSec });
}

// Cache delete
export async function rdel(key: string) {
  if (redis) await redis.del(key);
}

// Queue push (left)
export async function rpush(queue: string, payload: unknown) {
  if (!redis) return;
  await redis.lPush(queue, JSON.stringify(payload));
}

// Queue pop (blocking right pop)
export async function brpop(queue: string, timeoutSec = 10): Promise<any | null> {
  if (!redis) return null;
  const res = await redis.brPop(queue, timeoutSec);
  if (!res) return null;
  return JSON.parse(res.element);
}
