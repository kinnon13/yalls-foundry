/**
 * Unit Tests: Spec Compare Utilities
 */

import { describe, it, expect } from 'vitest';
import { parseSpec, comparePaths } from '@/lib/export/specCompare';

describe('parseSpec', () => {
  it('should parse and normalize simple paths', () => {
    const spec = `
src/routes/index.tsx
src/lib/utils.ts
    `;
    
    const result = parseSpec(spec);
    
    expect(result).toEqual([
      'src/lib/utils.ts',
      'src/routes/index.tsx',
    ]);
  });

  it('should trim whitespace from each line', () => {
    const spec = '  src/routes/index.tsx  \n  src/lib/utils.ts  ';
    
    const result = parseSpec(spec);
    
    expect(result).toContain('src/routes/index.tsx');
    expect(result).toContain('src/lib/utils.ts');
  });

  it('should remove blank lines', () => {
    const spec = `
src/routes/index.tsx

src/lib/utils.ts


    `;
    
    const result = parseSpec(spec);
    
    expect(result).toHaveLength(2);
  });

  it('should remove comment lines starting with #', () => {
    const spec = `
# This is a comment
src/routes/index.tsx
# Another comment
src/lib/utils.ts
    `;
    
    const result = parseSpec(spec);
    
    expect(result).toHaveLength(2);
    expect(result).not.toContain('# This is a comment');
  });

  it('should normalize backslashes to forward slashes', () => {
    const spec = 'src\\routes\\index.tsx\nsrc\\lib\\utils.ts';
    
    const result = parseSpec(spec);
    
    expect(result).toContain('src/routes/index.tsx');
    expect(result).toContain('src/lib/utils.ts');
  });

  it('should sort the results', () => {
    const spec = `
zzz/last.ts
aaa/first.ts
mmm/middle.ts
    `;
    
    const result = parseSpec(spec);
    
    expect(result[0]).toBe('aaa/first.ts');
    expect(result[1]).toBe('mmm/middle.ts');
    expect(result[2]).toBe('zzz/last.ts');
  });
});

describe('comparePaths', () => {
  it('should return empty missing and extra when paths match', () => {
    const expected = ['src/routes/index.tsx', 'src/lib/utils.ts'];
    const actual = ['src/routes/index.tsx', 'src/lib/utils.ts'];
    
    const result = comparePaths(expected, actual);
    
    expect(result.missing).toEqual([]);
    expect(result.extra).toEqual([]);
  });

  it('should identify missing paths', () => {
    const expected = ['src/routes/index.tsx', 'src/lib/utils.ts', 'src/lib/missing.ts'];
    const actual = ['src/routes/index.tsx', 'src/lib/utils.ts'];
    
    const result = comparePaths(expected, actual);
    
    expect(result.missing).toEqual(['src/lib/missing.ts']);
    expect(result.extra).toEqual([]);
  });

  it('should identify extra paths', () => {
    const expected = ['src/routes/index.tsx'];
    const actual = ['src/routes/index.tsx', 'src/lib/extra.ts'];
    
    const result = comparePaths(expected, actual);
    
    expect(result.missing).toEqual([]);
    expect(result.extra).toEqual(['src/lib/extra.ts']);
  });

  it('should identify both missing and extra paths', () => {
    const expected = ['src/routes/index.tsx', 'src/lib/missing.ts'];
    const actual = ['src/routes/index.tsx', 'src/lib/extra.ts'];
    
    const result = comparePaths(expected, actual);
    
    expect(result.missing).toEqual(['src/lib/missing.ts']);
    expect(result.extra).toEqual(['src/lib/extra.ts']);
  });

  it('should handle empty expected list', () => {
    const expected: string[] = [];
    const actual = ['src/routes/index.tsx'];
    
    const result = comparePaths(expected, actual);
    
    expect(result.missing).toEqual([]);
    expect(result.extra).toEqual(['src/routes/index.tsx']);
  });

  it('should handle empty actual list', () => {
    const expected = ['src/routes/index.tsx'];
    const actual: string[] = [];
    
    const result = comparePaths(expected, actual);
    
    expect(result.missing).toEqual(['src/routes/index.tsx']);
    expect(result.extra).toEqual([]);
  });
});
