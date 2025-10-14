/**
 * Mock Auth Adapter
 * 
 * In-memory authentication for development and testing.
 * Swap this for Supabase adapter when ready.
 */

import type { AuthAdapter } from '../adapter';
import type { Session } from '../types';
import type { Role } from '../rbac';

const KEY = 'yallsai_session';
const listeners = new Set<(s: Session) => void>();
const emit = (s: Session) => { for (const l of listeners) l(s); };

const uuid = () =>
  (globalThis.crypto as any)?.randomUUID?.() ?? `user_${Date.now()}`;

export const mockAuthAdapter: AuthAdapter = {
  async signIn(email: string, role: Role = 'guest'): Promise<Session> {
    const s: Session = { userId: uuid(), email, role };
    try { localStorage.setItem(KEY, JSON.stringify(s)); } catch {}
    emit(s);
    return s;
  },
  async signOut(): Promise<void> {
    try { localStorage.removeItem(KEY); } catch {}
    emit(null);
  },
  async getSession(): Promise<Session> {
    try { const raw = localStorage.getItem(KEY); return raw ? (JSON.parse(raw) as Session) : null; }
    catch { return null; }
  },
  onAuthStateChange(cb: (s: Session) => void): () => void {
    listeners.add(cb);
    // Immediately deliver current session to new listener
    try {
      const raw = localStorage.getItem(KEY);
      cb(raw ? (JSON.parse(raw) as Session) : null);
    } catch {
      cb(null);
    }
    return () => { listeners.delete(cb); };
  },
};
