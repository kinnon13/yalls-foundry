/**
 * RED Metrics
 * 
 * Rate, Error, Duration tracking for observability.
 * Logs to console; extend to send to analytics service.
 * 
 * Usage:
 *   import { trackRequest, trackError } from '@/lib/analytics/metrics';
 *   const timer = trackRequest('api:users:list');
 *   timer.end();
 */

interface MetricEvent {
  type: 'request' | 'error' | 'duration';
  name: string;
  timestamp: number;
  value?: number;
  tags?: Record<string, string>;
}

class MetricsCollector {
  private events: MetricEvent[] = [];
  private readonly maxEvents = 1000;

  track(event: MetricEvent): void {
    this.events.push(event);
    
    // Keep only recent events
    if (this.events.length > this.maxEvents) {
      this.events = this.events.slice(-this.maxEvents);
    }

    // Log in development
    if (import.meta.env.DEV) {
      console.debug('[METRIC]', event);
    }

    // TODO: Send to analytics service (PostHog, Mixpanel, etc.)
  }

  getEvents(type?: MetricEvent['type']): MetricEvent[] {
    return type
      ? this.events.filter(e => e.type === type)
      : this.events;
  }

  clear(): void {
    this.events = [];
  }
}

const collector = new MetricsCollector();

/**
 * Track request
 */
export function trackRequest(name: string, tags?: Record<string, string>) {
  const startTime = performance.now();

  return {
    end: () => {
      const duration = performance.now() - startTime;
      collector.track({
        type: 'duration',
        name,
        timestamp: Date.now(),
        value: duration,
        tags,
      });
    },
  };
}

/**
 * Track error
 */
export function trackError(name: string, error: Error, tags?: Record<string, string>): void {
  collector.track({
    type: 'error',
    name,
    timestamp: Date.now(),
    tags: { ...tags, message: error.message },
  });
}

/**
 * Time-to-meaningful-content tracker
 */
export function trackTimeToContent(contentType: string): void {
  const timing = performance.timing;
  const ttmc = Date.now() - timing.navigationStart;

  collector.track({
    type: 'duration',
    name: 'ttmc',
    timestamp: Date.now(),
    value: ttmc,
    tags: { contentType },
  });
}

/**
 * Get metrics summary
 */
export function getMetricsSummary() {
  const durations = collector.getEvents('duration');
  const errors = collector.getEvents('error');

  return {
    totalRequests: durations.length,
    totalErrors: errors.length,
    averageDuration: durations.length
      ? durations.reduce((sum, e) => sum + (e.value || 0), 0) / durations.length
      : 0,
    errorRate: durations.length ? errors.length / durations.length : 0,
  };
}
