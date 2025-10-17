import { createClient, RedisClientType } from 'redis';

type Json = null | boolean | number | string | Json[] | { [k: string]: Json };

let redis: RedisClientType | null = null;

const url = import.meta?.env?.VITE_REDIS_URL || (typeof process !== 'undefined' ? process.env.REDIS_URL : undefined);

if (url) {
  redis = createClient({ url, socket: { tls: url.startsWith('rediss://') } });
  redis.on('error', (e) => console.error('[Redis] error', e));
  redis.connect().catch((e) => console.error('[Redis] connect failed', e));
} else {
  console.warn('[Redis] URL not set; running without cache/queue');
}

// Safe JSON parse
function jparse<T>(s: string | null): T | null {
  if (!s) return null;
  try { return JSON.parse(s) as T; } catch { return null; }
}

// GET (typed)
export async function rget<T = Json>(key: string): Promise<T | null> {
  if (!redis) return null;
  const v = await redis.get(key) as string | null;
  return jparse<T>(v);
}

// SET with TTL (seconds)
export async function rset(key: string, value: unknown, ttlSec: number): Promise<void> {
  if (!redis) return;
  await redis.set(key, JSON.stringify(value), { EX: ttlSec });
}

export async function rdel(key: string): Promise<void> { if (redis) await redis.del(key); }

// Queue push (LPUSH)
export async function rpush(queue: string, payload: unknown): Promise<void> {
  if (!redis) return;
  await redis.lPush(queue, JSON.stringify(payload));
}

// Blocking BRPOP
export async function brpop<T = Json>(queue: string, timeoutSec = 10): Promise<T | null> {
  if (!redis) return null;
  const res = await redis.brPop(queue, timeoutSec);
  return res?.element ? jparse<T>(res.element) : null;
}
