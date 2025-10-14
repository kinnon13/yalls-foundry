/**
 * Hashing Utilities
 * 
 * Cryptographic hashing for data integrity and anonymization.
 * 
 * Usage:
 *   import { hashSHA256, hashEmail } from '@/lib/security/hash';
 *   const hashed = await hashSHA256('sensitive data');
 */

/**
 * SHA-256 hash
 */
export async function hashSHA256(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Hash email for analytics (preserves uniqueness, not reversible)
 */
export async function hashEmail(email: string): Promise<string> {
  return hashSHA256(email.toLowerCase().trim());
}

/**
 * Generate random token
 */
export function generateToken(length = 32): string {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Constant-time string comparison (prevents timing attacks)
 */
export function secureCompare(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }

  return result === 0;
}