/**
 * Configuration & Environment Validation
 * 
 * Validates all environment variables at app startup using Zod schemas.
 * Exports typed config object and security headers for CDN/reverse proxy.
 * 
 * Usage:
 *   import { config, securityHeaders } from '@/lib/config';
 *   console.log(config.APP_NAME); // "yalls.ai"
 */

import { z } from 'zod';

// Environment schema with strict validation
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  VITE_APP_NAME: z.string().default('yalls.ai'),
  VITE_SITE_URL: z.string().url().optional(),
  
  // Supabase configuration (optional for Day-0, required when using backend features)
  VITE_SUPABASE_URL: z.string().url().optional(),
  VITE_SUPABASE_ANON_KEY: z.string().optional(),
  
  // Optional: Upstash Redis configuration for L2 cache
  VITE_USE_UPSTASH: z.enum(['true', 'false']).transform(v => v === 'true').default('false'),
  VITE_UPSTASH_REDIS_REST_URL: z.string().url().optional(),
  VITE_UPSTASH_REDIS_REST_TOKEN: z.string().optional(),
});

type Env = z.infer<typeof envSchema>;

// Validate and parse environment
function validateEnv(): Env {
  try {
    return envSchema.parse({
      NODE_ENV: import.meta.env.MODE,
      VITE_APP_NAME: import.meta.env.VITE_APP_NAME || 'yalls.ai',
      VITE_SITE_URL: import.meta.env.VITE_SITE_URL,
      VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
      VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY,
      VITE_USE_UPSTASH: import.meta.env.VITE_USE_UPSTASH || 'false',
      VITE_UPSTASH_REDIS_REST_URL: import.meta.env.VITE_UPSTASH_REDIS_REST_URL,
      VITE_UPSTASH_REDIS_REST_TOKEN: import.meta.env.VITE_UPSTASH_REDIS_REST_TOKEN,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('❌ Environment validation failed:', error.flatten().fieldErrors);
      throw new Error('Invalid environment configuration');
    }
    throw error;
  }
}

export const config = validateEnv();

// Security headers for CDN/reverse proxy
// Apply these at your edge (Cloudflare Workers, Vercel Edge, etc.)
export const securityHeaders = {
  // Prevent MIME type sniffing
  'X-Content-Type-Options': 'nosniff',
  
  // Enable browser XSS protection
  'X-XSS-Protection': '1; mode=block',
  
  // Prevent clickjacking
  'X-Frame-Options': 'DENY',
  
  // Referrer policy
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  
  // Permissions policy
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  
  // HSTS (enable in production)
  ...(config.NODE_ENV === 'production' && {
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
  }),
};

// CSP configuration - see /src/lib/security/csp.ts for full implementation
export const cspDirectives = {
  defaultSrc: ["'self'"],
  scriptSrc: ["'self'", "'unsafe-inline'"], // Vite dev requires unsafe-inline
  styleSrc: ["'self'", "'unsafe-inline'"],
  imgSrc: ["'self'", 'data:', 'https:'],
  connectSrc: [
    "'self'",
    ...(config.VITE_SUPABASE_URL ? [config.VITE_SUPABASE_URL] : []),
    "https://*.supabase.co",
    "https://*.supabase.net",
    ...(import.meta.env.DEV ? ["ws:", "wss:", "http:", "http://localhost:*"] : []),
  ],
  fontSrc: ["'self'", 'data:'],
  objectSrc: ["'none'"],
  mediaSrc: ["'self'"],
  frameSrc: ["'none'"],
};