/**
 * Idempotency Utilities
 * 
 * Prevent duplicate operations via idempotency keys.
 * L0: In-memory tracking (current implementation)
 * TODO L1: Persist to Supabase table with unique constraint
 * 
 * Usage:
 *   import { generateIdempotencyKey, trackIdempotency } from '@/lib/availability/idempotency';
 *   const key = generateIdempotencyKey({ userId, action: 'create_business' });
 *   const result = await trackIdempotency(key, () => createBusiness());
 */

import { createHash } from 'crypto';

/**
 * Generate idempotency key from request data
 */
export function generateIdempotencyKey(data: Record<string, any>): string {
  const normalized = JSON.stringify(data, Object.keys(data).sort());
  return createHash('sha256').update(normalized).digest('hex');
}

/**
 * In-memory idempotency tracking (L0)
 * TODO: Replace with Supabase table for distributed tracking
 */
class IdempotencyTracker {
  private pending = new Map<string, Promise<any>>();
  private completed = new Map<string, { result: any; timestamp: number }>();
  private readonly ttl = 86400000; // 24 hours

  async track<T>(key: string, fn: () => Promise<T>): Promise<T> {
    // Check if already completed
    const cached = this.completed.get(key);
    if (cached && Date.now() - cached.timestamp < this.ttl) {
      return cached.result as T;
    }

    // Check if currently pending
    const pending = this.pending.get(key);
    if (pending) {
      return pending as Promise<T>;
    }

    // Execute and track
    const promise = fn();
    this.pending.set(key, promise);

    try {
      const result = await promise;
      this.completed.set(key, { result, timestamp: Date.now() });
      return result;
    } finally {
      this.pending.delete(key);
    }
  }

  cleanup(): void {
    const now = Date.now();
    for (const [key, { timestamp }] of this.completed.entries()) {
      if (now - timestamp > this.ttl) {
        this.completed.delete(key);
      }
    }
  }
}

const tracker = new IdempotencyTracker();

// Cleanup every hour
if (typeof window !== 'undefined') {
  setInterval(() => tracker.cleanup(), 3600000);
}

/**
 * Execute function with idempotency protection
 */
export async function trackIdempotency<T>(
  key: string,
  fn: () => Promise<T>
): Promise<T> {
  return tracker.track(key, fn);
}

/**
 * TODO: Supabase table for distributed idempotency
 * 
 * CREATE TABLE public.idempotency_keys (
 *   key TEXT PRIMARY KEY,
 *   result JSONB NOT NULL,
 *   created_at TIMESTAMPTZ NOT NULL DEFAULT now()
 * );
 * 
 * CREATE INDEX idx_idempotency_created_at ON public.idempotency_keys(created_at);
 * 
 * Then replace in-memory tracker with database lookups:
 * 1. Check if key exists in table
 * 2. If yes, return cached result
 * 3. If no, execute fn and insert result
 * 4. Use UNIQUE constraint to handle races
 */