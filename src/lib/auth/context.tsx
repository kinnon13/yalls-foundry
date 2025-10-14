/**
 * Auth Context & Provider
 * 
 * React context for managing authentication state across the app.
 */

import { createContext, useContext, useState, useEffect, PropsWithChildren } from 'react';
import type { AuthAdapter } from './adapter';
import type { Session } from './types';
import { mockAuthAdapter } from './adapters/mock';

interface AuthContextValue {
  session: Session;
  loading: boolean;
  signIn: AuthAdapter['signIn'];
  signOut: AuthAdapter['signOut'];
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

interface AuthProviderProps extends PropsWithChildren {
  adapter?: AuthAdapter;
}

export function AuthProvider({ children, adapter = mockAuthAdapter }: AuthProviderProps) {
  const [session, setSession] = useState<Session>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // Subscribe to auth changes
    const unsubscribe = adapter.onAuthStateChange((newSession) => {
      setSession(newSession);
      setLoading(false);
    });
    
    // Load initial session
    adapter.getSession().then((initialSession) => {
      setSession(initialSession);
      setLoading(false);
    });
    
    return unsubscribe;
  }, [adapter]);
  
  const value: AuthContextValue = {
    session,
    loading,
    signIn: adapter.signIn.bind(adapter),
    signOut: adapter.signOut.bind(adapter),
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
