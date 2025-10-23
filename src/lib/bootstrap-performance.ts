/**
 * Performance Bootstrap
 * Initializes mobile-specific performance monitoring on app start
 */

import { startPerformanceMonitoring, isMobile, type PerformanceMetric } from './performance';

export function bootstrapPerformance() {
  if (typeof window === 'undefined') return;

  const logMetric = (metric: PerformanceMetric) => {
    console.log(`[Perf] ${metric.name}: ${metric.value.toFixed(2)}ms (${metric.rating})`);
  };

  const logLongTask = (duration: number) => {
    console.warn(`[Perf] Long task: ${duration.toFixed(2)}ms`);
  };

  // Always monitor in production, or if on mobile
  if (import.meta.env.PROD || isMobile()) {
    console.log('[Performance] Starting monitoring', { 
      mode: import.meta.env.PROD ? 'production' : 'development',
      isMobile: isMobile() 
    });
    
    const cleanup = startPerformanceMonitoring(logMetric, logLongTask);
    
    // Cleanup on unload
    window.addEventListener('beforeunload', cleanup);
  }
}
