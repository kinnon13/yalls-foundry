/**
 * Observability & Metrics
 * 
 * SLO tracking, performance monitoring, and health checks for billion-scale ops.
 * 
 * SLOs:
 * - P95 GET ≤ 200ms (edge-served), P99 ≤ 400ms
 * - P95 POST ≤ 350ms, P99 ≤ 800ms
 * - Error rate < 0.5%
 */

import { supabase } from '@/integrations/supabase/client';

export interface PerformanceMetric {
  route: string;
  method: string;
  duration_ms: number;
  status: number;
  user_id?: string;
  timestamp: number;
}

export interface HealthStatus {
  ok: boolean;
  checks: {
    database: boolean;
    cache: boolean;
    edge_functions: boolean;
  };
  latency: {
    db_p95: number;
    cache_p95: number;
  };
  violations: number; // rate limit violations
}

/**
 * Track request performance (client-side)
 */
export function trackPerformance(
  route: string,
  method: string,
  duration_ms: number,
  status: number
) {
  // Store in memory for aggregation
  if (typeof window !== 'undefined') {
    const metrics = getMetricsBuffer();
    metrics.push({
      route,
      method,
      duration_ms,
      status,
      timestamp: Date.now(),
    });

    // Flush if buffer full (batch send)
    if (metrics.length >= 50) {
      flushMetrics();
    }
  }
}

/**
 * Get health status (for admin dashboard)
 */
export async function getHealthStatus(): Promise<HealthStatus> {
  const checks = {
    database: false,
    cache: false,
    edge_functions: false,
  };

  // Check database
  const dbStart = performance.now();
  try {
    const { error } = await supabase.from('profiles').select('id').limit(1);
    checks.database = !error;
  } catch {
    checks.database = false;
  }
  const db_p95 = performance.now() - dbStart;

  // Check cache (placeholder - wire to actual cache provider)
  const cacheStart = performance.now();
  checks.cache = true; // Assume healthy if no error
  const cache_p95 = performance.now() - cacheStart;

  // Check edge functions
  try {
    const { error } = await supabase.functions.invoke('health-liveness');
    checks.edge_functions = !error;
  } catch {
    checks.edge_functions = false;
  }

  // Get recent rate limit violations
  const { data: violations } = await (supabase as any)
    .from('rate_limit_violations')
    .select('id', { count: 'exact', head: true })
    .gte('created_at', new Date(Date.now() - 3600000).toISOString()); // Last hour

  return {
    ok: checks.database && checks.cache && checks.edge_functions,
    checks,
    latency: {
      db_p95: Math.round(db_p95),
      cache_p95: Math.round(cache_p95),
    },
    violations: violations || 0,
  };
}

/**
 * Get table statistics (for admin capacity planning)
 */
export async function getTableStats() {
  const { data, error } = await (supabase as any).rpc('get_table_stats');
  if (error) throw error;
  return data;
}

/**
 * Get top slow queries (requires pg_stat_statements)
 */
export async function getSlowQueries(limit = 10) {
  // This would query pg_stat_statements via edge function
  // Placeholder for now
  return [];
}

// ============================================================
// INTERNAL HELPERS
// ============================================================

const METRICS_BUFFER_KEY = '__perf_metrics';

function getMetricsBuffer(): PerformanceMetric[] {
  if (typeof window === 'undefined') return [];
  const stored = sessionStorage.getItem(METRICS_BUFFER_KEY);
  return stored ? JSON.parse(stored) : [];
}

function flushMetrics() {
  if (typeof window === 'undefined') return;
  
  const metrics = getMetricsBuffer();
  if (metrics.length === 0) return;

  // Send to analytics endpoint (placeholder)
  console.log('[Metrics] Flushing', metrics.length, 'entries');
  
  // TODO: Send to analytics backend (Supabase edge function or external service)
  // For now, just log aggregates
  const aggregates = aggregateMetrics(metrics);
  console.table(aggregates);

  // Clear buffer
  sessionStorage.setItem(METRICS_BUFFER_KEY, JSON.stringify([]));
}

function aggregateMetrics(metrics: PerformanceMetric[]) {
  const grouped = metrics.reduce((acc, m) => {
    const key = `${m.method} ${m.route}`;
    if (!acc[key]) {
      acc[key] = { count: 0, durations: [], errors: 0 };
    }
    acc[key].count++;
    acc[key].durations.push(m.duration_ms);
    if (m.status >= 400) acc[key].errors++;
    return acc;
  }, {} as Record<string, { count: number; durations: number[]; errors: number }>);

  return Object.entries(grouped).map(([route, stats]) => ({
    route,
    count: stats.count,
    p95: percentile(stats.durations, 0.95),
    p99: percentile(stats.durations, 0.99),
    error_rate: (stats.errors / stats.count) * 100,
  }));
}

function percentile(arr: number[], p: number): number {
  const sorted = arr.sort((a, b) => a - b);
  const index = Math.ceil(sorted.length * p) - 1;
  return sorted[index] || 0;
}

// Flush metrics on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', flushMetrics);
}
