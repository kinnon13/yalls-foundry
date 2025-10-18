/**
 * Environment Configuration
 * Type-safe access to env vars
 */

export const env = {
  PORTS_MODE: (import.meta.env?.VITE_PORTS_MODE ?? 'mock') as 'mock' | 'db',
  SUPABASE_URL: import.meta.env?.VITE_SUPABASE_URL ?? '',
  SUPABASE_ANON_KEY: import.meta.env?.VITE_SUPABASE_ANON_KEY ?? '',
  SENTRY_DSN: import.meta.env?.VITE_SENTRY_DSN,
  FEATURE_SCANNER: import.meta.env?.VITE_FEATURE_SCANNER === '1',
  isDev: import.meta.env?.DEV === true,
  isProd: import.meta.env?.PROD === true,
};
