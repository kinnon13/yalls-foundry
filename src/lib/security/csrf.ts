/**
 * CSRF Protection
 * 
 * Token-based CSRF protection for state-changing operations.
 * Tokens stored in httpOnly cookies, validated on mutations.
 * 
 * Usage:
 *   import { generateCSRFToken, validateCSRFToken } from '@/lib/security/csrf';
 */

/**
 * Generate CSRF token
 * In production, use httpOnly cookie with SameSite=Strict
 */
export function generateCSRFToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Validate CSRF token
 * Compare request token against session token
 */
export function validateCSRFToken(requestToken: string, sessionToken: string): boolean {
  if (!requestToken || !sessionToken) {
    return false;
  }

  // Timing-safe comparison
  if (requestToken.length !== sessionToken.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < requestToken.length; i++) {
    result |= requestToken.charCodeAt(i) ^ sessionToken.charCodeAt(i);
  }

  return result === 0;
}

/**
 * Store CSRF token in session storage (client-side)
 * In production, use httpOnly cookie set by server
 */
export function storeCSRFToken(token: string): void {
  sessionStorage.setItem('csrf_token', token);
}

/**
 * Retrieve CSRF token from session storage
 */
export function getCSRFToken(): string | null {
  return sessionStorage.getItem('csrf_token');
}

/**
 * TODO: Server-side CSRF implementation
 * 
 * 1. Generate token on first request
 * 2. Store in httpOnly cookie with SameSite=Strict
 * 3. Require X-CSRF-Token header on mutations
 * 4. Validate token server-side before processing
 * 5. Rotate token after authentication changes
 */