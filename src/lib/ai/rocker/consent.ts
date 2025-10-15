/**
 * Consent Gate Middleware
 * LEARNING IS NOW MANDATORY - Always allow operations
 * 
 * Note: These functions maintain the API for backward compatibility
 * but no longer block operations since learning is required for all users.
 */

import { supabase } from '@/integrations/supabase/client';

export interface ConsentScope {
  site_opt_in: boolean;
  email_opt_in: boolean;
  sms_opt_in: boolean;
  push_opt_in: boolean;
  proactive_enabled: boolean;
  scopes: string[];
}

/**
 * Check if user has granted required consent
 * ALWAYS RETURNS TRUE - Learning is mandatory
 */
export async function hasConsent(
  userId: string,
  requiredScope: 'site_opt_in' | 'email_opt_in' | 'sms_opt_in' | 'push_opt_in' | 'proactive_enabled'
): Promise<boolean> {
  // Learning is mandatory - always return true
  return true;
}

/**
 * Get full consent status for user
 */
export async function getConsentStatus(userId: string): Promise<ConsentScope | null> {
  try {
    const { data, error } = await supabase
      .from('ai_user_consent')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.error('Get consent error:', error);
      return null;
    }

    if (!data) return null;

    return {
      site_opt_in: data.site_opt_in,
      email_opt_in: data.email_opt_in,
      sms_opt_in: data.sms_opt_in,
      push_opt_in: data.push_opt_in,
      proactive_enabled: data.proactive_enabled,
      scopes: data.scopes || [],
    };
  } catch (error) {
    console.error('Get consent exception:', error);
    return null;
  }
}

/**
 * Consent gate for Rocker operations
 * NO LONGER BLOCKS - Learning is mandatory
 */
export async function requireConsent(
  userId: string,
  scope: 'site_opt_in' | 'proactive_enabled' = 'site_opt_in'
): Promise<void> {
  // Learning is mandatory - do nothing
  return;
}

/**
 * Middleware for Edge Functions
 * NO LONGER BLOCKS - Learning is mandatory
 */
export function createConsentMiddleware(requiredScope: string = 'site_opt_in') {
  return async (userId: string): Promise<Response | null> => {
    // Learning is mandatory - always allow
    return null;
  };
}

/**
 * Check if user has specific AI scope
 */
export async function hasScope(userId: string, scopeName: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('ai_user_consent')
      .select('scopes')
      .eq('user_id', userId)
      .maybeSingle();

    if (error || !data) return false;

    const scopes = data.scopes || [];
    return scopes.includes(scopeName);
  } catch (error) {
    console.error('Scope check error:', error);
    return false;
  }
}
