/**
 * Synthetic Monitoring
 * 
 * Basic synthetic checks for critical user journeys.
 * Runs in development; extend for production monitoring.
 * 
 * Usage:
 *   import { runSyntheticChecks } from '@/lib/analytics/synthetic';
 *   await runSyntheticChecks();
 */

import { trackRequest, trackError } from './metrics';

interface SyntheticCheck {
  name: string;
  run: () => Promise<void>;
}

/**
 * Check: Landing page loads
 */
const checkLanding: SyntheticCheck = {
  name: 'landing_page_load',
  async run() {
    const timer = trackRequest('synthetic:landing');
    
    try {
      // Simulate page load metrics
      const startTime = performance.now();
      
      // Wait for DOM ready
      await new Promise<void>(resolve => {
        if (document.readyState === 'complete') {
          resolve();
        } else {
          window.addEventListener('load', () => resolve());
        }
      });
      
      const loadTime = performance.now() - startTime;
      
      if (loadTime > 3000) {
        throw new Error(`Slow landing page load: ${loadTime}ms`);
      }
      
      timer.end();
    } catch (error) {
      trackError('synthetic:landing', error as Error);
      throw error;
    }
  },
};

/**
 * Check: API health endpoint
 */
const checkHealth: SyntheticCheck = {
  name: 'health_endpoint',
  async run() {
    const timer = trackRequest('synthetic:health');
    
    try {
      // In development, this hits local mock
      // In production, would hit edge function
      const response = await fetch('/api/health');
      
      if (!response.ok) {
        throw new Error(`Health check failed: ${response.status}`);
      }
      
      timer.end();
    } catch (error) {
      trackError('synthetic:health', error as Error);
      throw error;
    }
  },
};

/**
 * Run all synthetic checks
 */
export async function runSyntheticChecks(): Promise<{ passed: number; failed: number }> {
  const checks = [checkLanding, checkHealth];
  
  let passed = 0;
  let failed = 0;

  for (const check of checks) {
    try {
      await check.run();
      passed++;
      console.info(`✓ Synthetic check passed: ${check.name}`);
    } catch (error) {
      failed++;
      console.error(`✗ Synthetic check failed: ${check.name}`, error);
    }
  }

  return { passed, failed };
}

/**
 * Run checks on app startup (development only)
 */
if (import.meta.env.DEV) {
  window.addEventListener('load', () => {
    setTimeout(() => {
      runSyntheticChecks().then(results => {
        console.info('[SYNTHETIC]', results);
      });
    }, 1000);
  });
}