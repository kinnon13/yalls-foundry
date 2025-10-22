/**
 * Canonical Logout Handler
 * 
 * Single source of truth for logout across entire app.
 * Clears session, storage, and emits telemetry.
 */

import { supabase } from '@/integrations/supabase/client';
import { emitRockerEvent } from '@/lib/ai/rocker/bus';
import { clearUser } from '@/lib/monitoring/sentry';

export async function logout(reason: 'user' | 'expired' | 'server' = 'user'): Promise<void> {
  const startTime = Date.now();
  
  try {
    // Get current user before logout
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id;
    
    // 1. Server-side signOut with scope: 'global' to clear all sessions
    await supabase.auth.signOut({ scope: 'global' });
    
    // 2. Force clear ALL Supabase auth tokens from storage
    const allKeys = Object.keys(localStorage);
    allKeys.forEach(key => {
      // Remove ALL supabase auth keys
      if (key.includes('supabase') || key.includes('auth-token') || key.includes('sb-')) {
        localStorage.removeItem(key);
      }
    });
    
    // 3. Clear sessionStorage completely
    sessionStorage.clear();
    
    // 4. Clear all cookies related to auth
    document.cookie.split(";").forEach((c) => {
      document.cookie = c
        .replace(/^ +/, "")
        .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
    });
    
    // 5. Clear Sentry user context
    clearUser();
    
    // 6. Emit telemetry (non-blocking)
    if (userId) {
      emitRockerEvent('user.view.profile', userId, {
        action: 'logout',
        reason,
        duration_ms: Date.now() - startTime,
      }).catch(() => {}); // Don't block logout on telemetry failure
    }
    
    // 7. Hard redirect to landing page (not auth) to prevent auto-login loop
    window.location.href = '/';
    
  } catch (err) {
    console.error('[Logout] Error during logout:', err);
    // Force clear storage and navigation even on error
    localStorage.clear();
    sessionStorage.clear();
    window.location.href = '/';
  }
}
