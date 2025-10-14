/**
 * Spec Comparison Utilities
 * 
 * Compares expected file paths (from spec) against actual paths.
 */

/**
 * Parse spec text into normalized file paths
 */
export function parseSpec(specText: string): string[] {
  return specText
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0 && !line.startsWith('#')) // Remove blanks and comments
    .map(line => line.replace(/\\/g, '/')) // Normalize to forward slashes
    .sort();
}

/**
 * Compare expected paths against actual paths
 */
export function comparePaths(
  expected: string[], 
  actual: string[]
): { missing: string[]; extra: string[] } {
  const expectedSet = new Set(expected);
  const actualSet = new Set(actual);
  
  const missing = expected.filter(path => !actualSet.has(path));
  const extra = actual.filter(path => !expectedSet.has(path));
  
  return { missing, extra };
}
