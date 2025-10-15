/**
 * Consent Gate Middleware
 * Ensures all AI operations respect user consent settings
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
 */
export async function hasConsent(
  userId: string,
  requiredScope: 'site_opt_in' | 'email_opt_in' | 'sms_opt_in' | 'push_opt_in' | 'proactive_enabled'
): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('ai_user_consent')
      .select(requiredScope)
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.error('Consent check error:', error);
      return false;
    }

    // No consent record = no consent
    if (!data) return false;

    return data[requiredScope] === true;
  } catch (error) {
    console.error('Consent check exception:', error);
    return false;
  }
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
 * Throws error if user hasn't consented
 */
export async function requireConsent(
  userId: string,
  scope: 'site_opt_in' | 'proactive_enabled' = 'site_opt_in'
): Promise<void> {
  const hasPermission = await hasConsent(userId, scope);
  
  if (!hasPermission) {
    throw new Error(`User has not opted into ${scope.replace('_', ' ')}`);
  }
}

/**
 * Middleware for Edge Functions
 * Returns 403 response if consent not granted
 */
export function createConsentMiddleware(requiredScope: string = 'site_opt_in') {
  return async (userId: string): Promise<Response | null> => {
    try {
      const { data, error } = await supabase
        .from('ai_user_consent')
        .select(requiredScope)
        .eq('user_id', userId)
        .maybeSingle();

      if (error || !data || !data[requiredScope]) {
        return new Response(
          JSON.stringify({
            error: 'Consent required',
            message: `This feature requires ${requiredScope.replace('_', ' ')} consent`,
            scope: requiredScope,
          }),
          {
            status: 403,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }

      return null; // Allow request
    } catch (error) {
      console.error('Consent middleware error:', error);
      return new Response(
        JSON.stringify({ error: 'Consent check failed' }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
  };
}

/**
 * Check if user has specific AI scope (e.g., 'cross_user_data', 'proactive_suggestions')
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
