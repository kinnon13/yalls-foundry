/**
 * Worker Metrics Types
 */

export interface MetricPoint {
  name: string;
  value: number;
  labels: Record<string, string>;
  timestamp: Date;
}

export interface WorkerMetrics {
  jobs_processed: number;
  jobs_failed: number;
  avg_duration_ms: number;
  queue_depth: number;
}
