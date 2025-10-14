/**
 * Synthetic Results Serialization
 * 
 * Converts synthetic check results to flat row format for CSV export.
 */

import type { SyntheticResult } from '@/lib/synthetics/checks';

/**
 * Convert synthetic results to CSV-friendly row format
 */
export function syntheticResultsToRows(
  results: SyntheticResult[], 
  kind = 'synthetic'
): Record<string, any>[] {
  return results.map(result => ({
    kind,
    name: result.name,
    ok: result.ok,
    duration_ms: result.duration_ms ?? null,
    message: result.message ?? '',
  }));
}
