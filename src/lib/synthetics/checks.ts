/**
 * Synthetic Checks
 * 
 * Provides automated health checks for the application.
 * These are mock checks for Day-0; real performance checks will be added later.
 */

import { checkHealth } from '@/api/health';

export interface SyntheticResult {
  name: string;
  ok: boolean;
  message?: string;
  duration_ms?: number;
}

/**
 * Simulate a landing page load check
 * For Day-0, this is a mock that always passes quickly
 */
async function checkLandingPageLoad(): Promise<SyntheticResult> {
  const start = performance.now();
  
  // Simulate a fast page load (< 3000ms threshold)
  await new Promise(resolve => setTimeout(resolve, 100));
  
  const duration = Math.round(performance.now() - start);
  const threshold = 3000;
  
  return {
    name: 'landing_page_load',
    ok: duration < threshold,
    message: `Load time: ${duration}ms (threshold: ${threshold}ms)`,
    duration_ms: duration,
  };
}

/**
 * Check the health endpoint
 */
async function checkHealthEndpoint(): Promise<SyntheticResult> {
  const start = performance.now();
  
  try {
    const result = await checkHealth();
    const duration = Math.round(performance.now() - start);
    
    return {
      name: 'health_endpoint',
      ok: result.ok,
      message: `Health check returned ok=${result.ok}, source=${result.source}`,
      duration_ms: duration,
    };
  } catch (error) {
    const duration = Math.round(performance.now() - start);
    return {
      name: 'health_endpoint',
      ok: false,
      message: `Health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      duration_ms: duration,
    };
  }
}

/**
 * Run all synthetic checks
 */
export async function runSyntheticChecks(): Promise<SyntheticResult[]> {
  const results = await Promise.all([
    checkLandingPageLoad(),
    checkHealthEndpoint(),
  ]);
  
  return results;
}
