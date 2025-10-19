/**
 * Environment utilities
 */

/**
 * Check if demo/mock mode is enabled
 */
export function isDemo(): boolean {
  const params = new URLSearchParams(window.location.search);
  return params.get('demo') === '1' || import.meta.env.VITE_DEMO_MODE === 'true';
}

/**
 * Check if payments are real (not mock)
 */
export function isRealPayments(): boolean {
  return import.meta.env.VITE_ENABLE_STRIPE === '1';
}

/**
 * Get design lock PIN
 */
export function getDesignPIN(): string | null {
  return import.meta.env.VITE_DESIGN_PIN || null;
}

/**
 * Legacy env object export for backward compatibility
 */
export const env = {
  PORTS_MODE: import.meta.env.VITE_PORTS_MODE || 'mock',
  VITE_DEMO_MODE: import.meta.env.VITE_DEMO_MODE,
  VITE_ENABLE_STRIPE: import.meta.env.VITE_ENABLE_STRIPE,
  VITE_DESIGN_PIN: import.meta.env.VITE_DESIGN_PIN,
};
