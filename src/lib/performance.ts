/**
 * Performance Monitoring Utilities
 * Tracks long tasks, web vitals, and resource timing
 */

export interface PerformanceMetric {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  timestamp: number;
}

// Long Task Detection (>50ms main thread blocks)
export function detectLongTasks(callback: (duration: number) => void): () => void {
  if (!('PerformanceObserver' in window)) {
    console.warn('[Performance] PerformanceObserver not supported');
    return () => {};
  }

  try {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.duration > 50) {
          callback(entry.duration);
          console.warn(`[Performance] Long task detected: ${entry.duration.toFixed(2)}ms`, entry);
        }
      }
    });

    observer.observe({ entryTypes: ['longtask'] });

    return () => observer.disconnect();
  } catch (error) {
    console.error('[Performance] Failed to observe long tasks:', error);
    return () => {};
  }
}

// Core Web Vitals (LCP, FID, CLS)
export function measureWebVitals(callback: (metric: PerformanceMetric) => void): void {
  if (!('PerformanceObserver' in window)) return;

  // Largest Contentful Paint (LCP)
  try {
    const lcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1] as any;
      
      callback({
        name: 'LCP',
        value: lastEntry.renderTime || lastEntry.loadTime,
        rating: lastEntry.renderTime < 2500 ? 'good' : lastEntry.renderTime < 4000 ? 'needs-improvement' : 'poor',
        timestamp: Date.now(),
      });
    });
    lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
  } catch (error) {
    console.error('[Performance] LCP observation failed:', error);
  }

  // First Input Delay (FID) - interaction latency
  try {
    const fidObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const fid = (entry as any).processingStart - entry.startTime;
        callback({
          name: 'FID',
          value: fid,
          rating: fid < 100 ? 'good' : fid < 300 ? 'needs-improvement' : 'poor',
          timestamp: Date.now(),
        });
      }
    });
    fidObserver.observe({ entryTypes: ['first-input'] });
  } catch (error) {
    console.error('[Performance] FID observation failed:', error);
  }

  // Cumulative Layout Shift (CLS)
  let clsValue = 0;
  try {
    const clsObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!(entry as any).hadRecentInput) {
          clsValue += (entry as any).value;
        }
      }
      
      callback({
        name: 'CLS',
        value: clsValue,
        rating: clsValue < 0.1 ? 'good' : clsValue < 0.25 ? 'needs-improvement' : 'poor',
        timestamp: Date.now(),
      });
    });
    clsObserver.observe({ entryTypes: ['layout-shift'] });
  } catch (error) {
    console.error('[Performance] CLS observation failed:', error);
  }
}

// Resource Timing (API calls, assets)
export function measureResourceTiming(): PerformanceResourceTiming[] {
  if (!window.performance?.getEntriesByType) return [];

  return window.performance
    .getEntriesByType('resource')
    .filter((entry) => {
      const resource = entry as PerformanceResourceTiming;
      // Focus on slow resources (>1s)
      return resource.duration > 1000;
    }) as PerformanceResourceTiming[];
}

// Memory Usage (Chrome only)
export function getMemoryUsage(): { used: number; total: number; percentage: number } | null {
  const perf = performance as any;
  
  if (!perf.memory) {
    return null;
  }

  return {
    used: Math.round(perf.memory.usedJSHeapSize / 1048576), // MB
    total: Math.round(perf.memory.totalJSHeapSize / 1048576), // MB
    percentage: Math.round((perf.memory.usedJSHeapSize / perf.memory.totalJSHeapSize) * 100),
  };
}

// Mobile-specific monitoring
export function isMobile(): boolean {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

// Combined monitoring hook
export function startPerformanceMonitoring(
  onMetric?: (metric: PerformanceMetric) => void,
  onLongTask?: (duration: number) => void
): () => void {
  const cleanup: (() => void)[] = [];

  // Web Vitals
  if (onMetric) {
    measureWebVitals(onMetric);
  }

  // Long Tasks (especially important on mobile)
  if (onLongTask || isMobile()) {
    const stopLongTaskMonitoring = detectLongTasks(
      onLongTask || ((duration) => {
        console.warn(`[Performance] Long task on mobile: ${duration.toFixed(2)}ms`);
      })
    );
    cleanup.push(stopLongTaskMonitoring);
  }

  // Memory monitoring (every 30s on mobile)
  if (isMobile()) {
    const memoryInterval = setInterval(() => {
      const memory = getMemoryUsage();
      if (memory && memory.percentage > 80) {
        console.warn(`[Performance] High memory usage on mobile: ${memory.percentage}%`);
      }
    }, 30000);
    
    cleanup.push(() => clearInterval(memoryInterval));
  }

  return () => cleanup.forEach(fn => fn());
}
