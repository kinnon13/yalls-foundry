/**
 * Content Security Policy
 * 
 * CSP configuration for preventing XSS and injection attacks.
 * Apply via meta tag or HTTP headers at CDN/reverse proxy.
 * 
 * Usage:
 *   import { generateCSP } from '@/lib/security/csp';
 *   const policy = generateCSP();
 */

import { config } from '@/lib/config';

export interface CSPDirectives {
  [key: string]: string[];
}

/**
 * Generate CSP directives based on environment
 */
export function generateCSP(): string {
  const directives: CSPDirectives = {
    'default-src': ["'self'"],
    'script-src': [
      "'self'",
      ...(config.NODE_ENV === 'development' ? ["'unsafe-inline'", "'unsafe-eval'"] : []),
    ],
    'style-src': ["'self'", "'unsafe-inline'"], // Tailwind requires unsafe-inline
    'img-src': ["'self'", 'data:', 'https:'],
    'font-src': ["'self'", 'data:'],
    'connect-src': ["'self'", config.VITE_SUPABASE_URL],
    'media-src': ["'self'"],
    'object-src': ["'none'"],
    'frame-src': ["'none'"],
    'base-uri': ["'self'"],
    'form-action': ["'self'"],
    'frame-ancestors': ["'none'"],
    'upgrade-insecure-requests': [],
  };

  return Object.entries(directives)
    .map(([key, values]) => `${key} ${values.join(' ')}`)
    .join('; ');
}

/**
 * Nonce generation for inline scripts (future)
 * Use when removing unsafe-inline from script-src
 */
export function generateNonce(): string {
  return Buffer.from(crypto.getRandomValues(new Uint8Array(16))).toString('base64');
}