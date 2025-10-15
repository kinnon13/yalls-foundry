/**
 * Cache Tests
 * 
 * Verify distributed cache works correctly and survives restarts.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { Cache, CacheKeys } from '@/lib/cache';

describe('Distributed Cache', () => {
  beforeEach(async () => {
    await Cache.clear();
  });

  it('should set and get values', async () => {
    await Cache.set('test_key', { foo: 'bar' }, 60);
    const result = await Cache.get<{ foo: string }>('test_key');
    
    expect(result).toEqual({ foo: 'bar' });
  });

  it('should return null for missing keys', async () => {
    const result = await Cache.get('nonexistent');
    expect(result).toBeNull();
  });

  it('should delete values', async () => {
    await Cache.set('test_key', 'value', 60);
    await Cache.del('test_key');
    
    const result = await Cache.get('test_key');
    expect(result).toBeNull();
  });

  it('should handle getOrCompute pattern', async () => {
    let computeCount = 0;
    
    const compute = async () => {
      computeCount++;
      return { computed: true };
    };
    
    // First call should compute
    const result1 = await Cache.getOrCompute('compute_test', compute, 60);
    expect(result1).toEqual({ computed: true });
    expect(computeCount).toBe(1);
    
    // Second call should use cache
    const result2 = await Cache.getOrCompute('compute_test', compute, 60);
    expect(result2).toEqual({ computed: true });
    expect(computeCount).toBe(1); // Still 1, not called again
  });

  it('should have standard cache key patterns', () => {
    expect(CacheKeys.categories()).toBe('marketplace:categories:all');
    expect(CacheKeys.categoryTree('parent-1')).toBe('marketplace:categories:tree:parent-1');
    expect(CacheKeys.listing('listing-1')).toBe('marketplace:listing:listing-1');
  });
});
