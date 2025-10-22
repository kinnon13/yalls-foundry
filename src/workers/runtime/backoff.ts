/**
 * Exponential Backoff Utilities
 */

const MAX_BACKOFF_MS = 5 * 60 * 1000; // 5 minutes
const BASE_DELAY_MS = 1000;

export function calculateBackoffDelay(attempt: number): number {
  const exponential = Math.min(BASE_DELAY_MS * Math.pow(2, attempt), MAX_BACKOFF_MS);
  const jitter = Math.random() * exponential * 0.1;
  return exponential + jitter;
}

export function getNextRetryAt(attempt: number): Date {
  const delay = calculateBackoffDelay(attempt);
  return new Date(Date.now() + delay);
}
