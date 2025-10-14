/**
 * Auth Context & Provider
 * 
 * React context for managing authentication state across the app.
 */

import { createContext, useContext, useState, useEffect } from 'react';
import type { Session } from './types';
import type { Role } from './rbac';
import { mockAuthAdapter } from './adapters/mock';

interface AuthContextValue {
  session: Session;
  loading: boolean;
  signIn: (email: string, role?: Role) => Promise<Session>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

interface AuthProviderProps {
  children: React.ReactNode;
  adapter?: {
    signIn: (email: string, role?: Role) => Promise<Session>;
    signOut: () => Promise<void>;
    getSession: () => Promise<Session>;
    onAuthStateChange: (cb: (s: Session) => void) => () => void;
  };
}

export function AuthProvider({ children, adapter = mockAuthAdapter }: AuthProviderProps) {
  const [session, setSession] = useState<Session>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const unsubscribe = adapter.onAuthStateChange((newSession) => {
      setSession(newSession);
      setLoading(false);
    });
    
    adapter.getSession().then((initialSession) => {
      setSession(initialSession);
      setLoading(false);
    });
    
    return () => unsubscribe();
  }, [adapter]);
  
  const value: AuthContextValue = {
    session,
    loading,
    signIn: (email, role) => adapter.signIn(email, role),
    signOut: () => adapter.signOut(),
  };
  
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Hook to access auth context
 */
export function useSession() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useSession must be used within AuthProvider');
  }
  return context;
}

/**
 * Hook to get current user role
 */
export function useRole() {
  const { session } = useSession();
  return session?.role ?? 'guest';
}
