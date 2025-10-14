/**
 * PII Protection
 * 
 * Utilities for detecting and redacting personally identifiable information.
 * Use before logging or sending to analytics.
 * 
 * Usage:
 *   import { redactPII } from '@/lib/security/pii';
 *   const safe = redactPII({ email: 'user@example.com', name: 'John' });
 */

const PII_PATTERNS = {
  email: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
  phone: /(\+?1[-.\s]?)?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}/g,
  ssn: /\b\d{3}-\d{2}-\d{4}\b/g,
  creditCard: /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g,
  ip: /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g,
};

const PII_KEYS = new Set([
  'email',
  'phone',
  'ssn',
  'password',
  'token',
  'secret',
  'apiKey',
  'creditCard',
  'address',
  'lastName',
]);

/**
 * Redact PII from string
 */
export function redactString(input: string): string {
  let result = input;
  
  for (const [type, pattern] of Object.entries(PII_PATTERNS)) {
    result = result.replace(pattern, `[REDACTED:${type.toUpperCase()}]`);
  }
  
  return result;
}

/**
 * Redact PII from object (recursive)
 */
export function redactPII<T extends Record<string, any>>(obj: T): T {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }

  const result: any = Array.isArray(obj) ? [] : {};

  for (const [key, value] of Object.entries(obj)) {
    if (PII_KEYS.has(key)) {
      result[key] = '[REDACTED]';
    } else if (typeof value === 'string') {
      result[key] = redactString(value);
    } else if (typeof value === 'object' && value !== null) {
      result[key] = redactPII(value);
    } else {
      result[key] = value;
    }
  }

  return result as T;
}

/**
 * Check if string contains PII
 */
export function containsPII(input: string): boolean {
  return Object.values(PII_PATTERNS).some(pattern => pattern.test(input));
}