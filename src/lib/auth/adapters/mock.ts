/**
 * Mock Auth Adapter
 * 
 * In-memory authentication for development and testing.
 * Swap this for Supabase adapter when ready.
 */

import type { AuthAdapter } from '../adapter';
import type { Session, AuthChangeCallback } from '../types';
import type { Role } from '../rbac';

export class MockAuthAdapter implements AuthAdapter {
  private session: Session = null;
  private listeners: Set<AuthChangeCallback> = new Set();
  private storage: Storage | null = null;
  
  constructor() {
    // Try to restore session from localStorage
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        this.storage = window.localStorage;
        const stored = this.storage.getItem('mock_session');
        if (stored) {
          this.session = JSON.parse(stored);
        }
      }
    } catch {
      // Ignore storage errors
    }
  }
  
  async signIn(email: string, role: Role = 'guest'): Promise<Session> {
    const session: Session = {
      userId: `user_${Date.now()}`,
      email,
      role,
    };
    
    this.session = session;
    this.persistSession();
    this.notifyListeners();
    
    return session;
  }
  
  async signOut(): Promise<void> {
    this.session = null;
    this.clearSession();
    this.notifyListeners();
  }
  
  async getSession(): Promise<Session> {
    return this.session;
  }
  
  onAuthStateChange(callback: AuthChangeCallback): () => void {
    this.listeners.add(callback);
    
    // Immediately call with current session
    callback(this.session);
    
    // Return unsubscribe function
    return () => {
      this.listeners.delete(callback);
    };
  }
  
  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.session));
  }
  
  private persistSession(): void {
    if (this.storage && this.session) {
      this.storage.setItem('mock_session', JSON.stringify(this.session));
    }
  }
  
  private clearSession(): void {
    if (this.storage) {
      this.storage.removeItem('mock_session');
    }
  }
}

// Singleton instance
export const mockAuthAdapter = new MockAuthAdapter();
