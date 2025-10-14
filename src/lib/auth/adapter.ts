/**
 * Auth Adapter Interface
 * 
 * Defines the contract for authentication adapters.
 * Implementations can be mock (for testing) or real (Supabase).
 */

import type { Session, AuthChangeCallback } from './types';
import type { Role } from './rbac';

export interface AuthAdapter {
  /**
   * Sign in a user
   */
  signIn(email: string, role?: Role): Promise<Session>;
  
  /**
   * Sign out the current user
   */
  signOut(): Promise<void>;
  
  /**
   * Get the current session
   */
  getSession(): Promise<Session>;
  
  /**
   * Subscribe to auth state changes
   * Returns unsubscribe function
   */
  onAuthStateChange(callback: AuthChangeCallback): () => void;
}
