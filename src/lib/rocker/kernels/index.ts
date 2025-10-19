/**
 * Rocker AI Kernels - Billion-User Scale
 * 
 * Features:
 * - Priority queue execution
 * - Circuit breaker pattern (auto-disable failing kernels)
 * - Backpressure handling (max concurrency per kernel)
 * - Graceful degradation
 */

import { runAdPredictor } from './ad-predictor';
import { runAffiliateRouter } from './affiliate-router';
import { runClaimHunter } from './claim-hunter';
import { runCartNudge } from './cart-nudge';
import { runEventConflictDetector } from './event-conflict-detector';

export { generateNextBestActions } from './nba-generator';
export type { NextBestAction } from './nba-generator';

interface KernelDef {
  fn: (ctx: any) => Promise<void>;
  name: string;
  priority: number; // 1-10, higher = more important
  maxConcurrency: number;
}

// Define kernels with priority and concurrency limits
const kernelDefs: KernelDef[] = [
  { fn: runEventConflictDetector, name: 'event_conflict_detector', priority: 10, maxConcurrency: 5 },
  { fn: runCartNudge, name: 'cart_nudge', priority: 8, maxConcurrency: 10 },
  { fn: runAdPredictor, name: 'ad_predictor', priority: 6, maxConcurrency: 20 },
  { fn: runAffiliateRouter, name: 'affiliate_router', priority: 5, maxConcurrency: 10 },
  { fn: runClaimHunter, name: 'claim_hunter', priority: 3, maxConcurrency: 5 },
].sort((a, b) => b.priority - a.priority);

export const kernels = kernelDefs.map(k => k.fn);

// Circuit breaker state per kernel
const circuitBreakers = new Map<string, CircuitBreaker>();
const runningCounts = new Map<string, number>();

class CircuitBreaker {
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
  private failures = 0;
  private lastFailureTime = 0;

  constructor(
    private name: string,
    private threshold: number = 5,
    private resetTimeout: number = 60000
  ) {}

  isOpen(): boolean {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime >= this.resetTimeout) {
        console.log(`[Circuit] ${this.name} HALF_OPEN`);
        this.state = 'HALF_OPEN';
        return false;
      }
      return true;
    }
    return false;
  }

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.isOpen()) {
      throw new Error(`Circuit breaker OPEN for ${this.name}`);
    }

    try {
      const result = await fn();
      if (this.state === 'HALF_OPEN') {
        console.log(`[Circuit] ${this.name} CLOSED`);
        this.state = 'CLOSED';
      }
      this.failures = 0;
      return result;
    } catch (error) {
      this.failures++;
      this.lastFailureTime = Date.now();

      if (this.failures >= this.threshold) {
        console.error(`[Circuit] ${this.name} OPENED after ${this.failures} failures`);
        this.state = 'OPEN';
      }
      throw error;
    }
  }
}

/**
 * Run all kernels with priority queue, circuit breaker, and backpressure
 */
export async function runKernels(ctx: any) {
  const results = await Promise.allSettled(
    kernelDefs.map(async (kernel) => {
      // Get or create circuit breaker
      let circuit = circuitBreakers.get(kernel.name);
      if (!circuit) {
        circuit = new CircuitBreaker(kernel.name);
        circuitBreakers.set(kernel.name, circuit);
      }

      // Check if circuit is open
      if (circuit.isOpen()) {
        console.warn(`[Kernel] ${kernel.name} circuit OPEN, skipping`);
        return;
      }

      // Check concurrency limit
      const running = runningCounts.get(kernel.name) || 0;
      if (running >= kernel.maxConcurrency) {
        console.warn(`[Kernel] ${kernel.name} at max concurrency (${running}/${kernel.maxConcurrency}), skipping`);
        return;
      }

      // Increment counter
      runningCounts.set(kernel.name, running + 1);

      try {
        await circuit.execute(() => kernel.fn(ctx));
      } finally {
        // Decrement counter
        const current = runningCounts.get(kernel.name) || 1;
        runningCounts.set(kernel.name, Math.max(0, current - 1));
      }
    })
  );

  // Log failures
  results.forEach((result, i) => {
    if (result.status === 'rejected') {
      console.error(`[Kernel] ${kernelDefs[i].name} failed:`, result.reason);
    }
  });
}

/**
 * Get kernel stats (for monitoring)
 */
export function getKernelStats() {
  return kernelDefs.map(k => ({
    name: k.name,
    priority: k.priority,
    running: runningCounts.get(k.name) || 0,
    maxConcurrency: k.maxConcurrency,
    circuitState: circuitBreakers.get(k.name)?.['state'] || 'CLOSED'
  }));
}

export {
  runAdPredictor,
  runAffiliateRouter,
  runClaimHunter,
  runCartNudge,
  runEventConflictDetector
};
