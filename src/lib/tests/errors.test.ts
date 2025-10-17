/**
 * Error Handling Tests (Task 28)
 */

import { describe, it, expect } from 'vitest';
import { normalizeError, getErrorMessage } from '../errors';

describe('normalizeError', () => {
  it('detects rate limit errors', () => {
    const e = new Error('Rate limit exceeded (code 42501)');
    const normalized = normalizeError(e);
    expect(normalized.rateLimited).toBe(true);
    expect(normalized.message).toContain('Rate limit');
  });

  it('detects 429 status code', () => {
    const e = new Error('429 Too Many Requests');
    const normalized = normalizeError(e);
    expect(normalized.rateLimited).toBe(true);
  });

  it('detects network errors', () => {
    const e = new Error('Network request failed');
    const normalized = normalizeError(e);
    expect(normalized.networkError).toBe(true);
  });

  it('detects auth errors', () => {
    const e = new Error('401 Unauthorized');
    const normalized = normalizeError(e);
    expect(normalized.authError).toBe(true);
  });

  it('handles generic errors', () => {
    const e = new Error('Something broke');
    const normalized = normalizeError(e);
    expect(normalized.rateLimited).toBe(false);
    expect(normalized.networkError).toBe(false);
    expect(normalized.authError).toBe(false);
    expect(normalized.message).toBe('Something broke');
  });
});

describe('getErrorMessage', () => {
  it('provides friendly rate limit message', () => {
    const e = new Error('Rate limit exceeded');
    const msg = getErrorMessage(e);
    expect(msg).toContain('Too many requests');
  });

  it('provides friendly network error message', () => {
    const e = new Error('Network timeout');
    const msg = getErrorMessage(e);
    expect(msg).toContain('Connection issue');
  });

  it('provides friendly auth error message', () => {
    const e = new Error('401 Unauthorized');
    const msg = getErrorMessage(e);
    expect(msg).toContain('Authentication required');
  });

  it('falls back to original message for unknown errors', () => {
    const e = new Error('Custom error message');
    const msg = getErrorMessage(e);
    expect(msg).toBe('Custom error message');
  });
});
