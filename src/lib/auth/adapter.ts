/**
 * Auth Adapter Interface
 * 
 * Defines the contract for authentication adapters.
 * Implementations can be mock (for testing) or real (Supabase).
 */

import type { Session } from './types';
import type { Role } from './rbac';

export interface AuthAdapter {
  signIn(email: string, role?: Role): Promise<Session>;
  signOut(): Promise<void>;
  getSession(): Promise<Session>;
  onAuthStateChange(cb: (s: Session) => void): () => void;
}
