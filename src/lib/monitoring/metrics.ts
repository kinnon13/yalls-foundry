/**
 * Client-side metrics collection for observability
 */

type MetricType = 'cache_hit' | 'cache_miss' | 'rpc_call' | 'error';

interface Metric {
  type: MetricType;
  key: string;
  timestamp: number;
  duration?: number;
  metadata?: Record<string, any>;
}

// In-memory metrics buffer (flush periodically)
const metricsBuffer: Metric[] = [];
const MAX_BUFFER_SIZE = 100;

/**
 * Track a metric event
 */
export function trackMetric(
  type: MetricType,
  key: string,
  metadata?: Record<string, any>,
  duration?: number
) {
  metricsBuffer.push({
    type,
    key,
    timestamp: Date.now(),
    duration,
    metadata,
  });

  // Auto-flush when buffer is full
  if (metricsBuffer.length >= MAX_BUFFER_SIZE) {
    flushMetrics();
  }
}

/**
 * Flush metrics to analytics endpoint
 */
export async function flushMetrics() {
  if (metricsBuffer.length === 0) return;
  
  const batch = metricsBuffer.splice(0, metricsBuffer.length);
  
  try {
    // Send to analytics endpoint (fire-and-forget)
    await fetch('/api/metrics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ metrics: batch }),
    }).catch(() => {}); // Ignore errors
  } catch {
    // Silent fail - don't break app
  }
}

/**
 * Get cache statistics
 */
export function getCacheStats(): {
  hit_rate: number;
  total_requests: number;
  avg_duration: number;
} {
  const cacheMetrics = metricsBuffer.filter(m => 
    m.type === 'cache_hit' || m.type === 'cache_miss'
  );
  
  const hits = cacheMetrics.filter(m => m.type === 'cache_hit').length;
  const total = cacheMetrics.length;
  const hit_rate = total > 0 ? hits / total : 0;
  
  const durations = metricsBuffer
    .filter(m => m.duration !== undefined)
    .map(m => m.duration!);
  const avg_duration = durations.length > 0
    ? durations.reduce((a, b) => a + b, 0) / durations.length
    : 0;
  
  return {
    hit_rate,
    total_requests: total,
    avg_duration,
  };
}

// Flush metrics every 30 seconds
if (typeof window !== 'undefined') {
  setInterval(flushMetrics, 30000);
  
  // Flush on page unload
  window.addEventListener('beforeunload', () => {
    flushMetrics();
  });
}
