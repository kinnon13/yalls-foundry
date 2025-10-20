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
export function generateCSP(isPreview = false): string {
  const directives: CSPDirectives = {
    'default-src': ["'self'"],
    'script-src': [
      "'self'",
      ...(config.NODE_ENV === 'development' ? ["'unsafe-inline'", "'unsafe-eval'"] : []),
    ],
    'style-src': ["'self'", "'unsafe-inline'"], // Tailwind requires unsafe-inline
    'img-src': ["'self'", 'data:', 'https:'],
    'font-src': ["'self'", 'data:'],
    'connect-src': [
      "'self'",
      ...(config.VITE_SUPABASE_URL ? [
        config.VITE_SUPABASE_URL,
        `${config.VITE_SUPABASE_URL}/functions/v1/*`
      ] : []),
      // Preview routes: restrict external calls
      ...(isPreview ? [] : [])
    ],
    'media-src': ["'self'"],
    'object-src': ["'none'"],
    'frame-src': isPreview ? ["'none'"] : ["'none'"],
    'base-uri': ["'self'"],
    'form-action': isPreview ? ["'none'"] : ["'self'"], // Block form submissions in previews
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
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  const raw = String.fromCharCode(...bytes);
  return btoa(raw).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
}