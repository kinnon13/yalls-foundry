import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

export interface IdempotencyResult<T> {
  cached: boolean;
  result: T;
}

/**
 * Build stable idempotency key from parts
 */
export function buildKey(parts: Record<string, string | number | boolean | undefined>): string {
  const stable = Object.entries(parts)
    .sort(([a], [b]) => a.localeCompare(b))
    .filter(([_, v]) => v !== undefined);
  return stable.map(([k, v]) => `${k}=${v ?? ''}`).join('&');
}

/**
 * Execute function with idempotency protection.
 * Uses Redis for fast cache + Supabase for persistence.
 */
export async function withIdempotency<T>(
  key: string,
  fn: () => Promise<T>,
  ttlSeconds: number = 3600
): Promise<IdempotencyResult<T>> {
  const url = Deno.env.get('UPSTASH_REDIS_REST_URL');
  const token = Deno.env.get('UPSTASH_REDIS_REST_TOKEN');
  const cacheKey = `idem:${key}`;

  // Try Redis cache first (fast path)
  if (url && token) {
    try {
      const get = await fetch(`${url}/get/${encodeURIComponent(cacheKey)}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (get.ok) {
        const data = await get.json();
        if (data.result) {
          return { cached: true, result: JSON.parse(data.result) as T };
        }
      }
    } catch (error) {
      console.warn('Redis cache miss:', error);
    }
  }

  // Check Supabase (persistent)
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  const { data: existing } = await supabase
    .from('idempotency_log')
    .select('result')
    .eq('key', key)
    .single();

  if (existing) {
    return { cached: true, result: existing.result as T };
  }

  // Execute function
  const result = await fn();

  // Store in Supabase
  await supabase
    .from('idempotency_log')
    .insert({
      key,
      result: result as any,
      expires_at: new Date(Date.now() + ttlSeconds * 1000).toISOString()
    });

  // Store in Redis cache
  if (url && token) {
    try {
      await fetch(`${url}/setex/${encodeURIComponent(cacheKey)}/${ttlSeconds}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(result)
      });
    } catch (error) {
      console.warn('Redis cache store failed:', error);
    }
  }

  return { cached: false, result };
}

/**
 * Hash object to hex string for idempotency keys
 */
export async function hashObject(obj: any): Promise<string> {
  const json = JSON.stringify(obj);
  const buffer = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(json)
  );
  return Array.from(new Uint8Array(buffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}
