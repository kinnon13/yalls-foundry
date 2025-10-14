/**
 * Spec Comparison Utilities
 * 
 * Compares expected file paths (from spec) against actual paths.
 */

/**
 * Parse spec text into normalized file paths
 */
export function parseSpec(text: string): string[] {
  return text
    .split('\n')
    .map(l => l.trim())
    .filter(l => l.length > 0 && !l.startsWith('#'))
    .map(l => l.replace(/\\/g, '/'))
    .sort();
}

/**
 * Compare expected paths against actual paths
 */
export function comparePaths(
  expected: string[],
  actual: string[]
): { missing: string[]; extra: string[] } {
  const e = new Set(expected);
  const a = new Set(actual);
  const missing = expected.filter(p => !a.has(p));
  const extra = actual.filter(p => !e.has(p));
  return { missing, extra };
}

