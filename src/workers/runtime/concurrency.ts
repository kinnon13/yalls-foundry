/**
 * Concurrency Control Types
 */

export interface ConcurrencyLimits {
  pool: string;
  max: number;
  current: number;
}

export interface SemaphoreState {
  acquired: number;
  waiting: number;
}
