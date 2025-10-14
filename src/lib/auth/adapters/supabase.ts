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
 * Sign up with email/password
 */
export async function signUpWithPassword(
  email: string,
  password: string
): Promise<{ session: Session | null; error: Error | null }> {
  try {
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
    return { session: null, error: err as Error };
  }
}
