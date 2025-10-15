/**
 * Auth Context & Provider
 * 
 * React context for managing authentication state across the app.
 */

import { createContext, useContext, useState, useEffect } from 'react';
import type { Session } from './types';
import type { Role } from './rbac';
import { mockAuthAdapter } from './adapters/mock';
import { supabaseAuthAdapter } from './adapters/supabase';

// ALWAYS use real Supabase Auth (no mocks for production)
const defaultAdapter = supabaseAuthAdapter;

type AuthContextValue = {
  session: Session;
  loading: boolean;
  signIn: (email: string, role?: Role) => Promise<Session>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({
  children,
  adapter = defaultAdapter,
}: {
  children: React.ReactNode;
  adapter?: {
    signIn: (email: string, role?: Role) => Promise<Session>;
    signOut: () => Promise<void>;
    getSession: () => Promise<Session>;
    onAuthStateChange: (cb: (s: Session) => void) => () => void;
  };
}) {
  const [session, setSession] = useState<Session>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = adapter.onAuthStateChange((s) => { setSession(s); setLoading(false); });
    adapter.getSession().then((s) => { setSession(s); setLoading(false); });
    return () => unsub();
  }, [adapter]);

  const value: AuthContextValue = {
    session,
    loading,
    signIn: (email, role) => adapter.signIn(email, role),
    signOut: () => adapter.signOut(),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useSession() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useSession must be used within AuthProvider');
  return ctx;
}

export function useRole() {
  const { session } = useSession();
  return session?.role ?? 'guest';
}
