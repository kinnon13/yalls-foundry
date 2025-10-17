/**
 * Security & Sanitization Utilities
 * 
 * CRITICAL: Always use these functions when rendering user-generated content
 * to prevent XSS attacks and other security vulnerabilities.
 */

/**
 * HTML escape user content to prevent XSS
 * Use this for any user-generated text that will be rendered as HTML
 */
export function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
  };
  
  return text.replace(/[&<>"'/]/g, (char) => map[char] || char);
}

/**
 * Validate URL safety - blocks javascript:, data:, vbscript: schemes
 */
export function isSafeUrl(url: string): boolean {
  if (!url) return false;
  
  const dangerous = /^(javascript|data|vbscript):/i;
  if (dangerous.test(url)) return false;
  
  const safe = /^(https?|mailto|tel):/i;
  const relative = /^[/.]/;
  
  return safe.test(url) || relative.test(url);
}

/**
 * Sanitize URL - returns safe URL or empty string
 */
export function sanitizeUrl(url: string): string {
  return isSafeUrl(url) ? url : '';
}

/**
 * Validate file upload MIME type
 * Blocks SVG by default (XSS risk via embedded scripts)
 */
export function validateUploadMimeType(
  mimeType: string, 
  allowSvg = false
): boolean {
  // Block SVG unless explicitly allowed
  if (!allowSvg && mimeType === 'image/svg+xml') {
    return false;
  }
  
  // Allow safe image types
  const safeImages = [
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/gif',
    'image/webp',
  ];
  
  if (safeImages.includes(mimeType)) {
    return true;
  }
  
  // Allow safe document types
  const safeDocs = [
    'application/pdf',
    'text/plain',
    'text/csv',
  ];
  
  return safeDocs.includes(mimeType);
}

/**
 * Validate file upload size (in bytes)
 * Default max: 10MB
 */
export function validateFileSize(
  sizeBytes: number,
  maxBytes = 10 * 1024 * 1024
): boolean {
  return sizeBytes > 0 && sizeBytes <= maxBytes;
}

/**
 * Comprehensive file upload validation
 */
export interface FileValidationResult {
  valid: boolean;
  error?: string;
}

export function validateFile(
  file: File,
  options: {
    maxSizeBytes?: number;
    allowSvg?: boolean;
    allowedTypes?: string[];
  } = {}
): FileValidationResult {
  const {
    maxSizeBytes = 10 * 1024 * 1024, // 10MB default
    allowSvg = false,
    allowedTypes,
  } = options;
  
  // Check size
  if (!validateFileSize(file.size, maxSizeBytes)) {
    return {
      valid: false,
      error: `File too large. Max size: ${Math.round(maxSizeBytes / 1024 / 1024)}MB`,
    };
  }
  
  // Check MIME type
  if (allowedTypes) {
    if (!allowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: `File type not allowed: ${file.type}`,
      };
    }
  } else if (!validateUploadMimeType(file.type, allowSvg)) {
    return {
      valid: false,
      error: `File type not allowed: ${file.type}`,
    };
  }
  
  return { valid: true };
}

/**
 * Sanitize metadata object - remove sensitive keys
 * and limit size to prevent bloat
 */
export function sanitizeMeta(
  meta?: Record<string, unknown>,
  allowedKeys = ['experiment', 'variant', 'source', 'cta', 'screen', 'viewport']
): Record<string, unknown> | null {
  if (!meta) return null;
  
  const safe: Record<string, unknown> = {};
  for (const key of allowedKeys) {
    if (meta[key] !== undefined) {
      safe[key] = meta[key];
    }
  }
  
  // Limit size to 1KB
  const json = JSON.stringify(safe);
  return json.length > 1024 ? null : safe;
}

/**
 * Rate limit error detection
 */
export function isRateLimitError(error: unknown): boolean {
  if (!error) return false;
  
  const err = error as any;
  return (
    err?.code === '42501' ||
    err?.message?.toLowerCase().includes('rate limit') ||
    err?.status === 429
  );
}

/**
 * Get user-friendly rate limit message
 */
export function getRateLimitMessage(resetAt?: Date): string {
  if (resetAt) {
    const seconds = Math.ceil((resetAt.getTime() - Date.now()) / 1000);
    return `Too many requests. Try again in ${seconds} seconds.`;
  }
  return 'Too many requests. Please try again later.';
}
