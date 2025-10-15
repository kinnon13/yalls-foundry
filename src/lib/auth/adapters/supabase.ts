/**
 * Supabase Auth Adapter
 * 
 * Production authentication using Supabase Auth SDK.
 * Replaces mock adapter with real server-side auth + role fetching.
 */

import { supabase } from '@/integrations/supabase/client';
import type { AuthAdapter } from '../adapter';
import type { Session } from '../types';
import type { Role } from '../rbac';
import { z } from 'zod';

/**
 * Validation schemas
 */
export const emailSchema = z.string().email('Invalid email address');
export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number');

/**
 * Get user's primary role from user_roles table
 */
async function fetchUserRole(userId: string): Promise<Role> {
  try {
    const { data, error } = await supabase.rpc('get_user_role', {
      _user_id: userId,
    });

    if (error) {
      console.error('Failed to fetch user role:', error);
      return 'guest';
    }

    return (data as Role) || 'guest';
  } catch (err) {
    console.error('Role fetch error:', err);
    return 'guest';
  }
}

/**
 * Build session object from Supabase auth session
 */
async function buildSession(authSession: any): Promise<Session> {
  if (!authSession?.user) return null;

  const role = await fetchUserRole(authSession.user.id);

  return {
    userId: authSession.user.id,
    email: authSession.user.email || '',
    role,
  };
}

export const supabaseAuthAdapter: AuthAdapter = {
  async signIn(email: string, role?: Role): Promise<Session> {
    // For testing: use magic link (OTP) sign-in
    const { data, error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
      },
    });

    if (error) throw error;

    // OTP sign-in doesn't return session immediately
    // Session will be established via onAuthStateChange when user clicks link
    return null;
  },

  async signOut(): Promise<void> {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  async getSession(): Promise<Session> {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    if (error) {
      console.error('Failed to get session:', error);
      return null;
    }

    return buildSession(session);
  },

  onAuthStateChange(cb: (s: Session) => void): () => void {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      // Use setTimeout(0) to prevent deadlock per Supabase best practices
      setTimeout(() => {
        buildSession(session).then(cb);
      }, 0);
    });

    return () => {
      subscription.unsubscribe();
    };
  },
};

/**
 * Email/password sign-in (alternative to OTP)
 */
export async function signInWithPassword(
  email: string,
  password: string
): Promise<{ session: Session | null; error: Error | null }> {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) return { session: null, error };

    const session = await buildSession(data.session);
    return { session, error: null };
  } catch (err) {
    return { session: null, error: err as Error };
  }
}

/**
 * Sign up with email/password (validated)
 */
export async function signUpWithPassword(
  email: string,
  password: string
): Promise<{ session: Session | null; error: Error | null }> {
  try {
    // Validate inputs
    emailSchema.parse(email);
    passwordSchema.parse(password);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
      },
    });

    if (error) return { session: null, error };

    // Sign up might not return session if email confirmation required
    const session = data.session ? await buildSession(data.session) : null;
    return { session, error: null };
  } catch (err) {
    if (err instanceof z.ZodError) {
      return { session: null, error: new Error(err.errors[0].message) };
    }
    return { session: null, error: err as Error };
  }
}

/**
 * Enable MFA for current user (stub)
 */
export async function enableMFA(): Promise<{
  success: boolean;
  secret?: string;
  qrUri?: string;
  error?: string;
}> {
  try {
    const { data, error } = await (supabase as any).rpc('enable_mfa');
    if (error) return { success: false, error: error.message };
    return { success: true, ...data };
  } catch (err) {
    return { success: false, error: (err as Error).message };
  }
}

/**
 * Revoke sessions (admin or self)
 */
export async function revokeSessions(
  targetUserId?: string
): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    const { data, error } = await (supabase as any).rpc('revoke_sessions', {
      target_user_id: targetUserId || null,
    });
    if (error) return { success: false, error: error.message };
    return { success: true, message: data.message };
  } catch (err) {
    return { success: false, error: (err as Error).message };
  }
}

/**
 * Check if action requires step-up auth
 */
export async function requiresStepUp(actionName: string): Promise<boolean> {
  try {
    const { data } = await (supabase as any).rpc('requires_step_up', {
      action_name: actionName,
    });
    return data ?? false;
  } catch {
    return false;
  }
}
