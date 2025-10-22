/**
 * PII Redaction Patterns
 * Strict redaction for private/guarded modes
 */

/**
 * Extendable patterns for PII detection
 */
const PATTERNS: Array<{ name: string; pattern: RegExp }> = [
  { name: 'SSN', pattern: /\b\d{3}-\d{2}-\d{4}\b/g },
  { name: 'PHONE', pattern: /\b(?:\+?1\s*)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g },
  { name: 'EMAIL', pattern: /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi },
  { name: 'API_KEY', pattern: /\b(?:sk-|rk_|pk_)[A-Za-z0-9]{20,}\b/g },
  { name: 'CREDIT_CARD', pattern: /\b\d{12,19}\b/g },
  { name: 'IP_ADDRESS', pattern: /\b(?:\d{1,3}\.){3}\d{1,3}\b/g },
  { name: 'JWT', pattern: /eyJ[A-Za-z0-9_-]+\.eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g },
];

/**
 * Redact PII from string
 */
export function redact(text: string, customTag: string = 'REDACTED'): string {
  return PATTERNS.reduce((result, { name, pattern }) => {
    return result.replace(pattern, `[${customTag}:${name}]`);
  }, text);
}

/**
 * Redact PII from object (recursive)
 */
export function redactObject<T extends Record<string, any>>(obj: T): T {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }

  const result: any = Array.isArray(obj) ? [] : {};

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      result[key] = redact(value);
    } else if (typeof value === 'object' && value !== null) {
      result[key] = redactObject(value);
    } else {
      result[key] = value;
    }
  }

  return result as T;
}

/**
 * Check if text contains PII
 */
export function containsPII(text: string): boolean {
  return PATTERNS.some(({ pattern }) => {
    const regex = new RegExp(pattern);
    return regex.test(text);
  });
}

/**
 * Sanitize for logging (redact + truncate)
 */
export function sanitizeForLog(text: string, maxLength: number = 500): string {
  const redacted = redact(text);
  return redacted.length > maxLength 
    ? redacted.slice(0, maxLength) + '...[truncated]'
    : redacted;
}
