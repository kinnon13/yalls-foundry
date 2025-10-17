import { describe, it, expect } from 'vitest';
import {
  escapeHtml,
  isSafeUrl,
  sanitizeUrl,
  validateUploadMimeType,
  validateFileSize,
  validateFile,
  sanitizeMeta,
  isRateLimitError,
  getRateLimitMessage,
} from '@/lib/security/sanitize';

describe('Security Utilities', () => {
  describe('HTML Escaping', () => {
    it('escapes HTML special characters', () => {
      expect(escapeHtml('<script>alert("xss")</script>'))
        .toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;&#x2F;script&gt;');
    });

    it('escapes ampersands', () => {
      expect(escapeHtml('Tom & Jerry')).toBe('Tom &amp; Jerry');
    });

    it('escapes quotes', () => {
      expect(escapeHtml(`He said "hello"`))
        .toBe('He said &quot;hello&quot;');
      expect(escapeHtml(`It's fine`))
        .toBe('It&#x27;s fine');
    });

    it('handles empty string', () => {
      expect(escapeHtml('')).toBe('');
    });
  });

  describe('URL Sanitization', () => {
    it('blocks javascript: URLs', () => {
      expect(isSafeUrl('javascript:alert(1)')).toBe(false);
      expect(isSafeUrl('JavaScript:alert(1)')).toBe(false);
    });

    it('blocks data: URLs', () => {
      expect(isSafeUrl('data:text/html,<script>alert(1)</script>'))
        .toBe(false);
    });

    it('blocks vbscript: URLs', () => {
      expect(isSafeUrl('vbscript:msgbox(1)')).toBe(false);
    });

    it('allows https URLs', () => {
      expect(isSafeUrl('https://example.com')).toBe(true);
    });

    it('allows http URLs', () => {
      expect(isSafeUrl('http://example.com')).toBe(true);
    });

    it('allows mailto URLs', () => {
      expect(isSafeUrl('mailto:test@example.com')).toBe(true);
    });

    it('allows tel URLs', () => {
      expect(isSafeUrl('tel:+1234567890')).toBe(true);
    });

    it('allows relative URLs', () => {
      expect(isSafeUrl('/path/to/page')).toBe(true);
      expect(isSafeUrl('./relative')).toBe(true);
      expect(isSafeUrl('../parent')).toBe(true);
    });

    it('sanitizeUrl returns safe URL or empty', () => {
      expect(sanitizeUrl('https://example.com'))
        .toBe('https://example.com');
      expect(sanitizeUrl('javascript:alert(1)')).toBe('');
    });
  });

  describe('File Upload Validation', () => {
    it('blocks SVG by default', () => {
      expect(validateUploadMimeType('image/svg+xml', false)).toBe(false);
    });

    it('allows SVG when explicitly enabled', () => {
      expect(validateUploadMimeType('image/svg+xml', true)).toBe(true);
    });

    it('allows safe image types', () => {
      expect(validateUploadMimeType('image/jpeg')).toBe(true);
      expect(validateUploadMimeType('image/png')).toBe(true);
      expect(validateUploadMimeType('image/gif')).toBe(true);
      expect(validateUploadMimeType('image/webp')).toBe(true);
    });

    it('allows safe document types', () => {
      expect(validateUploadMimeType('application/pdf')).toBe(true);
      expect(validateUploadMimeType('text/plain')).toBe(true);
      expect(validateUploadMimeType('text/csv')).toBe(true);
    });

    it('blocks unsafe MIME types', () => {
      expect(validateUploadMimeType('text/html')).toBe(false);
      expect(validateUploadMimeType('application/javascript')).toBe(false);
      expect(validateUploadMimeType('application/x-executable')).toBe(false);
    });

    it('validates file size', () => {
      expect(validateFileSize(1024, 2048)).toBe(true);
      expect(validateFileSize(2048, 1024)).toBe(false);
      expect(validateFileSize(0, 1024)).toBe(false);
    });

    it('validates complete file', () => {
      const file = new File(['content'], 'test.png', { type: 'image/png' });
      const result = validateFile(file, { maxSizeBytes: 1024 * 1024 });
      expect(result.valid).toBe(true);
    });

    it('rejects file over size limit', () => {
      const largeContent = new Array(2 * 1024 * 1024).fill('x').join('');
      const file = new File([largeContent], 'large.png', { type: 'image/png' });
      const result = validateFile(file, { maxSizeBytes: 1024 * 1024 });
      expect(result.valid).toBe(false);
      expect(result.error).toContain('too large');
    });

    it('rejects SVG when not allowed', () => {
      const file = new File(['<svg></svg>'], 'test.svg', { type: 'image/svg+xml' });
      const result = validateFile(file, { allowSvg: false });
      expect(result.valid).toBe(false);
      expect(result.error).toContain('not allowed');
    });
  });

  describe('Metadata Sanitization', () => {
    it('keeps allowed keys only', () => {
      const meta = {
        experiment: 'test',
        variant: 'A',
        password: 'secret', // Should be removed
        source: 'home',
      };
      
      const safe = sanitizeMeta(meta);
      expect(safe).toHaveProperty('experiment');
      expect(safe).toHaveProperty('variant');
      expect(safe).toHaveProperty('source');
      expect(safe).not.toHaveProperty('password');
    });

    it('returns null for empty meta', () => {
      expect(sanitizeMeta(undefined)).toBe(null);
      expect(sanitizeMeta({})).toBe(null);
    });

    it('limits size to 1KB', () => {
      const largeMeta = {
        experiment: new Array(2000).fill('x').join(''),
      };
      
      const safe = sanitizeMeta(largeMeta);
      expect(safe).toBe(null);
    });

    it('accepts custom allowed keys', () => {
      const meta = { custom: 'value', other: 'data' };
      const safe = sanitizeMeta(meta, ['custom']);
      
      expect(safe).toHaveProperty('custom');
      expect(safe).not.toHaveProperty('other');
    });
  });

  describe('Rate Limit Error Detection', () => {
    it('detects rate limit error by code', () => {
      const error = { code: '42501', message: 'Rate limit exceeded' };
      expect(isRateLimitError(error)).toBe(true);
    });

    it('detects rate limit error by message', () => {
      const error = { message: 'Rate limit exceeded' };
      expect(isRateLimitError(error)).toBe(true);
    });

    it('detects 429 status', () => {
      const error = { status: 429, message: 'Too Many Requests' };
      expect(isRateLimitError(error)).toBe(true);
    });

    it('returns false for other errors', () => {
      expect(isRateLimitError({ code: 'OTHER' })).toBe(false);
      expect(isRateLimitError(null)).toBe(false);
      expect(isRateLimitError(undefined)).toBe(false);
    });
  });

  describe('Rate Limit Messages', () => {
    it('generates message with reset time', () => {
      const resetAt = new Date(Date.now() + 30000); // 30 seconds
      const msg = getRateLimitMessage(resetAt);
      expect(msg).toContain('30 seconds');
    });

    it('generates generic message without reset time', () => {
      const msg = getRateLimitMessage();
      expect(msg).toContain('Try again later');
    });
  });
});
