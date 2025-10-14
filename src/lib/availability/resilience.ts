/**
 * Resilience Utilities
 * 
 * Timeout and retry wrappers for external API calls.
 * Prevents cascading failures from slow/failing dependencies.
 * 
 * Usage:
 *   import { withRetry, withTimeout } from '@/lib/availability/resilience';
 *   const result = await withRetry(() => fetch(url), { maxAttempts: 3 });
 */

export interface RetryConfig {
  maxAttempts?: number;
  initialDelay?: number; // ms
  maxDelay?: number;     // ms
  backoffMultiplier?: number;
  shouldRetry?: (error: any) => boolean;
}

export interface TimeoutConfig {
  timeout: number; // ms
  signal?: AbortSignal;
}

/**
 * Execute function with exponential backoff retry
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  config: RetryConfig = {}
): Promise<T> {
  const {
    maxAttempts = 3,
    initialDelay = 100,
    maxDelay = 5000,
    backoffMultiplier = 2,
    shouldRetry = () => true,
  } = config;

  let lastError: any;
  let delay = initialDelay;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (attempt === maxAttempts || !shouldRetry(error)) {
        throw error;
      }

      // Wait with exponential backoff
      await new Promise(resolve => setTimeout(resolve, delay));
      delay = Math.min(delay * backoffMultiplier, maxDelay);
    }
  }

  throw lastError;
}

/**
 * Execute function with timeout
 */
export async function withTimeout<T>(
  fn: () => Promise<T>,
  config: TimeoutConfig
): Promise<T> {
  const { timeout, signal } = config;

  return Promise.race([
    fn(),
    new Promise<T>((_, reject) => {
      const id = setTimeout(() => {
        reject(new Error(`Operation timed out after ${timeout}ms`));
      }, timeout);

      signal?.addEventListener('abort', () => {
        clearTimeout(id);
        reject(new Error('Operation aborted'));
      });
    }),
  ]);
}

/**
 * Combine timeout and retry
 */
export async function withResiliency<T>(
  fn: () => Promise<T>,
  options: { timeout?: number; retry?: RetryConfig } = {}
): Promise<T> {
  const { timeout = 10000, retry = {} } = options;

  return withRetry(
    () => withTimeout(fn, { timeout }),
    {
      ...retry,
      shouldRetry: (error) => {
        // Don't retry timeouts or aborts
        if (error.message?.includes('timeout') || error.message?.includes('abort')) {
          return false;
        }
        return retry.shouldRetry?.(error) ?? true;
      },
    }
  );
}