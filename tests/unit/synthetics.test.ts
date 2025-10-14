/**
 * Unit Tests: Synthetic Checks
 */

import { describe, it, expect } from 'vitest';
import { runSyntheticChecks } from '@/lib/synthetics/checks';

describe('synthetics', () => {
  it('should run all checks and return results', async () => {
    const results = await runSyntheticChecks();
    
    expect(results).toHaveLength(2);
    expect(results[0].name).toBe('landing_page_load');
    expect(results[1].name).toBe('health_endpoint');
  });

  it('should have ok=true for all checks in Day-0', async () => {
    const results = await runSyntheticChecks();
    
    results.forEach(result => {
      expect(result.ok).toBe(true);
      expect(result.message).toBeDefined();
      expect(result.duration_ms).toBeGreaterThanOrEqual(0);
    });
  });

  it('should measure duration for each check', async () => {
    const results = await runSyntheticChecks();
    
    results.forEach(result => {
      expect(typeof result.duration_ms).toBe('number');
      expect(result.duration_ms).toBeGreaterThanOrEqual(0);
    });
  });
});
